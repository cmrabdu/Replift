# Ce qu'on vient de faire — Explications simples 🎓

## Le problème de départ

**Tu avais :** Un site web (HTML + CSS + JS) qui tourne dans le navigateur  
**Tu voulais :** Une vraie app iOS sur l'App Store  

**Le problème :** Apple ne met PAS de sites web sur l'App Store. Il faut une "vraie app" buildée avec Xcode (leur outil).

---

## La solution : Capacitor

### C'est quoi Capacitor ?

**Imagine une boîte magique qui transforme ton site web en app mobile native.**

Plus précisément :
- Capacitor **emballe** ton code web (HTML/CSS/JS) dans une "coquille" iOS
- iOS voit une vraie app native (avec une icône, qui s'installe, etc.)
- À l'intérieur, c'est ton site web qui tourne (dans une webview invisible)
- Bonus : tu peux accéder aux fonctions natives (caméra, notifications, etc.) si besoin plus tard

**Analogie :** C'est comme mettre ta voiture (ton site web) sur un ferry (Capacitor) pour traverser la mer (vers l'App Store).

---

## Ce qu'on a fait concrètement aujourd'hui

### 1. Installation de Capacitor (la boîte magique)

**Commande :**
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
```

**Ce que ça fait :** Télécharge 3 outils :
- `@capacitor/core` : Le cerveau de Capacitor
- `@capacitor/cli` : Les commandes pour builder
- `@capacitor/ios` : La partie spécifique iOS

**Taille totale :** ~93 packages installés dans `node_modules/`

---

### 2. Initialisation du projet

**Commande :**
```bash
npx cap init RepLift com.replift.app --web-dir www
```

**Ce que ça fait :**
- Crée un fichier `capacitor.config.json` (la config de l'app)
- Déclare le nom de l'app : **RepLift**
- Déclare l'ID unique : **com.replift.app** (comme une plaque d'immatriculation pour Apple)
- Dit à Capacitor : "Mon code web est dans le dossier `www/`"

**Fichier créé : `capacitor.config.json`**
```json
{
  "appId": "com.replift.app",     ← ID unique Apple
  "appName": "RepLift",            ← Nom affiché sous l'icône
  "webDir": "www"                  ← Où est ton code web
}
```

---

### 3. Création du projet iOS

**Commande :**
```bash
npx cap add ios
```

**Ce que ça fait :**
- Crée un dossier `ios/` avec **tout le projet Xcode** dedans
- C'est un vrai projet iOS natif (comme si tu l'avais codé en Swift)
- Contient :
  - `App.xcodeproj` : Le fichier projet qu'Xcode va ouvrir
  - `App/App/` : Le dossier avec tes fichiers web dedans
  - Plein de config iOS (icônes, splash screens, permissions, etc.)

**Taille :** ~50 fichiers ajoutés dans `ios/`

---

### 4. Organisation des fichiers web

**Avant :**
```
RepLift/
├── index.html
├── app.js
├── style.css
```

**Maintenant :**
```
RepLift/
├── index.html           ← Fichiers source (tu modifies ici)
├── app.js
├── style.css
├── www/                 ← Copie pour Capacitor
│   ├── index.html
│   ├── app.js
│   └── style.css
└── ios/                 ← Projet Xcode complet
    └── App/
        └── App/
            └── public/  ← Tes fichiers web copiés automatiquement
```

**Pourquoi 2 copies (www/ et ios/) ?**
- `www/` : C'est la "source" que Capacitor lit
- `ios/App/App/public/` : C'est la copie finale que l'app iOS va charger

---

### 5. Automatisation avec npm scripts

**Problème :** À chaque modif de code, tu dois :
1. Copier `index.html`, `app.js`, `style.css` vers `www/`
2. Lancer `npx cap sync ios` pour mettre à jour le projet iOS

**Solution :** Scripts npm dans `package.json`

```json
"scripts": {
  "copy": "cp index.html app.js style.css www/",
  "sync": "npm run copy && npx cap sync ios"
}
```

**Utilisation simple :**
```bash
npm run sync
```
→ Copie tout + sync iOS en une commande

---

## Workflow final

### 1. Développement sur Linux (maintenant)

```bash
# Tu modifies ton code
nano app.js  # (ou VSCode)

# Tu synchronises
npm run sync

# Commit
git add .
git commit -m "Nouvelle feature"
git push
```

### 2. Build iOS sur Mac (bientôt)

```bash
# Sur le Mac loué (MacInCloud)
git clone https://github.com/cmrabdu/Replift.git
cd Replift
npm install

# Ouvrir dans Xcode
npm run open:ios

# Dans Xcode : cliquer sur "Play" → l'app se lance
# Archive + upload vers App Store
```

### 3. À chaque update future

**Option A : Si tu as encore le Mac loué**
```bash
# Modifier code → npm run sync
# Ouvrir Xcode → Archive → Upload
```

**Option B : Avec Codemagic (gratuit)**
```bash
# Modifier code → git push
# Codemagic build automatiquement iOS dans le cloud
# Télécharger le .ipa prêt pour l'App Store
```

---

## Ce qui se passe VRAIMENT quand l'app iOS tourne

1. L'utilisateur tape sur l'icône RepLift
2. iOS lance l'app (code Swift/Objective-C minimal)
3. L'app ouvre une **webview** (mini navigateur invisible)
4. La webview charge `ios/App/App/public/index.html`
5. Ton JavaScript (`app.js`) s'exécute
6. localStorage fonctionne normalement
7. L'utilisateur utilise RepLift

**C'est exactement comme ton site web, mais dans une coquille iOS.**

---

## Vocabulaire important

| Terme | Explication simple |
|-------|-------------------|
| **Capacitor** | Outil qui transforme un site web en app mobile |
| **Xcode** | L'éditeur de code d'Apple pour faire des apps iOS (comme VSCode mais pour iOS) |
| **Build** | Compiler ton code en une vraie app iOS (.ipa) |
| **webDir** | Le dossier où Capacitor cherche tes fichiers web |
| **Bundle ID** | Un ID unique pour ton app (com.replift.app) — comme ton adresse email mais pour l'app |
| **Signing** | Signer ton app avec ton compte Apple Developer pour prouver que c'est toi qui l'as fait |
| **Archive** | Créer la version finale de l'app prête à uploader sur l'App Store |
| **App Store Connect** | Le site web d'Apple où tu gères ta fiche app (description, screenshots, etc.) |
| **.ipa** | Format de fichier d'une app iOS (comme .apk sur Android) |
| **Provisioning profile** | Certificat Apple qui autorise ton app à tourner sur iOS |

---

## Résumé en 3 phrases

1. **Capacitor = wrapper** qui met ton site web dans une coquille iOS
2. **npm run sync** = copie ton code dans le projet iOS
3. **Sur Mac : Xcode build** = crée la vraie app .ipa uploadable sur l'App Store

---

## Budget & Timeline recap

| Étape | Coût | Durée |
|-------|------|-------|
| ✅ Setup Capacitor (aujourd'hui) | 0€ | 1h |
| ⏳ Compte Apple Developer | 99$/an | 24-48h attente |
| ⏳ Générer icônes | 0€ | 30 min |
| 📅 Louer Mac (MacInCloud) | 25$/mois | Instant |
| 📅 Build + upload première fois | Inclus | 3-5h |
| 📅 Setup Codemagic (CI/CD) | 0€ | 1h |
| 🎯 Review Apple | 0€ | 1-5 jours |
| **TOTAL première publication** | **124$** | **~1 semaine** |

**Mois suivants :** 0€ (Codemagic gratuit pour updates)

---

## Questions/réponses

**Q: Pourquoi pas juste un site web ?**  
R: L'App Store = marketing gratuit + découvrabilité + confiance users + monétisation in-app

**Q: C'est pas moins performant qu'une vraie app native ?**  
R: Pour RepLift (forms, localStorage, charts 2D) : différence imperceptible. Si tu faisais de la 3D ou de la vidéo, oui il y aurait une diff.

**Q: Je peux faire Android aussi ?**  
R: Oui ! `npx cap add android` et c'est prêt. Play Store coûte 25$ one-time (vs 99$/an Apple).

**Q: Si je modifie mon code, je dois repayer le Mac ?**  
R: Non, tu setup Codemagic (free) qui build dans le cloud automatiquement.

**Q: Capacitor vs React Native ?**  
R: RN = réécrire tout en React (2-3 mois). Capacitor = réutilise ton code actuel (1 semaine).

---

**Prochaine étape : Créer ton compte Apple Developer pendant que ça valide (24-48h), puis louer le Mac pour builder.** 🚀
