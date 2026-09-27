# Médias et liens

Lire ce document uniquement pour modifier l'import, la galerie ou les liens.

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
Les vidéos/sites ne sont jamais téléchargés, seulement liés. Export JSON version 2 inclut les associations.

Vérifications : `npm run check` (7 tests ciblés) ; `npx tsx scripts/check-media.ts` pour le parcours DB
optionnel, avec médias temporaires et nettoyage de ses propres fiches uniquement.
Validation visuelle principalement par l'utilisateur.

Référence API : https://api-docs.igdb.com/ (games, game_localizations, screenshots, artworks).
