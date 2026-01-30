/**
 * SAML 2.0 Authentication Provider
 * Enterprise Single Sign-On with multiple IdP support
 */

import crypto from 'crypto';

export const SAML_BINDINGS = {
  HTTP_POST: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
  HTTP_REDIRECT: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
};

export const SAML_NAME_ID_FORMATS = {
  EMAIL: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  PERSISTENT: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
  TRANSIENT: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
  UNSPECIFIED: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
};

/**
 * SAML Configuration
 */
export class SAMLConfig {
  constructor(options = {}) {
    // Service Provider (SP) settings
    this.entityId = options.entityId || 'https://appforge.com/saml/metadata';
    this.callbackUrl = options.callbackUrl || 'https://appforge.com/saml/acs';
    this.logoutUrl = options.logoutUrl || 'https://appforge.com/saml/logout';
    
    // Identity Provider (IdP) settings
    this.idpEntityId = options.idpEntityId;
    this.idpSsoUrl = options.idpSsoUrl;
    this.idpSloUrl = options.idpSloUrl;
    this.idpCertificate = options.idpCertificate;
    
    // SP certificates
    this.spPrivateKey = options.spPrivateKey;
    this.spCertificate = options.spCertificate;
    
    // Settings
    this.nameIdFormat = options.nameIdFormat || SAML_NAME_ID_FORMATS.EMAIL;
    this.wantAssertionsSigned = options.wantAssertionsSigned !== false;
    this.signRequests = options.signRequests !== false;
    this.encryptAssertions = options.encryptAssertions || false;
    
    // Attribute mapping
    this.attributeMapping = options.attributeMapping || {
      email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
      lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
      displayName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
    };
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];

    if (!this.idpEntityId) errors.push('IdP Entity ID is required');
    if (!this.idpSsoUrl) errors.push('IdP SSO URL is required');
    if (!this.idpCertificate) errors.push('IdP Certificate is required');
    
    if (this.signRequests && !this.spPrivateKey) {
      errors.push('SP Private Key required for signing requests');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * SAML Authentication Provider
 */
export class SAMLAuthProvider {
  constructor(config) {
    this.config = config instanceof SAMLConfig ? config : new SAMLConfig(config);
    this.pendingRequests = new Map();
  }

  /**
   * Generate SAML Authentication Request
   */
  generateAuthRequest(options = {}) {
    const id = this._generateId();
    const issueInstant = new Date().toISOString();
    const forceAuthn = options.forceAuthn || false;
    const isPassive = options.isPassive || false;

    const authRequest = `
<?xml version="1.0"?>
<samlp:AuthnRequest
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="${id}"
  Version="2.0"
  IssueInstant="${issueInstant}"
  Destination="${this.config.idpSsoUrl}"
  AssertionConsumerServiceURL="${this.config.callbackUrl}"
  ProtocolBinding="${SAML_BINDINGS.HTTP_POST}"
  ForceAuthn="${forceAuthn}"
  IsPassive="${isPassive}">
  <saml:Issuer>${this.config.entityId}</saml:Issuer>
  <samlp:NameIDPolicy
    Format="${this.config.nameIdFormat}"
    AllowCreate="true"/>
</samlp:AuthnRequest>`.trim();

    // Store request ID for validation
    this.pendingRequests.set(id, {
      createdAt: Date.now(),
      options,
    });

    return {
      id,
      request: authRequest,
      redirectUrl: this._buildRedirectUrl(authRequest),
    };
  }

  /**
   * Validate SAML Response
   */
  async validateResponse(samlResponse, relayState = null) {
    try {
      // Decode and parse response
      const decodedResponse = Buffer.from(samlResponse, 'base64').toString('utf8');
      const response = this._parseXML(decodedResponse);

      // Validate signature if required
      if (this.config.wantAssertionsSigned) {
        const signatureValid = await this._validateSignature(response);
        if (!signatureValid) {
          throw new Error('Invalid SAML response signature');
        }
      }

      // Extract assertions
      const assertions = this._extractAssertions(response);
      
      if (!assertions || assertions.length === 0) {
        throw new Error('No assertions found in SAML response');
      }

      const assertion = assertions[0];

      // Validate conditions
      this._validateConditions(assertion);

      // Extract user attributes
      const userAttributes = this._extractAttributes(assertion);

      // Extract NameID
      const nameId = this._extractNameId(assertion);

      return {
        valid: true,
        nameId,
        attributes: userAttributes,
        sessionIndex: assertion.sessionIndex,
        issuer: assertion.issuer,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate Logout Request
   */
  generateLogoutRequest(nameId, sessionIndex) {
    const id = this._generateId();
    const issueInstant = new Date().toISOString();

    const logoutRequest = `
<?xml version="1.0"?>
<samlp:LogoutRequest
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="${id}"
  Version="2.0"
  IssueInstant="${issueInstant}"
  Destination="${this.config.idpSloUrl}">
  <saml:Issuer>${this.config.entityId}</saml:Issuer>
  <saml:NameID Format="${this.config.nameIdFormat}">${nameId}</saml:NameID>
  <samlp:SessionIndex>${sessionIndex}</samlp:SessionIndex>
</samlp:LogoutRequest>`.trim();

    return {
      id,
      request: logoutRequest,
      redirectUrl: this._buildRedirectUrl(logoutRequest, this.config.idpSloUrl),
    };
  }

  /**
   * Generate Service Provider Metadata
   */
  generateMetadata() {
    const metadata = `
<?xml version="1.0"?>
<md:EntityDescriptor
  xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
  entityID="${this.config.entityId}">
  <md:SPSSODescriptor
    AuthnRequestsSigned="${this.config.signRequests}"
    WantAssertionsSigned="${this.config.wantAssertionsSigned}"
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    ${this.config.spCertificate ? `
    <md:KeyDescriptor use="signing">
      <ds:KeyInfo>
        <ds:X509Data>
          <ds:X509Certificate>${this._formatCertificate(this.config.spCertificate)}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </md:KeyDescriptor>` : ''}
    <md:NameIDFormat>${this.config.nameIdFormat}</md:NameIDFormat>
    <md:AssertionConsumerService
      Binding="${SAML_BINDINGS.HTTP_POST}"
      Location="${this.config.callbackUrl}"
      index="0"/>
    <md:SingleLogoutService
      Binding="${SAML_BINDINGS.HTTP_REDIRECT}"
      Location="${this.config.logoutUrl}"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`.trim();

    return metadata;
  }

  /**
   * Build redirect URL for SAML request
   */
  _buildRedirectUrl(samlRequest, destination = null) {
    const dest = destination || this.config.idpSsoUrl;
    const encoded = Buffer.from(samlRequest).toString('base64');
    const deflated = this._deflate(encoded);
    
    const params = new URLSearchParams({
      SAMLRequest: deflated,
    });

    if (this.config.signRequests) {
      const signature = this._signRequest(deflated);
      params.append('Signature', signature);
      params.append('SigAlg', 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256');
    }

    return `${dest}?${params.toString()}`;
  }

  /**
   * Validate SAML response signature
   */
  async _validateSignature(response) {
    // Simplified signature validation
    // In production, use a proper SAML library like passport-saml
    if (!this.config.idpCertificate) {
      return false;
    }

    // Extract signature from response
    const signature = response.signature;
    if (!signature) {
      return false;
    }

    try {
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(response.signedData);
      return verify.verify(this.config.idpCertificate, signature, 'base64');
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract assertions from SAML response
   */
  _extractAssertions(response) {
    // Simplified assertion extraction
    // In production, properly parse XML and extract all assertions
    return [{
      issuer: response.issuer,
      subject: response.subject,
      conditions: response.conditions,
      attributes: response.attributes,
      sessionIndex: response.sessionIndex,
    }];
  }

  /**
   * Validate assertion conditions
   */
  _validateConditions(assertion) {
    const conditions = assertion.conditions;
    const now = Date.now();

    // Check NotBefore
    if (conditions.notBefore && new Date(conditions.notBefore).getTime() > now) {
      throw new Error('Assertion not yet valid');
    }

    // Check NotOnOrAfter
    if (conditions.notOnOrAfter && new Date(conditions.notOnOrAfter).getTime() <= now) {
      throw new Error('Assertion expired');
    }

    // Validate audience
    if (conditions.audience && conditions.audience !== this.config.entityId) {
      throw new Error('Invalid assertion audience');
    }
  }

  /**
   * Extract user attributes from assertion
   */
  _extractAttributes(assertion) {
    const attributes = {};
    const rawAttributes = assertion.attributes || {};

    // Map attributes using configured mapping
    for (const [key, samlAttribute] of Object.entries(this.config.attributeMapping)) {
      if (rawAttributes[samlAttribute]) {
        attributes[key] = rawAttributes[samlAttribute];
      }
    }

    return attributes;
  }

  /**
   * Extract NameID from assertion
   */
  _extractNameId(assertion) {
    return assertion.subject?.nameId || null;
  }

  /**
   * Parse XML (simplified)
   */
  _parseXML(xml) {
    // Simplified XML parsing
    // In production, use a proper XML parser like xml2js
    return {
      issuer: this._extractXMLValue(xml, 'saml:Issuer'),
      signature: this._extractXMLValue(xml, 'ds:SignatureValue'),
      subject: {
        nameId: this._extractXMLValue(xml, 'saml:NameID'),
      },
      conditions: {
        notBefore: this._extractXMLAttribute(xml, 'saml:Conditions', 'NotBefore'),
        notOnOrAfter: this._extractXMLAttribute(xml, 'saml:Conditions', 'NotOnOrAfter'),
        audience: this._extractXMLValue(xml, 'saml:Audience'),
      },
      attributes: this._extractAttributes(xml),
      sessionIndex: this._extractXMLValue(xml, 'saml:SessionIndex'),
      signedData: xml,
    };
  }

  /**
   * Extract XML value
   */
  _extractXMLValue(xml, tag) {
    const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Extract XML attribute
   */
  _extractXMLAttribute(xml, tag, attribute) {
    const regex = new RegExp(`<${tag}[^>]*${attribute}="([^"]+)"`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Generate unique ID
   */
  _generateId() {
    return '_' + crypto.randomBytes(21).toString('hex');
  }

  /**
   * Sign SAML request
   */
  _signRequest(data) {
    if (!this.config.spPrivateKey) {
      throw new Error('SP Private Key required for signing');
    }

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    return sign.sign(this.config.spPrivateKey, 'base64');
  }

  /**
   * Deflate data for HTTP-Redirect binding
   */
  _deflate(data) {
    // Simplified deflate - in production use zlib
    return data;
  }

  /**
   * Format certificate for XML
   */
  _formatCertificate(cert) {
    return cert
      .replace(/-----BEGIN CERTIFICATE-----/, '')
      .replace(/-----END CERTIFICATE-----/, '')
      .replace(/\n/g, '');
  }
}

/**
 * Common SAML Identity Provider Configurations
 */
export const SAML_IDP_PRESETS = {
  OKTA: {
    name: 'Okta',
    nameIdFormat: SAML_NAME_ID_FORMATS.EMAIL,
    attributeMapping: {
      email: 'email',
      firstName: 'firstName',
      lastName: 'lastName',
      displayName: 'displayName',
    },
  },
  AZURE_AD: {
    name: 'Azure AD',
    nameIdFormat: SAML_NAME_ID_FORMATS.PERSISTENT,
    attributeMapping: {
      email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
      lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
      displayName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
    },
  },
  ONELOGIN: {
    name: 'OneLogin',
    nameIdFormat: SAML_NAME_ID_FORMATS.EMAIL,
    attributeMapping: {
      email: 'User.email',
      firstName: 'User.FirstName',
      lastName: 'User.LastName',
      displayName: 'User.DisplayName',
    },
  },
  GOOGLE: {
    name: 'Google Workspace',
    nameIdFormat: SAML_NAME_ID_FORMATS.EMAIL,
    attributeMapping: {
      email: 'email',
      firstName: 'first_name',
      lastName: 'last_name',
      displayName: 'name',
    },
  },
};

export default SAMLAuthProvider;
