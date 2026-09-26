# Luden — instructions communes

Application personnelle de mémoire et collection de jeux. Français dans l'interface.
Lire `docs/status.md` pour reprendre le travail, puis UNIQUEMENT les documents utiles.

## Carte de lecture

- Besoin / périmètre : `docs/product.md`
- Règles et données : `docs/data-model.md`
- Structure / serveur / stockage : `docs/architecture.md`
- Interface : `docs/design.md`
- Décisions : `docs/decisions.md`
- Installation / Docker : `README.md`
- Prochaine étape : `docs/status.md` ; plan initial : `docs/implementation.md`

## Travail

- Architecture courte : routes → services serveur → Prisma. Pas de couches abstraites sans usage.
- Métadonnées indépendantes par jeu/plateforme. Expérience, possession, collection indépendantes.
- Code et documentation seulement dans Git ; aucun secret, média personnel ou export.
- Ne jamais choisir un dossier OneDrive pour l'utilisateur : `LUDEN_DATA_DIR` dans `.env`.
- V1 locale, pas d'auth publique. Ne pas exposer sur Internet sans authentification et autorisations.
- Tests MINIMAUX sur invariants importants. Typecheck/lint/build aux étapes utiles.
- La validation visuelle revient principalement à l'utilisateur. Pas de snapshots visuels ou suite navigateur exhaustive.
- Ne pas relancer les mêmes vérifications sans changement ni doute nouveau.
- Mettre à jour le résumé courant et les documents concernés, sans recopier les conversations.
- Après chaque modification terminée : commit descriptif et push sur le dépôt configuré, comme demandé par l'utilisateur.
  Ne jamais inclure secrets, médias personnels ou données de test ; signaler tout push bloqué.

## Commandes

`npm run dev`, `npm run build`, `npm run check`, `npm run db:up`, `npm run db:setup`.
