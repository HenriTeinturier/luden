# Architecture

TanStack Start + React/TypeScript, Vite, déploiement Node via Nitro. Pas de Fastify.
Prisma 6 + PostgreSQL 17 Docker. Le navigateur n'accède ni à Prisma ni aux secrets.

## Couches

- `src/routes` : URLs, loaders, fonctions HTTP médias/export.
- `src/components` : interface et formulaires.
- `src/components/game-form/` : sections identité, expérience et possessions séparées.
- `src/lib` : types, validation et présentation sans accès IO.
- `src/server` : services concrets (bibliothèque, médias, IGDB), Prisma et profil courant.
- `prisma` : schéma/migrations ; `scripts` : amorçage idempotent.
- `src/styles/` : layout, accueil, galeries, formulaires, collections et responsive.

Fonctions serveur TanStack pour les opérations applicatives ; chargement des routes et invalidation suffisent en V1.
Pas de Query ajouté sans besoin, de repository abstrait, de DI ou de microservices.

## Stockage

`LUDEN_DATA_DIR` absolu fourni par l'utilisateur. Médias sous `media/`, DB avec chemins relatifs.
Validation de taille/format, décodage et conversion WebP côté serveur, sans recadrage.
Import fichier, URL publique ou sélection IGDB : même stockage local, dimensions et source conservées.
`remote-image.ts` : HTTP(S), IP publiques uniquement, DNS vérifié et fixé pour la connexion,
redirections revalidées, MIME autorisé, limite 12 Mo et délai 20 secondes.
Les retraits sont appliqués à l'enregistrement ; seuls les fichiers sans référence sont supprimés.
Les imports provisoires sont nettoyés au retrait/quand le formulaire est démonté, au mieux.
Un onglet fermé brutalement ou un échec disque peut laisser un fichier orphelin ; aucune purge globale.
Voir `docs/media.md` pour les points d'entrée et la migration.
Pas de copie de la base vivante dans OneDrive ; volume Docker dédié.

## Futur

Propriétaire partout, mais profil local n'est PAS une authentification.
Avant hébergement partagé : auth, autorisations, protection médias, publication sélective et SSR public.
Dockerfile Node + volume média conviendra à Coolify. Ne pas activer de partage en V1.
