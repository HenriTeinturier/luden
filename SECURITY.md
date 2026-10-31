# Sécurité

Luden 0.2 est une application personnelle **locale**, à un seul profil et un seul processus serveur. Ce profil n’est pas une authentification. Ne publiez pas le port applicatif, PostgreSQL ou les médias sur Internet, sur le réseau local, via un tunnel ou un reverse proxy.

Le serveur de développement écoute `127.0.0.1`. Le serveur compilé utilise `HOST=127.0.0.1` dans `.env`. PostgreSQL est publié uniquement sur `127.0.0.1` par Compose. Ne remplacez pas ces adresses par `0.0.0.0`.

Les requêtes de données contrôlent l’hôte local, l’origine et le contexte navigateur. Les opérations vérifient le propriétaire local. Les chemins des médias sont bornés, les images décodées et limitées, les imports d’URL refusent les réseaux privés et revalident les redirections.

## Sauvegardes

Une archive contient vos données personnelles et images : conservez-la dans un emplacement privé. Elle n’est pas chiffrée par Luden. Les secrets de `.env`, les mots de passe PostgreSQL, les identifiants IGDB et les rôles PostgreSQL ne sont pas exportés.

Restaurez uniquement une archive créée par votre installation ou une personne de confiance. Un dump PostgreSQL contient du code SQL exécutable ; les contrôles de format, d’empreinte et la base temporaire ne rendent pas un dump malveillant inoffensif. Les empreintes détectent une corruption, elles ne prouvent pas l’identité de l’auteur.

Les archives importées sont bornées en taille compressée et décompressée. Les chemins traversants, liens symboliques, fichiers spéciaux, doublons et fichiers non prévus sont refusés. L’essai de restauration dans une base temporaire précède le remplacement. Un mot de passe applicatif ne remplacerait pas ces contrôles.

## Dépendances et signalement

Lancez `npm audit --omit=dev` pour les dépendances utilisées à l’exécution. Les correctifs sont validés par les tests et une compilation. Ne lancez pas `npm audit fix --force` sans examiner les changements majeurs.

Au 31 octobre 2026, l’audit d’exécution après mise à jour ne signale plus de vulnérabilité. Des alertes modérées restent dans la chaîne ESLint/minimatch de développement ; les versions majeures proposées automatiquement ne sont pas une mise à jour compatible. Le lint traite uniquement le code local/de confiance. Ce constat est daté et ne dispense pas d’un nouvel audit lors d’une mise à jour.

Pour signaler une vulnérabilité, utilisez le signalement privé GitHub s’il est disponible dans l’onglet Security du dépôt. Sinon, contactez l’auteur en privé depuis son profil ; ne publiez pas de secret, de dump ou de détail d’exploitation dans une issue publique.

Une version hébergée nécessitera une vraie authentification, des autorisations par utilisateur, un contrôle des médias et une publication volontaire et sélective des collections.
