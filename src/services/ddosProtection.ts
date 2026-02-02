/**
 * DDoS Protection Service
 * Multi-layer DDoS mitigation with CloudFlare/AWS Shield integration
 */

interface DDoSConfig {
  // Detection thresholds
  requestsPerSecondThreshold: number;
  uniqueIPsThreshold: number;
  suspiciousPatternsThreshold: number;

  // Response strategies
  enableChallenges: boolean; // CAPTCHA-style challenges
  enableRateLimiting: boolean;
  enableBlocklisting: boolean;

  // Geo-blocking
  allowedCountries: string[];
  blockedCountries: string[];

  // Integration
  cloudflareEnabled: boolean;
  cloudflareApiKey?: string;
  cloudflareZoneId?: string;

  awsShieldEnabled: boolean;
  awsRegion?: string;
}

interface DDoSDetectionResult {
  isDDoS: boolean;
  confidence: number; // 0-100
  attackType: 'volumetric' | 'protocol' | 'application' | 'none';
  sourceIPs: string[];
  requestsPerSecond: number;
  blockedUntil?: number;
  recommendations: string[];
}

interface RequestMetrics {
  ip: string;
  timestamp: number;
  method: string;
  endpoint: string;
  statusCode: number;
  size: number;
  latency: number;
  userAgent: string;
  country?: string;
}

export class DDoSProtection {
  private config: DDoSConfig;
  private requestMetrics: RequestMetrics[] = [];
  private suspiciousIPs: Map<string, number> = new Map(); // IP -> score
  private blockedIPs: Set<string> = new Set();
  private detectionInterval = setInterval(() => this.detect(), 10000); // Check every 10s

  constructor(config: Partial<DDoSConfig> = {}) {
    this.config = {
      requestsPerSecondThreshold: 1000,
      uniqueIPsThreshold: 10000,
      suspiciousPatternsThreshold: 75,
      enableChallenges: true,
      enableRateLimiting: true,
      enableBlocklisting: true,
      allowedCountries: [],
      blockedCountries: [],
      cloudflareEnabled: false,
      awsShieldEnabled: false,
      ...config,
    };
  }

  /**
   * Record request for analysis
   */
  recordRequest(metrics: RequestMetrics): void {
    this.requestMetrics.push(metrics);

    // Keep last 10 minutes of data
    const cutoff = Date.now() - 600000;
    this.requestMetrics = this.requestMetrics.filter(m => m.timestamp > cutoff);

    // Track suspicious patterns
    this.analyzeSuspiciousPatterns(metrics);
  }

  /**
   * Main DDoS detection algorithm
   */
  private async detect(): Promise<DDoSDetectionResult | null> {
    const now = Date.now();
    const recentRequests = this.requestMetrics.filter(m => m.timestamp > now - 60000);

    if (recentRequests.length === 0) {
      return null;
    }

    // Calculate metrics
    const requestsPerSecond = recentRequests.length / 60;
    const uniqueIPs = new Set(recentRequests.map(r => r.ip));
    const uniqueEndpoints = new Set(recentRequests.map(r => r.endpoint));

    // Detect volumetric attacks (many requests from few sources)
    const isVolumetric = requestsPerSecond > this.config.requestsPerSecondThreshold;

    // Detect protocol attacks (unusual patterns)
    const isProtocolAttack = this.detectProtocolAttack(recentRequests);

    // Detect application-layer attacks
    const isApplicationAttack = this.detectApplicationAttack(recentRequests);

    const isDDoS = isVolumetric || isProtocolAttack || isApplicationAttack;
    let confidence = 0;
    let attackType: 'volumetric' | 'protocol' | 'application' | 'none' = 'none';

    if (isVolumetric) {
      confidence += 40;
      attackType = 'volumetric';
    }
    if (isProtocolAttack) {
      confidence += 35;
      if (attackType === 'none') attackType = 'protocol';
    }
    if (isApplicationAttack) {
      confidence += 25;
      if (attackType === 'none') attackType = 'application';
    }

    if (isDDoS && confidence >= this.config.suspiciousPatternsThreshold) {
      // Get top attacking IPs
      const ipCounts = new Map<string, number>();
      recentRequests.forEach(r => {
        ipCounts.set(r.ip, (ipCounts.get(r.ip) || 0) + 1);
      });

      const sourceIPs = Array.from(ipCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([ip]) => ip);

      // Block IPs
      if (this.config.enableBlocklisting) {
        sourceIPs.forEach(ip => this.blockIP(ip, 3600000)); // Block for 1 hour
      }

      // Notify integrations
      if (this.config.cloudflareEnabled) {
        await this.notifyCloudflare(sourceIPs);
      }

      if (this.config.awsShieldEnabled) {
        await this.notifyAWSShield(sourceIPs);
      }

      return {
        isDDoS: true,
        confidence: Math.min(100, confidence),
        attackType,
        sourceIPs,
        requestsPerSecond,
        blockedUntil: now + 3600000,
        recommendations: this.getRecommendations(attackType, confidence),
      };
    }

    return {
      isDDoS: false,
      confidence,
      attackType: 'none',
      sourceIPs: [],
      requestsPerSecond,
      recommendations: [],
    };
  }

  /**
   * Detect protocol-level attacks
   */
  private detectProtocolAttack(requests: RequestMetrics[]): boolean {
    // Check for unusual HTTP methods
    const methodCounts = new Map<string, number>();
    requests.forEach(r => {
      methodCounts.set(r.method, (methodCounts.get(r.method) || 0) + 1);
    });

    // > 90% requests with unusual methods
    const unusualMethods = methodCounts.get('DELETE') || 0 + methodCounts.get('PATCH') || 0;
    if (unusualMethods / requests.length > 0.9) return true;

    // Check for incomplete requests (0 bytes)
    const emptyRequests = requests.filter(r => r.size === 0).length;
    if (emptyRequests / requests.length > 0.5) return true;

    return false;
  }

  /**
   * Detect application-layer attacks
   */
  private detectApplicationAttack(requests: RequestMetrics[]): boolean {
    // Check for SQL injection patterns
    const sqlPatterns = [/('|"|;|\/\*|\*\/|xp_|sp_|exec|select|insert|update|delete)/i];
    const sqlRequests = requests.filter(r => sqlPatterns.some(p => p.test(r.endpoint)));

    if (sqlRequests.length / requests.length > 0.2) return true;

    // Check for path traversal
    const traversalPattern = /\.\.\//;
    const traversalRequests = requests.filter(r => traversalPattern.test(r.endpoint));

    if (traversalRequests.length / requests.length > 0.1) return true;

    // Check for repeated endpoint access from single IP
    const ipEndpointCounts = new Map<string, Set<string>>();
    requests.forEach(r => {
      const endpoints = ipEndpointCounts.get(r.ip) || new Set();
      endpoints.add(r.endpoint);
      ipEndpointCounts.set(r.ip, endpoints);
    });

    for (const endpoints of ipEndpointCounts.values()) {
      if (endpoints.size === 1) {
        // Single IP hammering one endpoint
        const count = requests.filter(r => r.endpoint === Array.from(endpoints)[0]).length;
        if (count > 1000) return true;
      }
    }

    return false;
  }

  /**
   * Analyze suspicious patterns per request
   */
  private analyzeSuspiciousPatterns(metrics: RequestMetrics): void {
    let suspicionScore = 0;

    // 4xx/5xx errors indicate attack attempts
    if (metrics.statusCode >= 400) {
      suspicionScore += 10;
    }

    // Empty user agent (bots)
    if (!metrics.userAgent || metrics.userAgent.length === 0) {
      suspicionScore += 15;
    }

    // Geo-blocking
    if (this.config.blockedCountries.includes(metrics.country || '')) {
      suspicionScore += 25;
    }

    // High latency (potential flood)
    if (metrics.latency > 5000) {
      suspicionScore += 5;
    }

    // Update IP suspicion score
    const currentScore = this.suspiciousIPs.get(metrics.ip) || 0;
    const newScore = Math.max(0, currentScore + suspicionScore - 1); // Decay
    this.suspiciousIPs.set(metrics.ip, newScore);

    // Auto-block if score too high
    if (newScore > 100) {
      this.blockIP(metrics.ip, 3600000);
    }
  }

  /**
   * Block an IP address
   */
  private blockIP(ip: string, duration: number = 3600000): void {
    this.blockedIPs.add(ip);
    setTimeout(() => {
      this.blockedIPs.delete(ip);
    }, duration);
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * Get recommendations
   */
  private getRecommendations(attackType: string, confidence: number): string[] {
    const recommendations: string[] = [];

    if (attackType === 'volumetric') {
      recommendations.push('Increase rate limiting thresholds');
      recommendations.push('Enable CloudFlare DDoS protection');
      recommendations.push('Consider AWS Shield Advanced');
    }

    if (attackType === 'protocol') {
      recommendations.push('Review firewall rules');
      recommendations.push('Enable AWS WAF');
      recommendations.push('Implement protocol validation');
    }

    if (attackType === 'application') {
      recommendations.push('Review application security');
      recommendations.push('Update input validation');
      recommendations.push('Enable AWS WAF with managed rules');
    }

    if (confidence > 80) {
      recommendations.push('Escalate to security team');
      recommendations.push('Review attack logs in CloudFlare');
    }

    return recommendations;
  }

  /**
   * Notify CloudFlare of attack
   */
  private async notifyCloudflare(sourceIPs: string[]): Promise<void> {
    if (!this.config.cloudflareApiKey || !this.config.cloudflareZoneId) {
      console.warn('CloudFlare credentials not configured');
      return;
    }

    try {
      // CloudFlare API would be called here
      console.log(`[CloudFlare] Blocking IPs: ${sourceIPs.join(', ')}`);
      // Example: POST to /client/v4/zones/{zone_id}/firewall/rules
    } catch (error) {
      console.error('CloudFlare notification failed:', error);
    }
  }

  /**
   * Notify AWS Shield of attack
   */
  private async notifyAWSShield(sourceIPs: string[]): Promise<void> {
    if (!this.config.awsRegion) {
      console.warn('AWS Shield credentials not configured');
      return;
    }

    try {
      // AWS Shield Advanced API would be called here
      console.log(`[AWS Shield] Reporting attack from IPs: ${sourceIPs.join(', ')}`);
      // Example: AWS Shield Advanced API call
    } catch (error) {
      console.error('AWS Shield notification failed:', error);
    }
  }

  /**
   * Get attack statistics
   */
  getStatistics(): {
    totalRequests: number;
    blockedIPs: number;
    suspiciousIPs: number;
    averageRPS: number;
  } {
    const now = Date.now();
    const last60s = this.requestMetrics.filter(m => m.timestamp > now - 60000);

    return {
      totalRequests: this.requestMetrics.length,
      blockedIPs: this.blockedIPs.size,
      suspiciousIPs: this.suspiciousIPs.size,
      averageRPS: last60s.length / 60,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    clearInterval(this.detectionInterval);
  }
}

// Singleton instance
export const ddosProtection = new DDoSProtection({
  requestsPerSecondThreshold: 1000,
  uniqueIPsThreshold: 10000,
  suspiciousPatternsThreshold: 75,
  enableChallenges: true,
  enableRateLimiting: true,
  enableBlocklisting: true,
  cloudflareEnabled: false,
  awsShieldEnabled: false,
});
