/**
 * GAME ENGINE - Core scenario management and decision tree navigation
 * Handles loading scenarios, tracking choices, and managing game state
 */

class GameEngine {
  constructor() {
    this.currentScenario = null;
    this.currentNode = 'start';
    this.choiceHistory = [];
    this.scenarioIndex = null;
    this.isLoading = false;
    
    // Initialize storage manager
    this.storage = window.storageManager;
    
    // Bind methods to preserve context
    this.makeChoice = this.makeChoice.bind(this);
    this.goBack = this.goBack.bind(this);
  }

  /**
   * Initialize the game engine
   */
  async initialize() {
    try {
      // Load scenario index
      await this.loadScenarioIndex();
      
      // Check for saved progress
      const savedProgress = this.storage.loadProgress();
      if (savedProgress) {
        console.log('Found saved progress:', savedProgress);
        return savedProgress;
      }
      
      return null;
    } catch (error) {
      console.error('Error initializing game engine:', error);
      throw error;
    }
  }

  /**
   * Load the scenario index file
   */
  async loadScenarioIndex() {
    try {
      const response = await fetch('scenarios/scenario-index.json');
      if (!response.ok) {
        throw new Error(`Failed to load scenario index: ${response.status}`);
      }
      this.scenarioIndex = await response.json();
      console.log('Loaded scenario index:', this.scenarioIndex);
    } catch (error) {
      console.error('Error loading scenario index:', error);
      // Create a fallback index with our sample scenario
      this.scenarioIndex = {
        scenarios: [
          {
            id: 'scenario-001',
            title: 'The Email Misunderstanding',
            category: 'communication',
            difficulty: 'beginner',
            unlocked: true,
            file: 'scenarios/scenario-001.json'
          }
        ],
        categories: [
          {
            id: 'communication',
            name: 'Communication Conflicts',
            description: 'Scenarios involving misunderstandings and information gaps'
          }
        ]
      };
    }
  }

  /**
   * Get list of available scenarios
   * @returns {Array} Array of scenario objects
   */
  getAvailableScenarios() {
    if (!this.scenarioIndex) {
      return [];
    }
    
    return this.scenarioIndex.scenarios.filter(scenario => {
      return scenario.unlocked || this.storage.isScenarioCompleted(scenario.id);
    });
  }

  /**
   * Load a specific scenario
   * @param {string} scenarioId - ID of scenario to load
   */
  async loadScenario(scenarioId) {
    this.isLoading = true;
    
    try {
      // Find scenario in index
      const scenarioInfo = this.scenarioIndex.scenarios.find(s => s.id === scenarioId);
      if (!scenarioInfo) {
        throw new Error(`Scenario ${scenarioId} not found in index`);
      }
      
      // Load scenario data
      const response = await fetch(scenarioInfo.file);
      if (!response.ok) {
        throw new Error(`Failed to load scenario: ${response.status}`);
      }
      
      const scenarioData = await response.json();
      
      // Validate scenario structure
      if (!this.validateScenario(scenarioData)) {
        throw new Error('Invalid scenario structure');
      }
      
      // Set current scenario
      this.currentScenario = scenarioData;
      this.currentNode = 'start';
      this.choiceHistory = [];
      
      console.log('Loaded scenario:', scenarioData.metadata.title);
      
      return scenarioData;
      
    } catch (error) {
      console.error('Error loading scenario:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Validate scenario structure
   * @param {Object} scenario - Scenario data to validate
   * @returns {boolean} True if valid
   */
  validateScenario(scenario) {
    try {
      // Check required properties
      if (!scenario.id || !scenario.metadata || !scenario.nodes) {
        console.error('Scenario missing required properties');
        return false;
      }
      
      // Check for start node
      if (!scenario.nodes.start) {
        console.error('Scenario missing start node');
        return false;
      }
      
      // Check that all choice nextNodes exist
      for (const [nodeId, node] of Object.entries(scenario.nodes)) {
        if (node.choices) {
          for (const choice of node.choices) {
            if (choice.nextNode && !scenario.nodes[choice.nextNode]) {
              console.error(`Choice ${choice.id} references missing node: ${choice.nextNode}`);
              return false;
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error validating scenario:', error);
      return false;
    }
  }

  /**
   * Make a choice and navigate to next node
   * @param {string} choiceId - ID of the choice made
   * @returns {Object} Next node data
   */
  makeChoice(choiceId) {
    if (!this.currentScenario || !this.currentNode) {
      throw new Error('No scenario loaded or current node');
    }
    
    const currentNodeData = this.getCurrentNode();
    if (!currentNodeData || !currentNodeData.choices) {
      throw new Error('Current node has no choices');
    }
    
    // Find the choice
    const choice = currentNodeData.choices.find(c => c.id === choiceId);
    if (!choice) {
      throw new Error(`Choice ${choiceId} not found`);
    }
    
    // Record choice in history
    this.choiceHistory.push({
      nodeId: this.currentNode,
      choiceId: choiceId,
      choiceText: choice.text,
      strategy: choice.strategy,
      timestamp: new Date().toISOString()
    });
    
    // Record strategy usage for statistics
    if (choice.strategy) {
      this.storage.recordStrategyUsage(choice.strategy);
    }
    
    // Move to next node
    this.currentNode = choice.nextNode;
    
    // Save progress
    this.storage.saveProgress(
      this.currentScenario.id,
      this.currentNode,
      this.choiceHistory
    );
    
    // Get next node data
    const nextNode = this.getCurrentNode();
    
    // Check if scenario is complete
    if (this.isScenarioComplete()) {
      this.storage.markScenarioComplete(this.currentScenario.id);
    }
    
    console.log(`Made choice: ${choice.text} -> ${this.currentNode}`);
    
    return nextNode;
  }

  /**
   * Go back to previous choice
   * @returns {Object} Previous node data or null if can't go back
   */
  goBack() {
    if (this.choiceHistory.length === 0) {
      console.log('No choices to go back from');
      return null;
    }
    
    // Remove last choice and go back to that node
    const lastChoice = this.choiceHistory.pop();
    this.currentNode = lastChoice.nodeId;
    
    // Save updated progress
    this.storage.saveProgress(
      this.currentScenario.id,
      this.currentNode,
      this.choiceHistory
    );
    
    console.log(`Went back to: ${this.currentNode}`);
    
    return this.getCurrentNode();
  }

  /**
   * Get current node data
   * @returns {Object} Current node data
   */
  getCurrentNode() {
    if (!this.currentScenario || !this.currentNode) {
      return null;
    }
    
    return this.currentScenario.nodes[this.currentNode];
  }

  /**
   * Get available choices for current node
   * @returns {Array} Array of choice objects
   */
  getAvailableChoices() {
    const currentNode = this.getCurrentNode();
    if (!currentNode || !currentNode.choices) {
      return [];
    }
    
    return currentNode.choices.filter(choice => {
      // Check if choice has requirements
      if (choice.requirements) {
        // Check previous choices requirement
        if (choice.requirements.previousChoices) {
          const previousChoiceIds = this.choiceHistory.map(h => h.choiceId);
          const hasRequired = choice.requirements.previousChoices.every(
            reqChoice => previousChoiceIds.includes(reqChoice)
          );
          if (!hasRequired) return false;
        }
        
        // Check forbidden choices requirement
        if (choice.requirements.forbiddenChoices) {
          const previousChoiceIds = this.choiceHistory.map(h => h.choiceId);
          const hasForbidden = choice.requirements.forbiddenChoices.some(
            forbiddenChoice => previousChoiceIds.includes(forbiddenChoice)
          );
          if (hasForbidden) return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Check if current scenario is complete
   * @returns {boolean} True if scenario is complete
   */
  isScenarioComplete() {
    const currentNode = this.getCurrentNode();
    return currentNode && currentNode.type === 'resolution';
  }

  /**
   * Can go back?
   * @returns {boolean} True if can go back
   */
  canGoBack() {
    return this.choiceHistory.length > 0;
  }

  /**
   * Get progress information
   * @returns {Object} Progress information
   */
  getProgress() {
    if (!this.currentScenario) {
      return null;
    }
    
    // Count total nodes (rough estimate of progress)
    const totalNodes = Object.keys(this.currentScenario.nodes).length;
    const currentProgress = this.choiceHistory.length + 1; // +1 for current node
    
    return {
      currentNode: this.currentNode,
      choicesMade: this.choiceHistory.length,
      progressPercent: Math.min((currentProgress / totalNodes) * 100, 100),
      canGoBack: this.canGoBack(),
      isComplete: this.isScenarioComplete()
    };
  }

  /**
   * Restart current scenario
   */
  restartScenario() {
    if (!this.currentScenario) {
      return;
    }
    
    this.currentNode = 'start';
    this.choiceHistory = [];
    
    // Save progress
    this.storage.saveProgress(
      this.currentScenario.id,
      this.currentNode,
      this.choiceHistory
    );
    
    console.log('Restarted scenario');
  }

  /**
   * Resume from saved progress
   * @param {Object} savedProgress - Progress data from storage
   */
  async resumeFromProgress(savedProgress) {
    try {
      await this.loadScenario(savedProgress.currentScenario);
      this.currentNode = savedProgress.currentNode;
      this.choiceHistory = savedProgress.choiceHistory || [];
      
      console.log('Resumed from saved progress');
      return this.getCurrentNode();
    } catch (error) {
      console.error('Error resuming from progress:', error);
      throw error;
    }
  }

  /**
   * Get scenario metadata
   * @returns {Object} Scenario metadata
   */
  getScenarioMetadata() {
    return this.currentScenario ? this.currentScenario.metadata : null;
  }

  /**
   * Get choice history for review
   * @returns {Array} Array of choice history objects
   */
  getChoiceHistory() {
    return [...this.choiceHistory];
  }
}

// Create global instance
window.gameEngine = new GameEngine();