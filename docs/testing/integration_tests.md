# Tests d'Intégration

## Vue d'ensemble

Ce document présente les pratiques et exemples de tests d'intégration pour l'application, couvrant les tests API, les tests de base de données, et les tests inter-modules.

## Tests d'Intégration Backend

### Configuration des Tests d'Intégration

```php
// tests/Integration/AbstractIntegrationTest.php
<?php

namespace App\Tests\Integration;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\DependencyInjection\ContainerInterface;

abstract class AbstractIntegrationTest extends KernelTestCase
{
    protected ContainerInterface $container;
    protected EntityManagerInterface $entityManager;

    protected function setUp(): void
    {
        parent::setUp();
        self::bootKernel();

        $this->container = static::getContainer();
        $this->entityManager = $this->container->get('doctrine')->getManager();

        // Nettoyer la base de données avant chaque test
        $this->cleanDatabase();
    }

    protected function tearDown(): void
    {
        parent::tearDown();

        // Nettoyer la base de données après chaque test
        $this->cleanDatabase();

        // Fermer l'EntityManager
        $this->entityManager->close();
        $this->entityManager = null;
    }

    protected function cleanDatabase(): void
    {
        $connection = $this->entityManager->getConnection();
        $platform = $connection->getDatabasePlatform();

        // Désactiver les contraintes de clés étrangères
        $connection->executeStatement('SET FOREIGN_KEY_CHECKS=0');

        // Obtenir toutes les tables
        $tables = $connection->getSchemaManager()->listTableNames();

        // Vider toutes les tables
        foreach ($tables as $table) {
            $connection->executeStatement($platform->getTruncateTableSQL($table));
        }

        // Réactiver les contraintes de clés étrangères
        $connection->executeStatement('SET FOREIGN_KEY_CHECKS=1');
    }

    protected function loadFixtures(array $fixtures): void
    {
        foreach ($fixtures as $fixture) {
            $this->entityManager->persist($fixture);
        }
        $this->entityManager->flush();
    }
}
```

### Tests des Repositories

#### Test de UserRepository

```php
<?php

namespace App\Tests\Integration\Repository;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Tests\Integration\AbstractIntegrationTest;

class UserRepositoryTest extends AbstractIntegrationTest
{
    private UserRepository $userRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->userRepository = $this->container->get(UserRepository::class);
    }

    /**
     * @test
     * @group integration
     * @group repository
     * @group user
     */
    public function it_should_find_users_by_role(): void
    {
        // Given
        $admin1 = $this->createUser('admin1@test.com', ['ROLE_ADMIN']);
        $admin2 = $this->createUser('admin2@test.com', ['ROLE_ADMIN']);
        $user1 = $this->createUser('user1@test.com', ['ROLE_USER']);

        $this->loadFixtures([$admin1, $admin2, $user1]);

        // When
        $admins = $this->userRepository->findByRole('ROLE_ADMIN');

        // Then
        $this->assertCount(2, $admins);
        $this->assertContains($admin1, $admins);
        $this->assertContains($admin2, $admins);
        $this->assertNotContains($user1, $admins);
    }

    /**
     * @test
     * @group integration
     * @group repository
     * @group user
     */
    public function it_should_find_users_by_email_domain(): void
    {
        // Given
        $user1 = $this->createUser('john@company.com');
        $user2 = $this->createUser('jane@company.com');
        $user3 = $this->createUser('bob@other.com');

        $this->loadFixtures([$user1, $user2, $user3]);

        // When
        $companyUsers = $this->userRepository->findByEmailDomain('company.com');

        // Then
        $this->assertCount(2, $companyUsers);
        $emails = array_map(fn($user) => $user->getEmail(), $companyUsers);
        $this->assertContains('john@company.com', $emails);
        $this->assertContains('jane@company.com', $emails);
        $this->assertNotContains('bob@other.com', $emails);
    }

    /**
     * @test
     * @group integration
     * @group repository
     * @group user
     */
    public function it_should_find_unverified_users_older_than_date(): void
    {
        // Given
        $oldDate = new \DateTime('-7 days');
        $recentDate = new \DateTime('-1 day');

        $oldUnverified = $this->createUser('old@test.com');
        $oldUnverified->setEmailVerified(false);
        $oldUnverified->setCreatedAt($oldDate);

        $recentUnverified = $this->createUser('recent@test.com');
        $recentUnverified->setEmailVerified(false);
        $recentUnverified->setCreatedAt($recentDate);

        $verifiedUser = $this->createUser('verified@test.com');
        $verifiedUser->setEmailVerified(true);
        $verifiedUser->setCreatedAt($oldDate);

        $this->loadFixtures([$oldUnverified, $recentUnverified, $verifiedUser]);

        // When
        $cutoffDate = new \DateTime('-3 days');
        $unverifiedUsers = $this->userRepository->findUnverifiedOlderThan($cutoffDate);

        // Then
        $this->assertCount(1, $unverifiedUsers);
        $this->assertContains($oldUnverified, $unverifiedUsers);
        $this->assertNotContains($recentUnverified, $unverifiedUsers);
        $this->assertNotContains($verifiedUser, $unverifiedUsers);
    }

    /**
     * @test
     * @group integration
     * @group repository
     * @group user
     */
    public function it_should_get_user_statistics(): void
    {
        // Given
        $verified1 = $this->createUser('verified1@test.com');
        $verified1->setEmailVerified(true);
        $verified1->setCreatedAt(new \DateTime('-10 days'));

        $verified2 = $this->createUser('verified2@test.com');
        $verified2->setEmailVerified(true);
        $verified2->setCreatedAt(new \DateTime('-5 days'));

        $unverified = $this->createUser('unverified@test.com');
        $unverified->setEmailVerified(false);
        $unverified->setCreatedAt(new \DateTime('-2 days'));

        $this->loadFixtures([$verified1, $verified2, $unverified]);

        // When
        $stats = $this->userRepository->getUserStatistics();

        // Then
        $this->assertEquals(3, $stats['total']);
        $this->assertEquals(2, $stats['verified']);
        $this->assertEquals(1, $stats['unverified']);
        $this->assertArrayHasKey('registrations_last_30_days', $stats);
    }

    private function createUser(string $email, array $roles = ['ROLE_USER']): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setFirstName('Test');
        $user->setLastName('User');
        $user->setRoles($roles);
        $user->setPassword('hashed_password');

        return $user;
    }
}
```

#### Test de RequestRepository

```php
<?php

namespace App\Tests\Integration\Repository;

use App\Entity\User;
use App\Entity\Request;
use App\Repository\RequestRepository;
use App\Tests\Integration\AbstractIntegrationTest;

class RequestRepositoryTest extends AbstractIntegrationTest
{
    private RequestRepository $requestRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->requestRepository = $this->container->get(RequestRepository::class);
    }

    /**
     * @test
     * @group integration
     * @group repository
     * @group request
     */
    public function it_should_find_requests_by_status(): void
    {
        // Given
        $user = $this->createUser();
        $pendingRequest1 = $this->createRequest($user, 'pending');
        $pendingRequest2 = $this->createRequest($user, 'pending');
        $approvedRequest = $this->createRequest($user, 'approved');

        $this->loadFixtures([$user, $pendingRequest1, $pendingRequest2, $approvedRequest]);

        // When
        $pendingRequests = $this->requestRepository->findByStatus('pending');

        // Then
        $this->assertCount(2, $pendingRequests);
        $this->assertContains($pendingRequest1, $pendingRequests);
        $this->assertContains($pendingRequest2, $pendingRequests);
        $this->assertNotContains($approvedRequest, $pendingRequests);
    }

    /**
     * @test
     * @group integration
     * @group repository
     * @group request
     */
    public function it_should_find_requests_pending_longer_than_days(): void
    {
        // Given
        $user = $this->createUser();

        $oldPending = $this->createRequest($user, 'pending');
        $oldPending->setCreatedAt(new \DateTime('-10 days'));

        $recentPending = $this->createRequest($user, 'pending');
        $recentPending->setCreatedAt(new \DateTime('-2 days'));

        $this->loadFixtures([$user, $oldPending, $recentPending]);

        // When
        $oldRequests = $this->requestRepository->findPendingOlderThan(7);

        // Then
        $this->assertCount(1, $oldRequests);
        $this->assertContains($oldPending, $oldRequests);
        $this->assertNotContains($recentPending, $oldRequests);
    }

    /**
     * @test
     * @group integration
     * @group repository
     * @group request
     */
    public function it_should_get_request_statistics_by_period(): void
    {
        // Given
        $user = $this->createUser();

        // Requêtes cette semaine
        $thisWeek1 = $this->createRequest($user, 'approved');
        $thisWeek1->setCreatedAt(new \DateTime('-2 days'));

        $thisWeek2 = $this->createRequest($user, 'pending');
        $thisWeek2->setCreatedAt(new \DateTime('-1 day'));

        // Requête semaine dernière
        $lastWeek = $this->createRequest($user, 'approved');
        $lastWeek->setCreatedAt(new \DateTime('-10 days'));

        $this->loadFixtures([$user, $thisWeek1, $thisWeek2, $lastWeek]);

        // When
        $stats = $this->requestRepository->getStatisticsByPeriod(
            new \DateTime('-7 days'),
            new \DateTime()
        );

        // Then
        $this->assertEquals(2, $stats['total']);
        $this->assertEquals(1, $stats['approved']);
        $this->assertEquals(1, $stats['pending']);
        $this->assertEquals(0, $stats['rejected']);
    }

    private function createUser(): User
    {
        $user = new User();
        $user->setEmail('test@example.com');
        $user->setFirstName('Test');
        $user->setLastName('User');
        $user->setPassword('password');

        return $user;
    }

    private function createRequest(User $user, string $status = 'pending'): Request
    {
        $request = new Request();
        $request->setUser($user);
        $request->setTitle('Test Request');
        $request->setDescription('Test Description');
        $request->setStatus($status);

        return $request;
    }
}
```

### Tests d'API REST

#### Test de UserController API

```php
<?php

namespace App\Tests\Integration\Controller;

use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class UserControllerTest extends WebTestCase
{
    private $client;
    private $entityManager;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->entityManager = static::getContainer()
            ->get('doctrine')
            ->getManager();
    }

    /**
     * @test
     * @group integration
     * @group api
     * @group user
     */
    public function it_should_get_user_list(): void
    {
        // Given
        $this->createAuthenticatedUser();

        $user1 = $this->createUser('user1@test.com', 'User', 'One');
        $user2 = $this->createUser('user2@test.com', 'User', 'Two');

        $this->entityManager->persist($user1);
        $this->entityManager->persist($user2);
        $this->entityManager->flush();

        // When
        $this->client->request('GET', '/api/users', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getAuthToken(),
            'CONTENT_TYPE' => 'application/json'
        ]);

        // Then
        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('Content-Type', 'application/json');

        $responseData = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('data', $responseData);
        $this->assertArrayHasKey('pagination', $responseData);
        $this->assertCount(2, $responseData['data']);
    }

    /**
     * @test
     * @group integration
     * @group api
     * @group user
     */
    public function it_should_create_new_user(): void
    {
        // Given
        $this->createAuthenticatedUser();

        $userData = [
            'email' => 'newuser@test.com',
            'firstName' => 'New',
            'lastName' => 'User',
            'password' => 'password123'
        ];

        // When
        $this->client->request('POST', '/api/users', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getAuthToken(),
            'CONTENT_TYPE' => 'application/json'
        ], json_encode($userData));

        // Then
        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);

        $responseData = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals('newuser@test.com', $responseData['email']);
        $this->assertEquals('New', $responseData['firstName']);
        $this->assertEquals('User', $responseData['lastName']);
        $this->assertArrayNotHasKey('password', $responseData);

        // Vérifier en base de données
        $user = $this->entityManager->getRepository(User::class)
            ->findOneBy(['email' => 'newuser@test.com']);
        $this->assertNotNull($user);
    }

    /**
     * @test
     * @group integration
     * @group api
     * @group user
     */
    public function it_should_update_existing_user(): void
    {
        // Given
        $this->createAuthenticatedUser();

        $user = $this->createUser('update@test.com', 'Old', 'Name');
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $updateData = [
            'firstName' => 'New',
            'lastName' => 'Name'
        ];

        // When
        $this->client->request('PUT', '/api/users/' . $user->getId(), [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getAuthToken(),
            'CONTENT_TYPE' => 'application/json'
        ], json_encode($updateData));

        // Then
        $this->assertResponseIsSuccessful();

        $responseData = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals('New', $responseData['firstName']);
        $this->assertEquals('Name', $responseData['lastName']);

        // Vérifier en base de données
        $this->entityManager->refresh($user);
        $this->assertEquals('New', $user->getFirstName());
        $this->assertEquals('Name', $user->getLastName());
    }

    /**
     * @test
     * @group integration
     * @group api
     * @group user
     */
    public function it_should_delete_user(): void
    {
        // Given
        $this->createAuthenticatedUser();

        $user = $this->createUser('delete@test.com', 'To', 'Delete');
        $this->entityManager->persist($user);
        $this->entityManager->flush();
        $userId = $user->getId();

        // When
        $this->client->request('DELETE', '/api/users/' . $userId, [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getAuthToken()
        ]);

        // Then
        $this->assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);

        // Vérifier que l'utilisateur est supprimé
        $deletedUser = $this->entityManager->getRepository(User::class)
            ->find($userId);
        $this->assertNull($deletedUser);
    }

    /**
     * @test
     * @group integration
     * @group api
     * @group user
     * @group validation
     */
    public function it_should_return_validation_errors_for_invalid_data(): void
    {
        // Given
        $this->createAuthenticatedUser();

        $invalidData = [
            'email' => 'invalid-email',
            'firstName' => '',
            'password' => '123' // Trop court
        ];

        // When
        $this->client->request('POST', '/api/users', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getAuthToken(),
            'CONTENT_TYPE' => 'application/json'
        ], json_encode($invalidData));

        // Then
        $this->assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);

        $responseData = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('errors', $responseData);
        $this->assertArrayHasKey('email', $responseData['errors']);
        $this->assertArrayHasKey('firstName', $responseData['errors']);
        $this->assertArrayHasKey('password', $responseData['errors']);
    }

    /**
     * @test
     * @group integration
     * @group api
     * @group user
     * @group security
     */
    public function it_should_require_authentication(): void
    {
        // When
        $this->client->request('GET', '/api/users');

        // Then
        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    /**
     * @test
     * @group integration
     * @group api
     * @group user
     * @group pagination
     */
    public function it_should_paginate_user_list(): void
    {
        // Given
        $this->createAuthenticatedUser();

        // Créer 15 utilisateurs
        for ($i = 1; $i <= 15; $i++) {
            $user = $this->createUser("user{$i}@test.com", "User", (string)$i);
            $this->entityManager->persist($user);
        }
        $this->entityManager->flush();

        // When - Page 1 avec 10 éléments
        $this->client->request('GET', '/api/users?page=1&limit=10', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getAuthToken()
        ]);

        // Then
        $this->assertResponseIsSuccessful();

        $responseData = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertCount(10, $responseData['data']);
        $this->assertEquals(1, $responseData['pagination']['page']);
        $this->assertEquals(10, $responseData['pagination']['limit']);
        $this->assertEquals(15, $responseData['pagination']['total']);
        $this->assertEquals(2, $responseData['pagination']['totalPages']);

        // When - Page 2
        $this->client->request('GET', '/api/users?page=2&limit=10', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getAuthToken()
        ]);

        // Then
        $responseData = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertCount(5, $responseData['data']); // 5 restants
        $this->assertEquals(2, $responseData['pagination']['page']);
    }

    private function createUser(string $email = 'test@example.com', string $firstName = 'Test', string $lastName = 'User'): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setFirstName($firstName);
        $user->setLastName($lastName);
        $user->setPassword('hashed_password');
        $user->setEmailVerified(true);

        return $user;
    }

    private function createAuthenticatedUser(): User
    {
        $admin = $this->createUser('admin@test.com', 'Admin', 'User');
        $admin->setRoles(['ROLE_ADMIN']);
        $this->entityManager->persist($admin);
        $this->entityManager->flush();

        return $admin;
    }

    private function getAuthToken(): string
    {
        // Dans un vrai test, vous générerez un JWT valide
        // Pour cet exemple, on simule un token
        return 'valid_jwt_token_here';
    }
}
```

## Tests d'Intégration Frontend

### Configuration Jest pour l'Intégration

```javascript
// jest.integration.config.js
module.exports = {
  ...require('./jest.config.js'),
  testMatch: ['<rootDir>/tests/frontend/integration/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/frontend/integration/setup.ts'],
  testEnvironment: 'jsdom',
  testTimeout: 10000,
};
```

### Test d'Intégration Service + API

```typescript
// tests/frontend/integration/UserService.test.ts
import { UserService } from '@/services/UserService';
import { ApiClient } from '@/services/ApiClient';
import { StateManager } from '@/services/StateManager';

// Mock fetch pour simuler les réponses API
global.fetch = jest.fn();

describe('UserService Integration', () => {
  let userService: UserService;
  let apiClient: ApiClient;
  let stateManager: StateManager;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    stateManager = new StateManager();
    apiClient = new ApiClient('https://api.test.com');
    userService = new UserService(apiClient, stateManager);

    mockFetch.mockClear();
  });

  describe('User authentication flow', () => {
    it('should handle complete login flow', async () => {
      // Given
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          roles: ['ROLE_USER'],
        },
        token: 'jwt_token_123',
        refreshToken: 'refresh_token_123',
        expiresIn: 3600,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      // When
      const result = await userService.login(loginData.email, loginData.password);

      // Then
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(loginData),
        })
      );

      expect(result).toEqual(mockResponse.user);
      expect(userService.isAuthenticated()).toBe(true);
      expect(userService.getUser()).toEqual(mockResponse.user);
      expect(userService.getToken()).toBe(mockResponse.token);
    });

    it('should handle login failure and maintain state', async () => {
      // Given
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid credentials' }),
      } as Response);

      // When & Then
      await expect(userService.login('wrong@example.com', 'wrongpassword')).rejects.toThrow('Unauthorized');

      expect(userService.isAuthenticated()).toBe(false);
      expect(userService.getUser()).toBeNull();
      expect(userService.getToken()).toBeNull();
    });
  });

  describe('User data management', () => {
    it('should fetch and cache user profile', async () => {
      // Given
      const userId = 1;
      const userData = {
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => userData,
      } as Response);

      // When - Premier appel
      const result1 = await userService.getUserProfile(userId);

      // Then
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(userData);

      // When - Deuxième appel (doit utiliser le cache)
      const result2 = await userService.getUserProfile(userId);

      // Then
      expect(mockFetch).toHaveBeenCalledTimes(1); // Pas d'appel supplémentaire
      expect(result2).toEqual(userData);
    });

    it('should update user profile and invalidate cache', async () => {
      // Given
      const userId = 1;
      const updateData = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = {
        id: userId,
        email: 'test@example.com',
        ...updateData,
      };

      // Mock pour update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedUser,
      } as Response);

      // Mock pour fetch après update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedUser,
      } as Response);

      // When
      const result = await userService.updateUserProfile(userId, updateData);

      // Then
      expect(result).toEqual(updatedUser);

      // Vérifier que le cache a été invalidé en refaisant un appel
      const cachedResult = await userService.getUserProfile(userId);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('State synchronization', () => {
    it('should sync authentication state with storage', async () => {
      // Given
      const authData = {
        user: { id: 1, email: 'test@example.com' },
        token: 'token_123',
        refreshToken: 'refresh_123',
        expiresIn: 3600,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => authData,
      } as Response);

      // When
      await userService.login('test@example.com', 'password');

      // Then - Vérifier que l'état est sauvegardé
      const savedAuthState = stateManager.get('auth_state');
      expect(savedAuthState.isAuthenticated).toBe(true);
      expect(savedAuthState.user).toEqual(authData.user);
      expect(savedAuthState.token).toBe(authData.token);

      // When - Créer un nouveau service (simulation de rechargement)
      const newStateManager = new StateManager();
      const newUserService = new UserService(apiClient, newStateManager);

      // Then - L'état doit être restauré
      expect(newUserService.isAuthenticated()).toBe(true);
      expect(newUserService.getUser()).toEqual(authData.user);
    });
  });

  describe('Error handling and recovery', () => {
    it('should handle network errors gracefully', async () => {
      // Given
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // When & Then
      await expect(userService.login('test@example.com', 'password')).rejects.toThrow('Network error');

      // L'état doit rester cohérent
      expect(userService.isAuthenticated()).toBe(false);
    });

    it('should handle token refresh on API calls', async () => {
      // Given - Simuler un utilisateur connecté avec un token expiré
      const expiredTokenTime = Date.now() - 1000;
      stateManager.set('auth_state', {
        isAuthenticated: true,
        user: { id: 1, email: 'test@example.com' },
        token: 'expired_token',
        refreshToken: 'refresh_token',
        tokenExpiry: expiredTokenTime,
      });

      // Mock pour refresh token
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: 'new_token',
            refreshToken: 'new_refresh_token',
            expiresIn: 3600,
          }),
        } as Response)
        // Mock pour l'appel API original après refresh
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 1, name: 'Profile data' }),
        } as Response);

      // When
      const result = await userService.getUserProfile(1);

      // Then
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(userService.getToken()).toBe('new_token');
      expect(result).toEqual({ id: 1, name: 'Profile data' });
    });
  });
});
```

### Test d'Intégration Composant + Service

```typescript
// tests/frontend/integration/UserForm.test.ts
import { UserForm } from '@/components/forms/UserForm';
import { UserService } from '@/services/UserService';
import { FormValidator } from '@/components/forms/FormValidator';

describe('UserForm Integration', () => {
  let container: HTMLElement;
  let userForm: UserForm;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    container.innerHTML = `
            <form data-user-form>
                <input name="firstName" type="text" />
                <input name="lastName" type="text" />
                <input name="email" type="email" />
                <button type="submit">Sauvegarder</button>
            </form>
        `;
    document.body.appendChild(container);

    // Mock UserService
    mockUserService = {
      createUser: jest.fn(),
      updateUser: jest.fn(),
      validateEmail: jest.fn(),
    } as any;

    // Initialize component
    const formElement = container.querySelector('[data-user-form]') as HTMLFormElement;
    userForm = new UserForm(formElement, { userService: mockUserService });
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Form submission with service integration', () => {
    it('should create user through service on valid form submission', async () => {
      // Given
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const createdUser = { id: 1, ...userData };
      mockUserService.createUser.mockResolvedValueOnce(createdUser);

      // Fill form
      const firstNameInput = container.querySelector('[name="firstName"]') as HTMLInputElement;
      const lastNameInput = container.querySelector('[name="lastName"]') as HTMLInputElement;
      const emailInput = container.querySelector('[name="email"]') as HTMLInputElement;

      firstNameInput.value = userData.firstName;
      lastNameInput.value = userData.lastName;
      emailInput.value = userData.email;

      // When
      const form = container.querySelector('form') as HTMLFormElement;
      const submitEvent = new Event('submit');

      const resultPromise = new Promise((resolve) => {
        userForm.on('form:success', resolve);
      });

      form.dispatchEvent(submitEvent);
      const result = await resultPromise;

      // Then
      expect(mockUserService.createUser).toHaveBeenCalledWith(userData);
      expect(result).toEqual({ user: createdUser });
    });

    it('should display service validation errors', async () => {
      // Given
      const validationError = new Error('Email already exists');
      validationError.name = 'ValidationError';
      (validationError as any).details = {
        email: ['Cette adresse email est déjà utilisée'],
      };

      mockUserService.createUser.mockRejectedValueOnce(validationError);

      // Fill form
      const emailInput = container.querySelector('[name="email"]') as HTMLInputElement;
      emailInput.value = 'existing@example.com';

      // When
      const form = container.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit'));

      // Wait for async error handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Then
      const errorElement = container.querySelector('.field-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('Cette adresse email est déjà utilisée');
    });
  });

  describe('Real-time validation with service', () => {
    it('should validate email availability on blur', async () => {
      // Given
      mockUserService.validateEmail.mockResolvedValueOnce({ available: false });

      const emailInput = container.querySelector('[name="email"]') as HTMLInputElement;
      emailInput.value = 'taken@example.com';

      // When
      emailInput.dispatchEvent(new Event('blur'));

      // Wait for async validation
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Then
      expect(mockUserService.validateEmail).toHaveBeenCalledWith('taken@example.com');

      const errorElement = container.querySelector('.field-error');
      expect(errorElement?.textContent).toContain("Cette adresse email n'est pas disponible");
    });

    it('should show email as available when service confirms', async () => {
      // Given
      mockUserService.validateEmail.mockResolvedValueOnce({ available: true });

      const emailInput = container.querySelector('[name="email"]') as HTMLInputElement;
      emailInput.value = 'available@example.com';

      // When
      emailInput.dispatchEvent(new Event('blur'));

      // Wait for async validation
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Then
      expect(mockUserService.validateEmail).toHaveBeenCalledWith('available@example.com');

      const successElement = container.querySelector('.field-success');
      expect(successElement?.textContent).toContain('Cette adresse email est disponible');
    });
  });

  describe('Loading states during service calls', () => {
    it('should show loading state during form submission', async () => {
      // Given
      let resolveCreateUser: (value: any) => void;
      const createUserPromise = new Promise((resolve) => {
        resolveCreateUser = resolve;
      });
      mockUserService.createUser.mockReturnValueOnce(createUserPromise);

      // When
      const form = container.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit'));

      // Then - Should show loading
      await new Promise((resolve) => setTimeout(resolve, 10));

      const submitButton = container.querySelector('[type="submit"]') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);
      expect(submitButton.textContent).toContain('Chargement');

      // When - Resolve the promise
      resolveCreateUser!({ id: 1, email: 'test@example.com' });
      await createUserPromise;

      // Then - Should remove loading
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(submitButton.disabled).toBe(false);
      expect(submitButton.textContent).toBe('Sauvegarder');
    });
  });
});
```

Ces tests d'intégration garantissent que les différents composants de l'application fonctionnent correctement ensemble, couvrant les interactions API, la persistance des données et les workflows complets.
