// main.js
import api from './api.js';
import config from './config.js';

class App {
  constructor() {
    this.currentUser = null;
    this.init();
  }
  
  async init() {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        await this.loadUser();
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    }
    
    // Setup global event listeners
    this.setupEventListeners();
    
    // Initialize page based on current URL
    this.initPage();
  }
  
  async loadUser() {
    try {
      const user = await api.auth.me();
      this.currentUser = user;
      this.updateUI();
    } catch (error) {
      // Token might be expired
      api.auth.logout();
    }
  }
  
  setupEventListeners() {
    // Global logout
    document.addEventListener('click', (e) => {
      if (e.target.closest('.logout-btn')) {
        this.logout();
      }
    });
    
    // Global navigation
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-nav]');
      if (link) {
        e.preventDefault();
        this.navigate(link.href);
      }
    });
  }
  
  async initPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    try {
      switch(page) {
        case 'index.html':
        case '':
          await this.showLanding();
          break;
        case 'login.html':
          await this.showLogin();
          break;
        case 'signup.html':
          await this.showSignup();
          break;
        case 'users.html':
          await this.showUserDashboard();
          break;
        case 'developers.html':
          await this.showDeveloperDashboard();
          break;
        case 'app.html':
          await this.showAppDetails();
          break;
        case 'search.html':
          await this.showSearch();
          break;
        case 'publish.html':
          await this.showPublish();
          break;
        case 'deploy.html':
          await this.showDeploy();
          break;
        case 'editor.html':
          await this.showEditor();
          break;
        case 'analytics.html':
          await this.showAnalytics();
          break;
        default:
          console.log('Unknown page:', page);
      }
    } catch (error) {
      console.error('Page init error:', error);
      this.showError('Failed to load page');
    }
  }
  
  // Page handlers
  async showLanding() {
    // Show featured apps, categories, etc.
    try {
      const featured = await api.public.getApps({ featured: true });
      const categories = await api.public.getCategories();
      // Render to DOM
    } catch (error) {
      console.error('Failed to load landing:', error);
    }
  }
  
  async showUserDashboard() {
    if (!this.currentUser || this.currentUser.role !== 'user') {
      window.location.href = '/login.html';
      return;
    }
    
    try {
      const dashboard = await api.user.getDashboard();
      // Render dashboard
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  }
  
  async showDeveloperDashboard() {
    if (!this.currentUser || this.currentUser.role !== 'developer') {
      window.location.href = '/login.html';
      return;
    }
    
    try {
      const dashboard = await api.developer.getDashboard();
      // Render developer dashboard
    } catch (error) {
      console.error('Failed to load developer dashboard:', error);
    }
  }
  
  async showAppDetails() {
    const params = new URLSearchParams(window.location.search);
    const appId = params.get('id');
    
    if (!appId) {
      window.location.href = '/search.html';
      return;
    }
    
    try {
      const app = await api.public.getApp(appId);
      // Render app details
    } catch (error) {
      console.error('Failed to load app:', error);
    }
  }
  
  async showSearch() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';
    
    try {
      const results = await api.public.search({ q: query });
      // Render search results
    } catch (error) {
      console.error('Search failed:', error);
    }
  }
  
  async showPublish() {
    // Show publish form
  }
  
  async showDeploy() {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('project');
    
    if (!projectId) {
      window.location.href = '/developers.html';
      return;
    }
    
    // Show deployment interface
  }
  
  async showEditor() {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('project');
    const file = params.get('file') || '';
    
    if (!projectId) {
      window.location.href = '/developers.html';
      return;
    }
    
    // Initialize code editor
    this.initEditor(projectId, file);
  }
  
  initEditor(projectId, file) {
    // Implement Monaco editor or similar
    // This is a placeholder
    console.log('Editor initialized for project:', projectId);
  }
  
  async showAnalytics() {
    // Show analytics dashboard
  }
  
  // Utility methods
  updateUI() {
    // Update navbar, show/hide elements based on auth
    const isLoggedIn = !!this.currentUser;
    document.querySelectorAll('[data-auth]').forEach(el => {
      el.style.display = isLoggedIn ? 'block' : 'none';
    });
    
    document.querySelectorAll('[data-guest]').forEach(el => {
      el.style.display = isLoggedIn ? 'none' : 'block';
    });
    
    if (this.currentUser) {
      // Update user info
      document.querySelector('[data-username]').textContent = this.currentUser.username;
    }
  }
  
  logout() {
    api.auth.logout();
    this.currentUser = null;
    this.updateUI();
    window.location.href = '/index.html';
  }
  
  navigate(url) {
    window.location.href = url;
  }
  
  showError(message) {
    // Show error toast/notification
    console.error('Error:', message);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

export default App;
