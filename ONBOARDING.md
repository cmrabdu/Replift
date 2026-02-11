# Onboarding Feature

## Overview
First-time user setup flow to personalize the app experience. Shows once on initial app launch, never again (unless user resets it).

## Current Status
- Not implemented yet
- Placeholder for future development

## Feature Requirements

### Data Collected
```javascript
{
  "user_prefs": {
    "sessions_per_week": 3,        // "3-4", "5-6", "7+
    "primary_goal": "strength",    // "mass", "strength", "cardio", "endurance"
    "muscle_groups": ["push", "pull", "legs"],  // Array
    "gender": "male",              // "male", "female", "other"
    "weight_kg": 80,               // Optional, for future body tracking
    "onboarding_completed": true,  // Flag to skip on next launch
    "onboarding_date": "2026-02-11T10:30:00Z"  // ISO string
  }
}
```

### Storage Key
`replift_user_prefs` in localStorage (separate from main `replift_data`)

### Questions Flow

**Screen 1: Welcome**
```
"Welcome to RepLift! Let's personalize your experience"
"Click Next to begin"
```

**Screen 2: Training Frequency**
```
"How many sessions per week do you typically train?"

Radio buttons:
○ 3-4 sessions/week
○ 5-6 sessions/week  
○ 7+ sessions/week (almost daily)
```

**Screen 3: Primary Goal**
```
"What's your main training goal?"

Radio buttons:
○ Build Muscle (Hypertrophy)
○ Increase Strength  
○ Improve Cardio
○ Build Endurance
```

**Screen 4: Muscle Groups**
```
"Which muscle groups do you focus on?"

Checkboxes (multi-select):
☐ Push (Chest, Shoulders, Triceps)
☐ Pull (Back, Biceps)
☐ Legs
☐ Full Body
```

**Screen 5: Personal Info**
```
"Tell us a bit about yourself (optional)"

Dropdown:
"Gender: [Male ▼]"

Number input:
"Current weight (kg): [80]"

Skip button available
```

**Screen 6: Confirmation**
```
"All set! Your personalized dashboard awaits."
"Let's get started" → Close overlay & show dashboard
```

### Implementation Steps

#### Step 1: Add UI to HTML
- Create `overlay-onboarding` div after header
- 6 screens with radio/checkbox inputs
- Navigation buttons (Next, Back, Skip, Start)

#### Step 2: Add CSS
- Style radio buttons, checkboxes
- Multi-screen navigation animation
- Progress indicator (1/6, 2/6, etc)

#### Step 3: Add JS Logic
Create `AppOnboarding` object:

```javascript
const AppOnboarding = {
  // Current screen (1-6)
  currentScreen: 1,
  
  // Form data
  formData: {
    sessions_per_week: null,
    primary_goal: null,
    muscle_groups: [],
    gender: "male",
    weight_kg: null
  },
  
  // Methods
  init() {
    // Check if prefs exist
    const prefs = localStorage.getItem('replift_user_prefs');
    if (!prefs) {
      this.show();
    }
  },
  
  show() {
    AppUI.openOverlay('overlay-onboarding');
    this.renderScreen(this.currentScreen);
  },
  
  renderScreen(screenNum) {
    // Hide all screens, show current
    // Update progress indicator
  },
  
  next() {
    if (this.validateScreen()) {
      this.currentScreen++;
      if (this.currentScreen > 6) {
        this.complete();
      } else {
        this.renderScreen(this.currentScreen);
      }
    }
  },
  
  back() {
    if (this.currentScreen > 1) {
      this.currentScreen--;
      this.renderScreen(this.currentScreen);
    }
  },
  
  skip() {
    // Use defaults
    this.complete();
  },
  
  complete() {
    // Save to localStorage
    this.formData.onboarding_completed = true;
    this.formData.onboarding_date = new Date().toISOString();
    localStorage.setItem('replift_user_prefs', JSON.stringify(this.formData));
    
    // Close overlay
    AppUI.closeOverlay('overlay-onboarding');
    
    // Update dashboard with personalized content
    AppUI.updateDashboard();
  },
  
  validateScreen() {
    // Check if current screen fields are filled
  }
};
```

#### Step 4: Init Call
In `AppUI.init()` after page load:
```javascript
AppOnboarding.init();
```

### Dashboard Adaptations

Once user prefs are available:

#### Weekly Streak (based on sessions_per_week)
```javascript
getWeeklyStreak() {
  const sessions = AppData.getSessions();
  const userPrefs = this.getUserPrefs();
  const minSessions = userPrefs.sessions_per_week === "3-4" ? 1 : 
                      userPrefs.sessions_per_week === "5-6" ? 2 : 3;
  
  // Count consecutive weeks with >= minSessions
}
```

#### Heatmap (12-week calendar)
```javascript
getActivityHeatmap() {
  // Returns grid of weeks with intensity color
  // Green = target met, Orange = partial, Red = missed
}
```

#### Volume This Month
```javascript
getMonthlyVolume() {
  // Sum all kg from sessions in current month
}
```

#### Progression %
```javascript
getProgression30d() {
  // Compare volume/reps last 30d vs previous 30d
  // Return +X% or -X%
}
```

#### PRs This Month
```javascript
getPRsThisMonth() {
  // Find new records created this month
}
```

#### Days Since Last Session
```javascript
getDaysSinceLastSession() {
  const lastSession = AppStats.getLastSessionDate();
  return Math.floor((Date.now() - lastSession) / (1000 * 60 * 60 * 24));
}
```

### Future Integration Points

- **Notifications**: Remind user if missed target weekly sessions
- **Recommendations**: Suggest variety if all sessions are same muscle group
- **Goals**: Track weight/body composition progress over time
- **Recovery**: Suggest rest days based on frequency
- **Export**: Include preferences in data export

### Testing Considerations

- Skip onboarding on load if `generateTestData()` is called
- Option in Profil > "Reset Onboarding" to show it again
- localStorage key `replift_skip_onboarding` for dev testing
