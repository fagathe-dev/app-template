# Commandes de l'Application

## Commandes Symfony Console

### Commandes de base

#### Gestion des utilisateurs

```bash
# Créer un utilisateur administrateur
php bin/console app:create-admin-user

# Avec paramètres
php bin/console app:create-admin-user john admin@example.com password123
```

#### Cache et environnement

```bash
# Vider le cache
php bin/console cache:clear

# Vider le cache en mode production
php bin/console cache:clear --env=prod

# Réchauffer le cache
php bin/console cache:warmup

# Voir les routes disponibles
php bin/console debug:router

# Voir la configuration
php bin/console debug:config

# Voir les services
php bin/console debug:container
```

### Commandes Doctrine

#### Base de données

```bash
# Créer la base de données
php bin/console doctrine:database:create

# Supprimer la base de données
php bin/console doctrine:database:drop --force

# Valider le schéma
php bin/console doctrine:schema:validate

# Générer des entités
php bin/console make:entity
```

#### Migrations

```bash
# Voir l'état des migrations
php bin/console doctrine:migrations:status

# Exécuter les migrations
php bin/console doctrine:migrations:migrate

# Exécuter une migration spécifique
php bin/console doctrine:migrations:execute 20250606161243

# Générer une nouvelle migration
php bin/console doctrine:migrations:generate

# Créer une migration basée sur les changements d'entités
php bin/console make:migration
```

#### Fixtures et données de test

```bash
# Charger les fixtures
php bin/console doctrine:fixtures:load

# Charger les fixtures sans confirmation
php bin/console doctrine:fixtures:load --no-interaction

# Charger des fixtures spécifiques
php bin/console doctrine:fixtures:load --group=user
```

### Commandes de développement

#### Debugging

```bash
# Voir les informations de mapping Doctrine
php bin/console doctrine:mapping:info

# Voir le SQL généré pour une entité
php bin/console doctrine:schema:create --dump-sql

# Tester une requête SQL
php bin/console dbal:run-sql "SELECT COUNT(*) FROM user"

# Voir les événements Symfony
php bin/console debug:event-dispatcher
```

#### Maker Bundle

```bash
# Créer un contrôleur
php bin/console make:controller

# Créer un service
php bin/console make:service

# Créer un formulaire
php bin/console make:form

# Créer une commande
php bin/console make:command

# Créer un subscriber
php bin/console make:subscriber

# Créer un repository personnalisé
php bin/console make:repository
```

## Commandes NPM/Frontend

### Compilation des assets

#### Mode développement

```bash
# Compilation unique
npm run build

# Mode watch avec recompilation automatique
npm run dev

# Compilation TypeScript seulement
npm run build:ts

# Compilation SCSS seulement
npm run build:scss
```

#### Mode watch

```bash
# Watch TypeScript
npm run dev:ts

# Watch SCSS
npm run dev:scss

# Watch global (TypeScript + SCSS)
npm run dev
```

### Qualité du code

#### Linting

```bash
# Linter JavaScript/TypeScript
npm run lint

# Linter avec correction automatique
npm run lint -- --fix

# Formater le code avec Prettier
npm run format
```

#### Git et commits

```bash
# Valider le nom de branche actuel
npm run commit:validate

# Voir l'état Git formaté
npm run commit:status

# Aide sur le workflow de commit
npm run commit:help
```

### Scripts de build personnalisés

#### SCSS

```bash
# Build CSS à partir des fichiers SCSS (production)
node ./scripts/build-css.js

# Watch CSS avec recompilation automatique
node ./scripts/watch-css.js
```

#### TypeScript

```bash
# Build JavaScript à partir des fichiers TypeScript
node ./scripts/build-js.js

# Watch TypeScript avec recompilation automatique
node ./scripts/watch-js.js
```

## Commandes de test

### Tests PHP (PHPUnit)

```bash
# Exécuter tous les tests
php bin/phpunit

# Tests avec coverage
php bin/phpunit --coverage-html var/coverage

# Tests d'une classe spécifique
php bin/phpunit tests/Unit/UserServiceTest.php

# Tests avec filtre
php bin/phpunit --filter testUserCreation

# Tests avec groupes
php bin/phpunit --group integration
```

### Tests JavaScript (si configurés)

```bash
# Exécuter les tests frontend
npm test

# Tests en mode watch
npm run test:watch

# Tests avec coverage
npm run test:coverage
```

## Commandes de déploiement

### Préparation production

```bash
# Installation des dépendances production uniquement
composer install --no-dev --optimize-autoloader

# Optimisation Symfony
php bin/console cache:clear --env=prod
php bin/console cache:warmup --env=prod

# Compilation des assets optimisés
npm run build

# Assets Symfony
php bin/console assets:install --env=prod
```

### Maintenance

```bash
# Mise en mode maintenance
php bin/console app:maintenance:enable

# Sortie du mode maintenance
php bin/console app:maintenance:disable

# Vérification de l'état de l'application
php bin/console app:health:check
```

## Commandes utiles de développement

### Logs et debugging

```bash
# Suivre les logs en temps réel
tail -f var/log/dev.log

# Filtrer les logs par niveau
grep "ERROR" var/log/prod.log

# Nettoyer les anciens logs
find var/log -name "*.log" -mtime +7 -delete
```

### Performance

```bash
# Profiler une page
php bin/console debug:profiler-capture

# Voir les informations de performance
php bin/console debug:profiler

# Analyser les requêtes Doctrine
php bin/console doctrine:query:dql "SELECT u FROM App\Entity\User u"
```

### Sécurité

```bash
# Vérifier les failles de sécurité dans les dépendances
composer audit

# Vérifier les failles NPM
npm audit

# Corriger automatiquement (NPM)
npm audit fix
```

## Commandes d'administration spécifiques

### Gestion des rôles et permissions

```bash
# Lister les rôles disponibles
php bin/console app:roles:list

# Assigner un rôle à un utilisateur
php bin/console app:user:promote username ROLE_ADMIN

# Rétrograder un utilisateur
php bin/console app:user:demote username

# Activer/désactiver un utilisateur
php bin/console app:user:toggle username
```

### Gestion des emails

```bash
# Envoyer un email de test
php bin/console app:email:test admin@example.com

# Traiter la queue d'emails
php bin/console app:email:process-queue

# Nettoyer les anciens emails
php bin/console app:email:cleanup --days=30
```

## Variables d'environnement pour les commandes

```bash
# Exécuter une commande dans un environnement spécifique
APP_ENV=prod php bin/console cache:clear

# Avec debug activé
APP_DEBUG=1 php bin/console debug:router

# Avec une base de données différente
DATABASE_URL="mysql://test:test@localhost/test_db" php bin/console doctrine:schema:create
```

## Commandes de monitoring

### Surveillance des performances

```bash
# Voir l'utilisation mémoire des processus
php bin/console app:monitor:memory

# Surveiller la base de données
php bin/console app:monitor:database

# Vérifier l'espace disque
php bin/console app:monitor:disk
```

### Santé de l'application

```bash
# Health check complet
php bin/console app:health:check

# Vérifier les services externes
php bin/console app:health:external

# Test de charge basique
php bin/console app:health:load-test
```
