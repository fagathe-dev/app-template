<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250521194705 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE file (id INT AUTO_INCREMENT NOT NULL, request_id INT DEFAULT NULL, size INT NOT NULL, original_name VARCHAR(300) NOT NULL, updated_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', caption VARCHAR(200) DEFAULT NULL, type VARCHAR(50) DEFAULT NULL, INDEX IDX_8C9F3610427EB8A5 (request_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE request (id INT AUTO_INCREMENT NOT NULL, state VARCHAR(60) NOT NULL, message LONGTEXT NOT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', updated_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', type VARCHAR(40) NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE request_contact (id INT AUTO_INCREMENT NOT NULL, user_id INT DEFAULT NULL, request_id INT DEFAULT NULL, email VARCHAR(160) DEFAULT NULL, phone VARCHAR(20) DEFAULT NULL, fullname VARCHAR(180) DEFAULT NULL, company_name VARCHAR(255) DEFAULT NULL, is_company TINYINT(1) DEFAULT NULL, INDEX IDX_6646946FA76ED395 (user_id), UNIQUE INDEX UNIQ_6646946F427EB8A5 (request_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE request_metadata (id INT AUTO_INCREMENT NOT NULL, request_id INT DEFAULT NULL, md_key VARCHAR(50) NOT NULL, md_value VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', updated_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_BA31D431427EB8A5 (request_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE seo (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(200) NOT NULL, ref VARCHAR(100) NOT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', updated_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', url VARCHAR(255) DEFAULT NULL, content_type VARCHAR(40) DEFAULT NULL, title VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, keywords JSON DEFAULT NULL, settings JSON DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE seo_tag (id INT AUTO_INCREMENT NOT NULL, seo_id INT DEFAULT NULL, name VARCHAR(160) NOT NULL, attribute VARCHAR(40) NOT NULL, content VARCHAR(300) NOT NULL, og TINYINT(1) DEFAULT NULL, INDEX IDX_6C111AD897E3DD86 (seo_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE user (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, firstname VARCHAR(100) DEFAULT NULL, lastname VARCHAR(100) DEFAULT NULL, identifier VARCHAR(160) DEFAULT NULL, api_token VARCHAR(160) DEFAULT NULL, confirm TINYINT(1) DEFAULT NULL, registered_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', updated_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', username VARCHAR(100) NOT NULL, image VARCHAR(300) DEFAULT NULL, cover_image VARCHAR(300) DEFAULT NULL, UNIQUE INDEX UNIQ_IDENTIFIER_EMAIL (email), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE user_metadata (id INT AUTO_INCREMENT NOT NULL, user_id INT DEFAULT NULL, md_key VARCHAR(50) NOT NULL, md_value VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', updated_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_AF99D014A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE user_request (id INT AUTO_INCREMENT NOT NULL, user_id INT DEFAULT NULL, token VARCHAR(300) NOT NULL, type VARCHAR(40) NOT NULL, content VARCHAR(300) DEFAULT NULL, is_open TINYINT(1) DEFAULT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', updated_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', expired_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_639A9195A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE xtracking_event (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(120) NOT NULL, code VARCHAR(90) NOT NULL, nb_request INT DEFAULT NULL, devices JSON DEFAULT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', updated_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', is_active TINYINT(1) DEFAULT NULL, description LONGTEXT DEFAULT NULL, category VARCHAR(60) DEFAULT NULL, page VARCHAR(100) DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE xtracking_event_log (id INT AUTO_INCREMENT NOT NULL, event_id INT DEFAULT NULL, origin VARCHAR(300) NOT NULL, timestamp DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', device VARCHAR(50) NOT NULL, category VARCHAR(60) NOT NULL, INDEX IDX_DFAC670871F7E88B (event_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE file ADD CONSTRAINT FK_8C9F3610427EB8A5 FOREIGN KEY (request_id) REFERENCES request (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE request_contact ADD CONSTRAINT FK_6646946FA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE request_contact ADD CONSTRAINT FK_6646946F427EB8A5 FOREIGN KEY (request_id) REFERENCES request (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE request_metadata ADD CONSTRAINT FK_BA31D431427EB8A5 FOREIGN KEY (request_id) REFERENCES request (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE seo_tag ADD CONSTRAINT FK_6C111AD897E3DD86 FOREIGN KEY (seo_id) REFERENCES seo (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_metadata ADD CONSTRAINT FK_AF99D014A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_request ADD CONSTRAINT FK_639A9195A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE xtracking_event_log ADD CONSTRAINT FK_DFAC670871F7E88B FOREIGN KEY (event_id) REFERENCES xtracking_event (id)
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE file DROP FOREIGN KEY FK_8C9F3610427EB8A5
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE request_contact DROP FOREIGN KEY FK_6646946FA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE request_contact DROP FOREIGN KEY FK_6646946F427EB8A5
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE request_metadata DROP FOREIGN KEY FK_BA31D431427EB8A5
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE seo_tag DROP FOREIGN KEY FK_6C111AD897E3DD86
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_metadata DROP FOREIGN KEY FK_AF99D014A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_request DROP FOREIGN KEY FK_639A9195A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE xtracking_event_log DROP FOREIGN KEY FK_DFAC670871F7E88B
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE file
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE request
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE request_contact
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE request_metadata
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE seo
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE seo_tag
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE user
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE user_metadata
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE user_request
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE xtracking_event
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE xtracking_event_log
        SQL);
    }
}
