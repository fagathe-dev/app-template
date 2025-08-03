# Stratégie de Test

## Vue d'ensemble

Ce document présente la stratégie de test globale de l'application, incluant les différents types de tests, les outils utilisés, les conventions et les bonnes pratiques.

## Pyramide de Tests

### Structure des tests

```
                    E2E Tests
                 ┌─────────────────┐
                 │   Tests End-to-End │  ← Tests complets (Browser, API)
                 │   (Selenium, Jest) │
                 └─────────────────┘
              ┌─────────────────────────┐
              │   Tests d'Intégration  │  ← Tests inter-modules
              │   (PHPUnit, Jest)      │
              └─────────────────────────┘
           ┌──────────────────────────────────┐
           │        Tests Unitaires           │  ← Tests de composants isolés
           │    (PHPUnit, Jest, Testing)      │
           └──────────────────────────────────┘
```

### Répartition des tests

- **Tests Unitaires** : 70% - Logique métier, services, composants
- **Tests d'Intégration** : 20% - API, base de données, modules
- **Tests End-to-End** : 10% - Workflows complets utilisateur

## Configuration des Outils

### PHPUnit (Backend)

```xml
<!-- phpunit.xml.dist -->
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="tests/bootstrap.php"
         colors="true"
         failOnWarning="true"
         failOnRisky="true"
         stopOnFailure="false"
         executionOrder="random"
         testdox="true">

    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Integration">
            <directory>tests/Integration</directory>
        </testsuite>
        <testsuite name="Functional">
            <directory>tests/Functional</directory>
        </testsuite>
    </testsuites>

    <coverage>
        <include>
            <directory>src</directory>
            <directory>admin/src</directory>
            <directory>auth/src</directory>
            <directory>libs/src</directory>
        </include>
        <exclude>
            <directory>src/DataFixtures</directory>
            <file>src/Kernel.php</file>
        </exclude>
        <report>
            <html outputDirectory="var/coverage/html"/>
            <xml outputDirectory="var/coverage/xml"/>
            <clover outputFile="var/coverage/clover.xml"/>
        </report>
    </coverage>

    <php>
        <env name="APP_ENV" value="test"/>
        <env name="DATABASE_URL" value="mysql://root:password@127.0.0.1:3306/app_test"/>
        <env name="KERNEL_CLASS" value="App\Kernel"/>
        <env name="SYMFONY_DEPRECATIONS_HELPER" value="disabled"/>
    </php>

    <extensions>
        <extension class="DAMA\DoctrineTestBundle\PHPUnit\PHPUnitExtension"/>
    </extensions>

    <logging>
        <junit outputFile="var/log/junit.xml"/>
    </logging>
</phpunit>
```

### Jest (Frontend)

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/frontend/setup.ts'],
  testMatch: ['<rootDir>/tests/frontend/**/*.test.ts', '<rootDir>/assets/ts/**/*.test.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/assets/ts/$1',
    '^@tests/(.*)$': '<rootDir>/tests/frontend/$1',
  },
  collectCoverageFrom: ['assets/ts/**/*.ts', '!assets/ts/**/*.d.ts', '!assets/ts/vendor/**', '!**/node_modules/**'],
  coverageDirectory: 'var/coverage/frontend',
  coverageReporters: ['text', 'html', 'json', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.scss$': 'jest-scss-transform',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
```

## Types de Tests

### Tests Unitaires Backend

- **Services** : Logique métier, validations, transformations
- **Entités** : Getters, setters, méthodes métier
- **Repositories** : Requêtes personnalisées
- **Commands** : Commandes console
- **Validators** : Contraintes de validation

### Tests Unitaires Frontend

- **Services** : API clients, gestionnaires d'état
- **Composants** : Logique d'affichage, interactions
- **Utilities** : Fonctions utilitaires, helpers
- **Validators** : Validation côté client

### Tests d'Intégration

- **API REST** : Endpoints, sérialisation, authentification
- **Base de données** : Migrations, relations, requêtes
- **Services externes** : Email, stockage, paiements
- **Workflows** : Processus métier complets

### Tests End-to-End

- **Parcours utilisateur** : Inscription, connexion, navigation
- **Workflows critiques** : Commandes, paiements, notifications
- **Interfaces** : Responsive design, accessibilité
- **Performance** : Temps de chargement, optimisations

## Environnements de Test

### Base de données de test

```yaml
# config/packages/test/doctrine.yaml
doctrine:
  dbal:
    # Utiliser une base de données en mémoire pour les tests
    driver: 'pdo_sqlite'
    url: 'sqlite:///:memory:'
    charset: 'utf8mb4'

  orm:
    # Configuration spécifique aux tests
    auto_generate_proxy_classes: true
    naming_strategy: doctrine.orm.naming_strategy.underscore_number_aware
    auto_mapping: true
    mappings:
      App:
        is_bundle: false
        type: attribute
        dir: '%kernel.project_dir%/src/Entity'
        prefix: 'App\Entity'
        alias: App
```

### Fixtures et données de test

```php
// tests/DataFixtures/TestFixtures.php
<?php

namespace App\Tests\DataFixtures;

use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class TestFixtures extends Fixture
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher
    ) {}

    public function load(ObjectManager $manager): void
    {
        // Utilisateur admin
        $admin = new User();
        $admin->setEmail('admin@test.com');
        $admin->setFirstName('Admin');
        $admin->setLastName('Test');
        $admin->setRoles(['ROLE_ADMIN']);
        $admin->setPassword(
            $this->passwordHasher->hashPassword($admin, 'password123')
        );
        $admin->setEmailVerified(true);
        $manager->persist($admin);
        $this->addReference('user-admin', $admin);

        // Utilisateur standard
        $user = new User();
        $user->setEmail('user@test.com');
        $user->setFirstName('User');
        $user->setLastName('Test');
        $user->setRoles(['ROLE_USER']);
        $user->setPassword(
            $this->passwordHasher->hashPassword($user, 'password123')
        );
        $user->setEmailVerified(true);
        $manager->persist($user);
        $this->addReference('user-standard', $user);

        $manager->flush();
    }
}
```

## Conventions et Standards

### Nomenclature des tests

```
Tests/
├── Unit/                           # Tests unitaires
│   ├── Service/                   # Tests des services
│   │   ├── UserServiceTest.php    # Test de UserService
│   │   └── EmailServiceTest.php   # Test de EmailService
│   ├── Entity/                    # Tests des entités
│   │   └── UserTest.php          # Test de l'entité User
│   └── Validator/                 # Tests des validateurs
│       └── EmailValidatorTest.php # Test de EmailValidator
├── Integration/                    # Tests d'intégration
│   ├── Repository/                # Tests des repositories
│   │   └── UserRepositoryTest.php # Test de UserRepository
│   ├── Command/                   # Tests des commandes
│   │   └── CreateUserCommandTest.php
│   └── Controller/                # Tests des contrôleurs
│       └── UserControllerTest.php # Test de UserController
├── Functional/                    # Tests fonctionnels
│   ├── Api/                      # Tests API REST
│   │   └── UserApiTest.php       # Test des endpoints User
│   └── Security/                 # Tests de sécurité
│       └── AuthenticationTest.php # Test d'authentification
└── E2E/                          # Tests end-to-end
    ├── UserRegistrationTest.php   # Test d'inscription
    └── UserLoginTest.php          # Test de connexion
```

### Structure des classes de test

```php
<?php

namespace App\Tests\Unit\Service;

use App\Entity\User;
use App\Service\UserService;
use App\Repository\UserRepository;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

class UserServiceTest extends TestCase
{
    private UserService $userService;
    private UserRepository|MockObject $userRepository;

    protected function setUp(): void
    {
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->userService = new UserService($this->userRepository);
    }

    protected function tearDown(): void
    {
        unset($this->userService, $this->userRepository);
    }

    /**
     * @test
     * @group user
     * @group service
     */
    public function it_should_create_user_with_valid_data(): void
    {
        // Given - Arrange
        $userData = [
            'email' => 'test@example.com',
            'firstName' => 'John',
            'lastName' => 'Doe'
        ];

        $this->userRepository
            ->expects($this->once())
            ->method('save')
            ->with($this->isInstanceOf(User::class));

        // When - Act
        $user = $this->userService->createUser($userData);

        // Then - Assert
        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('test@example.com', $user->getEmail());
        $this->assertEquals('John', $user->getFirstName());
        $this->assertEquals('Doe', $user->getLastName());
    }

    /**
     * @test
     * @group user
     * @group service
     * @group validation
     */
    public function it_should_throw_exception_when_email_already_exists(): void
    {
        // Given
        $userData = ['email' => 'existing@example.com'];

        $existingUser = new User();
        $existingUser->setEmail('existing@example.com');

        $this->userRepository
            ->expects($this->once())
            ->method('findOneBy')
            ->with(['email' => 'existing@example.com'])
            ->willReturn($existingUser);

        // Then
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('L\'email existe déjà');

        // When
        $this->userService->createUser($userData);
    }

    /**
     * @test
     * @dataProvider invalidEmailProvider
     * @group user
     * @group service
     * @group validation
     */
    public function it_should_throw_exception_with_invalid_email(string $invalidEmail): void
    {
        // Given
        $userData = ['email' => $invalidEmail];

        // Then
        $this->expectException(\InvalidArgumentException::class);

        // When
        $this->userService->createUser($userData);
    }

    public function invalidEmailProvider(): array
    {
        return [
            'empty email' => [''],
            'invalid format' => ['not-an-email'],
            'missing domain' => ['test@'],
            'missing local' => ['@domain.com']
        ];
    }
}
```

## Outils et Helpers

### Traits de test réutilisables

```php
// tests/Traits/DatabaseTestTrait.php
<?php

namespace App\Tests\Traits;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

trait DatabaseTestTrait
{
    protected function getEntityManager(): EntityManagerInterface
    {
        return static::getContainer()->get('doctrine')->getManager();
    }

    protected function persistAndFlush(object $entity): void
    {
        $em = $this->getEntityManager();
        $em->persist($entity);
        $em->flush();
    }

    protected function refreshEntity(object $entity): object
    {
        $this->getEntityManager()->refresh($entity);
        return $entity;
    }

    protected function clearEntityManager(): void
    {
        $this->getEntityManager()->clear();
    }
}
```

### Factory de test

```php
// tests/Factory/UserFactory.php
<?php

namespace App\Tests\Factory;

use App\Entity\User;

class UserFactory
{
    public static function create(array $overrides = []): User
    {
        $user = new User();

        $defaults = [
            'email' => 'test@example.com',
            'firstName' => 'John',
            'lastName' => 'Doe',
            'roles' => ['ROLE_USER'],
            'emailVerified' => true
        ];

        $data = array_merge($defaults, $overrides);

        foreach ($data as $property => $value) {
            $setter = 'set' . ucfirst($property);
            if (method_exists($user, $setter)) {
                $user->$setter($value);
            }
        }

        return $user;
    }

    public static function createAdmin(array $overrides = []): User
    {
        return self::create(array_merge([
            'email' => 'admin@example.com',
            'roles' => ['ROLE_ADMIN']
        ], $overrides));
    }
}
```

## Métriques et Qualité

### Objectifs de couverture

- **Code Coverage** : Minimum 80%
- **Branch Coverage** : Minimum 75%
- **Function Coverage** : Minimum 85%

### Analyse de qualité

- **PHPStan** : Analyse statique PHP niveau 8
- **ESLint** : Analyse statique TypeScript
- **SonarQube** : Analyse continue de qualité
- **Mutation Testing** : Qualité des tests

### Métriques de performance

- **Temps d'exécution** : Tests unitaires < 5min
- **Tests d'intégration** : < 15min
- **Tests E2E** : < 30min

Cette stratégie de test garantit une couverture complète et une qualité élevée du code, avec des outils et des pratiques adaptés à chaque niveau de l'application.
