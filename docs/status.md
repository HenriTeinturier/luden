# État courant

- Coups de cœur : contour doré permanent sur les cartes de jeux, toutes plateformes et vues grille/liste, indépendamment du filtre Megastar. Badge cœur conservé, dimensions des cartes inchangées.

- Univers Amstrad CPC : carte illustrée et bandeau compact avec logo, CPC et diagonales. Dimensions alignées sur SNES/Amiga, matériel adapté aux petits écrans. Disquette retirée. Crocodile V2 au milieu du bandeau, mains débordant de 18 px ; décor non interactif, masqué sous 1200 px.

- Fiche de jeu : retour contextuel vers la plateforme, la collection, À découvrir ou Ma bibliothèque selon la carte d’origine. Filtres transmis dans l’URL et conservés après édition ; ouverture directe sans origine retourne à Ma bibliothèque.

- Cartes Amiga : images alignées en haut du cadre pour supprimer l’espace lié au centrage des ratios différents, sans recadrage. Titres en 13 px sur une seule ligne, tronqués par « … » et nom complet au survol.

- Grille Amiga : padding retiré autour des jaquettes, conservé uniquement autour du titre et des étoiles. Proportions des images conservées, vue liste inchangée.

- Médias : catégorie « Publicités » (`ADVERTISEMENT`) ajoutée à l’import, au classement et à la galerie. Migration additive appliquée en base et client Prisma régénéré ; serveur Vite redémarré sur le port 3000. Données existantes conservées.

- Barre commune : bouton cœur « Megastar » pour activer/désactiver les coups de cœur, combinable avec la vue courante. Réutilise le filtre favori et sa mémorisation navigateur ; infobulle « Mes coups de cœur ».

- Toutes les galeries : compteur de jeux et réinitialisation intégrés dans la barre de filtres, ligne inférieure supprimée. Retour à la ligne dans la barre si nécessaire, compteur annoncé aux lecteurs d’écran.

- Cartes de jeux Amiga allégées : jaquette, titre et étoiles conservés ; plateforme/année, statut, icônes de possession, extrait de souvenir et note chiffrée masqués. Format vertical et favori conservés, détails toujours dans la fiche.

- Bandeau Amiga : composition élargie pour espacer joystick et ordinateur, sans agrandir les objets ni augmenter la hauteur.

- Préremplissage plateforme : corrigé aussi pour « Ajouter mon premier jeu » dans une galerie vide, sur toutes les plateformes. Le header transmettait déjà la plateforme ; les deux accès initialisent désormais recherche IGDB et fiche via le même paramètre URL.

- Bandeau Amiga : ordinateur et Quickjoy agrandis, cadrage partiel masqué par le bandeau, hauteur inchangée. Zoom réduit sous 1100 px ; matériel toujours masqué sur mobile. Carte de plateforme inchangée.

- Navigation et plateformes compactées : fil d’Ariane/seconde ligne supprimés, Mes univers en menu dans le header. Bandeaux plateforme d’environ 120 px sur desktop, sans textes décoratifs, alignés avec les filtres sur la largeur des jeux. Logos, compteurs et matériel conservés. TypeScript/lint validés ; rendu à valider par Henri.

- Navigation horizontale : recherche et Ajouter/Enregistrer persistants, menu dépliable sous 1650 px, informations locales en pied de page. Styles isolés dans `src/styles/header.css`. Version avant passage à la navigation horizontale : `21d7f4e`.

- Titre de Mes plateformes : Chakra Petch 600, rétro légèrement carrée, servie localement via Fontsource. Application limitée à ce titre ; couleur et taille conservées.

- Mes plateformes : en-tête simplifié en un seul titre « Les machines de votre histoire », sans surtitre ni sous-titre.

- Mes plateformes : celles avec au moins un jeu enregistré passent en premier, puis tri alphabétique français dans chaque groupe (avec/sans jeux), également sous les filtres de famille. Ordre calculé, sans stockage ni glisser-déposer pour le moment.

- Barre de galerie commune partout (bibliothèque, collections, découverte, toutes les plateformes) : Joués / À découvrir / Possédés / Tous mes jeux, recherche, regroupement, tri et vue. Plateformes ouvertes sur Joués, Découverte sur À découvrir ; préférences navigateur prioritaires. Les collections restent limitées à leurs jeux.

- Identité Amiga : carte large et bandeau intérieur avec logo, Amiga 500, arc-en-ciel et Quickjoy (bandeau). Assets fournis copiés dans `public/platforms/amiga/`, fond graphite chaud, adaptation mobile. Galerie inchangée ; rendu à valider par Henri.

- Import d’image par URL : erreur affichée directement sous la ligne de saisie, associée au champ pour l’accessibilité et effacée à sa modification ou à une nouvelle tentative.

- Ajout depuis une bibliothèque plateforme : le bouton du header transmet la plateforme au formulaire via l’URL ; recherche IGDB et champ plateforme préremplis, toujours modifiables. Une plateforme inconnue est ignorée ; ajout général et édition inchangés.

- Sauvegarde de jeu : attendre le rafraîchissement complet des données (`invalidate({ sync: true })`) avant la navigation, pour éviter de revenir sur une bibliothèque encore obsolète. Signalement Magical Quest : deux ajouts étaient enregistrés ; doublon supprimé par l’utilisateur, aucune donnée modifiée pour le correctif. Cause exacte non reproduite.

- Bibliothèques : « Sans regroupement » par défaut. Filtres, tri, vue et regroupement mémorisés en localStorage par bibliothèque, hors texte de recherche. URL explicite prioritaire ; aucune écriture en base.

- Après création d’un jeu : ouverture de sa bibliothèque plateforme, tri récent ; vue Joués ou Tous si le nouveau jeu est non joué. Après édition : retour à la fiche conservé.

- Création/édition : le header remplace « Ajouter un jeu » par « Enregistrer » et reste visible au défilement. Soumission du même formulaire, désactivée pendant import/sauvegarde, erreurs focalisées. Retour au bouton Ajouter en quittant le formulaire.

## Catégories de rangement

- Une catégorie facultative par jeu, distincte des genres IGDB. Onze catégories initiales.
- Galerie par sections successives en option ; sans regroupement par défaut, choix mémorisé dans le navigateur.
- Renommage, ajout et ordre dans Paramètres. Jeux existants conservés dans « À classer ».
- Migration additive appliquée ; client Prisma régénéré et serveur Vite relancé sur le port 3000.
- TypeScript, lint et trois tests ciblés réussis. Aucun test visuel effectué.
- Voir `docs/categories.md` pour le modèle, l’export et les fichiers concernés.

- Création de jeu : statut « Joué » présélectionné, modifiable. L’édition conserve le statut existant.

- Navigation plateforme : fil d’Ariane « Mon espace / Mes plateformes / nom de la plateforme », parents cliquables. Retour redondant supprimé ; fil visible aussi sur écran étroit.

## Carte plateforme SNES

- Bandeau intérieur harmonisé : mêmes logo, console et fond Aurora que la carte ; titre accessible conservé via le logo.
- Logo et console fournis par Henri copiés sans modification dans `public/platforms/snes/`.
- Carte SNES large (deux colonnes), fond Aurora en CSS, nom et compteur en HTML.
- Assets de présentation du site versionnés ; distincts des médias personnels de la collection.

## Première page plateforme : SNES

- Boutons de vue, recherche et tri regroupés dans une même barre ; retour à la ligne si l’espace manque.
- Desktop : galeries plateforme pleine largeur ; bannière et filtres centrés, largeur limitée.
- Cartes SNES : titre et étoiles sur une même bande de 32 px, titres longs tronqués avec nom complet au survol ; icônes de possession masquées. Vue compacte inchangée.
- Cartes allégées : plateforme, année, statut et icônes de possession masqués.
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
