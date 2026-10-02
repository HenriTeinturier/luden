# Luden

Une archive personnelle de jeux, souvenirs et collections. V1 locale pour Windows.
React / TanStack Start, PostgreSQL 17, Prisma, médias sur disque.

## Démarrer

Prérequis : Node 22.14+ et Docker Desktop démarré.

1. `npm install`
2. Copier `.env.example` en `.env` si absent. Choisir un mot de passe PostgreSQL et reporter le même dans `DATABASE_URL`.
3. `npm run db:up` — image officielle PostgreSQL 17, port local 5434, volume persistant.
4. `npm run db:setup` — génération Prisma, migrations, profil et collections vides.
5. `npm run dev` — ouvrir http://127.0.0.1:3000.

L'amorçage est idempotent : aucune insertion de jeux fictifs. `.env` est exclu de Git.
Ne pas lancer `docker compose down -v` : cela supprimerait le volume de la base.
Le mot de passe initial d'un volume PostgreSQL n'est pas changé simplement en modifiant `.env`.

## Images et IGDB

Renseigner `LUDEN_DATA_DIR` dans `.env`, par exemple `C:/Users/vous/OneDrive/Luden`, puis redémarrer.
Le dossier doit être absolu, accessible en écriture et disponible localement dans OneDrive.
Sans ce chemin, toutes les fonctions sauf l'import d'images restent disponibles.
Luden stocke une copie WebP optimisée (2560×2560 maximum), avec proportions conservées.
Les images sont rangées dans `media/jeux/<plateforme>/<titre>--<id-jeu>/` à l’enregistrement
de la fiche. Les imports en attente restent dans `media/_imports/`.
Ajout depuis un fichier, un lien direct ou IGDB. Les copies locales retirées sont supprimées après enregistrement si elles ne sont plus utilisées. Pas de purge globale.

Pour ranger d’anciens médias : `npm run media:organize` simule, puis
`npm run media:organize:apply` sauvegarde PostgreSQL et applique les déplacements avec contrôle
d’intégrité. Sauvegarde et journal dans `LUDEN_DATA_DIR/backups/`. Reprise et détails : `docs/media.md`.

IGDB est facultatif. Créer des identifiants d'application selon https://api-docs.igdb.com/#getting-started,
puis renseigner `IGDB_CLIENT_ID` / `IGDB_CLIENT_SECRET` dans `.env` et redémarrer.
Le filtre plateforme est facultatif pour chercher, obligatoire pour enregistrer. Vérifier les informations d'adaptation : certains champs IGDB sont communs à plusieurs versions.
Le sélecteur IGDB permet de choisir et classer plusieurs images, conservées localement. Aucun service tiers n'est nécessaire pour lire les fiches enregistrées.

## Compilation et vérification

- `npm run build`, puis `npm start` : serveur compilé local.
- `npm start` utilise la dernière compilation, sans reprendre les modifications du code. Après une mise à jour : arrêter le serveur, relancer `npm run build`, puis `npm start` et rafraîchir le navigateur. Pour les modifications en cours, utiliser `npm run dev`.
- Sous Windows, arrêter le serveur compilé avant de reconstruire : son moteur Prisma verrouille une DLL.
- `npm run check` : TypeScript, lint, sept tests ciblés métier/médias/chemins.
- Après ajout/suppression de routes, lancer dev/build pour générer `src/routeTree.gen.ts`.
- La validation visuelle est principalement manuelle. Voir `docs/status.md`.
- `npm run format` : formatage lisible et cohérent du code et de la documentation.

## Limites assumées

Pas d'authentification : ne pas exposer cette V1 sur le réseau/Internet. Profil local ≠ compte sécurisé.
Pas d'import Excel, de sauvegarde PostgreSQL, de partage public ni de synchronisation de boutiques.
Export JSON depuis Paramètres ; copie séparée des médias nécessaire ; réimport non disponible en V1.
Avant Coolify/multi-utilisateur, compléter authentification, autorisations et publication. Le framework permet cette évolution.

## Documentation à la demande

`AGENTS.md` est l'index pour les agents ; `CLAUDE.md` pointe vers les mêmes consignes.
`docs/product.md`, `data-model.md`, `architecture.md`, `design.md`, `decisions.md`, `status.md`.
