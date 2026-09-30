# Médias et liens

Lire ce document uniquement pour modifier l'import, la galerie ou les liens.

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
existant en COVER principale sans modifier les fichiers. Les nouveaux fichiers sont dans `media/images/` ;
les anciens chemins `games/covers/` restent valides. Media contient le fichier, MediaAttachment son usage.
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
