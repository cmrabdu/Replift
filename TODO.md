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
- [ ] Chronomètre de repos entre séries (timer dédié par série)
- [ ] Notes par exercice/séance (commentaire libre)
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
