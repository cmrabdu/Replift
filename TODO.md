# TODO — RepLift

## ✅ Fait (Février 2026)
- [x] Séparation HTML/CSS/JS (3 fichiers propres)
- [x] Correction bugs critiques (generateTestData, localStorage keys)
- [x] Optimisation performance (cache AppData)
- [x] Nettoyage CSS (suppression duplications)
- [x] Sécurité (escAttr pour XSS)
- [x] Graphiques d'évolution par exercice
- [x] Stats complètes (records, tendances, favorites)
- [x] Système de programmes personnalisables
- [x] Historique des séances

---

## 🎯 Priorités

### UX & Interface
- [ ] Mode clair/sombre toggle
- [ ] Animations de transitions entre pages
- [ ] Swipe gestures pour navigation mobile
- [ ] Confirmation modale pour actions critiques (supprimer programme/séance)
- [ ] Loader/spinner pendant les opérations longues
- [ ] Toast notifications (non-blocking) au lieu d'alerts
- [ ] Vibration haptic feedback (mobile)

### Fonctionnalités Séances
- [ ] Chronomètre de repos entre séries
- [ ] Notes par exercice/séance (commentaire libre)
- [ ] Photos de progression (avant/après)
- [ ] Superset : lier 2 exercices consécutifs
- [ ] Historique des 3 dernières séances visible pendant session active
- [ ] Templates de séances rapides (workout vide prérempli)

### Statistiques Avancées
- [ ] Graphiques multi-exercices (overlay comparaison)
- [ ] Heatmap calendrier (fréquence d'entraînement)
- [ ] Volume par groupe musculaire
- [ ] PRs (personal records) automatiques avec notifications
- [ ] Distribution poids/reps (scatter plot)
- [ ] Temps moyen par séance

### Gamification
- [ ] Système de niveaux (XP par séance)
- [ ] Achievements débloquables (100 séances, 10k kg total, etc.)
- [ ] Streaks visuels (🔥 badges)
- [ ] Leaderboard personnel (meilleurs mois)

### Données & Export
- [ ] Backup automatique cloud (optionnel)
- [ ] Export PDF des stats mensuelles
- [ ] Export CSV pour analyse externe
- [ ] Import depuis autres apps (Strong, FitNotes)
- [ ] Version/migration automatique du format de données

### Technique
- [ ] Service Worker (PWA offline-first)
- [ ] Tests unitaires (AppData, AppStats)
- [ ] Migration vers modules ES6 (import/export)
- [ ] Minification/bundling production
- [ ] CI/CD pipeline
- [ ] TypeScript migration (optionnel)

---

## 🐛 Bugs Mineurs Connus
- [ ] Gestion date DST (changement d'heure été/hiver)
- [ ] Scroll position non préservée après retour overlay
- [ ] Canvas chart pixelation sur écrans HiDPI
- [ ] Validation noms exercices (whitespace trim)

---

## 💡 Idées Futures
- Intégration IA : suggestions d'exercices basées sur historique
- Mode coach : programmes progressifs auto-générés
- Social : partage de programmes avec amis (QR code)
- Intégration wearables (Apple Watch, Garmin)
- Synthèse vocale pour guidage mains-libres
- Mode compétition : challenges entre utilisateurs
