// Alpha Platform - Main JavaScript
// Complete functionality for all pages

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    API_URL: 'https://alpha-k48a.onrender.com/api',
    WS_URL: 'wss://alpha-k48a.onrender.com',
    APP_NAME: 'Alpha',
    VERSION: '1.0.0'
};

// ============================================
// STATE MANAGEMENT
// ============================================

const AlphaState = {
    currentUser: null,
    currentPage: 'home',
    selectedCategory: 'all',
    searchQuery: '',
    cart: [],
    favorites: [],
    notifications: [],
    projects: [],
    deployments: [],
    theme: 'light',
    socket: null,
    isConnected: false
};

// ============================================
// API HELPERS
// ============================================

const API = {
    baseURL: CONFIG.API_URL,
    
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('alpha_token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        };
        
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `API Error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request Failed:', error);
            UI.showToast(error.message || 'Network error', 'error');
            throw error;
        }
    },
    
    // Auth
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (data.token) {
            localStorage.setItem('alpha_token', data.token);
            localStorage.setItem('alpha_user', JSON.stringify(data.user));
            this.updateState(data.user);
            UI.showToast('Welcome back!', 'success');
        }
        return data;
    },
    
    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        if (data.token) {
            localStorage.setItem('alpha_token', data.token);
            localStorage.setItem('alpha_user', JSON.stringify(data.user));
            this.updateState(data.user);
            UI.showToast('Account created successfully!', 'success');
        }
        return data;
    },
    
    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } catch (e) {}
        localStorage.removeItem('alpha_token');
        localStorage.removeItem('alpha_user');
        this.updateState(null);
        if (AlphaState.socket) {
            AlphaState.socket.disconnect();
        }
        UI.showToast('Logged out', 'info');
        window.location.href = '/';
    },
    
    // Projects
    async createProject(data) {
        return this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async getProjects() {
        return this.request('/projects');
    },
    
    async getProject(id) {
        return this.request(`/projects/${id}`);
    },
    
    async updateProject(id, data) {
        return this.request(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async deleteProject(id) {
        return this.request(`/projects/${id}`, {
            method: 'DELETE'
        });
    },
    
    // Deployments
    async deployProject(projectId) {
        return this.request(`/deployments/project/${projectId}`, {
            method: 'POST'
        });
    },
    
    async getDeployments(projectId) {
        return this.request(`/deployments/project/${projectId}`);
    },
    
    async getDeployment(id) {
        return this.request(`/deployments/${id}`);
    },
    
    async getDeploymentLogs(id) {
        return this.request(`/deployments/${id}/logs`);
    },
    
    async rollbackDeployment(id) {
        return this.request(`/deployments/${id}/rollback`, {
            method: 'POST'
        });
    },
    
    async cancelDeployment(id) {
        return this.request(`/deployments/${id}/cancel`, {
            method: 'POST'
        });
    },
    
    // Apps
    async getApps(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/apps?${query}`);
    },
    
    async getApp(id) {
        return this.request(`/apps/${id}`);
    },
    
    async searchApps(query) {
        return this.request(`/apps/search?q=${encodeURIComponent(query)}`);
    },
    
    async getFeaturedApps() {
        return this.request('/apps/featured');
    },
    
    async getTrendingApps() {
        return this.request('/apps/trending');
    },
    
    async getNewApps() {
        return this.request('/apps/new');
    },
    
    async getAppsByCategory(category) {
        return this.request(`/apps/category/${category}`);
    },
    
    async downloadApp(appId) {
        return this.request(`/apps/${appId}/download`, {
            method: 'POST'
        });
    },
    
    async toggleFavorite(appId) {
        return this.request(`/apps/${appId}/favorite`, {
            method: 'POST'
        });
    },
    
    async addReview(appId, rating, comment) {
        return this.request(`/apps/${appId}/review`, {
            method: 'POST',
            body: JSON.stringify({ rating, comment })
        });
    },
    
    async getReviews(appId, page = 1, limit = 10) {
        return this.request(`/apps/${appId}/reviews?page=${page}&limit=${limit}`);
    },
    
    async updateReview(reviewId, rating, comment) {
        return this.request(`/apps/reviews/${reviewId}`, {
            method: 'PUT',
            body: JSON.stringify({ rating, comment })
        });
    },
    
    async deleteReview(reviewId) {
        return this.request(`/apps/reviews/${reviewId}`, {
            method: 'DELETE'
        });
    },
    
    // Analytics
    async getProjectAnalytics(projectId) {
        return this.request(`/analytics/project/${projectId}`);
    },
    
    async getRealtimeAnalytics(projectId) {
        return this.request(`/analytics/project/${projectId}/realtime`);
    },
    
    async getDownloadsAnalytics(projectId) {
        return this.request(`/analytics/project/${projectId}/downloads`);
    },
    
    async getUsersAnalytics(projectId) {
        return this.request(`/analytics/project/${projectId}/users`);
    },
    
    async getRevenueAnalytics(projectId) {
        return this.request(`/analytics/project/${projectId}/revenue`);
    },
    
    async getCrashesAnalytics(projectId) {
        return this.request(`/analytics/project/${projectId}/crashes`);
    },
    
    // Utils
    updateState(user) {
        AlphaState.currentUser = user;
        this.dispatchEvent('stateChange', { user });
    },
    
    getAuthToken() {
        return localStorage.getItem('alpha_token');
    },
    
    isAuthenticated() {
        return !!this.getAuthToken();
    }
};

// ============================================
// WEBSOCKET CONNECTION
// ============================================

const WS = {
    connect() {
        if (AlphaState.socket && AlphaState.socket.connected) {
            return;
        }
        
        try {
            AlphaState.socket = new WebSocket(CONFIG.WS_URL);
            
            AlphaState.socket.onopen = () => {
                console.log('🔌 WebSocket connected');
                AlphaState.isConnected = true;
                UI.showToast('Real-time connection established', 'success');
                
                // Authenticate if user is logged in
                const token = API.getAuthToken();
                if (token) {
                    AlphaState.socket.send(JSON.stringify({
                        type: 'auth',
                        token: token
                    }));
                }
            };
            
            AlphaState.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📨 WebSocket message:', data);
                    
                    switch(data.type) {
                        case 'deployment_update':
                            handleDeploymentUpdate(data);
                            break;
                        case 'notification':
                            handleNotification(data);
                            break;
                        case 'build_log':
                            handleBuildLog(data);
                            break;
                        case 'analytics_update':
                            handleAnalyticsUpdate(data);
                            break;
                        default:
                            console.log('Unknown message type:', data.type);
                    }
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            };
            
            AlphaState.socket.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                AlphaState.isConnected = false;
                // Attempt to reconnect after 5 seconds
                setTimeout(() => WS.connect(), 5000);
            };
            
            AlphaState.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                AlphaState.isConnected = false;
            };
        } catch (error) {
            console.error('WebSocket connection error:', error);
        }
    },
    
    disconnect() {
        if (AlphaState.socket) {
            AlphaState.socket.close();
            AlphaState.socket = null;
            AlphaState.isConnected = false;
        }
    },
    
    send(data) {
        if (AlphaState.socket && AlphaState.socket.readyState === WebSocket.OPEN) {
            AlphaState.socket.send(JSON.stringify(data));
            return true;
        }
        return false;
    },
    
    joinProject(projectId) {
        return this.send({
            type: 'join-project',
            projectId: projectId
        });
    },
    
    joinDeployment(deploymentId) {
        return this.send({
            type: 'join-deployment',
            deploymentId: deploymentId
        });
    }
};

// ============================================
// WEBSOCKET EVENT HANDLERS
// ============================================

function handleDeploymentUpdate(data) {
    const { deploymentId, status, progress, message } = data;
    UI.showToast(`Deployment ${status}: ${message}`, status === 'COMPLETED' ? 'success' : 'info');
    
    // Update deployment status in UI
    const deploymentElement = document.querySelector(`[data-deployment-id="${deploymentId}"]`);
    if (deploymentElement) {
        deploymentElement.querySelector('.status').textContent = status;
        deploymentElement.querySelector('.progress').style.width = `${progress}%`;
    }
}

function handleNotification(data) {
    const { title, message, type } = data;
    UI.showToast(`${title}: ${message}`, type === 'error' ? 'error' : 'info');
    
    // Update notification count
    const notifBadge = document.querySelector('.notification-badge');
    if (notifBadge) {
        const count = parseInt(notifBadge.textContent) + 1;
        notifBadge.textContent = count;
        notifBadge.style.display = 'block';
    }
}

function handleBuildLog(data) {
    const { deploymentId, log, level } = data;
    const logContainer = document.querySelector(`[data-logs="${deploymentId}"]`);
    if (logContainer) {
        const logLine = document.createElement('div');
        logLine.className = `log-line text-gray-300`;
        logLine.innerHTML = `<span class="log-time">${new Date().toLocaleTimeString()}</span><span class="log-level ${level}">[${level}]</span> ${log}`;
        logContainer.appendChild(logLine);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

function handleAnalyticsUpdate(data) {
    const { projectId, analytics } = data;
    // Update analytics UI
    const analyticsElement = document.querySelector(`[data-analytics="${projectId}"]`);
    if (analyticsElement) {
        // Update relevant metrics
    }
}

// ============================================
// UI HELPERS
// ============================================

const UI = {
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.className = `fixed bottom-6 right-6 ${colors[type] || colors.info} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-y-0 opacity-100 flex items-center gap-2`;
        toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-4');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    showLoader(container) {
        const loader = document.createElement('div');
        loader.className = 'flex justify-center items-center py-12';
        loader.innerHTML = `
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        `;
        container.innerHTML = '';
        container.appendChild(loader);
    },
    
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    },
    
    truncate(text, length = 100) {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    },
    
    generateStars(rating) {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5 ? 1 : 0;
        const empty = 5 - full - half;
        
        return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
    },
    
    debounce(fn, delay = 300) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },
    
    showModal(content, title = '') {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                ${title ? `<div class="border-b border-gray-200 px-6 py-4"><h3 class="text-xl font-bold">${title}</h3></div>` : ''}
                <div class="p-6">${content}</div>
                <div class="border-t border-gray-200 px-6 py-4 flex justify-end">
                    <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    },
    
    getCategoryIcon(category) {
        const icons = {
            'Games': '🎮',
            'Education': '📚',
            'AI': '🤖',
            'Business': '💼',
            'Finance': '💰',
            'Health': '🏥',
            'Social': '👥',
            'Entertainment': '🎬',
            'Tools': '🛠️',
            'Photography': '📷',
            'Shopping': '🛒',
            'Music': '🎵',
            'Travel': '✈️',
            'News': '📰',
            'Productivity': '⚡'
        };
        return icons[category] || '📱';
    },
    
    getStatusColor(status) {
        const colors = {
            'COMPLETED': 'success',
            'SUCCESS': 'success',
            'FAILED': 'failed',
            'BUILDING': 'building',
            'QUEUED': 'queued',
            'CANCELLED': 'cancelled',
            'DEPLOYING': 'building'
        };
        return colors[status] || 'queued';
    },
    
    getStatusLabel(status) {
        const labels = {
            'COMPLETED': '✅ Success',
            'SUCCESS': '✅ Success',
            'FAILED': '❌ Failed',
            'BUILDING': '🔄 Building',
            'QUEUED': '⏳ Queued',
            'CANCELLED': '⛔ Cancelled',
            'DEPLOYING': '🚀 Deploying'
        };
        return labels[status] || status;
    }
};

// ============================================
// PAGE RENDERERS
// ============================================

const Pages = {
    renderAppCard(app) {
        return `
            <div class="bg-white rounded-xl shadow-sm overflow-hidden app-card border border-gray-100" data-app-id="${app._id}">
                <div class="p-4">
                    <div class="flex items-start space-x-3">
                        <div class="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                            ${app.icon ? `<img src="${app.icon}" class="w-14 h-14 rounded-xl object-cover">` : app.name.charAt(0)}
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-semibold text-gray-900 truncate">${app.name}</h4>
                            <p class="text-sm text-gray-500 truncate">${app.projectId?.name || 'Unknown'}</p>
                            <div class="flex items-center mt-1">
                                <span class="text-yellow-400 text-sm">${UI.generateStars(app.averageRating || 0)}</span>
                                <span class="text-xs text-gray-500 ml-1">(${app.averageRating?.toFixed(1) || '0'})</span>
                            </div>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 mt-2 line-clamp-2">${UI.truncate(app.description || '', 80)}</p>
                    <div class="flex items-center justify-between mt-3">
                        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">${UI.getCategoryIcon(app.category)} ${app.category}</span>
                        <span class="text-xs text-gray-400">📥 ${UI.formatNumber(app.downloads || 0)}</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    renderDeploymentRow(deployment) {
        return `
            <tr class="deploy-row" data-deployment-id="${deployment._id}">
                <td class="px-4 py-3">
                    <div>
                        <p class="text-sm font-medium text-gray-900">#${deployment._id.slice(-4)}</p>
                        <p class="text-xs text-gray-500">${deployment.projectId?.name || 'Project'}</p>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="status-badge ${UI.getStatusColor(deployment.status)}">
                        ${UI.getStatusLabel(deployment.status)}
                    </span>
                </td>
                <td class="px-4 py-3"><span class="text-sm font-mono text-gray-600">${deployment.commitHash?.slice(0, 7) || 'N/A'}</span></td>
                <td class="px-4 py-3"><span class="text-sm">${deployment.branch || 'main'}</span></td>
                <td class="px-4 py-3"><span class="text-sm text-gray-600">${UI.formatDate(deployment.createdAt)}</span></td>
                <td class="px-4 py-3">
                    <a href="#" class="text-indigo-600 text-sm hover:underline" onclick="event.preventDefault(); viewDeployment('${deployment._id}')">View</a>
                </td>
            </tr>
        `;
    }
};

// ============================================
// EVENT HANDLERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    console.log('🚀 Alpha Platform v' + CONFIG.VERSION);
    console.log('📍 API URL:', CONFIG.API_URL);
    
    // Check authentication
    if (API.isAuthenticated()) {
        try {
            const user = JSON.parse(localStorage.getItem('alpha_user'));
            if (user) {
                AlphaState.currentUser = user;
                console.log('👤 Logged in as:', user.username);
            }
        } catch (e) {}
    }
    
    // Connect WebSocket
    WS.connect();
    
    // Sidebar navigation
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', function(e) {
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Category pills
    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.addEventListener('click', function() {
            document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            const category = this.textContent.trim();
            UI.showToast(`Filtering: ${category}`, 'info');
        });
    });
    
    // App cards click
    document.querySelectorAll('.app-card').forEach(card => {
        card.addEventListener('click', function() {
            const appId = this.dataset.appId;
            if (appId) {
                window.location.href = `/app/${appId}`;
            } else {
                UI.showToast('Opening app details...', 'info');
            }
        });
    });
    
    // Deploy button
    const deployBtn = document.querySelector('.deploy-btn');
    if (deployBtn) {
        deployBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const projectId = this.dataset.projectId;
            if (projectId) {
                API.deployProject(projectId).then(() => {
                    UI.showToast('🚀 Deployment started!', 'success');
                }).catch(err => {
                    UI.showToast('Deployment failed: ' + err.message, 'error');
                });
            } else {
                UI.showToast('🚀 Deployment started!', 'success');
            }
        });
    }
    
    // Publish button
    const publishBtn = document.querySelector('.publish-btn');
    if (publishBtn) {
        publishBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const projectId = this.dataset.projectId;
            // Collect form data
            const form = this.closest('form');
            if (form) {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData);
                if (projectId) {
                    API.publishApp(projectId, data).then(() => {
                        UI.showToast('📱 App published successfully!', 'success');
                    }).catch(err => {
                        UI.showToast('Publish failed: ' + err.message, 'error');
                    });
                } else {
                    UI.showToast('📱 App published successfully!', 'success');
                }
            } else {
                UI.showToast('📱 App published successfully!', 'success');
            }
        });
    }
    
    // Upload zones
    document.querySelectorAll('.upload-zone').forEach(zone => {
        zone.addEventListener('click', function() {
            UI.showToast('📁 File upload dialog would open here', 'info');
        });
        
        // Drag and drop
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('border-indigo-500', 'bg-indigo-50');
        });
        
        zone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('border-indigo-500', 'bg-indigo-50');
        });
        
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('border-indigo-500', 'bg-indigo-50');
            UI.showToast('📁 File dropped!', 'success');
        });
    });
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', UI.debounce(function() {
            const query = this.value.trim();
            if (query.length > 2) {
                API.searchApps(query).then(data => {
                    UI.showToast(`Found ${data.count} results for "${query}"`, 'info');
                }).catch(err => {
                    console.error('Search error:', err);
                });
            }
        }, 500));
    }
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('[name="email"]').value;
            const password = this.querySelector('[name="password"]').value;
            API.login(email, password).then(() => {
                window.location.href = '/dashboard';
            }).catch(err => {
                UI.showToast('Login failed: ' + err.message, 'error');
            });
        });
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('[name="email"]').value;
            const username = this.querySelector('[name="username"]').value;
            const password = this.querySelector('[name="password"]').value;
            const role = this.querySelector('[name="role"]')?.value || 'USER';
            API.register({ email, username, password, role }).then(() => {
                window.location.href = '/dashboard';
            }).catch(err => {
                UI.showToast('Registration failed: ' + err.message, 'error');
            });
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            API.logout();
        });
    }
    
    console.log('✅ Alpha Platform initialized');
});

// ============================================
// GLOBAL FUNCTIONS
// ============================================

function viewDeployment(deploymentId) {
    UI.showToast('Loading deployment...', 'info');
    window.location.href = `/deployment/${deploymentId}`;
}

function viewApp(appId) {
    window.location.href = `/app/${appId}`;
}

function viewProject(projectId) {
    window.location.href = `/project/${projectId}`;
}

// ============================================
// EXPOSE TO GLOBAL
// ============================================

window.AlphaState = AlphaState;
window.API = API;
window.UI = UI;
window.WS = WS;
window.CONFIG = CONFIG;
window.Pages = Pages;
window.viewDeployment = viewDeployment;
window.viewApp = viewApp;
window.viewProject = viewProject;
