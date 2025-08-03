# Intégrations Externes

## Vue d'ensemble

Ce document décrit les intégrations avec les services et APIs externes utilisés par l'application. Il couvre les configurations, l'authentification, la gestion des erreurs et les bonnes pratiques pour chaque service externe.

## Services Email

### Configuration Symfony Mailer

#### Services supportés

- **SMTP classique** : Configuration personnalisée
- **SendGrid** : Service cloud professionnel
- **Mailgun** : API REST robuste
- **Amazon SES** : Service AWS économique
- **Gmail SMTP** : Pour le développement

#### Configuration SMTP générique

```yaml
# config/packages/mailer.yaml
framework:
  mailer:
    dsn: '%env(MAILER_DSN)%'
    message_bus: false
    headers:
      from: '%env(MAILER_FROM_ADDRESS)%'
```

```bash
# .env
# SMTP classique
MAILER_DSN=smtp://user:pass@smtp.example.com:587

# Gmail (développement)
MAILER_DSN=gmail+smtp://username:password@default

# SendGrid
MAILER_DSN=sendgrid+smtp://apikey:SG.key@default

# Mailgun
MAILER_DSN=mailgun+smtp://username:password@default?region=eu

# Amazon SES
MAILER_DSN=ses+smtp://ACCESS_KEY:SECRET_KEY@default?region=eu-west-1
```

### Service MailerService personnalisé

```php
final class MailerService
{
    use ResponseTrait;

    private const LOG_FILE = 'service/mailer';

    public function __construct(
        private MailerInterface $mailer,
        private Environment $twig,
        private ParameterBagInterface $parameterBag,
        private LoggerInterface $logger
    ) {}

    /**
     * Envoyer un email de vérification de compte
     */
    public function sendVerificationEmail(User $user, string $token): bool
    {
        try {
            $verificationUrl = $this->parameterBag->get('app.base_url') .
                              "/auth/verification/{$token}";

            $email = (new Email())
                ->to($user->getEmail())
                ->subject('Vérifiez votre compte')
                ->html($this->twig->render('emails/verification.html.twig', [
                    'user' => $user,
                    'verification_url' => $verificationUrl,
                    'token' => $token
                ]));

            $this->mailer->send($email);
            $this->logInfo('Verification email sent', ['user_id' => $user->getId()]);

            return true;
        } catch (\Exception $e) {
            $this->logError('Failed to send verification email', $e, ['user_id' => $user->getId()]);
            return false;
        }
    }

    /**
     * Envoyer un email de réinitialisation de mot de passe
     */
    public function sendPasswordResetEmail(User $user, string $token): bool
    {
        try {
            $resetUrl = $this->parameterBag->get('app.base_url') .
                       "/auth/password-reset/reset/{$token}";

            $email = (new Email())
                ->to($user->getEmail())
                ->subject('Réinitialisation de mot de passe')
                ->html($this->twig->render('emails/password_reset.html.twig', [
                    'user' => $user,
                    'reset_url' => $resetUrl,
                    'token' => $token,
                    'expires_at' => (new \DateTimeImmutable())->modify('+2 hours')
                ]));

            $this->mailer->send($email);
            $this->logInfo('Password reset email sent', ['user_id' => $user->getId()]);

            return true;
        } catch (\Exception $e) {
            $this->logError('Failed to send password reset email', $e, ['user_id' => $user->getId()]);
            return false;
        }
    }

    /**
     * Envoyer une notification de nouvelle demande
     */
    public function sendNewRequestNotification(\App\Entity\Request $request): bool
    {
        try {
            $adminEmails = $this->getAdminEmails();

            foreach ($adminEmails as $adminEmail) {
                $email = (new Email())
                    ->to($adminEmail)
                    ->subject("Nouvelle demande: {$request->getTitle()}")
                    ->html($this->twig->render('emails/new_request_notification.html.twig', [
                        'request' => $request,
                        'user' => $request->getUser(),
                        'admin_url' => $this->parameterBag->get('app.base_url') .
                                      "/admin/request/{$request->getId()}"
                    ]));

                $this->mailer->send($email);
            }

            $this->logInfo('New request notification sent', ['request_id' => $request->getId()]);
            return true;
        } catch (\Exception $e) {
            $this->logError('Failed to send new request notification', $e, ['request_id' => $request->getId()]);
            return false;
        }
    }

    /**
     * Envoyer un email en lot (newsletter, etc.)
     */
    public function sendBulkEmail(array $recipients, string $subject, string $template, array $context = []): array
    {
        $results = ['success' => 0, 'failed' => 0, 'errors' => []];

        foreach ($recipients as $recipient) {
            try {
                $email = (new Email())
                    ->to($recipient['email'])
                    ->subject($subject)
                    ->html($this->twig->render($template, array_merge($context, [
                        'recipient' => $recipient
                    ])));

                $this->mailer->send($email);
                $results['success']++;

                // Délai pour éviter le spam
                usleep(100000); // 0.1 seconde

            } catch (\Exception $e) {
                $results['failed']++;
                $results['errors'][] = [
                    'email' => $recipient['email'],
                    'error' => $e->getMessage()
                ];

                $this->logError('Bulk email failed', $e, ['email' => $recipient['email']]);
            }
        }

        $this->logInfo('Bulk email completed', $results);
        return $results;
    }

    /**
     * Obtenir les emails des administrateurs
     */
    private function getAdminEmails(): array
    {
        // Cette méthode pourrait être injectée depuis UserRepository
        return explode(',', $this->parameterBag->get('app.admin_emails'));
    }
}
```

## Services de Stockage Cloud

### Configuration Amazon S3

```php
// Service/S3StorageService.php
final class S3StorageService
{
    public function __construct(
        private S3Client $s3Client,
        private string $bucketName,
        private string $region
    ) {}

    public function uploadFile(string $filePath, string $key, array $metadata = []): bool
    {
        try {
            $result = $this->s3Client->putObject([
                'Bucket' => $this->bucketName,
                'Key' => $key,
                'SourceFile' => $filePath,
                'Metadata' => $metadata,
                'ServerSideEncryption' => 'AES256'
            ]);

            return isset($result['ETag']);
        } catch (\Exception $e) {
            throw new \RuntimeException('Erreur upload S3: ' . $e->getMessage());
        }
    }

    public function getFileUrl(string $key, int $expiresIn = 3600): string
    {
        $cmd = $this->s3Client->getCommand('GetObject', [
            'Bucket' => $this->bucketName,
            'Key' => $key
        ]);

        return (string) $this->s3Client->createPresignedRequest($cmd, "+{$expiresIn} seconds")->getUri();
    }

    public function deleteFile(string $key): bool
    {
        try {
            $this->s3Client->deleteObject([
                'Bucket' => $this->bucketName,
                'Key' => $key
            ]);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
```

```yaml
# config/services.yaml
services:
  Aws\S3\S3Client:
    arguments:
      - version: 'latest'
        region: '%env(AWS_DEFAULT_REGION)%'
        credentials:
          key: '%env(AWS_ACCESS_KEY_ID)%'
          secret: '%env(AWS_SECRET_ACCESS_KEY)%'
```

## APIs de Géolocalisation

### Service GeoIP

```php
final class GeoIpService
{
    public function __construct(
        private HttpClientInterface $httpClient,
        private string $ipApiKey,
        private CacheInterface $cache
    ) {}

    /**
     * Obtenir la localisation depuis une IP
     */
    public function getLocationFromIp(string $ip): ?array
    {
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE)) {
            return null;
        }

        $cacheKey = 'geoip:' . md5($ip);

        return $this->cache->get($cacheKey, function () use ($ip) {
            try {
                $response = $this->httpClient->request('GET', "http://ip-api.com/json/{$ip}", [
                    'query' => [
                        'fields' => 'status,country,countryCode,region,regionName,city,lat,lon,timezone'
                    ],
                    'timeout' => 5
                ]);

                $data = $response->toArray();

                if ($data['status'] === 'success') {
                    return [
                        'country' => $data['country'],
                        'country_code' => $data['countryCode'],
                        'region' => $data['regionName'],
                        'city' => $data['city'],
                        'latitude' => $data['lat'],
                        'longitude' => $data['lon'],
                        'timezone' => $data['timezone']
                    ];
                }

                return null;
            } catch (\Exception $e) {
                return null;
            }
        });
    }

    /**
     * Obtenir la distance entre deux points
     */
    public function getDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // Rayon de la Terre en km

        $latDelta = deg2rad($lat2 - $lat1);
        $lonDelta = deg2rad($lon2 - $lon1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($lonDelta / 2) * sin($lonDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
```

## Services de Paiement

### Intégration Stripe

```php
final class StripePaymentService
{
    public function __construct(
        private StripeClient $stripe,
        private string $webhookSecret
    ) {}

    /**
     * Créer une intention de paiement
     */
    public function createPaymentIntent(int $amount, string $currency = 'eur', array $metadata = []): PaymentIntent
    {
        return $this->stripe->paymentIntents->create([
            'amount' => $amount, // en centimes
            'currency' => $currency,
            'metadata' => $metadata,
            'automatic_payment_methods' => ['enabled' => true]
        ]);
    }

    /**
     * Créer un client Stripe
     */
    public function createCustomer(User $user): Customer
    {
        return $this->stripe->customers->create([
            'email' => $user->getEmail(),
            'name' => $user->getFirstname() . ' ' . $user->getLastname(),
            'metadata' => ['user_id' => $user->getId()]
        ]);
    }

    /**
     * Vérifier la signature d'un webhook
     */
    public function verifyWebhookSignature(string $payload, string $signature): Event
    {
        return Webhook::constructEvent($payload, $signature, $this->webhookSecret);
    }

    /**
     * Traiter un événement webhook
     */
    public function processWebhookEvent(Event $event): bool
    {
        switch ($event->type) {
            case 'payment_intent.succeeded':
                return $this->handlePaymentSuccess($event->data->object);

            case 'payment_intent.payment_failed':
                return $this->handlePaymentFailure($event->data->object);

            default:
                return true; // Événement non traité mais OK
        }
    }

    private function handlePaymentSuccess(PaymentIntent $paymentIntent): bool
    {
        // Logique de traitement du paiement réussi
        // Mettre à jour la base de données, envoyer des emails, etc.
        return true;
    }

    private function handlePaymentFailure(PaymentIntent $paymentIntent): bool
    {
        // Logique de traitement de l'échec de paiement
        return true;
    }
}
```

## Services d'Analytics

### Google Analytics 4

```php
final class GoogleAnalyticsService
{
    public function __construct(
        private HttpClientInterface $httpClient,
        private string $measurementId,
        private string $apiSecret
    ) {}

    /**
     * Envoyer un événement à GA4
     */
    public function trackEvent(string $eventName, array $parameters = [], ?string $clientId = null): bool
    {
        $clientId = $clientId ?? $this->generateClientId();

        $payload = [
            'client_id' => $clientId,
            'events' => [
                [
                    'name' => $eventName,
                    'params' => $parameters
                ]
            ]
        ];

        try {
            $response = $this->httpClient->request('POST',
                "https://www.google-analytics.com/mp/collect?measurement_id={$this->measurementId}&api_secret={$this->apiSecret}",
                [
                    'json' => $payload,
                    'timeout' => 5
                ]
            );

            return $response->getStatusCode() === 204;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Tracker une conversion
     */
    public function trackConversion(string $conversionName, float $value, string $currency = 'EUR'): bool
    {
        return $this->trackEvent('purchase', [
            'currency' => $currency,
            'value' => $value,
            'transaction_id' => uniqid(),
            'items' => [
                [
                    'item_id' => $conversionName,
                    'item_name' => $conversionName,
                    'price' => $value,
                    'quantity' => 1
                ]
            ]
        ]);
    }

    private function generateClientId(): string
    {
        return sprintf('%s.%s',
            random_int(100000000, 999999999),
            time()
        );
    }
}
```

## Services de Monitoring

### Sentry pour la surveillance d'erreurs

```php
final class SentryService
{
    public function __construct(
        private HubInterface $sentryHub
    ) {}

    /**
     * Capturer une exception
     */
    public function captureException(\Throwable $exception, array $context = []): void
    {
        $this->sentryHub->withScope(function (Scope $scope) use ($exception, $context) {
            foreach ($context as $key => $value) {
                $scope->setContext($key, $value);
            }

            $this->sentryHub->captureException($exception);
        });
    }

    /**
     * Capturer un message
     */
    public function captureMessage(string $message, string $level = 'info', array $context = []): void
    {
        $this->sentryHub->withScope(function (Scope $scope) use ($message, $level, $context) {
            $scope->setLevel($level);

            foreach ($context as $key => $value) {
                $scope->setContext($key, $value);
            }

            $this->sentryHub->captureMessage($message);
        });
    }

    /**
     * Ajouter des tags utilisateur
     */
    public function setUserContext(User $user): void
    {
        $this->sentryHub->configureScope(function (Scope $scope) use ($user) {
            $scope->setUser([
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'username' => $user->getUsername()
            ]);
        });
    }
}
```

## Services de Communication

### Slack pour les notifications

```php
final class SlackNotificationService
{
    public function __construct(
        private HttpClientInterface $httpClient,
        private string $webhookUrl
    ) {}

    /**
     * Envoyer une notification Slack
     */
    public function sendNotification(string $message, string $channel = '#general', array $attachments = []): bool
    {
        try {
            $payload = [
                'text' => $message,
                'channel' => $channel,
                'username' => 'App Bot',
                'icon_emoji' => ':robot_face:'
            ];

            if (!empty($attachments)) {
                $payload['attachments'] = $attachments;
            }

            $response = $this->httpClient->request('POST', $this->webhookUrl, [
                'json' => $payload,
                'timeout' => 5
            ]);

            return $response->getStatusCode() === 200;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Notifier une erreur critique
     */
    public function notifyError(\Throwable $exception, array $context = []): bool
    {
        $attachment = [
            'color' => 'danger',
            'title' => 'Erreur critique détectée',
            'fields' => [
                [
                    'title' => 'Message',
                    'value' => $exception->getMessage(),
                    'short' => false
                ],
                [
                    'title' => 'Fichier',
                    'value' => $exception->getFile() . ':' . $exception->getLine(),
                    'short' => true
                ],
                [
                    'title' => 'Environnement',
                    'value' => $_ENV['APP_ENV'] ?? 'unknown',
                    'short' => true
                ]
            ],
            'timestamp' => time()
        ];

        return $this->sendNotification('', '#alerts', [$attachment]);
    }

    /**
     * Notifier une nouvelle demande
     */
    public function notifyNewRequest(\App\Entity\Request $request): bool
    {
        $attachment = [
            'color' => 'good',
            'title' => 'Nouvelle demande créée',
            'fields' => [
                [
                    'title' => 'Titre',
                    'value' => $request->getTitle(),
                    'short' => false
                ],
                [
                    'title' => 'Utilisateur',
                    'value' => $request->getUser()->getUsername(),
                    'short' => true
                ],
                [
                    'title' => 'Priorité',
                    'value' => $request->getPriority(),
                    'short' => true
                ]
            ],
            'timestamp' => $request->getCreatedAt()->getTimestamp()
        ];

        return $this->sendNotification('', '#requests', [$attachment]);
    }
}
```

## APIs de Validation

### Service de validation d'email

```php
final class EmailValidationService
{
    public function __construct(
        private HttpClientInterface $httpClient,
        private string $apiKey,
        private CacheInterface $cache
    ) {}

    /**
     * Valider un email avec un service externe
     */
    public function validateEmail(string $email): array
    {
        $cacheKey = 'email_validation:' . md5($email);

        return $this->cache->get($cacheKey, function () use ($email) {
            try {
                $response = $this->httpClient->request('GET', 'https://api.hunter.io/v2/email-verifier', [
                    'query' => [
                        'email' => $email,
                        'api_key' => $this->apiKey
                    ],
                    'timeout' => 10
                ]);

                $data = $response->toArray();

                return [
                    'valid' => $data['data']['result'] === 'deliverable',
                    'score' => $data['data']['score'] ?? 0,
                    'disposable' => $data['data']['disposable'] ?? false,
                    'webmail' => $data['data']['webmail'] ?? false,
                    'mx_records' => $data['data']['mx_records'] ?? false
                ];
            } catch (\Exception $e) {
                // En cas d'erreur, considérer comme valide pour ne pas bloquer
                return [
                    'valid' => true,
                    'score' => 50,
                    'disposable' => false,
                    'webmail' => false,
                    'mx_records' => true,
                    'error' => $e->getMessage()
                ];
            }
        });
    }

    /**
     * Vérifier si un email est jetable
     */
    public function isDisposableEmail(string $email): bool
    {
        $domain = substr(strrchr($email, '@'), 1);

        // Liste des domaines jetables communs
        $disposableDomains = [
            '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
            'mailinator.com', 'throwaway.email'
        ];

        return in_array($domain, $disposableDomains);
    }
}
```

## Gestion des Webhooks

### Service générique pour webhooks

```php
final class WebhookService
{
    public function __construct(
        private LoggerInterface $logger,
        private EntityManagerInterface $manager
    ) {}

    /**
     * Traiter un webhook entrant
     */
    public function processWebhook(string $provider, string $event, array $payload, string $signature = null): bool
    {
        try {
            // Vérifier la signature si fournie
            if ($signature && !$this->verifySignature($provider, $payload, $signature)) {
                throw new \InvalidArgumentException('Signature invalide');
            }

            // Logger le webhook
            $this->logWebhook($provider, $event, $payload);

            // Dispatcher selon le provider
            return match($provider) {
                'stripe' => $this->processStripeWebhook($event, $payload),
                'sendgrid' => $this->processSendGridWebhook($event, $payload),
                'github' => $this->processGitHubWebhook($event, $payload),
                default => throw new \InvalidArgumentException("Provider non supporté: {$provider}")
            };
        } catch (\Exception $e) {
            $this->logger->error('Webhook processing failed', [
                'provider' => $provider,
                'event' => $event,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Vérifier la signature d'un webhook
     */
    private function verifySignature(string $provider, array $payload, string $signature): bool
    {
        return match($provider) {
            'stripe' => $this->verifyStripeSignature($payload, $signature),
            'github' => $this->verifyGitHubSignature($payload, $signature),
            default => true // Pas de vérification par défaut
        };
    }

    /**
     * Logger un webhook reçu
     */
    private function logWebhook(string $provider, string $event, array $payload): void
    {
        $webhook = new WebhookLog();
        $webhook->setProvider($provider)
               ->setEvent($event)
               ->setPayload($payload)
               ->setReceivedAt(new \DateTimeImmutable());

        $this->manager->persist($webhook);
        $this->manager->flush();
    }

    private function processStripeWebhook(string $event, array $payload): bool
    {
        // Logique spécifique Stripe
        return true;
    }

    private function processSendGridWebhook(string $event, array $payload): bool
    {
        // Logique spécifique SendGrid (bounces, ouvertures, clics)
        return true;
    }

    private function processGitHubWebhook(string $event, array $payload): bool
    {
        // Logique spécifique GitHub (push, pull requests)
        return true;
    }
}
```

## Configuration des Services Externes

### Variables d'environnement

```bash
# .env
# Email
MAILER_DSN=sendgrid+smtp://apikey:SG.xxxxxx@default
MAILER_FROM_ADDRESS=noreply@example.com

# Stockage
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=eu-west-1
AWS_S3_BUCKET=my-app-uploads

# Paiements
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Analytics
GOOGLE_ANALYTICS_MEASUREMENT_ID=G-...
GOOGLE_ANALYTICS_API_SECRET=...

# Monitoring
SENTRY_DSN=https://...@sentry.io/...

# Communications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Validation
HUNTER_API_KEY=...
IPAPI_KEY=...
```

### Configuration Symfony pour les services

```yaml
# config/services.yaml
services:
  # Mailer
  App\Service\MailerService:
    arguments:
      $parameterBag: '@parameter_bag'

  # Stockage S3
  App\Service\S3StorageService:
    arguments:
      $bucketName: '%env(AWS_S3_BUCKET)%'
      $region: '%env(AWS_DEFAULT_REGION)%'

  # Paiements Stripe
  Stripe\StripeClient:
    arguments:
      - '%env(STRIPE_SECRET_KEY)%'

  App\Service\StripePaymentService:
    arguments:
      $webhookSecret: '%env(STRIPE_WEBHOOK_SECRET)%'

  # Analytics
  App\Service\GoogleAnalyticsService:
    arguments:
      $measurementId: '%env(GOOGLE_ANALYTICS_MEASUREMENT_ID)%'
      $apiSecret: '%env(GOOGLE_ANALYTICS_API_SECRET)%'

  # Notifications
  App\Service\SlackNotificationService:
    arguments:
      $webhookUrl: '%env(SLACK_WEBHOOK_URL)%'

  # Validation
  App\Service\EmailValidationService:
    arguments:
      $apiKey: '%env(HUNTER_API_KEY)%'

  App\Service\GeoIpService:
    arguments:
      $ipApiKey: '%env(IPAPI_KEY)%'
```

## Gestion des Erreurs et Retry

### Service de retry automatique

```php
final class RetryService
{
    /**
     * Exécuter avec retry automatique
     */
    public function retry(callable $callback, int $maxAttempts = 3, int $delayMs = 1000): mixed
    {
        $attempt = 1;

        while ($attempt <= $maxAttempts) {
            try {
                return $callback();
            } catch (\Exception $e) {
                if ($attempt === $maxAttempts) {
                    throw $e;
                }

                // Délai exponentiel
                $delay = $delayMs * pow(2, $attempt - 1);
                usleep($delay * 1000);

                $attempt++;
            }
        }
    }

    /**
     * Retry conditionnel selon le type d'erreur
     */
    public function retryOnCondition(callable $callback, callable $shouldRetry, int $maxAttempts = 3): mixed
    {
        $attempt = 1;

        while ($attempt <= $maxAttempts) {
            try {
                return $callback();
            } catch (\Exception $e) {
                if ($attempt === $maxAttempts || !$shouldRetry($e)) {
                    throw $e;
                }

                $attempt++;
                usleep(1000000); // 1 seconde
            }
        }
    }
}
```

## Monitoring et Health Checks

### Contrôleur de vérification de santé

```php
#[Route('/health', name: 'health_check')]
final class HealthCheckController extends AbstractController
{
    public function __construct(
        private array $externalServices
    ) {}

    public function check(): JsonResponse
    {
        $checks = [];
        $overall = true;

        foreach ($this->externalServices as $service) {
            $check = $this->checkService($service);
            $checks[$service['name']] = $check;

            if (!$check['healthy']) {
                $overall = false;
            }
        }

        return $this->json([
            'status' => $overall ? 'healthy' : 'unhealthy',
            'timestamp' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
            'services' => $checks
        ], $overall ? 200 : 503);
    }

    private function checkService(array $config): array
    {
        try {
            $start = microtime(true);

            // Test de connexion selon le type
            $healthy = match($config['type']) {
                'database' => $this->checkDatabase(),
                'redis' => $this->checkRedis(),
                'http' => $this->checkHttp($config['url']),
                default => false
            };

            $responseTime = (microtime(true) - $start) * 1000;

            return [
                'healthy' => $healthy,
                'response_time_ms' => round($responseTime, 2)
            ];
        } catch (\Exception $e) {
            return [
                'healthy' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
```

Les intégrations externes permettent d'étendre significativement les fonctionnalités de l'application en s'appuyant sur des services spécialisés tout en maintenant la robustesse et la sécurité.
