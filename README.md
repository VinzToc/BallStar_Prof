# Ball Star Prof (Mes Apps EPS)
Interface professeur de Ball Star, le challenge XP des sports de raquette et de combat.

Dépôt conseillé : `BallStar_Prof` → https://vinztoc.github.io/BallStar_Prof/ (même domaine que Mes Apps EPS : base locale « MesAppsEPS » partagée).

## Fonctions
1. **Réglages du jeu** (seul endroit où ils se modifient) : XP par match joué, victoire, observable validé (et nombre maximum compté par match), bonus d'écart (3 paliers), seuils Argent / Or / Star, paliers 1★ / 2★ / 3★ des 6 défis, observables par activité, observable imposé à la classe.
2. **Fichier de réglages pour les élèves** : `BallStar_Reglages_<code>.xlsx`. Il porte un code de contrôle : l'appli élève refuse un fichier modifié à la main.
3. **Import des fichiers élèves** (`NOM_Prenom_Classe_BallStar.xlsx`, plusieurs à la fois) : rattachement par nom, prénom et classe à la liste de Mes Apps EPS, sans doublon. Option « Créer les élèves absents ».
4. **Suivi de la classe** : classement, niveau, XP, matchs, V–D, observables validés, étoiles de défis (sur 18), matchs confirmés.
5. **Fiche élève** : courbe d'XP avec les seuils de niveau, défis et leurs étoiles, observables, détail des matchs, suppression d'un match.
6. **Exports** : bilan de classe (.xlsx, feuilles Bilan et Matchs) et données Ball Star au format Mes Apps EPS.

## Équité du jeu
- L'XP affichée ici est **toujours recalculée avec les réglages du professeur** à partir des scores et des observables. Changer un barème ou trafiquer l'XP côté élève ne change rien au classement.
- **⚠ XP** : l'XP calculée par l'appli de l'élève diffère (fichier de réglages non importé, ou données modifiées).
- **✔ confirmé** : l'adversaire a enregistré le même match (même jour, score inversé). **≠ contesté** : il a enregistré un autre score contre cet élève ce jour-là.

## Fichiers
`index.html`, `ballstar-prof.js`, `prof.css`, `ballstar.css`, `bs-rules.js` (règles communes, **identique** dans BallStar_Eleves), `bs-art.js`, `bs-xlsx.js`, `eps-core.js` v2.3, `version.js`, `sw.js`, `manifest.webmanifest`, `icons/`.

## Mise à jour
`APP_VERSION` dans `version.js` et `VERSION` dans `sw.js`. Si les règles changent, recopier `bs-rules.js` dans les deux dépôts.

## Ajout au portail prof
Dans `apps.json` de `Mes_Apps_EPS` (et copier `icons/icon-192-BallStar-Prof.png` dans `icons/` du portail) :
```json
{"id":"ballstar","nom":"Ball Star Prof","desc":"Réglages du challenge Ball Star, import des fichiers élèves et suivi de la progression","url":"https://vinztoc.github.io/BallStar_Prof/","icon":"icons/icon-192-BallStar-Prof.png","emoji":"⭐","couleur":"#ffe14a,#8f5bff","categorie":"Performances"}
```
