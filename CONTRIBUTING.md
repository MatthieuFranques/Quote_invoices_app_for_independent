# Contribuer à FactureLocale

Merci de votre intérêt ! Ce projet est ouvert aux contributions. Ce guide
explique comment participer efficacement.

## Code de conduite

En participant, vous acceptez de respecter notre
[code de conduite](CODE_OF_CONDUCT.md). Soyez bienveillant et constructif.

## Principes du projet (à respecter dans toute contribution)

Ces contraintes sont au cœur du projet — toute contribution doit les préserver :

1. **100 % local et hors-ligne.** Aucun appel réseau au runtime, aucun CDN,
   aucune police ou ressource distante. Toutes les dépendances doivent être
   intégrées au build.
2. **Aucune donnée ne quitte l'appareil.** Pas de télémétrie, pas d'analytics,
   pas de serveur.
3. **Mobile-first.** Tout doit être utilisable au pouce sur un écran de
   téléphone (cibles tactiles d'au moins 48 px).
4. **Interface en français.** Les chaînes visibles par l'utilisateur sont en
   français.
5. **Code simple et commenté.** Privilégier la lisibilité ; commenter le « pourquoi ».

## Mettre en place l'environnement

```bash
npm install
npm run dev
```

Voir [`docs/INSTALLATION.md`](docs/INSTALLATION.md) pour le détail.

## Avant de soumettre

Vérifiez que tout passe :

```bash
npm run lint     # ESLint
npm run build    # vérifie les types + construit
```

- Respectez le style existant (TypeScript, conventions de nommage en français
  côté domaine).
- N'ajoutez **pas** de dépendance qui effectuerait des requêtes réseau au
  runtime.
- Gardez les changements ciblés : une PR = un sujet.

## Signaler un bug

Ouvrez une **issue** en précisant :

- ce que vous faisiez, le résultat attendu et le résultat obtenu ;
- l'appareil, le système et le navigateur ;
- des étapes de reproduction (et une capture si utile).

Ne joignez **jamais** de données personnelles réelles (clients, factures) dans
une issue.

## Proposer une fonctionnalité

Ouvrez d'abord une issue pour en discuter, surtout si le changement est
important. Cela évite de coder quelque chose qui ne serait pas retenu.

## Pull requests

1. Forkez le dépôt et créez une branche depuis `main`
   (`git checkout -b feat/ma-fonctionnalite`).
2. Faites des commits clairs (format conseillé :
   [Conventional Commits](https://www.conventionalcommits.org/), ex.
   `feat: ajoute la conversion devis → facture`).
3. Vérifiez `npm run lint` et `npm run build`.
4. Ouvrez la PR en décrivant le **quoi** et le **pourquoi**.

## Licence des contributions

En contribuant, vous acceptez que votre travail soit distribué sous la licence
[MIT](LICENSE) du projet.
