# Décisions validées

- 2026-10-31 : préparation au partage des sources, code sous AGPL-3.0-only. Usage local conservé ; partage public des collections à construire ultérieurement. README illustré avec captures fournies pour la documentation, distinctes des médias de l’installation.
- 2026-10-31 : racine de données configurable et cache séparé facultatif ; sauvegarde complète depuis les paramètres (dump PostgreSQL + médias référencés, sans secrets ni cache). Restauration par remplacement confirmé avec vérification préalable, copie de sécurité et reprise après interruption. Voir `docs/backups.md`.

- 2026-10-18 : refonte progressive des plateformes. Les PC personnels deviennent à terme des
  plateformes personnalisées, avec rattachement au catalogue PC pour les métadonnées. Les entrées
  PC de test peuvent être supprimées ; pas de migration de ces machines vers des plateformes.
  Ordinateur, console de salon et portable seront des catégories cumulables, distinctes de la marque.
  Étape 1 : modèles de présentation réutilisables en préservant les rendus actuels. Étapes suivantes :
  éditeur commun et médias de plateforme, puis création de plateformes et remplacement de l’ajout de PC.
- 2026-09-26 : nom Luden, V1 locale Windows, un utilisateur.
- TanStack Start retenu pour garder le rendu serveur de futures collections publiques.
- PostgreSQL Docker ; médias via `.env` configurable, OneDrive facultatif. Sauvegarde applicative ajoutée le 2026-10-31.
- Fiches par plateforme avec TOUTES leurs métadonnées indépendantes.
- Une expérience par fiche ; PC personnels distingués dans le modèle initial (remplacement prévu ci-dessus).
- Collection virtuelle sans obligation d'achat ; réelle actuelle et/ou ancienne, sélection volontaire.
- Détails d'éditions et migration Excel exclus V1.
- Tests techniques minimaux ; validation visuelle surtout par l'utilisateur.
- Documentation fragmentée, index AGENTS/CLAUDE courts.
- 2026-09-30 : parcours de consultation commun à toutes les plateformes, sidebar occupant environ
  un tiers puis fiche complète ; différences uniquement visuelles. Captures et édition rapide dans
  la sidebar, pas de lancement du jeu. Échap remonte d’un niveau, gauche/droite parcourent les jeux.
- Quatre rôles visuels facultatifs par fiche (boîte, support, logo transparent, fond), réutilisant les
  médias existants ; titre texte si aucun logo. Cadrage sidebar demandé au choix du fond, source
  conservée entière pour la fiche. Les maquettes fournies restent des inspirations non contractuelles.

## Choix d'implémentation

Prisma 6 pour compatibilité Node installé ; Start et dépendances verrouillés dans package-lock.
CSS natif structuré et primitives Radix pour une UI personnalisée sans générateur supplémentaire.
Fonctions serveur et loaders TanStack : pas de deuxième API REST ni de cache Query inutile.

Vite 8 + Nitro pour le serveur compilé. Polices DM Sans/Fraunces servies localement.
Sharp 0.35.4 corrigé ; override deepmerge-ts 8.0.2 pour corriger la dépendance transitive
de Prisma/config (génération Prisma et contrôles vérifiés).
