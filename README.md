# Conflict Management Training Simulator

A comprehensive interactive web-based conflict resolution training platform with realistic workplace scenarios, professional visual design, and evidence-based learning frameworks.

## 🎯 Overview

This application provides immersive conflict management training through three complete scenarios spanning beginner to advanced difficulty levels. Users practice the Thomas-Kilmann Conflict Management Model in realistic workplace situations with immediate feedback and the ability to explore multiple resolution approaches.

### ✨ Key Features

- **3 Complete Scenarios**: Email Misunderstanding, Resource Competition, Performance Gap
- **Progressive Difficulty**: Beginner → Intermediate → Advanced learning paths
- **Visual Novel Experience**: Professional character portraits and office environments
- **15+ Resolution Paths per Scenario**: Explore different conflict strategies
- **Go Back Functionality**: Safe experimentation without consequences
- **Immediate Learning Feedback**: Strategy identification and effectiveness ratings
- **Mobile Responsive Design**: Works seamlessly on all devices
- **Accessibility Complete**: Keyboard navigation and screen reader support

## 🎓 Learning Outcomes

### Thomas-Kilmann Conflict Management Strategies
- **🤝 Collaborating** - Win-win solutions through creative problem solving
- **⚖️ Compromising** - Balanced give-and-take approaches
- **🎯 Competing** - Direct, assertive conflict resolution
- **🤗 Accommodating** - Supportive, relationship-focused approaches
- **🚪 Avoiding** - Strategic disengagement and its consequences

### Essential Workplace Skills
- Active listening and mediation techniques
- Communication style awareness and adaptation
- Resource allocation and priority negotiation
- Performance management with empathy and accountability
- Team dynamics and relationship building

## 📚 Complete Scenario Library

### 1. The Email Misunderstanding (Beginner)
**Category**: Communication Conflicts  
**Time**: 5-8 minutes  
**Focus**: Email tone interpretation, communication styles, mediation skills

Navigate a workplace tension caused by different email communication styles between Alex (direct) and Jordan (collaborative). Learn when to intervene, how to facilitate understanding, and when face-to-face conversation works better than digital communication.

### 2. The Resource Competition (Intermediate) 
**Category**: Workload Disputes  
**Time**: 8-12 minutes  
**Focus**: Resource allocation, competing priorities, creative problem solving

Handle a situation where Maria (Marketing) and David (Product) both need designer Sam's time for urgent Friday deadlines. Practice interest-based negotiation, creative resource expansion, and collaborative prioritization.

### 3. The Performance Gap (Advanced)
**Category**: Performance Management  
**Time**: 10-15 minutes  
**Focus**: Performance coaching, empathy vs. accountability, team dynamics

Address Chris's declining performance while balancing personal challenges, team frustration, and business needs. Learn supportive leadership, difficult conversations, and how to maintain both empathy and accountability.

## 🎮 How to Use

### For Learners

1. **Choose a Scenario**: Start with beginner-level scenarios
2. **Read Carefully**: Pay attention to character emotions and context
3. **Make Choices**: Select responses that feel authentic to you
4. **Learn from Feedback**: Understand why different approaches work
5. **Experiment**: Use "Go Back" to try different strategies
6. **Reflect**: Consider how lessons apply to your real conflicts

### Keyboard Shortcuts

- **Numbers 1-5**: Quick choice selection
- **Backspace**: Go back to previous choice
- **Escape**: Return to main menu

## 🛠️ Technical Architecture

### File Structure

```
conflict-training-simulator/
├── index.html              # Main application entry point
├── css/
│   ├── styles.css          # Core styles and layout
│   └── components.css      # UI component styles
├── js/
│   ├── app.js             # Application initialization
│   ├── game-engine.js     # Core scenario logic
│   ├── ui-manager.js      # User interface management  
│   └── storage-manager.js # Local storage operations
├── scenarios/
│   ├── scenario-index.json # List of available scenarios
│   └── scenario-001.json   # Email Misunderstanding scenario
├── assets/
│   └── images/             # Character portraits and backgrounds
└── README.md              # This file
```

### Core Components

- **Game Engine**: Loads scenarios, manages decision trees, tracks choices
- **UI Manager**: Renders content, handles user interactions, manages view modes
- **Storage Manager**: Saves progress to browser localStorage
- **Scenario System**: JSON-based content for easy editing

### Browser Support

- **Primary**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **Accessibility**: Screen readers, keyboard navigation

## ✏️ Adding New Scenarios

### 1. Create Scenario JSON File

Create a new file in the `scenarios/` directory following this structure:

```json
{
  "id": "scenario-002",
  "metadata": {
    "title": "Your Scenario Title",
    "description": "Brief description of the conflict",
    "category": "communication|workload|performance",
    "difficulty": "beginner|intermediate|advanced",
    "estimatedTime": "X-Y minutes"
  },
  "characters": {
    "player": { "name": "You", "role": "Your Role" },
    "character1": { "name": "Name", "role": "Role", "description": "Description" }
  },
  "nodes": {
    "start": {
      "type": "scene",
      "content": {
        "title": "Scene Title",
        "text": "Scene description and dialogue",
        "speaker": "narrator|character_name"
      },
      "choices": [
        {
          "id": "choice_1",
          "text": "What the user sees",
          "strategy": "collaborating|compromising|competing|accommodating|avoiding|active_listening",
          "nextNode": "next_node_id"
        }
      ]
    }
  }
}
```

### 2. Update Scenario Index

Add your scenario to `scenarios/scenario-index.json`:

```json
{
  "id": "scenario-002", 
  "title": "Your Scenario Title",
  "category": "communication",
  "difficulty": "beginner",
  "unlocked": true,
  "file": "scenarios/scenario-002.json"
}
```

### 3. Test Your Scenario

1. Refresh the application
2. Your scenario should appear on the welcome screen
3. Test all decision paths and ensure choices lead to valid nodes
4. Verify feedback and learning outcomes are clear

## 🎨 Customization

### Visual Design

- **Colors**: Modify CSS variables in `css/styles.css`
- **Fonts**: Update font imports in `index.html` and CSS
- **Layout**: Adjust grid and flexbox styles in component files

### Content

- **Characters**: Add portrait images to `assets/images/characters/`
- **Backgrounds**: Add scene images to `assets/images/backgrounds/`
- **Audio**: Add ambient sounds to `assets/audio/` (optional)

### Functionality

- **New Strategies**: Extend the strategy system in `game-engine.js`
- **View Modes**: Create new display modes in `ui-manager.js`
- **Analytics**: Add usage tracking in `storage-manager.js`

## 🧪 Development Helpers

Open browser console and use these commands:

```javascript
debug()        // Show application state
resetApp()     // Clear all data and restart
exportData()   // Download progress backup
```

## 📈 Success Metrics

### MVP Goals

- ✅ Users can complete scenarios start to finish
- ✅ "Go back" functionality works reliably
- ✅ Interface is responsive on mobile devices  
- ✅ Progress auto-saves and restores correctly
- ✅ Code is maintainable for adding new scenarios

### Learning Effectiveness

- **Completion Rate**: Target >80% scenario completion
- **Engagement**: Average session >10 minutes
- **Replayability**: >30% try multiple paths
- **Learning**: Users can identify different conflict strategies

## 🤝 Contributing

### Content Contributors

1. Review existing scenarios for style and structure
2. Research conflict management best practices
3. Create realistic workplace scenarios
4. Test scenarios with actual users
5. Provide feedback on learning effectiveness

### Developers

1. Follow existing code patterns and naming conventions
2. Test on multiple browsers and devices
3. Maintain accessibility standards
4. Document new features and changes
5. Keep dependencies minimal (vanilla JS only)

## 📄 License

This project is designed for educational use. Feel free to adapt and extend for training purposes.

## 🆘 Support

For technical issues:
1. Check browser console for error messages
2. Verify all JSON files are valid
3. Test with a fresh browser session
4. Review the file structure matches the documentation

For content questions:
1. Review the Thomas-Kilmann Conflict Management Model
2. Study examples of effective workplace conflict resolution
3. Consider real scenarios from your workplace experience

## 🚧 Roadmap

### Phase 2 Enhancements
- Additional scenarios (Resource Competition, Performance Gap)
- Character portraits and background images
- Audio narration and ambient sounds
- Advanced progress analytics

### Phase 3 Features
- Multiplayer team scenarios
- Assessment and certification system
- Integration with learning management systems
- Mobile app versions

### Phase 4 Advanced
- AI-powered scenario generation
- Video-based scenarios with actors
- Virtual reality conflict simulations
- Research and data collection tools

---

**Built with ❤️ for better workplace communication**

*Ready to practice conflict resolution in a safe, judgment-free environment!*