# RepLift 🏋️

> **Application de suivi d'entraînement musculation** — Simple. Rapide. Puissante.

PWA mobile-first en Vanilla JS pour suivre ses performances en salle, séance après séance. Interface dark élégante, zéro dépendance, offline-ready.

**v1.9.1** — 16 Février 2026 · ✅ Production Ready

---

## Table des matières

1. [Aperçu](#-aperçu)
2. [Fonctionnalités](#-fonctionnalités)
3. [Installation](#-installation)
4. [Architecture](#-architecture)
5. [Structure de données](#-structure-de-données)
6. [Design System](#-design-system)
7. [Déploiement](#-déploiement)
8. [Versioning & Changelog](#-versioning--changelog)
9. [Roadmap](#-roadmap)

---

## 🎯 Aperçu

| Métrique | Valeur |
|---|---|
| Fichiers source | 3 (HTML + CSS + JS) |
| Lignes totales | ~7 540 (657 + 3 685 + 3 195) |
| Dépendances | **0** — Vanilla JS, pas de build |
| Architecture | 3 couches (Data / Stats / UI) |
| Stockage | localStorage avec cache mémoire |
| Compatibilité | Mobile-first, PWA-ready (Capacitor iOS) |

---

## ✨ Fonctionnalités

### Core
- **Onboarding** — Flow 6 écrans : objectif, niveau, profil, fréquence, programmes starter
- **Programmes** — CRUD complet, duplication, suppression avec/sans séances
- **15 packs professionnels** — Organisés par catégorie × niveau, importables en 1 tap
- **Sessions avec Ghost Data** — Performances précédentes affichées en transparence
- **Timer de session** — Chronomètre live mm:ss
- **Historique paginé** — Navigation mois par mois

### Dashboard
- 7 métriques temps réel (séances/mois, volume, progression 30j, PRs, streak…)
- Calendrier heatmap navigable (12 mois, intensité par percentiles)

### Statistiques
- Volume total, intensité moyenne (kg/rep), balance Push/Pull
- Taux de progression sur 3 mois
- Records personnels par exercice
- Tendances semaine/mois comparatives
- Graphiques Canvas interactifs multi-périodes (7j → 1an) avec tooltip tactile

### Profil & Gamification
- Avatar emoji, bio, rang dynamique (Rookie → Légende)
- 18 achievements déblocables (séances, volume, streak, diversité, reps)
- Évolution mensuelle (meilleur mois, moyenne, ancienneté)

### UX/UI
- Dark theme glassmorphism, bottom navbar avec FAB gradient
- Swipe-to-close overlays, toast notifications, vibration haptique
- Greeting dynamique, lazy-loading pages
- Responsive 6 breakpoints, safe areas iPhone, touch targets 44px+

### Données
- Export/Import JSON (avec sanitisation XSS à l'import)
- Générateur de données test (3 programmes, 36 séances réalistes)
- Reset sécurisé (double confirmation)

---

## 🚀 Installation

```bash
git clone https://github.com/cmrabdu/Replift.git
cd RepLift

# Serveur local
python3 -m http.server 8000
# ou
npx http-server -p 8000

open http://localhost:8000
```

**Pas de compilation, pas de build.** Modifier → rafraîchir (F5).

### Tests manuels
1. Ouvrir en navigation privée
2. Profil → "Générer données de test"
3. Explorer dashboard, stats, graphiques, achievements

---

## 🏗️ Architecture

### Fichiers
```
RepLift/
├── index.html          657L   Structure HTML, overlays, onboarding, SVG sprite
├── style.css         3 685L   Dark theme, glassmorphism, responsive, animations
├── app.js            3 195L   Logique 3 couches + packs + onboarding
├── capacitor.config.json      Configuration Capacitor (iOS/Android)
├── package.json               Métadonnées + dépendances Capacitor
├── README.md                  Documentation
├── TODO.md                    Roadmap
├── EXPLICATIONS.md            Guide technique Capacitor
├── IOS_SETUP.md               Guide déploiement iOS
├── ONBOARDING.md              Spécifications onboarding
├── www/                       Build Capacitor
└── ios/                       Projet Xcode natif
```

### Couches logiques (app.js)

#### Utilitaires globaux (L1-33)
- `_uid()` — Générateur d'IDs anti-collision
- `_sessionVolume(s)` / `_exerciseVolume(ex)` — Calcul volume DRY
- `PROFILE_EMOJIS` — Constante partagée (onboarding + profil)

#### AppData — Persistance (L35-195)
Cache mémoire `_cache` + localStorage. CRUD programmes/sessions, copies défensives.

| Méthode | Rôle |
|---|---|
| `load()` / `save()` / `clear()` | CRUD localStorage |
| `invalidateCache()` | Purge cache AppData + memo AppStats |
| `saveRecentAchievements()` | Persiste les achievements récents |
| `addProgram()` / `updateProgram()` / `deleteProgram()` | CRUD programmes |
| `duplicateProgram()` / `deleteProgramWithSessions()` | Actions composées |
| `addSession()` / `deleteSession()` | CRUD séances |
| `getPrograms()` / `getSessions()` | Lecture avec copie défensive |
| `saveActiveSession()` / `loadActiveSession()` / `clearActiveSession()` | Persistance session PWA |

#### AppStats — Calcul pur, mémoïsé (L197-900)
Toutes les fonctions sont en **lecture seule** et **mémoïsées** via `_cached(key, fn)`. Le cache est invalidé par `clearMemo()` à chaque écriture dans AppData.

| Catégorie | Fonctions |
|---|---|
| Compteurs | `getTotalSessions`, `getSessionsThisMonth`, `getTotalVolume`, `getTotalReps` |
| Streaks | `getCurrentStreak`, `getWeeklyStreak` |
| Tendances | `getWeekStats`, `getMonthVolumeComparison`, `get30DayProgression` |
| Records | `getPersonalRecords`, `getPRsThisMonth` |
| Analyse | `getAverageIntensity`, `getMuscleBalance`, `getProgressionRate` |
| Dashboard | `getMonthlyVolume`, `getDaysSinceLastSession`, `getFavoriteExercises`, `getCalendarData` |
| Exercices | `getUniqueExercises`, `getExercisesForEvolution`, `getExerciseEvolution` |
| Profil | `getProfileSummary`, `getProfileEvolution` |
| Gamification | `getAchievements` (18 badges), `getRecentAchievements` (pure, sans effet de bord) |

#### PROGRAM_PACKS — Données (L905-1085)
15 packs structurés (Force / Hypertrophie / Endurance / Général / Perte de poids × 3 niveaux). Chaque pack contient N jours avec exercices pré-configurés.

#### AppUI — Présentation (L1090-3175)
Gestion DOM, événements, rendu, overlays, toast, timer, onboarding.

---

## 📊 Structure de données

**Clé localStorage** : `replift_data`

```json
{
  "version": "1.9.0",
  "programs": [{
    "id": "m1abc-xyz123456",
    "nom": "Push Day",
    "createdAt": "2026-02-10T10:00:00.000Z",
    "exercices": [
      { "nom": "Développé Couché", "series": [{ "poids": 80, "reps": 10 }] }
    ]
  }],
  "sessions": [{
    "id": "m1abd-def789012",
    "date": "2026-02-10T14:30:00.000Z",
    "programId": "m1abc-xyz123456",
    "programName": "Push Day",
    "exercices": [
      { "nom": "Développé Couché", "series": [{ "poids": 82.5, "reps": 10 }] }
    ]
  }],
  "user": {
    "name": "Maxime",
    "bio": "PPL 6x/sem",
    "emoji": "🔥",
    "onboardingDone": true,
    "goal": "hypertrophy",
    "level": "intermediate",
    "freq": 5
  },
  "recentAchievements": [
    { "id": "vol5k", "icon": "💪", "title": "Volume Rookie", "desc": "5 000 kg soulevés", "earned": true }
  ],
  "activeSession": null
}
```

| Champ | Note |
|---|---|
| `id` | Généré par `_uid()` (base36 timestamp + random) |
| `poids: 0` | Exercice au poids du corps (affiché "PDC") |
| `dates` | ISO 8601 UTC |
| `recentAchievements` | Cache dérivé (max 3), supprimé à l'import pour sécurité |

---

## 🎨 Design System

### Palette
```
Background    #0f0f0f     Surface       #1f1f1f
Border        #333333     Text          #ffffff
Text muted    #888888     Accent        #6a00ff (violet)
Success       #4ade80     Danger        #f87171
```

### Layout
- Container : max-width 600px centré
- Bottom nav : 80px fixe + FAB gradient central
- Overlays : full-screen slide-up
- Grid stats : 2 colonnes responsive

### Typographie
- System fonts (-apple-system, Segoe UI, Helvetica)
- Tailles fluides via `clamp()` (320px → 1200px)

---

## 📦 Déploiement

### Web (production-ready sans build)
Upload `index.html` + `style.css` + `app.js` sur tout serveur statique :
GitHub Pages, Netlify, Vercel, AWS S3, nginx, Apache.

### iOS (via Capacitor)
Voir [IOS_SETUP.md](IOS_SETUP.md) et [EXPLICATIONS.md](EXPLICATIONS.md).

---

## 🔢 Versioning & Changelog

Semantic Versioning : `MAJOR.MINOR.PATCH`

| Type | Quand |
|---|---|
| **MAJOR** | Breaking change (format données, refonte archi, suppression feature) |
| **MINOR** | Nouvelle fonctionnalité sans casser l'existant |
| **PATCH** | Bug fix, optimisation, nettoyage interne |

---

### v1.9.1 — 16 Février 2026

*ARCH-04 — Event Delegation*

**Refactor architecture**
- ⚡ **90 `onclick` inline → 0** : remplacés par `data-action` + dispatcher central
- ⚡ **`_initEventDelegation()`** : un seul listener `click` sur `document.body`
- ⚡ **`_actions` map** : 37 actions uniques, organisées par section
- ⚡ Concerne `app.js` (26 handlers dynamiques) et `index.html` (64 handlers statiques)
- ✅ Zéro changement fonctionnel — refactor interne pur

---

### v1.9.0 — 16 Février 2026

*Audit qualité — Sécurité, architecture, performance, nettoyage*

**Corrections critiques**
- 🔴 **`_uid()` complet** : `generateTestData()` utilise désormais `_uid()` au lieu de `Date.now().toString()`
- 🔴 **XSS import** : `importData()` supprime `recentAchievements` du JSON importé (recalculé depuis les données)
- 🔴 **AppStats pure** : `getRecentAchievements()` n'écrit plus dans AppData — l'écriture est déléguée à `AppUI.updateStats()` via `AppData.saveRecentAchievements()`

**Performance — Mémoïsation complète**
- ⚡ **22 fonctions AppStats mémoïsées** via `_cached()` (4 avant → 22 après)
- ⚡ Nouvelles clés : `totalSessions`, `currentStreak`, `uniqueExercises`, `achievements`, `weekStats`, `monthVolumeComparison`, `favoriteExercises`, `sessionsThisMonth`, `profileSummary`, `profileEvolution`, `exercisesForEvolution`, `monthlyVolume`, `30dayProgression`, `prsThisMonth`, `calendar_Y_M`, `averageIntensity`, `muscleBalance`, `progressionRate`
- ⚡ **Double `getSessions()` corrigé** dans `getWeekStats()` (1 copie au lieu de 2)

**Nettoyage**
- 🟢 3 `.card:hover` morts supprimés des @media queries CSS
- 🟢 4 fonctions mortes supprimées d'AppStats (`getMaxWeight`, `getBestExercise`, `getLastSession`, `getAverageVolumePerSession`)
- 🟢 Nouvelle méthode `AppData.saveRecentAchievements()`

---

### v1.8.0 — 15 Février 2026

*Audit qualité — 9 corrections critiques et refactoring DRY*

**Corrections critiques**
- 🔴 UUID anti-collision : `_uid()` remplace `Date.now().toString()`
- 🔴 Invalidation mémo : `clearMemo()` dans `save()`

**Corrections importantes**
- 🟠 DRY volume : `_sessionVolume()` / `_exerciseVolume()` — 8 duplications éliminées
- 🟠 Perf programmes : pré-indexation `sessCountMap` (O(n) → O(n+m))
- 🟠 `deleteSeriesRow()` centralisé
- 🟠 CSS mort ~60 lignes `.card` retirées
- 🟠 `PROFILE_EMOJIS` partagé, `PROGRAM_PACKS` externalisé
- 🟠 Copies défensives `getSessions()` / `getPrograms()`

---

### v1.7.0 — 15 Février 2026

*Système de packs de programmes structurés*

- 15 packs professionnels (5 catégories × 3 niveaux)
- Overlay "Programmes préfaits" avec filtrage catégorie/niveau
- Onboarding amélioré : sélection de packs complets

---

### v1.6.0 — 15 Février 2026

*Onboarding complet pour nouveaux utilisateurs*

- Flow 6 écrans interactifs (objectif, niveau, profil, fréquence, programmes)
- Génération automatique de programmes starter selon profil
- Grille emoji interactive (28 avatars)

---

### v1.1.1 — 12 Février 2026

- Refonte swipe-to-close (threshold 180px, détection horizontale)
- Fix chart tooltip listener stacking (bind-once pattern)

---

### v1.1.0 — 11 Février 2026

*Refonte majeure — Dashboard, stats, profil, achievements*

- Dashboard 7 métriques + calendrier heatmap
- Page Stats complète avec graphiques Canvas
- Profil avec 18 achievements et système de rang
- Toast notifications, timer session, swipe-to-close, historique paginé
- Memoization AppStats, lazy-loading, migration données

---

### v1.0.1 — 10 Février 2026

- Responsive complet, 48 CSS variables, typographie fluide, safe areas iOS

---

### v1.0.0 — 10 Février 2026

- Release initiale : programmes, sessions, stats, graphiques Canvas, architecture 3 couches

---

## 📋 Roadmap

Voir [TODO.md](TODO.md).

**Prochaines priorités** :
1. Publication App Store iOS
2. PWA complète (Manifest + Service Worker)
3. Chronomètre de repos entre séries
4. Mode clair
5. Notes par séance
6. Tests unitaires (AppData + AppStats)

---

## 📄 Licence

MIT
