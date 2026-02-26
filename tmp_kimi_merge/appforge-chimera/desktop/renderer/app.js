/**
 * AppForge Chimera - Desktop App
 * ==============================
 * Main JavaScript for the desktop application.
 */

// App state
const state = {
    currentView: 'chat',
    messages: [],
    sessionId: generateSessionId(),
    isStreaming: false,
    services: {
        backend: false,
        ai: false,
        autonomous: false
    },
    settings: {
        temperature: 0.7,
        maxTokens: 1024,
        model: 'auto'
    }
};

// API client
const API_BASE = 'http://localhost:8765';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkServicesStatus();
    loadModels();
    
    // Periodic status check
    setInterval(checkServicesStatus, 5000);
    setInterval(updateAnalytics, 10000);
});

function initializeApp() {
    // Set up Electron API if available
    if (window.electronAPI) {
        setupElectronListeners();
    }
    
    // Focus input
    document.getElementById('message-input').focus();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            switchView(view);
        });
    });
    
    // Chat input
    const messageInput = document.getElementById('message-input');
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    messageInput.addEventListener('input', () => {
        updateTokenCount();
        autoResizeTextarea();
    });
    
    // Send button
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    
    // Clear chat
    document.getElementById('clear-chat').addEventListener('click', clearChat);
    
    // Model select
    document.getElementById('model-select').addEventListener('change', (e) => {
        state.settings.model = e.target.value;
        updateRoutingInfo();
    });
    
    // Settings
    setupSettingsListeners();
}

function setupElectronListeners() {
    // Backend logs
    window.electronAPI.onBackendLog((data) => {
        addLogEntry('backend', data);
    });
    
    // AI logs
    window.electronAPI.onAILog((data) => {
        addLogEntry('ai', data);
    });
    
    // Autonomous logs
    window.electronAPI.onAutonomousLog((data) => {
        addLogEntry('autonomous', data);
    });
}

function setupSettingsListeners() {
    // Temperature slider
    const tempSlider = document.getElementById('temperature');
    tempSlider.addEventListener('input', (e) => {
        state.settings.temperature = parseFloat(e.target.value);
        e.target.nextElementSibling.textContent = state.settings.temperature;
    });
    
    // Max tokens
    document.getElementById('max-tokens').addEventListener('change', (e) => {
        state.settings.maxTokens = parseInt(e.target.value);
    });
    
    // Cache threshold
    const cacheSlider = document.getElementById('cache-threshold');
    cacheSlider.addEventListener('input', (e) => {
        e.target.nextElementSibling.textContent = e.target.value;
    });
}

// View Management
function switchView(viewName) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });
    
    // Update view
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    state.currentView = viewName;
    
    // Load view-specific data
    if (viewName === 'analytics') {
        updateAnalytics();
    } else if (viewName === 'autonomous') {
        updateAutonomousStatus();
    }
}

// Chat Functions
async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message || state.isStreaming) return;
    
    // Add user message
    addMessage('user', message);
    input.value = '';
    updateTokenCount();
    autoResizeTextarea();
    
    // Show loading
    state.isStreaming = true;
    const loadingId = addLoadingMessage();
    
    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                session_id: state.sessionId,
                model: state.settings.model === 'auto' ? null : state.settings.model,
                temperature: state.settings.temperature,
                max_tokens: state.settings.maxTokens
            })
        });
        
        removeMessage(loadingId);
        
        if (response.ok) {
            const data = await response.json();
            addMessage('assistant', data.content, {
                model: data.model,
                tokens: data.tokens_used,
                latency: data.latency_ms,
                cached: data.cached
            });
        } else {
            addMessage('assistant', '❌ Error: Failed to get response from AI engine.');
        }
    } catch (error) {
        removeMessage(loadingId);
        addMessage('assistant', `❌ Error: ${error.message}`);
    } finally {
        state.isStreaming = false;
    }
}

function addMessage(role, content, metadata = {}) {
    const messagesContainer = document.getElementById('messages');
    const messageId = 'msg-' + Date.now();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.id = messageId;
    
    const avatar = role === 'user' ? '👤' : '🤖';
    
    let metaHtml = '';
    if (metadata.model) {
        const cacheBadge = metadata.cached ? '<span class="cached">⚡ Cached</span>' : '';
        metaHtml = `
            <div class="message-meta">
                <span>${metadata.model}</span>
                <span>${metadata.tokens} tokens</span>
                <span>${metadata.latency}ms</span>
                ${cacheBadge}
            </div>
        `;
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div>
            <div class="message-content">${formatContent(content)}</div>
            ${metaHtml}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    state.messages.push({ role, content, metadata });
    
    return messageId;
}

function addLoadingMessage() {
    const id = 'loading-' + Date.now();
    const messagesContainer = document.getElementById('messages');
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant';
    loadingDiv.id = id;
    loadingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="loading"></div>
        </div>
    `;
    
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function clearChat() {
    document.getElementById('messages').innerHTML = `
        <div class="welcome-message">
            <h2>⚡ Welcome to AppForge Chimera</h2>
            <p>Powered by Quantum Chimera LLM v4.0 with autonomous self-evolving AI.</p>
            <div class="features">
                <span class="feature">🎯 Smart Routing</span>
                <span class="feature">💰 Cost Optimization</span>
                <span class="feature">⚡ 100x Faster</span>
                <span class="feature">🧠 Self-Evolving</span>
            </div>
        </div>
    `;
    state.messages = [];
    state.sessionId = generateSessionId();
}

function formatContent(content) {
    // Simple markdown-like formatting
    return content
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function autoResizeTextarea() {
    const textarea = document.getElementById('message-input');
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

function updateTokenCount() {
    const text = document.getElementById('message-input').value;
    const tokens = Math.ceil(text.length / 4);
    document.getElementById('token-count').textContent = `${tokens} tokens`;
}

function updateRoutingInfo() {
    const model = state.settings.model;
    const info = model === 'auto' 
        ? '🎯 Auto-routing enabled' 
        : `📍 Using ${model}`;
    document.getElementById('routing-info').textContent = info;
}

// Service Status
async function checkServicesStatus() {
    try {
        // Check backend
        const response = await fetch(`${API_BASE}/health`, { 
            method: 'GET',
            signal: AbortSignal.timeout(2000)
        });
        state.services.backend = response.ok;
    } catch {
        state.services.backend = false;
    }
    
    updateServiceStatus('backend', state.services.backend);
    updateServiceStatus('ai', state.services.backend); // AI is part of backend
    updateServiceStatus('autonomous', state.services.backend); // Simplified
}

function updateServiceStatus(service, isOnline) {
    const dot = document.querySelector(`#${service}-status .status-dot`);
    if (dot) {
        dot.className = `status-dot ${isOnline ? 'online' : 'offline'}`;
    }
}

// Models
async function loadModels() {
    try {
        const response = await fetch(`${API_BASE}/models`);
        if (response.ok) {
            const data = await response.json();
            renderModels(data.models);
        }
    } catch (error) {
        console.error('Failed to load models:', error);
    }
}

function renderModels(models) {
    const container = document.getElementById('models-grid');
    
    const modelIcons = {
        'kimi': '🌙',
        'llama': '🦙',
        'gpt': '🤖',
        'claude': '📚',
        'default': '⚡'
    };
    
    container.innerHTML = models.map(model => {
        const icon = Object.entries(modelIcons).find(([k]) => 
            model.toLowerCase().includes(k)
        )?.[1] || modelIcons.default;
        
        return `
            <div class="model-card">
                <div class="model-header">
                    <div class="model-icon">${icon}</div>
                    <div class="model-info">
                        <h4>${model.split('/').pop()}</h4>
                        <span>${model}</span>
                    </div>
                </div>
                <div class="model-stats">
                    <div class="model-stat">
                        <div class="model-stat-value">-</div>
                        <div class="model-stat-label">Latency</div>
                    </div>
                    <div class="model-stat">
                        <div class="model-stat-value">-</div>
                        <div class="model-stat-label">Success</div>
                    </div>
                    <div class="model-stat">
                        <div class="model-stat-value">-</div>
                        <div class="model-stat-label">Cost/1K</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Analytics
async function updateAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        if (response.ok) {
            const data = await response.json();
            
            // Update stats
            const router = data.router || {};
            const cache = data.semantic_cache || {};
            const tracker = data.model_tracker || {};
            
            document.getElementById('total-requests').textContent = 
                tracker.total_requests?.toLocaleString() || '0';
            
            document.getElementById('cache-hit-rate').textContent = 
                `${Math.round((cache.hit_rate || 0) * 100)}%`;
            
            document.getElementById('avg-latency').textContent = 
                `${Math.round(router.avg_latency_ms || 0)}ms`;
            
            document.getElementById('tokens-saved').textContent = 
                (cache.hits * 500)?.toLocaleString() || '0';
        }
    } catch (error) {
        console.error('Failed to update analytics:', error);
    }
}

// Autonomous Status
async function updateAutonomousStatus() {
    // This would connect to the autonomous core API
    // For now, show simulated data
    
    document.getElementById('patterns-count').textContent = '42';
    document.getElementById('insights-count').textContent = '8';
    document.getElementById('suggestions-count').textContent = '5';
    document.getElementById('applied-count').textContent = '12';
}

function addLogEntry(source, message) {
    const logsContainer = document.getElementById('autonomous-logs');
    if (!logsContainer) return;
    
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    const timestamp = new Date().toLocaleTimeString();
    const sourceColor = {
        'backend': 'info',
        'ai': 'success',
        'autonomous': 'warning'
    }[source] || 'info';
    
    entry.innerHTML = `<span class="${sourceColor}">[${timestamp}] [${source.toUpperCase()}]</span> ${message}`;
    
    logsContainer.appendChild(entry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
    
    // Keep only last 100 entries
    while (logsContainer.children.length > 100) {
        logsContainer.removeChild(logsContainer.firstChild);
    }
}

// Utilities
function generateSessionId() {
    return 'session-' + Math.random().toString(36).substring(2, 15);
}

// Export for Electron
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { state, switchView, sendMessage };
}
