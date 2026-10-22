# Direction graphique actuelle

L’accueil utilise un conteneur centré de 2 000 px maximum avec marges latérales de 24 à 64 px.
Au-delà de 1 400 px de largeur intérieure, le haut se compose de deux colonnes 45/55 :
introduction illustrée et statistiques en 2 × 2 à gauche, quatre plateformes en 2 × 2 à droite.
Les jeux récents suivent sur toute la largeur du contenu, puis la citation. Espacements entre
grands blocs de 48 à 56 px. Une container query rétablit la composition verticale lorsque
l’espace manque, notamment avec une sidebar ouverte ; sur mobile, les plateformes s’empilent.

Le menu déroulant Mes univers affiche les logos des plateformes (personnalisés prioritaires)
dans une zone de 140 × 26 px, sans déformation. Le nom complet reste accessible et en infobulle ;
sans logo, le nom court sert de repli. Les raccourcis directs du header restent textuels.

Le header affiche les cinq univers les plus fournis puis les deux derniers actifs, sans
doublons (sept raccourcis maximum). Le menu Mes univers conserve la liste complète des univers
contenant des jeux. Paramètres utilise uniquement une icône nommée et une infobulle.
Les dates des jeux déterminent l’activité ; les suppressions détectées depuis la dernière visite
sont datées à leur constat et mémorisées localement dans `luden:universe-activity:v1`.

La section histoire/aventure de la vue d’ensemble affiche jusqu’à 12 jeux dans une grille
responsive occupant la largeur du conteneur des plateformes. Ses cartes réutilisent la
présentation classique de la bibliothèque (jaquette entière dans une zone commune,
logo et année, titre, indicateur en lecture seule, cadre fin et interactions homogènes).
L’accueil ne propose pas de sélecteur de thème. Les textes de souvenir restent dans les fiches
et dans la citation dédiée de l’accueil.

Dans la vue Mes envies des univers plateforme, les cinq flammes restent directement
modifiables sans croix d’effacement. Les marges sous le titre sont supprimées pour
rapprocher le contrôle de la ligne du titre, sans changer les autres vues.

## Thèmes de Ma bibliothèque

Le thème 1 de Ma bibliothèque utilise un cadre de 1 px et des jaquettes sans marge
extérieure. Flammes, notes et souvenir suivent directement le titre. Le survol déplace
toute la carte de 3 px vers le haut avec bordure discrète ; la sélection reprend le
contour bleu clair, le halo et le fond des univers. Les indicateurs restent en lecture seule.

Mes envies propose aussi les deux thèmes, avec une préférence indépendante. Son thème 1
utilise des marges réduites, un cadre fin et un léger déplacement de la carte entière au survol,
contrôle d’envie inclus. La jaquette n’a pas de marge extérieure, avec un cadre de 1 px.
Les flammes sont rapprochées du titre, sans croix d’effacement.
Son thème 2 reprend les boîtes libres avec les cinq flammes interactives sous le titre,
alignées à gauche, sans fond ni flou. Leur taille maximale est de 22 px, en grille comme en liste.
Survol : contour de 1 px couleur `--muted`, comme les univers. Les deux thèmes reprennent
leur sélection (contour bleu clair, halo et fond). La saisie par demi-flammes
et au clavier est conservée. Les autres emplacements gardent leur bouton d’effacement.

La barre de filtres propose « Thème 1 · Classique » (défaut, présentation existante)
et « Thème 2 · Boîtes libres ». Le choix est mémorisé par les préférences de galerie,
avec priorité au paramètre `theme` de l’URL. Il ne change pas les univers plateforme.
Le thème 2 retire les cadres au repos et aligne le bas des boîtes entières sur une ligne
invisible commune. Une pastille floutée en haut à droite affiche une flamme ou une étoile
avec la valeur, ou le marque-page Souvenir ; un tiret signale une valeur non renseignée.
Logo et année occupent un bandeau léger, séparé du titre par un trait. Survol et focus
affichent une bordure discrète de 1 px couleur `--muted` ; la sélection reprend
le contour bleu clair, le fond et le halo des univers et du thème 1.
Megastar reste visible en haut à gauche. La vue compacte reprend le même habillage.

## Modèles de présentation des jeux

Étape 1 de la refonte des plateformes : modèles communs dans `src/lib/presentation.ts`,
affectés aux plateformes existantes en conservant les réglages validés. Grande boîte ordinateur,
boîte verticale (dont 3:4), boîte horizontale (dont grande cartouche), boîtier vertical/cartouche,
CD, CD large, DVD, DVD/mini-disque et boîtier étroit ; repli classique pour les plateformes non traitées.
Game Boy, PSP et Nintendo DS disposent de modèles distincts, portant le nom de la console dans
le sélecteur : boîte verticale/petite cartouche, boîtier étroit/UMD et boîtier carré/carte de jeu.
Leurs ratios de galerie indicatifs sont respectivement 0,8, 0,59 et 1 ; les supports sont réduits
dans les deux tailles de scène. Ces modèles sont réutilisables sur les plateformes personnelles.
Dans les galeries des modèles DS et Game Boy, les images utilisent leur hauteur naturelle : le titre suit
directement la boîte sans bande vide. Le ratio carré reste le repli sans image ; les cartes
peuvent avoir des hauteurs différentes. L’aperçu de l’éditeur utilise le même comportement.
Ces modèles évitent `sizes="auto"` sur les images : le confinement de taille du navigateur
imposait une hauteur de repli de 150 px et créait des marges latérales. Les boîtes occupent toute la largeur.
Game Boy conserve le ratio 0,8 uniquement en repli sans image ; le cadre ne laisse plus de vide sous les boîtes plus larges.
Les choix de présentation déjà enregistrés restent prioritaires ; « Présentation d’origine »
permet de retrouver ces nouveaux réglages. Aucun visuel de console n’est ajouté par ces modèles.
Chaque modèle définit les proportions, le style des cartes et les étoiles vides dans la galerie,
puis les cadres boîte/support et leurs positions dans la sidebar et la fiche complète.
Les ajustements N64, Dreamcast et Xbox sont conservés ; les images restent entières.
La bibliothèque générale conserve son cadre commun et les préférences de densité restent indépendantes.
L’éditeur de plateforme permet de sélectionner ces modèles ; « Présentation d’origine » conserve
les ajustements spécifiques existants. Le format de collection et la scène boîte/support se règlent
séparément dans Présentation des jeux. Par défaut, la scène suit le modèle de collection ; elle peut
reprendre la géométrie d’origine ou utiliser un autre modèle. Ce choix s’applique à la sidebar du jeu
et à sa fiche complète ; l’accueil de la sidebar reste dans son onglet dédié.
L’aperçu utilise les composants réels de carte et scène, avec un jeu illustré de la plateforme en priorité.
Le sélecteur permet aussi un exemple d’une autre plateforme (utile pendant la création) ou un schéma
des proportions sans média. Aucun clic de navigation ni édition du jeu d’exemple ; les choix d’aperçu
restent locaux au formulaire. La réinitialisation rétablit les deux présentations d’origine.

## Éditeur commun des plateformes

Accessible par le crayon sur les cartes de Mes plateformes ou celui de l’accueil sidebar,
`/platforms/<id>/edit` propose quatre sections : Identité, Carte, Présentation des jeux et Sidebar.
Titre, nom court, marque, catégories multiples et année/période sont personnalisables ; un champ d’identité vide reprend sa valeur initiale.
Les aperçus de carte et d’accueil sidebar utilisent les composants réels, sans enregistrer les brouillons.

Carte : logo, fond et machine PNG/WebP, proportions conservées, placement réglable (tailles, décalages,
cadrage du fond). Les mises en page existantes restent intactes par défaut ; retour à la carte d’origine disponible.
Sur une carte illustrée, activer « Personnaliser le placement » part des réglages d’origine et ne déplace
aucun élément. Seuls les paramètres modifiés remplacent le CSS de la plateforme ; dimensions maximales,
alignements et adaptations mobiles restent natifs pour les autres. Masquer un visuel conserve sa place
et ne le remplace pas par un libellé ; remplacer une image ne déclenche plus de composition générique.
Les compositions libres déjà enregistrées conservent leur géométrie.
Sidebar : bandeau/affiches avec défilement existant, ou composition logo/fond/machine reprenant les images
de carte avec variantes facultatives propres à la sidebar et placement séparé.
Chaque rôle permet import, sélection, désactivation, suppression immédiate confirmée, masquage et retour au repli.
Les images importées sont stockées inactives immédiatement ; les choix et réglages prennent effet à l’enregistrement.
La bibliothèque générale reprend le logo personnalisé tout en gardant son cadre commun.
Les changements non enregistrés sont protégés à la sortie : confirmation pour les liens et le retour
du navigateur, alerte native pour fermeture/rechargement. Les imports déjà stockés restent disponibles.
La protection couvre aussi le premier écran de création ; les opérations en cours empêchent de quitter
par un lien. Une sauvegarde réussie poursuit normalement la navigation.

## Création de plateformes personnelles

« Ajouter une plateforme » dans Mes plateformes remplace l’ajout d’un PC personnel.
Premier écran `/platforms/new` : PC personnel/d’époque (Ordinateur et catalogue PC présélectionnés)
ou autre ordinateur/console, titre obligatoire, nom court, marque, année/période facultatifs,
cases Ordinateur/Console de salon/Portable cumulables et catalogue de jeux facultatif.
Second écran : même éditeur que les plateformes fournies, ouvert sur Carte. Le parcours affiche cinq
étapes : Identité, Carte, Présentation des jeux, Sidebar et Récapitulatif. Précédent/Suivant et accès
direct aux étapes conservent les champs en mémoire. Le récapitulatif reprend identité, rubriques,
catalogue, visuels actifs et modèles, avec retour à chaque section pour correction. Les erreurs
de date ou de durée ramènent à la section concernée avant de pouvoir valider le récapitulatif.
Images facultatives, ajoutables plus tard ; mêmes dimensions
de cartes et même bibliothèque générale que les autres plateformes. Grande boîte ordinateur
présélectionnée pour un PC ; modèle du catalogue associé sinon, toujours modifiable.
Le premier écran enregistre un brouillon, reprenable dans « Créations en cours » ; « Enregistrer
le brouillon », disponible à chaque étape, conserve les réglages sans le rendre disponible pour les jeux.
« Créer la plateforme », uniquement dans le récapitulatif, le publie et ouvre son univers.
L’éditeur des plateformes publiées garde ses quatre sections et son enregistrement direct.
Il permet ensuite de modifier le catalogue associé, les catégories
et tous les visuels. Suppression confirmée d’un brouillon ou d’une plateforme personnelle vide uniquement.

Les cartes de plateformes (accueil et Mes plateformes, illustrées ou génériques) affichent
`année · nombre de jeux` sous le nom, dans le style discret du compteur. Région de sortie en
infobulle sur l’année ; PC générique sans année. Référentiel et sources : `platform-release-years.md`.

## Consultation commune : sidebar et fiche complète

Toutes les plateformes partagent le même parcours, dans `game-explorer.tsx` et `game-details.tsx`.
Le clic sur une carte ouvre un panneau occupant environ un tiers à droite et réduit la galerie.
Dans les univers plateforme, ce tiers est déjà occupé à l’entrée par une sidebar d’accueil.
L’accueil comporte un bandeau fixe en haut, affiché entier sans crop, puis une affiche occupant
la hauteur restante. Raccord en essai : chevauchement de 24 px (12 px sous 800 px) et masque de
transparence progressif sur le bas du bandeau, sans bordure, fond de séparation ou flou. Les deux
assets restent distincts et non déformés ; le même raccord couvre toutes les affiches. Sans
bandeau ou affiche, le repli reste sans chevauchement.
Deux flèches sans texte visible, en haut à gauche du bandeau, permettent de passer à la
plateforme précédente/suivante contenant des jeux (ordre alphabétique, boucle aux extrémités),
avec destination en infobulle et libellé accessible ; elles changent aussi la galerie et sont absentes s’il n’y a qu’un univers.
SNES utilise les deux fichiers personnels fournis ; les autres plateformes
affichent leur identité en repli tant qu’aucun visuel n’est configuré. Le bouton « Modifier » en
surimpression ouvre l’éditeur de plateforme. Les affiches actives se parcourent par flèches gauche/
droite en surimpression avec compteur (masqués s’il n’y a qu’une affiche). La dernière affiche
est mémorisée par plateforme dans localStorage ; si elle est absente ou inactive, retour au défaut.
L’éditeur propose le défilement automatique (désactivé initialement), de 3 à 120 secondes par
image (8 par défaut). Au moins deux affiches actives sont nécessaires. Pause/reprise dans le
compteur ; temporisateur suspendu si l’onglet est caché, remis à zéro après navigation manuelle.
Le bandeau ne défile jamais.
Les affiches glissent horizontalement en 450 ms : suivant vers la gauche, précédent vers la
droite, automatique dans le sens suivant. Sortante et entrante sont animées ensemble ; les
voisines sont préchargées et la préférence système de réduction des animations est respectée.
Après un enregistrement réussi, retour à la collection de la plateforme avec les données actualisées ; une erreur conserve le formulaire et son brouillon.
L’éditeur sépare bandeaux/affiches : imports multiples, nom, activation, défaut et ordre. Images
inactives atténuées mais conservées. Choisir un défaut l’active ; désactiver le défaut sélectionne
la première image encore active, ou l’identité de repli s’il n’en reste aucune.
Chaque visuel propose aussi « Supprimer », avec confirmation : retrait immédiat de Luden,
remplacement du défaut par une autre image active et conservation des autres changements en cours.
Un jeu remplace cet accueil. Une flèche de retour dans la fiche ramène à l’accueil de la plateforme
(ou à la collection hors univers). L’accueil propose un crayon discret pour modifier sa présentation (infobulle et libellé accessible), ainsi qu’une icône de panneau à masquer : glissement
vers la droite et fondu de 260 ms avant de libérer la place. L’ouverture utilise le mouvement
inverse (depuis la droite avec fondu, 260 ms), y compris au retour depuis un jeu. Échap suit les
mêmes étapes ; animations désactivées si réduction des animations activée.
Une nouvelle entrée dans l’univers réaffiche l’accueil ; changer les filtres seul
ne réouvre pas un accueil masqué. Dans ce cas, le bouton « Sidebar » avec icône de panneau,
à l’extrémité droite de la barre après la réinitialisation, permet de réafficher l’accueil et rétablit la densité avec sidebar.
Sur mobile, l’accueil est un bloc de 280 px au-dessus de la
galerie pour conserver l’accès aux jeux ; une fiche ouverte garde le comportement mobile habituel.
La carte consultée porte un contour bleu clair de 3 px autour de son périmètre complet, un halo
et un fond bleu/violet plus marqué sous le titre. Le repère est porté par la carte pour éviter
le rognage par ses coins ; dimensions et sceau Megastar conservés, y compris en liste.
À la désélection, y compris par Échap, le focus rejoint l’accueil sidebar ou le contenu principal,
sans revenir sur la jaquette : aucun contour ne persiste sur le jeu fermé. Le focus clavier reste
visible lorsqu’on parcourt normalement les jaquettes avec Tab.
Sur écran étroit (800 px et moins), seul le panneau est visible. Les proportions des visuels
suivent la plateforme ; les différences futures sont uniquement de présentation.
La scène de la sidebar est au ratio paysage 16:7 sur desktop (6:5 sur mobile), avec le même ratio
dans l’outil de cadrage. Sur desktop, le panneau occupe la hauteur disponible sous le header.
Le contenu inférieur ne défile que si la fenêtre est trop petite pour conserver trois lignes de souvenir
et les contrôles. Sinon, la molette continue vers la galerie voisine ; la scène supérieure reste fixe.
La scène garde ses dimensions et placements ; seul le contenu inférieur s’adapte. Les captures
font 24–120 px de haut suivant la place disponible, et le souvenir conserve trois à six lignes
entières si son texte est assez long. Sur une fenêtre moins haute, les métadonnées secondaires et l’aide clavier sont
masquées au profit du souvenir ; ces informations restent dans la fiche complète. Le parcours
mobile conserve le défilement de page habituel.

Sidebar : navigation superposée au fond, sans bandeau opaque ni surtitre plateforme/année.
Logo droit, sans rotation ni perspective, réduit à 34 % de la largeur du panneau et centré dans l’espace entre navigation
et fermeture (réserves gauche 180 px / droite 68 px), positionné à 16 px du haut pour un logo recadré sans marges transparentes.
Boîte et support plus grands, décalés sous le fond de 148 px. Support droit,
boîte agrandie de 12 % en hauteur avec son bas ancré et son image alignée à gauche sur la marge
des étoiles lorsqu’un support est présent (24 px, 18 px sur petit mobile), sans centrage interne du visuel.
La boîte reçoit un décalage vertical supplémentaire de 16 px, indépendant du support.
La cartouche garde sa position ; la boîte seule reste centrée horizontalement.
Pour Amiga uniquement, la boîte est agrandie de 15 % supplémentaires (hauteur du cadre : 128,8 %)
et la disquette abaissée de 8 px pour aligner leurs ancrages inférieurs à +16 px. Positions
horizontales et répartition communes conservées, sans recentrage spécifique ; proportions
préservées et vue détaillée inchangée.
Ombre elliptique de contact sous le support. Le titre n’est affiché que dans la scène (logo ou texte),
sans répétition au-dessus des étoiles ; un titre masqué reste accessible aux lecteurs d’écran.
Éditeur, année et tous les genres occupent une ligne défilable si nécessaire.
Dans la sidebar, la note est représentée par de grandes étoiles seules, sans chiffre ni
sélecteur en doublon. Survol et clic par demi-étoiles, clavier par pas de 0,5 (Début : 0,
Fin : 5), croix ou Suppr pour effacer. Chaque proposition ouvre une confirmation avec la note
actuelle et la valeur proposée ; seul « Valider la note » enregistre. Annuler ou fermer conserve
la valeur actuelle. Megastar est distinct, avec un crayon discret à sa droite pour éditer la fiche.
Dans la sidebar, ajouter ou retirer Megastar demande aussi une confirmation explicite nommant
le jeu. Annuler ou fermer conserve l’état actuel ; une erreur permet de réessayer dans la fenêtre.

Les états « Joué / Non joué », possession actuelle/ancienne/absente et découverte sont des
contrôles textuels compacts, avec icônes et coches. La possession précise physique, numérique
ou les deux ; elle ne représente pas l’appartenance à une collection. Les collections nommées
et leur type réelle/rêvée suivent les statuts sur la même ligne, avec retour à la ligne si la
largeur manque ; leur clic ouvre l’éditeur. L’absence de collection
propose « Ajouter à une collection ». Les trois bascules restent indépendantes et enregistrent
immédiatement. Joué reflète tout statut autre que non joué et bascule PLAYED/UNPLAYED ; les
statuts détaillés restent conservés à la simple consultation.

Dans la sidebar de toutes les plateformes, « Mes souvenirs » suit immédiatement les étoiles
et Megastar, avant les métadonnées, statuts et collections, puis la galerie. Fond brun doré
plus contrasté, liseré ambre et texte ivoire en 20 px (18 px dans les petites hauteurs).
Le bloc épouse la longueur du texte sans remplir artificiellement la hauteur disponible.
L’extrait affiche au moins trois lignes si le texte est assez long : quatre dès 500 px de
hauteur disponible sous la scène et six dès 650 px (six aussi sur mobile). La hauteur est
déterminée en CSS ; la détection de troncature sert uniquement à afficher « Lire la suite ».
Les collections restent accessibles même en petite hauteur. « Lire la suite » ouvre le texte entier
dans une fenêtre, sans allonger la sidebar. Le lien est en 16 px ; le souvenir complet en 18 px,
contrasté et aéré, dans une fenêtre jusqu’à 720 px de large. Survol de « Lire la suite » ou focus
clavier : aperçu flottant après 350 ms, maintenu quand le pointeur passe sur le texte, fermé par
Échap ou en quittant l’encadré. Les longs souvenirs défilent dans cet aperçu uniquement. Dans
les petites hauteurs, les espacements et vignettes s’adaptent pour garder le lien accessible.
Écrire/Modifier ouvre aussi une fenêtre avec
Enregistrer et Annuler. La sauvegarde partielle ne change que le souvenir et conserve le
brouillon en cas d’erreur ; les déplacements entre jeux sont suspendus pendant l’édition.

La section « Galerie » de la sidebar réunit toutes les images associées au jeu : captures en
premier, puis jaquettes, boîtes, publicités, supports, documents et divers dans leur ordre enregistré.
Elle apparaît même sans capture ; le compteur et « Voir tout » incluent toutes ces images.
La catégorie est indiquée dans la fenêtre d’agrandissement. La fiche complète conserve sa
section de captures séparée de « Médias & liens ».
Les images forment une bande sans cadre extérieur, trois vignettes (deux dans un panneau
étroit), proportions conservées. Flèches discrètes, compteur et accès « Voir tout » à la grille ;
chaque vignette ouvre l’image agrandie. Pas de halo permanent sur la première capture.
Dans la sidebar, la bande avance d’une vignette toutes les 2 secondes avec une transition
douce en boucle continue : la première suit la dernière, sans retour animé vers la gauche.
Chaque déplacement dure 750 ms avec une accélération et une décélération progressives,
en automatique comme avec les flèches. Le glissement s’arrête pour une interaction directe.
Les flèches parcourent aussi la boucle dans les deux sens. Pause au survol, au focus clavier, pendant une fenêtre modale
ou lorsque l’onglet est masqué ; un bouton discret permet aussi une pause durable.
Pas de défilement si toutes les images tiennent dans la bande, ni d’automatisme si la
préférence système demande de réduire les animations. La fiche complète reste manuelle.

Toute la scène supérieure est cliquable, fond, boîte et support compris : seul le curseur passe
en main au survol, sans cadre ni étiquette ; le focus clavier reste visible. Le clic ouvre
la fiche complète. Aucun asset, placement ou ratio n’est modifié,
y compris les ajustements Amiga. Les flèches/retour gardent leur propre action. La scène est
désactivée pendant l’édition ou l’enregistrement. Le lien de pied « Ouvrir la fiche complète »
est supprimé ; le clic sur la scène et Entrée ouvrent toujours la fiche complète. Échap conserve son comportement.

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

La fiche complète utilise un fond commun derrière l’en-tête et les informations, pour toutes les
plateformes : image à pleine largeur et hauteur proportionnelle, sans zoom ni déformation, avec
fondu progressif en bas et voile sombre. Les cartes sont plus opaques pour préserver leur lisibilité.
Le cadrage personnalisé reste réservé à la sidebar. Sans fond, la présentation de repli est conservée.
Le logo ou titre, la boîte et le support restent dans la scène en haut, puis expérience,
souvenirs, captures, informations, possessions, collections et médias. Le fond sobre et le titre
texte permettent de consulter immédiatement les anciennes fiches. Styles dans `styles/game-details.css`.
Sur desktop, le bandeau complet suit la hauteur disponible (280–340 px), avec objets de 260 px
maximum et composition centrée sur la largeur du contenu. Titre/logo et espacements sont réduits ;
captures de 96–140 px de haut pour voir l’expérience, les souvenirs et les captures dès le premier
écran. Les informations longues et les médias supplémentaires restent accessibles en défilant.

Gauche/droite parcourent l’ordre visible au moment de l’ouverture, regroupement compris, avec boucle :
droite sur le dernier revient au premier, gauche sur le premier rejoint le dernier. Même comportement
dans la galerie sans jeu ouvert, la sidebar et la fiche complète (y compris les URLs directes).
Les boutons précédent/suivant restent disponibles aux extrémités ; désactivés avec un seul jeu.
À l’arrivée dans une plateforme, le focus rejoint la première jaquette sans ouvrir de fiche.
Tant qu’aucun jeu n’est ouvert (accueil de plateforme visible ou sidebar masquée), les quatre
flèches déplacent uniquement le focus entre les jaquettes visibles :
reprise depuis le dernier jeu consulté, ou premier résultat si ce jeu n’est plus affiché. Entrée
sur la jaquette ouvre sa sidebar ; aucune ouverture pendant le déplacement. Les rangées sont
recalculées sur la grille élargie, catégories comprises. Champs, contrôles et modales protégés.
Alt + Maj + gauche/droite change de plateforme dans le même ordre que les flèches du bandeau,
avec boucle, sidebar ouverte ou masquée, hors champs/édition/modales. Alt + gauche/droite reste
réservé à l’historique natif du navigateur, y compris lorsque la souris émet ces raccourcis.
Tab reste natif. Infobulles sur les flèches.
Entrée ouvre la fiche complète du jeu sélectionné dans la sidebar (également depuis l’aperçu
d’une URL directe). Raccourci inactif dans les champs, sur les contrôles/liens, pendant l’édition
ou une modale ; les actions natives au clavier sont conservées. Rappel sous la fiche et en infobulle.
Haut/bas passent à la rangée voisine, sur la jaquette la plus proche horizontalement, sans boucler
aux extrémités. Le calcul suit les positions affichées, même avec des catégories ou une dernière
rangée incomplète. En fiche complète ou sur mobile, haut/bas parcourent le jeu précédent/suivant.
Ctrl + molette sur la grille règle les colonnes : vers le haut, moins de colonnes et des jaquettes
plus grandes ; vers le bas, davantage de colonnes. Auto devient une valeur manuelle issue de la
grille courante, bornée à 4–10 (6–12 sans sidebar sur desktop), mémorisée comme le sélecteur.
Le zoom navigateur reste disponible en dehors de la grille ; la vue liste, les champs et modales
ne sont pas concernés. Les gestes continus sont limités à un changement toutes les 160 ms.
Échap remonte d’un niveau et conserve le jeu courant. Les raccourcis ignorent les champs et modales.
Filtres et défilement sont conservés ; modifier les filtres referme la sélection. Le parcours intégré
reste sur l’URL de la galerie ; les URLs de jeu servent toujours à l’ouverture directe/nouvel onglet.
L’ordre capturé évite qu’une action rapide fasse sauter un jeu pendant la consultation.
Dans l’explorateur de galerie, fiche complète et édition partagent une étape d’historique
au-dessus de la sidebar. Retour souris/navigateur revient directement à cette sidebar sur le
jeu courant, en restaurant le défilement et les filtres, même depuis l’édition. Échap depuis
la fiche utilise cette même étape ; Annuler/Enregistrer gardent leur destination précédente.
L’avance navigateur peut rouvrir la vue. Sauvegarde et import bloquent temporairement la
navigation ; quitter l’édition abandonne le brouillon comme Annuler. Les URLs directes hors
explorateur conservent leur parcours propre.

Boîte/jaquette, support, logo transparent et fond sont quatre rôles facultatifs, indépendants de
la vignette principale. Import par rôle et réutilisation d’images existantes. Un import réussi dans « Boîte / jaquette »
remplace aussi l’image principale étoilée et la vignette de bibliothèque ; une seule image
reste principale. Les autres rôles conservent le choix existant. La sélection d’une image
déjà présente reste indépendante ; l’étoile de la galerie permet toujours de changer la vignette. Le fond ouvre un outil
de cadrage sidebar (déplacement, zoom, trois curseurs accessibles), modifiable ensuite. L’image
reste entière pour la scène large. Format de création conseillé : 2560 × 1440 px, 16:9, sans texte.

## Bibliothèque et découverte toutes plateformes

Dans « Ma bibliothèque » et « Mes envies », la grille utilise une carte par colonne pour toutes les plateformes,
y compris les boîtes horizontales. Chaque jaquette est centrée dans un cadre carré avec 8 px
de marge, entièrement visible et sans déformation. Colonnes automatiques de 200 px minimum,
deux sur mobile ; le réglage manuel de densité reste prioritaire. Sous la jaquette, seuls le
logo de plateforme, l’année et le titre sont affichés. Les logos existants Amiga, Amstrad, Atari ST et
Super Nintendo sont affichés entiers, jusqu’à 140 × 32 px, sans pastille ni cadre coloré ; les
autres plateformes utilisent leur nom court lisible en attendant un logo. L’année reste à droite.
La rangée logo/année mesure 36 px et celle du titre 20 px (une seule ligne avec points de
suspension, nom complet au survol), en grille comme en liste. Notes, mentions « Pas encore noté », statuts, possession et extraits de souvenirs ne
sont pas rendus dans ces cartes ; leurs données restent disponibles dans la sidebar et la fiche.
Même contenu simplifié en vue liste, avec sa disposition horizontale. Jaquettes entières et
sceau Megastar conservés. Les autres pages gardent leur présentation propre.

## Navigation horizontale (essai)

La sidebar est remplacée par un header sticky : logo, navigation existante, paramètres,
profil, recherche et action Ajouter/Enregistrer. Fil d’Ariane supprimé ; Mes univers est un menu
compact dans la navigation principale. Ce menu et les raccourcis du bandeau affichent toutes
les plateformes ayant au moins un jeu, sans plafond ni liste de plateformes prédéfinie.
Les raccourcis et le header passent à la ligne si nécessaire.
Sous 1900 px, le bouton Menu déplie navigation et profil ; recherche et action restent visibles.
Le champ de recherche globale se vide au changement de page et à la soumission ; la requête
soumise reste appliquée à la galerie de résultats de la bibliothèque.
Les informations d’espace personnel sont conservées dans le footer. Aucun changement de routes
ou d’options. Styles isolés dans `src/styles/header.css`, importé en dernier, ancien CSS conservé
pour cette phase d’essai. Version avant essai : `21d7f4e`.

Le titre « Les machines de votre histoire » utilise Chakra Petch 600 (sous-ensemble latin,
servi localement via Fontsource), pour une touche rétro lisible. Les autres titres et textes
conservent leur typographie. Règle limitée à `.platforms-index .page-heading h1`.

Sur l’accueil et dans « Mes plateformes », toutes les cartes partagent le format des cartes Amiga, Amstrad et
Super Nintendo : deux cartes par ligne, hauteur 250 px, padding 24 px, nom 16 px et compteur
13 px. À 720 px et moins : une carte par ligne, hauteur 190 px et padding 18 px. Les identités
illustrées et les visuels de repli sont conservés. Styles partagés entre `.platforms-index` et `.home-platforms`.

Les plateformes sont classées par nombre total de jeux décroissant, puis par nom en français
en cas d’égalité. Ce tri reste actif sous les filtres de famille ; les plateformes sans jeu
arrivent en dernier. L’accueil présente les quatre premières quand la bibliothèque contient des jeux.
Le filtre « Consoles », après « Ordinateurs », regroupe toutes les familles hors Ordinateurs,
consoles de salon et portables comprises. Les filtres par marque restent disponibles.
La section « Mes PC, mes repères » apparaît uniquement dans Toutes et Ordinateurs.
Mes plateformes utilise toute la largeur disponible, sans plafond de 1540 px, avec des marges
latérales adaptatives de 20 à 64 px. Titre, filtres et grille restent alignés.
Le sélecteur « Colonnes » de Mes plateformes propose 1 à 4 colonnes (2 par défaut),
mémorisées dans localStorage sous `luden:platforms:columns:v1`, indépendamment des galeries
de jeux. Les cartes gardent au moins 280 px de largeur quand la place le permet ; le nombre
effectif de colonnes diminue si nécessaire, avec une seule colonne sous 720 px. Le choix
reste conservé entre les filtres et au retour sur la page. Ctrl + molette sur les cartes ajuste
également la densité : vers le bas ajoute une colonne, vers le haut en retire une (1 à 4),
en partant du nombre effectivement affiché. Même cadence de 160 ms que les bibliothèques ;
zoom remplacé uniquement sur la grille, hors dialogue et saisie active. Le sélecteur et
localStorage restent synchronisés. L’accueil garde sa grille existante.

## Amiga

Carte large et bandeau intérieur : rayures arc-en-ciel sur fond anthracite fournies par Henri,
copiées sans modification dans `public/platforms/amiga/graphite.webp`, affichées centrées en `cover`,
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

## PlayStation et Nintendo 64

Cartes d’entrée et accueil de la sidebar : fonds, logos et consoles fournis par Henri,
copiés sans modification dans `public/platforms/ps1/` et `public/platforms/n64/`.
Composition identique aux autres consoles : logo à gauche, console/manette à droite,
nom et compteur en HTML. Dimensions communes et adaptation mobile conservées.
Logos également dans les galeries mixtes ; raccourcis Mes univers dès qu’un jeu existe.
Les bandeaux et affiches personnels restent prioritaires sur ces compositions de repli.

Galeries : boîtes PS1 carrées (ratio 1), boîtes N64 horizontales (ratio 1,42), images entières.
Uniquement le titre sur une ligne et les étoiles dessous, en grille comme en liste ;
étoiles vides sans note et sceau Megastar conservé. Colonnes N64 Auto de 280 px minimum hors sidebar,
205 px avec sidebar ; réglages manuels de densité et préférences par plateforme conservés.
Scènes de consultation adaptées dans la sidebar et la fiche complète : boîtier PS1 avec CD
à droite, boîte N64 avec cartouche large au premier plan. Dans la sidebar PS1, cadres de boîte
et de CD réduits d’environ 20 % en hauteur, toujours ancrés en bas pour dégager le décor sans
décaler la note et les souvenirs. Ajustement complémentaire : ensemble boîte/CD abaissé de 12 px,
avec 12 px supplémentaires sous la scène pour préserver la séparation avec la note. Fiche complète conservée. Aucun masque, découpage ou étirement
des médias importés. Les emplacements Boîte et Support existants reçoivent les futurs assets
des jeux ; les six fichiers fournis ici servent uniquement à l’identité des plateformes.

Dans la sidebar N64, l’ensemble boîte/cartouche est réduit à 80 % autour de son ancrage
inférieur et abaissé de 24 px pour dégager le décor. La marge sous la scène augmente de
24 px pour conserver l’espace avant la note. Avec une cartouche, la boîte est décalée vers
la gauche de 11,5 cqw avant réduction pour retrouver l’alignement des boîtes Amiga/PS1 ;
la cartouche est décalée d’autant vers la droite. Tailles et hauteurs conservées.
Fiche complète inchangée.

## Mega Drive

Carte d’entrée : fond quadrillé graphite avec diagonales rouges/grises, logo argenté à gauche,
console et manette à droite, selon la référence fournie. Trois fichiers de présentation copiés
sans modification dans `public/platforms/megadrive/`. Dimensions communes des cartes et responsive
conservés. Logo dans les galeries mixtes et la sidebar ; console sur le fond fourni quand aucune
affiche personnelle n’est active. Les bandeaux et affiches personnels restent prioritaires.

Boîtes de galerie au ratio 2:3, entières, titre sur une ligne et étoiles. Scène de consultation :
boîte verticale (cadre à 128 % en sidebar) et cartouche paysage à droite, sans déformation ni
recadrage. Exemples Orbital utilisés uniquement comme références de proportions, non importés.
Fond de jeu et cadrage restent configurables par l’éditeur commun, comme pour les autres plateformes.

## Atari ST

Carte d’entrée de même format que l’Amiga : fond bleu marine à bandes diagonales, logo bleu/blanc
à gauche et Atari ST avec souris à droite. Trois assets fournis par Henri conservés sans modification
dans `public/platforms/atari-st/` ; proportions et transparence conservées. Nom et compteur en HTML,
hauteur 250 px (190 px sur mobile), deux cartes par ligne puis une sur mobile.

Galerie comme l’Amiga : format vertical 0,71, colonnes de 210 px minimum en mode Auto au-dessus
de 700 px, images entières alignées en haut sans padding extérieur, titre sur une ligne et étoiles.
Megastar conservé, informations détaillées accessibles dans la fiche. Logo disponible dans les
galeries mixtes et le bandeau de repli de la sidebar ; sans affiche personnelle, fond diagonal
et ordinateur remplacent l’illustration générique. Les visuels personnels restent prioritaires.
En-tête commun avec quatre statistiques ; ancien bandeau masqué comme pour les autres univers.

## Super Nintendo

Carte d’entrée : logo et console transparents fournis par Henri dans `public/platforms/snes/`.
Composition large sur deux colonnes, fond graphite aux quatre formes colorées fourni par Henri
dans `public/platforms/snes/graphite.webp`, textes HTML ; originaux conservés hors repo.
Fond copié sans modification, affiché centré en `cover` ; logo et console gardent leur placement.

En-tête commun à tous les univers : uniquement quatre cartes de statistiques colorées au-dessus des filtres.
Titre visuellement masqué pour l’accessibilité ; aucun texte de présentation ni tag de plateforme.
Compteurs issus de tous les jeux de la plateforme courante : bibliothèque, joués, Megastar et jeux possédés
actuellement (au moins une possession CURRENT, chaque jeu compté une seule fois). Pourcentages
rapportés au total de la plateforme, indépendants des filtres. Quatre colonnes, puis deux si la place manque.
La carte Megastar reprend le trophée de la sidebar et du filtre, avec des accents lavande ; elle
compte les jeux favoris. Son fond et sa bordure sont identiques aux autres statistiques, sans halo.
Les quatre cartes sont masquées avec la sidebar pour donner plus de place aux jeux. Elles
réapparaissent à son ouverture, via le bouton « Sidebar » ou le choix d’un jeu. Le titre accessible
de la plateforme reste présent dans les deux états.
Les anciens bandeaux compacts propres aux plateformes restent dans le composant
avec `hidden` et une règle CSS explicite : il est conservé pour réutilisation, sans double titre visible.
Styles communs `platform-overview` dans `src/styles/platforms.css`, identiques sur toutes les plateformes.
Galerie de faces avant à plat, horizontales, sans recadrage. Titre et étoiles sont prioritaires ;
plateforme, année, statut et icônes de possession sont masqués sur les cartes SNES pour les alléger.
En grille SNES, le titre sur une ligne est suivi des étoiles en dessous, avec 8 px d’espacement et 12 px de marge intérieure, comme les autres univers. Aucun chiffre répété. Le titre est tronqué si nécessaire, avec son nom complet au survol ; aucune note ne recouvre la jaquette.
Les cartes SNES et Mega Drive affichent cinq étoiles vides en l’absence de note, sans assimiler cette absence à zéro. Le titre reste sur une seule ligne en grille et en liste.
Sur desktop, présentation, filtres et galerie utilisent toute la largeur disponible avec les
marges habituelles. La barre de filtres compacte reste placée sous les statistiques.
le souvenir complet reste dans la fiche. Les images choisies par l’utilisateur restent nécessaires :
aucune conversion automatique d’une jaquette IGDB en boîte PAL.

Sans préférence enregistrée, bibliothèque, plateformes et collections démarrent sur Tous.
Trois boutons reliés composent le choix de vue : Tous, Joués, Mes envies. Un second clic sur
Joués ou Mes envies revient à Tous. Tous inclut aussi les jeux ni joués ni dans les envies ;
les deux premiers ensembles peuvent se recouper. Les jeux d’une collection restent seuls concernés.
À côté, sous « Affiner », Possédés et Megastar sont des interrupteurs indépendants et cumulables.
Changer de vue conserve leur état ; désactiver Possédés retire uniquement le filtre de possession.
Les filtres avancés de possession restent synchronisés. Réinitialiser revient à Tous sans filtres.
La page Mes envies reste limitée aux envies, avec Possédés indépendant et sans Megastar.
L’état reste dans l’URL et dans les préférences propres à chaque galerie : vue, possession, Megastar,
tri, regroupement, grille/liste, colonnes et filtres avancés. Les anciens liens/préférences avec
la vue Possédés correspondent désormais à Tous + possession actuelle.
La recherche textuelle reste temporaire. Un lien avec des choix explicites reste prioritaire ;
un retour sans filtres, même sur la plateforme courante, restaure ses préférences.
Filtres de portée, Megastar, recherche et réglages occupent une
ligne compacte sur grand écran, y compris avec la sidebar ouverte à 2560 px. Le compteur compact
« 123 / 127 » et l’icône de réinitialisation (avec infobulle et nom accessible) restent sur cette
même ligne à droite. Recherche limitée à 200 px, libellé « Rechercher… » ; sélecteur de colonnes
de 88 px conservant `Auto` lisible. Les contrôles se replient si la largeur manque.

Le tri « Aléatoire » est disponible dans toutes les galeries, en grille et en liste. Une icône
« Remélanger les jeux » apparaît à côté du tri et renouvelle le mélange (désactivée sous deux
résultats). Le sélecteur et ce bouton partagent un bloc de largeur constante (190 px, 160 px
sur mobile) : activer Aléatoire ne provoque pas de retour à la ligne supplémentaire dans la barre.
Le choix et sa graine sont mémorisés par galerie et transmis dans les liens de fiche.
L’ordre reste stable lors des rendus, modifications de jeu, changements de densité, retours de
fiche et nouvelles visites. Les filtres conservent l’ordre relatif des résultats ; avec les
catégories, le mélange s’applique à l’intérieur de chaque groupe. Un accès « Aléatoire » sans
graine utilise un ordre déterministe jusqu’au prochain remélange.
Le rang pseudo-aléatoire est calculé une fois par identifiant puis trié : aucun changement de
données ni requête serveur supplémentaire. Coût O(n log n), mémoire temporaire O(n).

À côté du choix grille/liste, une icône de colonnes et un sélecteur compact (104 px) règlent
le nombre de jaquettes par ligne : `Auto` ou 4 à 10. Choix mémorisé par galerie et conservé
dans l’URL, y compris au retour de fiche. La sidebar reste ouverte lors du réglage.
Sur desktop, le choix mémorisé est la référence avec sidebar. Sans sidebar, la grille et le
sélecteur affichent deux colonnes supplémentaires (6 à 12) ; la réouverture retrouve la référence.
Choisir une valeur sans sidebar enregistre la référence correspondante (valeur − 2), sans dérive
au fil des bascules. En Auto, le nombre mesuré avec sidebar sert de référence pour ajouter deux
colonnes à sa fermeture. Sur mobile et en liste, aucun bonus de colonnes n’est appliqué à la grille.
En mode manuel, chaque carte occupe une colonne, même dans une galerie mélangeant les formats.
La grille réduit le nombre de colonnes si nécessaire pour garder au moins 150 px par carte ;
le mode Auto conserve les règles adaptées à chaque plateforme. Le sélecteur est désactivé en liste.

## Thème commun

Direction actuelle : bleu nuit / Aurora. Fonds sobres bleut�s, navigation et interactions bleues,
identit� violet/mauve, CTA corail, souvenirs et �toiles jaunes, cyan ponctuel.
Le bouton « Ajouter un jeu » du header, « Parcourir mes souvenirs » sur l’accueil
(ou « Commencer mon histoire » lorsque la bibliothèque est vide) et la confirmation de note
utilisent un violet proche du logo, du texte blanc et un survol lavande.
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
Fond graphite et diagonales rouges/grises fournis par Henri dans `public/platforms/amstrad/graphite.webp`,
copiés sans modification et affichés centrés en `cover`, logo à gauche et CPC 6128
avec écran à droite. Bandeau intérieur compact de 120 px : logo et compteurs à gauche,
ordinateur légèrement recadré à droite. Matériel réduit sous 1100 px et masqué
sur mobile. Les quatre assets utilisés sont dans `public/platforms/amstrad/`.

Le crocodile Amstrad V2, aux couleurs atténuées, occupe le milieu du bandeau intérieur.
Ses mains dépassent de 18 px sans augmenter la hauteur ; le décor ignore les interactions
pointeur et disparaît sous 1200 px pour préserver les compteurs et le logo. Le cadrage
du CPC reste limité au bandeau.

Les cartes de jeux favoris portent le sceau violet/bleu Megastar fourni (`public/megastar.webp`) en surimpression dans le coin supérieur droit de la jaquette. Le logo transparent remplace le marque-page à cœur, avec une ombre légère et un débordement de 12 px en haut et 10 px à droite (8 px en liste). Le cadre de carte laisse déborder le sceau ; la jaquette et le pied de carte conservent leurs coins arrondis. Largeur de 28 % bornée à 54–84 px en grille, 38 px en liste. Ce repère reste visible indépendamment du filtre Megastar, dans toutes les galeries. Les dimensions des cartes restent inchangées.

Cartes de jeux Amstrad : ratio 3:4 adapté aux visuels de disquettes, image entière sans recadrage ni padding extérieur en grille. Présentation compacte comme Amiga : titre sur une ligne avec ellipse, étoiles seules, sans plateforme, année, statut ni souvenir. Le sceau Megastar reste visible pour les favoris.

Dans les univers Amiga, Amstrad et Atari ST, la grille utilise des colonnes de 210 px minimum au-dessus de 700 px pour donner plus de place aux jaquettes. Le ratio reste identique ; les deux colonnes mobiles et la vue liste sont conservées.

## Identités PS2, GameCube, Xbox et Dreamcast

Les quatre plateformes du catalogue disposent de leurs fonds, logos et consoles fournis,
versionnés comme assets de présentation dans `public/platforms/{id}/`. Ils habillent
l’accueil, Mes plateformes et le repli de la sidebar ; les visuels personnels restent prioritaires.
Les galeries PS2, GameCube et Xbox utilisent des boîtes verticales (ratio 0,71), Dreamcast
des boîtiers dont le cadre suit le ratio des boîtes PAL (1,24) pour éviter les bandes vides
(cadre carré en l’absence d’image). Les images restent entières, sans déformation. Les univers affichent
le titre sur une ligne et les étoiles dessous, y compris sans note. Dans Ma bibliothèque
et Mes envies, les cartes communes conservent leur cadre carré avec image entière,
le logo de la console, le titre du jeu et son année lorsqu’elle est renseignée.
Les scènes de consultation associent boîte et disque ; le mini-disque GameCube dispose
d’un cadre plus petit. Filtres, densité, préférences, édition et imports restent communs.
Dans la sidebar Xbox, boîte et CD sont abaissés ensemble de 42 px ; la marge sous
la scène augmente d’autant pour préserver l’espace avec la note.
Dans la sidebar Dreamcast, boîte et CD sont abaissés ensemble de 24 px ; la marge sous
la scène suit ce décalage. Le cadre du CD passe de 94 % à 80 % de la hauteur des objets
(réduction d’environ 15 %) pour que son diamètre reste inférieur à la hauteur du boîtier.
Le CD est remonté de 20 % de son cadre pour aligner approximativement son centre
avec celui de la boîte, en conservant sa taille et le placement de la boîte.

## Envies dans Mes envies

Ma bibliothèque et Mes envies utilisent toute la largeur disponible, sans plafond de 1540 px,
avec les marges adaptatives habituelles et la place réservée à la sidebar lorsqu’elle est ouverte.

La page reste limitée aux jeux présents dans les envies de jouer/rejouer. Raccourcis : Mes envies,
Possédés (possession actuelle dans cette sélection), Par envie ↓ (note décroissante,
notes non précisées en dernier ; un second clic rétablit Derniers ajouts / modifiés). Joués, Tous et Megastar restent dans les autres bibliothèques.
Chaque carte, en galerie comme en vue compacte, affiche Mon envie avec des étoiles modifiables
par demi-points, au pointeur ou au clavier, et un bouton d’effacement. Le contrôle est séparé du
lien vers la fiche. Sauvegarde immédiate, blocage pendant l’enregistrement, erreur visible en cas
d’échec ; les données et le classement sont rafraîchis après sauvegarde.

## Jeux à trier

Un jeu est automatiquement « À trier » s’il n’a aucune expérience jouée (expérience absente ou
statut Non joué) et n’est ni dans Mes envies ni marqué Souvenir. Possession, catégorie de rangement et note d’envie
ne changent pas cette sélection. Joués et Mes envies restent indépendants : un jeu joué peut être
une envie de rejouer. Tous contient tous les jeux, y compris ceux à trier.

Un accès secondaire « À trier · N » apparaît à droite de Megastar dans les bibliothèques,
plateformes et collections contenant des jeux concernés. Le compteur porte sur les jeux de cette
galerie avant les autres filtres. Possédés, Megastar et recherche restent cumulables avec cette vue.
Un second clic revient à Tous. Si le dernier jeu sort de la sélection, l’accès actif reste visible
à zéro pour permettre de quitter la vue ; il disparaît ensuite. Vue mémorisée et conservée au retour
de fiche. La page Mes envies ne propose pas cet accès puisqu’elle est réservée aux envies.

## Statistiques de Ma bibliothèque

Au-dessus des filtres, six cartes affichent : jeux dans ma bibliothèque, jeux joués, Mes envies,
jeux possédés actuellement, Megastar et À trier. Icônes dans des pastilles colorées, étincelles roses
pour les envies et corbeille de réception ambrée pour À trier. Grille de six, trois, deux ou une
colonne selon la place. Tous les compteurs portent sur la bibliothèque complète, indépendamment
des filtres, de la recherche, du tri et du regroupement. Les pourcentages utilisent le total de la
bibliothèque ; bibliothèque vide : zéro et 0 %. Une modification des jeux actualise les totaux.
La barre de filtres indique séparément « N jeux affichés sur T ». L’ancien titre introductif reste masqué.

## Souvenirs

Le marquage Souvenir se règle dans la sidebar du jeu, la fiche complète et le formulaire
création/édition. Il signifie conserver le jeu en mémoire, même sans y avoir joué ni vouloir y jouer.
Il ne modifie pas les souvenirs écrits, les envies, la possession ou l’expérience.
Pas de bouton principal supplémentaire : « Souvenirs uniquement » se trouve dans les filtres
avancés et se combine avec la vue et les autres filtres. Pour retrouver tous les souvenirs, choisir
Tous puis activer ce filtre. Préférence mémorisée par galerie, conservée au retour de fiche et
retirée par Réinitialiser. Tous inclut les souvenirs ; À trier et son compteur les excluent.

## Étoiles dans la sidebar

Les jeux joués affichent Ma note en jaune, avec la confirmation de modification habituelle.
Les jeux non joués affichent Envie de jouer avec cinq flammes roses sur fond teinté et le libellé
« à préciser » en l’absence de valeur. Modifier ces flammes sauvegarde seulement `Game.desire` ;
aucune note d’expérience ni statut n’est modifié. Les flammes roses et le libellé sont aussi utilisés
sur les cartes Mes envies. Un souvenir non joué sans envie active n’affiche aucune étoile ;
s’il rejoint Mes envies, son envie est visible. Un jeu joué garde sa note même s’il est souvenir
ou dans Mes envies. Aucune valeur existante n’est effacée lorsque l’affichage change.

Dans toutes les vues de Ma bibliothèque, les cartes affichent aussi cet indicateur : étoiles jaunes
pour les jeux joués, flammes roses pour les non joués et marque-page Souvenir pour les souvenirs
non joués hors envies. Les valeurs non renseignées restent représentées par cinq symboles vides.
Dans Ma bibliothèque, étoiles et flammes sont en lecture seule, sans croix d’effacement ;
la modification se fait dans la sidebar. La page Mes envies conserve l’édition directe des flammes.
Un seul indicateur par carte de bibliothèque.

Sur les cartes, seuls les symboles sont visibles : pas de libellé Ma note ou Envie de jouer,
ni de cadre/fond autour des flammes. Les noms accessibles et les libellés de sidebar restent présents.

Dans les galeries plateforme et collection, la ligne sous le titre affiche les flammes roses
si l’envie est renseignée pour un jeu non joué ou sans note. Un souvenir sans note ni envie
porte un marque-page et « Souvenir ». La ligne réserve au moins 22 px, comme les notes, afin
de conserver la hauteur du pied de carte. Le contrôle d’envie éditable remplace cette ligne
lorsqu’il est présent, sans répéter les étoiles.

Les cartes de Ma bibliothèque partagent un même pied pour étoiles, flammes ou repère Souvenir,
sous le lien de la fiche : mêmes marges latérales et hauteur de ligne réservée. Les symboles sont
centrés verticalement sur cette ligne, y compris lorsque le bouton d’effacement d’envie est présent.
