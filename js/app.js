/**
 * MAIN APPLICATION - Initialize and coordinate all components
 * Entry point for the Conflict Management Training Simulator
 */

class ConflictTrainingApp {
  constructor() {
    this.isInitialized = false;
    this.gameEngine = null;
    this.uiManager = null;
    this.storage = null;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Conflict Training Simulator...');
      
      // Show loading screen
      this.showInitialLoading();
      
      // Wait for all components to be available
      await this.waitForComponents();
      
      // Get component instances
      this.storage = window.storageManager;
      this.gameEngine = window.gameEngine;
      this.uiManager = window.uiManager;
      
      if (!this.storage || !this.gameEngine || !this.uiManager) {
        throw new Error('Failed to initialize core components');
      }
      
      // Initialize game engine
      console.log('📚 Loading scenarios...');
      const savedProgress = await this.gameEngine.initialize();
      
      // Set up UI
      console.log('🎨 Setting up user interface...');
      this.uiManager.renderScenarioList();
      
      // Check for saved progress
      if (savedProgress) {
        console.log('💾 Found saved progress, offering to resume...');
        await this.handleSavedProgress(savedProgress);
      } else {
        console.log('✨ Starting fresh - showing welcome screen');
        this.showWelcomeScreen();
      }
      
      // Set up global error handling
      this.setupErrorHandling();
      
      this.isInitialized = true;
      console.log('✅ Application initialized successfully!');
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.showInitializationError(error);
    }
  }

  /**
   * Wait for all component scripts to load and initialize
   */
  async waitForComponents() {
    const maxWaitTime = 5000; // 5 seconds
    const checkInterval = 100; // 100ms
    let elapsed = 0;
    
    return new Promise((resolve, reject) => {
      const checkComponents = () => {
        if (window.storageManager && window.gameEngine && window.uiManager) {
          resolve();
          return;
        }
        
        elapsed += checkInterval;
        if (elapsed >= maxWaitTime) {
          reject(new Error('Timeout waiting for components to load'));
          return;
        }
        
        setTimeout(checkComponents, checkInterval);
      };
      
      checkComponents();
    });
  }

  /**
   * Handle saved progress - offer to resume or start fresh
   */
  async handleSavedProgress(savedProgress) {
    // For MVP, we'll auto-resume. In full version, we could show a dialog
    try {
      console.log('🔄 Resuming from saved progress...');
      
      // Load the saved scenario
      await this.gameEngine.resumeFromProgress(savedProgress);
      
      // Show the scenario interface
      this.uiManager.hideWelcomeScreen();
      this.uiManager.showScenarioDisplay();
      this.uiManager.renderCurrentNode();
      
      // Announce to user
      this.uiManager.announceToScreenReader('Resumed from where you left off');
      
    } catch (error) {
      console.error('Error resuming saved progress:', error);
      // Fall back to welcome screen
      this.showWelcomeScreen();
      this.storage.clearCurrentProgress();
    }
  }

  /**
   * Show welcome screen
   */
  showWelcomeScreen() {
    this.hideLoading();
    this.uiManager.showWelcomeScreen();
    this.uiManager.renderScenarioList();
  }

  /**
   * Show initial loading screen
   */
  showInitialLoading() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const loadingScreen = document.getElementById('loading-screen');
    
    if (welcomeScreen) welcomeScreen.classList.add('hidden');
    if (loadingScreen) loadingScreen.classList.remove('hidden');
  }

  /**
   * Hide loading screen
   */
  hideLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.classList.add('hidden');
  }

  /**
   * Show initialization error
   */
  showInitializationError(error) {
    this.hideLoading();
    
    const errorScreen = document.getElementById('error-screen');
    const errorMessage = document.getElementById('error-message');
    
    if (errorScreen) {
      errorScreen.classList.remove('hidden');
    }
    
    if (errorMessage) {
      errorMessage.textContent = `Failed to start the application: ${error.message}. Please refresh the page to try again.`;
    }
    
    console.error('Initialization error details:', error);
  }

  /**
   * Set up global error handling
   */
  setupErrorHandling() {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('Uncaught error:', event.error);
      this.handleGlobalError(event.error);
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleGlobalError(event.reason);
    });
    
    // Handle network errors for fetch requests
    window.addEventListener('fetch', (event) => {
      event.respondWith(
        fetch(event.request).catch((error) => {
          console.error('Fetch error:', error);
          this.handleNetworkError(error);
          throw error;
        })
      );
    });
  }

  /**
   * Handle global application errors
   */
  handleGlobalError(error) {
    // Don't show error UI for minor issues
    if (error instanceof TypeError && error.message.includes('reading')) {
      return; // Likely a race condition, not critical
    }
    
    console.error('Global error:', error);
    
    // Show user-friendly error message
    const errorMessage = this.getErrorMessage(error);
    this.uiManager?.announceToScreenReader(`Error: ${errorMessage}`);
    
    // For development, also log to console
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.group('🐛 Development Error Details');
      console.error('Error object:', error);
      console.trace('Stack trace:');
      console.groupEnd();
    }
  }

  /**
   * Handle network errors specifically
   */
  handleNetworkError(error) {
    console.warn('Network error occurred:', error);
    
    if (!navigator.onLine) {
      this.uiManager?.announceToScreenReader('You appear to be offline. Please check your internet connection.');
    } else {
      this.uiManager?.announceToScreenReader('Network error. Please try again.');
    }
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error) {
    if (error.message.includes('Failed to fetch')) {
      return 'Unable to load content. Please check your internet connection.';
    }
    
    if (error.message.includes('JSON')) {
      return 'Content format error. Please try refreshing the page.';
    }
    
    if (error.message.includes('scenario')) {
      return 'Scenario loading error. Please try selecting a different scenario.';
    }
    
    return 'An unexpected error occurred. Please refresh the page to continue.';
  }

  /**
   * Get application status for debugging
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      components: {
        storage: !!this.storage,
        gameEngine: !!this.gameEngine,
        uiManager: !!this.uiManager
      },
      currentScenario: this.gameEngine?.currentScenario?.id || null,
      currentNode: this.gameEngine?.currentNode || null,
      choiceHistory: this.gameEngine?.choiceHistory?.length || 0,
      userPreferences: this.storage?.getUserPreferences() || null
    };
  }

  /**
   * Development and debugging helpers
   */
  debug() {
    console.group('🔍 Application Debug Information');
    console.log('Status:', this.getStatus());
    console.log('Storage data:', this.storage?.loadData());
    console.log('Available scenarios:', this.gameEngine?.getAvailableScenarios());
    console.log('Current node:', this.gameEngine?.getCurrentNode());
    console.groupEnd();
  }

  /**
   * Reset application to initial state
   */
  reset() {
    if (confirm('This will clear all progress and restart the application. Are you sure?')) {
      this.storage?.clearAllData();
      window.location.reload();
    }
  }

  /**
   * Export user data for backup
   */
  exportData() {
    const data = this.storage?.exportData();
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'conflict-training-backup.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  }
}

// Global app instance
let app;

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  app = new ConflictTrainingApp();
  
  // Make app available globally for debugging
  window.conflictTrainingApp = app;
  
  // Development helpers (remove in production)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debug = () => app.debug();
    window.resetApp = () => app.reset();
    window.exportData = () => app.exportData();
    
    console.log('🛠️ Development mode - Debug helpers available:');
    console.log('- debug() - Show application state');
    console.log('- resetApp() - Reset all data');
    console.log('- exportData() - Download backup');
  }
}

// Service Worker registration for future PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Skip service worker for MVP, but structure is ready for future
    console.log('💡 Service Worker support detected - ready for PWA features');
  });
}

// Performance monitoring
if (window.performance && window.performance.mark) {
  window.addEventListener('load', () => {
    window.performance.mark('app-load-complete');
    
    // Log timing information
    const navigationTiming = window.performance.getEntriesByType('navigation')[0];
    if (navigationTiming) {
      console.log(`⚡ Page load: ${Math.round(navigationTiming.loadEventEnd - navigationTiming.loadEventStart)}ms`);
    }
  });
}