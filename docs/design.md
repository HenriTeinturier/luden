# Direction graphique actuelle

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

Premier univers dédié : bandeau compact, console PAL illustrée, gris violacé et quatre accents
de manette sur fond bleu nuit. Styles isolés sous `.platform-snes` dans `src/styles/platforms.css`.
Galerie de faces avant à plat, horizontales, sans recadrage. Titre et étoiles sont prioritaires ;
plateforme, année, statut et icônes de possession sont masqués sur les cartes SNES pour les alléger.
En grille SNES, une bande de 32 px accueille le titre à gauche et les étoiles à droite, sans chiffre répété. Le titre est tronqué si nécessaire, avec son nom complet au survol ; aucune note ne recouvre la jaquette.
Sur desktop, bandeau, filtres et galerie sont alignés sur toute la largeur disponible, avec les
marges habituelles. Bandeau d’environ 120 px : logo ou nom, compteurs à côté et matériel à droite,
sans surtitre ni phrase décorative. Espacement réduit avant les jeux ; adaptation sur mobile.
le souvenir complet reste dans la fiche. Les images choisies par l’utilisateur restent nécessaires :
aucune conversion automatique d’une jaquette IGDB en boîte PAL.

À l’entrée, afficher les jeux joués. Les boutons permettent de voir aussi les jeux à découvrir,
possédés actuellement ou tous les jeux personnels SNES. L’état est conservé dans l’URL ;
un accès sans préférence mémorisée repart sur Joués, pour toutes les plateformes.
La même barre est utilisée dans toutes les galeries, collections comprises. Bibliothèque et
collections partent sur Tous mes jeux ; Découverte sur À découvrir, avec possibilité de changer
de vue. Dans une collection, les boutons filtrent uniquement ses jeux. Les préférences navigateur
restent propres à chaque galerie. La barre se replie sur plusieurs lignes si la largeur manque.

## Thème commun

Direction actuelle : bleu nuit / Aurora. Fonds sobres bleut�s, navigation et interactions bleues,
identit� violet/mauve, CTA corail, souvenirs et �toiles jaunes, cyan ponctuel.
`src/styles/palette.css` centralise les couleurs et gradients ; `src/styles/theme.css` les applique.
Logo et illustration pixel art locale (`public/arcade-room.svg`) harmonis�s via leurs couleurs SVG.
Cette passe conserve structure, dimensions, espacements et composants. Variante Console 90
pr�c�dente conserv�e dans Git (`761bdca`).

Consultation : fiches synthétiques (image, note sur 5, statut, avis), détails dépliables.
Édition : formulaires structurés ; priorité à la saisie plutôt qu'à l'immersion.
Galeries : `src/lib/presentation.ts` définit les formats indicatifs par plateforme ; les boîtes SNES PAL
sont horizontales, Wii U verticales, sans crop. Les futures variantes/visuels personnalisés pourront
s'appuyer sur cette séparation entre présentation et métadonnées.

Les univers détaillés par plateforme seront affinés avec l'utilisateur. Les maquettes Figma historiques
sont une référence de composition, pas un design à reproduire.
Validation visuelle et parcours opérationnels par l'utilisateur, pas de suite navigateur automatique.
