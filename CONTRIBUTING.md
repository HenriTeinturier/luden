# Contribuer à Luden

Le projet est en développement. Les retours d’usage et problèmes d’installation sont bienvenus, même sans contribution au code.

## Signaler un problème

Dans une issue, indiquez le système, la version de Node et Docker, la version ou le commit de Luden, les étapes pour reproduire, le résultat attendu et le résultat observé. Une capture peut aider après retrait des informations personnelles. N’ajoutez jamais `.env`, clés IGDB, images privées, base ou sauvegarde complète.

## Proposer une modification

Expliquez le problème avant une évolution importante. Les petites corrections peuvent être proposées directement par pull request. Interface en français ; architecture courte routes → services serveur → Prisma. Les souvenirs, l’expérience de jeu, la possession et les collections restent indépendants.

Installez selon le [README](README.md), puis lancez `npm run check` et `npm run build`. Ajoutez des tests ciblés sur les invariants concernés ; pas de suite visuelle exhaustive. Après modification d’une route, le générateur TanStack met à jour `src/routeTree.gen.ts` pendant dev/build.

`npm run verify:release` vérifie une installation jetable, une sauvegarde et une restauration réelles. Il nécessite Docker et conserve ses fichiers sous `.local/`, hors Git. Il n’utilise pas votre base habituelle. Voir [les sauvegardes](docs/backups.md).

Ne committez ni secrets, données personnelles, exports, sauvegardes ou fichiers de test produits par les contrôles. Les captures de démonstration déjà présentes ont été explicitement fournies pour la documentation.

Les contributions au code sont proposées sous AGPL-3.0-only. Ajoutez seulement des fichiers et illustrations que vous êtes autorisé à distribuer, avec leur provenance si nécessaire.
