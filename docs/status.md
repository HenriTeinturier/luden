# État courant

## Molette au-dessus de la sidebar — 2026-10-03

- Suppression du confinement vertical du défilement (`overscroll-behavior: contain`) sur la sidebar commune. La molette continue naturellement vers la galerie lorsque le panneau ne défile pas, accueil plateforme et aperçu jeu compris.
- Vérifié dans le navigateur : défilement sur l’accueil, la scène du jeu et les captures dans les deux sens ; position de page modifiée, scrollTop du panneau maintenu à 0. Formatage et diff vérifiés ; correction CSS seule.

## Boucle continue des captures — 2026-10-03

- La première capture suit désormais la dernière dans la bande, sans retour animé vers la gauche. Copies visuelles et repositionnement invisible avant le pas suivant ; flèches circulaires dans les deux sens. Largeurs fractionnaires prises en compte pour éviter une dérive du raccord.
- Rythme de 2 secondes, plusieurs vignettes visibles, pause et agrandissement conservés. La boucle se désactive si toutes les images tiennent dans le panneau ; adaptation à sa largeur par ResizeObserver.
- Vérifié : TypeScript, lint ciblé, formatage ; navigateur sur Bruce Lee : fin de bande affichant 5 puis 1, suite vers 2/3, flèche précédente et ouverture de la capture répétée comme capture 1 sur 5. Aucune donnée personnelle modifiée.

## Confirmation Megastar — 2026-10-03

- Dans la sidebar de toutes les plateformes, activer ou retirer Megastar ouvre une confirmation nommant le jeu et l’action. Aucune sauvegarde avant validation ; annulation/fermeture sans modification. Boutons bloqués pendant l’enregistrement, erreur affichée dans la fenêtre pour réessayer.
- Vérifié : TypeScript, lint ciblé et formatage ; navigateur : ajout sur Bruce Lee annulé, retrait sur Match Day II fermé par Échap, états initiaux conservés. Aucune donnée personnelle modifiée pendant les essais.

## Captures animées dans la sidebar — 2026-10-03

- Bande commune à toutes les plateformes : avance douce d’une vignette toutes les 2 secondes et retour au début, plusieurs images toujours visibles. Bouton pause/reprise discret, flèches et agrandissement conservés. Aucun changement de dimensions de la scène supérieure.
- Pause au survol/focus, dans une modale ou un onglet masqué ; automatisme désactivé avec la préférence de mouvement réduit et quand les images tiennent déjà dans la bande. Fiche complète inchangée.
- Vérifié : TypeScript, lint ciblé, formatage ; navigateur sur Bruce Lee : avance automatique, position conservée après pause, ouverture de la capture 2 en grand. Validation du rythme par Henri.

## Raccourcis d’historique et plateformes — 2026-10-03

- Changement de plateforme déplacé vers Alt + Maj + gauche/droite (infobulles et accessibilité mises à jour). Alt + gauche/droite n’est plus intercepté : les souris qui émettent ces raccourcis peuvent utiliser le retour/avance navigateur.
- Vérifié dans le navigateur : Alt + gauche/droite ne change plus de plateforme ; retour natif depuis fiche et édition restaure le même jeu en sidebar, avance rouvre la fiche ; Alt + Maj + droite change de plateforme. Le matériel souris lui-même reste à valider par Henri. TypeScript, lint ciblé et formatage vérifiés.

## Survol de la scène — 2026-10-02

- Sur toutes les plateformes, seul le curseur passe en main au survol de la scène supérieure : suppression du cadre, du voile et de l’étiquette. Clic vers la fiche complète et repère de focus clavier conservés.
- Vérifié : TypeScript, lint ciblé et formatage.

## Retour souris depuis une fiche — 2026-10-02

- Dans l’explorateur des galeries, l’ouverture de la fiche complète ou de l’édition ajoute une étape à l’historique du navigateur sans changer l’URL. Détail → édition remplace cette étape : Retour souris/navigateur rejoint directement la galerie avec le jeu courant en sidebar, filtres et défilement conservés.
- Échap/retour de la fiche consomment la même étape, sans empiler de retours vides. Annuler/Enregistrer dans l’éditeur gardent leur destination précédente ; l’avance navigateur peut rouvrir la vue. Navigation bloquée pendant une sauvegarde ou un import ; brouillon non enregistré abandonné comme avec Annuler.
- Vérifié : TypeScript et lint ciblé, compilation ; navigateur : retour depuis détail, édition depuis détail/sidebar, retours répétés et avance, même jeu sélectionné et défilement 2531 px restauré après ouverture clavier. URLs directes de jeu hors explorateur inchangées.

## Refonte de la sidebar — 2026-10-02

- Présentation commune à toutes les plateformes : note en grandes étoiles, Megastar distinct, crayon d’édition discret ; souvenirs dans un bloc chaud doré, trois captures sans cadre imbriqué (deux en panneau étroit), lien sobre vers la fiche. « Ajouter un jeu » passe au violet ; édition de l’accueil plateforme réduite à un crayon.
- Haut strictement conservé : dimensions, logos, boîtes et supports, ajustements Amiga compris. Zone cliquable transparente couvrant la scène et ses objets, avec indication au survol/focus ; flèches et retour indépendants, raccourcis conservés.
- Desktop sans défilement vertical de sidebar : hauteur inférieure flexible, extrait jusqu’à six lignes entières et captures adaptés à l’espace. Métadonnées secondaires/aide clavier masquées lorsque la place manque. Souvenir complet et édition dans une fenêtre ; mobile garde son défilement de page.
- Demi-étoiles à la souris et au clavier : aucune note enregistrée avant confirmation explicite, suppression comprise. Annulation conserve l’ancienne note. États compacts joué/possession/découverte indépendants ; collections nommées réelles/rêvées affichées séparément, sans modifier les règles métier.
- Vérifications : TypeScript, lint, 29 tests et compilation réussis. Navigateur : confirmation 5 → 4,5 annulée (5 conservé), clic scène, flèches/Entrée/Échap, lecture complète et édition annulée ; Amiga/SNES/Amstrad sans débordement vertical aux formats contrôlés. Aucune donnée personnelle modifiée. Validation esthétique finale par Henri.

## Navigation circulaire des jeux — 2026-10-02

- Gauche sur le premier jeu rejoint le dernier ; droite sur le dernier revient au premier. Ordre filtré/regroupé conservé dans la galerie, la sidebar et la fiche complète, y compris les URLs directes. Boutons précédent/suivant actifs aux extrémités, désactivés pour un seul jeu. Haut/bas dans la grille restent liés aux rangées, sans boucle.
- Vérifié : TypeScript, lint ciblé, formatage et quatre tests de navigation (boucle dans les deux sens, listes vide/unique, cible filtrée et rangées). Aucun serveur supplémentaire lancé.

## Serveur compilé et navigation clavier — 2026-10-02

- Le serveur sur le port 3000 utilisait encore la compilation du 1er octobre à 15 h 22, antérieure aux derniers raccourcis et corrections de focus. Serveur arrêté, compilation actuelle générée puis serveur redémarré sur l’interface locale. Aucune modification du code de navigation nécessaire pour les symptômes reproduits sur cette ancienne version.
- Vérification avec des frappes sur le focus courant, sans clic ni focus forcé par le test : rechargement → Entrée ouvre le jeu ; deuxième Entrée ouvre la fiche complète ; Échap revient à la sidebar et droite change de jeu ; Échap revient à l’accueil et droite navigue dans les jaquettes ; sidebar masquée, droite puis Entrée rouvre le jeu. Alt + droite passe à Amstrad ; rechargement puis Entrée ouvre directement la première jaquette.
- Compilation réussie. README précise la différence entre serveur compilé et développement ainsi que la procédure de mise à jour.

## Navigation clavier sans sidebar — 2026-10-01

- Arrivée dans une plateforme : focus sur la première jaquette, puis navigation aux flèches sans ouverture de jeu, même si l’accueil de la plateforme est affiché. Entrée ouvre la sidebar du jeu ciblé. Le focus initial ne se répète pas à la fermeture d’un jeu ni au changement de filtre sur la même page.
- Vérifié pour l’arrivée : TypeScript, lint ciblé et formatage ; navigateur Amiga → Amstrad : première jaquette ciblée, droite déplace le focus en conservant l’accueil, Entrée ouvre Daley Thompson’s Decathlon dans la sidebar.
- Sidebar masquée : les quatre flèches déplacent le focus entre les jaquettes visibles, à partir du dernier jeu consulté (premier résultat si absent). Aucun panneau ne s’ouvre avant Entrée sur la jaquette ; une deuxième Entrée dans la sidebar ouvre ensuite le détail. Ordre filtré/regroupé et rangées réelles respectés, sans contour de sélection conservé à la fermeture. Boucle horizontale ajoutée le 2 octobre.
- Alt + gauche/droite change d’univers avec la même boucle et le même ordre que les flèches du bandeau, sidebar visible ou masquée. Ces touches remplacent l’historique navigateur uniquement sur une page de plateforme, hors champs, édition, modales et fermeture animée. Tab conserve son usage habituel.
- Vérifié : TypeScript, lint ciblé, formatage et trois tests de navigation ; navigateur : double Échap → droite/bas sans panneau ni jeu sélectionné → Entrée sur Rick Dangerous 2 ouvre sa sidebar → Entrée ouvre le détail ; Alt + droite/gauche : Amiga → Amstrad → Amiga.

## Raccourci vers la fiche complète — 2026-10-01

- Entrée ouvre la vue détaillée du jeu sélectionné dans la sidebar, avec la même mémorisation du défilement que le bouton. Disponible aussi depuis l’aperçu d’une URL directe. Champs, contrôles/liens, édition, composition de texte et modales protégés ; rappel dans l’aide clavier et sur le bouton.
- Vérifié : TypeScript, lint ciblé et formatage ; navigateur : Entrée sur Another World ouvre le détail, Échap revient à l’aperçu, Entrée sur « Jeu suivant » conserve l’action native et ouvre Hunter dans la sidebar.

## Fond de la fiche complète — 2026-10-01

- Toutes plateformes : fond sorti du bandeau supérieur pour passer derrière le contenu de la fiche complète, à pleine largeur et hauteur proportionnelle. Fondu au bas de l’image, voile sombre et cartes plus opaques pour la lisibilité. Logo, boîte et support gardent leur place en haut ; cadrage de sidebar et repli sans fond conservés.
- Vérifié : TypeScript, lint ciblé et formatage ; contrôle navigateur sur Player Manager (fond haut de 712 px pour un en-tête de 280 px à 1280 px de largeur), cartes lisibles et cadrage de sidebar retrouvé au retour.

## Sidebar des jeux Amiga — 2026-10-01

- Boîte agrandie de 15 % en hauteur par rapport à son cadre précédent (112 → 128,8 %), proportions conservées. Recentrage horizontal annulé : positions et répartition précédentes restaurées. Disquette toujours abaissée de 8 px pour partager le même ancrage inférieur que la boîte. Réglages limités à la sidebar Amiga.
- Vérifié : TypeScript, lint ciblé et formatage ; contrôle navigateur sur Another World, cadres de la boîte et du support alignés en bas.

## Désélection d’un jeu — 2026-10-01

- À la fermeture de la fiche par Échap ou le bouton retour, le focus rejoint l’accueil de la sidebar (ou le contenu principal hors univers), plutôt que la jaquette. Le contour de focus ne peut plus laisser croire que le jeu reste sélectionné. Le retour de la vue détaillée vers la fiche sidebar conserve sa sélection.
- Vérifié : TypeScript, lint ciblé et formatage ; navigateur sur Another World : Échap et retour souris retirent la sélection, le contour et le halo, avec focus sur l’accueil de l’univers.

## Barre de filtres — 2026-10-01

- Bouton de réouverture « Sidebar » placé à l’extrémité droite de la barre, après le compteur et la réinitialisation, du côté du panneau. Action et identifiant de focus conservés.
- Recherche globale de l’en-tête vidée au changement de page et après lancement d’une recherche ; la requête envoyée à la bibliothèque reste appliquée aux résultats.
- Compteur compact « affichés / total » et icône de réinitialisation intégrés à la ligne principale, avec libellés accessibles et infobulles. Recherche de 200 px maximum et densité réduite à 88 px, `Auto` conservé. TypeScript/lint ciblé et formatage validés ; navigateur : une ligne et hauteur 66 px à 2560 px avec sidebar, repli sans débordement à 1280 px.

## Visuels des plateformes — 2026-10-01

- Navigation entre univers allégée : texte « Univers » retiré, deux flèches conservées au même emplacement, avec destination en infobulle et libellé accessible. Style du texte devenu inutile supprimé.
- Essai de raccord bandeau/galerie : point de retour créé avant modification `2f29c5e`. Bordure et fond de séparation retirés, affiche remontée derrière le bandeau de 24 px (12 px sur mobile), masque transparent progressif limité au bas du bandeau. Assets et proportions conservés, aucun flou ; raccord partagé par toutes les affiches et animations. Contrôlé dans le navigateur : chevauchements 24/12 px, ratio du bandeau conservé, absence de bordure/filtre et de débordement mobile. Retour possible en annulant le commit de cet essai.
- Navigation « Univers » en haut à gauche de la sidebar : liens précédent/suivant entre plateformes contenant des jeux, dans l’ordre alphabétique de la bibliothèque, avec boucle aux extrémités et destination en infobulle. Galerie et sidebar changent ensemble ; choix de galerie et affiche mémorisée restaurés par plateforme. TypeScript/lint ciblé validés, parcours Amstrad → SNES → Amiga vérifié dans le navigateur.
- Réapparition de l’accueil sidebar : animation inverse de la fermeture (arrivée depuis la droite et fondu, 260 ms), à la réouverture et au retour depuis un jeu. Réduction des animations respectée ; débordement horizontal masqué durant l’entrée comme la sortie.
- Vérifié : formatage/diff CSS, fermeture puis réouverture dans le navigateur avec animation `universe-sidebar-show` de 260 ms et sans débordement horizontal.
- Navigation sidebar : icône de panneau à masquer sur l’accueil, flèche de retour et libellé contextualisé sur le jeu. Fermeture de l’accueil par glissement/fondu 260 ms, au clic comme avec Échap, puis réallocation de la galerie ; annulation du délai si navigation/changement de jeu, réduction des animations respectée. TypeScript/lint ciblé et navigateur validés : animation, panneau masqué, ouverture d’un jeu et retour à l’accueil.
- Affiches de sidebar : glissement horizontal de 450 ms, suivant vers la gauche / précédent vers la droite, automatique dans le sens suivant. Image sortante conservée pendant la transition, voisines préchargées, clics supplémentaires ignorés le temps du mouvement ; bandeau fixe et préférence de réduction des animations respectée. TypeScript/lint ciblé validés ; sens des transformations et bandeau immobile contrôlés dans le navigateur.
- Enregistrer la présentation de la sidebar ramène à la collection de la plateforme après sauvegarde et actualisation des données. En cas d’erreur, le formulaire reste ouvert avec le brouillon.
- En-tête de statistiques généralisé à toutes les plateformes : bibliothèque, joués, Megastar et possédés, même disposition/couleurs que SNES. Compteurs et libellés accessibles liés à la plateforme courante. Anciens bandeaux conservés masqués ; les quatre cartes disparaissent avec la sidebar pour tous les univers.
- Vérifié : TypeScript, lint ciblé et formatage ; navigateur Amiga/Amstrad avec quatre compteurs propres à chaque plateforme et ancien bandeau en `display: none`.
- Zones « Ajouter des bandeaux / affiches » : curseur main sur le libellé, le champ fichier et son bouton natif. Vérification CSS et formatage.
- Dernière affiche mémorisée par plateforme dans localStorage, avec repli sur le défaut actif si l’image disparaît. Éditeur : défilement automatique facultatif et durée de 3 à 120 s (8 s initialement), enregistrés sur Platform. Pause/reprise sur la galerie, temporisateur suspendu en onglet caché et nettoyé au démontage ; bandeau fixe. Migration additive `20261001120000_platform_slideshow` appliquée ; export v6 inclut les plateformes et leurs réglages.
- Vérifié : TypeScript, lint, 27 tests, compilation et contrôle DB isolé des réglages/export. Navigateur : sauvegarde de durée, défilement, pause et restauration de la dernière affiche après rechargement. SNES remise à défilement désactivé / 8 secondes après vérification.
- Suppression de bandeaux/affiches depuis chaque carte de l’éditeur, avec confirmation. Retrait immédiat de la ligne et du fichier Luden, source importée intacte ; remplacement du défaut par la première image active du même type, sinon repli. Autres modifications du formulaire conservées. Contrôle propriétaire/plateforme et transaction verrouillée ; avertissement en cas de nettoyage disque impossible.
- Vérifié pour la suppression : TypeScript, lint et 25 tests ; contrôle DB/fichiers sur médias temporaires (mauvaise plateforme refusée, remplacement du défaut, retrait de la dernière image). Confirmation et annulation vérifiées dans le navigateur sans supprimer de média personnel.

- Sidebar d’accueil en deux parties : bandeau fixe entier et affiche en dessous, navigation par flèches/compteur dès deux affiches actives. « Modifier » ouvre `/platforms/<id>/edit` : imports multiples, nom, ordre, images actives et défaut par type. Les inactives restent en base et sur disque.
- `PlatformVisual` et migration additive appliquée : propriétaire, plateforme, type, chemin, dimensions, état et défaut unique actif. Stockage `media/plateformes/<id>/bandeaux|affiches/<uuid>.webp`, lecture locale `/platform-media/<id>`, export JSON v5. Aucune image personnelle dans Git/public. Imports immédiatement persistés inactifs ; activation après enregistrement.
- SNES : bandeau corrigé 2168 × 340 et nouvelle affiche 1024 × 1536 importés et définis par défaut ; premier bandeau 1400 × 467 conservé inactif dans le formulaire. Ancien `sidebar.webp` supprimé à la demande et ancien service conventionné retiré. Originaux fournis laissés à leur emplacement source.
- Vérifié : TypeScript, lint, 24 tests et compilation ; contrôle DB isolé (imports, défauts, validation, conservation des inactives, lecture, export). Navigateur : images chargées sur mobile/desktop, formulaire et sauvegarde confirmée. Rangement des médias de jeux exclut explicitement `plateformes/`, y compris les images inactives.

## Rangement des médias — 2026-09-30

- Imports provisoires dans `media/_imports/`, puis classement automatique à l’enregistrement sous `media/jeux/<plateforme>/<titre>--<id-jeu>/<catégorie>-<id-média>.webp`. Renommage et changement de plateforme/catégorie suivis ; médias des exemplaires inclus, fichiers partagés préservés. Avertissement si rangement différé après sauvegarde.
- Migration réelle terminée : **1 122 fichiers** (SNES 196, Amiga 803, Amstrad 123), chemins en base mis à jour, empreintes SHA-256 identiques. Une ancienne entrée sans fichier ni jeu a été nettoyée. Aucun fichier sans référence trouvé. Simulation finale : aucun déplacement restant.
- Sauvegarde PostgreSQL et journal dans `LUDEN_DATA_DIR/backups/rangement-medias-2026-09-30T16-07-50-974Z/`. Code de migration reprenable ; copie vérifiée avant changement de chemin puis retrait de l’original. URLs et identifiants médias conservés, aucune migration de schéma.
- Vérifié : TypeScript, lint, 18 tests, compilation ; contrôle DB temporaire des imports, rangement, changement de titre/plateforme, partage et suppression ; contrôle HTTP des médias des trois plateformes (200 WebP). Procédure de simulation/application/reprise dans `docs/media.md`.

## Consultation des jeux — 2026-09-30

- Raccourcis galerie : Ctrl + molette sur les jaquettes ajuste les colonnes et mémorise la préférence (haut = agrandir, bas = densifier, limites 4–10 / 6–12). Haut/bas parcourent les rangées visibles, catégories et rangées incomplètes comprises ; précédent/suivant en fiche complète et mobile. Champs, modales et liste protégés ; rappel dans l’infobulle de densité et aide clavier de la fiche.
- Vérifié : TypeScript, lint et 22 tests ; quatre flèches contrôlées dans le navigateur (Super Metroid ↔ NBA Jam verticalement, Super Metroid ↔ Super Star Wars horizontalement). Animation de survol exclue du calcul des rangées. Limites de molette testées par logique ; geste Ctrl + molette physique restant à valider par l’utilisateur.

- Galerie SNES : les quatre cartes de statistiques disparaissent lorsque la sidebar est masquée et reviennent à sa réouverture (accueil ou jeu), en complément des deux colonnes supplémentaires. Titre accessible conservé. Fermeture/réouverture vérifiées dans le navigateur ; TypeScript, lint ciblé et formatage validés.

- Sidebar masquée : bouton « Sidebar » avec icône de panneau dans les réglages de galerie pour réafficher l’accueil de l’univers. Focus clavier restauré et nombre de colonnes réajusté automatiquement à l’ouverture. Vérifié dans le navigateur : fermeture → 9 colonnes, bouton → accueil et 7 colonnes, Échap → bouton avec focus. TypeScript, lint ciblé et formatage passent.

- Carte de statistiques SNES « Megastar » : remplace « coups de cœur », avec le trophée partagé par la sidebar et le filtre et des accents lavande. Fond et bordure standards comme les trois autres cartes, sans halo. Compteur et pourcentage des favoris conservés. Vérification du diff CSS et du formatage.

- Colonnes desktop : +2 quand la sidebar est masquée, retour à la référence lorsqu’elle revient (accueil ou jeu). Préférence stockée stable, sélecteur ajusté 4–10 / 6–12 ; Auto mesure la grille ouverte puis ajoute deux colonnes à la fermeture. Vérification navigateur à 2560 px : 7 → 9 → 7, Auto 7 → 9, sélection 12 sans sidebar → 10 avec. TypeScript, lint et 20 tests passent.

- Sidebar d’accueil affichée par défaut dans chaque univers, remplacée par la fiche au clic. Croix/Échap : jeu → accueil → masqué ; retour dans un univers = accueil réaffiché. Image SNES fournie rangée dans `media/plateformes/snes/sidebar.webp`, sans conversion ni inclusion dans Git ; autres plateformes avec identité de repli. Mobile : accueil court au-dessus de la galerie. Parcours souris/clavier, image et mobile vérifiés. Colonnes déjà persistées par galerie dans localStorage : restauration à 7 vérifiée après visite sans paramètres URL, test de sauvegarde ajouté. TypeScript, lint et 20 tests passent.

- Page SNES : en-tête limité aux quatre cartes bibliothèque/joués/Megastar/possédés ; titre visuellement masqué, textes et tags retirés. Comptage dynamique des jeux distincts possédés actuellement et pourcentages sur le total SNES, sans tenir compte des filtres. Ancien bandeau conservé et masqué avec `hidden` + CSS explicite ; autres plateformes inchangées. Présentation responsive sur quatre puis deux colonnes.

- Barre de galerie : filtres, recherche, tri/regroupement, vue et densité regroupés sur une seule ligne à la largeur desktop cible. Compteur/réinitialisation déplacés en dessous, sur une ligne de 18 px ; barre de 89 px avec sidebar à 2560 px, contrôlée dans le navigateur. Repli conservé si la place manque.

- Sidebar : édition des souvenirs sur place via « Modifier » / « Écrire », champ multiligne, enregistrer/annuler, erreur avec brouillon conservé. Action partielle `memory` (20 000 caractères) sans toucher aux autres données ; navigation suspendue pendant l’édition. Bouton de modification complet conservé en bas. Vérifié : parcours navigateur, création/modification/effacement sur jeu temporaire avec note/statut/période préservés, TypeScript, lint et 19 tests.

- Sidebar : souvenirs avec icône et accès « Modifier » / « Écrire » ; galerie sur fond sombre encadré, quatre vignettes (trois sur panneau étroit), sélection lumineuse et flèches. « Voir tout » ouvre une grille puis l’agrandissement avec navigation et retour à la grille. Parcours vérifié dans le navigateur, TypeScript et lint validés. Spécificité du style du sélecteur de note corrigée pour préserver son étoile et ses espacements.

- Sidebar : sélecteur de note compact avec étoile dorée, valeur seule sans « / 5 », chevron et bordure dorée discrète ; menu sombre, focus clavier visible, tiret pour une note absente. Modification rapide par demi-point conservée.

- Sidebar : note chiffrée masquée à côté des étoiles, note accessible et sélecteur conservés. Tous les genres du jeu sont affichés sur la ligne d’informations, sans limite à deux tags.

- Sidebar : nouvelle version recadrée du logo Super Metroid importée (600 × 266, transparence conservée), affectée au jeu et rangée dans ses médias ; ancien logo conservé dans la galerie. Position du logo à 16 px du haut, ce qui remonte le dessin après retrait des marges transparentes. Boîte abaissée seule de 16 px ; cartouche fixe. Média servi en HTTP 200, vérification du formatage et du diff CSS.

- Sidebar : boîte avec cartouche alignée à gauche sur la marge des étoiles (24 px, 18 px sur petit mobile) : suppression du centrage interne de son image et position calculée depuis la marge commune. Taille/hauteur et position de la cartouche conservées ; boîte seule centrée. Vérification CSS/formatage.

- Sidebar : logo titre et texte de repli désormais droits, sans rotation ni perspective. Taille, centrage et hauteur conservés. Vérification CSS/formatage.

- Sidebar : logo titre légèrement réduit (38 → 34 % du panneau), centré dans l’espace libre entre navigation gauche et fermeture droite, remonté de 6 px. Largeur limitée à cet espace sur petit panneau ; titre texte de repli également centré. Boîte et cartouche inchangées.

- Sidebar : boîte décalée nettement vers la gauche (translation de −7 % de son cadre, soit environ 40 px plus à gauche que précédemment sur grand écran). Cartouche fixe, espace accru entre les deux ; taille, hauteur et centrage de la boîte seule conservés. Vérification CSS/formatage.

- Sidebar : espace boîte/cartouche augmenté en ramenant le décalage horizontal de la boîte de 5 % à 1 % de son cadre (environ 20 px d’écart supplémentaires sur le grand écran). Taille et position verticale conservées. Vérification CSS/formatage.

- Sidebar : boîte agrandie de 12 % en hauteur, bas conservé au même niveau ; déplacement vers la droite de 5 % de son cadre en présence d’une cartouche pour réduire l’écart entre les objets. Boîte seule toujours centrée, cartouche et disposition de la fiche complète inchangées. Vérification CSS/formatage.

- Sidebar : boîte/cartouche abaissées de 40 px supplémentaires (débordement 148 px), espace réservé ajusté pour garder les étoiles dégagées. Les trois cartes actives ont un fond opaque vert/corail/violet plus soutenu, une bordure nette et une coche.
- Vérifié : TypeScript/lint, contrôle des trois états actifs et des coches, 2560 × 1280 sans défilement interne et 26 px entre le groupe de visuels et la notation ; rendu étroit contrôlé.

- Sidebar : capsule remplacée par deux cartes distinctes « Joué » et « À découvrir », de même style que « Dans ma collection ». Trois bascules indépendantes, même hauteur et bordure ; états actifs vert/corail/violet, inactifs gris. Trois cartes sur une ligne en largeur suffisante ; collection au-dessus des deux autres sous 540 px.

- Sidebar : menu de parcours remplacé par une capsule à deux boutons « Joué » (corail) / « À découvrir » (violet), à côté de « Dans ma collection » ou dessous si la largeur manque. Bascules indépendantes, statuts détaillés conservés dans la fiche complète et l’édition. Libellé découverte raccourci ; titre répété au-dessus des étoiles masqué visuellement, conservé pour l’accessibilité.
- Vérifié : TypeScript/lint ; rendu compact à 1280 px et alignement sur une ligne à 2560 × 1280 sans défilement interne, état Joué actif et disparition du menu de parcours dans la sidebar.

- Densité de galerie : commande compacte icône + `Auto` / 4–10 à côté du choix grille/liste, mémorisée par galerie et dans l’URL. Chaque carte occupe une colonne en mode manuel ; réduction sur espace étroit pour une largeur minimale de 150 px. Réglage sans fermer la sidebar, désactivé en liste.
- Menu de densité : fond opaque sombre, texte clair et `color-scheme: dark` explicites sur le sélecteur/options pour éviter la liste native blanche illisible sous Windows.
- Libellé `Auto` : espace de texte élargi, padding droit réduit et compression flex désactivée ; commande de 104 px pour conserver le mot entier à côté de la flèche native.
- Vérifié : TypeScript/lint et 19 tests ; contrôle navigateur de quatre colonnes avec sidebar maintenue, préférence restaurée à la réouverture, état désactivé en liste et commande de 92 px de large.

- Badges sidebar : « Dans ma collection » bascule désormais la possession actuelle sur place, sans ouvrir le formulaire ; « À découvrir / rejouer » conserve sa bascule directe. États accessibles `aria-pressed`, commandes bloquées pendant la sauvegarde. Désactivation vers possessions anciennes ; réactivation d’une ancienne ou création physique par défaut, sans supprimer historique, médias ni collections nommées.
- Vérifié : TypeScript/lint et 18 tests réussis ; contrôle DB sur fiche temporaire des deux bascules, activations concurrentes sans doublon, conservation des identifiants, formats, boutique, médias, collection et expérience. Données de contrôle nettoyées.

- Identité Megastar actualisée : sceau WebP transparent fourni intégré aux jaquettes à la place du cœur, débordant en haut à droite sans rognage ; variante réduite en liste et coins de cartes conservés. Sidebar et filtre partagent trophée, séparateur vertical et palette violet/bleu électrique de la maquette, halo actif et lavande inactif. Les données de favoris restent identiques.
- Vérifié : TypeScript/lint, contrôle navigateur du sceau chargé et débordant, filtre actif (8 jeux), états actifs/inactifs et alignement compact de la sidebar.

- Filtre Megastar de la barre commune harmonisé avec la sidebar : même trophée étoilé (composant partagé), aspect grisé au repos et doré quand le filtre est actif. Fonctionnement du filtre favori conservé dans toutes les galeries.
- Ajustement sidebar : cartouche droite avec ombre de contact elliptique ; boîte/support abaissés de 46 px supplémentaires (débordement 108 px). Découverte/rejeu affiche désormais son texte. Favori remplacé dans la sidebar par un trophée SVG étoilé « Megastar · Jeu culte » à côté de la note : doré actif/gris inactif, conserve les favoris existants et leur bascule. Aucun champ d’appréciation ajouté.
- Vérifié : TypeScript/lint, contrôle ciblé Super Metroid (2560 × 1280 sans scroll interne, support sans rotation, débordement 108 px), trophée actif sur Super Mario World et ligne de notation sans débordement à 1280 px. Serveur Vite relancé sur 3000.
- Sidebar rapprochée de la maquette : fond derrière les flèches/fermeture, retrait du surtitre plateforme/année, logo agrandi/incliné, boîte et cartouche agrandies et débordant sous le fond ; perspective CSS du support. Étoiles sous le titre, métadonnées/parcours sur une ligne, boutons collection et favori toujours visibles avec états gris/vert/rose. Collection ouvre l’édition des possessions ; favori et découverte restent des mutations rapides. Présentation de la fiche complète conservée.
- Contrôle ciblé Super Metroid à 2560 × 1280 : sidebar sans défilement interne, fond et navigation au même niveau, boîte débordant de 62 px. Rendu vérifié à 1280 px, états collection/favori actifs vérifiés sur Super Mario World et retour fiche complète → sidebar. TypeScript, lint et 18 tests réussis.
- Refus d’import signalé : essai HTTP PNG réussi (200), média temporaire nettoyé ; cause initiale non reproduite. Message d’erreur remonté au-dessus des commandes d’import avec focus, au lieu du bas de galerie hors écran.
- Formulaire des visuels : dimensions du fond **2 560 × 1 440 px (16:9)** mises en évidence dans un encadré permanent au-dessus des quatre rôles. Choix automatique du visuel principal expliqué sous le champ boîte : image classée Boîte, sinon image principale de bibliothèque.
- Fiche complète desktop compactée : bandeau de 280–340 px selon la hauteur de fenêtre (auparavant jusqu’à 590 px), visuels limités à 260 px et titre/logo réduits. Composition alignée sur le contenu, expérience et captures rapprochées ; captures de 96–140 px. Contrôle ciblé Super Punch-Out!! à 2560 × 1280 : bandeau 333 px, expérience/souvenirs et captures entièrement visibles, informations détaillées dès 936 px.
- Sidebar compactée pour les grands écrans : scène au ratio paysage 16:7 sur desktop, captures limitées à 80–112 px selon la hauteur disponible, espacements réduits entre sections. Aperçu de cadrage aligné sur ce nouveau ratio ; format mobile conservé. Contrôle ciblé à 2560 × 1280 : Super Mario World tient sans défilement interne, captures et actions comprises.
- Carte sélectionnée renforcée : contour bleu clair de 3 px autour de toute la carte, halo et fond contrasté sous le titre. L’ancien contour sur l’image était rogné par les cartes avec débordement masqué. Toutes plateformes et vue liste ; dimensions conservées. Vérification ciblée CSS/formatage, validation visuelle par Henri.
- Parcours commun à toutes les plateformes : clic → sidebar à droite (environ un tiers), puis fiche complète immersive. La grille se réduit ; sous 800 px, la sidebar occupe la largeur disponible.
- Gauche/droite suivent les jeux filtrés, triés et regroupés au moment de l’ouverture, sans boucler. Échap revient de la fiche complète à la sidebar du jeu courant, puis ferme celle-ci. Les champs de saisie et modales gardent leur clavier.
- La bibliothèque reste montée pendant la consultation : filtres et position conservés. L’ordre de consultation reste stable pendant les modifications rapides ; un changement de filtre ferme le panneau. Ouverture directe `/games/:id` toujours disponible, avec le même composant de fiche.
- Note personnelle, statut, coup de cœur, découverte/rejeu et envie modifiables à la volée. Mutation partielle dédiée : souvenirs, possessions, médias et collections préservés. Captures agrandissables dans les deux vues ; pas d’action de lancement.
- Formulaire : quatre rôles facultatifs (boîte/jaquette, support, logo transparent, fond), import direct dans chaque rôle ou sélection d’un média existant. Vignette de bibliothèque indépendante. Replis : boîte/jaquette existante, titre texte, fond sobre, support absent.
- Choisir/importer un fond ouvre le cadrage sidebar : glisser, zoom, réglages clavier, recentrage. Géométrie partagée entre aperçu et affichage ; cadrage enregistré sans découper l’image. Fond général conseillé : **2 560 × 1 440 px (16:9)**, rappel dans le formulaire.
- Migration additive `20260930120000_game_presentation` appliquée ; Prisma régénéré, serveur Vite relancé sur 3000. Export JSON v4, imports optimisés jusqu’à 2560 px par côté ; médias existants conservés.
- Vérifié : TypeScript, lint, 16 tests, compilation ; contrôle DB temporaire des mises à jour partielles, cadrages et retrait des références ; contrôle navigateur ponctuel SNES (sidebar, fiche, flèches/Échap, formulaire/cadrage et petit écran). Aucun média ni paramètre personnel changé lors du contrôle.
- À affiner avec Henri : rendu des compositions lorsque ses assets boîte/cartouche/logo/fond seront fournis. La structure est opérationnelle avec les images existantes.

## Évolutions précédentes

- Navigation : accès directs Amiga, SNES et Amstrad dans le header pour les univers ayant des jeux. Ils restent visibles quand le menu principal est replié ; « Mes univers » est conservé. Univers actif indiqué dans la barre.

- Vignettes Amiga et Amstrad agrandies : colonnes de 210 px minimum au-dessus de 700 px, contre 175 px auparavant. Ratio des jaquettes conservé ; grille mobile et vue liste inchangées.

- Cartes Amstrad : images au ratio 3:4, sans padding autour du visuel et sans recadrage. Titre sur une ligne avec ellipse, étoiles sans note chiffrée ; métadonnées et statut masqués, marque-page des coups de cœur conservé.

- Coups de cœur : marque-page doré à découpe en V et cœur sombre dans le coin supérieur droit, sur toutes les cartes et indépendamment du filtre Megastar. Contour complet retiré ; variante réduite en vue liste, dimensions des cartes inchangées.

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
