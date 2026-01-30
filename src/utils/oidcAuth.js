/**
 * OpenID Connect (OIDC) Authentication Provider
 * OAuth 2.0 + Identity layer for modern SSO
 */

import crypto from 'crypto';

export const OIDC_SCOPES = {
  OPENID: 'openid',
  PROFILE: 'profile',
  EMAIL: 'email',
  ADDRESS: 'address',
  PHONE: 'phone',
  OFFLINE_ACCESS: 'offline_access',
};

export const OIDC_RESPONSE_TYPES = {
  CODE: 'code',
  TOKEN: 'token',
  ID_TOKEN: 'id_token',
  CODE_TOKEN: 'code token',
  CODE_ID_TOKEN: 'code id_token',
  TOKEN_ID_TOKEN: 'token id_token',
  CODE_TOKEN_ID_TOKEN: 'code token id_token',
};

export const OIDC_GRANT_TYPES = {
  AUTHORIZATION_CODE: 'authorization_code',
  IMPLICIT: 'implicit',
  REFRESH_TOKEN: 'refresh_token',
  CLIENT_CREDENTIALS: 'client_credentials',
  PASSWORD: 'password',
};

/**
 * OIDC Configuration
 */
export class OIDCConfig {
  constructor(options = {}) {
    // Client configuration
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.redirectUri = options.redirectUri || 'https://appforge.com/auth/callback';
    
    // Provider endpoints
    this.issuer = options.issuer;
    this.authorizationEndpoint = options.authorizationEndpoint;
    this.tokenEndpoint = options.tokenEndpoint;
    this.userinfoEndpoint = options.userinfoEndpoint;
    this.jwksUri = options.jwksUri;
    this.endSessionEndpoint = options.endSessionEndpoint;
    
    // Settings
    this.responseType = options.responseType || OIDC_RESPONSE_TYPES.CODE;
    this.scope = options.scope || [OIDC_SCOPES.OPENID, OIDC_SCOPES.PROFILE, OIDC_SCOPES.EMAIL];
    this.usePKCE = options.usePKCE !== false; // PKCE enabled by default
    this.responseMode = options.responseMode || 'query';
    
    // Token settings
    this.clockTolerance = options.clockTolerance || 60; // seconds
    this.maxAge = options.maxAge; // max authentication age
    
    // Discovery
    this.discoveryUrl = options.discoveryUrl;
    this.metadata = null;
  }

  /**
   * Discover OIDC configuration from well-known endpoint
   */
  async discover() {
    if (!this.discoveryUrl && !this.issuer) {
      throw new Error('Either discoveryUrl or issuer is required');
    }

    const url = this.discoveryUrl || `${this.issuer}/.well-known/openid-configuration`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Discovery failed: ${response.statusText}`);
      }

      this.metadata = await response.json();

      // Update endpoints from discovery
      this.authorizationEndpoint = this.metadata.authorization_endpoint;
      this.tokenEndpoint = this.metadata.token_endpoint;
      this.userinfoEndpoint = this.metadata.userinfo_endpoint;
      this.jwksUri = this.metadata.jwks_uri;
      this.endSessionEndpoint = this.metadata.end_session_endpoint;

      return this.metadata;
    } catch (error) {
      throw new Error(`OIDC discovery failed: ${error.message}`);
    }
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];

    if (!this.clientId) errors.push('Client ID is required');
    if (!this.redirectUri) errors.push('Redirect URI is required');
    
    if (!this.authorizationEndpoint) {
      errors.push('Authorization endpoint is required (run discover() or set manually)');
    }
    if (!this.tokenEndpoint) {
      errors.push('Token endpoint is required (run discover() or set manually)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * OIDC Authentication Provider
 */
export class OIDCAuthProvider {
  constructor(config) {
    this.config = config instanceof OIDCConfig ? config : new OIDCConfig(config);
    this.pkceVerifiers = new Map();
    this.nonces = new Map();
  }

  /**
   * Initialize provider (auto-discover if needed)
   */
  async initialize() {
    if (!this.config.authorizationEndpoint && (this.config.discoveryUrl || this.config.issuer)) {
      await this.config.discover();
    }

    const validation = this.config.validate();
    if (!validation.valid) {
      throw new Error(`Invalid OIDC configuration: ${validation.errors.join(', ')}`);
    }

    return this;
  }

  /**
   * Generate authorization URL
   */
  async getAuthorizationUrl(options = {}) {
    const state = options.state || this._generateRandomString(32);
    const nonce = this._generateRandomString(32);
    
    // Store nonce for validation
    this.nonces.set(state, nonce);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: this.config.responseType,
      scope: Array.isArray(this.config.scope) ? this.config.scope.join(' ') : this.config.scope,
      state,
      nonce,
    });

    // Add PKCE parameters if enabled
    if (this.config.usePKCE) {
      const { codeVerifier, codeChallenge } = await this._generatePKCE();
      this.pkceVerifiers.set(state, codeVerifier);
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', 'S256');
    }

    // Add optional parameters
    if (options.prompt) params.append('prompt', options.prompt);
    if (options.loginHint) params.append('login_hint', options.loginHint);
    if (options.acrValues) params.append('acr_values', options.acrValues);
    if (this.config.maxAge) params.append('max_age', this.config.maxAge);

    return `${this.config.authorizationEndpoint}?${params.toString()}`;
  }

  /**
   * Handle authorization callback
   */
  async handleCallback(callbackParams) {
    const { code, state, error, error_description } = callbackParams;

    // Check for error response
    if (error) {
      throw new Error(`OIDC Error: ${error} - ${error_description || 'Unknown error'}`);
    }

    if (!code) {
      throw new Error('Authorization code not found in callback');
    }

    if (!state) {
      throw new Error('State parameter not found in callback');
    }

    // Exchange code for tokens
    const tokens = await this.exchangeCode(code, state);

    // Validate ID token
    const idToken = await this.validateIdToken(tokens.id_token, state);

    // Get user info
    const userInfo = await this.getUserInfo(tokens.access_token);

    return {
      tokens,
      idToken,
      userInfo,
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code, state) {
    const params = new URLSearchParams({
      grant_type: OIDC_GRANT_TYPES.AUTHORIZATION_CODE,
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
    });

    // Add client secret if available
    if (this.config.clientSecret) {
      params.append('client_secret', this.config.clientSecret);
    }

    // Add PKCE verifier if used
    if (this.config.usePKCE) {
      const codeVerifier = this.pkceVerifiers.get(state);
      if (!codeVerifier) {
        throw new Error('PKCE code verifier not found');
      }
      params.append('code_verifier', codeVerifier);
      this.pkceVerifiers.delete(state);
    }

    try {
      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
      }

      const tokens = await response.json();
      return tokens;
    } catch (error) {
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    const params = new URLSearchParams({
      grant_type: OIDC_GRANT_TYPES.REFRESH_TOKEN,
      refresh_token: refreshToken,
      client_id: this.config.clientId,
    });

    if (this.config.clientSecret) {
      params.append('client_secret', this.config.clientSecret);
    }

    try {
      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Validate ID token
   */
  async validateIdToken(idToken, state) {
    try {
      // Decode JWT (simplified - use a proper JWT library in production)
      const [header, payload, signature] = idToken.split('.');
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());

      // Validate issuer
      if (decodedPayload.iss !== this.config.issuer) {
        throw new Error('Invalid token issuer');
      }

      // Validate audience
      if (decodedPayload.aud !== this.config.clientId) {
        throw new Error('Invalid token audience');
      }

      // Validate expiration
      const now = Math.floor(Date.now() / 1000);
      if (decodedPayload.exp < now - this.config.clockTolerance) {
        throw new Error('Token expired');
      }

      // Validate not before
      if (decodedPayload.nbf && decodedPayload.nbf > now + this.config.clockTolerance) {
        throw new Error('Token not yet valid');
      }

      // Validate nonce
      const expectedNonce = this.nonces.get(state);
      if (expectedNonce && decodedPayload.nonce !== expectedNonce) {
        throw new Error('Invalid nonce');
      }
      this.nonces.delete(state);

      // Validate max_age if specified
      if (this.config.maxAge && decodedPayload.auth_time) {
        const authAge = now - decodedPayload.auth_time;
        if (authAge > this.config.maxAge) {
          throw new Error('Authentication too old');
        }
      }

      // TODO: Validate signature using JWKS
      // In production, use a proper JWT library like jsonwebtoken

      return decodedPayload;
    } catch (error) {
      throw new Error(`ID token validation failed: ${error.message}`);
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(accessToken) {
    if (!this.config.userinfoEndpoint) {
      return null;
    }

    try {
      const response = await fetch(this.config.userinfoEndpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('UserInfo request failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  /**
   * Generate logout URL
   */
  getLogoutUrl(idToken, options = {}) {
    if (!this.config.endSessionEndpoint) {
      return null;
    }

    const params = new URLSearchParams({
      id_token_hint: idToken,
      post_logout_redirect_uri: options.postLogoutRedirectUri || this.config.redirectUri,
    });

    if (options.state) {
      params.append('state', options.state);
    }

    return `${this.config.endSessionEndpoint}?${params.toString()}`;
  }

  /**
   * Generate PKCE challenge and verifier
   */
  async _generatePKCE() {
    const codeVerifier = this._generateRandomString(128);
    const codeChallenge = await this._generateCodeChallenge(codeVerifier);

    return {
      codeVerifier,
      codeChallenge,
    };
  }

  /**
   * Generate code challenge from verifier
   */
  async _generateCodeChallenge(verifier) {
    const hash = crypto.createHash('sha256');
    hash.update(verifier);
    return hash.digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate random string
   */
  _generateRandomString(length) {
    return crypto.randomBytes(length).toString('base64url').substring(0, length);
  }
}

/**
 * Common OIDC Provider Presets
 */
export const OIDC_PROVIDER_PRESETS = {
  GOOGLE: {
    name: 'Google',
    issuer: 'https://accounts.google.com',
    discoveryUrl: 'https://accounts.google.com/.well-known/openid-configuration',
    scope: [OIDC_SCOPES.OPENID, OIDC_SCOPES.PROFILE, OIDC_SCOPES.EMAIL],
  },
  MICROSOFT: {
    name: 'Microsoft',
    issuer: 'https://login.microsoftonline.com/common/v2.0',
    discoveryUrl: 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
    scope: [OIDC_SCOPES.OPENID, OIDC_SCOPES.PROFILE, OIDC_SCOPES.EMAIL],
  },
  OKTA: {
    name: 'Okta',
    // issuer and discoveryUrl must be set based on Okta domain
    scope: [OIDC_SCOPES.OPENID, OIDC_SCOPES.PROFILE, OIDC_SCOPES.EMAIL],
  },
  AUTH0: {
    name: 'Auth0',
    // issuer and discoveryUrl must be set based on Auth0 domain
    scope: [OIDC_SCOPES.OPENID, OIDC_SCOPES.PROFILE, OIDC_SCOPES.EMAIL],
  },
  KEYCLOAK: {
    name: 'Keycloak',
    // issuer and discoveryUrl must be set based on Keycloak installation
    scope: [OIDC_SCOPES.OPENID, OIDC_SCOPES.PROFILE, OIDC_SCOPES.EMAIL],
  },
};

export default OIDCAuthProvider;
