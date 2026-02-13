# RepLift iOS - Guide Setup Mac

## Workflow Linux → Mac

### Sur Linux (avant connexion Mac)
```bash
# Après toute modification de code
npm run sync
# Ça fait : copie fichiers → sync iOS
```

### Sur Mac loué (MacInCloud)

#### 1️⃣ Premier jour - Installation (1-2h)
```bash
# Installer Xcode depuis App Store
# Accepter les licences
sudo xcodebuild -license accept

# Cloner le repo
git clone https://github.com/cmrabdu/Replift.git
cd Replift

# Installer dependencies
npm install

# Ouvrir dans Xcode
npm run open:ios
```

#### 2️⃣ Configuration Xcode (2-3h)

**Dans Xcode :**
1. Sélectionner projet "App" dans le navigateur gauche
2. Onglet "Signing & Capabilities"
3. Team : sélectionner ton compte Apple Developer
4. Bundle Identifier : `com.replift.app` (déjà configuré)
5. Cocher "Automatically manage signing"

**Certificats Apple (obligatoire) :**
- Aller sur https://developer.apple.com/account
- Certificates, Identifiers & Profiles
- Créer App ID : `com.replift.app`
- Xcode va générer les certificats automatiquement

#### 3️⃣ Assets (icônes + splash) - 1h

**Icône app (1024x1024px)** :
- Générer sur https://icon.kitchen ou https://appicon.co
- Glisser dans Xcode > Assets.xcassets > AppIcon

**Splash screen** :
- Fichier PNG simple avec logo RepLift
- Assets.xcassets > Splash

#### 4️⃣ Premier build test

```bash
# Sélectionner simulateur iPhone 15 Pro
# Cmd + R pour lancer
```

**Vérifier :**
- [ ] App s'ouvre
- [ ] localStorage fonctionne
- [ ] Tous les overlays s'ouvrent/ferment
- [ ] Charts s'affichent
- [ ] Swipe-to-close marche

#### 5️⃣ Build pour App Store

**Dans Xcode :**
1. Product > Archive (15-20 min)
2. Window > Organizer
3. Upload to App Store
4. Attendre traitement Apple (10-30 min)

#### 6️⃣ App Store Connect

**Sur https://appstoreconnect.apple.com :**
1. Créer nouvelle app
   - Nom : RepLift
   - Bundle ID : com.replift.app
   - SKU : replift001
2. Remplir infos :
   - Description
   - Mots-clés : musculation, workout, fitness, tracker
   - Catégorie : Santé & Fitness
   - Screenshots (obligatoire) :
     - iPhone 6.7" : 1290 × 2796 px
     - iPhone 6.5" : 1242 × 2688 px
     - Minimum 3 screenshots par taille
3. Privacy Policy URL (obligatoire)
4. Soumettre pour review

**Temps review Apple : 1-5 jours**

---

## Checklist complète 24h trial

### Avant de louer (sur Linux)
- [x] Capacitor installé
- [x] Config capacitor.config.json
- [x] Fichiers copiés dans www/
- [ ] Compte Apple Developer créé (99$)
- [ ] Icônes générées (1024x1024)

### Jour 1 - Mac (priorité absolue)
- [ ] Installer Xcode (1h)
- [ ] Cloner repo + npm install (10 min)
- [ ] Ouvrir projet Xcode (5 min)
- [ ] Config signing (30 min)
- [ ] Premier build simulateur (10 min)
- [ ] Ajout icônes (30 min)
- [ ] Archive + upload App Store (1h)

### Jour 2-7 - Buffer & soumission
- [ ] App Store Connect setup (2h)
- [ ] Screenshots (1-2h)
- [ ] Description + keywords (1h)
- [ ] Soumission review
- [ ] Attente review Apple

---

## Dépannage rapide

### "No signing identity found"
→ Aller sur developer.apple.com > Certificates > Créer

### "Bundle identifier already in use"
→ Changer en `com.replift.replift` ou `com.ton-nom.replift`

### "Provisioning profile doesn't match"
→ Xcode > Preferences > Accounts > Download Manual Profiles

### App crash au lancement sur device
→ Vérifier capacitor.config.json > webDir est bien "www"

---

## Commandes utiles

```bash
# Après modif code sur Linux
npm run sync

# Sur Mac : ouvrir Xcode
npm run open:ios

# Rebuild iOS après changement config
npx cap sync ios --deployment

# Voir logs device iOS
npx cap run ios --livereload
```

---

## Budget réel

- Apple Developer Program : **99$/an**
- MacInCloud : **25$/mois** (cancel après setup Codemagic)
- Icônes/assets : **0$** (outils gratuits)
- **Total mois 1 : 124$**
- **Mois 2+ : 0$** (avec Codemagic free tier)
