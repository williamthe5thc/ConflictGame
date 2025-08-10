/**
 * UI MANAGER - Handle user interface rendering and interactions
 * Manages scenario display, choice presentation, and visual feedback
 */

class UIManager {
  constructor() {
    this.currentViewMode = 'visual-novel'; // or 'text-adventure'
    this.gameEngine = window.gameEngine;
    this.storage = window.storageManager;
    
    // DOM elements
    this.elements = {};
    
    // Initialize after DOM loads
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeElements());
    } else {
      this.initializeElements();
    }
  }

  /**
   * Initialize DOM element references and event listeners
   */
  initializeElements() {
    // Cache DOM elements
    this.elements = {
      welcomeScreen: document.getElementById('welcome-screen'),
      scenarioDisplay: document.getElementById('scenario-display'),
      loadingScreen: document.getElementById('loading-screen'),
      errorScreen: document.getElementById('error-screen'),
      
      scenarioList: document.getElementById('scenario-list'),
      progressBar: document.getElementById('progress-bar'),
      progressFill: document.getElementById('progress-fill'),
      progressText: document.getElementById('progress-text'),
      breadcrumbTrail: document.getElementById('breadcrumb-trail'),
      
      backBtn: document.getElementById('back-btn'),
      menuBtn: document.getElementById('menu-btn'),
      viewModeBtn: document.getElementById('view-mode-btn'),
      settingsBtn: document.getElementById('settings-btn'),
      retryBtn: document.getElementById('retry-btn'),
      
      choiceCounter: document.getElementById('choice-counter'),
      saveStatus: document.getElementById('save-status'),
      errorMessage: document.getElementById('error-message'),
      
      srAnnouncements: document.getElementById('sr-announcements')
    };
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load user preferences
    this.loadUserPreferences();
    
    console.log('UI Manager initialized');
  }

  /**
   * Set up event listeners for UI interactions
   */
  setupEventListeners() {
    // Back button
    if (this.elements.backBtn) {
      this.elements.backBtn.addEventListener('click', () => {
        this.handleGoBack();
      });
    }
    
    // Menu button
    if (this.elements.menuBtn) {
      this.elements.menuBtn.addEventListener('click', () => {
        this.showMainMenu();
      });
    }
    
    // View mode toggle
    if (this.elements.viewModeBtn) {
      this.elements.viewModeBtn.addEventListener('click', () => {
        this.toggleViewMode();
      });
    }
    
    // Retry button
    if (this.elements.retryBtn) {
      this.elements.retryBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e);
    });
  }

  /**
   * Load and apply user preferences
   */
  loadUserPreferences() {
    const preferences = this.storage.getUserPreferences();
    this.currentViewMode = preferences.viewMode || 'visual-novel';
    
    // Update view mode button
    if (this.elements.viewModeBtn) {
      this.elements.viewModeBtn.textContent = 
        this.currentViewMode === 'visual-novel' ? '📖' : '👁️';
      this.elements.viewModeBtn.setAttribute('aria-label', 
        `Switch to ${this.currentViewMode === 'visual-novel' ? 'text adventure' : 'visual novel'} mode`);
    }
  }

  /**
   * Display available scenarios on welcome screen
   */
  renderScenarioList() {
    if (!this.elements.scenarioList) return;
    
    const scenarios = this.gameEngine.getAvailableScenarios();
    this.elements.scenarioList.innerHTML = '';
    
    scenarios.forEach(scenario => {
      const card = this.createScenarioCard(scenario);
      this.elements.scenarioList.appendChild(card);
    });
    
    if (scenarios.length === 0) {
      this.elements.scenarioList.innerHTML = 
        '<p class="text-center">No scenarios available. Please check your connection.</p>';
    }
  }

  /**
   * Create a scenario selection card
   */
  createScenarioCard(scenario) {
    const card = document.createElement('button');
    card.className = 'scenario-card';
    card.setAttribute('data-scenario-id', scenario.id);
    
    const isCompleted = this.storage.isScenarioCompleted(scenario.id);
    
    card.innerHTML = `
      <h3>${scenario.title} ${isCompleted ? '✓' : ''}</h3>
      <p>${scenario.description || 'Practice conflict resolution skills in this scenario.'}</p>
      <div class="scenario-meta">
        <span class="difficulty-badge ${scenario.difficulty}">${scenario.difficulty}</span>
        <span class="estimated-time">${scenario.estimatedTime || '5-10 min'}</span>
        ${isCompleted ? '<span class="completion-status">Completed</span>' : ''}
      </div>
    `;
    
    card.addEventListener('click', () => {
      this.startScenario(scenario.id);
    });
    
    return card;
  }

  /**
   * Start a specific scenario
   */
  async startScenario(scenarioId) {
    try {
      this.showLoading();
      
      await this.gameEngine.loadScenario(scenarioId);
      
      this.hideWelcomeScreen();
      this.showScenarioDisplay();
      this.renderCurrentNode();
      
    } catch (error) {
      console.error('Error starting scenario:', error);
      this.showError('Failed to load scenario. Please try again.');
    }
  }

  /**
   * Render the current scenario node
   */
  renderCurrentNode() {
    const nodeData = this.gameEngine.getCurrentNode();
    if (!nodeData) {
      this.showError('Unable to load scenario content.');
      return;
    }
    
    // Update progress
    this.updateProgress();
    
    // Clear previous content
    this.elements.scenarioDisplay.innerHTML = '';
    
    // Create container based on view mode
    const container = document.createElement('div');
    container.className = this.currentViewMode === 'visual-novel' ? 
      'visual-novel-mode' : 'text-adventure-mode';
    
    // Render content based on node type
    if (this.currentViewMode === 'visual-novel') {
      this.renderVisualNovelMode(container, nodeData);
    } else {
      this.renderTextAdventureMode(container, nodeData);
    }
    
    // Add choices
    this.renderChoices(container, nodeData);
    
    // Add feedback if present
    if (nodeData.feedback) {
      this.renderFeedback(container, nodeData.feedback);
    }
    
    this.elements.scenarioDisplay.appendChild(container);
    
    // Smooth transition
    container.classList.add('scene-transition');
    setTimeout(() => container.classList.add('active'), 50);
    
    // Update back button state
    this.updateBackButton();
    
    // Announce to screen readers
    this.announceToScreenReader(
      `${nodeData.content.title || 'New scene'}. ${nodeData.choices ? nodeData.choices.length + ' choices available.' : ''}`
    );
  }

  /**
   * Render content in visual novel mode
   */
  renderVisualNovelMode(container, nodeData) {
    const { content } = nodeData;
    const scenario = this.gameEngine.currentScenario;
    
    // Scene background
    const sceneBackground = document.createElement('div');
    sceneBackground.className = 'scene-background';
    
    if (scenario && scenario.settings && scenario.settings.background) {
      // Load the SVG background
      const img = document.createElement('img');
      img.src = scenario.settings.background;
      img.alt = scenario.settings.location || 'Scene background';
      img.onload = () => {
        sceneBackground.classList.add('has-image');
        sceneBackground.setAttribute('data-location', scenario.settings.location || 'Office');
      };
      img.onerror = () => {
        console.warn('Failed to load background image, using placeholder');
        sceneBackground.classList.add('placeholder');
      };
      sceneBackground.appendChild(img);
    } else {
      sceneBackground.classList.add('placeholder');
    }
    
    container.appendChild(sceneBackground);
    
    // Character area (if speaker is not narrator)
    if (content.speaker && content.speaker !== 'narrator') {
      const characterArea = document.createElement('div');
      characterArea.className = 'character-area';
      
      const portrait = document.createElement('div');
      portrait.className = `character-portrait ${content.speaker}`;
      
      // Load character portrait if available
      const character = scenario?.characters?.[content.speaker];
      if (character && character.portrait) {
        const img = document.createElement('img');
        img.src = character.portrait;
        img.alt = `${character.name} portrait`;
        img.onload = () => {
          portrait.classList.remove('placeholder');
        };
        img.onerror = () => {
          console.warn(`Failed to load portrait for ${content.speaker}`);
          portrait.classList.add('placeholder');
        };
        portrait.appendChild(img);
        
        // Add character name tooltip
        const nameLabel = document.createElement('div');
        nameLabel.className = 'character-name';
        nameLabel.textContent = character.name;
        portrait.appendChild(nameLabel);
      } else {
        portrait.classList.add('placeholder');
      }
      
      characterArea.appendChild(portrait);
      container.appendChild(characterArea);
    }
    
    // Dialogue box
    const dialogueBox = document.createElement('div');
    dialogueBox.className = 'dialogue-box';
    
    if (content.speaker && content.speaker !== 'narrator') {
      const speakerName = document.createElement('div');
      speakerName.className = 'speaker-name';
      
      // Get character name from scenario data
      const character = scenario?.characters?.[content.speaker];
      const displayName = character ? character.name : content.speaker;
      const role = character ? character.role : '';
      
      speakerName.innerHTML = `
        <span class="speaker-name-text">${displayName}</span>
        ${role ? `<span class="speaker-role">${role}</span>` : ''}
      `;
      
      dialogueBox.appendChild(speakerName);
    }
    
    const dialogueText = document.createElement('div');
    dialogueText.className = 'dialogue-text';
    dialogueText.textContent = content.text;
    dialogueBox.appendChild(dialogueText);
    
    container.appendChild(dialogueBox);
  }

  /**
   * Render content in text adventure mode
   */
  renderTextAdventureMode(container, nodeData) {
    const { content } = nodeData;
    
    const storyText = document.createElement('div');
    storyText.className = 'story-text';
    
    if (content.title) {
      const title = document.createElement('h2');
      title.className = 'scene-title';
      title.textContent = content.title;
      storyText.appendChild(title);
    }
    
    const description = document.createElement('p');
    description.className = 'scene-description';
    description.textContent = content.text;
    storyText.appendChild(description);
    
    container.appendChild(storyText);
  }

  /**
   * Render available choices
   */
  renderChoices(container, nodeData) {
    const choices = this.gameEngine.getAvailableChoices();
    if (choices.length === 0) return;
    
    const choicesContainer = document.createElement('div');
    choicesContainer.className = this.currentViewMode === 'visual-novel' ? 
      'choices-panel' : 'choices-list';
    
    if (this.currentViewMode === 'text-adventure') {
      const choicesList = document.createElement('ol');
      choicesList.className = 'choice-options';
      
      choices.forEach(choice => {
        const listItem = document.createElement('li');
        const button = this.createChoiceButton(choice);
        listItem.appendChild(button);
        choicesList.appendChild(listItem);
      });
      
      choicesContainer.appendChild(choicesList);
    } else {
      choices.forEach(choice => {
        const button = this.createChoiceButton(choice);
        choicesContainer.appendChild(button);
      });
    }
    
    container.appendChild(choicesContainer);
  }

  /**
   * Create a choice button
   */
  createChoiceButton(choice) {
    const button = document.createElement('button');
    button.className = 'choice-button';
    button.textContent = choice.text;
    button.setAttribute('data-choice-id', choice.id);
    button.setAttribute('data-strategy', choice.strategy || '');
    
    button.addEventListener('click', () => {
      this.handleChoice(choice.id);
    });
    
    return button;
  }

  /**
   * Render feedback panel
   */
  renderFeedback(container, feedback) {
    const feedbackPanel = document.createElement('div');
    feedbackPanel.className = 'feedback-panel';
    
    // Header with strategy and effectiveness
    const header = document.createElement('div');
    header.className = 'feedback-header';
    
    const strategyBadge = document.createElement('div');
    strategyBadge.className = 'strategy-badge';
    strategyBadge.setAttribute('data-strategy', feedback.strategy);
    strategyBadge.textContent = this.formatStrategyName(feedback.strategy);
    
    const effectivenessRating = document.createElement('div');
    effectivenessRating.className = 'effectiveness-rating';
    effectivenessRating.setAttribute('data-level', feedback.effectiveness);
    effectivenessRating.textContent = this.formatEffectiveness(feedback.effectiveness);
    
    header.appendChild(strategyBadge);
    header.appendChild(effectivenessRating);
    feedbackPanel.appendChild(header);
    
    // Content
    const content = document.createElement('div');
    content.className = 'feedback-content';
    
    const explanation = document.createElement('p');
    explanation.className = 'explanation';
    explanation.textContent = feedback.explanation;
    content.appendChild(explanation);
    
    if (feedback.skillsUsed && feedback.skillsUsed.length > 0) {
      const skillsSection = document.createElement('div');
      skillsSection.className = 'skills-used';
      
      const skillsTitle = document.createElement('h4');
      skillsTitle.textContent = 'Skills Demonstrated:';
      skillsSection.appendChild(skillsTitle);
      
      const skillTags = document.createElement('ul');
      skillTags.className = 'skill-tags';
      
      feedback.skillsUsed.forEach(skill => {
        const tag = document.createElement('li');
        tag.className = 'skill-tag';
        tag.textContent = skill;
        skillTags.appendChild(tag);
      });
      
      skillsSection.appendChild(skillTags);
      content.appendChild(skillsSection);
    }
    
    feedbackPanel.appendChild(content);
    container.appendChild(feedbackPanel);
  }

  /**
   * Handle choice selection
   */
  async handleChoice(choiceId) {
    try {
      const nextNode = this.gameEngine.makeChoice(choiceId);
      this.renderCurrentNode();
      
      // Show save status briefly
      this.showSaveStatus();
      
    } catch (error) {
      console.error('Error making choice:', error);
      this.showError('Error processing your choice. Please try again.');
    }
  }

  /**
   * Handle go back action
   */
  handleGoBack() {
    if (!this.gameEngine.canGoBack()) {
      return;
    }
    
    try {
      this.gameEngine.goBack();
      this.renderCurrentNode();
      this.announceToScreenReader('Went back to previous choice');
      
    } catch (error) {
      console.error('Error going back:', error);
    }
  }

  /**
   * Update progress indicators
   */
  updateProgress() {
    const progress = this.gameEngine.getProgress();
    if (!progress) return;
    
    // Update progress bar
    if (this.elements.progressFill) {
      this.elements.progressFill.style.width = `${progress.progressPercent}%`;
    }
    
    if (this.elements.progressText) {
      if (progress.isComplete) {
        this.elements.progressText.textContent = 'Scenario Complete!';
      } else {
        this.elements.progressText.textContent = `Choice ${progress.choicesMade + 1}`;
      }
    }
    
    // Update choice counter
    if (this.elements.choiceCounter) {
      this.elements.choiceCounter.textContent = `Choice ${progress.choicesMade + 1}`;
    }
    
    // Update breadcrumbs
    this.updateBreadcrumbs();
  }

  /**
   * Update breadcrumb navigation
   */
  updateBreadcrumbs() {
    if (!this.elements.breadcrumbTrail) return;
    
    this.elements.breadcrumbTrail.innerHTML = '';
    
    const history = this.gameEngine.getChoiceHistory();
    const currentNode = this.gameEngine.getCurrentNode();
    
    // Add breadcrumb items
    history.forEach((choice, index) => {
      if (index > 0) {
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.textContent = '→';
        this.elements.breadcrumbTrail.appendChild(separator);
      }
      
      const item = document.createElement('button');
      item.className = 'breadcrumb-item';
      item.textContent = this.truncateText(choice.choiceText, 20);
      item.setAttribute('data-index', index);
      
      // Make clickable for going back
      item.addEventListener('click', () => {
        this.goBackToChoice(index);
      });
      
      this.elements.breadcrumbTrail.appendChild(item);
    });
    
    // Add current node
    if (currentNode) {
      if (history.length > 0) {
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.textContent = '→';
        this.elements.breadcrumbTrail.appendChild(separator);
      }
      
      const current = document.createElement('span');
      current.className = 'breadcrumb-item current';
      current.textContent = currentNode.content.title || 'Current';
      this.elements.breadcrumbTrail.appendChild(current);
    }
  }

  /**
   * Go back to a specific choice in history
   */
  goBackToChoice(targetIndex) {
    const history = this.gameEngine.getChoiceHistory();
    const stepsBack = history.length - targetIndex;
    
    for (let i = 0; i < stepsBack; i++) {
      if (!this.gameEngine.canGoBack()) break;
      this.gameEngine.goBack();
    }
    
    this.renderCurrentNode();
    this.announceToScreenReader(`Went back ${stepsBack} steps`);
  }

  /**
   * Update back button state
   */
  updateBackButton() {
    if (!this.elements.backBtn) return;
    
    const canGoBack = this.gameEngine.canGoBack();
    this.elements.backBtn.disabled = !canGoBack;
    this.elements.backBtn.textContent = canGoBack ? '← Go Back' : '← Start';
  }

  /**
   * Toggle between visual novel and text adventure modes
   */
  toggleViewMode() {
    this.currentViewMode = this.currentViewMode === 'visual-novel' ? 
      'text-adventure' : 'visual-novel';
    
    // Save preference
    this.storage.updatePreferences({ viewMode: this.currentViewMode });
    
    // Update button
    this.loadUserPreferences();
    
    // Re-render current node
    if (this.gameEngine.getCurrentNode()) {
      this.renderCurrentNode();
    }
    
    this.announceToScreenReader(`Switched to ${this.currentViewMode.replace('-', ' ')} mode`);
  }

  /**
   * Show main menu
   */
  showMainMenu() {
    // Ensure all other screens are hidden
    this.hideScenarioDisplay();
    this.hideLoading();
    this.elements.errorScreen?.classList.add('hidden');
    
    // Show welcome screen and load scenarios
    this.showWelcomeScreen();
    this.renderScenarioList();
  }

  /**
   * Show/hide different screens
   */
  /**
   * Show welcome screen
   */
  showWelcomeScreen() {
    console.log('Showing welcome screen');
    this.hideLoading();
    this.hideScenarioDisplay();
    this.elements.errorScreen?.classList.add('hidden');
    this.elements.welcomeScreen?.classList.remove('hidden');
  }

  hideWelcomeScreen() {
    this.elements.welcomeScreen?.classList.add('hidden');
  }

  showScenarioDisplay() {
    this.elements.scenarioDisplay?.classList.remove('hidden');
  }

  hideScenarioDisplay() {
    this.elements.scenarioDisplay?.classList.add('hidden');
  }

  showLoading() {
    this.elements.loadingScreen?.classList.remove('hidden');
    this.hideWelcomeScreen();
    this.hideScenarioDisplay();
    this.elements.errorScreen?.classList.add('hidden');
  }

  hideLoading() {
    this.elements.loadingScreen?.classList.add('hidden');
  }

  showError(message) {
    if (this.elements.errorMessage) {
      this.elements.errorMessage.textContent = message;
    }
    this.elements.errorScreen?.classList.remove('hidden');
    this.hideLoading();
    this.hideWelcomeScreen();
    this.hideScenarioDisplay();
  }

  /**
   * Show temporary save status
   */
  showSaveStatus() {
    if (this.elements.saveStatus) {
      this.elements.saveStatus.textContent = 'Saved ✓';
      this.elements.saveStatus.style.color = 'var(--success-green)';
      
      setTimeout(() => {
        this.elements.saveStatus.textContent = 'Auto-save';
        this.elements.saveStatus.style.color = '';
      }, 2000);
    }
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyboardNavigation(event) {
    // Only handle if not typing in an input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }
    
    switch (event.key) {
      case 'Escape':
        this.showMainMenu();
        break;
      case 'Backspace':
        if (this.gameEngine.canGoBack()) {
          event.preventDefault();
          this.handleGoBack();
        }
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        // Quick choice selection
        const choiceButtons = document.querySelectorAll('.choice-button');
        const index = parseInt(event.key) - 1;
        if (choiceButtons[index]) {
          event.preventDefault();
          choiceButtons[index].click();
        }
        break;
    }
  }

  /**
   * Utility functions
   */
  formatStrategyName(strategy) {
    const names = {
      collaborating: 'Collaborating',
      compromising: 'Compromising',
      competing: 'Competing',
      accommodating: 'Accommodating',
      avoiding: 'Avoiding',
      active_listening: 'Active Listening'
    };
    return names[strategy] || strategy;
  }

  formatEffectiveness(effectiveness) {
    const levels = {
      very_high: 'Very High',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      very_low: 'Very Low'
    };
    return levels[effectiveness] || effectiveness;
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  announceToScreenReader(message) {
    if (this.elements.srAnnouncements) {
      this.elements.srAnnouncements.textContent = message;
      setTimeout(() => {
        this.elements.srAnnouncements.textContent = '';
      }, 1000);
    }
  }
}

// Create global instance
window.uiManager = new UIManager();