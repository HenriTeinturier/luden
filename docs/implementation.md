# Plan V1

1. Socle : docs, dépendances, PostgreSQL isolé, schéma/migration, profil/plateformes.
2. Bibliothèque : ajout/édition/suppression, fiches indépendantes, expérience, images, recherche IGDB.
3. Parcours : accueil, galeries, découverte, possessions/collections, PC, paramètres/export.
4. Vérification : TypeScript/lint/build, tests invariants et parcours serveur ciblés.

Critère : créer un jeu, ajouter une image locale si configurée, le noter, l'associer à une collection,
le retrouver après redémarrage et exporter ses données sans API externe.
Pas de tests visuels automatiques ; transmettre les parcours à vérifier à l'utilisateur.
