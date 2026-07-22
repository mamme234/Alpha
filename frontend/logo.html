// all.js - Complete page logic for all pages

import api from './api.js';
import config from './config.js';

// ==================== Global State ====================
const state = {
    currentUser: null,
    currentPage: 'index',
    notifications: [],
    cart: [],
    favorites: [],
    theme: localStorage.getItem('theme') || 'light',
    language: localStorage.getItem('language') || 'en'
};

// ==================== Navigation Functions ====================
export const navigateTo = (page, params = {}) => {
    const url = new URL(window.location.href);
    url.pathname = `/${page}.html`;
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    window.location.href = url.toString();
};

export const getUrlParams = () => {
    return Object.fromEntries(new URLSearchParams(window.location.search));
};

// ==================== User Management ====================
export const login = async (email, password, twoFactorCode) => {
    try {
        const response = await api.auth.login({ email, password, twoFactorCode });
        state.currentUser = response.user;
        updateUI();
        showSuccess('Login successful!');
        return response;
    } catch (error) {
        showError(error.message);
        throw error;
    }
};

export const logout = async () => {
    try {
        await api.auth.logout();
        state.currentUser = null;
        updateUI();
        showSuccess('Logged out successfully');
        navigateTo('index');
    } catch (error) {
        showError('Logout failed');
    }
};

export const register = async (userData) => {
    try {
        const response = await api.auth.register(userData);
        showSuccess('Registration successful! Please verify your email.');
        navigateTo('login');
        return response;
    } catch (error) {
        showError(error.message);
        throw error;
    }
};

// ==================== UI Updates ====================
export const updateUI = () => {
    // Update navbar
    const navAuth = document.querySelectorAll('[data-auth]');
    const navGuest = document.querySelectorAll('[data-guest]');
    
    if (state.currentUser) {
        navAuth.forEach(el => el.style.display = 'block');
        navGuest.forEach(el => el.style.display = 'none');
        
        // Update user info
        const usernameEl = document.querySelector('[data-username]');
        if (usernameEl) usernameEl.textContent = state.currentUser.username;
        
        const avatarEl = document.querySelector('[data-avatar]');
        if (avatarEl) avatarEl.src = state.currentUser.avatar || '/assets/default-avatar.png';
    } else {
        navAuth.forEach(el => el.style.display = 'none');
        navGuest.forEach(el => el.style.display = 'block');
    }
    
    // Update theme
    document.documentElement.setAttribute('data-theme', state.theme);
};

// ==================== Notifications ====================
export const showSuccess = (message) => {
    showNotification(message, 'success');
};

export const showError = (message) => {
    showNotification(message, 'error');
};

export const showInfo = (message) => {
    showNotification(message, 'info');
};

export const showWarning = (message) => {
    showNotification(message, 'warning');
};

const showNotification = (message, type = 'info') => {
    const container = document.getElementById('notification-container');
    if (!container) {
        // Create container if it doesn't exist
        const newContainer = document.createElement('div');
        newContainer.id = 'notification-container';
        newContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
            width: 100%;
        `;
        document.body.appendChild(newContainer);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        background: ${type === 'success' ? '#2ecc71' : 
                    type === 'error' ? '#e74c3c' : 
                    type === 'warning' ? '#f39c12' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        cursor: pointer;
    `;
    notification.textContent = message;
    
    const containerRef = document.getElementById('notification-container');
    containerRef.appendChild(notification);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Dismiss on click
    notification.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
};

// ==================== Modal Functions ====================
export const openModal = (content, title = 'Modal') => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => closeModal(modal));
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
    });
    
    return modal;
};

export const closeModal = (modal) => {
    modal.classList.add('fade-out');
    setTimeout(() => modal.remove(), 300);
};

// ==================== Loading States ====================
export const showLoading = (element) => {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    if (element) {
        element.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }
};

export const hideLoading = (element) => {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    if (element) {
        const loadingEl = element.querySelector('.loading-spinner');
        if (loadingEl) loadingEl.remove();
    }
};

// ==================== Form Validation ====================
export const validateForm = (form) => {
    const inputs = form.querySelectorAll('input, select, textarea');
    let isValid = true;
    
    inputs.forEach(input => {
        if (input.hasAttribute('required') && !input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
        
        // Email validation
        if (input.type === 'email' && input.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value)) {
                input.classList.add('error');
                isValid = false;
            }
        }
        
        // Password validation
        if (input.type === 'password' && input.value && input.value.length < 8) {
            input.classList.add('error');
            isValid = false;
        }
    });
    
    return isValid;
};

// ==================== User Dashboard Functions ====================
export const loadUserDashboard = async () => {
    try {
        showLoading('#dashboard-content');
        
        const dashboard = await api.user.getDashboard();
        const favorites = await api.user.getFavorites();
        const notifications = await api.user.getNotifications();
        
        renderFeaturedApps(dashboard.featured);
        renderTrendingApps(dashboard.trending);
        renderUserFavorites(favorites);
        renderUserNotifications(notifications);
        
        hideLoading('#dashboard-content');
    } catch (error) {
        showError('Failed to load dashboard');
        hideLoading('#dashboard-content');
    }
};

export const renderFeaturedApps = (apps) => {
    const container = document.getElementById('featured-apps');
    if (!container) return;
    
    container.innerHTML = apps.map(app => `
        <div class="app-card" onclick="navigateTo('app', { id: '${app._id}' })">
            <img src="${app.icon || '/assets/default-app-icon.png'}" alt="${app.name}" class="app-card-image">
            <div class="app-card-content">
                <h3 class="app-card-title">${app.name}</h3>
                <p class="app-card-developer">${app.developerName}</p>
                <div class="app-card-rating">
                    ⭐ ${app.rating || 'N/A'}
                    <span style="color: var(--gray); font-size: 0.85rem;">(${app.totalReviews || 0} reviews)</span>
                </div>
                <div class="app-card-actions">
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); downloadApp('${app._id}')">
                        Download
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); toggleFavorite('${app._id}')">
                        ♥
                    </button>
                </div>
            </div>
        </div>
    `).join('');
};

export const downloadApp = async (appId) => {
    try {
        const result = await api.user.downloadApp(appId);
        showSuccess('Download started!');
        // Open download URL
        if (result.url) window.open(result.url);
    } catch (error) {
        showError('Download failed: ' + error.message);
    }
};

export const toggleFavorite = async (appId) => {
    try {
        const result = await api.user.favoriteApp(appId);
        if (result.favorited) {
            showSuccess('Added to favorites');
        } else {
            showInfo('Removed from favorites');
        }
        // Refresh favorites
        await loadUserDashboard();
    } catch (error) {
        showError('Failed to update favorites');
    }
};

// ==================== Developer Dashboard Functions ====================
export const loadDeveloperDashboard = async () => {
    try {
        showLoading('#developer-dashboard');
        
        const dashboard = await api.developer.getDashboard();
        
        renderDeveloperStats(dashboard);
        renderDeveloperProjects(dashboard.projects);
        renderRecentDeployments(dashboard.recentDeployments);
        
        hideLoading('#developer-dashboard');
    } catch (error) {
        showError('Failed to load developer dashboard');
        hideLoading('#developer-dashboard');
    }
};

export const renderDeveloperStats = (stats) => {
    const container = document.getElementById('dev-stats');
    if (!container) return;
    
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${stats.projects}</div>
            <div class="stat-label">📁 Projects</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.activeDeployments}</div>
            <div class="stat-label">🚀 Active Deployments</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.publishedApps}</div>
            <div class="stat-label">📱 Published Apps</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.totalDownloads}</div>
            <div class="stat-label">📥 Total Downloads</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.usage.storage.used}</div>
            <div class="stat-label">💾 Storage Used</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.usage.cpu.used}%</div>
            <div class="stat-label">⚡ CPU Usage</div>
        </div>
    `;
};

export const renderDeveloperProjects = (projects) => {
    const container = document.getElementById('dev-projects');
    if (!container) return;
    
    container.innerHTML = projects.map(project => `
        <div class="project-card">
            <div class="project-header">
                <h3>${project.name}</h3>
                <span class="project-status ${project.status}">${project.status}</span>
            </div>
            <p class="project-description">${project.description || 'No description'}</p>
            <div class="project-meta">
                <span>🔧 ${project.framework || 'Unknown'}</span>
                <span>📁 ${project.language || 'Unknown'}</span>
                <span>🔄 ${project.lastDeployed ? new Date(project.lastDeployed).toLocaleDateString() : 'Never'}</span>
            </div>
            <div class="project-actions">
                <button class="btn btn-primary btn-sm" onclick="openProject('${project._id}')">Open</button>
                <button class="btn btn-success btn-sm" onclick="deployProject('${project._id}')">Deploy</button>
                <button class="btn btn-outline btn-sm" onclick="editProject('${project._id}')">Edit</button>
            </div>
        </div>
    `).join('');
};

export const openProject = (projectId) => {
    navigateTo('editor', { project: projectId });
};

export const deployProject = async (projectId) => {
    try {
        const result = await api.developer.deploy(projectId, {
            branch: 'main',
            environment: 'production'
        });
        showSuccess('Deployment started!');
        navigateTo('deploy', { id: result.deploymentId });
    } catch (error) {
        showError('Deployment failed: ' + error.message);
    }
};

// ==================== Code Editor Functions ====================
export const initEditor = (projectId, filePath = '') => {
    let editor = null;
    let currentFile = filePath;
    const files = {};
    
    // Load Monaco Editor (CDN)
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs/loader.min.js';
    script.onload = () => {
        require.config({
            paths: {
                vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs'
            }
        });
        
        require(['vs/editor/editor.main'], () => {
            initMonacoEditor(projectId);
        });
    };
    document.head.appendChild(script);
};

const initMonacoEditor = async (projectId) => {
    const container = document.getElementById('editor-container');
    if (!container) return;
    
    // Create editor
    editor = monaco.editor.create(document.getElementById('editor-main'), {
        value: '// Welcome to your project\n// Start coding here...',
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        renderWhitespace: 'selection',
        fontFamily: 'Fira Code, monospace',
        fontLigatures: true,
    });
    
    // Load file tree
    await loadFileTree(projectId);
    
    // Load initial file
    if (currentFile) {
        await loadFile(projectId, currentFile);
    }
    
    // Auto-save
    let saveTimeout;
    editor.onDidChangeContent(() => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveCurrentFile(projectId);
        }, 1000);
    });
    
    // Keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        saveCurrentFile(projectId);
    });
};

const loadFileTree = async (projectId) => {
    try {
        const files = await api.developer.getProjectFiles(projectId);
        renderFileTree(files);
    } catch (error) {
        showError('Failed to load file tree');
    }
};

const renderFileTree = (files) => {
    const container = document.getElementById('file-tree');
    if (!container) return;
    
    const tree = buildFileTree(files);
    container.innerHTML = renderTreeNodes(tree);
    
    // Add click handlers
    container.querySelectorAll('.file-node').forEach(el => {
        el.addEventListener('click', () => {
            const path = el.dataset.path;
            if (path) loadFileFromTree(projectId, path);
        });
    });
};

const buildFileTree = (files) => {
    const tree = {};
    
    files.forEach(file => {
        const parts = file.path.split('/');
        let current = tree;
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                current[part] = { type: 'file', ...file };
            } else {
                if (!current[part]) {
                    current[part] = { type: 'folder', children: {} };
                }
                current = current[part].children;
            }
        }
    });
    
    return tree;
};

const renderTreeNodes = (tree, prefix = '') => {
    let html = '<ul class="file-tree">';
    
    Object.entries(tree).forEach(([name, node]) => {
        const path = prefix ? `${prefix}/${name}` : name;
        
        if (node.type === 'folder') {
            html += `
                <li class="folder-node">
                    <span class="folder-toggle">📁</span>
                    <span>${name}</span>
                    ${renderTreeNodes(node.children, path)}
                </li>
            `;
        } else {
            const icon = getFileIcon(node.name);
            html += `
                <li class="file-node" data-path="${path}">
                    <span>${icon}</span>
                    <span>${name}</span>
                </li>
            `;
        }
    });
    
    html += '</ul>';
    return html;
};

const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        js: '📜',
        ts: '📘',
        html: '🌐',
        css: '🎨',
        json: '📋',
        md: '📝',
        py: '🐍',
        php: '🐘',
        java: '☕',
        go: '🐹',
        rs: '🦀',
        cpp: '⚙️',
        c: '⚙️',
        h: '📐',
        sh: '💻',
        yml: '📄',
        yaml: '📄',
        xml: '📄',
        sql: '🗄️',
        png: '🖼️',
        jpg: '🖼️',
        jpeg: '🖼️',
        gif: '🖼️',
        svg: '🖼️',
        ico: '🖼️',
        wav: '🔊',
        mp3: '🔊',
        mp4: '🎬',
        webm: '🎬',
        zip: '📦',
        tar: '📦',
        gz: '📦'
    };
    return icons[ext] || '📄';
};

const loadFileFromTree = async (projectId, path) => {
    await loadFile(projectId, path);
};

const loadFile = async (projectId, path) => {
    try {
        const content = await api.developer.getProjectFiles(projectId, path);
        if (editor) {
            const language = getLanguageFromPath(path);
            monaco.editor.setModelLanguage(editor.getModel(), language);
            editor.setValue(content);
            currentFile = path;
            updateTab(path);
        }
    } catch (error) {
        showError('Failed to load file: ' + error.message);
    }
};

const getLanguageFromPath = (path) => {
    const ext = path.split('.').pop().toLowerCase();
    const languages = {
        js: 'javascript',
        ts: 'typescript',
        jsx: 'javascript',
        tsx: 'typescript',
        html: 'html',
        css: 'css',
        scss: 'scss',
        json: 'json',
        md: 'markdown',
        py: 'python',
        php: 'php',
        java: 'java',
        go: 'go',
        rs: 'rust',
        cpp: 'cpp',
        c: 'c',
        sh: 'shell',
        yml: 'yaml',
        yaml: 'yaml',
        xml: 'xml',
        sql: 'sql'
    };
    return languages[ext] || 'plaintext';
};

const saveCurrentFile = async (projectId) => {
    if (!editor || !currentFile) return;
    
    try {
        const content = editor.getValue();
        await api.developer.saveProjectFile(projectId, {
            path: currentFile,
            content
        });
        showSuccess('File saved');
    } catch (error) {
        showError('Failed to save file: ' + error.message);
    }
};

const updateTab = (path) => {
    const tabs = document.getElementById('editor-tabs');
    if (!tabs) return;
    
    const existing = tabs.querySelector(`[data-path="${path}"]`);
    if (existing) {
        tabs.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
        existing.classList.add('active');
        return;
    }
    
    const tab = document.createElement('div');
    tab.className = 'editor-tab active';
    tab.dataset.path = path;
    tab.innerHTML = `
        <span>${path.split('/').pop()}</span>
        <span class="tab-close">×</span>
    `;
    
    tab.querySelector('.tab-close').addEventListener('click', (e) => {
        e.stopPropagation();
        tab.remove();
        if (tab.classList.contains('active') && tabs.children.length > 0) {
            tabs.children[0].classList.add('active');
            const firstPath = tabs.children[0].dataset.path;
            loadFile(projectId, firstPath);
        }
    });
    
    tab.addEventListener('click', () => {
        tabs.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loadFile(projectId, path);
    });
    
    tabs.appendChild(tab);
};

// ==================== Search Functions ====================
export const performSearch = async (query, filters = {}) => {
    try {
        showLoading('#search-results');
        
        const params = { q: query, ...filters };
        const results = await api.public.search(params);
        
        renderSearchResults(results);
        hideLoading('#search-results');
    } catch (error) {
        showError('Search failed: ' + error.message);
        hideLoading('#search-results');
    }
};

export const renderSearchResults = (results) => {
    const container = document.getElementById('search-results');
    if (!container) return;
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <h3>No results found</h3>
                <p>Try adjusting your search terms or filters</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = results.map(app => `
        <div class="app-card" onclick="navigateTo('app', { id: '${app._id}' })">
            <img src="${app.icon || '/assets/default-app-icon.png'}" alt="${app.name}" class="app-card-image">
            <div class="app-card-content">
                <h3 class="app-card-title">${app.name}</h3>
                <p class="app-card-developer">${app.developerName}</p>
                <div class="app-card-rating">
                    ⭐ ${app.rating || 'N/A'}
                    <span style="color: var(--gray); font-size: 0.85rem;">(${app.totalReviews || 0} reviews)</span>
                </div>
                <div class="app-card-actions">
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); downloadApp('${app._id}')">
                        Download
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); toggleFavorite('${app._id}')">
                        ♥
                    </button>
                </div>
            </div>
        </div>
    `).join('');
};

// ==================== Analytics Functions ====================
export const loadAnalytics = async (appId, timeRange = '7d') => {
    try {
        showLoading('#analytics-container');
        
        const analytics = await api.developer.getAnalytics({ appId, timeRange });
        
        renderAnalyticsCharts(analytics);
        renderAnalyticsStats(analytics);
        
        hideLoading('#analytics-container');
    } catch (error) {
        showError('Failed to load analytics');
        hideLoading('#analytics-container');
    }
};

export const renderAnalyticsCharts = (analytics) => {
    // This would typically use a charting library like Chart.js
    // For now, we'll show simple stats
    console.log('Analytics data:', analytics);
};

// ==================== Admin Functions ====================
export const loadAdminDashboard = async () => {
    try {
        showLoading('#admin-dashboard');
        
        const stats = await api.admin.getDashboard();
        const users = await api.admin.getUsers();
        const apps = await api.admin.getApps();
        
        renderAdminStats(stats);
        renderAdminUsers(users);
        renderAdminApps(apps);
        
        hideLoading('#admin-dashboard');
    } catch (error) {
        showError('Failed to load admin dashboard');
        hideLoading('#admin-dashboard');
    }
};

export const renderAdminStats = (stats) => {
    const container = document.getElementById('admin-stats');
    if (!container) return;
    
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${stats.totalUsers}</div>
            <div class="stat-label">👥 Total Users</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.totalDevelopers}</div>
            <div class="stat-label">👨‍💻 Developers</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.totalApps}</div>
            <div class="stat-label">📱 Published Apps</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.totalDownloads}</div>
            <div class="stat-label">📥 Total Downloads</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.storageUsed}</div>
            <div class="stat-label">💾 Storage Used</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.activeUsers}</div>
            <div class="stat-label">🟢 Active Users</div>
        </div>
    `;
};

// ==================== Settings Functions ====================
export const saveSettings = async (settings) => {
    try {
        await api.user.updateSettings(settings);
        showSuccess('Settings saved successfully');
        
        // Update theme if changed
        if (settings.theme) {
            state.theme = settings.theme;
            localStorage.setItem('theme', settings.theme);
            updateUI();
        }
    } catch (error) {
        showError('Failed to save settings: ' + error.message);
    }
};

// ==================== Theme Functions ====================
export const toggleTheme = () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    updateUI();
};

// ==================== WebSocket Connection ====================
let ws = null;

export const connectWebSocket = () => {
    if (ws) return;
    
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    ws = new WebSocket(config.wsUrl);
    
    ws.onopen = () => {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({
            type: 'auth',
            token
        }));
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Reconnect after delay
        setTimeout(connectWebSocket, 5000);
    };
};

export const handleWebSocketMessage = (data) => {
    switch (data.type) {
        case 'notification':
            showNotification(data.message, 'info');
            break;
        case 'deployment':
            showInfo(`Deployment ${data.status}: ${data.projectName}`);
            break;
        case 'review':
            showInfo(`New review on ${data.appName}: ${data.rating}⭐`);
            break;
        case 'download':
            showSuccess(`New download: ${data.appName}`);
            break;
        default:
            console.log('Unknown WebSocket message:', data);
    }
};

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize theme
    document.documentElement.setAttribute('data-theme', state.theme);
    
    // Add notification container
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
        width: 100%;
        pointer-events: none;
    `;
    document.body.appendChild(container);
    
    // Add styles for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        .notification {
            pointer-events: auto;
            cursor: pointer;
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .notification:hover {
            transform: scale(1.02);
        }
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        }
        .modal {
            background: white;
            border-radius: 12px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            animation: slideUp 0.3s ease;
        }
        .modal-header {
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-body {
            padding: 20px;
        }
        .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #666;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from {
                transform: translateY(50px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        .loading-spinner {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e0e0e0;
            border-top-color: #6c63ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .project-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .project-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .project-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        .project-status.active {
            background: #d4edda;
            color: #155724;
        }
        .project-status.archived {
            background: #fff3cd;
            color: #856404;
        }
        .project-status.deleted {
            background: #f8d7da;
            color: #721c24;
        }
        .project-meta {
            display: flex;
            gap: 20px;
            margin: 10px 0;
            font-size: 0.9rem;
            color: #666;
        }
        .project-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        .file-tree {
            list-style: none;
            padding: 0;
        }
        .file-tree li {
            padding: 4px 0;
            cursor: pointer;
        }
        .file-tree li:hover {
            background: rgba(108, 99, 255, 0.1);
        }
        .file-tree .folder-node {
            font-weight: 600;
        }
        .file-tree .folder-node .folder-toggle {
            cursor: pointer;
            margin-right: 5px;
        }
        .file-tree ul {
            padding-left: 20px;
        }
        .editor-tab-close {
            margin-left: 8px;
            cursor: pointer;
            opacity: 0.5;
        }
        .editor-tab-close:hover {
            opacity: 1;
        }
        [data-theme="dark"] {
            --bg: #1a1a2e;
            --text: #ffffff;
            --card-bg: #2d2d44;
            --border: #444466;
        }
        [data-theme="dark"] body {
            background: var(--bg);
            color: var(--text);
        }
        [data-theme="dark"] .card,
        [data-theme="dark"] .stat-card,
        [data-theme="dark"] .project-card {
            background: var(--card-bg);
            color: var(--text);
        }
        [data-theme="dark"] .modal {
            background: var(--card-bg);
            color: var(--text);
        }
        [data-theme="dark"] .modal-header {
            border-bottom-color: var(--border);
        }
    `;
    document.head.appendChild(style);
    
    // Initialize page
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const pageHandlers = {
        'index.html': loadUserDashboard,
        'users.html': loadUserDashboard,
        'developers.html': loadDeveloperDashboard,
        'admin.html': loadAdminDashboard,
        'analytics.html': () => loadAnalytics(getUrlParams().appId),
        'search.html': () => performSearch(getUrlParams().q, getUrlParams()),
        'publish.html': () => {/* Publish form logic */},
        'deploy.html': () => {/* Deploy logic */},
        'editor.html': () => initEditor(getUrlParams().project, getUrlParams().file)
    };
    
    const handler = pageHandlers[page];
    if (handler) {
        await handler();
    }
    
    // Connect WebSocket if logged in
    if (localStorage.getItem('authToken')) {
        connectWebSocket();
    }
});

// ==================== Export for Global Use ====================
window.navigateTo = navigateTo;
window.login = login;
window.logout = logout;
window.register = register;
window.showSuccess = showSuccess;
window.showError = showError;
window.showInfo = showInfo;
window.showWarning = showWarning;
window.downloadApp = downloadApp;
window.toggleFavorite = toggleFavorite;
window.deployProject = deployProject;
window.toggleTheme = toggleTheme;
window.saveSettings = saveSettings;
window.performSearch = performSearch;
window.loadAnalytics = loadAnalytics;
window.loadUserDashboard = loadUserDashboard;
window.loadDeveloperDashboard = loadDeveloperDashboard;
window.loadAdminDashboard = loadAdminDashboard;
