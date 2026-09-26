# Données et invariants

- Profile : propriétaire local explicite, futur point d'entrée d'authentification.
- Platform : Switch, PS5, PC, Amiga… pas de périodes pour les consoles/anciens ordinateurs.
- Machine : PC personnel nommé ; rattachement facultatif d'une fiche PC.
- Game : fiche personnelle sur UNE plateforme, toutes métadonnées indépendantes. Aucun Game universel imposé.
- Experience : une par Game, statut, note, souvenir, période approximative libre.
- Possession : Game + physique/digital + actuelle/ancienne + boutique digitale facultative.
- Collection : réelle/rêvée, nom et propriétaire ; visibilité PRIVATE en V1.
- CollectionEntry : association Collection–Game. Les retraits et ventes n'effacent pas cette association.
- Media : propriétaire, chemin relatif UUID, type, dimensions, provenance.
- MediaAttachment : rattachement à un Game OU une Possession (contrainte SQL exclusive), catégorie,
  ordre, légende et principale. Plusieurs images par catégorie ; une principale par contexte.
  `Game.coverId` reste synchronisé avec la principale pour les cartes existantes.
- GameLink : URL HTTP(S), titre facultatif, type et ordre. Aucun contenu distant téléchargé.
- Chaque Possession conserve son identifiant à l'édition : futur exemplaire physique ou licence digitale.
  Les photos d'exemplaires sont possibles dans le modèle ; interface et détails d'achat reportés.

Découverte/envie sont sur Game, indépendantes de Experience. Pas encore joué ≠ à découvrir.
La collection réelle exige à l'ajout une possession actuelle/ancienne, physique/digitale au choix.
Une fiche peut appartenir aux deux collections et avoir plusieurs possessions.
Une note absente est null, jamais 0 implicite. Les identifiants IGDB sont facultatifs et non souverains.
Les notes personnelles sont sur 5 par demi-étoiles ; contrainte SQL et validation Zod.
Les médias et notes personnels ne sont jamais mutualisés entre profils.
