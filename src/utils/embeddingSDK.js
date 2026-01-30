/**
 * App Embedding SDK
 * Allows embedding AppForge apps in external websites with iframe and postMessage API
 */

export class AppForgeEmbedSDK {
  constructor(config) {
    this.config = {
      container: config.container,
      appId: config.appId,
      baseUrl: config.baseUrl || 'https://app.appforge.com',
      auth: config.auth || {},
      theme: config.theme || {},
      features: config.features || {},
      onReady: config.onReady || (() => {}),
      onError: config.onError || (() => {}),
      onMessage: config.onMessage || (() => {}),
    };

    this.iframe = null;
    this.isReady = false;
    this.messageQueue = [];
  }

  /**
   * Initialize and embed the app
   */
  async embed() {
    try {
      const container = this._getContainer();
      this.iframe = this._createIframe();
      container.appendChild(this.iframe);

      this._setupMessageListener();
      this._waitForReady();

      return this;
    } catch (error) {
      this.config.onError(error);
      throw error;
    }
  }

  /**
   * Get container element
   */
  _getContainer() {
    const { container } = this.config;
    
    if (typeof container === 'string') {
      const element = document.querySelector(container);
      if (!element) {
        throw new Error(`Container not found: ${container}`);
      }
      return element;
    }
    
    if (container instanceof HTMLElement) {
      return container;
    }
    
    throw new Error('Invalid container');
  }

  /**
   * Create iframe element
   */
  _createIframe() {
    const iframe = document.createElement('iframe');
    const url = this._buildEmbedUrl();

    iframe.src = url;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.allow = 'clipboard-write; camera; microphone';
    iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals';

    return iframe;
  }

  /**
   * Build embed URL with parameters
   */
  _buildEmbedUrl() {
    const { baseUrl, appId, auth, theme, features } = this.config;
    const params = new URLSearchParams();

    params.append('embedded', 'true');
    
    if (auth.token) {
      params.append('token', auth.token);
    }

    if (theme.primary) {
      params.append('theme_primary', theme.primary);
    }

    if (theme.mode) {
      params.append('theme_mode', theme.mode);
    }

    if (features.hideHeader) {
      params.append('hide_header', 'true');
    }

    if (features.hideSidebar) {
      params.append('hide_sidebar', 'true');
    }

    return `${baseUrl}/embed/${appId}?${params.toString()}`;
  }

  /**
   * Setup postMessage listener
   */
  _setupMessageListener() {
    window.addEventListener('message', (event) => {
      // Verify origin
      if (!event.origin.startsWith(this.config.baseUrl)) {
        return;
      }

      const message = event.data;

      if (message.type === 'appforge:ready') {
        this.isReady = true;
        this._flushMessageQueue();
        this.config.onReady(this);
      } else {
        this.config.onMessage(message);
      }
    });
  }

  /**
   * Wait for iframe to be ready
   */
  _waitForReady() {
    setTimeout(() => {
      if (!this.isReady) {
        console.warn('AppForge embed: Timeout waiting for ready message');
      }
    }, 10000);
  }

  /**
   * Send message to embedded app
   */
  sendMessage(type, data) {
    const message = {
      type: `appforge:${type}`,
      data,
      timestamp: Date.now(),
    };

    if (this.isReady) {
      this.iframe.contentWindow.postMessage(message, this.config.baseUrl);
    } else {
      this.messageQueue.push(message);
    }
  }

  /**
   * Flush queued messages
   */
  _flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.iframe.contentWindow.postMessage(message, this.config.baseUrl);
    }
  }

  /**
   * Update theme
   */
  updateTheme(theme) {
    this.sendMessage('updateTheme', theme);
  }

  /**
   * Navigate to page
   */
  navigate(path) {
    this.sendMessage('navigate', { path });
  }

  /**
   * Update data
   */
  updateData(data) {
    this.sendMessage('updateData', data);
  }

  /**
   * Execute action
   */
  executeAction(action, params) {
    this.sendMessage('executeAction', { action, params });
  }

  /**
   * Destroy embedded app
   */
  destroy() {
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
    this.isReady = false;
    this.messageQueue = [];
  }

  /**
   * Resize iframe
   */
  resize(width, height) {
    if (this.iframe) {
      if (width) this.iframe.style.width = typeof width === 'number' ? `${width}px` : width;
      if (height) this.iframe.style.height = typeof height === 'number' ? `${height}px` : height;
    }
  }

  /**
   * Get embed code
   */
  static getEmbedCode(config) {
    const { appId, baseUrl = 'https://app.appforge.com', auth = {}, theme = {} } = config;

    return `<script src="${baseUrl}/embed.js"></script>
<script>
  AppForge.embed({
    container: '#appforge-container',
    appId: '${appId}',
    baseUrl: '${baseUrl}',
    auth: ${JSON.stringify(auth)},
    theme: ${JSON.stringify(theme)},
    onReady: function(sdk) {
      console.log('AppForge app ready!');
    },
    onError: function(error) {
      console.error('AppForge error:', error);
    }
  });
</script>
<div id="appforge-container" style="width: 100%; height: 600px;"></div>`;
  }

  /**
   * Generate shareable link
   */
  static generateShareLink(appId, options = {}) {
    const baseUrl = options.baseUrl || 'https://app.appforge.com';
    const params = new URLSearchParams();

    if (options.readOnly) {
      params.append('mode', 'readonly');
    }

    if (options.expiresAt) {
      params.append('expires', options.expiresAt);
    }

    if (options.password) {
      params.append('protected', 'true');
    }

    const query = params.toString();
    return `${baseUrl}/share/${appId}${query ? '?' + query : ''}`;
  }
}

/**
 * White-labeling Configuration
 */
export class WhiteLabelConfig {
  static config = {
    enabled: false,
    brandName: 'AppForge',
    logo: null,
    favicon: null,
    colors: {
      primary: '#007bff',
      secondary: '#6c757d',
      accent: '#28a745',
      background: '#ffffff',
      text: '#212529',
    },
    domain: null,
    customCSS: '',
    hidePoweredBy: false,
    supportEmail: 'support@appforge.com',
    privacyUrl: null,
    termsUrl: null,
  };

  /**
   * Set white-label configuration
   */
  static setConfig(config) {
    this.config = {
      ...this.config,
      ...config,
      enabled: true,
    };

    this._applyStyles();
    this._updateBranding();
  }

  /**
   * Apply custom styles
   */
  static _applyStyles() {
    const { colors, customCSS } = this.config;

    // Apply CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary-color', colors.primary);
    root.style.setProperty('--secondary-color', colors.secondary);
    root.style.setProperty('--accent-color', colors.accent);
    root.style.setProperty('--background-color', colors.background);
    root.style.setProperty('--text-color', colors.text);

    // Apply custom CSS
    if (customCSS) {
      const style = document.createElement('style');
      style.textContent = customCSS;
      document.head.appendChild(style);
    }
  }

  /**
   * Update branding elements
   */
  static _updateBranding() {
    const { brandName, logo, favicon } = this.config;

    // Update title
    document.title = brandName;

    // Update logo
    if (logo) {
      const logos = document.querySelectorAll('[data-logo]');
      logos.forEach(el => {
        if (el.tagName === 'IMG') {
          if (el && el.tagName === 'IMG') {
            el['src'] = logo;
          }
        }
      });
    }

    // Update favicon
    if (favicon) {
      const link = document.querySelector('link[rel="icon"]') || document.createElement('link');
      if (link && link.tagName === 'LINK') {
        link['rel'] = 'icon';
        link['href'] = favicon;
      }
      document.head.appendChild(link);
    }
  }

  /**
   * Get config
   */
  static getConfig() {
    return this.config;
  }

  /**
   * Check if white-labeling is enabled
   */
  static isEnabled() {
    return this.config.enabled;
  }

  /**
   * Reset to defaults
   */
  static reset() {
    this.config.enabled = false;
    location.reload();
  }
}

// Global SDK instance
if (typeof window !== 'undefined') {
  // Expose global API using bracket notation to avoid TypeScript errors
  window['AppForge'] = {
    embed: (config) => {
      const sdk = new AppForgeEmbedSDK(config);
      sdk.embed();
      return sdk;
    },
    WhiteLabel: WhiteLabelConfig,
  };
}

export default AppForgeEmbedSDK;
