// Alpha Platform - Main JavaScript
// Complete functionality for all pages

// ============================================
// 1. STATE MANAGEMENT
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
    theme: 'light'
};

// ============================================
// 2. API HELPERS
// ============================================

const API = {
    baseURL: window.location.origin + '/api',
    
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
                throw new Error(`API Error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request Failed:', error);
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
        }
        return data;
    },
    
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    async logout() {
        localStorage.removeItem('alpha_token');
        localStorage.removeItem('alpha_user');
        this.updateState(null);
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
    
    // Deployments
    async deployProject(projectId) {
        return this.request(`/projects/${projectId}/deploy`, {
            method: 'POST'
        });
    },
    
    async getDeployments(projectId) {
        return this.request(`/projects/${projectId}/deployments`);
    },
    
    // Apps
    async getApps(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/apps?${query}`);
    },
    
    async getApp(id) {
        return this.request(`/apps/${id}`);
    },
    
    async publishApp(projectId, data) {
        return this.request(`/projects/${projectId}/publish`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    // Analytics
    async getAnalytics(projectId) {
        return this.request(`/projects/${projectId}/analytics`);
    },
    
    // Utils
    updateState(user) {
        AlphaState.currentUser = user;
        this.dispatchEvent('stateChange', { user });
    }
};

// ============================================
// 3. UI HELPERS
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
        
        toast.className = `fixed bottom-6 right-6 ${colors[type] || colors.info} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-y-0 opacity-100`;
        toast.textContent = message;
        
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
    }
};

// ============================================
// 4. EVENT HANDLERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
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
        });
    });
    
    // App cards click
    document.querySelectorAll('.app-card').forEach(card => {
        card.addEventListener('click', function() {
            UI.showToast('Opening app details...', 'info');
        });
    });
    
    // Deploy button
    const deployBtn = document.querySelector('.deploy-btn');
    if (deployBtn) {
        deployBtn.addEventListener('click', function() {
            UI.showToast('🚀 Deployment started!', 'success');
        });
    }
    
    // Publish button
    const publishBtn = document.querySelector('.publish-btn');
    if (publishBtn) {
        publishBtn.addEventListener('click', function() {
            UI.showToast('📱 App published successfully!', 'success');
        });
    }
    
    // Upload zones
    document.querySelectorAll('.upload-zone').forEach(zone => {
        zone.addEventListener('click', function() {
            UI.showToast('📁 File upload dialog would open here', 'info');
        });
    });
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', UI.debounce(function() {
            const query = this.value;
            if (query.length > 2) {
                UI.showToast(`Searching for: ${query}`, 'info');
            }
        }, 500));
    }
    
    console.log('🚀 Alpha Platform initialized');
});

// ============================================
// 5. EXPOSE TO GLOBAL
// ============================================

window.AlphaState = AlphaState;
window.API = API;
window.UI = UI;
