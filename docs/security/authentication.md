# Implémentation de l'Authentification

## Vue d'ensemble

Ce document détaille l'implémentation complète du système d'authentification de l'application, basé sur Symfony Security avec JWT, gestion des sessions, vérification email et sécurité avancée.

## Configuration Symfony Security

### Configuration principale

```yaml
# config/packages/security.yaml
security:
  # Configuration des hashers de mots de passe
  password_hashers:
    App\Entity\User:
      algorithm: auto
      cost: 15
      time_cost: 4
      memory_cost: 65536

  # Providers d'utilisateurs
  providers:
    app_user_provider:
      entity:
        class: App\Entity\User
        property: email

    jwt_user_provider:
      lexik_jwt_authentication:
        class: App\Entity\User

  # Configuration des firewalls
  firewalls:
    dev:
      pattern: ^/(_(profiler|wdt)|css|images|js)/
      security: false

    api_login:
      pattern: ^/api/login
      stateless: true
      json_login:
        check_path: /api/login
        success_handler: lexik_jwt_authentication.handler.authentication_success
        failure_handler: lexik_jwt_authentication.handler.authentication_failure

    api:
      pattern: ^/api/
      stateless: true
      jwt: ~
      provider: jwt_user_provider

    main:
      lazy: true
      provider: app_user_provider
      form_login:
        login_path: auth_login
        check_path: auth_login
        default_target_path: app_home
        failure_path: auth_login
        enable_csrf: true
        csrf_parameter: _token
        csrf_token_id: authenticate
      logout:
        path: auth_logout
        target: auth_login
        invalidate_session: true
        delete_cookies:
          PHPSESSID: { path: /, domain: ~ }
      remember_me:
        secret: '%kernel.secret%'
        lifetime: 604800 # 1 semaine
        path: /
        always_remember_me: false
        remember_me_parameter: _remember_me

  # Contrôle d'accès
  access_control:
    - { path: ^/api/login, roles: PUBLIC_ACCESS }
    - { path: ^/api/register, roles: PUBLIC_ACCESS }
    - { path: ^/api/password-reset, roles: PUBLIC_ACCESS }
    - { path: ^/api/, roles: ROLE_USER }
    - { path: ^/auth/login, roles: PUBLIC_ACCESS }
    - { path: ^/auth/register, roles: PUBLIC_ACCESS }
    - { path: ^/auth/password-reset, roles: PUBLIC_ACCESS }
    - { path: ^/auth/verification, roles: PUBLIC_ACCESS }
    - { path: ^/admin/, roles: ROLE_ADMIN }
    - { path: ^/, roles: ROLE_USER }

  # Hiérarchie des rôles
  role_hierarchy:
    ROLE_MODERATOR: ROLE_USER
    ROLE_ADMIN: [ROLE_USER, ROLE_MODERATOR]
    ROLE_SUPER_ADMIN: [ROLE_ADMIN, ROLE_ALLOWED_TO_SWITCH]
```

### Configuration JWT

```yaml
# config/packages/lexik_jwt_authentication.yaml
lexik_jwt_authentication:
  secret_key: '%env(resolve:JWT_SECRET_KEY)%'
  public_key: '%env(resolve:JWT_PUBLIC_KEY)%'
  pass_phrase: '%env(JWT_PASSPHRASE)%'
  token_ttl: 3600 # 1 heure
  refresh_token_ttl: 604800 # 1 semaine
  clock_skew: 60

  # Configuration des tokens
  token_extractors:
    authorization_header:
      enabled: true
      prefix: Bearer
      name: Authorization
    query_parameter:
      enabled: false
    cookie:
      enabled: false

  # Événements personnalisés
  set_cookies:
    refresh_token:
      lifetime: 604800
      samesite: lax
      path: /
      domain: ~
      secure: true
      httponly: true
```

## Service d'Authentification Principal

### AuthenticationService

```php
<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Psr\Log\LoggerInterface;

final class AuthenticationService
{
    use ResponseTrait;

    private const LOG_FILE = 'security/authentication';
    private const MAX_LOGIN_ATTEMPTS = 5;
    private const LOCKOUT_DURATION = 3600; // 1 heure

    public function __construct(
        private UserRepository $userRepository,
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private MailerService $mailerService,
        private TokenService $tokenService,
        private LoggerInterface $logger
    ) {}

    /**
     * Authentifier un utilisateur avec email/mot de passe
     */
    public function authenticate(string $email, string $password, string $ipAddress = null): array
    {
        try {
            $user = $this->userRepository->findOneBy(['email' => $email]);

            if (!$user) {
                $this->logFailedAttempt($email, $ipAddress, 'User not found');
                throw new UserNotFoundException('Identifiants invalides');
            }

            // Vérifier si le compte est verrouillé
            if ($this->isAccountLocked($user)) {
                $this->logFailedAttempt($email, $ipAddress, 'Account locked');
                throw new AuthenticationException(
                    'Compte verrouillé. Réessayez plus tard ou contactez l\'administration.'
                );
            }

            // Vérifier le mot de passe
            if (!$this->passwordHasher->isPasswordValid($user, $password)) {
                $this->incrementFailedAttempts($user);
                $this->logFailedAttempt($email, $ipAddress, 'Invalid password');
                throw new AuthenticationException('Identifiants invalides');
            }

            // Vérifier si l'email est vérifié
            if (!$user->isVerified()) {
                throw new AuthenticationException(
                    'Compte non vérifié. Veuillez vérifier votre email avant de vous connecter.'
                );
            }

            // Vérifier si le compte est actif
            if (!$user->isActive()) {
                throw new AuthenticationException(
                    'Compte désactivé. Contactez l\'administration.'
                );
            }

            // Authentification réussie
            $this->resetFailedAttempts($user);
            $this->updateLastLogin($user, $ipAddress);

            $this->logInfo('Successful authentication', [
                'user_id' => $user->getId(),
                'email' => $email,
                'ip_address' => $ipAddress
            ]);

            return [
                'success' => true,
                'user' => $user,
                'message' => 'Authentification réussie'
            ];

        } catch (AuthenticationException $e) {
            throw $e;
        } catch (\Exception $e) {
            $this->logError('Authentication error', $e, [
                'email' => $email,
                'ip_address' => $ipAddress
            ]);

            throw new AuthenticationException('Erreur d\'authentification');
        }
    }

    /**
     * Créer un nouveau compte utilisateur
     */
    public function register(array $userData): array
    {
        try {
            // Vérifier si l'email existe déjà
            if ($this->userRepository->findOneBy(['email' => $userData['email']])) {
                throw new \InvalidArgumentException('Cette adresse email est déjà utilisée');
            }

            // Vérifier si le nom d'utilisateur existe déjà
            if ($this->userRepository->findOneBy(['username' => $userData['username']])) {
                throw new \InvalidArgumentException('Ce nom d\'utilisateur est déjà pris');
            }

            // Créer l'utilisateur
            $user = new User();
            $user->setEmail($userData['email'])
                 ->setUsername($userData['username'])
                 ->setFirstname($userData['firstname'] ?? null)
                 ->setLastname($userData['lastname'] ?? null)
                 ->setPhone($userData['phone'] ?? null)
                 ->setBirthdate(isset($userData['birthdate']) ? new \DateTime($userData['birthdate']) : null)
                 ->setGender($userData['gender'] ?? null)
                 ->setRoles(['ROLE_USER'])
                 ->setIsActive(true)
                 ->setIsVerified(false);

            // Hasher le mot de passe
            $hashedPassword = $this->passwordHasher->hashPassword($user, $userData['password']);
            $user->setPassword($hashedPassword);

            // Générer le token de vérification
            $verificationToken = $this->tokenService->generateVerificationToken();
            $user->setVerificationToken($verificationToken);

            // Sauvegarder
            $this->entityManager->persist($user);
            $this->entityManager->flush();

            // Envoyer l'email de vérification
            $emailSent = $this->mailerService->sendVerificationEmail($user, $verificationToken);

            $this->logInfo('User registration successful', [
                'user_id' => $user->getId(),
                'email' => $user->getEmail(),
                'verification_email_sent' => $emailSent
            ]);

            return [
                'success' => true,
                'user' => $user,
                'verification_email_sent' => $emailSent,
                'message' => 'Compte créé avec succès. Veuillez vérifier votre email.'
            ];

        } catch (\Exception $e) {
            $this->logError('Registration error', $e, ['email' => $userData['email'] ?? 'unknown']);
            throw $e;
        }
    }

    /**
     * Vérifier un email avec le token
     */
    public function verifyEmail(string $token): bool
    {
        try {
            $user = $this->userRepository->findOneBy(['verificationToken' => $token]);

            if (!$user) {
                return false;
            }

            $user->setIsVerified(true)
                 ->setVerificationToken(null);

            $this->entityManager->flush();

            $this->logInfo('Email verification successful', ['user_id' => $user->getId()]);

            return true;

        } catch (\Exception $e) {
            $this->logError('Email verification error', $e, ['token' => $token]);
            return false;
        }
    }

    /**
     * Initier une réinitialisation de mot de passe
     */
    public function initiatePasswordReset(string $email): bool
    {
        try {
            $user = $this->userRepository->findOneBy(['email' => $email]);

            if (!$user) {
                // Ne pas révéler si l'email existe ou non
                return true;
            }

            // Générer le token de réinitialisation
            $resetToken = $this->tokenService->generatePasswordResetToken();
            $expiresAt = new \DateTimeImmutable('+2 hours');

            $user->setPasswordResetToken($resetToken)
                 ->setPasswordResetExpiresAt($expiresAt);

            $this->entityManager->flush();

            // Envoyer l'email de réinitialisation
            $emailSent = $this->mailerService->sendPasswordResetEmail($user, $resetToken);

            $this->logInfo('Password reset initiated', [
                'user_id' => $user->getId(),
                'email' => $email,
                'email_sent' => $emailSent
            ]);

            return $emailSent;

        } catch (\Exception $e) {
            $this->logError('Password reset initiation error', $e, ['email' => $email]);
            return false;
        }
    }

    /**
     * Réinitialiser le mot de passe avec le token
     */
    public function resetPassword(string $token, string $newPassword): bool
    {
        try {
            $user = $this->userRepository->findOneBy(['passwordResetToken' => $token]);

            if (!$user) {
                return false;
            }

            // Vérifier l'expiration du token
            if ($user->getPasswordResetExpiresAt() < new \DateTimeImmutable()) {
                $user->setPasswordResetToken(null)
                     ->setPasswordResetExpiresAt(null);
                $this->entityManager->flush();

                return false;
            }

            // Changer le mot de passe
            $hashedPassword = $this->passwordHasher->hashPassword($user, $newPassword);
            $user->setPassword($hashedPassword)
                 ->setPasswordResetToken(null)
                 ->setPasswordResetExpiresAt(null);

            // Réinitialiser les tentatives de connexion échouées
            $this->resetFailedAttempts($user);

            $this->entityManager->flush();

            $this->logInfo('Password reset successful', ['user_id' => $user->getId()]);

            return true;

        } catch (\Exception $e) {
            $this->logError('Password reset error', $e, ['token' => $token]);
            return false;
        }
    }

    /**
     * Changer le mot de passe d'un utilisateur connecté
     */
    public function changePassword(User $user, string $currentPassword, string $newPassword): bool
    {
        try {
            // Vérifier le mot de passe actuel
            if (!$this->passwordHasher->isPasswordValid($user, $currentPassword)) {
                throw new \InvalidArgumentException('Mot de passe actuel incorrect');
            }

            // Hasher le nouveau mot de passe
            $hashedPassword = $this->passwordHasher->hashPassword($user, $newPassword);
            $user->setPassword($hashedPassword);

            $this->entityManager->flush();

            $this->logInfo('Password changed successfully', ['user_id' => $user->getId()]);

            return true;

        } catch (\Exception $e) {
            $this->logError('Password change error', $e, ['user_id' => $user->getId()]);
            throw $e;
        }
    }

    /**
     * Vérifier si un compte est verrouillé
     */
    private function isAccountLocked(User $user): bool
    {
        $lockoutUntil = $user->getAccountLockedUntil();

        if ($lockoutUntil && $lockoutUntil > new \DateTimeImmutable()) {
            return true;
        }

        // Déverrouiller automatiquement si la période est expirée
        if ($lockoutUntil && $lockoutUntil <= new \DateTimeImmutable()) {
            $user->setAccountLockedUntil(null)
                 ->setFailedLoginAttempts(0);
            $this->entityManager->flush();
        }

        return false;
    }

    /**
     * Incrémenter les tentatives de connexion échouées
     */
    private function incrementFailedAttempts(User $user): void
    {
        $attempts = $user->getFailedLoginAttempts() + 1;
        $user->setFailedLoginAttempts($attempts);

        // Verrouiller le compte si trop de tentatives
        if ($attempts >= self::MAX_LOGIN_ATTEMPTS) {
            $lockoutUntil = new \DateTimeImmutable('+' . self::LOCKOUT_DURATION . ' seconds');
            $user->setAccountLockedUntil($lockoutUntil);

            $this->logWarning('Account locked due to too many failed attempts', [
                'user_id' => $user->getId(),
                'attempts' => $attempts,
                'locked_until' => $lockoutUntil->format('Y-m-d H:i:s')
            ]);
        }

        $this->entityManager->flush();
    }

    /**
     * Réinitialiser les tentatives de connexion échouées
     */
    private function resetFailedAttempts(User $user): void
    {
        if ($user->getFailedLoginAttempts() > 0 || $user->getAccountLockedUntil()) {
            $user->setFailedLoginAttempts(0)
                 ->setAccountLockedUntil(null);
            $this->entityManager->flush();
        }
    }

    /**
     * Mettre à jour la date de dernière connexion
     */
    private function updateLastLogin(User $user, ?string $ipAddress): void
    {
        $user->setLastLoginAt(new \DateTimeImmutable());
        $this->entityManager->flush();
    }

    /**
     * Logger une tentative de connexion échouée
     */
    private function logFailedAttempt(string $email, ?string $ipAddress, string $reason): void
    {
        $this->logWarning('Failed authentication attempt', [
            'email' => $email,
            'ip_address' => $ipAddress,
            'reason' => $reason,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    }
}
```

## Service de Gestion des Tokens

### TokenService

```php
<?php

namespace App\Service;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Entity\User;
use Psr\Log\LoggerInterface;

final class TokenService
{
    use ResponseTrait;

    private const LOG_FILE = 'security/tokens';

    public function __construct(
        private string $jwtSecret,
        private int $jwtTtl,
        private LoggerInterface $logger
    ) {}

    /**
     * Générer un token JWT pour un utilisateur
     */
    public function generateJwtToken(User $user): string
    {
        $payload = [
            'sub' => $user->getId(),
            'email' => $user->getEmail(),
            'username' => $user->getUsername(),
            'roles' => $user->getRoles(),
            'iat' => time(),
            'exp' => time() + $this->jwtTtl,
            'jti' => uniqid('jwt_', true) // Unique token ID
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    /**
     * Valider et décoder un token JWT
     */
    public function validateJwtToken(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            return (array) $decoded;
        } catch (\Exception $e) {
            $this->logWarning('Invalid JWT token', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Générer un token de vérification d'email
     */
    public function generateVerificationToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Générer un token de réinitialisation de mot de passe
     */
    public function generatePasswordResetToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Générer un token de session sécurisé
     */
    public function generateSessionToken(): string
    {
        return bin2hex(random_bytes(48));
    }

    /**
     * Générer un token CSRF
     */
    public function generateCsrfToken(string $tokenId = 'default'): string
    {
        return hash_hmac('sha256', $tokenId . time(), $this->jwtSecret);
    }

    /**
     * Valider un token CSRF
     */
    public function validateCsrfToken(string $token, string $tokenId = 'default'): bool
    {
        // En production, vous devriez stocker et vérifier les tokens CSRF
        // Ici, c'est une implémentation simplifiée
        return !empty($token) && strlen($token) === 64;
    }

    /**
     * Extraire le payload d'un token JWT sans validation complète
     */
    public function extractJwtPayload(string $token): ?array
    {
        try {
            $parts = explode('.', $token);
            if (count($parts) !== 3) {
                return null;
            }

            $payload = base64_decode($parts[1]);
            return json_decode($payload, true);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Vérifier si un token JWT est expiré
     */
    public function isJwtTokenExpired(string $token): bool
    {
        $payload = $this->extractJwtPayload($token);

        if (!$payload || !isset($payload['exp'])) {
            return true;
        }

        return $payload['exp'] < time();
    }

    /**
     * Générer un refresh token
     */
    public function generateRefreshToken(User $user): string
    {
        $payload = [
            'sub' => $user->getId(),
            'type' => 'refresh',
            'iat' => time(),
            'exp' => time() + (7 * 24 * 3600), // 7 jours
            'jti' => uniqid('refresh_', true)
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    /**
     * Valider un refresh token
     */
    public function validateRefreshToken(string $token): ?int
    {
        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            $payload = (array) $decoded;

            if ($payload['type'] !== 'refresh') {
                return null;
            }

            return $payload['sub'];
        } catch (\Exception $e) {
            $this->logWarning('Invalid refresh token', ['error' => $e->getMessage()]);
            return null;
        }
    }
}
```

## Contrôleurs d'Authentification

### AuthController pour l'interface web

```php
<?php

namespace App\Auth\Controller;

use App\Service\AuthenticationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;

#[Route('/auth', name: 'auth_')]
final class AuthController extends AbstractController
{
    public function __construct(
        private AuthenticationService $authService
    ) {}

    #[Route('/login', name: 'login', methods: ['GET', 'POST'])]
    public function login(AuthenticationUtils $authenticationUtils): Response
    {
        // Rediriger si déjà connecté
        if ($this->getUser()) {
            return $this->redirectToRoute('app_home');
        }

        // Récupérer les erreurs de connexion
        $error = $authenticationUtils->getLastAuthenticationError();
        $lastUsername = $authenticationUtils->getLastUsername();

        return $this->render('auth/login/index.html.twig', [
            'last_username' => $lastUsername,
            'error' => $error,
            'page_title' => 'Connexion'
        ]);
    }

    #[Route('/logout', name: 'logout')]
    public function logout(): void
    {
        // Cette méthode peut être vide car la déconnexion
        // est gérée par Symfony Security
    }

    #[Route('/register', name: 'register', methods: ['GET', 'POST'])]
    public function register(Request $request): Response
    {
        if ($request->isMethod('POST')) {
            try {
                $userData = [
                    'email' => $request->request->get('email'),
                    'username' => $request->request->get('username'),
                    'password' => $request->request->get('password'),
                    'firstname' => $request->request->get('firstname'),
                    'lastname' => $request->request->get('lastname'),
                    'phone' => $request->request->get('phone'),
                    'birthdate' => $request->request->get('birthdate'),
                    'gender' => $request->request->get('gender')
                ];

                $result = $this->authService->register($userData);

                $this->addFlash('success', $result['message']);
                return $this->redirectToRoute('auth_login');

            } catch (\Exception $e) {
                $this->addFlash('error', $e->getMessage());
            }
        }

        return $this->render('auth/registration/index.html.twig', [
            'page_title' => 'Inscription'
        ]);
    }

    #[Route('/verification/{token}', name: 'verify_email')]
    public function verifyEmail(string $token): Response
    {
        $verified = $this->authService->verifyEmail($token);

        if ($verified) {
            $this->addFlash('success', 'Votre email a été vérifié avec succès. Vous pouvez maintenant vous connecter.');
        } else {
            $this->addFlash('error', 'Token de vérification invalide ou expiré.');
        }

        return $this->redirectToRoute('auth_login');
    }

    #[Route('/password-reset', name: 'password_reset_request', methods: ['GET', 'POST'])]
    public function passwordResetRequest(Request $request): Response
    {
        if ($request->isMethod('POST')) {
            $email = $request->request->get('email');

            $this->authService->initiatePasswordReset($email);

            $this->addFlash('info',
                'Si cette adresse email existe dans notre système, ' .
                'vous recevrez un email avec les instructions de réinitialisation.'
            );

            return $this->redirectToRoute('auth_login');
        }

        return $this->render('auth/password_reset/request.html.twig', [
            'page_title' => 'Réinitialisation du mot de passe'
        ]);
    }

    #[Route('/password-reset/reset/{token}', name: 'password_reset_reset', methods: ['GET', 'POST'])]
    public function passwordResetReset(string $token, Request $request): Response
    {
        if ($request->isMethod('POST')) {
            $newPassword = $request->request->get('password');

            $reset = $this->authService->resetPassword($token, $newPassword);

            if ($reset) {
                $this->addFlash('success', 'Votre mot de passe a été réinitialisé avec succès.');
                return $this->redirectToRoute('auth_login');
            } else {
                $this->addFlash('error', 'Token de réinitialisation invalide ou expiré.');
                return $this->redirectToRoute('auth_password_reset_request');
            }
        }

        return $this->render('auth/password_reset/reset.html.twig', [
            'token' => $token,
            'page_title' => 'Nouveau mot de passe'
        ]);
    }
}
```

### ApiAuthController pour l'API

```php
<?php

namespace App\Controller\Api;

use App\Service\AuthenticationService;
use App\Service\TokenService;
use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use OpenApi\Attributes as OA;

#[Route('/api', name: 'api_auth_')]
#[OA\Tag(name: 'Authentication')]
final class ApiAuthController extends AbstractController
{
    public function __construct(
        private AuthenticationService $authService,
        private TokenService $tokenService,
        private UserRepository $userRepository
    ) {}

    #[Route('/login', name: 'login', methods: ['POST'])]
    #[OA\Post(
        summary: 'Connexion utilisateur',
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    'email' => new OA\Property(type: 'string', format: 'email'),
                    'password' => new OA\Property(type: 'string')
                ]
            )
        )
    )]
    public function login(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';
            $ipAddress = $request->getClientIp();

            $result = $this->authService->authenticate($email, $password, $ipAddress);

            $user = $result['user'];
            $token = $this->tokenService->generateJwtToken($user);
            $refreshToken = $this->tokenService->generateRefreshToken($user);

            return $this->json([
                'success' => true,
                'message' => $result['message'],
                'user' => [
                    'id' => $user->getId(),
                    'email' => $user->getEmail(),
                    'username' => $user->getUsername(),
                    'firstname' => $user->getFirstname(),
                    'lastname' => $user->getLastname(),
                    'roles' => $user->getRoles()
                ],
                'tokens' => [
                    'access_token' => $token,
                    'refresh_token' => $refreshToken,
                    'expires_in' => 3600
                ]
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 401);
        }
    }

    #[Route('/register', name: 'register', methods: ['POST'])]
    #[OA\Post(
        summary: 'Inscription utilisateur',
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    'email' => new OA\Property(type: 'string', format: 'email'),
                    'username' => new OA\Property(type: 'string'),
                    'password' => new OA\Property(type: 'string'),
                    'firstname' => new OA\Property(type: 'string'),
                    'lastname' => new OA\Property(type: 'string')
                ]
            )
        )
    )]
    public function register(Request $request): JsonResponse
    {
        try {
            $userData = json_decode($request->getContent(), true);
            $result = $this->authService->register($userData);

            return $this->json([
                'success' => true,
                'message' => $result['message'],
                'verification_email_sent' => $result['verification_email_sent']
            ], 201);

        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    #[Route('/refresh', name: 'refresh', methods: ['POST'])]
    #[OA\Post(
        summary: 'Renouveler le token d\'accès',
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    'refresh_token' => new OA\Property(type: 'string')
                ]
            )
        )
    )]
    public function refresh(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $refreshToken = $data['refresh_token'] ?? '';

            $userId = $this->tokenService->validateRefreshToken($refreshToken);

            if (!$userId) {
                return $this->json(['message' => 'Invalid refresh token'], 401);
            }

            $user = $this->userRepository->find($userId);

            if (!$user || !$user->isActive()) {
                return $this->json(['message' => 'User not found or inactive'], 401);
            }

            $newToken = $this->tokenService->generateJwtToken($user);
            $newRefreshToken = $this->tokenService->generateRefreshToken($user);

            return $this->json([
                'access_token' => $newToken,
                'refresh_token' => $newRefreshToken,
                'expires_in' => 3600
            ]);

        } catch (\Exception $e) {
            return $this->json(['message' => 'Token refresh failed'], 401);
        }
    }

    #[Route('/me', name: 'me', methods: ['GET'])]
    #[OA\Get(summary: 'Informations utilisateur connecté')]
    public function me(): JsonResponse
    {
        $user = $this->getUser();

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'username' => $user->getUsername(),
            'firstname' => $user->getFirstname(),
            'lastname' => $user->getLastname(),
            'roles' => $user->getRoles(),
            'is_verified' => $user->isVerified(),
            'last_login_at' => $user->getLastLoginAt()?->format('c')
        ]);
    }
}
```

## Listeners et Event Subscribers

### AuthenticationListener

```php
<?php

namespace App\EventListener;

use App\Service\TrackingService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Security\Http\Event\LoginSuccessEvent;
use Symfony\Component\Security\Http\Event\LoginFailureEvent;
use Symfony\Component\Security\Http\Event\LogoutEvent;
use Psr\Log\LoggerInterface;

final class AuthenticationListener implements EventSubscriberInterface
{
    public function __construct(
        private TrackingService $trackingService,
        private RequestStack $requestStack,
        private LoggerInterface $logger
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            LoginSuccessEvent::class => 'onLoginSuccess',
            LoginFailureEvent::class => 'onLoginFailure',
            LogoutEvent::class => 'onLogout'
        ];
    }

    public function onLoginSuccess(LoginSuccessEvent $event): void
    {
        $user = $event->getUser();
        $request = $this->requestStack->getCurrentRequest();

        // Tracker l'événement de connexion
        $this->trackingService->track('user_login', [
            'user_id' => $user->getId(),
            'ip_address' => $request?->getClientIp(),
            'user_agent' => $request?->headers->get('User-Agent'),
            'success' => true
        ]);

        $this->logger->info('User login success', [
            'user_id' => $user->getId(),
            'username' => $user->getUsername()
        ]);
    }

    public function onLoginFailure(LoginFailureEvent $event): void
    {
        $request = $this->requestStack->getCurrentRequest();
        $exception = $event->getException();

        // Tracker l'échec de connexion
        $this->trackingService->track('user_login_failure', [
            'ip_address' => $request?->getClientIp(),
            'user_agent' => $request?->headers->get('User-Agent'),
            'error' => $exception->getMessage()
        ]);

        $this->logger->warning('User login failure', [
            'error' => $exception->getMessage(),
            'ip_address' => $request?->getClientIp()
        ]);
    }

    public function onLogout(LogoutEvent $event): void
    {
        $user = $event->getToken()?->getUser();
        $request = $event->getRequest();

        if ($user) {
            // Tracker la déconnexion
            $this->trackingService->track('user_logout', [
                'user_id' => $user->getId(),
                'ip_address' => $request->getClientIp()
            ]);

            $this->logger->info('User logout', [
                'user_id' => $user->getId()
            ]);
        }
    }
}
```

## Middleware et Guards

### JwtAuthGuard

```php
<?php

namespace App\Security;

use App\Service\TokenService;
use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

final class JwtAuthGuard extends AbstractAuthenticator
{
    public function __construct(
        private TokenService $tokenService,
        private UserRepository $userRepository
    ) {}

    public function supports(Request $request): ?bool
    {
        return $request->headers->has('Authorization') &&
               str_starts_with($request->headers->get('Authorization'), 'Bearer ');
    }

    public function authenticate(Request $request): Passport
    {
        $authHeader = $request->headers->get('Authorization');
        $token = substr($authHeader, 7); // Enlever "Bearer "

        if (!$token) {
            throw new AuthenticationException('No token provided');
        }

        $payload = $this->tokenService->validateJwtToken($token);

        if (!$payload) {
            throw new AuthenticationException('Invalid token');
        }

        $userBadge = new UserBadge($payload['email'], function ($userIdentifier) {
            return $this->userRepository->findOneBy(['email' => $userIdentifier]);
        });

        return new SelfValidatingPassport($userBadge);
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null; // Laisser la requête continuer
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse([
            'message' => 'Authentication failed',
            'error' => $exception->getMessage()
        ], Response::HTTP_UNAUTHORIZED);
    }
}
```

Cette implémentation complète d'authentification offre une sécurité robuste avec gestion des tokens JWT, protection contre les attaques par force brute, vérification email et API sécurisée.
