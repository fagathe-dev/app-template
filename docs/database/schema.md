# Schéma de Base de Données

## Vue d'ensemble

Ce document décrit la structure complète de la base de données, les relations entre entités, les contraintes et les index utilisés par l'application.

## Architecture Générale

### Technologies utilisées

- **MySQL 8.0+** : Système de gestion de base de données principal
- **Doctrine ORM 3.5** : Mapping objet-relationnel
- **Doctrine Migrations** : Gestion des versions de schéma
- **UTF8MB4** : Encodage pour support complet Unicode (emojis, caractères spéciaux)

### Conventions de nommage

- **Tables** : snake_case (user, user_request, xtracking_event)
- **Colonnes** : snake_case (first_name, created_at, is_active)
- **Index** : idx_table_column ou uniq_table_column
- **Clés étrangères** : fk_table_referenced_table

## Entités Principales

### Table `user`

Table centrale pour la gestion des utilisateurs.

```sql
CREATE TABLE `user` (
    `id` int NOT NULL AUTO_INCREMENT,
    `username` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
    `roles` json NOT NULL,
    `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `firstname` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `lastname` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `birthdate` date DEFAULT NULL,
    `gender` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `is_verified` tinyint(1) NOT NULL DEFAULT '0',
    `verification_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `password_reset_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `password_reset_expires_at` datetime DEFAULT NULL,
    `last_login_at` datetime DEFAULT NULL,
    `failed_login_attempts` int NOT NULL DEFAULT '0',
    `account_locked_until` datetime DEFAULT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `profile_picture` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `bio` text COLLATE utf8mb4_unicode_ci,
    `preferences` json DEFAULT NULL,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_user_username` (`username`),
    UNIQUE KEY `uniq_user_email` (`email`),
    UNIQUE KEY `uniq_user_verification_token` (`verification_token`),
    UNIQUE KEY `uniq_user_password_reset_token` (`password_reset_token`),
    KEY `idx_user_email` (`email`),
    KEY `idx_user_verification_token` (`verification_token`),
    KEY `idx_user_password_reset_token` (`password_reset_token`),
    KEY `idx_user_is_active` (`is_active`),
    KEY `idx_user_last_login_at` (`last_login_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Colonnes principales

- **id** : Identifiant unique auto-incrémenté
- **username** : Nom d'utilisateur unique (180 caractères max)
- **roles** : Rôles JSON (ROLE_USER, ROLE_ADMIN, etc.)
- **password** : Hash bcrypt du mot de passe
- **email** : Adresse email unique
- **firstname/lastname** : Nom et prénom
- **is_verified** : Statut de vérification email
- **verification_token** : Token de vérification email
- **password_reset_token** : Token de réinitialisation mot de passe
- **failed_login_attempts** : Compteur tentatives de connexion échouées
- **account_locked_until** : Date de fin de verrouillage du compte
- **preferences** : Préférences utilisateur au format JSON

### Table `user_request`

Gestion des demandes utilisateurs.

```sql
CREATE TABLE `user_request` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int NOT NULL,
    `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `description` longtext COLLATE utf8mb4_unicode_ci,
    `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
    `priority` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
    `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `assigned_to` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `metadata` json DEFAULT NULL,
    `internal_notes` longtext COLLATE utf8mb4_unicode_ci,
    `resolution` longtext COLLATE utf8mb4_unicode_ci,
    `resolved_at` datetime DEFAULT NULL,
    `due_date` datetime DEFAULT NULL,
    `estimated_hours` decimal(5,2) DEFAULT NULL,
    `actual_hours` decimal(5,2) DEFAULT NULL,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_user_request_user` (`user_id`),
    KEY `idx_user_request_status` (`status`),
    KEY `idx_user_request_priority` (`priority`),
    KEY `idx_user_request_category` (`category`),
    KEY `idx_user_request_created_at` (`created_at`),
    KEY `idx_user_request_due_date` (`due_date`),
    CONSTRAINT `fk_user_request_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Statuts possibles

- **pending** : En attente
- **in_progress** : En cours de traitement
- **waiting_user** : En attente de retour utilisateur
- **resolved** : Résolu
- **closed** : Fermé
- **cancelled** : Annulé

#### Priorités possibles

- **low** : Basse
- **normal** : Normale
- **high** : Haute
- **urgent** : Urgente

### Table `file`

Gestion des fichiers uploadés.

```sql
CREATE TABLE `file` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int DEFAULT NULL,
    `request_id` int DEFAULT NULL,
    `original_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
    `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `size` bigint NOT NULL,
    `checksum` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `metadata` json DEFAULT NULL,
    `is_public` tinyint(1) NOT NULL DEFAULT '0',
    `download_count` int NOT NULL DEFAULT '0',
    `expires_at` datetime DEFAULT NULL,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_file_user` (`user_id`),
    KEY `fk_file_request` (`request_id`),
    KEY `idx_file_filename` (`filename`),
    KEY `idx_file_mime_type` (`mime_type`),
    KEY `idx_file_size` (`size`),
    KEY `idx_file_is_public` (`is_public`),
    KEY `idx_file_expires_at` (`expires_at`),
    CONSTRAINT `fk_file_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_file_request` FOREIGN KEY (`request_id`) REFERENCES `user_request` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table `seo`

Gestion des métadonnées SEO.

```sql
CREATE TABLE `seo` (
    `id` int NOT NULL AUTO_INCREMENT,
    `path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `description` text COLLATE utf8mb4_unicode_ci,
    `keywords` text COLLATE utf8mb4_unicode_ci,
    `og_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `og_description` text COLLATE utf8mb4_unicode_ci,
    `og_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `og_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'website',
    `twitter_card` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'summary',
    `twitter_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `twitter_description` text COLLATE utf8mb4_unicode_ci,
    `twitter_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `canonical_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `robots` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'index,follow',
    `structured_data` json DEFAULT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_seo_path` (`path`),
    KEY `idx_seo_path` (`path`),
    KEY `idx_seo_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table `xtracking_event`

Système de tracking et analytics.

```sql
CREATE TABLE `xtracking_event` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int DEFAULT NULL,
    `session_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `event_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `event_category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `event_action` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `event_label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `event_value` decimal(10,2) DEFAULT NULL,
    `page_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `page_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `referrer` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `user_agent` text COLLATE utf8mb4_unicode_ci,
    `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `country` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `device_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `browser` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `os` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `custom_data` json DEFAULT NULL,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_xtracking_event_user` (`user_id`),
    KEY `idx_xtracking_event_session_id` (`session_id`),
    KEY `idx_xtracking_event_name` (`event_name`),
    KEY `idx_xtracking_event_category` (`event_category`),
    KEY `idx_xtracking_event_created_at` (`created_at`),
    KEY `idx_xtracking_event_ip_address` (`ip_address`),
    KEY `idx_xtracking_event_country` (`country`),
    CONSTRAINT `fk_xtracking_event_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table `request`

Table de logs des requêtes HTTP.

```sql
CREATE TABLE `request` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int DEFAULT NULL,
    `method` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
    `uri` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
    `headers` json DEFAULT NULL,
    `query_params` json DEFAULT NULL,
    `body` longtext COLLATE utf8mb4_unicode_ci,
    `response_status` int DEFAULT NULL,
    `response_headers` json DEFAULT NULL,
    `response_body` longtext COLLATE utf8mb4_unicode_ci,
    `response_time` decimal(8,3) DEFAULT NULL,
    `memory_usage` bigint DEFAULT NULL,
    `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `user_agent` text COLLATE utf8mb4_unicode_ci,
    `session_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `error_message` text COLLATE utf8mb4_unicode_ci,
    `stack_trace` longtext COLLATE utf8mb4_unicode_ci,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_request_user` (`user_id`),
    KEY `idx_request_method` (`method`),
    KEY `idx_request_uri` (`uri`(255)),
    KEY `idx_request_response_status` (`response_status`),
    KEY `idx_request_created_at` (`created_at`),
    KEY `idx_request_ip_address` (`ip_address`),
    KEY `idx_request_session_id` (`session_id`),
    CONSTRAINT `fk_request_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Tables de Support

### Table `doctrine_migration_versions`

Gestion des versions de migrations Doctrine.

```sql
CREATE TABLE `doctrine_migration_versions` (
    `version` varchar(191) COLLATE utf8_unicode_ci NOT NULL,
    `executed_at` datetime DEFAULT NULL,
    `execution_time` int DEFAULT NULL,
    PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
```

## Relations et Contraintes

### Relations principales

#### User → UserRequest (1:N)

- Un utilisateur peut avoir plusieurs demandes
- Suppression en cascade : si un utilisateur est supprimé, ses demandes sont supprimées
- Index sur `user_id` pour optimiser les requêtes

#### UserRequest → File (1:N)

- Une demande peut avoir plusieurs fichiers attachés
- Suppression en cascade : si une demande est supprimée, ses fichiers sont supprimés
- Index sur `request_id` pour optimiser les requêtes

#### User → File (1:N) - Optionnel

- Un utilisateur peut uploader des fichiers indépendamment des demandes
- Suppression avec SET NULL : si un utilisateur est supprimé, ses fichiers deviennent orphelins
- Index sur `user_id` pour optimiser les requêtes

#### User → XtrackingEvent (1:N) - Optionnel

- Un utilisateur peut générer plusieurs événements de tracking
- Suppression avec SET NULL : permet de conserver les analytics même si l'utilisateur est supprimé
- Index sur `user_id` pour optimiser les requêtes

#### User → Request (1:N) - Optionnel

- Un utilisateur peut générer plusieurs logs de requêtes
- Suppression avec SET NULL : permet de conserver les logs même si l'utilisateur est supprimé
- Index sur `user_id` pour optimiser les requêtes

### Contraintes d'unicité

#### Table `user`

- `username` : Unique, sensible à la casse
- `email` : Unique, insensible à la casse (traité en application)
- `verification_token` : Unique quand présent
- `password_reset_token` : Unique quand présent

#### Table `seo`

- `path` : Unique, une seule configuration SEO par path

## Index et Performance

### Index principaux pour les requêtes fréquentes

#### Table `user`

```sql
-- Recherche par email (connexion)
KEY `idx_user_email` (`email`)

-- Recherche par token de vérification
KEY `idx_user_verification_token` (`verification_token`)

-- Recherche par token de reset
KEY `idx_user_password_reset_token` (`password_reset_token`)

-- Filtrage des utilisateurs actifs
KEY `idx_user_is_active` (`is_active`)

-- Tri par dernière connexion
KEY `idx_user_last_login_at` (`last_login_at`)
```

#### Table `user_request`

```sql
-- Filtrage par statut (le plus fréquent)
KEY `idx_user_request_status` (`status`)

-- Filtrage par priorité
KEY `idx_user_request_priority` (`priority`)

-- Filtrage par catégorie
KEY `idx_user_request_category` (`category`)

-- Tri par date de création (pagination)
KEY `idx_user_request_created_at` (`created_at`)

-- Filtrage par date d'échéance
KEY `idx_user_request_due_date` (`due_date`)
```

#### Table `xtracking_event`

```sql
-- Groupement par session
KEY `idx_xtracking_event_session_id` (`session_id`)

-- Filtrage par type d'événement
KEY `idx_xtracking_event_name` (`event_name`)

-- Filtrage par catégorie
KEY `idx_xtracking_event_category` (`event_category`)

-- Filtrage temporel (analytics)
KEY `idx_xtracking_event_created_at` (`created_at`)

-- Géolocalisation
KEY `idx_xtracking_event_country` (`country`)
```

### Index composites suggérés pour optimisations avancées

```sql
-- Recherche des demandes par utilisateur et statut
ALTER TABLE `user_request` ADD INDEX `idx_user_request_user_status` (`user_id`, `status`);

-- Recherche des événements par utilisateur et date
ALTER TABLE `xtracking_event` ADD INDEX `idx_xtracking_user_date` (`user_id`, `created_at`);

-- Recherche des fichiers publics par type
ALTER TABLE `file` ADD INDEX `idx_file_public_mime` (`is_public`, `mime_type`);

-- Recherche des requêtes par statut et date
ALTER TABLE `request` ADD INDEX `idx_request_status_date` (`response_status`, `created_at`);
```

## Types de Données JSON

### Colonne `user.roles`

```json
["ROLE_USER", "ROLE_ADMIN", "ROLE_MODERATOR"]
```

### Colonne `user.preferences`

```json
{
  "language": "fr",
  "timezone": "Europe/Paris",
  "theme": "light",
  "notifications": {
    "email": true,
    "browser": false,
    "sms": false
  },
  "privacy": {
    "profile_visibility": "public",
    "tracking_consent": true
  }
}
```

### Colonne `user_request.metadata`

```json
{
  "source": "web",
  "browser": "Chrome 120.0",
  "ip_address": "192.168.1.1",
  "referrer": "https://google.com",
  "utm_campaign": "summer_promo",
  "custom_fields": {
    "department": "IT",
    "urgency_reason": "Production down"
  }
}
```

### Colonne `file.metadata`

```json
{
  "image_dimensions": {
    "width": 1920,
    "height": 1080
  },
  "exif_data": {
    "camera": "Canon EOS 5D",
    "date_taken": "2024-01-15T10:30:00Z"
  },
  "processing": {
    "thumbnails_generated": true,
    "virus_scanned": true,
    "scan_result": "clean"
  }
}
```

### Colonne `seo.structured_data`

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Mon Application",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+33-1-23-45-67-89",
    "contactType": "Customer Service"
  }
}
```

### Colonne `xtracking_event.custom_data`

```json
{
  "page_load_time": 1250,
  "scroll_depth": 75,
  "ab_test_variant": "B",
  "conversion_value": 99.99,
  "product_id": "PRD123",
  "campaign_id": "CMP456"
}
```

## Partitioning et Optimisations

### Partitioning par date pour les tables de logs

```sql
-- Partitioning de la table xtracking_event par mois
ALTER TABLE `xtracking_event`
PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202401 VALUES LESS THAN (202402),
    PARTITION p202402 VALUES LESS THAN (202403),
    PARTITION p202403 VALUES LESS THAN (202404),
    -- ... autres partitions
    PARTITION p202412 VALUES LESS THAN (202501),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- Partitioning de la table request par mois
ALTER TABLE `request`
PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202401 VALUES LESS THAN (202402),
    PARTITION p202402 VALUES LESS THAN (202403),
    -- ... autres partitions
    PARTITION pmax VALUES LESS THAN MAXVALUE
);
```

### Archivage automatique

```sql
-- Procédure d'archivage des événements de tracking anciens
DELIMITER $$
CREATE PROCEDURE ArchiveOldTrackingEvents()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Archiver les événements de plus de 1 an
    INSERT INTO `xtracking_event_archive`
    SELECT * FROM `xtracking_event`
    WHERE `created_at` < DATE_SUB(NOW(), INTERVAL 1 YEAR);

    -- Supprimer les événements archivés
    DELETE FROM `xtracking_event`
    WHERE `created_at` < DATE_SUB(NOW(), INTERVAL 1 YEAR);

    COMMIT;
END$$
DELIMITER ;
```

## Maintenance et Monitoring

### Requêtes de monitoring

```sql
-- Taille des tables
SELECT
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size_MB',
    table_rows
FROM information_schema.tables
WHERE table_schema = 'app_database'
ORDER BY (data_length + index_length) DESC;

-- Index les plus utilisés
SELECT
    s.table_name,
    s.index_name,
    s.cardinality,
    s.seq_in_index,
    s.column_name
FROM information_schema.statistics s
WHERE s.table_schema = 'app_database'
ORDER BY s.table_name, s.cardinality DESC;

-- Requêtes lentes potentielles
SELECT
    COUNT(*) as request_count,
    AVG(response_time) as avg_response_time,
    MAX(response_time) as max_response_time,
    uri
FROM request
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY uri
HAVING AVG(response_time) > 1000
ORDER BY avg_response_time DESC;
```

### Statistiques utilisateurs

```sql
-- Activité utilisateurs par jour
SELECT
    DATE(created_at) as date,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(*) as total_events
FROM xtracking_event
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date;

-- Statut des demandes utilisateurs
SELECT
    status,
    COUNT(*) as count,
    AVG(TIMESTAMPDIFF(HOUR, created_at, COALESCE(resolved_at, NOW()))) as avg_resolution_hours
FROM user_request
GROUP BY status;
```

Cette structure de base de données offre une base solide pour une application web moderne avec des capacités de tracking, de gestion des utilisateurs et de traitement des demandes, tout en maintenant de bonnes performances grâce à un indexage approprié.
