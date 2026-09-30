# Direction graphique actuelle

## Consultation commune : sidebar et fiche complète

Toutes les plateformes partagent le même parcours, dans `game-explorer.tsx` et `game-details.tsx`.
Le clic sur une carte ouvre un panneau occupant environ un tiers à droite et réduit la galerie.
La carte consultée porte un contour bleu clair de 3 px autour de son périmètre complet, un halo
et un fond bleu/violet plus marqué sous le titre. Le repère est porté par la carte pour éviter
le rognage par ses coins ; dimensions et sceau Megastar conservés, y compris en liste.
Sur écran étroit (800 px et moins), seul le panneau est visible. Les proportions des visuels
suivent la plateforme ; les différences futures sont uniquement de présentation.
La scène de la sidebar est au ratio paysage 16:7 sur desktop (6:5 sur mobile), avec le même ratio
dans l’outil de cadrage. Les captures font 80–112 px de haut selon la hauteur de l’écran, indépendamment
de la largeur du panneau. Espacements compacts pour garder les informations et actions visibles sur
un écran 2560 × 1440, y compris avec une hauteur utile de navigateur réduite à 1280 px.

Sidebar : navigation superposée au fond, sans bandeau opaque ni surtitre plateforme/année.
Logo droit, sans rotation ni perspective, réduit à 34 % de la largeur du panneau et centré dans l’espace entre navigation
et fermeture (réserves gauche 180 px / droite 68 px), positionné à 16 px du haut pour un logo recadré sans marges transparentes.
Boîte et support plus grands, décalés sous le fond de 148 px. Support droit,
boîte agrandie de 12 % en hauteur avec son bas ancré et son image alignée à gauche sur la marge
des étoiles lorsqu’un support est présent (24 px, 18 px sur petit mobile), sans centrage interne du visuel.
La boîte reçoit un décalage vertical supplémentaire de 16 px, indépendant du support.
La cartouche garde sa position ; la boîte seule reste centrée horizontalement.
Ombre elliptique de contact sous le support. Le titre n’est affiché que dans la scène (logo ou texte),
sans répétition au-dessus des étoiles ; un titre masqué reste accessible aux lecteurs d’écran.
Éditeur, année et tous les genres occupent une ligne défilable si nécessaire.
Dans la sidebar, les étoiles n’affichent pas de note chiffrée à côté ; le sélecteur de note reste disponible.
Ce sélecteur compact associe une étoile dorée, la valeur seule (sans « / 5 ») et un chevron sur fond sombre légèrement doré ; focus visible et options sombres. Le tiret représente l’absence de note.
Trois cartes séparées partagent le même style : « Dans ma collection », « Joué » et « À découvrir ».
Même hauteur, coins arrondis, icône à gauche et bordure discrète ; gris inactif, vert pour la possession,
corail pour Joué et violet pour À découvrir. Les états actifs ont un fond coloré opaque soutenu,
une bordure nette et une coche à droite pour ne pas dépendre uniquement de la couleur.
Les trois bascules restent indépendantes.
Dans la sidebar, « Mes souvenirs » associe une icône carnet à un lien « Modifier » (ou « Écrire » si vide).
Ce lien ouvre un champ multiligne sur place avec « Enregistrer » et « Annuler ». La sauvegarde partielle
ne modifie que le souvenir, conserve le brouillon en cas d’erreur et accepte un texte vide.
La navigation entre jeux et vers la fiche est suspendue pendant l’édition pour conserver le brouillon.
Le bouton « Modifier » du pied de sidebar continue d’ouvrir le formulaire complet.
Les captures sont regroupées dans un cadre sombre bleu, avec compteur et lien « Voir tout ».
Le carrousel montre quatre vignettes, trois sous 460 px, une sélection au contour bleu/violet lumineux
et des flèches latérales désactivées aux extrémités. « Voir tout » ouvre la grille des captures ;
une vignette ouvre l’image agrandie avec navigation et retour possible à la grille.
Sur une sidebar large, les trois cartes sont alignées ; sous 540 px, la collection occupe une ligne
et les cartes Joué / À découvrir restent côte à côte dessous.
Joué reflète tout statut autre que non joué ; son clic bascule PLAYED/UNPLAYED. Les statuts détaillés
restent dans la fiche complète et le formulaire, sans conversion lors de la simple consultation.
Toutes ces actions enregistrent immédiatement sans ouvrir l’édition. Le bouton « Modifier »
conserve l’accès au formulaire détaillé.
Le favori est un trophée étoilé « Megastar · Jeu culte »
sur la ligne de notation : dessin SVG dédié, violet/bleu électrique si actif et lavande discret sinon ; même booléen favori que
les étiquettes de jaquettes et le filtre Megastar, aucun nouvel indicateur indépendant.
La barre commune réutilise le même trophée via `MegastarTrophy` et la même palette : violet `#7C5CFF`,
profondeur `#4324B7`, bleu électrique `#37C8FF`, texte actif `#F3F5FF`, fond `#0D1535` et bordure
inactive `#55608F`. Un séparateur vertical distingue le trophée du libellé, sans chevron.
L’état actif reçoit une bordure en dégradé violet/bleu et un halo ; le filtre reste compact sur une ligne.
La fiche complète conserve sa composition et ses contrôles précédents.

La sidebar présente les visuels, le titre, les informations courtes, l’expérience modifiable,
un extrait de souvenir, la possession et les captures agrandissables. Deux actions : fiche complète
et édition. Aucun bouton de lancement, aucune note communautaire inventée, résumé réservé à la fiche.

La fiche complète utilise une scène large (fond, logo ou titre, boîte et support), puis expérience,
souvenirs, captures, informations, possessions, collections et médias. Le fond sobre et le titre
texte permettent de consulter immédiatement les anciennes fiches. Styles dans `styles/game-details.css`.
Sur desktop, le bandeau complet suit la hauteur disponible (280–340 px), avec objets de 260 px
maximum et composition centrée sur la largeur du contenu. Titre/logo et espacements sont réduits ;
captures de 96–140 px de haut pour voir l’expérience, les souvenirs et les captures dès le premier
écran. Les informations longues et les médias supplémentaires restent accessibles en défilant.

Gauche/droite parcourent l’ordre visible au moment de l’ouverture, regroupement compris, sans boucle.
Échap remonte d’un niveau et conserve le jeu courant. Les raccourcis ignorent les champs et modales.
Filtres et défilement sont conservés ; modifier les filtres referme la sélection. Le parcours intégré
reste sur l’URL de la galerie ; les URLs de jeu servent toujours à l’ouverture directe/nouvel onglet.
L’ordre capturé évite qu’une action rapide fasse sauter un jeu pendant la consultation.

Boîte/jaquette, support, logo transparent et fond sont quatre rôles facultatifs, indépendants de
la vignette principale. Import par rôle et réutilisation d’images existantes. Le fond ouvre un outil
de cadrage sidebar (déplacement, zoom, trois curseurs accessibles), modifiable ensuite. L’image
reste entière pour la scène large. Format de création conseillé : 2560 × 1440 px, 16:9, sans texte.

## Navigation horizontale (essai)

La sidebar est remplacée par un header sticky : logo, navigation existante, paramètres,
profil, recherche et action Ajouter/Enregistrer. Fil d’Ariane supprimé ; Mes univers est un menu
compact dans la navigation principale, sans seconde ligne permanente.
Sous 1650 px, le bouton Menu déplie navigation et profil ; recherche et action restent visibles.
Les informations d’espace personnel sont conservées dans le footer. Aucun changement de routes
ou d’options. Styles isolés dans `src/styles/header.css`, importé en dernier, ancien CSS conservé
pour cette phase d’essai. Version avant essai : `21d7f4e`.

Le titre « Les machines de votre histoire » utilise Chakra Petch 600 (sous-ensemble latin,
servi localement via Fontsource), pour une touche rétro lisible. Les autres titres et textes
conservent leur typographie. Règle limitée à `.platforms-index .page-heading h1`.

## Amiga

Carte large et bandeau intérieur : fond graphite chaud, arc-en-ciel atténué à droite,
logo blanc et Amiga 500 avec souris. Le joystick Quickjoy complète le bandeau intérieur.
Dans le bandeau compact, matériel agrandi et partiellement cadré par les bords, joystick devant
l’ordinateur. Zoom réduit sous 1100 px, sans augmenter la hauteur du bandeau.
Assets fournis par Henri, conservés sans modification dans `public/platforms/amiga/`.
Textes et compteurs en HTML ; proportions des images conservées. Cartes Amiga et SNES de même
format : deux colonnes, hauteur 250 px (190 px sur mobile). Bandeau intérieur aligné sur SNES ;
matériel masqué sur mobile comme pour SNES. Styles isolés dans `src/styles/platforms.css`.
Cartes de jeux Amiga : format vertical conservé, titre puis étoiles. Images alignées en haut
sans padding, proportions conservées ; coins masqués par l’arrondi de la carte. Titre 13 px sur
une seule ligne avec ellipsis et nom complet au survol. Pas de note chiffrée, plateforme/année,
statut, icônes de possession ou extrait de souvenir. Favori conservé sur la
jaquette comme pour SNES. Les informations détaillées restent dans la fiche.

## Super Nintendo

Carte d’entrée : logo et console transparents fournis par Henri dans `public/platforms/snes/`.
Composition large sur deux colonnes, fond CSS Aurora, textes HTML ; originaux conservés hors repo.

Premier univers dédié : présentation textuelle « Super Nintendo », accroche et description,
repères Nintendo / 1990 / 16-bits / genres, puis quatre cartes de statistiques colorées.
Compteurs issus de tous les jeux SNES : bibliothèque, joués, coups de cœur et jeux possédés
actuellement (au moins une possession CURRENT, chaque jeu compté une seule fois). Pourcentages
rapportés au total SNES, indépendants des filtres. Quatre colonnes, puis deux si la place manque.
L’ancien bandeau compact avec logo, console PAL et accents de manette reste dans le composant
avec `hidden` et une règle CSS explicite : il est conservé pour réutilisation, sans double titre visible.
Styles isolés dans `src/styles/platforms.css`. Les autres plateformes conservent leur bandeau.
Galerie de faces avant à plat, horizontales, sans recadrage. Titre et étoiles sont prioritaires ;
plateforme, année, statut et icônes de possession sont masqués sur les cartes SNES pour les alléger.
En grille SNES, une bande de 32 px accueille le titre à gauche et les étoiles à droite, sans chiffre répété. Le titre est tronqué si nécessaire, avec son nom complet au survol ; aucune note ne recouvre la jaquette.
Sur desktop, présentation, filtres et galerie utilisent toute la largeur disponible avec les
marges habituelles. La barre de filtres compacte reste placée sous les statistiques.
le souvenir complet reste dans la fiche. Les images choisies par l’utilisateur restent nécessaires :
aucune conversion automatique d’une jaquette IGDB en boîte PAL.

À l’entrée, afficher les jeux joués. Les boutons permettent de voir aussi les jeux à découvrir,
possédés actuellement ou tous les jeux personnels SNES. L’état est conservé dans l’URL ;
un accès sans préférence mémorisée repart sur Joués, pour toutes les plateformes.
La même barre est utilisée dans toutes les galeries, collections comprises. Bibliothèque et
collections partent sur Tous mes jeux ; Découverte sur À découvrir, avec possibilité de changer
de vue. Dans une collection, les boutons filtrent uniquement ses jeux. Les préférences navigateur
restent propres à chaque galerie. Filtres de portée, Megastar, recherche et réglages occupent une
ligne compacte sur grand écran, y compris avec la sidebar ouverte à 2560 px. Le compteur et la
réinitialisation sont regroupés sur une fine ligne en dessous, alignée à droite. Les contrôles
se replient sur plusieurs lignes si la largeur manque.

À côté du choix grille/liste, une icône de colonnes et un sélecteur compact (104 px) règlent
le nombre de jaquettes par ligne : `Auto` ou 4 à 10. Choix mémorisé par galerie et conservé
dans l’URL, y compris au retour de fiche. La sidebar reste ouverte lors du réglage.
En mode manuel, chaque carte occupe une colonne, même dans une galerie mélangeant les formats.
La grille réduit le nombre de colonnes si nécessaire pour garder au moins 150 px par carte ;
le mode Auto conserve les règles adaptées à chaque plateforme. Le sélecteur est désactivé en liste.

## Thème commun

Direction actuelle : bleu nuit / Aurora. Fonds sobres bleut�s, navigation et interactions bleues,
identit� violet/mauve, CTA corail, souvenirs et �toiles jaunes, cyan ponctuel.
`src/styles/palette.css` centralise les couleurs et gradients ; `src/styles/theme.css` les applique.
Logo et illustration pixel art locale (`public/arcade-room.svg`) harmonis�s via leurs couleurs SVG.
Cette passe conserve structure, dimensions, espacements et composants. Variante Console 90
pr�c�dente conserv�e dans Git (`761bdca`).

Consultation : sidebar synthétique puis fiche complète immersive, décrites ci-dessus.
Édition : formulaires structurés ; priorité à la saisie plutôt qu'à l'immersion.
Galeries : `src/lib/presentation.ts` définit les formats indicatifs par plateforme ; les boîtes SNES PAL
sont horizontales, Wii U verticales, sans crop. Les futures variantes/visuels personnalisés pourront
s'appuyer sur cette séparation entre présentation et métadonnées.

Les univers détaillés par plateforme seront affinés avec l'utilisateur. Les maquettes Figma historiques
sont une référence de composition, pas un design à reproduire.
Validation visuelle et parcours opérationnels par l'utilisateur, pas de suite navigateur automatique.

## Amstrad CPC

Carte illustrée de même format que SNES et Amiga (deux colonnes, 250 px ; 190 px sur mobile).
Fond bleu nuit, halo bleu et diagonales rouges/grises atténuées, logo à gauche et CPC 6128
avec écran à droite. Bandeau intérieur compact de 120 px : logo et compteurs à gauche,
ordinateur légèrement recadré à droite. Matériel réduit sous 1100 px et masqué
sur mobile. Les quatre assets utilisés sont dans `public/platforms/amstrad/`.

Le crocodile Amstrad V2, aux couleurs atténuées, occupe le milieu du bandeau intérieur.
Ses mains dépassent de 18 px sans augmenter la hauteur ; le décor ignore les interactions
pointeur et disparaît sous 1200 px pour préserver les compteurs et le logo. Le cadrage
du CPC reste limité au bandeau.

Les cartes de jeux favoris portent le sceau violet/bleu Megastar fourni (`public/megastar.webp`) en surimpression dans le coin supérieur droit de la jaquette. Le logo transparent remplace le marque-page à cœur, avec une ombre légère et un débordement de 12 px en haut et 10 px à droite (8 px en liste). Le cadre de carte laisse déborder le sceau ; la jaquette et le pied de carte conservent leurs coins arrondis. Largeur de 28 % bornée à 54–84 px en grille, 38 px en liste. Ce repère reste visible indépendamment du filtre Megastar, dans toutes les galeries. Les dimensions des cartes restent inchangées.

Cartes de jeux Amstrad : ratio 3:4 adapté aux visuels de disquettes, image entière sans recadrage ni padding extérieur en grille. Présentation compacte comme Amiga : titre sur une ligne avec ellipse, étoiles seules, sans plateforme, année, statut ni souvenir. Le sceau Megastar reste visible pour les favoris.

Dans les univers Amiga et Amstrad, la grille utilise des colonnes de 210 px minimum au-dessus de 700 px pour donner plus de place aux jaquettes. Le ratio reste identique ; les deux colonnes mobiles et la vue liste sont conservées.
