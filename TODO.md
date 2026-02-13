# TODO — RepLift

## ✅ Fait — v1.0.0 (10 Fév 2026)
- [x] Séparation HTML/CSS/JS (3 fichiers propres)
- [x] Correction bugs critiques (generateTestData, localStorage keys)
- [x] Optimisation performance (cache AppData)
- [x] Nettoyage CSS (suppression duplications)
- [x] Sécurité (escAttr pour XSS)
- [x] Graphiques d'évolution par exercice
- [x] Stats complètes (records, tendances, favorites)
- [x] Système de programmes personnalisables
- [x] Historique des séances

## ✅ Fait — v1.0.1 (10 Fév 2026)
- [x] Refonte responsive complète (6 breakpoints, safe areas, touch targets)
- [x] Typographie fluide avec `clamp()`
- [x] 48 CSS variables (couleurs, espacements, fonts)
- [x] Fix iOS zoom sur inputs

## ✅ Fait — v1.1.0 (11 Fév 2026)

### Dashboard & Navigation
- [x] Dashboard redesigné : 7 métriques + calendrier heatmap navigable
- [x] Navbar glassmorphism + FAB gradient
- [x] Header fin avec greeting dynamique ("Bonjour, {nom}")
- [x] Labels traduits (Série hebdo, Activité, Séances)
- [x] Init optimisé : lazy-load pages au changement

### Stats & Données
- [x] Page Stats : métriques stratégiques (volume, intensité, balance, progression)
- [x] Balance musculaire Push/Pull enrichie (22+ exercices par catégorie)
- [x] Memoization calculs lourds (AppStats._cached)
- [x] Migration recentAchievements dans store principal
- [x] Import validation stricte (objet + arrays requis)

### Profil & Gamification
- [x] Page Profil : avatar emoji, bio, 18 achievements
- [x] Système de rang (Rookie → Légende)
- [x] Évolution mensuelle (meilleur mois, moyenne, ancienneté)

### Sessions & Programmes
- [x] Timer de session live (mm:ss)
- [x] Duplication de programmes
- [x] Suppression programme + ses séances
- [x] Fix saveSession : ne plus utiliser placeholders comme valeurs
- [x] saveSession appelle updateProfile()

### UX & Interface
- [x] Toast notifications (remplace tous les alert)
- [x] Swipe-to-close pour overlays
- [x] Vibration haptique sur FAB
- [x] Tooltip tactile sur graphiques Canvas
- [x] Historique paginé par mois
- [x] Hint "Tap pour voir le graphique" sur évolutions
- [x] Version dynamique dans le footer

### CSS & Architecture
- [x] `--color-primary`, `--fs-xs/sm/base` définis dans :root
- [x] CSS mort supprimé (.favorites-*)
- [x] Badge .recent avec animation pulse
- [x] Nouveaux composants (toast, timer, rank, pagination, tooltip)
- [x] Safe DOM helper $() null-safe
- [x] Modèle données enrichi (version, recentAchievements)

---

## ✅ Fait — v1.1.1 (11 Fév 2026)

### Bugfixes Critiques Mobile
- [x] **Swipe-to-close refonte complète** : listeners sur `.overlay-header` uniquement
  - Empêche fermeture accidentelle lors du scroll ou typing dans inputs
  - Threshold augmenté 120px → 180px
  - Détection horizontale (>30px cancels swipe)
  - Animation smooth exit avec translateY(100%)
  - Handler touchcancel ajouté
- [x] **Chart tooltip listener stacking fix** : bind-once pattern avec flag `_chartBound`
  - Data refs stockées sur canvas (`_cData`)
  - Helpers `_findChartHit()` et `_showChartTip()`
  - Plus de listeners dupliqués lors re-render/changement période
- [x] closeOverlay() hide tooltip automatiquement (cleanup cohérent)
- [x] Swipe dismiss route via closeOverlay() au lieu de classList direct

---

## 🚀 En Cours — v1.2.0 : Publication iOS App Store

### Setup Technique (11 Fév 2026) ✅
- [x] Installation Capacitor (@capacitor/core, @capacitor/cli, @capacitor/ios)
- [x] Initialisation projet : `npx cap init RepLift com.replift.app`
- [x] Configuration `capacitor.config.json` (webDir: www/)
- [x] Création dossier `www/` pour build Capacitor
- [x] Scripts npm automatisés (`npm run sync`)
- [x] .gitignore mis à jour (www/, ios/, android/)
- [x] Guide complet IOS_SETUP.md créé

### Avant Publication App Store ⏳
- [ ] **Compte Apple Developer créé + validé** (99$/an, 24-48h validation)
- [ ] **Icône app 1024x1024px** générée (icon.kitchen ou design custom)
- [ ] Splash screen iOS créé
- [ ] Privacy Policy rédigée (URL obligatoire App Store)

### Sur Mac Loué (MacInCloud 25$/mois ou trial 24h) 📅
- [ ] Installer Xcode + accepter licences
- [ ] Cloner repo GitHub sur Mac
- [ ] `npm install` + `npm run open:ios`
- [ ] Configuration signing & certificats Apple
- [ ] Ajout icônes + splash dans Assets.xcassets
- [ ] Premier build test simulateur iPhone
- [ ] Archive + upload vers App Store Connect
- [ ] Setup Codemagic (CI/CD gratuit pour builds futurs)

### App Store Connect 🏪
- [ ] Créer fiche app (nom, description, mots-clés)
- [ ] Screenshots 3 tailles obligatoires (6.7", 6.5", 5.5")
- [ ] Catégorie : Santé & Fitness
- [ ] Privacy Policy URL
- [ ] Soumission pour review (attente 1-5 jours)

### Post-Publication 🎯
- [ ] Cancel MacInCloud après setup Codemagic
- [ ] Push updates via Codemagic (500 min/mois gratuit)
- [ ] Monitoring reviews + feedback users

---

## ✅ Fait — v1.3.0 : Améliorations UX Terrain (13 Fév 2026)

### 🔴 P0 — Critique : Persistance session active
**Problème :** iOS PWA tue l'app en background → perte complète de la séance en cours  
**Solution :**
- [x] Auto-save session active dans localStorage toutes les 5s
- [x] Détection session en cours au reload (DOMContentLoaded)
- [x] Popup "Reprendre séance" ou "Abandonner" au démarrage
- [x] Migration modèle : `activeSession` dans store principal

### 🟠 P1 — Navigation pendant séance
**Problème :** Overlay full-screen bloque la navigation (impossible consulter stats/profil pendant séance)  
**Solution :**
- [x] Bouton "Minimiser" dans active-session overlay
- [x] Badge "Séance en cours" sur FAB (dot orange + durée)
- [x] Tap FAB → rouvre la session minimisée
- [x] Session continue en arrière-plan jusqu'à "Terminer" explicite

### 🟡 P2 — Timer de repos par série
**Problème :** Pas de chrono pour gérer les temps de repos entre séries  
**Solution :**
- [x] Bouton ⏱ sur chaque série pour lancer le timer
- [x] Barre de progression avec compteur + bouton "Passer"
- [x] Vibration à la fin du timer (200ms pattern)
- [x] Config temps de repos par exercice dans les programmes (30s/1min/1m30/2min/3min)
- [x] Stockage config dans modèle exercice : `{ nom, series, restTime: 90 }`

### 🟡 P2 — Notes par série
**Problème :** Impossible d'annoter les séries (ressenti, difficulté, ajustements)  
**Solution :**
- [x] Champ `note` dans modèle série : `{ poids, reps, note: "Difficile" }`
- [x] Input texte optionnel sous chaque série dans active-session
- [x] Affichage notes dans session-detail (historique) avec icône 📝
- [x] Auto-save notes dans captureActiveSessionState + resume

### 🟢 P3 — UI Polish
**Problème :** Badge exercices trop longs (noms peuvent faire 40+ caractères)  
**Solution :**
- [x] Limiter noms à 18 caractères max avec ellipsis (…) dans badge

---

## 🎯 À Faire — Prochaines versions

### UX & Interface
- [ ] Mode clair/sombre toggle
- [ ] Animations de transitions entre pages
- [x] ~~Swipe gestures pour navigation mobile~~ → Swipe-to-close (v1.1.0)
- [x] ~~Toast notifications au lieu d'alerts~~ → (v1.1.0)
- [x] ~~Vibration haptic feedback~~ → FAB vibration (v1.1.0)
- [ ] Loader/spinner pendant les opérations longues
- [ ] Scroll position préservée après retour overlay

### Fonctionnalités Séances
- [x] ~~Chronomètre de repos entre séries~~ → Timer intégré par série (v1.3.0)
- [x] ~~Notes par exercice/séance~~ → Notes par série (v1.3.0)
- [ ] Photos de progression (avant/après)
- [ ] Superset : lier 2 exercices consécutifs
- [ ] Historique des 3 dernières séances visible pendant session active
- [ ] Templates de séances rapides (workout vide prérempli)
- [x] ~~Timer de session~~ → (v1.1.0)

### Statistiques Avancées
- [ ] Graphiques multi-exercices (overlay comparaison)
- [x] ~~Heatmap calendrier~~ → Calendrier heatmap dans dashboard (v1.1.0)
- [x] ~~Volume par groupe musculaire~~ → Balance Push/Pull (v1.1.0)
- [x] ~~PRs automatiques avec notifications~~ → Records + toast (v1.1.0)
- [ ] Distribution poids/reps (scatter plot)
- [x] ~~Temps moyen par séance~~ → Timer live (v1.1.0)

### Gamification
- [ ] Système de niveaux (XP par séance)
- [x] ~~Achievements débloquables~~ → 18 achievements (v1.1.0)
- [x] ~~Streaks visuels~~ → Série hebdo + streak dashboard (v1.1.0)
- [x] ~~Leaderboard personnel~~ → Rang profil + meilleur mois (v1.1.0)

### Données & Export
- [ ] Backup automatique cloud (optionnel)
- [ ] Export PDF des stats mensuelles
- [ ] Export CSV pour analyse externe
- [ ] Import depuis autres apps (Strong, FitNotes)
- [x] ~~Version/migration automatique du format de données~~ → (v1.1.0)

### Technique
- [ ] Service Worker (PWA offline-first) + manifest.json
- [ ] Tests unitaires (AppData, AppStats)
- [ ] Migration vers modules ES6 (import/export)
- [ ] Minification/bundling production
- [ ] CI/CD pipeline
- [ ] TypeScript migration (optionnel)

---

## 🐛 Bugs Mineurs Connus
- [ ] Gestion date DST (changement d'heure été/hiver)
- [ ] Scroll position non préservée après retour overlay
- [x] ~~Canvas chart pixelation sur écrans HiDPI~~ → devicePixelRatio supporté (v1.0.1)
- [x] ~~Validation noms exercices (whitespace trim)~~ → trim ajouté (v1.0.0)

---

## 💡 Idées Futures
- Intégration IA : suggestions d'exercices basées sur historique
- Mode coach : programmes progressifs auto-générés
- Social : partage de programmes avec amis (QR code)
- Intégration wearables (Apple Watch, Garmin)
- Synthèse vocale pour guidage mains-libres
- Mode compétition : challenges entre utilisateurs
