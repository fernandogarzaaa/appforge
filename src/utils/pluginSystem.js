/**
 * Plugin System & Marketplace
 * Extensibility framework for third-party integrations
 */

export const PLUGIN_TYPES = {
  DATA_SOURCE: 'data_source',
  AUTHENTICATION: 'authentication',
  NOTIFICATION: 'notification',
  WIDGET: 'widget',
  INTEGRATION: 'integration',
  WORKFLOW: 'workflow',
  THEME: 'theme',
};

export const PLUGIN_STATUS = {
  AVAILABLE: 'available',
  INSTALLED: 'installed',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  UPDATING: 'updating',
  ERROR: 'error',
};

export class Plugin {
  constructor(manifest) {
    this.id = manifest.id;
    this.name = manifest.name;
    this.version = manifest.version;
    this.type = manifest.type;
    this.description = manifest.description;
    this.author = manifest.author;
    this.icon = manifest.icon;
    this.repository = manifest.repository;
    this.homepage = manifest.homepage;
    this.dependencies = manifest.dependencies || [];
    this.permissions = manifest.permissions || [];
    this.config = manifest.config || {};
    this.status = PLUGIN_STATUS.AVAILABLE;
    this.installedAt = null;
    this.instance = null;
  }

  /**
   * Install plugin
   */
  async install() {
    try {
      this.status = PLUGIN_STATUS.INSTALLING;

      // Check dependencies
      await this._checkDependencies();

      // Download plugin files
      await this._downloadPlugin();

      // Run install hook
      if (this.instance?.onInstall) {
        await this.instance.onInstall();
      }

      this.status = PLUGIN_STATUS.INSTALLED;
      this.installedAt = new Date().toISOString();

      return { success: true, plugin: this };
    } catch (error) {
      this.status = PLUGIN_STATUS.ERROR;
      throw new Error(`Failed to install plugin: ${error.message}`);
    }
  }

  /**
   * Activate plugin
   */
  async activate() {
    if (this.status !== PLUGIN_STATUS.INSTALLED) {
      throw new Error('Plugin must be installed before activation');
    }

    try {
      if (this.instance?.onActivate) {
        await this.instance.onActivate();
      }

      this.status = PLUGIN_STATUS.ACTIVE;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to activate plugin: ${error.message}`);
    }
  }

  /**
   * Deactivate plugin
   */
  async deactivate() {
    try {
      if (this.instance?.onDeactivate) {
        await this.instance.onDeactivate();
      }

      this.status = PLUGIN_STATUS.INACTIVE;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to deactivate plugin: ${error.message}`);
    }
  }

  /**
   * Uninstall plugin
   */
  async uninstall() {
    try {
      // Deactivate first
      if (this.status === PLUGIN_STATUS.ACTIVE) {
        await this.deactivate();
      }

      // Run uninstall hook
      if (this.instance?.onUninstall) {
        await this.instance.onUninstall();
      }

      // Remove plugin files
      await this._removePluginFiles();

      this.status = PLUGIN_STATUS.AVAILABLE;
      this.installedAt = null;

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to uninstall plugin: ${error.message}`);
    }
  }

  /**
   * Update plugin
   */
  async update(newVersion) {
    try {
      this.status = PLUGIN_STATUS.UPDATING;

      // Backup current version
      await this._backupPlugin();

      // Download new version
      await this._downloadPlugin(newVersion);

      // Run update hook
      if (this.instance?.onUpdate) {
        await this.instance.onUpdate(this.version, newVersion);
      }

      this.version = newVersion;
      this.status = PLUGIN_STATUS.INSTALLED;

      return { success: true, newVersion };
    } catch (error) {
      this.status = PLUGIN_STATUS.ERROR;
      // Restore backup
      await this._restoreBackup();
      throw new Error(`Failed to update plugin: ${error.message}`);
    }
  }

  /**
   * Check dependencies
   */
  async _checkDependencies() {
    for (const dep of this.dependencies) {
      const installed = await this._isDependencyInstalled(dep);
      if (!installed) {
        throw new Error(`Missing dependency: ${dep}`);
      }
    }
  }

  /**
   * Check if dependency is installed
   */
  async _isDependencyInstalled(dep) {
    // Simulated check
    return true;
  }

  /**
   * Download plugin
   */
  async _downloadPlugin(version = this.version) {
    // Simulated download
    return {
      pluginId: this.id,
      version,
      downloadedAt: new Date().toISOString(),
    };
  }

  /**
   * Remove plugin files
   */
  async _removePluginFiles() {
    // Simulated file removal
    return { removed: true };
  }

  /**
   * Backup plugin
   */
  async _backupPlugin() {
    // Simulated backup
    return { backedUp: true };
  }

  /**
   * Restore backup
   */
  async _restoreBackup() {
    // Simulated restore
    return { restored: true };
  }
}

/**
 * Plugin Manager
 */
export class PluginManager {
  static plugins = new Map();
  static marketplace = new Map();
  static installedPlugins = new Map();

  /**
   * Register plugin in marketplace
   */
  static registerPlugin(manifest) {
    const plugin = new Plugin(manifest);
    this.marketplace.set(plugin.id, plugin);
    return plugin;
  }

  /**
   * Install plugin
   */
  static async installPlugin(pluginId, config = {}) {
    let plugin = this.marketplace.get(pluginId);
    
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    // Clone plugin for installation
    plugin = new Plugin({ ...plugin, config });
    await plugin.install();
    
    this.installedPlugins.set(pluginId, plugin);
    return plugin;
  }

  /**
   * Uninstall plugin
   */
  static async uninstallPlugin(pluginId) {
    const plugin = this.installedPlugins.get(pluginId);
    
    if (!plugin) {
      throw new Error(`Plugin not installed: ${pluginId}`);
    }

    await plugin.uninstall();
    this.installedPlugins.delete(pluginId);
    
    return { success: true };
  }

  /**
   * Activate plugin
   */
  static async activatePlugin(pluginId) {
    const plugin = this.installedPlugins.get(pluginId);
    
    if (!plugin) {
      throw new Error(`Plugin not installed: ${pluginId}`);
    }

    await plugin.activate();
    this.plugins.set(pluginId, plugin);
    
    return plugin;
  }

  /**
   * Deactivate plugin
   */
  static async deactivatePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    
    if (!plugin) {
      return { success: false, message: 'Plugin not active' };
    }

    await plugin.deactivate();
    this.plugins.delete(pluginId);
    
    return { success: true };
  }

  /**
   * Get plugin
   */
  static getPlugin(pluginId) {
    return this.plugins.get(pluginId) || this.installedPlugins.get(pluginId);
  }

  /**
   * List marketplace plugins
   */
  static listMarketplace(filter = {}) {
    const plugins = Array.from(this.marketplace.values());

    if (filter.type) {
      return plugins.filter(p => p.type === filter.type);
    }

    if (filter.search) {
      const search = filter.search.toLowerCase();
      return plugins.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
      );
    }

    return plugins;
  }

  /**
   * List installed plugins
   */
  static listInstalled() {
    return Array.from(this.installedPlugins.values());
  }

  /**
   * List active plugins
   */
  static listActive() {
    return Array.from(this.plugins.values());
  }

  /**
   * Update plugin
   */
  static async updatePlugin(pluginId, newVersion) {
    const plugin = this.installedPlugins.get(pluginId);
    
    if (!plugin) {
      throw new Error(`Plugin not installed: ${pluginId}`);
    }

    await plugin.update(newVersion);
    return plugin;
  }

  /**
   * Check for updates
   */
  static async checkUpdates() {
    const updates = [];

    for (const [id, plugin] of this.installedPlugins) {
      const marketplacePlugin = this.marketplace.get(id);
      
      if (marketplacePlugin && marketplacePlugin.version !== plugin.version) {
        updates.push({
          pluginId: id,
          currentVersion: plugin.version,
          newVersion: marketplacePlugin.version,
        });
      }
    }

    return updates;
  }

  /**
   * Update all plugins
   */
  static async updateAll() {
    const updates = await this.checkUpdates();
    const results = [];

    for (const update of updates) {
      try {
        await this.updatePlugin(update.pluginId, update.newVersion);
        results.push({ ...update, success: true });
      } catch (error) {
        results.push({ ...update, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Search marketplace
   */
  static searchMarketplace(query, filters = {}) {
    let results = this.listMarketplace(filters);

    if (query) {
      const search = query.toLowerCase();
      results = results.filter(plugin =>
        plugin.name.toLowerCase().includes(search) ||
        plugin.description.toLowerCase().includes(search) ||
        plugin.author.toLowerCase().includes(search)
      );
    }

    // Sort by popularity (simulated)
    results.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));

    return results;
  }
}

// Default plugins registry
export const DEFAULT_PLUGINS = [
  {
    id: 'postgres-connector',
    name: 'PostgreSQL Connector',
    version: '1.0.0',
    type: PLUGIN_TYPES.DATA_SOURCE,
    description: 'Connect to PostgreSQL databases',
    author: 'AppForge Team',
    icon: '🐘',
    permissions: ['database:read', 'database:write'],
  },
  {
    id: 'slack-integration',
    name: 'Slack Integration',
    version: '1.0.0',
    type: PLUGIN_TYPES.NOTIFICATION,
    description: 'Send notifications to Slack channels',
    author: 'AppForge Team',
    icon: '💬',
    permissions: ['notifications:send'],
  },
  {
    id: 'saml-auth',
    name: 'SAML Authentication',
    version: '1.0.0',
    type: PLUGIN_TYPES.AUTHENTICATION,
    description: 'Enterprise SAML 2.0 authentication',
    author: 'AppForge Team',
    icon: '🔐',
    permissions: ['auth:manage'],
  },
  {
    id: 'stripe-payments',
    name: 'Stripe Payments',
    version: '1.0.0',
    type: PLUGIN_TYPES.INTEGRATION,
    description: 'Accept payments with Stripe',
    author: 'AppForge Team',
    icon: '💳',
    permissions: ['payments:process'],
  },
];

// Initialize default plugins
DEFAULT_PLUGINS.forEach(manifest => {
  PluginManager.registerPlugin(manifest);
});

export default PluginManager;
