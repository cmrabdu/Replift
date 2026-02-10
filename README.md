# RepLift 🏋️

> **Application web de suivi d'entraînement en musculation** — Simple. Rapide. Puissante.

RepLift est une application web minimaliste et performante pour suivre vos performances en musculation, séance après séance. Conçue mobile-first avec une interface dark élégante.

**📦 État actuel** : ✅ **Production Ready** — Toutes les fonctionnalités core implémentées et testées (Février 2026)

---

## 🎯 Aperçu Rapide

- **3 fichiers** : HTML (293L) + CSS (1018L) + JS (1308L) = 2619 lignes totales
- **Zero dépendances** : Vanilla JavaScript, pas de build, pas de framework
- **Fonctionnel à 100%** : Programmes, sessions, historique, stats avancées, graphiques
- **Performance optimale** : Cache en mémoire, localStorage, rendu Canvas
- **Mobile-first** : Pensé pour utilisation en salle de sport
- **Code quality** : Architecture en couches, strict mode, protection XSS

---

## ✨ Fonctionnalités

### 🎯 Core Features
- **Programmes personnalisables** : Création, modification, suppression de templates avec exercices et séries
- **Sessions avec Ghost Data** : Démarrage de séance avec affichage des performances précédentes en transparence
- **Historique complet** : Liste des séances avec détails (exercices, séries, poids, reps, volume)
- **Dashboard temps réel** : Stats automatiques (total séances, mois actuel, streak, poids max, meilleur exercice)

### 📊 Statistiques Avancées
- **Page Stats dédiée** : 6 sections complètes d'analyse
  - Volume & Performance (total, reps, moyenne par séance, exercices uniques)
  - Records personnels par exercice (poids max avec date)
  - Tendances (comparaison semaine/mois vs périodes précédentes)
  - Exercices favoris (classement par fréquence)
  - Évolution par exercice (progression, meilleur volume, dernière session)
  - Achievements/Badges (système de récompenses)
  
- **Graphiques d'évolution** : Charts interactifs par exercice avec Canvas
  - Visualisation volume/poids/reps dans le temps
  - Multi-périodes (7j, 30j, 3M, 6M, 1A)
  - Stats calculées (progression %, meilleure session, dernière session)

### 🎨 Interface & UX
- **Thème dark optimisé** : Palette `#0f0f0f` / `#1f1f1f` avec accents violets
- **Navigation fluide** : Bottom navbar avec FAB (Floating Action Button)
- **Overlays modaux** : Animations slide-up pour toutes les actions
- **Mobile-first** : Interface pensée pour la salle de sport (max-width: 600px)
- **Responsive** : Design adaptatif avec grid CSS

### 💾 Gestion des Données
- **localStorage natif** : Persistance locale (`replift_data`)
- **Export/Import JSON** : Backup et transfer de données
- **Générateur de données test** : Population rapide avec progression réaliste sur 3 mois
- **Reset sécurisé** : Réinitialisation avec confirmation

---

## 🏗️ Architecture

### Structure des Fichiers
```
RepLift/
├── index.html      (293 lignes)  — Structure HTML uniquement
├── style.css       (1018 lignes) — Styles complets, dark theme
├── app.js          (1308 lignes) — Logique complète en vanilla JS
├── README.md       — Documentation
└── TODO.md         — Roadmap et backlog
```

**Migration réalisée (Février 2026)** : Passage d'un fichier monolithique HTML de 2184 lignes à une architecture modulaire propre en 3 fichiers séparés.

### Architecture Logique (app.js)

#### 1️⃣ AppData — Couche de persistance
Gestion localStorage avec **cache intégré** pour optimisation des lectures répétées.

**Méthodes principales** :
- `load()` : Charger depuis localStorage
- `save(data)` : Sauvegarder dans localStorage
- `clear()` : Réinitialiser les données
- `invalidateCache()` : Vider le cache après modifications
- `addProgram(program)` : Ajouter un programme
- `updateProgram(id, data)` : Mettre à jour un programme
- `deleteProgram(id)` : Supprimer un programme
- `addSession(session)` : Ajouter une séance
- `getPrograms()` : Récupérer tous les programmes (avec cache)
- `getSessions()` : Récupérer toutes les séances (avec cache)
- `getSessionById(id)` : Récupérer une séance par ID
- `getProgramById(id)` : Récupérer un programme par ID
- `deleteSession(id)` : Supprimer une séance

#### 2️⃣ AppStats — Couche de calcul (pur)
Fonctions de calcul sans effets de bord, testables unitairement.

**Méthodes statistiques** :
- `getTotalSessions()` : Nombre total de séances
- `getSessionsThisMonth()` : Séances du mois actuel
- `getCurrentStreak()` : Streak de jours consécutifs d'entraînement
- `getMaxWeight()` : Poids maximum soulevé (exercice + poids)
- `getBestExercise()` : Exercice le plus pratiqué
- `getLastSessionDate()` : Date de la dernière séance
- `getTotalVolume()` : Volume total soulevé (kg)
- `getTotalReps()` : Répétitions totales
- `getAverageVolumePerSession()` : Volume moyen par séance
- `getUniqueExercises()` : Nombre d'exercices uniques pratiqués
- `getPersonalRecords()` : Records personnels par exercice
- `getWeekTrend()` : Tendance hebdomadaire (comparaison vs semaine précédente)
- `getMonthTrend()` : Tendance mensuelle (comparaison vs mois précédent)
- `getFavoriteExercises(n)` : Top N exercices favoris
- `getExercisesForEvolution()` : Liste des exercices avec stats de progression
- `getExerciseEvolution(exerciseName, period)` : Données d'évolution pour graphique
- `getBadges()` : Achievements débloqués

#### 3️⃣ AppUI — Couche de présentation
Gestion DOM, événements, rendu visuel, overlays.

**Navigation** :
- `switchPage(evt, pageName)` : Changement de page avec animation
- `switchSeanceTab(evt, tabName)` : Switch Programmes/Historique
- `openOverlay(id)` / `closeOverlay(id)` : Gestion des modales

**CRUD Programmes** :
- `openCreateProgram(programId)` : Ouvrir formulaire (création ou édition)
- `saveProgram()` : Sauvegarder programme
- `deleteCurrentProgram()` : Supprimer programme actif
- `addExerciseToForm()` : Ajouter un exercice au formulaire
- `addSeriesToExercise(index)` : Ajouter une série

**Sessions** :
- `openStartSession()` : Sélectionner un programme
- `startSession(programId)` : Démarrer une séance avec ghost data
- `saveSession()` : Terminer et sauvegarder séance
- `confirmCloseSession()` : Fermeture avec confirmation
- `viewSession(id)` : Afficher détails d'une séance
- `deleteCurrentSession()` : Supprimer séance active

**Statistiques & Charts** :
- `updateDashboard()` : Rafraîchir stats du dashboard
- `updateStats()` : Calculer et afficher toutes les stats de la page Stats
- `openExerciseChart(exerciseName)` : Ouvrir graphique d'évolution
- `switchChartPeriod(evt, period)` : Changer période du graphique
- `updateExerciseChart()` : Redessiner le graphique
- `drawChart(canvas, data, config)` : Rendu Canvas du graphique

**Données** :
- `exportData()` : Téléchargement JSON
- `importData()` : Upload et validation JSON
- `generateTestData()` : Génération de 3 mois de données réalistes
- `resetData()` : Reset complet avec confirmation

**Helpers** :
- `escAttr(str)` : Échappement sécurisé pour attributs HTML (protection XSS)
- `formatDate(dateString)` : Formatage dates FR

---

## 📊 Structure de Données (localStorage)

**Clé** : `replift_data`

```javascript
{
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
        },
        {
          "nom": "Dips",
          "series": [
            { "poids": 0, "reps": 15 },  // 0 = poids du corps
            { "poids": 0, "reps": 12 }
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
            { "poids": 87.5, "reps": 8 },
            { "poids": 87.5, "reps": 7 }
          ]
        },
        {
          "nom": "Dips",
          "series": [
            { "poids": 0, "reps": 16 },
            { "poids": 0, "reps": 13 }
          ]
        }
      ]
    }
  ],
  "user": {
    "name": ""
  }
}
```

### Notes sur les données
- **poids = 0** : Indique un exercice au poids du corps (affiché comme "PDC")
- **IDs** : Timestamp en millisecondes pour unicité
- **dates** : Format ISO 8601 UTC
- **Cache** : AppData maintient un cache en mémoire pour éviter JSON.parse répétés

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

## 🐛 Corrections Récentes (Février 2026)

### Bugs critiques corrigés
- ✅ **generateTestData** utilisait les mauvaises clés localStorage
- ✅ **switchSeanceTab/switchChartPeriod** utilisaient `event` implicite (deprecated)
- ✅ **Désync période graphique** : code sélectionnait 7j mais chargeait 30j
- ✅ **XSS via noms d'exercices** : apostrophes cassaient les onclick
- ✅ **Mutation tableau** : `getLastSession()` modifiait l'array original
- ✅ **Memory leak** : `exportData()` ne révoquait pas les object URLs

### Optimisations appliquées
- ✅ **Cache AppData** : Évite JSON.parse répétés (1x par cycle de rendu max)
- ✅ **CSS dédupliqué** : Suppression de 167 lignes de doublons
- ✅ **Code modernisé** : `var` → `const/let`, fonctions dupliquées supprimées
- ✅ **UX améliorée** : "PDC" au lieu de "0 kg" pour poids de corps

---

## 📋 Roadmap

Voir [TODO.md](TODO.md) pour la liste complète des fonctionnalités prévues.

### Prochaines priorités
1. **PWA complète** : Manifest + Service Worker pour installation mobile
2. **Chronomètre de repos** : Timer entre séries avec notifications
3. **Mode clair** : Toggle dark/light theme
4. **Notes par séance** : Champ commentaire libre
5. **Tests unitaires** : AppData et AppStats coverage

---

## 📄 Licence

MIT — Utilisation libre
