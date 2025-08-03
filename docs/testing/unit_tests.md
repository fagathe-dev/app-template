# Tests Unitaires

## Vue d'ensemble

Ce document présente les pratiques et exemples de tests unitaires pour l'application, couvrant les tests PHP avec PHPUnit et les tests TypeScript avec Jest.

## Tests Unitaires Backend (PHPUnit)

### Tests des Services

#### Test de UserService

```php
<?php

namespace App\Tests\Unit\Service;

use App\Entity\User;
use App\Service\UserService;
use App\Repository\UserRepository;
use App\Service\EmailService;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Validator\ConstraintViolationList;

class UserServiceTest extends TestCase
{
    private UserService $userService;
    private UserRepository|MockObject $userRepository;
    private EmailService|MockObject $emailService;
    private UserPasswordHasherInterface|MockObject $passwordHasher;
    private ValidatorInterface|MockObject $validator;

    protected function setUp(): void
    {
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->emailService = $this->createMock(EmailService::class);
        $this->passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $this->validator = $this->createMock(ValidatorInterface::class);

        $this->userService = new UserService(
            $this->userRepository,
            $this->emailService,
            $this->passwordHasher,
            $this->validator
        );
    }

    /**
     * @test
     * @group user
     * @group service
     */
    public function it_should_create_user_with_valid_data(): void
    {
        // Given
        $userData = [
            'email' => 'test@example.com',
            'firstName' => 'John',
            'lastName' => 'Doe',
            'password' => 'password123'
        ];

        $this->validator
            ->expects($this->once())
            ->method('validate')
            ->willReturn(new ConstraintViolationList());

        $this->userRepository
            ->expects($this->once())
            ->method('findOneBy')
            ->with(['email' => 'test@example.com'])
            ->willReturn(null);

        $this->passwordHasher
            ->expects($this->once())
            ->method('hashPassword')
            ->willReturn('hashed_password');

        $this->userRepository
            ->expects($this->once())
            ->method('save')
            ->with($this->isInstanceOf(User::class));

        $this->emailService
            ->expects($this->once())
            ->method('sendVerificationEmail')
            ->with($this->isInstanceOf(User::class));

        // When
        $user = $this->userService->createUser($userData);

        // Then
        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('test@example.com', $user->getEmail());
        $this->assertEquals('John', $user->getFirstName());
        $this->assertEquals('Doe', $user->getLastName());
        $this->assertFalse($user->isEmailVerified());
        $this->assertNotNull($user->getEmailVerificationToken());
    }

    /**
     * @test
     * @group user
     * @group service
     */
    public function it_should_verify_user_email_with_valid_token(): void
    {
        // Given
        $token = 'valid_token_123';
        $user = new User();
        $user->setEmail('test@example.com');
        $user->setEmailVerificationToken($token);
        $user->setEmailVerified(false);

        $this->userRepository
            ->expects($this->once())
            ->method('findOneBy')
            ->with(['emailVerificationToken' => $token])
            ->willReturn($user);

        $this->userRepository
            ->expects($this->once())
            ->method('save')
            ->with($user);

        // When
        $result = $this->userService->verifyEmail($token);

        // Then
        $this->assertTrue($result);
        $this->assertTrue($user->isEmailVerified());
        $this->assertNull($user->getEmailVerificationToken());
    }

    /**
     * @test
     * @group user
     * @group service
     */
    public function it_should_throw_exception_when_email_already_exists(): void
    {
        // Given
        $userData = ['email' => 'existing@example.com'];

        $existingUser = new User();
        $existingUser->setEmail('existing@example.com');

        $this->validator
            ->expects($this->once())
            ->method('validate')
            ->willReturn(new ConstraintViolationList());

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
     * @dataProvider invalidUserDataProvider
     * @group user
     * @group service
     * @group validation
     */
    public function it_should_throw_exception_with_invalid_data(array $userData, string $expectedMessage): void
    {
        // Given
        $violations = new ConstraintViolationList();
        $violation = $this->createMock(\Symfony\Component\Validator\ConstraintViolation::class);
        $violation->method('getMessage')->willReturn($expectedMessage);
        $violations->add($violation);

        $this->validator
            ->expects($this->once())
            ->method('validate')
            ->willReturn($violations);

        // Then
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage($expectedMessage);

        // When
        $this->userService->createUser($userData);
    }

    public function invalidUserDataProvider(): array
    {
        return [
            'empty email' => [
                ['email' => '', 'firstName' => 'John'],
                'L\'email ne peut pas être vide'
            ],
            'invalid email format' => [
                ['email' => 'not-an-email', 'firstName' => 'John'],
                'L\'email n\'est pas valide'
            ],
            'empty first name' => [
                ['email' => 'test@example.com', 'firstName' => ''],
                'Le prénom ne peut pas être vide'
            ],
            'short password' => [
                ['email' => 'test@example.com', 'password' => '123'],
                'Le mot de passe doit contenir au moins 8 caractères'
            ]
        ];
    }

    /**
     * @test
     * @group user
     * @group service
     */
    public function it_should_update_user_password(): void
    {
        // Given
        $user = new User();
        $user->setEmail('test@example.com');
        $user->setPassword('old_hashed_password');

        $newPassword = 'new_password123';
        $hashedPassword = 'new_hashed_password';

        $this->passwordHasher
            ->expects($this->once())
            ->method('hashPassword')
            ->with($user, $newPassword)
            ->willReturn($hashedPassword);

        $this->userRepository
            ->expects($this->once())
            ->method('save')
            ->with($user);

        // When
        $this->userService->updatePassword($user, $newPassword);

        // Then
        $this->assertEquals($hashedPassword, $user->getPassword());
    }

    /**
     * @test
     * @group user
     * @group service
     */
    public function it_should_generate_password_reset_token(): void
    {
        // Given
        $email = 'test@example.com';
        $user = new User();
        $user->setEmail($email);

        $this->userRepository
            ->expects($this->once())
            ->method('findOneBy')
            ->with(['email' => $email])
            ->willReturn($user);

        $this->userRepository
            ->expects($this->once())
            ->method('save')
            ->with($user);

        $this->emailService
            ->expects($this->once())
            ->method('sendPasswordResetEmail')
            ->with($user);

        // When
        $result = $this->userService->generatePasswordResetToken($email);

        // Then
        $this->assertTrue($result);
        $this->assertNotNull($user->getPasswordResetToken());
        $this->assertNotNull($user->getPasswordResetExpiresAt());
        $this->assertGreaterThan(new \DateTime(), $user->getPasswordResetExpiresAt());
    }
}
```

#### Test de SEOService

```php
<?php

namespace App\Tests\Unit\Service;

use App\Entity\Seo;
use App\Service\SEOService;
use App\Repository\SeoRepository;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

class SEOServiceTest extends TestCase
{
    private SEOService $seoService;
    private SeoRepository|MockObject $seoRepository;

    protected function setUp(): void
    {
        $this->seoRepository = $this->createMock(SeoRepository::class);
        $this->seoService = new SEOService($this->seoRepository);
    }

    /**
     * @test
     * @group seo
     * @group service
     */
    public function it_should_generate_meta_tags_for_page(): void
    {
        // Given
        $page = 'home';
        $seo = new Seo();
        $seo->setPage($page);
        $seo->setTitle('Accueil - Mon Site');
        $seo->setDescription('Description de la page d\'accueil');
        $seo->setKeywords('accueil, site, web');

        $this->seoRepository
            ->expects($this->once())
            ->method('findOneBy')
            ->with(['page' => $page])
            ->willReturn($seo);

        // When
        $metaTags = $this->seoService->getMetaTags($page);

        // Then
        $this->assertIsArray($metaTags);
        $this->assertEquals('Accueil - Mon Site', $metaTags['title']);
        $this->assertEquals('Description de la page d\'accueil', $metaTags['description']);
        $this->assertEquals('accueil, site, web', $metaTags['keywords']);
    }

    /**
     * @test
     * @group seo
     * @group service
     */
    public function it_should_return_default_meta_tags_when_page_not_found(): void
    {
        // Given
        $page = 'unknown-page';

        $this->seoRepository
            ->expects($this->once())
            ->method('findOneBy')
            ->with(['page' => $page])
            ->willReturn(null);

        // When
        $metaTags = $this->seoService->getMetaTags($page);

        // Then
        $this->assertIsArray($metaTags);
        $this->assertEquals('Mon Site', $metaTags['title']);
        $this->assertEquals('Description par défaut du site', $metaTags['description']);
        $this->assertArrayHasKey('keywords', $metaTags);
    }

    /**
     * @test
     * @group seo
     * @group service
     */
    public function it_should_generate_sitemap_data(): void
    {
        // Given
        $seoEntries = [
            (new Seo())->setPage('home')->setTitle('Accueil')->setPriority(1.0),
            (new Seo())->setPage('about')->setTitle('À propos')->setPriority(0.8),
            (new Seo())->setPage('contact')->setTitle('Contact')->setPriority(0.6)
        ];

        $this->seoRepository
            ->expects($this->once())
            ->method('findBy')
            ->with(['active' => true], ['priority' => 'DESC'])
            ->willReturn($seoEntries);

        // When
        $sitemapData = $this->seoService->generateSitemap();

        // Then
        $this->assertIsArray($sitemapData);
        $this->assertCount(3, $sitemapData);

        $this->assertEquals('home', $sitemapData[0]['page']);
        $this->assertEquals(1.0, $sitemapData[0]['priority']);

        $this->assertEquals('about', $sitemapData[1]['page']);
        $this->assertEquals(0.8, $sitemapData[1]['priority']);
    }
}
```

### Tests des Entités

#### Test de l'entité User

```php
<?php

namespace App\Tests\Unit\Entity;

use App\Entity\User;
use PHPUnit\Framework\TestCase;

class UserTest extends TestCase
{
    private User $user;

    protected function setUp(): void
    {
        $this->user = new User();
    }

    /**
     * @test
     * @group user
     * @group entity
     */
    public function it_should_set_and_get_email(): void
    {
        // Given
        $email = 'test@example.com';

        // When
        $this->user->setEmail($email);

        // Then
        $this->assertEquals($email, $this->user->getEmail());
        $this->assertEquals($email, $this->user->getUserIdentifier());
    }

    /**
     * @test
     * @group user
     * @group entity
     */
    public function it_should_set_and_get_names(): void
    {
        // Given
        $firstName = 'John';
        $lastName = 'Doe';

        // When
        $this->user->setFirstName($firstName);
        $this->user->setLastName($lastName);

        // Then
        $this->assertEquals($firstName, $this->user->getFirstName());
        $this->assertEquals($lastName, $this->user->getLastName());
        $this->assertEquals('John Doe', $this->user->getFullName());
    }

    /**
     * @test
     * @group user
     * @group entity
     */
    public function it_should_manage_roles(): void
    {
        // Given
        $roles = ['ROLE_ADMIN', 'ROLE_USER'];

        // When
        $this->user->setRoles($roles);

        // Then
        $userRoles = $this->user->getRoles();
        $this->assertContains('ROLE_USER', $userRoles); // Toujours présent
        $this->assertContains('ROLE_ADMIN', $userRoles);
    }

    /**
     * @test
     * @group user
     * @group entity
     */
    public function it_should_always_have_user_role(): void
    {
        // Given & When
        $this->user->setRoles([]);

        // Then
        $this->assertContains('ROLE_USER', $this->user->getRoles());
    }

    /**
     * @test
     * @group user
     * @group entity
     */
    public function it_should_handle_email_verification(): void
    {
        // Given
        $token = 'verification_token_123';

        // When
        $this->user->setEmailVerificationToken($token);
        $this->user->setEmailVerified(false);

        // Then
        $this->assertEquals($token, $this->user->getEmailVerificationToken());
        $this->assertFalse($this->user->isEmailVerified());

        // When verified
        $this->user->setEmailVerified(true);
        $this->user->setEmailVerificationToken(null);

        // Then
        $this->assertTrue($this->user->isEmailVerified());
        $this->assertNull($this->user->getEmailVerificationToken());
    }

    /**
     * @test
     * @group user
     * @group entity
     */
    public function it_should_handle_password_reset(): void
    {
        // Given
        $token = 'reset_token_123';
        $expiresAt = new \DateTime('+1 hour');

        // When
        $this->user->setPasswordResetToken($token);
        $this->user->setPasswordResetExpiresAt($expiresAt);

        // Then
        $this->assertEquals($token, $this->user->getPasswordResetToken());
        $this->assertEquals($expiresAt, $this->user->getPasswordResetExpiresAt());
    }

    /**
     * @test
     * @group user
     * @group entity
     */
    public function it_should_check_if_password_reset_is_expired(): void
    {
        // Given - Token expiré
        $expiredDate = new \DateTime('-1 hour');
        $this->user->setPasswordResetExpiresAt($expiredDate);

        // Then
        $this->assertTrue($this->user->isPasswordResetExpired());

        // Given - Token valide
        $validDate = new \DateTime('+1 hour');
        $this->user->setPasswordResetExpiresAt($validDate);

        // Then
        $this->assertFalse($this->user->isPasswordResetExpired());
    }

    /**
     * @test
     * @group user
     * @group entity
     */
    public function it_should_handle_last_login_tracking(): void
    {
        // Given
        $lastLogin = new \DateTime();

        // When
        $this->user->updateLastLogin();

        // Then
        $this->assertInstanceOf(\DateTime::class, $this->user->getLastLogin());
        $this->assertEqualsWithDelta(
            $lastLogin->getTimestamp(),
            $this->user->getLastLogin()->getTimestamp(),
            2 // 2 secondes de tolérance
        );
    }
}
```

## Tests Unitaires Frontend (Jest)

### Tests des Services

#### Test de ApiClient

```typescript
// tests/frontend/services/ApiClient.test.ts
import { ApiClient } from '@/services/ApiClient';

// Mock fetch
global.fetch = jest.fn();

describe('ApiClient', () => {
  let apiClient: ApiClient;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    apiClient = new ApiClient('https://api.example.com');
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET requests', () => {
    it('should make GET request with correct URL and headers', async () => {
      // Given
      const responseData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
      } as Response);

      // When
      const result = await apiClient.get('/users/1');

      // Then
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
        })
      );
      expect(result).toEqual(responseData);
    });

    it('should include query parameters in URL', async () => {
      // Given
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      const params = { page: 1, limit: 10, search: 'test' };

      // When
      await apiClient.get('/users', { params });

      // Then
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users?page=1&limit=10&search=test',
        expect.any(Object)
      );
    });
  });

  describe('POST requests', () => {
    it('should make POST request with JSON body', async () => {
      // Given
      const requestData = { name: 'John', email: 'john@example.com' };
      const responseData = { id: 1, ...requestData };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => responseData,
      } as Response);

      // When
      const result = await apiClient.post('/users', requestData);

      // Then
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('Authentication', () => {
    it('should include auth token in headers when set', async () => {
      // Given
      const token = 'bearer-token-123';
      apiClient.setAuthToken(token);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      // When
      await apiClient.get('/protected');

      // Then
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );
    });

    it('should remove auth token from headers when cleared', async () => {
      // Given
      apiClient.setAuthToken('token');
      apiClient.removeAuthToken();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      // When
      await apiClient.get('/public');

      // Then
      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers['Authorization']).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should throw error for 4xx status codes', async () => {
      // Given
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Validation error' }),
      } as Response);

      // When & Then
      await expect(apiClient.get('/invalid')).rejects.toThrow('Bad Request');
    });

    it('should throw error for 5xx status codes', async () => {
      // Given
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      } as Response);

      // When & Then
      await expect(apiClient.get('/error')).rejects.toThrow('Internal Server Error');
    });

    it('should handle network errors', async () => {
      // Given
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // When & Then
      await expect(apiClient.get('/unreachable')).rejects.toThrow('Network error');
    });
  });

  describe('Request interceptors', () => {
    it('should apply request interceptor', async () => {
      // Given
      const interceptor = jest.fn((config) => ({
        ...config,
        headers: { ...config.headers, 'X-Custom': 'value' },
      }));

      apiClient.addRequestInterceptor(interceptor);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      // When
      await apiClient.get('/test');

      // Then
      expect(interceptor).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom': 'value',
          }),
        })
      );
    });
  });

  describe('Response interceptors', () => {
    it('should apply response interceptor', async () => {
      // Given
      const responseData = { id: 1, name: 'Test' };
      const interceptor = jest.fn((data) => ({ ...data, intercepted: true }));

      apiClient.addResponseInterceptor(interceptor);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response);

      // When
      const result = await apiClient.get('/test');

      // Then
      expect(interceptor).toHaveBeenCalledWith(responseData);
      expect(result).toEqual({ ...responseData, intercepted: true });
    });
  });
});
```

#### Test de StateManager

```typescript
// tests/frontend/services/StateManager.test.ts
import { StateManager } from '@/services/StateManager';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  describe('Basic state operations', () => {
    it('should set and get state values', () => {
      // Given
      const key = 'test_key';
      const value = 'test_value';

      // When
      stateManager.set(key, value);
      const result = stateManager.get(key);

      // Then
      expect(result).toBe(value);
    });

    it('should return default value when key not found', () => {
      // Given
      const key = 'non_existent_key';
      const defaultValue = 'default';

      // When
      const result = stateManager.get(key, defaultValue);

      // Then
      expect(result).toBe(defaultValue);
    });

    it('should update existing state value', () => {
      // Given
      const key = 'counter';
      stateManager.set(key, 0);

      // When
      stateManager.update(key, (current: number) => current + 1);
      const result = stateManager.get(key);

      // Then
      expect(result).toBe(1);
    });

    it('should remove state value', () => {
      // Given
      const key = 'to_remove';
      stateManager.set(key, 'value');

      // When
      stateManager.remove(key);
      const result = stateManager.get(key, 'default');

      // Then
      expect(result).toBe('default');
    });
  });

  describe('State watching', () => {
    it('should notify watchers when state changes', () => {
      // Given
      const key = 'watched_key';
      const callback = jest.fn();

      stateManager.watch(key, callback);

      // When
      stateManager.set(key, 'new_value');

      // Then
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          key,
          newValue: 'new_value',
          oldValue: undefined,
        })
      );
    });

    it('should return unwatch function', () => {
      // Given
      const key = 'watched_key';
      const callback = jest.fn();

      const unwatch = stateManager.watch(key, callback);

      // When
      unwatch();
      stateManager.set(key, 'value');

      // Then
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not trigger watcher if value has not changed', () => {
      // Given
      const key = 'unchanged_key';
      const value = 'same_value';
      const callback = jest.fn();

      stateManager.set(key, value);
      stateManager.watch(key, callback);

      // When
      stateManager.set(key, value); // Same value

      // Then
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Middleware', () => {
    it('should execute middleware on state changes', () => {
      // Given
      const middleware = jest.fn();
      stateManager.addMiddleware(middleware);

      const key = 'middleware_test';
      const value = 'test_value';

      // When
      stateManager.set(key, value);

      // Then
      expect(middleware).toHaveBeenCalledWith(
        expect.objectContaining({
          key,
          newValue: value,
          oldValue: undefined,
        })
      );
    });

    it('should handle middleware errors gracefully', () => {
      // Given
      const faultyMiddleware = jest.fn(() => {
        throw new Error('Middleware error');
      });
      const normalMiddleware = jest.fn();

      stateManager.addMiddleware(faultyMiddleware);
      stateManager.addMiddleware(normalMiddleware);

      // When & Then
      expect(() => {
        stateManager.set('test_key', 'test_value');
      }).not.toThrow();

      expect(faultyMiddleware).toHaveBeenCalled();
      expect(normalMiddleware).toHaveBeenCalled();
    });
  });

  describe('Persistence', () => {
    it('should persist state to localStorage by default', () => {
      // Given
      const key = 'persist_key';
      const value = 'persist_value';

      // When
      stateManager.set(key, value);

      // Then
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'app_state',
        expect.stringContaining('"persist_key":"persist_value"')
      );
    });

    it('should not persist when persist option is false', () => {
      // Given
      const key = 'no_persist_key';
      const value = 'no_persist_value';

      // When
      stateManager.set(key, value, false);

      // Then
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should restore state from localStorage on initialization', () => {
      // Given
      const storedState = { existing_key: 'existing_value' };
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(storedState));

      // When
      const newStateManager = new StateManager();
      const result = newStateManager.get('existing_key');

      // Then
      expect(result).toBe('existing_value');
    });
  });

  describe('State snapshot', () => {
    it('should return complete state snapshot', () => {
      // Given
      stateManager.set('key1', 'value1');
      stateManager.set('key2', 'value2');

      // When
      const snapshot = stateManager.getSnapshot();

      // Then
      expect(snapshot).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should restore state from snapshot', () => {
      // Given
      const snapshot = {
        restored_key1: 'restored_value1',
        restored_key2: 'restored_value2',
      };

      // When
      stateManager.restore(snapshot);

      // Then
      expect(stateManager.get('restored_key1')).toBe('restored_value1');
      expect(stateManager.get('restored_key2')).toBe('restored_value2');
    });
  });

  describe('Clear state', () => {
    it('should clear all state data', () => {
      // Given
      stateManager.set('key1', 'value1');
      stateManager.set('key2', 'value2');

      // When
      stateManager.clear();

      // Then
      expect(stateManager.get('key1', 'default')).toBe('default');
      expect(stateManager.get('key2', 'default')).toBe('default');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('app_state');
    });
  });
});
```

### Tests des Composants

#### Test de Button Component

```typescript
// tests/frontend/components/Button.test.ts
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  let container: HTMLElement;
  let buttonElement: HTMLButtonElement;
  let button: Button;

  beforeEach(() => {
    container = document.createElement('div');
    buttonElement = document.createElement('button');
    buttonElement.textContent = 'Test Button';
    container.appendChild(buttonElement);
    document.body.appendChild(container);

    button = new Button(buttonElement);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      expect(buttonElement.classList.contains('btn')).toBe(true);
      expect(buttonElement.classList.contains('btn-primary')).toBe(true);
    });

    it('should apply custom variant', () => {
      // Given
      const customButton = new Button(buttonElement, { variant: 'success' });

      // Then
      expect(buttonElement.classList.contains('btn-success')).toBe(true);
      expect(buttonElement.classList.contains('btn-primary')).toBe(false);
    });

    it('should apply custom size', () => {
      // Given
      const customButton = new Button(buttonElement, { size: 'lg' });

      // Then
      expect(buttonElement.classList.contains('btn-lg')).toBe(true);
    });
  });

  describe('State management', () => {
    it('should set loading state', () => {
      // When
      button.setLoading(true);

      // Then
      expect(buttonElement.classList.contains('loading')).toBe(true);
      expect(buttonElement.hasAttribute('disabled')).toBe(true);
      expect(buttonElement.querySelector('.btn-spinner')).toBeTruthy();
    });

    it('should clear loading state', () => {
      // Given
      button.setLoading(true);

      // When
      button.setLoading(false);

      // Then
      expect(buttonElement.classList.contains('loading')).toBe(false);
      expect(buttonElement.hasAttribute('disabled')).toBe(false);
      expect(buttonElement.querySelector('.btn-spinner')).toBeNull();
    });

    it('should set disabled state', () => {
      // When
      button.setDisabled(true);

      // Then
      expect(buttonElement.hasAttribute('disabled')).toBe(true);
      expect(buttonElement.classList.contains('disabled')).toBe(true);
    });
  });

  describe('Event handling', () => {
    it('should emit click event when not disabled', () => {
      // Given
      const clickHandler = jest.fn();
      button.on('button:click', clickHandler);

      // When
      buttonElement.click();

      // Then
      expect(clickHandler).toHaveBeenCalled();
    });

    it('should not emit click event when disabled', () => {
      // Given
      const clickHandler = jest.fn();
      button.on('button:click', clickHandler);
      button.setDisabled(true);

      // When
      buttonElement.click();

      // Then
      expect(clickHandler).not.toHaveBeenCalled();
    });

    it('should not emit click event when loading', () => {
      // Given
      const clickHandler = jest.fn();
      button.on('button:click', clickHandler);
      button.setLoading(true);

      // When
      buttonElement.click();

      // Then
      expect(clickHandler).not.toHaveBeenCalled();
    });
  });

  describe('Content management', () => {
    it('should update button text', () => {
      // When
      button.setText('New Text');

      // Then
      expect(buttonElement.textContent).toBe('New Text');
    });

    it('should not update text when loading', () => {
      // Given
      const originalText = buttonElement.textContent;
      button.setLoading(true);

      // When
      button.setText('New Text');

      // Then
      expect(buttonElement.textContent).not.toBe('New Text');
    });

    it('should add icon with correct position', () => {
      // When
      button.setIcon('fas fa-save', 'left');

      // Then
      const icon = buttonElement.querySelector('.btn-icon');
      expect(icon).toBeTruthy();
      expect(icon?.classList.contains('fas')).toBe(true);
      expect(icon?.classList.contains('fa-save')).toBe(true);
      expect(icon?.classList.contains('me-2')).toBe(true);
    });
  });

  describe('Variant changes', () => {
    it('should change variant and update classes', () => {
      // When
      button.setVariant('danger');

      // Then
      expect(buttonElement.classList.contains('btn-danger')).toBe(true);
      expect(buttonElement.classList.contains('btn-primary')).toBe(false);
    });

    it('should change size and update classes', () => {
      // When
      button.setSize('sm');

      // Then
      expect(buttonElement.classList.contains('btn-sm')).toBe(true);
    });
  });

  describe('Ripple effect', () => {
    it('should create ripple effect on click when enabled', (done) => {
      // Given
      const rippleButton = new Button(buttonElement, { ripple: true });

      // When
      const clickEvent = new MouseEvent('click', {
        clientX: 50,
        clientY: 50,
      });
      buttonElement.dispatchEvent(clickEvent);

      // Then
      setTimeout(() => {
        const ripple = buttonElement.querySelector('.btn-ripple');
        expect(ripple).toBeTruthy();
        done();
      }, 10);
    });

    it('should not create ripple when disabled', () => {
      // Given
      const rippleButton = new Button(buttonElement, { ripple: false });

      // When
      buttonElement.click();

      // Then
      const ripple = buttonElement.querySelector('.btn-ripple');
      expect(ripple).toBeNull();
    });
  });
});
```

Ces tests unitaires couvrent les aspects essentiels des services et composants, garantissant un code de qualité et une maintenance facilitée.
