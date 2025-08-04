# Module de Tracking

## Vue d'ensemble

Le module de tracking fournit une infrastructure complète pour la collecte, l'analyse et la visualisation des données d'utilisation de l'application. Il capture les événements utilisateur, les métriques de performance et génère des rapports détaillés pour optimiser l'expérience utilisateur et les performances business.

## Rôle et Responsabilités

### Fonctionnalités principales

- **Tracking des événements** : Collecte des interactions utilisateur
- **Métriques de performance** : Temps de chargement, erreurs, conversions
- **Analytics comportementales** : Parcours utilisateur, heatmaps, funnels
- **Rapports automatisés** : Génération de rapports périodiques
- **Alertes** : Notifications sur les anomalies ou seuils
- **Privacy-first** : Respect RGPD avec anonymisation des données

## Entités et Modèles Doctrine

### Entité XtrackingEvent

```php
#[ORM\Entity(repositoryClass: XtrackingEventRepository::class)]
#[ORM\Index(columns: ['event_type', 'created_at'])]
#[ORM\Index(columns: ['user_id', 'created_at'])]
class XtrackingEvent
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    private ?string $event_type = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $event_category = null;

    #[ORM\Column(length: 200, nullable: true)]
    private ?string $event_action = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $event_label = null;

    #[ORM\Column(nullable: true)]
    private ?int $event_value = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $event_data = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?User $user = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $session_id = null;

    #[ORM\Column(length: 45, nullable: true)]
    private ?string $ip_address = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $user_agent = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $referrer = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $page_url = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $device_type = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $browser = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $os = null;

    #[ORM\Column(length: 10, nullable: true)]
    private ?string $country = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $city = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    // Relations
    #[ORM\OneToMany(targetEntity: XtrackingEventLog::class, mappedBy: 'tracking_event', cascade: ['persist'])]
    private Collection $logs;

    public function __construct()
    {
        $this->logs = new ArrayCollection();
        $this->created_at = new \DateTimeImmutable();
    }

    // Getters et Setters...
}
```

### Entité XtrackingEventLog

```php
#[ORM\Entity(repositoryClass: XtrackingEventLogRepository::class)]
class XtrackingEventLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'logs')]
    #[ORM\JoinColumn(nullable: false)]
    private ?XtrackingEvent $tracking_event = null;

    #[ORM\Column(length: 50)]
    private ?string $log_level = null; // INFO, WARNING, ERROR, DEBUG

    #[ORM\Column(length: 255)]
    private ?string $message = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $context = null;

    #[ORM\Column(nullable: true)]
    private ?int $processing_time_ms = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $processor = null; // Nom du processeur qui a traité l'événement

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    public function __construct()
    {
        $this->created_at = new \DateTimeImmutable();
    }

    // Getters et Setters...
}
```

## Services de Tracking

### TrackingService (App\Service\TrackingService)

Service principal de gestion du tracking.

```php
final class TrackingService
{
    use ResponseTrait, DateTimeTrait;

    private const LOG_FILE = 'service/tracking';

    public function __construct(
        private XtrackingEventRepository $eventRepository,
        private EntityManagerInterface $manager,
        private RequestStack $requestStack,
        private Security $security,
        private CacheInterface $cache,
        private DeviceDetector $deviceDetector,
        private GeoIpService $geoIpService
    ) {}

    /**
     * Tracker un événement utilisateur
     */
    public function trackEvent(
        string $eventType,
        ?string $category = null,
        ?string $action = null,
        ?string $label = null,
        ?int $value = null,
        array $additionalData = []
    ): XtrackingEvent {
        $request = $this->requestStack->getCurrentRequest();
        $user = $this->security->getUser();

        $event = new XtrackingEvent();
        $event->setEventType($eventType)
              ->setEventCategory($category)
              ->setEventAction($action)
              ->setEventLabel($label)
              ->setEventValue($value)
              ->setEventData($additionalData)
              ->setUser($user)
              ->setCreatedAt($this->now());

        // Enrichissement avec les données de la requête
        if ($request) {
            $this->enrichEventWithRequestData($event, $request);
        }

        $this->manager->persist($event);
        $this->manager->flush();

        // Traitement asynchrone des événements
        $this->processEventAsync($event);

        return $event;
    }

    /**
     * Tracker une page vue
     */
    public function trackPageView(string $pageUrl, ?string $pageTitle = null): XtrackingEvent
    {
        return $this->trackEvent(
            EventTypeEnum::PAGE_VIEW->value,
            'navigation',
            'page_view',
            $pageTitle,
            null,
            ['page_url' => $pageUrl, 'page_title' => $pageTitle]
        );
    }

    /**
     * Tracker un clic
     */
    public function trackClick(string $element, array $context = []): XtrackingEvent
    {
        return $this->trackEvent(
            EventTypeEnum::CLICK->value,
            'interaction',
            'click',
            $element,
            null,
            $context
        );
    }

    /**
     * Tracker une conversion
     */
    public function trackConversion(string $conversionType, float $value = 0, array $context = []): XtrackingEvent
    {
        return $this->trackEvent(
            EventTypeEnum::CONVERSION->value,
            'business',
            $conversionType,
            null,
            (int)($value * 100), // Stockage en centimes
            array_merge($context, ['conversion_value' => $value])
        );
    }

    /**
     * Tracker une erreur
     */
    public function trackError(string $errorType, string $message, array $context = []): XtrackingEvent
    {
        return $this->trackEvent(
            EventTypeEnum::ERROR->value,
            'error',
            $errorType,
            $message,
            null,
            $context
        );
    }

    /**
     * Enrichir l'événement avec les données de la requête
     */
    private function enrichEventWithRequestData(XtrackingEvent $event, Request $request): void
    {
        // Session
        $session = $request->getSession();
        if ($session->isStarted()) {
            $event->setSessionId($session->getId());
        }

        // IP et géolocalisation
        $ipAddress = $this->getClientIp($request);
        $event->setIpAddress($this->anonymizeIp($ipAddress));

        $geoData = $this->geoIpService->getLocationFromIp($ipAddress);
        if ($geoData) {
            $event->setCountry($geoData['country'])
                  ->setCity($geoData['city']);
        }

        // User-Agent et détection device
        $userAgent = $request->headers->get('User-Agent', '');
        $event->setUserAgent($userAgent);

        $this->deviceDetector->setUserAgent($userAgent);
        $this->deviceDetector->parse();

        $event->setDeviceType($this->deviceDetector->getDeviceName() ?: 'unknown')
              ->setBrowser($this->deviceDetector->getClient('name') ?: 'unknown')
              ->setOs($this->deviceDetector->getOs('name') ?: 'unknown');

        // Referrer et URL
        $event->setReferrer($request->headers->get('Referer'))
              ->setPageUrl($request->getUri());
    }

    /**
     * Anonymiser l'adresse IP (RGPD compliance)
     */
    private function anonymizeIp(string $ip): string
    {
        // IPv4 : masquer le dernier octet
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $parts = explode('.', $ip);
            $parts[3] = '0';
            return implode('.', $parts);
        }

        // IPv6 : masquer les 64 derniers bits
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            $parts = explode(':', $ip);
            for ($i = 4; $i < 8; $i++) {
                $parts[$i] = '0000';
            }
            return implode(':', $parts);
        }

        return $ip;
    }

    /**
     * Traitement asynchrone des événements
     */
    private function processEventAsync(XtrackingEvent $event): void
    {
        // Ici on pourrait utiliser Messenger pour traiter les événements en async
        // $this->messageBus->dispatch(new ProcessTrackingEventMessage($event->getId()));

        // Pour l'instant, traitement synchrone
        $this->processEvent($event);
    }

    /**
     * Traiter un événement (agrégations, alertes, etc.)
     */
    private function processEvent(XtrackingEvent $event): void
    {
        $startTime = microtime(true);

        try {
            // Mise à jour des compteurs en cache
            $this->updateCacheCounters($event);

            // Vérification des seuils d'alerte
            $this->checkAlertThresholds($event);

            // Log de succès
            $this->logEventProcessing($event, 'INFO', 'Event processed successfully', [
                'processing_time_ms' => (int)((microtime(true) - $startTime) * 1000)
            ]);

        } catch (\Exception $e) {
            $this->logEventProcessing($event, 'ERROR', 'Error processing event: ' . $e->getMessage(), [
                'exception' => $e->getTraceAsString(),
                'processing_time_ms' => (int)((microtime(true) - $startTime) * 1000)
            ]);
        }
    }

    /**
     * Mettre à jour les compteurs en cache
     */
    private function updateCacheCounters(XtrackingEvent $event): void
    {
        $today = $this->now()->format('Y-m-d');

        // Compteur global du jour
        $cacheKey = "tracking:daily:$today";
        $this->cache->get($cacheKey, function () {
            return 0;
        });

        // Incrémenter le compteur
        // En production, utiliser Redis INCR pour l'atomicité
    }

    /**
     * Logger le traitement d'un événement
     */
    private function logEventProcessing(
        XtrackingEvent $event,
        string $level,
        string $message,
        array $context = []
    ): void {
        $log = new XtrackingEventLog();
        $log->setTrackingEvent($event)
            ->setLogLevel($level)
            ->setMessage($message)
            ->setContext($context)
            ->setProcessingTimeMs($context['processing_time_ms'] ?? null)
            ->setProcessor('TrackingService');

        $this->manager->persist($log);
        $this->manager->flush();
    }
}
```

### AnalyticsService (App\Service\AnalyticsService)

Service d'analyse et de génération de rapports.

```php
final class AnalyticsService
{
    public function __construct(
        private XtrackingEventRepository $eventRepository,
        private CacheInterface $cache
    ) {}

    /**
     * Rapport d'activité quotidienne
     */
    public function getDailyReport(\DateTimeInterface $date): array
    {
        $cacheKey = 'analytics:daily:' . $date->format('Y-m-d');

        return $this->cache->get($cacheKey, function () use ($date) {
            return [
                'page_views' => $this->getPageViewsCount($date),
                'unique_visitors' => $this->getUniqueVisitorsCount($date),
                'conversions' => $this->getConversionsCount($date),
                'errors' => $this->getErrorsCount($date),
                'top_pages' => $this->getTopPages($date),
                'top_referrers' => $this->getTopReferrers($date),
                'device_breakdown' => $this->getDeviceBreakdown($date),
                'browser_breakdown' => $this->getBrowserBreakdown($date)
            ];
        });
    }

    /**
     * Métriques en temps réel
     */
    public function getRealTimeMetrics(): array
    {
        $now = new \DateTimeImmutable();
        $lastHour = $now->modify('-1 hour');

        return [
            'active_users' => $this->getActiveUsersCount($lastHour),
            'page_views_last_hour' => $this->getPageViewsCount($lastHour, $now),
            'errors_last_hour' => $this->getErrorsCount($lastHour, $now),
            'current_top_pages' => $this->getTopPages($lastHour, $now, 5)
        ];
    }

    /**
     * Analyse des tunnels de conversion
     */
    public function getConversionFunnel(array $steps, \DateTimeInterface $from, \DateTimeInterface $to): array
    {
        $funnel = [];

        foreach ($steps as $index => $step) {
            $count = $this->eventRepository->countEventsByTypeAndDateRange(
                $step['event_type'],
                $from,
                $to,
                $step['filters'] ?? []
            );

            $funnel[] = [
                'step' => $index + 1,
                'name' => $step['name'],
                'count' => $count,
                'conversion_rate' => $index > 0 ? ($count / $funnel[0]['count']) * 100 : 100
            ];
        }

        return $funnel;
    }

    /**
     * Analyse des parcours utilisateur
     */
    public function getUserJourneys(int $limit = 10): array
    {
        return $this->eventRepository->getMostCommonUserJourneys($limit);
    }

    /**
     * Détection d'anomalies
     */
    public function detectAnomalies(\DateTimeInterface $date): array
    {
        $todayMetrics = $this->getDailyReport($date);
        $avgLastWeek = $this->getAverageMetricsLastWeek($date);

        $anomalies = [];

        // Vérifier les variations significatives
        foreach (['page_views', 'unique_visitors', 'conversions', 'errors'] as $metric) {
            $change = (($todayMetrics[$metric] - $avgLastWeek[$metric]) / $avgLastWeek[$metric]) * 100;

            if (abs($change) > 50) { // Seuil de 50% de variation
                $anomalies[] = [
                    'metric' => $metric,
                    'current_value' => $todayMetrics[$metric],
                    'average_value' => $avgLastWeek[$metric],
                    'change_percent' => round($change, 2),
                    'severity' => abs($change) > 100 ? 'high' : 'medium'
                ];
            }
        }

        return $anomalies;
    }

    /**
     * Compter les pages vues
     */
    private function getPageViewsCount(\DateTimeInterface $from, ?\DateTimeInterface $to = null): int
    {
        return $this->eventRepository->countEventsByTypeAndDateRange(
            EventTypeEnum::PAGE_VIEW->value,
            $from,
            $to ?? $from->modify('+1 day')
        );
    }

    /**
     * Compter les visiteurs uniques
     */
    private function getUniqueVisitorsCount(\DateTimeInterface $date): int
    {
        return $this->eventRepository->countUniqueVisitorsByDate($date);
    }

    /**
     * Top des pages consultées
     */
    private function getTopPages(\DateTimeInterface $from, ?\DateTimeInterface $to = null, int $limit = 10): array
    {
        return $this->eventRepository->getTopPagesByDateRange(
            $from,
            $to ?? $from->modify('+1 day'),
            $limit
        );
    }
}
```

## Énumérations

### EventTypeEnum

```php
enum EventTypeEnum: string
{
    case PAGE_VIEW = 'page_view';
    case CLICK = 'click';
    case FORM_SUBMIT = 'form_submit';
    case CONVERSION = 'conversion';
    case ERROR = 'error';
    case SEARCH = 'search';
    case DOWNLOAD = 'download';
    case VIDEO_PLAY = 'video_play';
    case SCROLL = 'scroll';
    case SESSION_START = 'session_start';
    case SESSION_END = 'session_end';
    case USER_REGISTRATION = 'user_registration';
    case USER_LOGIN = 'user_login';
    case USER_LOGOUT = 'user_logout';

    public function getDisplayName(): string
    {
        return match($this) {
            self::PAGE_VIEW => 'Page vue',
            self::CLICK => 'Clic',
            self::FORM_SUBMIT => 'Soumission formulaire',
            self::CONVERSION => 'Conversion',
            self::ERROR => 'Erreur',
            self::SEARCH => 'Recherche',
            self::DOWNLOAD => 'Téléchargement',
            self::VIDEO_PLAY => 'Lecture vidéo',
            self::SCROLL => 'Défilement',
            self::SESSION_START => 'Début session',
            self::SESSION_END => 'Fin session',
            self::USER_REGISTRATION => 'Inscription',
            self::USER_LOGIN => 'Connexion',
            self::USER_LOGOUT => 'Déconnexion'
        };
    }
}
```

## Contrôleurs et API

### TrackingController (API)

```php
#[Route('/api/tracking', name: 'api_tracking_')]
final class TrackingController extends AbstractController
{
    public function __construct(
        private TrackingService $trackingService
    ) {}

    #[Route('/event', name: 'track_event', methods: ['POST'])]
    public function trackEvent(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            $event = $this->trackingService->trackEvent(
                $data['event_type'],
                $data['category'] ?? null,
                $data['action'] ?? null,
                $data['label'] ?? null,
                $data['value'] ?? null,
                $data['data'] ?? []
            );

            return $this->json(['success' => true, 'event_id' => $event->getId()]);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    #[Route('/page-view', name: 'track_page_view', methods: ['POST'])]
    public function trackPageView(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            $event = $this->trackingService->trackPageView(
                $data['page_url'],
                $data['page_title'] ?? null
            );

            return $this->json(['success' => true, 'event_id' => $event->getId()]);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    #[Route('/batch', name: 'track_batch', methods: ['POST'])]
    public function trackBatch(Request $request): JsonResponse
    {
        try {
            $events = json_decode($request->getContent(), true);
            $trackedEvents = [];

            foreach ($events as $eventData) {
                $event = $this->trackingService->trackEvent(
                    $eventData['event_type'],
                    $eventData['category'] ?? null,
                    $eventData['action'] ?? null,
                    $eventData['label'] ?? null,
                    $eventData['value'] ?? null,
                    $eventData['data'] ?? []
                );

                $trackedEvents[] = $event->getId();
            }

            return $this->json(['success' => true, 'tracked_events' => $trackedEvents]);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }
}
```

### AnalyticsController (Admin)

```php
#[Route('/admin/analytics', name: 'admin_analytics_')]
final class AnalyticsController extends AbstractController
{
    public function __construct(
        private AnalyticsService $analyticsService
    ) {}

    #[Route('', name: 'index', methods: ['GET'])]
    #[IsGranted('admin.analytics.view')]
    public function index(): Response
    {
        $today = new \DateTimeImmutable();
        $realTimeMetrics = $this->analyticsService->getRealTimeMetrics();
        $dailyReport = $this->analyticsService->getDailyReport($today);

        return $this->render('@admin/analytics/index.html.twig', [
            'real_time_metrics' => $realTimeMetrics,
            'daily_report' => $dailyReport
        ]);
    }

    #[Route('/report/{date}', name: 'daily_report', methods: ['GET'])]
    #[IsGranted('admin.analytics.view')]
    public function dailyReport(string $date): JsonResponse
    {
        try {
            $dateObj = new \DateTimeImmutable($date);
            $report = $this->analyticsService->getDailyReport($dateObj);

            return $this->json($report);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Invalid date format'], 400);
        }
    }

    #[Route('/funnel', name: 'conversion_funnel', methods: ['POST'])]
    #[IsGranted('admin.analytics.view')]
    public function conversionFunnel(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $funnel = $this->analyticsService->getConversionFunnel(
            $data['steps'],
            new \DateTimeImmutable($data['from']),
            new \DateTimeImmutable($data['to'])
        );

        return $this->json($funnel);
    }

    #[Route('/anomalies/{date}', name: 'anomalies', methods: ['GET'])]
    #[IsGranted('admin.analytics.view')]
    public function detectAnomalies(string $date): JsonResponse
    {
        try {
            $dateObj = new \DateTimeImmutable($date);
            $anomalies = $this->analyticsService->detectAnomalies($dateObj);

            return $this->json($anomalies);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Invalid date format'], 400);
        }
    }
}
```

## Composants Frontend

### Client JavaScript de tracking

```typescript
// public/ts/tracking/tracker.ts
class Tracker {
  private apiEndpoint: string;
  private sessionId: string;
  private queue: TrackingEvent[] = [];
  private flushInterval: number = 5000; // 5 secondes

  constructor(apiEndpoint: string) {
    this.apiEndpoint = apiEndpoint;
    this.sessionId = this.generateSessionId();
    this.initAutoTracking();
    this.startQueueFlush();
  }

  /**
   * Tracker un événement
   */
  track(eventType: string, data: TrackingEventData = {}): void {
    const event: TrackingEvent = {
      event_type: eventType,
      category: data.category,
      action: data.action,
      label: data.label,
      value: data.value,
      data: {
        ...data.data,
        session_id: this.sessionId,
        timestamp: Date.now(),
        page_url: window.location.href,
        page_title: document.title,
      },
    };

    this.queue.push(event);
  }

  /**
   * Tracker une page vue
   */
  trackPageView(): void {
    this.track('page_view', {
      category: 'navigation',
      action: 'page_view',
      data: {
        referrer: document.referrer,
        user_agent: navigator.userAgent,
      },
    });
  }

  /**
   * Tracker un clic
   */
  trackClick(element: HTMLElement, context: any = {}): void {
    this.track('click', {
      category: 'interaction',
      action: 'click',
      label: this.getElementSelector(element),
      data: {
        element_tag: element.tagName.toLowerCase(),
        element_text: element.textContent?.substring(0, 100),
        ...context,
      },
    });
  }

  /**
   * Tracker une conversion
   */
  trackConversion(type: string, value: number = 0, context: any = {}): void {
    this.track('conversion', {
      category: 'business',
      action: type,
      value: Math.round(value * 100), // En centimes
      data: {
        conversion_value: value,
        ...context,
      },
    });
  }

  /**
   * Initialiser le tracking automatique
   */
  private initAutoTracking(): void {
    // Page vue automatique
    this.trackPageView();

    // Tracking des clics automatique
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Tracker les liens et boutons
      if (target.matches('a, button, [data-track]')) {
        this.trackClick(target);
      }
    });

    // Tracking du scroll
    let scrollTracked = false;
    window.addEventListener('scroll', () => {
      if (!scrollTracked && window.scrollY > 0) {
        this.track('scroll', {
          category: 'engagement',
          action: 'scroll_start',
        });
        scrollTracked = true;
      }
    });

    // Tracking de la fermeture de page
    window.addEventListener('beforeunload', () => {
      this.flush(true); // Flush synchrone
    });
  }

  /**
   * Vider la queue d'événements
   */
  private async flush(sync: boolean = false): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      const response = await fetch(`${this.apiEndpoint}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(events),
        keepalive: sync,
      });

      if (!response.ok) {
        console.warn('Failed to send tracking events:', response.statusText);
        // Remettre les événements dans la queue en cas d'échec
        this.queue.unshift(...events);
      }
    } catch (error) {
      console.warn('Error sending tracking events:', error);
      this.queue.unshift(...events);
    }
  }

  /**
   * Démarrer le flush automatique de la queue
   */
  private startQueueFlush(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Générer un ID de session unique
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Obtenir un sélecteur CSS pour un élément
   */
  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }
}

// Interfaces TypeScript
interface TrackingEvent {
  event_type: string;
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  data?: any;
}

interface TrackingEventData {
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  data?: any;
}

// Export global
declare global {
  interface Window {
    tracker: Tracker;
  }
}

// Initialisation automatique
window.tracker = new Tracker('/api/tracking');
```

## Templates d'Analytics (Admin)

### Dashboard analytics

```twig
{% extends '@admin/layout.html.twig' %}

{% block title %}Analytics{% endblock %}

{% block content %}
<div class="analytics-dashboard">
    <!-- Métriques temps réel -->
    <div class="real-time-section">
        <h2>Temps réel</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Utilisateurs actifs</h3>
                <span class="metric-value">{{ real_time_metrics.active_users }}</span>
            </div>
            <div class="metric-card">
                <h3>Pages vues (1h)</h3>
                <span class="metric-value">{{ real_time_metrics.page_views_last_hour }}</span>
            </div>
            <div class="metric-card">
                <h3>Erreurs (1h)</h3>
                <span class="metric-value">{{ real_time_metrics.errors_last_hour }}</span>
            </div>
        </div>
    </div>

    <!-- Rapport quotidien -->
    <div class="daily-report-section">
        <h2>Rapport du jour</h2>
        <div class="charts-container">
            <div class="chart">
                <h3>Pages les plus visitées</h3>
                <canvas id="topPagesChart"></canvas>
            </div>
            <div class="chart">
                <h3>Répartition des devices</h3>
                <canvas id="deviceChart"></canvas>
            </div>
        </div>
    </div>

    <!-- Anomalies détectées -->
    <div class="anomalies-section" id="anomaliesSection" style="display: none;">
        <h2>Anomalies détectées</h2>
        <div class="anomalies-list" id="anomaliesList"></div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les graphiques
    initializeCharts();

    // Vérifier les anomalies
    checkAnomalies();

    // Mise à jour temps réel toutes les 30 secondes
    setInterval(updateRealTimeMetrics, 30000);
});

function initializeCharts() {
    // Graphique des top pages
    const topPagesChart = new Chart('topPagesChart', {
        type: 'bar',
        data: {
            labels: {{ daily_report.top_pages|map(p => p.page_url)|json_encode|raw }},
            datasets: [{
                label: 'Pages vues',
                data: {{ daily_report.top_pages|map(p => p.views)|json_encode|raw }},
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Graphique des devices
    const deviceChart = new Chart('deviceChart', {
        type: 'doughnut',
        data: {
            labels: Object.keys({{ daily_report.device_breakdown|json_encode|raw }}),
            datasets: [{
                data: Object.values({{ daily_report.device_breakdown|json_encode|raw }}),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 205, 86, 0.2)'
                ]
            }]
        },
        options: { responsive: true }
    });
}

async function checkAnomalies() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/admin/analytics/anomalies/${today}`);
        const anomalies = await response.json();

        if (anomalies.length > 0) {
            displayAnomalies(anomalies);
        }
    } catch (error) {
        console.error('Error checking anomalies:', error);
    }
}

function displayAnomalies(anomalies) {
    const section = document.getElementById('anomaliesSection');
    const list = document.getElementById('anomaliesList');

    list.innerHTML = '';

    anomalies.forEach(anomaly => {
        const item = document.createElement('div');
        item.className = `anomaly-item severity-${anomaly.severity}`;
        item.innerHTML = `
            <h4>${anomaly.metric}</h4>
            <p>Valeur actuelle: ${anomaly.current_value}</p>
            <p>Moyenne: ${anomaly.average_value}</p>
            <p>Variation: ${anomaly.change_percent}%</p>
        `;
        list.appendChild(item);
    });

    section.style.display = 'block';
}
</script>
{% endblock %}
```

## Configuration et Optimisation

### Configuration du tracking

```yaml
# config/packages/tracking.yaml
tracking:
  enabled: true
  anonymize_ip: true
  session_timeout: 1800 # 30 minutes
  batch_size: 50
  flush_interval: 5000 # 5 secondes

  # Filtres d'événements
  filters:
    ignore_bots: true
    ignore_dev_environment: true

  # Rétention des données
  retention:
    raw_events: 90 # jours
    aggregated_data: 365 # jours
```

## Routes et Endpoints

### API publique

- `POST /api/tracking/event` : Tracker un événement
- `POST /api/tracking/page-view` : Tracker une page vue
- `POST /api/tracking/batch` : Tracker plusieurs événements

### Interface d'administration

- `GET /admin/analytics` : Dashboard analytics
- `GET /admin/analytics/report/{date}` : Rapport quotidien
- `POST /admin/analytics/funnel` : Analyse tunnel conversion
- `GET /admin/analytics/anomalies/{date}` : Détection anomalies

## Privacy et RGPD

### Respect de la vie privée

- **Anonymisation IP** : Masquage automatique des adresses IP
- **Opt-out** : Possibilité de désactiver le tracking
- **Rétention limitée** : Suppression automatique des données anciennes
- **Données minimales** : Collecte uniquement des données nécessaires

### Conformité RGPD

- Consentement explicite pour le tracking
- Droit à l'effacement des données
- Portabilité des données utilisateur
- Transparence sur la collecte et l'usage

## Interdépendances

### Modules utilisés

- **UserManagement** : Association des événements aux utilisateurs
- **Cache** : Stockage des métriques en temps réel
- **Queue** : Traitement asynchrone des événements

### Services externes

- **DeviceDetector** : Détection des appareils et navigateurs
- **GeoIP** : Géolocalisation par IP
- **Redis** : Cache haute performance pour les compteurs

Le module de tracking fournit une infrastructure complète pour comprendre et optimiser l'usage de l'application tout en respectant la vie privée des utilisateurs.
