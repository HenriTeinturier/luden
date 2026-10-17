# Données et invariants

- Profile : propriétaire local explicite, futur point d'entrée d'authentification.
- Platform : Switch, PS5, PC, Amiga… pas de périodes pour les consoles/anciens ordinateurs.
  Les filtres de Mes plateformes sont indépendants des familles de marques : Consoles regroupe
  les consoles de salon et hybrides ; Portables regroupe Game Boy, GBA, DS, 3DS, PSP et les hybrides
  Switch/Switch 2. Les hybrides apparaissent dans les deux filtres, sans dupliquer les plateformes ni les jeux.
  La famille NEC contient deux plateformes distinctes : PC Engine (CoreGrafx, jeux HuCard)
  et PC Engine CD (Duo-R, jeux CD), classées dans Consoles, pas dans Portables.
  Les années du catalogue sont celles des plateformes, pas des variantes matérielles représentées.
  `slideshowEnabled` (false par défaut) et `slideshowSeconds` (8, entier de 3 à 120, contrainte SQL)
  règlent le défilement des affiches dans la V1 locale. Dernière affiche consultée par plateforme
  conservée uniquement dans le localStorage du navigateur, avec repli sur le défaut actif.
- PlatformVisual : fichier personnel lié à un propriétaire et une plateforme, type BANNER/POSTER,
  chemin relatif, dimensions, légende, ordre, activation et défaut. Un défaut actif au maximum par
  type (contrainte SQL), exactement un si des images sont actives (validation serveur). Une image
  inactive reste en base et sur disque. Le bandeau par défaut est fixe ; les affiches actives sont
  parcourables manuellement ou automatiquement, défaut en premier dans l’ordre. Ces fichiers sont indépendants des médias de jeux.
- Machine : PC personnel nommé ; rattachement facultatif d'une fiche PC.
- Game : fiche personnelle sur UNE plateforme, toutes métadonnées indépendantes. Aucun Game universel imposé.
  `presentation` JSON contient les rôles boîte/support/logo/fond (identifiants de médias déjà attachés
  à cette fiche) et `sidebarCrop` (x/y en %, zoom 1–3). Schéma Zod ; références retirées quand le média
  quitte la fiche. Omettre ce champ lors d’une sauvegarde conserve les choix existants encore valides.
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
- Bascule rapide de possession (« Possédé », anciennement « Dans ma collection ») : reflète la présence d’au moins une possession actuelle.
  Désactiver passe les possessions actuelles en anciennes sans effacer leurs identifiants, boutiques
  ni médias. Activer conserve une possession actuelle, sinon réactive une ancienne (premier identifiant),
  ou crée une possession physique par défaut s’il n’en existe aucune ; format ajustable via « Modifier ».
  Les appartenances aux collections nommées restent indépendantes et ne changent pas.
  La sidebar les affiche séparément avec leur type réelle/rêvée et indique le format des possessions actuelles.

Découverte/envie sont sur Game, indépendantes de Experience. Pas encore joué ≠ à découvrir.
La collection réelle exige à l'ajout une possession actuelle/ancienne, physique/digitale au choix.
Une fiche peut appartenir aux deux collections et avoir plusieurs possessions.
Une note absente est null, jamais 0 implicite. Les identifiants IGDB sont facultatifs et non souverains.
Les notes personnelles sont sur 5 par demi-étoiles ; contrainte SQL et validation Zod.
Les médias et notes personnels ne sont jamais mutualisés entre profils.

# Catégories de rangement

`Game.categoryId` référence facultativement une `GameCategory` du même propriétaire.
Les catégories ont un nom et un ordre personnalisables, indépendants des genres IGDB.
Voir `docs/categories.md` pour l’affichage et la migration additive.
