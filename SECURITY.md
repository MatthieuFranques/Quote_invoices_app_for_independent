# Politique de sécurité

## Modèle de sécurité du projet

FactureLocale est une application **entièrement locale** : toutes les données
(clients, devis, factures, paramètres) sont stockées sur l'appareil de
l'utilisateur via IndexedDB, et l'application n'effectue aucun appel réseau au
runtime. Il n'y a **pas de serveur** ni de base de données distante.

Conséquences :

- La sécurité des données repose en grande partie sur la sécurité de l'appareil
  de l'utilisateur (verrouillage, chiffrement du disque, profil de navigateur).
- Effacer les données du navigateur ou désinstaller l'app **supprime** les
  données. La sauvegarde (export JSON) est la responsabilité de l'utilisateur.
- Les exports JSON et les PDF contiennent des données potentiellement sensibles
  (coordonnées clients, montants). À conserver dans un endroit sûr.

## Signaler une vulnérabilité

Si vous découvrez une faille de sécurité (par exemple une fuite de données vers
le réseau, une injection, une faille XSS) :

- **Ne l'ouvrez pas dans une issue publique.**
- Contactez le mainteneur en privé : **matthieufranques@gmail.com**.
- Décrivez la faille, son impact et, si possible, les étapes de reproduction.

Nous nous efforcerons d'accuser réception rapidement et de corriger les failles
confirmées dans les meilleurs délais.

## Bonnes pratiques pour les utilisateurs

- Utilisez un appareil avec verrouillage d'écran et chiffrement activés.
- Exportez régulièrement vos données (Paramètres → Sauvegarde) et stockez la
  sauvegarde en lieu sûr.
- N'importez que des fichiers JSON dont vous connaissez l'origine.
- Si l'appareil est partagé, utilisez un profil de navigateur dédié.
