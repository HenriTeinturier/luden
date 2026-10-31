# Sauvegarde et restauration

## Depuis les paramètres

Dans **Paramètres → Sauvegarde et restauration**, choisissez **Créer une sauvegarde complète**. Sur les navigateurs compatibles, une fenêtre permet de choisir l’emplacement. Sinon le navigateur télécharge l’archive ; activez son option « Toujours demander où enregistrer les fichiers » pour choisir le dossier à chaque fois.

Luden conserve aussi une copie sous `LUDEN_DATA_DIR/backups/<uuid>.luden.tar.gz`. Le message indique la création et, en téléchargement classique, distingue le lancement du téléchargement de sa réception effective. Ces archives peuvent être volumineuses : aucune rétention ou suppression automatique des sauvegardes complètes n’est appliquée. Conservez plusieurs générations et vérifiez vos copies avant nettoyage manuel.

## Contenu

- `database.dump` : `pg_dump` PostgreSQL 17 au format custom, schéma `public`, sans propriétaires, permissions ni rôles.
- `media/` : images référencées par les tables `Media` et `PlatformVisual`, y compris les visuels inactifs enregistrés. Les fichiers orphelins sans ligne en base ne font pas partie de la bibliothèque sauvegardée.
- `manifest.json` : version du format, date, migrations, nombre de jeux et empreintes SHA-256 des fichiers.

**Exclus** : `.env`, mots de passe PostgreSQL, identifiants/secret IGDB, cache des miniatures, anciennes sauvegardes, préférences localStorage du navigateur et fichiers externes d’origine. Les fiches, notes, souvenirs, liens, possessions, collections, catégories et personnalisations de plateformes enregistrées en base sont inclus.

L’archive n’est pas chiffrée. Elle contient votre collection et vos souvenirs : conservez-la en privé.

## Restaurer

1. Installez la **même version de Luden**, configurez ses propres identifiants PostgreSQL et un dossier de données, puis lancez `npm run db:setup` et Luden.
2. Choisissez **Restaurer une sauvegarde**, puis l’archive complète. Les fichiers et empreintes sont vérifiés ; aucun remplacement n’a encore lieu.
3. Lisez la date et les compteurs. La confirmation expire après trente minutes ou un redémarrage du serveur.
4. Confirmez uniquement une archive personnelle/de confiance. Un dump est du SQL exécutable ; une archive d’origine inconnue ne doit pas être restaurée.
5. Luden essaie le dump dans une base temporaire, contrôle les migrations et les références d’images, crée une sauvegarde de sécurité, puis remplace les images et la base. Le remplacement PostgreSQL se déroule dans une transaction.
6. Rechargez l’application après la confirmation de réussite. Reconfigurez IGDB si nécessaire ; le mot de passe local PostgreSQL reste celui de la nouvelle installation.

La restauration **remplace** les données : elle ne fusionne pas les collections. Un export JSON seul ne peut pas être restauré. Les préférences de présentation du navigateur ne sont pas transférées.

La perte du mot de passe PostgreSQL d’origine ne rend pas l’archive inutilisable : elle ne sauvegarde pas les rôles ni leurs mots de passe et se restaure avec les identifiants de l’installation de destination. Si la base existe encore sur votre ordinateur, voir la [réinitialisation locale du mot de passe](../README.md#mot-de-passe-postgresql-perdu), sans supprimer son volume.

## Cohérence et interruption

Gardez **une seule instance serveur**, sans script de migration/rangement ni accès externe à la base pendant ces opérations. Les opérations en cours de cette instance terminent avant le début de la maintenance ; les nouvelles sont temporairement refusées.

Avant le remplacement, une archive de sécurité et un journal `backups/restore-journal.json` sont créés. En cas d’erreur normale avant validation de la transaction, les images précédentes sont rétablies. Si le processus ou la machine s’arrête pendant le remplacement, la première requête après redémarrage rétablit la sauvegarde de sécurité avant d’autoriser l’accès. Une interruption très tardive peut donc annuler une restauration déjà effectuée : la priorité est de retrouver un état cohérent connu.

Ne supprimez pas le journal ni l’archive de sécurité pendant une reprise. Une erreur de reprise bloque les opérations ; conservez les fichiers et corrigez Docker, le dossier ou l’espace disque avant de redémarrer. Les répertoires `.work/` contiennent des données personnelles temporaires, notamment les imports en attente. Les imports expirés sont nettoyés à la requête suivante ; un arrêt brutal peut laisser des répertoires de travail. Nettoyage manuel uniquement serveur arrêté, après avoir vérifié l’absence de journal de restauration à reprendre.

## Prérequis et limites

La sauvegarde intégrée utilise `docker compose exec` et le service `db` fourni. Elle nécessite Docker et les droits de création de base temporaire du rôle créé par l’image PostgreSQL. Une base externe ou un schéma autre que `public` n’est pas pris en charge par cette interface.

`DATABASE_URL` doit correspondre à `POSTGRES_USER`, `POSTGRES_DB` et `POSTGRES_PORT`. Utilisez des lettres, chiffres et `_` pour les noms de base/utilisateur. Les sauvegardes entre schémas de migrations différents sont refusées : restaurez avec la version correspondante, puis mettez Luden à jour.

`LUDEN_BACKUP_MAX_MB` vaut 10240 Mio par défaut (10 Gio), jusqu’à 102400. Il borne l’archive reçue et la somme images/dump ; la décompression ajoute une marge bornée de 64 Mio pour les en-têtes tar. L’espace de travail conserve parfois l’archive compressée, sa version tar et les images extraites en même temps. Prévoyez au minimum plusieurs fois le volume des données, plus la base temporaire Docker et la sauvegarde de sécurité. Le traitement et le téléchargement sont effectués en flux, sans charger toute l’archive en mémoire côté serveur.

Les contrôles de format et d’empreinte ne sont pas une signature d’authenticité. En cas d’image référencée manquante dans la bibliothèque actuelle, la sauvegarde de sécurité échoue et la restauration est arrêtée avant remplacement.

## Vérification reproductible

`npm run verify:release` copie les sources dans `.local/release-check-<id>/source`, installe avec `npm ci`, crée un projet Compose et une base jetables, applique toutes les migrations, vérifie l’état vide, lance les tests et le build, puis teste les routes HTTP et un cycle sauvegarde/restauration.

Ce cycle vérifie une image de jeu et une image de plateforme, une modification réelle après sauvegarde, la confirmation, la copie de sécurité, le refus de réutilisation d’un jeton et la récupération après interruption simulée. Les identifiants IGDB sont vides ; aucune connexion IGDB n’est requise.

Ports de contrôle : 55434 (PostgreSQL), 3311 (application). S’ils sont occupés, choisissez `LUDEN_VERIFY_DB_PORT` / `LUDEN_VERIFY_APP_PORT`. Seul le projet Compose aléatoire de contrôle et son volume sont supprimés à la fin. Les fichiers locaux et le rapport sont conservés hors Git pour inspection.
