# Médias et liens

Lire ce document uniquement pour modifier l'import, la galerie ou les liens.

## Miniatures automatiques

`/media/<id>?w=320|640|1280` sert une version WebP redimensionnée en largeur,
sans recadrage ni agrandissement, avec transparence conservée. Sans `w`, la route sert
le fichier importé intact. Les autres tailles sont refusées (400). Le contrôle local,
le propriétaire et le chemin borné sont vérifiés avant la lecture du cache.

Les cartes de jeux, boîtes/jaquettes, supports et logos de jeu dans la sidebar, ainsi
que les petites captures et galeries média utilisent ces variantes via `srcset`/`sizes`.
Le navigateur choisit selon l’espace affiché et sa densité de pixels ; chargement différé
des jaquettes et petites galeries. La grande scène et les agrandissements gardent les
originaux. Les fonds et visuels de plateformes ne sont pas concernés.

`src/server/image-variants.ts` crée uniquement la taille demandée au premier accès,
pour les médias existants comme pour les prochains imports (fichier, URL ou IGDB).
Aucune migration ni préparation manuelle. Deux conversions simultanées maximum par
processus ; les demandes identiques partagent le même travail. Entrée Sharp en mémoire
pour éviter les verrous de fichiers Windows, écriture temporaire puis renommage atomique.
Un échec de conversion ou de cache sert l’original avec `private, no-store` pour permettre
une nouvelle tentative ; variantes réussies en cache navigateur privé pendant un jour.

Cache disque : `LUDEN_DATA_DIR/cache/thumbnails/v1/<empreinte>/<largeur>.webp`, hors des
originaux et du rangement des médias. L’empreinte inclut chemin, taille et dates du fichier ;
déplacement/remplacement produit une nouvelle variante. Un média absent ou supprimé n’est
pas servi depuis ce cache. Les anciennes variantes ne sont pas purgées automatiquement.
Ce dossier est régénérable, excluable des sauvegardes et reste hors Git ; aucun original
n’est modifié ou supprimé par la génération.

## Rangement sur disque

Les visuels d’accueil des univers sont conservés à part dans `PlatformVisual` :
`LUDEN_DATA_DIR/media/plateformes/<id>/bandeaux/<uuid>.webp` ou `affiches/<uuid>.webp`.
Les fichiers fournis par le joueur, y compris les défauts, restent hors Git et hors `public`.
Le formulaire `/platforms/<id>/edit` permet les imports multiples, noms, ordre, activation et
choix d’un défaut pour chaque type. Le bouton « Modifier » de la sidebar y conduit.
Il permet aussi d’activer le défilement des affiches et sa durée (3 à 120 secondes), stockés
sur Platform. Le dernier visuel consulté reste propre au navigateur dans localStorage.
Un import est immédiatement conservé mais inactif en base ; « Enregistrer la présentation »
applique les choix du formulaire. Désactiver ne supprime ni la ligne ni le fichier.
« Supprimer » demande confirmation puis retire immédiatement l’entrée et son fichier Luden,
sans toucher au fichier source. Le défaut supprimé est remplacé par la première image active du
même type, sinon l’identité de remplacement est affichée. Les autres modifications du formulaire
restent en brouillon. Transaction avec verrou de plateforme ; retrait disque après commit seulement,
avec message si le fichier n’a pas pu être nettoyé. Contrôle du propriétaire et de la plateforme.
Les limites/décodage sont ceux des jeux : 12 Mo, WebP 2560 px maximum, ratio conservé, sans crop.
Ces images ne sont pas des pièces jointes de jeu : le rangement/nettoyage des jeux les ignore.
Lecture locale `/platform-media/<id>` avec contrôle du propriétaire et chemin borné ; absence
de visuel actif = identité de remplacement. Inclure ces dossiers dans les sauvegardes média.
Migration additive `20261001090000_platform_visuals`, contraintes défaut actif/unique et ordre positif.
Le bandeau SNES corrigé (2168 × 340) et l’affiche (1024 × 1536) sont en base et définis par défaut.
L’ancien bandeau 1400 × 467 reste en base, inactif et sélectionnable dans le formulaire.
L’ancien fichier SNES `sidebar.webp` et son ancienne route conventionnée ont été retirés.
Import local explicite : `npx tsx scripts/import-platform-visual.ts <plateforme> <BANNER|POSTER> <fichier> <nom>`
(ajoute et choisit le nouveau défaut). Contrôle isolé : `npx tsx scripts/check-platform-visuals.ts`.

Tous les imports (fichier, URL, IGDB) vont d’abord dans `media/_imports/`. À l’enregistrement de
la fiche, `media-organization.ts` les range sous
`media/jeux/<plateforme>/<titre-normalisé>--<id-jeu>/<catégorie>-<id-média>.webp`.
Exemple : `jeux/snes/super-mario-world--<id>/jaquette-<id-média>.webp`.
Les titres sont limités à 48 caractères, sans accents ni caractères interdits Windows ; les
identifiants complets évitent les collisions. Les catégories donnent des préfixes français :
jaquette, capture, boite, support, document, publicite, image. Le fond et le logo restent des
rôles de présentation, indépendants de ces catégories.

Le titre, la plateforme ou la catégorie modifiés entraînent un nouveau rangement à la sauvegarde.
Les médias des exemplaires suivent aussi leur jeu. Un fichier partagé par plusieurs jeux reste
unique dans `_partages/`. Les médias sans jeu sont conservés dans `_sans-jeu/` lors d’une migration.
Les identifiants et URLs `/media/:id` restent stables ; seul `Media.path` change.

Les déplacements et nettoyages sont sérialisés par `.organisation.lock` (PID local). Copie vers
un fichier `.pending`, vérification SHA-256, renommage, mise à jour conditionnelle en base, puis
suppression de l’ancien fichier ; seuls les dossiers vides sont retirés. Un échec avant la mise
à jour laisse l’ancien chemin lisible. Un échec de rangement après sauvegarde de fiche est signalé
dans la notification sans faire passer la fiche pour non enregistrée. Réenregistrer permet de réessayer.

### Migration des anciens dossiers

- `npm run media:organize` : inventaire et simulation sans mutation.
- `npm run media:organize:apply` : sauvegarde PostgreSQL via Docker Compose (`pg_dump -Fc`),
  journal `plan.json`, déplacement et contrôle final des empreintes et chemins DB.
- `node --import tsx scripts/organize-media.ts --resume "<chemin-absolu-vers-plan.json>"` :
  reprendre le même journal après interruption ; les copies déjà vérifiées sont réutilisées.

La sauvegarde et le journal restent dans `LUDEN_DATA_DIR/backups/rangement-medias-<date>/`, jamais
dans Git. Éviter de modifier les fiches pendant cette maintenance. Les fichiers sans référence
sont préservés sous `_sans-reference/` avec leur ancienne arborescence. Une image manquante liée
à un jeu bloque le précontrôle ; une entrée sans fichier ni aucune référence est nettoyée après
sauvegarde. Aucun retrait global des fichiers inconnus. Ne pas restaurer le dump seul après le
rangement : il contient les anciens chemins ; le journal garde leur correspondance.

## Présentation des fiches

Migration `20260930120000_game_presentation` : `Game.presentation` JSONB, défaut `{}`, sans modifier
les médias existants. `src/lib/game-visuals.ts` valide les quatre rôles et le cadrage (x/y 0–100,
zoom 1–3). Les références doivent rester parmi les MediaAttachments du jeu ; elles sont effacées
automatiquement au retrait. Les catégories de classement et l’image principale restent indépendantes.

`game-form/visual-fields.tsx` : sélection de médias existants, imports dédiés et cadrage automatiquement
proposé pour un fond. L’import passe toujours par le service habituel ; aucune découpe de fichier.
`game-background.tsx` utilise la même géométrie dans l’éditeur et la sidebar. La fiche complète utilise
le fond centré avec zoom 1. Replis : BOX puis coverId pour la boîte, MEDIA pour le support, texte pour
le titre, fond sobre. PNG/WebP transparents conseillés pour logo et objets.

Nouveaux imports : bornés à 2560 × 2560 px, sans agrandissement, WebP qualité 88. Fond conseillé
2560 × 1440 px (16:9), rappel dans un encadré visible au-dessus des rôles dans le formulaire.
Le champ boîte explique aussi son choix automatique : BOX puis image principale de bibliothèque.
Les fichiers déjà présents ne sont pas retraités.
Export JSON **version 6** : inclut `platforms` et leurs réglages de défilement, `platformVisuals` (chemins et choix depuis v5) et la présentation des jeux (v4) ; binaires toujours hors export.
Contrôle DB ciblé facultatif : `npx tsx scripts/check-game-presentation.ts`, ses seules fixtures
et images temporaires sont nettoyées. Tests unitaires de références, géométrie et mutation partielle.

Catégorie `ADVERTISEMENT` / « Publicités » : annonces de magazines et visuels promotionnels,
groupe dédié dans l’éditeur et la fiche. Migration additive `20260927180000_advertisement_media`
sur l’enum PostgreSQL `MediaCategory` ; fichiers et catégories existants conservés.

- `src/lib/media.ts` : catégories, liens HTTP(S), validation de la principale unique et ordre.
- `src/server/media.ts` : copie WebP locale (sans crop), lecture, nettoyage des fichiers inutilisés.
- `src/server/remote-image.ts` : téléchargement borné et protection contre les accès au réseau privé.
- `src/server/igdb.ts` : recherche, dates, jaquette, jaquettes régionales, captures et illustrations.
- `src/server/library.ts` : transaction fiche/galerie/liens, contrôle propriétaire, exemplaires stables.
- `src/components/game-form/media-fields.tsx` et `link-fields.tsx` : édition par groupes.
- `src/components/game-media.tsx` : galerie, agrandissement et liens dans la fiche.
- `src/styles/media.css` : previews avec `object-fit: contain`.

Migration `20260926150000_game_media` : ajoute les rattachements et liens, transforme chaque coverId
existant en COVER principale sans modifier les fichiers. Les anciens emplacements `images/` et
`games/covers/` sont repris par le rangement décrit ci-dessus. Media contient le fichier,
MediaAttachment son usage.
Contraintes SQL supplémentaires : contexte exclusif, position positive et principale unique par contexte.
Un média encore utilisé par un exemplaire ou un autre jeu n'est jamais nettoyé.

Le formulaire envoie toute la galerie et les liens ; omission conserve l'existant pour compatibilité.
La principale peut être de n'importe quelle catégorie. Les cartes utilisent toujours Game.coverId.
100 images/liens maximum par fiche ; 12 Mo par import. GIF : première image uniquement.
Les fichiers sont optimisés en WebP, pas archivés dans leur format original ; ratio conservé.
Les vidéos/sites ne sont jamais téléchargés, seulement liés. Export JSON version 6 inclut les associations, les choix de présentation, les visuels des plateformes et leurs réglages de défilement.

Vérifications : `npm run check` (7 tests ciblés) ; `npx tsx scripts/check-media.ts` pour le parcours DB
optionnel, avec médias temporaires et nettoyage de ses propres fiches uniquement.
Validation visuelle principalement par l'utilisateur.

Référence API : https://api-docs.igdb.com/ (games, game_localizations, screenshots, artworks).
