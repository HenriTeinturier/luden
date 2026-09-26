# État courant

## Première page plateforme : SNES

- Habillage PAL dans `src/styles/platforms.css`, illustration locale `public/snes-console.svg`.
- Boîtes horizontales à plat, proportions conservées ; titre et étoiles au premier plan.
- SNES affiche les jeux joués par défaut (en cours, terminés et abandonnés inclus).
- Vues visibles : Joués, À découvrir, Possédés actuellement, Tous mes jeux. Filtres dans l’URL.
- Aucune modification des données ni des autres habillages plateforme. Amiga à travailler ensuite.
- TypeScript et un test ciblé des filtres validés ; rendu à valider par Henri.

## Correction sidebar responsive

- Collision de variables corrigée : largeur via `--sidebar-width`, couleur via `--sidebar-background`.
- Sidebar et décalage du contenu partagent la même largeur : 236 px, 206 px puis 76 px sous 980 px.
- Vérification ciblée CSS et formatage ; validation visuelle par Henri.

## Palette bleu nuit / Aurora

- Palette centralis�e dans `src/styles/palette.css`, appliqu�e par `theme.css`.
- Surfaces bleu nuit, interactions bleues, hero violet/mauve, boutons corail, �toiles jaunes.
- Logo, favicon et illustration recolor�s. Structure et dimensions inchang�es.
- Variante pr�c�dente Console 90 : `761bdca`. Validation visuelle laiss�e � Henri.
- V�rification limit�e au formatage et au diff ; aucun test visuel ou op�rationnel.

- Compteurs d'accueil : libellés 14 px, chiffres 30 px, contraste renforcé et survol sombre corrigé.

- Accueil : introduction « Votre vie, côté jeux » supprimée ; le bandeau illustré porte désormais le h1.

- Logo revu : cartouche pixel avec monogramme L et lettrage vectoriel dessiné, fichiers
  `public/luden-logo.svg` et `public/favicon.svg`. Version symbole seul pour navigation compacte.

## Refonte visuelle rétro — 2026-09-26

- Socle aubergine/corail/jaune/turquoise, illustration vectorielle originale pixel art sur l'accueil.
- `src/styles/theme.css` centralise la nouvelle direction ; formulaires toujours structurés.
- `src/lib/presentation.ts` : ratios par plateforme. SNES/N64/GBA horizontaux, cartes plus larges,
  formats carrés et verticaux ; aucun crop des fichiers. Habillages plateforme à affiner ensemble.
- Fiche compacte : grande jaquette, étoiles, avis court, détails dépliables.
- Notes sur 5, demi-étoiles. Migration appliquée : anciennes notes /10 divisées par deux et
  arrondies à la demi-étoile la plus proche. Rien effacé.
- TypeScript, lint et build réussis. Aucun test visuel ni parcours opérationnel exécuté,
  conformément à la demande de l'utilisateur. Tests unitaires non relancés pour cette refonte.
- À faire : validation visuelle par Henri, puis ajustements des univers plateforme un par un.

## Notifications — 2026-09-26

- Confirmation de suppression explicitée : nom du jeu et « Oui, supprimer ce jeu ».
- Notification accessible après ajout, modification et suppression réussis ; persiste entre les routes,
  disparaît après 6 secondes ou fermeture manuelle. Composant `src/components/notifications.tsx`.
- Rangement plateforme/jeu/catégorie discuté ensuite : encore à implémenter, sans migration des anciens fichiers.

## Médias multiples — 2026-09-26

- Migration appliquée : anciennes jaquettes conservées comme COVER principale.
- Images par fichier ordinateur, URL directe et sélection IGDB ; catégories, légendes, ordre et principale.
- Galerie de fiche avec agrandissement ; vidéos/articles/tests/guides sous forme de liens uniquement.
- Recherche : vignettes agrandies, dates, filtre plateforme facultatif, choix obligatoire avant validation.
- Possessions à identifiants stables, rattachement Media réutilisable pour les futurs exemplaires.
- Export JSON v2. Documentation ciblée : `docs/media.md`.
- Vérifié : TypeScript, lint, 7 tests, build et parcours DB création/édition/nettoyage avec fixtures isolées.
- Appels IGDB réels et téléchargement d'une image publique vérifiés avec les identifiants configurés.
- Validation visuelle laissée à l'utilisateur. Aucune suite visuelle ajoutée.
- Dernier ajustement : bouton fichier renommé « Depuis mon ordinateur ».

## Historique V1 — 2026-09-26

- TanStack Start / React, backend intégré, Prisma 6, PostgreSQL 17.
- Conteneur `luden-db-1`, port local 5434, volume `luden_postgres_data`.
- `.env` local créé, mot de passe aléatoire ; aucun secret versionné.
- Accueil illustré, bibliothèque galerie/liste, filtres/recherche/tri, plateformes et PC personnels.
- Ajout/édition/suppression de fiches indépendantes par plateforme, notes/souvenirs/envies.
- Possessions actuelles/anciennes, physiques/digitales, boutiques.
- Collections réelle/rêvée personnalisées, création/édition/suppression sans supprimer leurs jeux.
- Images locales validées et converties en WebP, remplacement, route média ; export JSON.
- Recherche IGDB et copie locale de jaquette implémentées, facultatives.
- Bibliothèque vide : les données des contrôles ont été retirées.

## Vérifications effectuées

- `npm run check` : TypeScript, ESLint, 3 tests ciblés OK.
- `npm run build` puis serveur compilé : OK.
- Parcours serveur ponctuel : séparation des métadonnées, transaction, collection réelle avec possession
  ancienne, suppression de collection sans perte de jeux, image locale et export HTTP : OK.
- Une création depuis le navigateur : OK. Contrôle visuel ponctuel de l'accueil effectué.
- Audit npm : aucune vulnérabilité après correction de Sharp et override deepmerge-ts.
- Aucun test visuel automatisé et aucune suite E2E ajoutée.

## À configurer par l'utilisateur

1. `LUDEN_DATA_DIR` dans `.env` : chemin Windows/OneDrive absolu, puis redémarrage.
2. Facultatif : `IGDB_CLIENT_ID` et `IGDB_CLIENT_SECRET`, puis redémarrage.
   Configurés depuis ; appels réels vérifiés pendant l’évolution médias.

## Prochaine étape

Retours visuels/utilisation de l'utilisateur. Parcours conseillé : créer un PC si nécessaire,
ajouter deux versions d'un jeu, choisir des images, saisir un souvenir, tester les deux collections.
Ne pas relancer une grande batterie de tests pour des ajustements graphiques mineurs.

## Limites connues / futures

- Profil local uniquement, aucun partage/auth ; l'application refuse les hôtes non locaux.
- Catalogue de 29 plateformes fourni ; ajouter d'autres plateformes dans `src/lib/platforms.ts`
  puis amorcer la base, pas encore d'éditeur de plateformes dans l'interface.
- Dates de sortie à l'année, période personnelle libre ; éditions détaillées reportées.
- Les métadonnées IGDB peuvent décrire plusieurs versions : vérification/correction manuelle disponible.
- Export sans fichiers binaires, pas de réimport ; pas de purge automatique des médias détachés.
- Sous Windows, arrêter `npm start` avant une recompilation (DLL Prisma verrouillée sinon).
- Quelques avertissements des dépendances sur les directives `use client` au build Nitro ; build fonctionnel.
