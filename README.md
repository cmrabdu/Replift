# RepLift 🏋️

> **Application web de suivi d'entraînement en musculation** — Simple. Rapide. Puissante.

RepLift est une application web minimaliste et performante pour suivre vos performances en musculation, séance après séance. Conçue mobile-first avec une interface dark élégante.

**📦 État actuel** : ✅ **Production Ready** — v1.6.0 (15 Février 2026)

---

## 🎯 Aperçu Rapide

- **3 fichiers** : HTML (644L) + CSS (~2400L) + JS (2915L) = ~5959 lignes totales
- **Zero dépendances** : Vanilla JavaScript, pas de build, pas de framework
- **Fonctionnel à 100%** : Programmes, sessions, historique, stats avancées, graphiques, achievements, onboarding
- **Performance optimale** : Cache mémoire, memoization stats, localStorage, rendu Canvas
- **Mobile-first** : Pensé pour utilisation en salle de sport
- **Code quality** : Architecture en couches, strict mode, protection XSS, null-safe DOM
- **PWA-ready** : Configuration Capacitor pour déploiement iOS/Android

---

## 🔢 Versioning

RepLift utilise **Semantic Versioning** : `MAJOR.MINOR.PATCH`

### Version actuelle : **v1.6.0**
*Dernière mise à jour : 15 Février 2026*

### Règles d'incrémentation

#### MAJOR (v2.0.0, v3.0.0...)
Changements **breaking** qui cassent le fonctionnement existant :
- Modification du format de données localStorage incompatible
- Refonte complète de l'architecture
- Suppression de fonctionnalités majeures
- Changement radical d'UI/UX qui bouleverse l'usage
- Migration vers un framework (React, Vue...)

#### MINOR (v1.1.0, v1.2.0...)
Nouvelles **fonctionnalités** sans casser l'existant :
- Ajout d'une nouvelle page (ex: Nutrition, Objectifs)
- Nouvelle feature majeure (ex: Chronomètre, Mode clair/sombre)
- Nouveau type de stats/graphique
- Nouvelles intégrations (export PDF, partage social)
- Amélioration significative d'une feature existante

#### PATCH (v1.0.1, v1.0.2...)
**Corrections** et petites améliorations :
- Bug fixes
- Correctifs CSS/UI mineurs
- Optimisations de performance
- Typos dans les textes
- Mises à jour de sécurité
- Ajustements responsive
- Amélioration de code interne sans impact utilisateur

### Exemples d'incrémentation

| Changement | Avant | Après | Raison |
|---|---|---|---|
| Fix bug générer données test | v1.0.0 | v1.0.1 | Bug fix = PATCH |
| Ajout responsive | v1.0.1 | v1.0.2 | Amélioration UI = PATCH |
| Ajout chronomètre de repos | v1.0.2 | v1.1.0 | Nouvelle feature = MINOR |
| Ajout mode clair | v1.1.0 | v1.2.0 | Nouvelle feature = MINOR |
| Refonte complète en React | v1.2.0 | v2.0.0 | Breaking change = MAJOR |

### Changelog

**v1.6.0** — 15 Février 2026

*Feature majeure — Onboarding complet pour nouveaux utilisateurs*

**Nouvelles fonctionnalités**
- ✨ **Onboarding interactif** complet pour première utilisation (6 écrans)
  - Écran 0 : Accueil et présentation
  - Écran 1 : Sélection objectif (Force, Hypertrophie, Endurance, Général, Perte de poids)
  - Écran 2 : Niveau d'expérience (Débutant, Intermédiaire, Avancé)
  - Écran 3 : Profil personnalisé (nom, avatar emoji avec grille de 28 emojis)
  - Écran 4 : Fréquence d'entraînement (1-7 séances/semaine avec compteur)
  - Écran 5 : Recommandation de programmes starter adaptés au profil
- ✨ Génération automatique de **programmes starter** selon profil utilisateur
  - Débutant Force : Full Body 3x (3 séances/semaine)
  - Intermédiaire Force : Upper/Lower Split (4 séances)
  - Avancé Force : PPL 6x (6 séances)
  - Hypertrophie : programmes adaptés par niveau
  - Endurance : circuits et HIIT
- ✨ Navigation onboarding fluide (Suivant/Retour/Passer)
- ✨ Indicateur de progression par écran (step indicator)
- ✨ Stockage préférences user avec flag `onboardingDone`
- ✨ Grille emojis interactive avec sélection visuelle

**Améliorations UX/UI**
- 🎨 Design onboarding moderne avec animations slide
- 🎨 Cards de choix avec hover states et feedback sélection
- 🎨 Compteur fréquence avec boutons +/- stylisés
- 🎨 Avatar preview live pendant la sélection

**Architecture**
- ⚡ Méthodes AppUI : `checkOnboarding()`, `showOnboarding()`, `updateObScreen()`
- ⚡ Gestion state onboarding : `obStep`, `obData` avec validation
- ⚡ Génération programmes conditionnelle selon profil
- ⚡ Migration données user avec flag `onboardingDone`

---

**v1.1.1** — 12 Février 2026

*Correctif critique — Bugfixes mobile UX*

**Corrections de bugs**
- 🐛 **Swipe-to-close refonte complète** : listeners sur `.overlay-header` uniquement
  - Empêche fermeture accidentelle lors du scroll ou typing dans inputs
  - Threshold augmenté 120px → 180px pour geste plus intentionnel
  - Détection horizontale (>30px cancels swipe) pour éviter faux positifs
  - Animation smooth exit avec translateY(100%)
  - Handler `touchcancel` ajouté pour cleanup
- 🐛 **Chart tooltip listener stacking fix** : bind-once pattern avec flag `_chartBound`
  - Data refs stockées sur canvas (`_cData`) pour éviter re-bind
  - Helpers `_findChartHit()` et `_showChartTip()` dédiés
  - Plus de listeners dupliqués lors re-render/changement période
- 🐛 `closeOverlay()` hide tooltip automatiquement (cleanup cohérent)
- 🐛 Swipe dismiss route via `closeOverlay()` au lieu de classList direct

---

**v1.1.0** — 11 Février 2026

*Refonte majeure — Dashboard redesign, UX overhaul, audit complet*

**Nouvelles fonctionnalités**
- ✨ Dashboard redesigné : 7 métriques (séances/mois, volume, progression 30j, PRs mois, dernière séance, série hebdo) + widget calendrier heatmap navigable
- ✨ Page Stats enrichie : métriques stratégiques (volume total, intensité moyenne, balance musculaire Push/Pull, taux progression), records personnels, tendances, évolution par exercice avec graphiques Canvas
- ✨ Page Profil complète : avatar emoji, bio éditable, 18 achievements déblocables, système de rang (Rookie → Légende), stats d'évolution mensuelle
- ✨ Système de **toast notifications** — remplace tous les `alert()` natifs
- ✨ **Timer de session** live (mm:ss) pendant les séances actives
- ✨ **Swipe-to-close** sur tous les overlays (geste pull-down)
- ✨ **Historique paginé** par mois avec navigation ← →
- ✨ **Duplication de programmes** (bouton "Dupliquer" dans l'édition)
- ✨ **Suppression programme + séances** associées (option dédiée)
- ✨ **Tooltip tactile** sur les graphiques Canvas (touch & hover)
- ✨ **Greeting dynamique** dans le header ("Bonjour, {nom}" selon l'heure)
- ✨ **Rang profil** basé sur les achievements (🆕 Rookie → 🏆 Légende)
- ✨ Hint "Tap pour voir le graphique" sur les exercices d'évolution
- ✨ Vibration haptique au lancement de séance (FAB)
- ✨ Version affichée dynamiquement dans le footer via `APP_VERSION`

**Améliorations architecture**
- ⚡ **Memoization** des calculs lourds (AppStats._cached) : getTotalVolume, getTotalReps, getPersonalRecords, getWeeklyStreak
- ⚡ Invalidation automatique du cache memo sur `invalidateCache()`
- ⚡ **Init optimisé** : seul le dashboard est rendu au démarrage, les autres pages en lazy-load
- ⚡ **Migration données** : `replift_recent_achievements` fusionné dans `replift_data` principal
- ⚡ Modèle de données enrichi : champs `version` et `recentAchievements`
- ⚡ Méthodes AppData nouvelles : `duplicateProgram()`, `deleteProgramWithSessions()`
- ⚡ Safe DOM helper `$()` — accès null-safe aux éléments

**Corrections de bugs**
- 🐛 Fix saveSession utilisait `placeholder` comme valeur réelle (auto-remplissage fantôme)
- 🐛 saveSession appelle maintenant `updateProfile()` après sauvegarde
- 🐛 Balance musculaire : liste Push/Pull enrichie (22+ exercices chaque)
- 🐛 Import données : validation stricte (objet + arrays requis)

**Améliorations UI/CSS**
- 🎨 Navbar glassmorphism avec backdrop-filter et FAB gradient
- 🎨 Header redesigné : plus fin, glassmorphism, greeting dynamique + brand
- 🎨 CSS variable `--color-primary: #6366f1` définie dans `:root`
- 🎨 Alias `--fs-xs`, `--fs-sm`, `--fs-base` ajoutés
- 🎨 Suppression CSS mort (`.favorites-*`)
- 🎨 Badge `.recent` avec animation pulse
- 🎨 Nouveaux composants CSS : toast, session-timer, profile-rank, historique-nav, chart-tooltip, evolution-item-hint
- 🎨 Labels traduits : "Série hebdo", "Activité", "Séances"

**v1.0.1** — 10 Février 2026
- 🎨 Refonte responsive complète
- ✅ Système de 48 CSS variables (couleurs, espacements, fonts)
- ✅ Typographie fluide avec `clamp()` (320px → 1200px+)
- ✅ 6 breakpoints (< 360px, tablets, desktop, > 1200px)
- ✅ Safe areas pour iPhone notch/Dynamic Island
- ✅ Touch targets minimum 44px (accessibilité)
- ✅ Gestion landscape, reduced motion, hover/touch
- ✅ CSS : 1018 → 1500 lignes
- ✅ Footer avec version + crédit
- 🐛 Fix iOS zoom sur inputs (font-size: 16px)

**v1.0.0** — 10 Février 2026
- ✨ Release initiale production-ready
- ✅ Programmes personnalisables (CRUD)
- ✅ Sessions avec ghost data
- ✅ Stats avancées (6 sections)
- ✅ Graphiques d'évolution Canvas
- ✅ Export/Import/Test data
- ✅ Architecture 3 couches (Data/Stats/UI)
- ✅ Protection XSS + cache optimisé

---

## ✨ Fonctionnalités

### 🎯 Core Features
- **Onboarding interactif** : Personnalisation profil et génération programmes starter (première utilisation)
- **Programmes personnalisables** : Création, modification, duplication, suppression (avec ou sans séances associées)
- **Sessions avec Ghost Data** : Démarrage de séance avec affichage des performances précédentes en transparence
- **Timer de session** : Chronomètre live mm:ss pendant l'entraînement
- **Historique paginé** : Navigation mois par mois avec détails (exercices, séries, poids, reps, volume)
- **Dashboard temps réel** : 7 métriques + calendrier heatmap navigable (12 mois)

### 📊 Statistiques Avancées
- **Page Stats dédiée** : Métriques stratégiques complètes
  - Volume total & Intensité moyenne (kg/rep)
  - Balance musculaire Push/Pull (22+ exercices reconnus par catégorie)
  - Taux de progression mensuel
  - Records personnels par exercice (poids max + date)
  - Tendances semaine/mois vs périodes précédentes
  - Évolution par exercice (progression %, trend, graphique interactif)
  - Achievements récents
  
- **Graphiques d'évolution** : Charts interactifs Canvas par exercice
  - Visualisation poids dans le temps avec tooltip tactile
  - Multi-périodes (7j, 30j, 3M, 6M, 1A)
  - Stats calculées (progression %, meilleure session, dernière session)

### 🏆 Profil & Gamification
- **Profil personnalisable** : Avatar emoji, nom, bio éditable
- **18 Achievements** : Badges déblocables (séances, volume, streak, diversité, reps)
- **Système de rang** : 🆕 Rookie → 🌱 Débutant → ⚡ Confirmé → 🔥 Expert → 💎 Élite → 🏆 Légende
- **Évolution mensuelle** : Meilleur mois, moyenne mensuelle, ancienneté

### 🎨 Interface & UX
- **Thème dark optimisé** : Palette `#0f0f0f` / `#1f1f1f` avec accents violets
- **Glassmorphism** : Navbar et header avec backdrop-filter
- **Navigation fluide** : Bottom navbar avec FAB gradient + vibration haptique
- **Toast notifications** : Feedback non-bloquant pour toutes les actions
- **Swipe-to-close** : Geste pull-down pour fermer les overlays
- **Greeting dynamique** : "Bonjour/Bon après-midi/Bonsoir, {nom}"
- **Mobile-first responsive** : 6 breakpoints, safe areas iPhone, touch targets 44px+
- **Lazy-loading** : Seul le dashboard est rendu au démarrage

### 💾 Gestion des Données
- **localStorage natif** : Persistance locale (`replift_data`) avec cache mémoire + memoization
- **Export/Import JSON** : Backup avec validation stricte à l'import
- **Générateur de données test** : 3 programmes + 36 séances sur 3 mois avec progression réaliste
- **Reset sécurisé** : Double confirmation
- **Migration automatique** : Fusion des clés localStorage legacy dans le store principal

---

## 🏗️ Architecture

### Structure des Fichiers
```
RepLift/
├── index.html         (644 lignes)  — Structure HTML, 8 overlays + onboarding
├── style.css          (~2400 lignes) — Styles complets, dark theme, glassmorphism, responsive
├── app.js             (2915 lignes) — Logique en 3 couches, onboarding, memoization, toast, timer
├── capacitor.config.json — Configuration Capacitor (iOS/Android)
├── package.json       — Dépendances Capacitor
├── README.md          — Documentation complète
├── TODO.md            — Roadmap et backlog
├── EXPLICATIONS.md    — Guide technique Capacitor
├── IOS_SETUP.md       — Guide déploiement iOS
├── ONBOARDING.md      — Spécifications onboarding
├── www/               — Build Capacitor (HTML/CSS/JS copiés)
└── ios/               — Projet Xcode natif (généré par Capacitor)
```

### Architecture Logique (app.js)

#### 1️⃣ AppData — Couche de persistance
Gestion localStorage avec **cache intégré** et migration automatique.

**Méthodes principales** :
- `load()` / `save(data)` / `clear()` : CRUD localStorage
- `invalidateCache()` : Vide le cache AppData + AppStats memo
- `getDefaultData()` : Structure par défaut avec version, programmes, sessions, user, recentAchievements
- `addProgram()` / `updateProgram()` / `deleteProgram()` : CRUD programmes
- `duplicateProgram(id)` : Clone un programme avec suffixe " (copie)"
- `deleteProgramWithSessions(id)` : Supprime programme ET ses séances
- `addSession()` / `deleteSession()` : CRUD séances
- `getPrograms()` / `getSessions()` : Lecture avec cache
- `getSessionById()` / `getProgramById()` / `getLastSessionForProgram()` : Lookups

#### 2️⃣ AppStats — Couche de calcul (pur, memoized)
Fonctions de calcul sans effets de bord, avec **memoization** via `_cached(key, fn)`.

**Méthodes memoized** :
- `getTotalVolume()` / `getTotalReps()` : Agrégats globaux (memoized)
- `getPersonalRecords()` : Top 5 records par exercice (memoized)
- `getWeeklyStreak()` : Semaines consécutives d'activité (memoized)

**Méthodes standard** :
- `getSessionsThisMonth()` / `getMonthlyVolume()` : Stats du mois
- `get30DayProgression()` / `getPRsThisMonth()` / `getDaysSinceLastSession()` : Dashboard
- `getCurrentStreak()` / `getUniqueExercises()` : Activité
- `getAverageIntensity()` : Volume moyen par rep (kg/rep)
- `getMuscleBalance()` : Ratio Push/Pull (22+ exercices reconnus par catégorie)
- `getProgressionRate()` : Évolution % sur 3 mois
- `getWeekStats()` / `getMonthVolumeComparison()` : Tendances comparatives
- `getFavoriteExercises()` : Top 5 par fréquence
- `getExercisesForEvolution()` / `getExerciseEvolution()` : Données graphiques
- `getCalendarData()` : Données heatmap pour le calendrier
- `getAchievements()` : 18 achievements avec état earned/locked
- `getRecentAchievements()` : 3 derniers achievements (stockés dans données principales)
- `getProfileSummary()` / `getProfileEvolution()` : Stats profil
- `clearMemo()` : Invalidation du cache memoization

#### 3️⃣ AppUI — Couche de présentation
Gestion DOM, événements, rendu visuel, overlays, toast, timer.

**Navigation & Core** :
- `switchPage()` / `switchSeanceTab()` : Navigation pages et onglets
- `openOverlay()` / `closeOverlay()` : Gestion des 7 overlays modaux
- `setupSwipeToClose()` : Geste pull-down sur overlays
- `updateGreeting()` : Greeting dynamique dans le header
- `showToast(msg, duration)` : Notification non-bloquante
- `$(id)` : Accès DOM null-safe

**Dashboard** :
- `updateDashboard()` : 7 métriques + calendrier
- `renderCalendar()` / `navigateCalendar()` : Heatmap navigable

**Programmes** :
- `updatePrograms()` : Liste programmes avec stats
- `openCreateProgram()` / `openEditProgram()` : Formulaire CRUD
- `duplicateCurrentProgram()` : Duplication
- `deleteCurrentProgram()` / `deleteCurrentProgramWithSessions()` : Suppression

**Sessions** :
- `openStartSession()` : Sélection programme + vibration
- `startSession()` : Démarrage avec ghost data + timer
- `saveSession()` : Sauvegarde (validation stricte, pas de placeholders)
- `startSessionTimer()` / `stopSessionTimer()` : Chronomètre live

**Historique** :
- `updateHistorique()` : Liste paginée par mois
- `navigateHistorique()` : Navigation ← →
- `viewSession()` / `deleteCurrentSession()` : Détail et suppression

**Stats & Graphiques** :
- `updateStats()` : Rendu complet de la page Stats
- `openExerciseChart()` / `drawExerciseChart()` : Graphiques Canvas avec tooltip tactile

**Profil & Onboarding** :
- `updateProfile()` : Avatar, rang, achievements, évolution
- `openAllAchievements()` : Vue complète 18 achievements
- `openEditProfile()` / `saveProfile()` : Édition profil
- `checkOnboarding()` / `showOnboarding()` : Flow première utilisation
- `onboardingNext()` / `onboardingPrev()` : Navigation écrans
- `onboardingSelect()` / `onboardingFreq()` : Gestion sélections
- `populateObEmojis()` / `pickObEmoji()` : Grille avatars
- `finishOnboarding()` : Génération programmes starter + sauvegarde profil

**Données** :
- `exportData()` / `importData()` / `resetData()` / `generateTestData()`

---

## 📊 Structure de Données (localStorage)

**Clé** : `replift_data`

```javascript
{
  "version": "1.1.0",
  "programs": [
    {
      "id": "1707567890123",
      "nom": "Push Day",
      "createdAt": "2026-02-10T10:00:00.000Z",
      "exercices": [
        {
          "nom": "Développé Couché",
          "series": [
            { "poids": 80, "reps": 10 },
            { "poids": 85, "reps": 8 },
            { "poids": 85, "reps": 7 }
          ]
        }
      ]
    }
  ],
  "sessions": [
    {
      "id": "1707567891234",
      "date": "2026-02-10T14:30:00.000Z",
      "programId": "1707567890123",
      "programName": "Push Day",
      "exercices": [
        {
          "nom": "Développé Couché",
          "series": [
            { "poids": 82.5, "reps": 10 },
            { "poids": 87.5, "reps": 8 }
          ]
        }
      ]
    }
  ],
  "user": {
    "name": "Maxime",
    "bio": "Push Pull Legs 6x/sem",
    "emoji": "🔥",
    "onboardingDone": true,
    "goal": "hypertrophy",
    "level": "intermediate",
    "freq": 5
  },
  "recentAchievements": [
    { "id": "vol5k", "icon": "💪", "title": "Volume Rookie", "desc": "5 000 kg soulevés", "earned": true }
  ]
}
```

### Notes sur les données
- **version** : Champ de version pour migrations futures
- **poids = 0** : Indique un exercice au poids du corps (affiché comme "PDC")
- **IDs** : Timestamp en millisecondes pour unicité
- **dates** : Format ISO 8601 UTC
- **user** : Profil avec nom, bio, emoji avatar + préférences onboarding (goal, level, freq, onboardingDone)
- **recentAchievements** : 3 derniers achievements débloqués (fusionnés dans le store principal depuis v1.1.0)
- **Cache** : AppData maintient un cache mémoire + AppStats memoize les calculs lourds

---

## 💻 Technologies

### Stack
- **HTML5** : Structure sémantique (293 lignes)
- **CSS3** : Styles modernes (Grid, Flexbox, animations, variables)
- **JavaScript ES6+** : Vanilla JS avec `'use strict'`, `const/let`, arrow functions
- **Canvas API** : Graphiques d'évolution custom
- **localStorage API** : Persistance locale avec cache optimisé

### Caractéristiques techniques
- ✅ **Zero dependencies** : Pas de frameworks, pas de build
- ✅ **Performance optimale** : Cache en mémoire pour éviter JSON.parse répétés
- ✅ **Sécurité** : Protection XSS avec échappement des attributs HTML
- ✅ **Code quality** : Strict mode, pas de `var`, séparation des responsabilités
- ✅ **Mobile-first** : Interface pensée pour utilisation en salle
- ✅ **Offline-ready** : Fonctionne sans connexion (localStorage)

---

## 🎨 Design System

### Palette de Couleurs
```css
--background:    #0f0f0f   /* Fond principal */
--surface:       #1f1f1f   /* Cartes et conteneurs */
--surface-dark:  #1a1a1a   /* Surfaces alternatives */
--border:        #333333   /* Bordures */
--text-primary:  #ffffff   /* Texte principal */
--text-muted:    #888888   /* Texte secondaire */
--accent:        #6a00ff   /* Violet (actions) */
--success:       #4ade80   /* Vert (progression positive) */
--danger:        #f87171   /* Rouge (actions destructives) */
```

### Layout
- **Container principal** : Max-width 600px centré
- **Grid responsive** : 2 colonnes pour stats cards
- **Bottom navigation** : 80px fixe avec FAB centrale
- **Overlays** : Full-screen avec animation slide-up
- **Padding** : 20px standard, 16px cards

### Typographie
- **Font** : System fonts (-apple-system, Segoe UI, Helvetica)
- **Page title** : 1.3em bold
- **Card title** : 1.1em bold
- **Body** : 1em (16px base)
- **Labels** : 0.85em uppercase

---

## 🚀 Installation & Développement

### Lancement rapide
```bash
# Cloner le projet
git clone <repo-url>
cd RepLift

# Serveur local (Python)
python3 -m http.server 8000

# Ou avec Node.js
npx http-server -p 8000

# Ouvrir dans le navigateur
open http://localhost:8000
```

### Structure de développement
```
1. index.html  → Structure (pas de code inline)
2. style.css   → Styles complets et organisés
3. app.js      → Logique en 3 couches (Data/Stats/UI)
```

**Workflow** :
1. Modifier les fichiers directement
2. Rafraîchir le navigateur (F5)
3. Pas de compilation, pas de build

### Tests manuels
1. Ouvrir l'app en navigation privée (localStorage vide)
2. Aller dans Profil > "Générer données de test"
3. Explorer toutes les pages et fonctionnalités
4. Vérifier les graphiques avec différentes périodes

---

## 📦 Déploiement

### Production
L'application est **production-ready** sans build step :
- Upload des 3 fichiers (`index.html`, `style.css`, `app.js`) sur n'importe quel serveur statique
- Compatible avec : GitHub Pages, Netlify, Vercel, AWS S3, nginx, Apache

### Optimisations possibles (optionnelles)
- Minification CSS/JS (réduction ~30%)
- Service Worker pour PWA offline-first
- Compression Gzip/Brotli serveur

---

## 🐛 Corrections Historiques (Février 2026)

### v1.6.0 — Onboarding
- ✅ **Première utilisation** : Flow complet pour nouveaux utilisateurs
- ✅ **Programmes starter** : Génération automatique selon profil
- ✅ **Emoji picker** : Grille interactive 28 emojis

### v1.1.1 — Bugfixes mobile critiques
- ✅ **Swipe-to-close** : Refonte complète des listeners, threshold augmenté, détection horizontale
- ✅ **Chart tooltip** : Bind-once pattern pour éviter listener stacking
- ✅ **Cleanup overlays** : Fermeture cohérente avec tooltip hide

### v1.1.0 — Audit complet
- ✅ **saveSession** auto-remplissage fantôme (placeholder utilisé comme valeur réelle)
- ✅ **Balance musculaire** liste Push/Pull trop courte → enrichie (22+ exercices)
- ✅ **recentAchievements** isolé en clé séparée → fusionné dans données principales
- ✅ **CSS variables** `--color-primary`, `--fs-xs/sm/base` non définies → ajoutées à `:root`
- ✅ **CSS mort** `.favorites-*` supprimé
- ✅ **Import données** validation insuffisante → typage strict
- ✅ **alert() natifs** → remplacés par toast notifications

### v1.0.1 — Responsive
- ✅ iOS zoom sur inputs (font-size: 16px)
- ✅ generateTestData localStorage keys fix
- ✅ XSS via noms d'exercices
- ✅ Memory leak exportData
- ✅ Cache AppData, CSS dédupliqué, code modernisé

### v1.0.0 — Release initiale
- ✅ Architecture 3 couches, programmes, sessions, stats, graphiques Canvas

---

## 📋 Roadmap

Voir [TODO.md](TODO.md) pour la liste complète des fonctionnalités prévues.

### Prochaines priorités
1. **Publication App Store iOS** : Build Xcode, icônes, screenshots, soumission
2. **PWA complète** : Manifest + Service Worker pour installation web
3. **Chronomètre de repos** : Timer entre séries avec notifications
4. **Mode clair** : Toggle dark/light theme
5. **Notes par séance** : Champ commentaire libre
6. **Tests unitaires** : AppData et AppStats coverage

---

## 📄 Licence

MIT — Utilisation libre
