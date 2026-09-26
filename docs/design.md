# Direction graphique actuelle

Variante actuelle « Console 90 » : anthracite chaud, ivoire, orange mandarine et bleu électrique.
La version aubergine/corail précédente est conservée dans Git (commit `37c0077`). Illustrations pixel art ponctuelles,
images de jeux au premier plan. Typographie sans serif lisible et titres plus expressifs.
`src/styles/theme.css` porte le thème commun ; illustration locale `public/arcade-room.svg`.

Consultation : fiches synthétiques (image, note sur 5, statut, avis), détails dépliables.
Édition : formulaires structurés ; priorité à la saisie plutôt qu'à l'immersion.
Galeries : `src/lib/presentation.ts` définit les formats indicatifs par plateforme ; les boîtes SNES PAL
sont horizontales, Wii U verticales, sans crop. Les futures variantes/visuels personnalisés pourront
s'appuyer sur cette séparation entre présentation et métadonnées.

Les univers détaillés par plateforme seront affinés avec l'utilisateur. Les maquettes Figma historiques
sont une référence de composition, pas un design à reproduire.
Validation visuelle et parcours opérationnels par l'utilisateur, pas de suite navigateur automatique.
