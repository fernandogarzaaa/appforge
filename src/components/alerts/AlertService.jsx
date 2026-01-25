import { base44 } from '@/api/base44Client';

export async function checkAndTriggerAlerts(source) {
  /**
   * Checks alert configurations and triggers notifications
   * source can be: { type: 'insight'|'prediction'|'rule', data: {...} }
   */
  
  try {
    const alertConfigs = await base44.entities.AlertConfiguration.list();
    const now = new Date();

    for (const config of alertConfigs) {
      if (!config.enabled) continue;

      // Check cooldown
      if (config.last_alert_time) {
        const lastAlertTime = new Date(config.last_alert_time);
        const minutesSinceLastAlert = (now - lastAlertTime) / (1000 * 60);
        if (minutesSinceLastAlert < config.cooldown_minutes) {
          continue;
        }
      }

      // Check severity threshold
      if (shouldTriggerAlert(config, source)) {
        await triggerAlert(config, source);
        
        // Update config with new alert time
        await base44.entities.AlertConfiguration.update(config.id, {
          last_alert_time: now.toISOString(),
          alert_count: (config.alert_count || 0) + 1
        });
      }
    }
  } catch (error) {
    console.error('Error checking alerts:', error);
  }
}

function shouldTriggerAlert(config, source) {
  // Check prediction type filter
  if (config.prediction_type !== 'all' && source.type === 'prediction') {
    if (source.data.prediction_type !== config.prediction_type) {
      return false;
    }
  }

  // Check severity threshold
  const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
  const sourceSeverity = severityOrder[source.data.severity || 'medium'] || 2;
  const configSeverity = severityOrder[config.severity_threshold];
  if (sourceSeverity < configSeverity) {
    return false;
  }

  // Check anomaly risk threshold
  if (source.data.anomaly_risk && source.data.anomaly_risk < config.anomaly_risk_threshold) {
    return false;
  }

  // Check confidence threshold
  if (source.data.confidence_score && source.data.confidence_score < config.confidence_threshold) {
    return false;
  }

  return true;
}

async function triggerAlert(config, source) {
  const alertData = {
    alert_config_id: config.id,
    source_type: source.type,
    source_id: source.data.id,
    anomaly_type: source.data.prediction_type || 'anomaly',
    severity: source.data.severity || 'medium',
    anomaly_risk_score: source.data.anomaly_risk || 0,
    confidence_score: source.data.confidence_score || 0,
    anomaly_details: {
      title: source.data.title,
      description: source.data.description,
      expected_value: source.data.expected_value,
      actual_value: source.data.actual_value
    },
    recipients_notified: config.recipient_emails || [],
    channels_used: config.alert_channels,
    notification_status: 'pending'
  };

  // Create alert record
  const alert = await base44.entities.AnomalyAlert.create(alertData);

  // Send notifications
  const results = {
    email: false,
    webhook: false,
    in_app: true // in_app is automatic
  };

  if (config.alert_channels.includes('email') && config.recipient_emails?.length > 0) {
    results.email = await sendEmailAlert(config, source, alert);
  }

  if (config.alert_channels.includes('webhook') && config.webhook_url) {
    results.webhook = await sendWebhookAlert(config, source, alert);
  }

  // Update alert status
  const notificationStatus = results.email || results.webhook ? 'sent' : 'pending';
  await base44.entities.AnomalyAlert.update(alert.id, {
    notification_status: notificationStatus
  });

  return alert;
}

async function sendEmailAlert(config, source, alert) {
  try {
    const emailBody = formatAlertEmail(config, source, alert);
    
    for (const email of config.recipient_emails) {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `🚨 Anomaly Detected: ${source.data.title}`,
        body: emailBody
      });
    }
    return true;
  } catch (error) {
    console.error('Email alert failed:', error);
    return false;
  }
}

async function sendWebhookAlert(config, source, alert) {
  try {
    const payload = {
      alert_id: alert.id,
      timestamp: new Date().toISOString(),
      severity: source.data.severity,
      source_type: source.type,
      anomaly_type: source.data.prediction_type,
      title: source.data.title,
      description: source.data.description,
      risk_score: source.data.anomaly_risk,
      confidence: source.data.confidence_score,
      anomaly_details: alert.anomaly_details
    };

    const response = await fetch(config.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.webhook_auth_header && { 'Authorization': config.webhook_auth_header })
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Webhook alert failed:', error);
    return false;
  }
}

function formatAlertEmail(config, source, alert) {
  const severity = source.data.severity?.toUpperCase() || 'MEDIUM';
  const riskScore = source.data.anomaly_risk || 0;
  const confidence = source.data.confidence_score || 0;

  return `
ANOMALY DETECTION ALERT
=======================

SEVERITY: ${severity}
TIME: ${new Date().toISOString()}
ALERT ID: ${alert.id}

DETAILS:
--------
Title: ${source.data.title}
Description: ${source.data.description}
Type: ${source.data.prediction_type || 'Anomaly'}

METRICS:
--------
Risk Score: ${riskScore.toFixed(1)}%
ML Confidence: ${confidence.toFixed(1)}%
${source.data.expected_value ? `Expected Value: ${source.data.expected_value}` : ''}
${source.data.actual_value ? `Actual Value: ${source.data.actual_value}` : ''}

RECOMMENDED ACTIONS:
- Review the monitoring dashboard
- Investigate the root cause
- Acknowledge the alert once reviewed

Alert Configuration: ${config.name}
  `.trim();
}