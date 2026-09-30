# Médias et liens

Lire ce document uniquement pour modifier l'import, la galerie ou les liens.

## Rangement sur disque

Les images d’accueil des univers sont conservées à part :
`LUDEN_DATA_DIR/media/plateformes/<id-plateforme>/sidebar.webp`.
L’image SNES fournie est copiée sans conversion (1024 × 1536, empreinte vérifiée).
Ces images ne sont pas des pièces jointes de jeu ni des imports provisoires : elles ne participent
pas à la migration des lignes `Media` et ne sont pas supprimées avec un jeu. Elles sont détectées
au chargement de la bibliothèque et servies par `/universe-media/<id>` ; absence d’image = identité
visuelle de la plateforme. Elles restent hors Git et doivent être incluses dans la sauvegarde du dossier média.

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
Export JSON **version 4** : ajoute la présentation à chaque jeu ; binaires toujours hors export.
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
Les vidéos/sites ne sont jamais téléchargés, seulement liés. Export JSON version 4 inclut les associations et les choix de présentation (associations depuis v2).

Vérifications : `npm run check` (7 tests ciblés) ; `npx tsx scripts/check-media.ts` pour le parcours DB
optionnel, avec médias temporaires et nettoyage de ses propres fiches uniquement.
Validation visuelle principalement par l'utilisateur.

Référence API : https://api-docs.igdb.com/ (games, game_localizations, screenshots, artworks).
