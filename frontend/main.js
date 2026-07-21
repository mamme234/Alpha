// Alpha Platform - Main JavaScript
// Shared across all pages

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    API_URL: 'https://alpha-k48a.onrender.com/api',
    APP_NAME: 'Alpha',
    VERSION: '1.0.0'
};

console.log('🚀 Alpha v' + CONFIG.VERSION);
console.log('📍 API:', CONFIG.API_URL);

// ============================================
// STATE
// ============================================

const state = {
    currentUser: null,
    projects: [],
    apps: [],
    selectedCategory: 'all',
    currentFilter: 'trending'
};

// ============================================
// API
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
            console.error('API Error:', error);
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
            state.currentUser = data.user;
        }
        return data;
    },

    async logout() {
        localStorage.removeItem('alpha_token');
        localStorage.removeItem('alpha_user');
        state.currentUser = null;
        window.location.href = '/';
    },

    getToken() {
        return localStorage.getItem('alpha_token');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    // Apps
    async getApps(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/apps?${query}`);
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

    async searchApps(query) {
        return this.request(`/apps/search?q=${encodeURIComponent(query)}`);
    },

    async getAppsByCategory(category) {
        return this.request(`/apps/category/${category}`);
    },

    // Projects
    async getProjects() {
        return this.request('/projects');
    },

    async createProject(data) {
        return this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async deployProject(projectId) {
        return this.request(`/deployments/project/${projectId}`, {
            method: 'POST'
        });
    },

    // Analytics
    async getProjectAnalytics(projectId) {
        return this.request(`/analytics/project/${projectId}`);
    }
};

// ============================================
// UI HELPERS
// ============================================

const UI = {
    showToast(message, type = 'info', duration = 3000) {
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

        const toast = document.createElement('div');
        toast.className = `fixed bottom-6 right-6 ${colors[type] || colors.info} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 toast-enter`;
        toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('toast-enter');
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    },

    generateStars(rating) {
        const full = Math.floor(rating);
        const empty = 5 - full;
        return '★'.repeat(full) + '☆'.repeat(empty);
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
            'CANCELLED': 'cancelled'
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
            'CANCELLED': '⛔ Cancelled'
        };
        return labels[status] || status;
    },

    truncate(text, length = 80) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Any shared initialization can go here
    console.log('Alpha shared JS loaded.');
});

// Expose globally
window.Alpha = {
    CONFIG,
    state,
    API,
    UI
};
