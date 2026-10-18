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

Présentation des jeux : `src/lib/presentation.ts` définit les modèles réutilisables, leurs
proportions de galerie et leur géométrie boîte/support en sidebar et fiche complète.
`resolvePresentation` combine un modèle et ses ajustements sans dépendre d’un identifiant de plateforme.
`platformPresentation` applique les affectations actuelles (précalculées), dont l’abaissement Xbox.
La route plateforme expose les classes de galerie ; `GameScene` transmet la géométrie via des
variables CSS. Les dimensions des scènes ne dépendent plus de sélecteurs CSS par plateforme.
Les illustrations de machines et l’accueil des univers restent séparés de ces modèles.
Les choix personnels sont enregistrés dans `Platform.customization` et appliqués par l’éditeur commun.

Création personnelle : `/platforms/new` → `createPlatformFn` → `server/platforms.ts` → Prisma.
Un UUID de requête rend la première sauvegarde idempotente. Les données initiales et le catalogue
associé sont créés avec `isDraft=true`, puis l’éditeur existant publie dans la transaction des visuels.
`loadLibrary` sépare plateformes disponibles et brouillons et filtre les plateformes par propriétaire.
L’ajout de jeu et la recherche refusent les brouillons et plateformes d’un autre profil.
IGDB utilise l’identifiant du catalogue associé tout en conservant la plateforme personnelle comme
destination de la fiche ; aucune copie de jeux du catalogue. `Machine` reste compatible avec les
anciennes données mais son formulaire et sa fonction de création sont retirés.

Consultation : `GameExplorer` dans le shell conserve la galerie montée et gère sélection/ordre,
sidebar, fiche et édition. `GameDetails` est partagé avec la route de jeu directe.
Dans une route plateforme, `UniverseSidebar` fournit l’état d’accueil par défaut ; `GameExplorer`
gère accueil → jeu → accueil → masqué et réinitialise cet état lors d’une nouvelle visite.
`quickUpdateGameFn` → `library.quickUpdateGame` → transaction Prisma applique seulement les champs
rapides explicitement envoyés ; aucune réécriture du reste de la fiche. Invalidation synchrone avant
confirmation. `Game.presentation` est validé par Zod et limité aux médias attachés à la fiche.

## Stockage

`LUDEN_DATA_DIR` absolu fourni par l'utilisateur. Médias sous `media/`, DB avec chemins relatifs.
Imports provisoires dans `_imports/`, puis rangement par plateforme/jeu à la sauvegarde de fiche.
`media-organization.ts` calcule les destinations ; `media-storage.ts` assure copie vérifiée,
verrou local et retrait des anciens fichiers après mise à jour de `Media.path`.
Validation de taille/format, décodage et conversion WebP côté serveur, sans recadrage.
Import fichier, URL publique ou sélection IGDB : même stockage local, dimensions et source conservées.
Miniatures à la demande : `/media/<id>?w=320|640|1280` → `media.readImage` (propriétaire)
→ `image-variants.ts` (Sharp, deux conversions simultanées, cache disque régénérable sous
`LUDEN_DATA_DIR/cache/thumbnails/v1`). Les vues compactes choisissent une taille via
`srcset`/`sizes` ; originaux conservés pour les agrandissements. Aucune migration nécessaire.
Cache absent : original servi sans attendre, génération en arrière-plan ; les requêtes
image ne sont jamais mises en attente de la conversion.
`remote-image.ts` : HTTP(S), IP publiques uniquement, DNS vérifié et fixé pour la connexion,
redirections revalidées, MIME autorisé, limite 12 Mo et délai 20 secondes.
Les retraits sont appliqués à l'enregistrement ; seuls les fichiers sans référence sont supprimés.
Les imports provisoires sont nettoyés au retrait/quand le formulaire est démonté, au mieux.
Un onglet fermé brutalement ou un échec disque peut laisser un fichier orphelin ; aucune purge globale.
Voir `docs/media.md` pour les points d'entrée et la migration.
Les illustrations d’accueil des univers sont référencées dans `PlatformVisual`, avec propriétaire,
plateforme, rôle (bandeau, affiche, logo, fond, machine et variantes sidebar), ordre, activation et défaut unique par type. Les fichiers restent
hors Git sous `media/plateformes/<id>/<rôle>/<uuid>.webp` (`bandeaux`, `affiches`, puis noms d’enum en minuscules) ; aucune image personnelle dans
`public`. `/platform-media/<id>` vérifie le profil local et sert le fichier via un chemin borné.
`/platforms/<id>/edit` → fonctions serveur → `platform-visuals.ts` → Prisma gère les choix.
L’import utilise le même décodage WebP borné que les jeux, mais une table indépendante : aucun
nettoyage ou rangement de médias de jeux ne peut supprimer une affiche inactive de plateforme.
Imports persistés inactifs immédiatement ; activation et défauts appliqués à l’enregistrement.
Transaction avec verrou de plateforme et contraintes SQL pour éviter deux défauts concurrents.
Les réglages `Platform.slideshowEnabled/slideshowSeconds` sont sauvegardés dans cette même
transaction, ainsi que `Platform.customization` (identité affichée, modèles et placement des visuels).
`platform-customization.ts` valide les réglages, `platform-artwork.ts` résout les priorités des images ;
les réglages omis restent intacts et une liste de visuels périmée annule toute la transaction.
La sidebar restaure l’affiche depuis `luden:platform-poster:v1:<id>` (localStorage)
après hydratation ; le timer ne tourne que pour deux affiches actives ou plus et un onglet visible.
La suppression d’une plateforme personnelle exige l’absence de jeux ; elle retire la ligne et ses
visuels en transaction, puis les fichiers. Les fichiers sources de l’utilisateur restent intacts.
Export JSON v8 : plateformes personnelles, propriétaire, catalogue associé, brouillon et catégories,
en plus des personnalisations et rôles (v7), réglages de défilement (v6) et visuels personnels (v5).
Pas de copie de la base vivante dans OneDrive ; volume Docker dédié.

## Futur

Propriétaire partout, mais profil local n'est PAS une authentification.
Avant hébergement partagé : auth, autorisations, protection médias, publication sélective et SSR public.
Dockerfile Node + volume média conviendra à Coolify. Ne pas activer de partage en V1.
