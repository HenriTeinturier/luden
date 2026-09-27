# Catégories de rangement

Une catégorie facultative par fiche, indépendante des genres IGDB, de la plateforme,
de l’expérience et des collections. Les catégories sont communes aux plateformes d’un profil.
Le choix est manuel : un import IGDB ne le remplace pas.

## Utilisation

- Fiche : champ « Catégorie de rangement », valeur vide « À classer ».
- Galerie : « Par catégorie » ou « Sans regroupement ». Sans regroupement par défaut partout.
- Préférences par URL de bibliothèque en localStorage (`luden:gallery:v1:`) : filtres, tri, vue et regroupement, hors texte de recherche. Les paramètres explicites de l’URL priment ; stockage absent ou indisponible sans effet bloquant. Aucune écriture en base.
- Les filtres s’appliquent avant le regroupement ; le tri choisi reste valable dans chaque section.
- Sections dans l’ordre personnel, vides masquées, « À classer » en dernier.
- Paramètres : ajouter, renommer et monter/descendre les catégories, puis enregistrer.
- Pas de suppression de catégories enregistrées dans cette première version.

## Points d’entrée

- `GameCategory` : propriétaire, nom et position ; `Game.categoryId` nullable avec FK.
- `src/lib/categories.ts` : valeurs initiales, validation et regroupement pur.
- `src/server/categories.ts` : mise à jour transactionnelle, contrôle des IDs du propriétaire.
- `src/components/category-settings.tsx` : édition de la liste dans les paramètres.
- `src/components/game-form/identity-fields.tsx` et `src/components/gallery.tsx` : saisie/affichage.
- Migration `20260927090000_game_categories` additive ; jeux existants non classés.
- Seed idempotent : initialise seulement une liste vide, sans écraser noms ni ordre personnalisés.
- Export JSON version 3 : liste des catégories avec identifiants et ordre, catégorie de chaque jeu.

Tests ciblés : regroupement, ordre interne, absence de doublons, jeux non classés et validation.
