// api.js
import config from './config.js';

class API {
  constructor() {
    this.baseUrl = config.apiUrl;
    this.token = localStorage.getItem('authToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }
  
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }
  
  setRefreshToken(token) {
    this.refreshToken = token;
    localStorage.setItem('refreshToken', token);
  }
  
  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    const config = {
      ...options,
      headers,
    };
    
    try {
      const response = await fetch(url, config);
      
      // Handle token refresh
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry original request
          const retryResponse = await fetch(url, {
            ...config,
            headers: {
              ...headers,
              'Authorization': `Bearer ${this.token}`,
            },
          });
          return this.handleResponse(retryResponse);
        }
      }
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  async handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }
  
  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        this.setToken(data.token);
        return true;
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    }
    
    this.clearTokens();
    window.location.href = '/login.html';
    return false;
  }
  
  // Auth APIs
  auth = {
    register: (data) => this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    login: async (data) => {
      const result = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (result.token) {
        this.setToken(result.token);
        this.setRefreshToken(result.refreshToken);
      }
      return result;
    },
    
    logout: () => {
      this.clearTokens();
    },
  };
  
  // User APIs
  user = {
    getDashboard: () => this.request('/users/dashboard'),
    getFavorites: () => this.request('/users/favorites'),
    getDownloads: () => this.request('/users/downloads'),
    downloadApp: (appId) => this.request(`/users/apps/${appId}/download`, {
      method: 'POST',
    }),
    favoriteApp: (appId) => this.request(`/users/apps/${appId}/favorite`, {
      method: 'POST',
    }),
    writeReview: (appId, data) => this.request(`/users/apps/${appId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getNotifications: () => this.request('/users/notifications'),
  };
  
  // Developer APIs
  developer = {
    getDashboard: () => this.request('/developers/dashboard'),
    
    // Projects
    createProject: (data) => this.request('/developers/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    getProject: (projectId) => this.request(`/developers/projects/${projectId}`),
    
    updateProject: (projectId, data) => this.request(`/developers/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
    deleteProject: (projectId) => this.request(`/developers/projects/${projectId}`, {
      method: 'DELETE',
    }),
    
    getProjectFiles: (projectId, path = '') => this.request(`/developers/projects/${projectId}/files?path=${path}`),
    
    saveProjectFile: (projectId, data) => this.request(`/developers/projects/${projectId}/files`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    // Deployments
    deploy: (projectId, data) => this.request(`/developers/projects/${projectId}/deploy`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    getDeployment: (deploymentId) => this.request(`/developers/deployments/${deploymentId}`),
    
    getDeploymentLogs: (deploymentId) => this.request(`/developers/deployments/${deploymentId}/logs`),
    
    rollback: (deploymentId) => this.request(`/developers/deployments/${deploymentId}/rollback`, {
      method: 'POST',
    }),
    
    // Publishing
    publishApp: (data) => this.request('/developers/publish', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    updateApp: (appId, data) => this.request(`/developers/apps/${appId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
    // Analytics
    getAnalytics: (params) => this.request(`/developers/analytics?${new URLSearchParams(params)}`),
    
    // Storage
    uploadFile: (file, path = '') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);
      
      return this.request('/developers/upload', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    
    // Team
    inviteTeamMember: (projectId, data) => this.request(`/developers/projects/${projectId}/team/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    getTeam: (projectId) => this.request(`/developers/projects/${projectId}/team`),
  };
  
  // Public APIs
  public = {
    getApps: (params) => this.request(`/apps?${new URLSearchParams(params)}`),
    getApp: (appId) => this.request(`/apps/${appId}`),
    getCategories: () => this.request('/categories'),
    search: (query) => this.request(`/apps?${new URLSearchParams(query)}`),
  };
}

export default new API();
