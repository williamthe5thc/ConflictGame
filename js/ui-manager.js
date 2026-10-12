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

    // Portrait SVG text by URL. Portraits are put into the page as inline
    // SVG so CSS can animate them (and switch that off for reduced motion).
    this.svgCache = new Map();
    
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
    
    // List every scenario; the ones not yet available show as "Coming soon".
    const available = new Set(this.gameEngine.getAvailableScenarios().map((s) => s.id));
    const scenarios = this.gameEngine.scenarioIndex?.scenarios || [];
    this.elements.scenarioList.innerHTML = '';
    
    scenarios.forEach(scenario => {
      const card = this.createScenarioCard(scenario, !available.has(scenario.id));
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
  createScenarioCard(scenario, comingSoon = false) {
    const card = document.createElement('button');
    card.className = 'scenario-card';
    card.setAttribute('data-scenario-id', scenario.id);
    
    const isCompleted = this.storage.isScenarioCompleted(scenario.id);
    // A scenario still being written is listed, but can't be started.
    if (comingSoon) {
      card.disabled = true;
      card.classList.add('coming-soon');
    }
    
    card.innerHTML = `
      <h3>${scenario.title} ${isCompleted ? '✓' : ''}</h3>
      <p>${scenario.description || 'Practice conflict resolution skills in this scenario.'}</p>
      <div class="scenario-meta">
        <span class="difficulty-badge ${scenario.difficulty}">${scenario.difficulty}</span>
        <span class="estimated-time">${scenario.estimatedTime || '5-10 min'}</span>
        ${isCompleted ? '<span class="completion-status">Completed</span>' : ''}
        ${comingSoon ? '<span class="coming-soon-badge">Coming soon</span>' : ''}
      </div>
    `;
    
    if (!comingSoon) {
      card.addEventListener('click', () => {
        this.startScenario(scenario.id);
      });
    }
    
    return card;
  }

  /**
   * Start a specific scenario
   */
  async startScenario(scenarioId) {
    try {
      this.showLoading();
      
      await this.gameEngine.loadScenario(scenarioId);
      await this.preloadPortraits();
      
      // Ensure loading is hidden before showing scenario
      this.hideLoading();
      this.hideWelcomeScreen();
      this.showScenarioDisplay();
      this.renderCurrentNode();
      
    } catch (error) {
      console.error('Error starting scenario:', error);
      this.hideLoading();
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

    // At an ending, show how the story turned out and a question to reflect on
    const ending = this.gameEngine.getEnding();
    if (ending) {
      this.renderEnding(container, ending);
    }
    
    this.elements.scenarioDisplay.appendChild(container);
    
    // Smooth transition
    container.classList.add('scene-transition');
    requestAnimationFrame(() => requestAnimationFrame(() => container.classList.add('active')));

    // After a choice near the bottom of a long page, bring the top of the
    // new scene into view, below the sticky header
    const header = document.querySelector('.app-header');
    const headerHeight = header ? header.offsetHeight : 0;
    const top = this.elements.scenarioDisplay.getBoundingClientRect().top;
    if (top < headerHeight) {
      window.scrollTo({
        top: Math.max(0, window.scrollY + top - headerHeight - 8),
        behavior: this.prefersReducedMotion() ? 'auto' : 'smooth'
      });
    }
    
    // Update back button state
    this.updateBackButton();
    
    // Announce to screen readers
    const announcement = ending
      ? `${nodeData.content.title || 'Ending'}. Ending: ${ending.title}. ${ending.description} Reflection: ${ending.reflection}`
      : `${nodeData.content.title || 'New scene'}. ${nodeData.choices ? nodeData.choices.length + ' choices available.' : ''}`;
    this.announceToScreenReader(announcement);
  }

  /**
   * Render the ending card: outcome, title, description and reflection
   */
  renderEnding(container, ending) {
    const outcomes = {
      success: { label: 'Positive outcome', note: 'This approach worked well for the people and the work.' },
      mixed: { label: 'Mixed outcome', note: 'Some things worked, and some came at a cost.' },
      failure: { label: 'Difficult outcome', note: 'This approach made things harder. It is worth seeing why.' }
    };
    const outcome = outcomes[ending.type] || { label: 'Outcome', note: '' };

    const card = document.createElement('section');
    card.className = 'ending-card';
    card.setAttribute('data-outcome', ending.type || 'mixed');
    card.setAttribute('aria-labelledby', 'ending-title');

    const eyebrow = document.createElement('div');
    eyebrow.className = 'ending-eyebrow';
    const kicker = document.createElement('span');
    kicker.className = 'ending-kicker';
    kicker.textContent = 'Ending reached';
    const badge = document.createElement('span');
    badge.className = 'ending-outcome';
    badge.textContent = outcome.label;
    eyebrow.append(kicker, badge);

    const title = document.createElement('h2');
    title.className = 'ending-title';
    title.id = 'ending-title';
    title.textContent = ending.title;

    const description = document.createElement('p');
    description.className = 'ending-description';
    description.textContent = ending.description;

    card.append(eyebrow, title, description);

    if (outcome.note) {
      const note = document.createElement('p');
      note.className = 'ending-note';
      note.textContent = outcome.note;
      card.appendChild(note);
    }

    if (ending.reflection) {
      const reflection = document.createElement('div');
      reflection.className = 'ending-reflection';
      const label = document.createElement('h3');
      label.textContent = 'Reflect';
      const question = document.createElement('p');
      question.textContent = ending.reflection;
      reflection.append(label, question);
      card.appendChild(reflection);
    }

    const actions = document.createElement('div');
    actions.className = 'ending-actions';
    const retry = document.createElement('button');
    retry.className = 'ending-button primary';
    retry.textContent = 'Go back and try another choice';
    retry.addEventListener('click', () => this.handleGoBack());
    const menu = document.createElement('button');
    menu.className = 'ending-button';
    menu.textContent = 'Choose another scenario';
    menu.addEventListener('click', () => this.showMainMenu());
    actions.append(retry, menu);
    card.appendChild(actions);

    container.appendChild(card);
  }

  /**
   * Fetch the scenario's portraits ahead of time, so the first scene can
   * show them inline straight away.
   */
  async preloadPortraits() {
    const characters = Object.values(this.gameEngine.currentScenario?.characters || {});
    await Promise.all(characters.filter((c) => c.portrait).map((c) => this.loadSvg(c.portrait)));
  }

  loadSvg(url) {
    if (!this.svgCache.has(url)) {
      const request = fetch(url)
        .then((response) => (response.ok ? response.text() : null))
        .catch(() => null);
      this.svgCache.set(url, request);
      request.then((text) => this.svgCache.set(url, text));
    }
    return Promise.resolve(this.svgCache.get(url));
  }

  /**
   * A decorative portrait: inline SVG when it has loaded, an image until then.
   */
  createPortrait(url, altText = '') {
    const holder = document.createElement('span');
    holder.className = 'portrait-svg';
    const put = (text) => {
      if (typeof text !== 'string' || !text.includes('<svg')) return false;
      holder.innerHTML = text;
      const svg = holder.querySelector('svg');
      svg.removeAttribute('role');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      return true;
    };
    if (!put(this.svgCache.get(url))) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = altText;
      holder.appendChild(img);
      this.loadSvg(url).then(put);
    }
    if (altText) {
      holder.setAttribute('role', 'img');
      holder.setAttribute('aria-label', altText);
    }
    return holder;
  }

  prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    // The slow drift continues from where it was, rather than restarting
    // with every scene.
    sceneBackground.style.setProperty('--drift-delay', `${-((performance.now() / 1000) % 120).toFixed(2)}s`);
    
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

    // The people in this scenario. Every line is narrated, so without this
    // the learner reads about Alex and Jordan but never sees who they are.
    const cast = Object.values(scenario?.characters || {}).filter((c) => c.portrait);
    if (cast.length) {
      const castStrip = document.createElement('ul');
      castStrip.className = 'cast-strip';
      castStrip.setAttribute('aria-label', 'People in this scenario');
      cast.forEach((character, index) => {
        const item = document.createElement('li');
        item.className = 'cast-member';
        // Each person breathes and blinks on their own rhythm
        item.style.setProperty('--i', index);
        const img = this.createPortrait(character.portrait);
        const text = document.createElement('div');
        const name = document.createElement('span');
        name.className = 'cast-name';
        name.textContent = character.name;
        const role = document.createElement('span');
        role.className = 'cast-role';
        role.textContent = character.role || '';
        text.append(name, role);
        item.append(img, text);
        castStrip.appendChild(item);
      });
      container.appendChild(castStrip);
    }

    // Character area (if speaker is not narrator)
    if (content.speaker && content.speaker !== 'narrator') {
      const characterArea = document.createElement('div');
      characterArea.className = 'character-area';
      
      const portrait = document.createElement('div');
      portrait.className = `character-portrait ${content.speaker}`;
      
      // Load character portrait if available
      const character = scenario?.characters?.[content.speaker];
      if (character && character.portrait) {
        portrait.appendChild(this.createPortrait(character.portrait, `${character.name} portrait`));
        
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
      
      choices.forEach((choice, index) => {
        const listItem = document.createElement('li');
        const button = this.createChoiceButton(choice, index);
        listItem.appendChild(button);
        choicesList.appendChild(listItem);
      });
      
      choicesContainer.appendChild(choicesList);
    } else {
      choices.forEach((choice, index) => {
        const button = this.createChoiceButton(choice, index);
        choicesContainer.appendChild(button);
      });
    }
    
    container.appendChild(choicesContainer);
  }

  /**
   * Create a choice button
   */
  createChoiceButton(choice, index = 0) {
    const button = document.createElement('button');
    button.className = 'choice-button';
    button.style.setProperty('--i', index);
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
    if (this.choosing) return;
    this.choosing = true;
    try {
      this.gameEngine.makeChoice(choiceId);
      await this.fadeOutScene();
      this.renderCurrentNode();
      
      // Show save status briefly
      this.showSaveStatus();
      
    } catch (error) {
      console.error('Error making choice:', error);
      this.showError('Error processing your choice. Please try again.');
    } finally {
      this.choosing = false;
    }
  }

  /**
   * Let the current scene fade out briefly before the next one comes in
   */
  fadeOutScene() {
    const current = this.elements.scenarioDisplay?.querySelector('.scene-transition');
    if (!current || this.prefersReducedMotion()) return Promise.resolve();
    current.classList.add('leaving');
    return new Promise((resolve) => setTimeout(resolve, 160));
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
    if (this.elements.progressBar) {
      this.elements.progressBar.setAttribute('aria-valuenow', Math.round(progress.progressPercent));
    }
    
    if (this.elements.progressText) {
      if (progress.isComplete) {
        this.elements.progressText.textContent = 'Scenario complete';
      } else {
        this.elements.progressText.textContent = `Choice ${progress.choicesMade + 1}`;
      }
    }
    
    // Update choice counter
    if (this.elements.choiceCounter) {
      this.elements.choiceCounter.textContent = progress.isComplete
        ? 'Ending reached'
        : `Choice ${progress.choicesMade + 1}`;
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
    console.log('UI Manager: Showing main menu');
    
    // Use centralized screen management
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
    console.log('UI Manager: Showing welcome screen');
    
    // Force hide all other screens first
    this.hideAllScreens();
    
    // Then show welcome screen
    if (this.elements.welcomeScreen) {
      this.elements.welcomeScreen.classList.remove('hidden');
      console.log('UI Manager: Welcome screen is now visible');
    } else {
      console.error('UI Manager: Welcome screen element not found!');
    }
  }

  hideWelcomeScreen() {
    this.elements.welcomeScreen?.classList.add('hidden');
  }

  showScenarioDisplay() {
    console.log('UI Manager: Showing scenario display');
    this.hideAllScreens();
    this.elements.scenarioDisplay?.classList.remove('hidden');
  }

  hideScenarioDisplay() {
    this.elements.scenarioDisplay?.classList.add('hidden');
  }

  showLoading() {
    console.log('UI Manager: Showing loading screen');
    this.hideAllScreens();
    this.elements.loadingScreen?.classList.remove('hidden');
  }

  hideLoading() {
    console.log('UI Manager: Hiding loading screen');
    this.elements.loadingScreen?.classList.add('hidden');
  }

  /**
   * Hide all screens - central screen management
   */
  hideAllScreens() {
    console.log('UI Manager: Hiding all screens');
    this.elements.welcomeScreen?.classList.add('hidden');
    this.elements.scenarioDisplay?.classList.add('hidden');
    this.elements.loadingScreen?.classList.add('hidden');
    this.elements.errorScreen?.classList.add('hidden');
  }

  showError(message) {
    console.log('UI Manager: Showing error screen');
    if (this.elements.errorMessage) {
      this.elements.errorMessage.textContent = message;
    }
    this.hideAllScreens();
    this.elements.errorScreen?.classList.remove('hidden');
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