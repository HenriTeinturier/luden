# Direction graphique actuelle

## Amiga

Carte large et bandeau intérieur : fond graphite chaud, arc-en-ciel atténué à droite,
logo blanc et Amiga 500 avec souris. Le joystick Quickjoy complète le bandeau intérieur.
Assets fournis par Henri, conservés sans modification dans `public/platforms/amiga/`.
Textes et compteurs en HTML ; proportions des images conservées. Cartes Amiga et SNES de même
format : deux colonnes, hauteur 250 px (190 px sur mobile). Bandeau intérieur aligné sur SNES ;
matériel masqué sur mobile comme pour SNES. Styles isolés dans `src/styles/platforms.css`.
Cette passe concerne l’identité de la plateforme ; la galerie de jeux reste à affiner.

## Super Nintendo

Carte d’entrée : logo et console transparents fournis par Henri dans `public/platforms/snes/`.
Composition large sur deux colonnes, fond CSS Aurora, textes HTML ; originaux conservés hors repo.

Premier univers dédié : bandeau compact, console PAL illustrée, gris violacé et quatre accents
de manette sur fond bleu nuit. Styles isolés sous `.platform-snes` dans `src/styles/platforms.css`.
Galerie de faces avant à plat, horizontales, sans recadrage. Titre et étoiles sont prioritaires ;
plateforme, année, statut et icônes de possession sont masqués sur les cartes SNES pour les alléger.
En grille SNES, une bande de 32 px accueille le titre à gauche et les étoiles à droite, sans chiffre répété. Le titre est tronqué si nécessaire, avec son nom complet au survol ; aucune note ne recouvre la jaquette.
Sur desktop, les pages plateforme utilisent toute la largeur disponible pour la galerie, avec les marges habituelles. Bannière et filtres restent centrés, limités à 1456 px.
le souvenir complet reste dans la fiche. Les images choisies par l’utilisateur restent nécessaires :
aucune conversion automatique d’une jaquette IGDB en boîte PAL.

À l’entrée, afficher les jeux joués. Les boutons permettent de voir aussi les jeux à découvrir,
possédés actuellement ou tous les jeux personnels SNES. L’état est conservé dans l’URL ;
un accès sans filtre repart sur Joués. Les autres plateformes gardent leur comportement actuel.

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
