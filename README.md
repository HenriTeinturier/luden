# Luden

**Une vie de jeux. Et tant d’histoires.**

Luden est une application personnelle en français pour garder la mémoire des jeux auxquels vous avez joué, de ceux qui vous ont marqué et de ceux que vous aimeriez découvrir. Elle permet aussi de composer vos collections **réelles ou rêvées**, indépendamment de ce que vous possédez aujourd’hui.

**Version 0.2.0 — en développement, usage local uniquement.** Pas de compte en ligne ni de partage public des collections pour le moment. L’installation démarre vide : les captures ci-dessous montrent la collection personnelle de l’auteur.

![Accueil de Luden](docs/screenshots/accueil.webp)

## Fonctionnalités

- Retrouver vos jeux par plateforme, les noter, raconter vos souvenirs et garder une période de jeu.
- Distinguer expérience, possession actuelle ou passée, envie et simple souvenir.
- Créer des collections réelles et rêvées, sans obligation de posséder les jeux d’une collection rêvée.
- Parcourir des univers de plateformes et personnaliser boîtes, supports, logos et fonds.
- Ajouter un jeu manuellement ou rechercher ses informations et choisir des images avec **IGDB** (facultatif).
- Sauvegarder et restaurer la bibliothèque complète, images comprises, depuis les paramètres.

![Les plateformes](docs/screenshots/plateformes.webp)

## Installer

### Prérequis

- **Node.js 22.14 ou ultérieur**, avec npm. Node 22 est utilisé par la CI ; voir les vérifications datées dans [docs/status.md](docs/status.md).
- **Git** pour cloner et mettre à jour le projet.
- **Docker Desktop démarré**, avec les conteneurs Linux sur Windows. L’application tourne avec Node sur votre ordinateur ; Docker héberge PostgreSQL.
- Un dossier de données accessible en écriture, hors du dépôt, et de l’espace disque.

Windows est la plateforme utilisée par l’auteur. La CI prévoit aussi des contrôles Linux ; cela ne constitue pas une validation manuelle de toutes les plateformes. macOS n’a pas été vérifié.

### 1. Récupérer les sources

```sh
git clone https://github.com/HenriTeinturier/luden.git
cd luden
```

Copiez `.env.example` en `.env`. Sous PowerShell :

```powershell
Copy-Item .env.example .env
```

Sous Linux/macOS : `cp .env.example .env`.

### 2. Configurer `.env`

Choisissez un mot de passe PostgreSQL personnel, puis utilisez **le même** dans `POSTGRES_PASSWORD` et `DATABASE_URL`. N’utilisez pas `change-me`.

```dotenv
POSTGRES_USER=luden
POSTGRES_PASSWORD=REMPLACER_PAR_UN_SECRET
POSTGRES_DB=luden
POSTGRES_PORT=5434
DATABASE_URL="postgresql://luden:REMPLACER_PAR_UN_SECRET@127.0.0.1:5434/luden?schema=public"

LUDEN_DATA_DIR="C:/LudenData"
LUDEN_CACHE_DIR=""
LUDEN_BACKUP_MAX_MB=10240
IGDB_CLIENT_ID=""
IGDB_CLIENT_SECRET=""
HOST=127.0.0.1
PORT=3000
```

Pour générer un secret aléatoire compatible avec cet exemple :

```sh
node -e "console.log(require('node:crypto').randomBytes(24).toString('hex'))"
```

Avec un autre mot de passe, les caractères réservés tels que `@`, `:`, `/`, `#` ou `%` doivent être encodés dans l’URL PostgreSQL, mais pas dans `POSTGRES_PASSWORD`. Les noms utilisateur/base de la sauvegarde intégrée doivent utiliser seulement lettres, chiffres et `_`.

`.env` contient vos secrets et chemins personnels : il est exclu de Git et des sauvegardes Luden.

### 3. Installer et créer la base

Depuis le dossier du projet :

```sh
npm ci
npm run db:up
npm run db:setup
```

`db:up` télécharge l’image officielle **PostgreSQL 17**, crée la base et attend qu’elle soit prête. Elle écoute uniquement sur `127.0.0.1:5434` ; son port interne est 5432. Un volume Docker conserve ses données après l’arrêt du conteneur.

`db:setup` génère Prisma, applique les migrations et initialise un profil, les plateformes et deux collections vides. Il n’ajoute aucun jeu personnel et peut être relancé sans recréer vos collections.

### 4. Démarrer

Pour une utilisation régulière :

```sh
npm run build
npm start
```

Ouvrez [http://127.0.0.1:3000](http://127.0.0.1:3000). Pour travailler sur le code, utilisez `npm run dev` à la place, sans lancer les deux serveurs ensemble. Le développement utilise le port fixe 3000 ; `PORT` configure le serveur compilé.

## Stockage

| Élément                                            | Emplacement                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Images de base des plateformes                     | `public/platforms/`, dans les sources                                                |
| Images ajoutées pour les jeux                      | `LUDEN_DATA_DIR/media/jeux/…`, après enregistrement                                  |
| Images personnalisées de plateformes               | `LUDEN_DATA_DIR/media/plateformes/…`                                                 |
| Imports d’images en attente                        | `LUDEN_DATA_DIR/media/_imports/…`                                                    |
| Miniatures régénérables                            | `LUDEN_CACHE_DIR/thumbnails/v1/…`, ou `LUDEN_DATA_DIR/cache/thumbnails/v1/…` si vide |
| Sauvegardes complètes et travail temporaire        | `LUDEN_DATA_DIR/backups/`                                                            |
| Fiches, souvenirs, réglages et références d’images | Volume PostgreSQL Docker                                                             |
| Certaines préférences d’affichage                  | Stockage local du navigateur                                                         |

Les chemins sont **absolus**, choisis par vous. Exemples : `D:/MesDonnees/Luden`, `C:/Users/vous/OneDrive/Luden`, `/home/vous/LudenData`. Les répertoires nécessaires sont créés au moment de leur utilisation. Sans `LUDEN_DATA_DIR`, vous pouvez saisir des fiches, mais pas importer des images ou créer/restaurer une sauvegarde complète.

OneDrive est facultatif. Gardez le dossier disponible localement si vous l’utilisez. Vous pouvez laisser les images synchronisées et mettre `LUDEN_CACHE_DIR="C:/LudenCache"` pour les miniatures. Le cache doit être distinct de `media` et `backups`.

Les imports sont des copies WebP optimisées, limitées à 2560 × 2560 pixels, sans recadrage ni agrandissement ; les fichiers sources ne sont pas modifiés. Le format original n’est pas archivé. OneDrive ne synchronise pas la base Docker et ne constitue pas à lui seul une sauvegarde complète.

**Changer de dossier** : sauvegardez d’abord, arrêtez Luden, copiez le contenu de l’ancienne racine dans la nouvelle, modifiez `LUDEN_DATA_DIR`, redémarrez et vérifiez les images. Conservez l’ancienne copie jusqu’à vérification. Le cache peut être recréé. Modifier `.env` ne déplace pas les fichiers automatiquement.

## Premiers pas

1. Depuis **Ajouter un jeu**, renseignez son titre et sa plateforme ou cherchez-le avec IGDB.
2. Indiquez votre expérience : joué, en cours, terminé… Ajoutez une note, une période et un souvenir si vous le souhaitez. Un jeu peut aussi être conservé comme simple souvenir.
3. Décrivez séparément vos possessions physiques ou numériques, actuelles ou passées.
4. Utilisez **Mes envies** pour les jeux à découvrir et **Mes collections** pour une collection réelle ou rêvée.
5. Personnalisez les plateformes depuis **Mes plateformes**. Les images personnelles montrées dans les captures ne sont pas automatiquement installées.

![Super Nintendo et un souvenir personnel](docs/screenshots/super-nintendo.webp)

Le partage volontaire des collections en ligne est un objectif futur, qui nécessitera comptes, autorisations et choix des informations publiées.

## IGDB : facultatif

L’ajout manuel fonctionne sans compte tiers. Pour rechercher les informations d’un jeu, préremplir sa fiche et choisir jaquettes, captures ou illustrations :

1. Suivez la création d’application Twitch dans la [documentation officielle IGDB](https://api-docs.igdb.com/#getting-started).
2. Renseignez `IGDB_CLIENT_ID` et `IGDB_CLIENT_SECRET` dans `.env`, puis redémarrez Luden.
3. Recherchez le jeu dans le formulaire, vérifiez la plateforme et les informations proposées, puis choisissez les images.

Les recherches nécessitent Internet et vos propres identifiants. Les fiches et copies d’images enregistrées restent consultables hors connexion. Les informations peuvent être communes à plusieurs adaptations : vérifiez-les pour votre édition. Il ne s’agit pas d’une synchronisation Steam, PlayStation ou Xbox.

## Sauvegarder et restaurer

Dans **Paramètres → Sauvegarde et restauration** :

- **Créer une sauvegarde complète** produit une archive `.luden.tar.gz` avec le dump PostgreSQL et les images enregistrées. Le navigateur permet de choisir le dossier ou utilise son réglage habituel de téléchargement. Une copie reste dans `LUDEN_DATA_DIR/backups`.
- **Restaurer une sauvegarde** vérifie l’archive, affiche un récapitulatif et exige une confirmation. Une sauvegarde de sécurité précède le remplacement complet des données.

**Mots de passe PostgreSQL, identifiants IGDB et `.env` ne sont pas sauvegardés.** Sur une autre installation, configurez vos propres identifiants. Le cache et les préférences du navigateur ne sont pas inclus.

La restauration remplace la bibliothèque, sans fusion. Utilisez une archive de confiance et la même version de Luden. Docker doit être disponible. Gardez une seule instance ouverte et arrêtez les scripts de maintenance pendant ces opérations. [Détails et reprise après interruption](docs/backups.md).

L’export JSON reste disponible pour lire ou exploiter les données ailleurs. Il ne contient pas les images, ne remplace pas la sauvegarde complète et ne peut pas être réimporté.

## Arrêter et mettre à jour

Arrêtez le serveur avec `Ctrl+C`. Pour arrêter PostgreSQL :

```sh
docker compose stop
```

Le volume reste conservé. **N’utilisez pas `docker compose down -v` sur votre installation : cela supprime le volume PostgreSQL.** Modifier le mot de passe dans `.env` ne change pas celui d’un volume déjà initialisé.

Avant mise à jour, créez une sauvegarde complète. Arrêtez le serveur puis :

```sh
git pull --ff-only
npm ci
npm run db:up
npm run db:setup
npm run build
npm start
```

Sous Windows, arrêtez le serveur compilé avant `npm ci`, `db:generate` ou le build : Prisma/Sharp peuvent être verrouillés. `npm start` utilise la dernière compilation ; modifier le code ne le met pas à jour automatiquement.

## Dépannage

| Symptôme                                         | Vérification                                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Docker inaccessible                              | Démarrer Docker Desktop, attendre qu’il soit prêt, vérifier `docker compose ps`                                 |
| Base indisponible                                | Vérifier `.env`, `docker compose logs db`, puis `npm run db:up` et `npm run db:setup`                           |
| Mot de passe refusé après modification de `.env` | Le volume conserve son mot de passe initial ; rétablir la configuration précédente, sans supprimer le volume    |
| Port PostgreSQL occupé                           | Choisir un autre `POSTGRES_PORT` et reporter le port dans `DATABASE_URL`                                        |
| Port applicatif occupé                           | Arrêter l’autre serveur ; pour le serveur compilé, choisir un autre `PORT`                                      |
| Import d’image impossible                        | Vérifier que `LUDEN_DATA_DIR` est absolu, accessible en écriture et disponible localement                       |
| IGDB indisponible                                | Vérifier ses identifiants et Internet ; l’ajout manuel reste possible                                           |
| `EPERM` pendant une mise à jour Windows          | Arrêter le serveur qui utilise les bibliothèques natives puis relancer la commande                              |
| Sauvegarde/restauration refusée                  | Vérifier Docker, l’espace disque, le dossier, la limite et la version ; voir [docs/backups.md](docs/backups.md) |

Ne partagez jamais `.env`, dump ou archive personnelle dans une issue.

### Mot de passe PostgreSQL perdu

Commencez par consulter votre `.env` : `POSTGRES_PASSWORD` et `DATABASE_URL` contiennent le mot de passe configuré. S’il a réellement été perdu, **ne supprimez pas le volume Docker**. Vous pouvez définir un nouveau mot de passe sans effacer la bibliothèque.

Avec l’image officielle utilisée par Luden et sa configuration locale d’origine, un accès au conteneur permet généralement une connexion par socket local sans l’ancien mot de passe. Arrêtez le serveur Luden, gardez PostgreSQL démarré, puis depuis le dépôt :

```sh
docker compose exec db psql -U luden -d postgres
```

Remplacez `luden` par votre `POSTGRES_USER` si vous l’avez personnalisé. Dans l’invite `psql` :

```text
\password luden
\q
```

`\password` demande deux fois le nouveau secret, sans l’afficher ni le mettre dans la commande ou son historique. Reportez ensuite le nouveau mot de passe dans `POSTGRES_PASSWORD` et dans `DATABASE_URL` (avec l’encodage URL approprié), puis relancez `npm run db:up` et Luden.

Cette procédure suppose que vous contrôlez la machine et Docker, et que l’authentification locale du conteneur n’a pas été modifiée. Si la connexion locale exige aussi le mot de passe, n’activez pas une authentification sans mot de passe sur le réseau : la récupération doit être adaptée à votre configuration. Une archive complète peut aussi être restaurée dans une nouvelle installation avec de nouveaux identifiants, indépendamment de l’ancien mot de passe.

Références : [image officielle PostgreSQL](https://hub.docker.com/_/postgres), [commande psql `\password`](https://www.postgresql.org/docs/17/app-psql.html).

## Développement et vérifications

React / TanStack Start, TypeScript, Vite / Nitro, Prisma 6, PostgreSQL 17 et Sharp.

```sh
npm run check
npm run build
npm audit --omit=dev
```

`check` lance TypeScript, ESLint et les tests ciblés métier, médias, chemins et protections locales. `npm run verify:release` vérifie une installation jetable et une sauvegarde/restauration réelle, sans utiliser votre collection. Docker est nécessaire ; les fichiers de contrôle restent sous `.local/`, hors Git.

La validation visuelle finale reste manuelle. [Contribuer](CONTRIBUTING.md) · [Sécurité](SECURITY.md) · [Architecture](docs/architecture.md) · [État et vérifications](docs/status.md).

## Autres vues

![Une fiche de jeu détaillée](docs/screenshots/fiche-detaillee.webp)

<details>
<summary>Bibliothèque, envies et univers Amiga / Amstrad</summary>

![La bibliothèque](docs/screenshots/bibliotheque.webp)
![Les envies](docs/screenshots/envies.webp)
![L’univers Amiga](docs/screenshots/amiga.webp)
![L’univers Amstrad](docs/screenshots/amstrad.webp)

</details>

## Licence et retours

Code sous **AGPL-3.0-only**, copyright © 2026 Henri Teinturier et les contributeurs. Voir [LICENSE](LICENSE) et [NOTICE.md](NOTICE.md). Les illustrations de jeux et marques ne sont pas placées sous AGPL par leur présence dans le projet.

Un problème d’installation, une idée, un souvenir de joueur ? Les retours via les issues sont bienvenus. Si Luden vous intéresse, une étoile sur le dépôt permet aussi de le faire connaître.
