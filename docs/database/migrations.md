# Gestion des Migrations

## Vue d'ensemble

Ce document explique la gestion des migrations de base de données avec Doctrine Migrations, les bonnes pratiques, les procédures de rollback et la gestion des environnements.

## Configuration Doctrine Migrations

### Configuration de base

```yaml
# config/packages/doctrine_migrations.yaml
doctrine_migrations:
  migrations_paths:
    'DoctrineMigrations': '%kernel.project_dir%/migrations'
  organize_migrations: 'BY_YEAR_AND_MONTH' # 2024/01, 2024/02, etc.
  table_storage:
    table_name: 'doctrine_migration_versions'
    version_column_name: 'version'
    version_column_length: 191
    executed_at_column_name: 'executed_at'
    execution_time_column_name: 'execution_time'
  enable_profiler: '%kernel.debug%'
  all_or_nothing: true
  check_database_platform: true
  transactional: true
```

### Structure des fichiers de migration

```
migrations/
├── 2024/
│   ├── 01/
│   │   ├── Version20240115120000.php
│   │   └── Version20240125140000.php
│   ├── 02/
│   │   ├── Version20240205160000.php
│   │   └── Version20240220180000.php
│   └── 03/
│       └── Version20240305100000.php
└── Version20250606161243.php (migration existante)
```

## Commandes de Migration

### Génération de migrations

#### Génération automatique basée sur les entités

```bash
# Générer une migration basée sur les changements d'entités
php bin/console make:migration

# Générer avec un nom spécifique
php bin/console make:migration --formatted

# Vérifier les changements avant génération
php bin/console doctrine:schema:update --dump-sql
```

#### Génération manuelle

```bash
# Créer une migration vide pour des modifications personnalisées
php bin/console doctrine:migrations:generate
```

### Exécution de migrations

#### Exécution vers la dernière version

```bash
# Exécuter toutes les migrations en attente
php bin/console doctrine:migrations:migrate

# Exécution silencieuse (pour scripts automatisés)
php bin/console doctrine:migrations:migrate --no-interaction

# Mode dry-run pour tester
php bin/console doctrine:migrations:migrate --dry-run
```

#### Exécution vers une version spécifique

```bash
# Migrer vers une version précise
php bin/console doctrine:migrations:migrate 20240305100000

# Migrer vers la version précédente
php bin/console doctrine:migrations:migrate prev

# Migrer vers la première version
php bin/console doctrine:migrations:migrate first

# Migrer vers la dernière version
php bin/console doctrine:migrations:migrate latest
```

### Informations sur les migrations

#### Statut des migrations

```bash
# Afficher le statut de toutes les migrations
php bin/console doctrine:migrations:status

# Afficher le statut détaillé
php bin/console doctrine:migrations:status --show-versions
```

#### Liste des migrations

```bash
# Lister toutes les migrations
php bin/console doctrine:migrations:list

# Lister uniquement les migrations non exécutées
php bin/console doctrine:migrations:list --unexecuted
```

### Rollback et gestion des erreurs

#### Rollback vers une version antérieure

```bash
# Rollback vers la version précédente
php bin/console doctrine:migrations:migrate prev

# Rollback vers une version spécifique
php bin/console doctrine:migrations:migrate 20240115120000

# Rollback complet (attention : destructif)
php bin/console doctrine:migrations:migrate first
```

#### Marquer une migration comme exécutée ou non

```bash
# Marquer comme exécutée sans l'exécuter
php bin/console doctrine:migrations:version 20240305100000 --add

# Marquer comme non exécutée sans rollback
php bin/console doctrine:migrations:version 20240305100000 --delete

# Synchroniser avec l'état réel de la base
php bin/console doctrine:migrations:sync-metadata-storage
```

## Structure d'une Migration

### Migration de base

```php
<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Ajout de la table user_preferences pour stocker les préférences utilisateur
 */
final class Version20240305100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout de la table user_preferences et de la colonne preferences dans user';
    }

    public function up(Schema $schema): void
    {
        // Vérification de la plateforme
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MySQLPlatform,
            "Migration can only be executed safely on 'mysql'."
        );

        // Ajout de la colonne preferences dans la table user
        $this->addSql('ALTER TABLE user ADD preferences JSON DEFAULT NULL COMMENT \'Préférences utilisateur au format JSON\'');

        // Création de la table user_preferences pour les préférences complexes
        $this->addSql('
            CREATE TABLE user_preferences (
                id INT AUTO_INCREMENT NOT NULL,
                user_id INT NOT NULL,
                category VARCHAR(50) NOT NULL,
                settings JSON NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
                PRIMARY KEY(id),
                INDEX IDX_user_preferences_user_id (user_id),
                INDEX IDX_user_preferences_category (category),
                UNIQUE INDEX UNIQ_user_preferences_user_category (user_id, category),
                CONSTRAINT FK_user_preferences_user_id FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB
        ');
    }

    public function down(Schema $schema): void
    {
        // Rollback : suppression des éléments ajoutés
        $this->addSql('DROP TABLE user_preferences');
        $this->addSql('ALTER TABLE user DROP preferences');
    }

    /**
     * Méthode appelée avant l'exécution (optionnelle)
     */
    public function preUp(Schema $schema): void
    {
        // Vérifications ou préparations avant migration
        $result = $this->connection->executeQuery('SELECT COUNT(*) FROM user');
        $userCount = $result->fetchOne();

        if ($userCount > 10000) {
            $this->write('⚠️  Migration sur une grande table (' . $userCount . ' utilisateurs)');
            $this->write('   Cette opération peut prendre du temps...');
        }
    }

    /**
     * Méthode appelée après l'exécution (optionnelle)
     */
    public function postUp(Schema $schema): void
    {
        // Actions post-migration (données par défaut, index, etc.)
        $this->connection->executeStatement('
            UPDATE user
            SET preferences = \'{"language": "fr", "theme": "light", "notifications": {"email": true}}\'
            WHERE preferences IS NULL
        ');

        $this->write('✅ Préférences par défaut ajoutées pour tous les utilisateurs');
    }

    /**
     * Vérification de l'état avant rollback
     */
    public function preDown(Schema $schema): void
    {
        $result = $this->connection->executeQuery('SELECT COUNT(*) FROM user_preferences');
        $preferencesCount = $result->fetchOne();

        if ($preferencesCount > 0) {
            $this->write('⚠️  Attention : ' . $preferencesCount . ' préférences utilisateur seront perdues');
        }
    }
}
```

### Migration avec données (Data Migration)

```php
<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration des données : normalisation des rôles utilisateur
 */
final class Version20240310150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Normalisation des rôles utilisateur et ajout des nouveaux rôles';
    }

    public function up(Schema $schema): void
    {
        // 1. Ajouter de nouveaux rôles possibles
        $newRoles = [
            'ROLE_MODERATOR' => 'Modérateur',
            'ROLE_SUPPORT' => 'Support client',
            'ROLE_ANALYST' => 'Analyste'
        ];

        // 2. Normaliser les rôles existants
        $this->addSql('
            UPDATE user
            SET roles = \'["ROLE_USER"]\'
            WHERE roles = \'[]\' OR roles IS NULL OR roles = \'[""]\'
        ');

        // 3. Nettoyer les rôles malformés
        $this->addSql('
            UPDATE user
            SET roles = REPLACE(REPLACE(REPLACE(roles, \'ADMIN\', \'ROLE_ADMIN\'), \'USER\', \'ROLE_USER\'), \'["",\', \'[\')
            WHERE roles LIKE \'%ADMIN%\' OR roles LIKE \'%USER%\'
        ');

        // 4. Ajouter la table de définition des rôles
        $this->addSql('
            CREATE TABLE roles_definition (
                code VARCHAR(50) NOT NULL,
                label VARCHAR(100) NOT NULL,
                description TEXT DEFAULT NULL,
                permissions JSON DEFAULT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                PRIMARY KEY(code)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB
        ');

        // 5. Insérer les définitions de rôles
        foreach ($newRoles as $code => $label) {
            $this->addSql('INSERT INTO roles_definition (code, label) VALUES (?, ?)', [$code, $label]);
        }
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE roles_definition');

        // Note : On ne revient pas sur la normalisation des rôles
        // car cela pourrait corrompre les données
        $this->write('⚠️  Les rôles normalisés ne sont pas restaurés pour éviter la corruption des données');
    }

    public function postUp(Schema $schema): void
    {
        // Vérification post-migration
        $result = $this->connection->executeQuery('
            SELECT COUNT(*) FROM user
            WHERE roles = \'[]\' OR roles IS NULL OR JSON_VALID(roles) = 0
        ');

        $invalidRoles = $result->fetchOne();

        if ($invalidRoles > 0) {
            throw new \Exception("❌ {$invalidRoles} utilisateurs ont encore des rôles invalides");
        }

        $this->write('✅ Tous les rôles utilisateur ont été normalisés avec succès');
    }
}
```

### Migration complexe avec transaction personnalisée

```php
<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Refactoring de la table des demandes : split en user_request et request_comments
 */
final class Version20240315200000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Refactoring: séparation des commentaires de demandes dans une table dédiée';
    }

    public function up(Schema $schema): void
    {
        // 1. Créer la nouvelle table pour les commentaires
        $this->addSql('
            CREATE TABLE request_comments (
                id INT AUTO_INCREMENT NOT NULL,
                request_id INT NOT NULL,
                user_id INT DEFAULT NULL,
                comment LONGTEXT NOT NULL,
                is_internal TINYINT(1) NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
                PRIMARY KEY(id),
                INDEX IDX_request_comments_request_id (request_id),
                INDEX IDX_request_comments_user_id (user_id),
                INDEX IDX_request_comments_created_at (created_at),
                CONSTRAINT FK_request_comments_request_id FOREIGN KEY (request_id) REFERENCES user_request (id) ON DELETE CASCADE,
                CONSTRAINT FK_request_comments_user_id FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE SET NULL
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB
        ');

        // 2. Migrer les notes internes existantes vers la nouvelle table
        $this->addSql('
            INSERT INTO request_comments (request_id, comment, is_internal, created_at)
            SELECT id, internal_notes, 1, created_at
            FROM user_request
            WHERE internal_notes IS NOT NULL AND internal_notes != ""
        ');

        // 3. Supprimer l'ancienne colonne après migration des données
        $this->addSql('ALTER TABLE user_request DROP COLUMN internal_notes');

        // 4. Ajouter de nouvelles colonnes pour améliorer le tracking
        $this->addSql('ALTER TABLE user_request ADD comments_count INT NOT NULL DEFAULT 0');
        $this->addSql('ALTER TABLE user_request ADD last_comment_at DATETIME DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // 1. Rétablir la colonne internal_notes
        $this->addSql('ALTER TABLE user_request ADD internal_notes LONGTEXT DEFAULT NULL');

        // 2. Restaurer les notes internes depuis la table de commentaires
        $this->addSql('
            UPDATE user_request ur
            SET internal_notes = (
                SELECT GROUP_CONCAT(comment SEPARATOR "\n\n---\n\n")
                FROM request_comments rc
                WHERE rc.request_id = ur.id AND rc.is_internal = 1
                ORDER BY rc.created_at
            )
        ');

        // 3. Supprimer les nouvelles colonnes
        $this->addSql('ALTER TABLE user_request DROP COLUMN comments_count');
        $this->addSql('ALTER TABLE user_request DROP COLUMN last_comment_at');

        // 4. Supprimer la table de commentaires
        $this->addSql('DROP TABLE request_comments');
    }

    public function postUp(Schema $schema): void
    {
        // Mettre à jour les compteurs
        $this->connection->executeStatement('
            UPDATE user_request ur
            SET
                comments_count = (SELECT COUNT(*) FROM request_comments WHERE request_id = ur.id),
                last_comment_at = (SELECT MAX(created_at) FROM request_comments WHERE request_id = ur.id)
        ');

        $this->write('✅ Compteurs de commentaires mis à jour');

        // Vérifier l'intégrité des données
        $result = $this->connection->executeQuery('
            SELECT COUNT(*) FROM user_request
            WHERE comments_count != (SELECT COUNT(*) FROM request_comments WHERE request_id = user_request.id)
        ');

        $inconsistencies = $result->fetchOne();
        if ($inconsistencies > 0) {
            throw new \Exception("❌ {$inconsistencies} incohérences détectées dans les compteurs");
        }
    }
}
```

## Gestion des Environnements

### Migrations par environnement

#### Développement

```bash
# Développement : réinitialisation complète possible
php bin/console doctrine:database:drop --force --env=dev
php bin/console doctrine:database:create --env=dev
php bin/console doctrine:migrations:migrate --no-interaction --env=dev

# Charger les fixtures après migration
php bin/console doctrine:fixtures:load --no-interaction --env=dev
```

#### Test

```bash
# Tests : base dédiée avec migrations rapides
php bin/console doctrine:database:create --env=test
php bin/console doctrine:schema:update --force --env=test

# Alternative : utiliser les migrations
php bin/console doctrine:migrations:migrate --no-interaction --env=test
```

#### Production

```bash
# Production : toujours utiliser les migrations
php bin/console doctrine:migrations:migrate --no-interaction --env=prod

# Vérification avant migration
php bin/console doctrine:migrations:status --env=prod
php bin/console doctrine:migrations:migrate --dry-run --env=prod
```

### Script de déploiement

```bash
#!/bin/bash
# deploy-migrations.sh

set -e

echo "🔄 Début du déploiement des migrations..."

# Sauvegarde de la base de données
echo "📦 Sauvegarde de la base de données..."
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# Vérification des migrations en attente
echo "🔍 Vérification des migrations en attente..."
PENDING=$(php bin/console doctrine:migrations:status --env=prod | grep "New Migrations" | awk '{print $3}')

if [ "$PENDING" -gt 0 ]; then
    echo "📋 $PENDING migration(s) en attente"

    # Test en mode dry-run
    echo "🧪 Test des migrations (dry-run)..."
    php bin/console doctrine:migrations:migrate --dry-run --no-interaction --env=prod

    # Demande de confirmation (si interactif)
    if [ -t 0 ]; then
        read -p "Continuer avec les migrations ? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Migration annulée"
            exit 1
        fi
    fi

    # Exécution des migrations
    echo "🚀 Exécution des migrations..."
    php bin/console doctrine:migrations:migrate --no-interaction --env=prod

    echo "✅ Migrations terminées avec succès"
else
    echo "✅ Aucune migration en attente"
fi

# Clear cache après migrations
echo "🧹 Nettoyage du cache..."
php bin/console cache:clear --env=prod

echo "🎉 Déploiement terminé avec succès !"
```

## Bonnes Pratiques

### Naming et organisation

```php
// ✅ Bon : nom descriptif et date claire
final class Version20240315120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout de l\'index composite user_id+created_at sur la table xtracking_event';
    }
}

// ❌ Mauvais : nom générique
final class Version20240315120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Update database';
    }
}
```

### Gestion des gros volumes

```php
public function up(Schema $schema): void
{
    // ✅ Bon : migration par batch pour les gros volumes
    $this->addSql('ALTER TABLE large_table ADD new_column INT DEFAULT NULL');

    // Mise à jour par batch de 1000 enregistrements
    $this->addSql('
        CREATE PROCEDURE UpdateLargeTableBatch()
        BEGIN
            DECLARE done INT DEFAULT FALSE;
            DECLARE batch_size INT DEFAULT 1000;
            DECLARE current_id INT DEFAULT 0;

            WHILE NOT done DO
                UPDATE large_table
                SET new_column = SOME_CALCULATION(id)
                WHERE id > current_id AND id <= current_id + batch_size;

                SET current_id = current_id + batch_size;

                IF ROW_COUNT() = 0 THEN
                    SET done = TRUE;
                END IF;
            END WHILE;
        END
    ');

    $this->addSql('CALL UpdateLargeTableBatch()');
    $this->addSql('DROP PROCEDURE UpdateLargeTableBatch');
}
```

### Migrations non-destructives

```php
public function up(Schema $schema): void
{
    // ✅ Bon : ajouter avant de supprimer (déploiement sans downtime)

    // 1. Ajouter la nouvelle colonne
    $this->addSql('ALTER TABLE user ADD email_verified_at DATETIME DEFAULT NULL');

    // 2. Migrer les données
    $this->addSql('
        UPDATE user
        SET email_verified_at = created_at
        WHERE is_verified = 1
    ');

    // 3. Supprimer l'ancienne colonne dans une migration ultérieure
    // $this->addSql('ALTER TABLE user DROP COLUMN is_verified');
}
```

### Rollback sécurisé

```php
public function down(Schema $schema): void
{
    // ✅ Vérification avant rollback destructif
    $result = $this->connection->executeQuery('
        SELECT COUNT(*) FROM user WHERE email_verified_at IS NOT NULL
    ');

    if ($result->fetchOne() > 0) {
        throw new \Exception(
            'Impossible de faire un rollback : des données seraient perdues. ' .
            'Veuillez d\'abord migrer email_verified_at vers is_verified.'
        );
    }

    $this->addSql('ALTER TABLE user DROP COLUMN email_verified_at');
}
```

## Scripts Utilitaires

### Script de validation des migrations

```bash
#!/bin/bash
# validate-migrations.sh

echo "🔍 Validation des migrations..."

# Vérifier la syntaxe SQL
for migration in migrations/**/*.php; do
    echo "Vérification : $migration"
    php -l "$migration" || exit 1
done

# Tester les migrations sur une base de test
php bin/console doctrine:database:drop --force --env=test
php bin/console doctrine:database:create --env=test
php bin/console doctrine:migrations:migrate --no-interaction --env=test

# Tester le rollback
php bin/console doctrine:migrations:migrate first --no-interaction --env=test

echo "✅ Toutes les migrations sont valides"
```

### Script de nettoyage des migrations anciennes

```bash
#!/bin/bash
# cleanup-old-migrations.sh

# Archiver les migrations de plus d'un an
ARCHIVE_DIR="migrations/archived/$(date +%Y)"
mkdir -p "$ARCHIVE_DIR"

find migrations/ -name "Version2023*.php" -exec mv {} "$ARCHIVE_DIR/" \;

echo "✅ Migrations 2023 archivées dans $ARCHIVE_DIR"
```

La gestion rigoureuse des migrations assure l'évolution contrôlée et sécurisée de la structure de base de données tout au long du cycle de vie de l'application.
