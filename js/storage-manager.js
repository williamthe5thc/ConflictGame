/**
 * STORAGE MANAGER - Handle local storage operations for user progress
 * Manages save/load functionality, user preferences, and scenario completion tracking
 */

class StorageManager {
  constructor() {
    this.storageKey = 'conflict-training-simulator';
    this.defaultState = {
      userProgress: {
        currentScenario: null,
        currentNode: null,
        choiceHistory: []
      },
      completedScenarios: [],
      userPreferences: {
        viewMode: 'visual-novel', // or 'text-adventure'
        autoSave: true,
        soundEnabled: true
      },
      statistics: {
        totalChoicesMade: 0,
        scenariosCompleted: 0,
        strategiesUsed: {
          collaborating: 0,
          compromising: 0,
          competing: 0,
          accommodating: 0,
          avoiding: 0,
          active_listening: 0
        }
      }
    };
  }

  /**
   * Load all data from localStorage
   * @returns {Object} User data or default state if not found
   */
  loadData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        // Merge with defaults to handle new properties
        return this.mergeWithDefaults(data);
      }
    } catch (error) {
      console.warn('Error loading stored data:', error);
    }
    return { ...this.defaultState };
  }

  /**
   * Save all data to localStorage
   * @param {Object} data - Complete user data object
   */
  saveData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }

  /**
   * Save current scenario progress
   * @param {string} scenarioId - Current scenario ID
   * @param {string} nodeId - Current node ID
   * @param {Array} choiceHistory - Array of previous choices
   */
  saveProgress(scenarioId, nodeId, choiceHistory = []) {
    const data = this.loadData();
    data.userProgress = {
      currentScenario: scenarioId,
      currentNode: nodeId,
      choiceHistory: [...choiceHistory]
    };
    
    // Update statistics
    data.statistics.totalChoicesMade = choiceHistory.length;
    
    return this.saveData(data);
  }

  /**
   * Load current scenario progress
   * @returns {Object} Progress object or null if no progress found
   */
  loadProgress() {
    const data = this.loadData();
    const progress = data.userProgress;
    
    if (progress.currentScenario && progress.currentNode) {
      return progress;
    }
    return null;
  }

  /**
   * Mark a scenario as completed
   * @param {string} scenarioId - ID of completed scenario
   */
  markScenarioComplete(scenarioId) {
    const data = this.loadData();
    
    if (!data.completedScenarios.includes(scenarioId)) {
      data.completedScenarios.push(scenarioId);
      data.statistics.scenariosCompleted++;
    }
    
    // Clear current progress since scenario is complete
    data.userProgress = {
      currentScenario: null,
      currentNode: null,
      choiceHistory: []
    };
    
    return this.saveData(data);
  }

  /**
   * Record strategy usage for statistics
   * @param {string} strategy - Strategy used (collaborating, competing, etc.)
   */
  recordStrategyUsage(strategy) {
    const data = this.loadData();
    
    if (data.statistics.strategiesUsed.hasOwnProperty(strategy)) {
      data.statistics.strategiesUsed[strategy]++;
      return this.saveData(data);
    }
    
    return false;
  }

  /**
   * Get user preferences
   * @returns {Object} User preferences
   */
  getUserPreferences() {
    const data = this.loadData();
    return data.userPreferences;
  }

  /**
   * Update user preferences
   * @param {Object} preferences - Preferences to update
   */
  updatePreferences(preferences) {
    const data = this.loadData();
    data.userPreferences = { ...data.userPreferences, ...preferences };
    return this.saveData(data);
  }

  /**
   * Get user statistics
   * @returns {Object} User statistics
   */
  getStatistics() {
    const data = this.loadData();
    return data.statistics;
  }

  /**
   * Check if scenario is completed
   * @param {string} scenarioId - Scenario to check
   * @returns {boolean} True if completed
   */
  isScenarioCompleted(scenarioId) {
    const data = this.loadData();
    return data.completedScenarios.includes(scenarioId);
  }

  /**
   * Clear all stored data (reset)
   */
  clearAllData() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  /**
   * Clear only current progress (keep completed scenarios and preferences)
   */
  clearCurrentProgress() {
    const data = this.loadData();
    data.userProgress = {
      currentScenario: null,
      currentNode: null,
      choiceHistory: []
    };
    return this.saveData(data);
  }

  /**
   * Export user data as JSON string (for backup)
   * @returns {string} JSON string of all user data
   */
  exportData() {
    const data = this.loadData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import user data from JSON string
   * @param {string} jsonString - JSON data to import
   * @returns {boolean} Success status
   */
  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      const mergedData = this.mergeWithDefaults(data);
      return this.saveData(mergedData);
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Merge loaded data with default structure to handle missing properties
   * @param {Object} loaded - Data loaded from storage
   * @returns {Object} Merged data with all required properties
   */
  mergeWithDefaults(loaded) {
    const merged = { ...this.defaultState };
    
    if (loaded.userProgress) {
      merged.userProgress = { ...merged.userProgress, ...loaded.userProgress };
    }
    
    if (loaded.completedScenarios) {
      merged.completedScenarios = [...loaded.completedScenarios];
    }
    
    if (loaded.userPreferences) {
      merged.userPreferences = { ...merged.userPreferences, ...loaded.userPreferences };
    }
    
    if (loaded.statistics) {
      merged.statistics = { ...merged.statistics, ...loaded.statistics };
      if (loaded.statistics.strategiesUsed) {
        merged.statistics.strategiesUsed = { 
          ...merged.statistics.strategiesUsed, 
          ...loaded.statistics.strategiesUsed 
        };
      }
    }
    
    return merged;
  }

  /**
   * Get storage usage information
   * @returns {Object} Storage usage stats
   */
  getStorageInfo() {
    try {
      const data = this.loadData();
      const dataSize = JSON.stringify(data).length;
      const maxSize = 5 * 1024 * 1024; // 5MB typical localStorage limit
      
      return {
        usedBytes: dataSize,
        maxBytes: maxSize,
        percentUsed: (dataSize / maxSize) * 100,
        isNearLimit: (dataSize / maxSize) > 0.8
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  }

  /**
   * Announce changes to screen readers
   * @param {string} message - Message to announce
   */
  announceToScreenReader(message) {
    const announcer = document.getElementById('sr-announcements');
    if (announcer) {
      announcer.textContent = message;
      // Clear after a delay so the same message can be announced again
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  }
}

// Create global instance
window.storageManager = new StorageManager();