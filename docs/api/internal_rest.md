# API REST Interne

## Vue d'ensemble

L'API REST interne fournit une interface programmatique complète pour toutes les fonctionnalités de l'application. Elle permet aux interfaces frontend de communiquer avec le backend via des endpoints standardisés suivant les principes REST et les bonnes pratiques d'architecture API.

## Architecture API

### Principes de conception

- **RESTful** : Respect des conventions REST (GET, POST, PUT, DELETE)
- **Stateless** : Chaque requête contient toutes les informations nécessaires
- **Consistent** : Structure uniforme des réponses et codes d'erreur
- **Secured** : Authentification et autorisation sur tous les endpoints
- **Versioned** : Support de la montée de version avec rétrocompatibilité
- **Documented** : Documentation automatique avec OpenAPI/Swagger

### Structure des URLs

```
/api/v1/{resource}
/api/v1/{resource}/{id}
/api/v1/{resource}/{id}/{sub-resource}
```

### Format des réponses

```json
{
    "success": true,
    "data": { ... },
    "meta": {
        "pagination": { ... },
        "total": 150,
        "page": 1
    },
    "links": {
        "self": "/api/v1/users?page=1",
        "next": "/api/v1/users?page=2",
        "prev": null
    }
}
```

### Gestion des erreurs

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Les données fournies ne sont pas valides",
    "details": {
      "email": ["L'email est requis"],
      "password": ["Le mot de passe doit contenir au moins 8 caractères"]
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

## Contrôleurs API

### BaseApiController

```php
abstract class BaseApiController extends AbstractController
{
    protected function jsonResponse(
        mixed $data = null,
        int $status = 200,
        array $headers = [],
        bool $success = true
    ): JsonResponse {
        $response = [
            'success' => $success,
            'data' => $data,
            'meta' => [
                'timestamp' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
                'request_id' => uniqid('req_')
            ]
        ];

        return $this->json($response, $status, $headers);
    }

    protected function jsonError(
        string $message,
        int $status = 400,
        string $code = 'ERROR',
        array $details = []
    ): JsonResponse {
        return $this->jsonResponse([
            'error' => [
                'code' => $code,
                'message' => $message,
                'details' => $details
            ]
        ], $status, [], false);
    }

    protected function jsonValidationError(array $violations): JsonResponse
    {
        $errors = [];
        foreach ($violations as $violation) {
            $errors[$violation->getPropertyPath()][] = $violation->getMessage();
        }

        return $this->jsonError(
            'Les données fournies ne sont pas valides',
            422,
            'VALIDATION_ERROR',
            $errors
        );
    }

    protected function paginatedResponse(
        PaginationInterface $pagination,
        string $routeName,
        array $routeParams = []
    ): JsonResponse {
        $data = iterator_to_array($pagination);

        return $this->jsonResponse($data, 200, [], true, [
            'pagination' => [
                'current_page' => $pagination->getCurrentPageNumber(),
                'total_pages' => $pagination->getPageCount(),
                'per_page' => $pagination->getItemNumberPerPage(),
                'total_items' => $pagination->getTotalItemCount()
            ],
            'links' => [
                'self' => $this->generateUrl($routeName, array_merge($routeParams, ['page' => $pagination->getCurrentPageNumber()])),
                'first' => $this->generateUrl($routeName, array_merge($routeParams, ['page' => 1])),
                'last' => $this->generateUrl($routeName, array_merge($routeParams, ['page' => $pagination->getPageCount()])),
                'prev' => $pagination->getCurrentPageNumber() > 1
                    ? $this->generateUrl($routeName, array_merge($routeParams, ['page' => $pagination->getCurrentPageNumber() - 1]))
                    : null,
                'next' => $pagination->getCurrentPageNumber() < $pagination->getPageCount()
                    ? $this->generateUrl($routeName, array_merge($routeParams, ['page' => $pagination->getCurrentPageNumber() + 1]))
                    : null
            ]
        ]);
    }
}
```

### UserApiController

```php
#[Route('/api/v1/users', name: 'api_v1_users_')]
final class UserApiController extends BaseApiController
{
    public function __construct(
        private UserService $userService,
        private ValidatorInterface $validator,
        private SerializerInterface $serializer
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function list(Request $request): JsonResponse
    {
        $page = $request->query->getInt('page', 1);
        $limit = $request->query->getInt('limit', 20);
        $search = $request->query->get('search', '');
        $role = $request->query->get('role', '');

        $pagination = $this->userService->searchUsers([
            'search' => $search,
            'role' => $role
        ], $page, $limit);

        return $this->paginatedResponse($pagination, 'api_v1_users_list', [
            'search' => $search,
            'role' => $role
        ]);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[IsGranted('view', 'user')]
    public function show(User $user): JsonResponse
    {
        $data = $this->serializer->normalize($user, 'json', ['groups' => ['user:read']]);
        return $this->jsonResponse($data);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $user = new User();
        $this->serializer->denormalize($data, User::class, 'json', [
            'object_to_populate' => $user,
            'groups' => ['user:write']
        ]);

        $violations = $this->validator->validate($user);
        if (count($violations) > 0) {
            return $this->jsonValidationError($violations);
        }

        if ($this->userService->create($user)) {
            $responseData = $this->serializer->normalize($user, 'json', ['groups' => ['user:read']]);
            return $this->jsonResponse($responseData, 201);
        }

        return $this->jsonError('Erreur lors de la création de l\'utilisateur', 500);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    #[IsGranted('edit', 'user')]
    public function update(User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $this->serializer->denormalize($data, User::class, 'json', [
            'object_to_populate' => $user,
            'groups' => ['user:write']
        ]);

        $violations = $this->validator->validate($user);
        if (count($violations) > 0) {
            return $this->jsonValidationError($violations);
        }

        if ($this->userService->update($user)) {
            $responseData = $this->serializer->normalize($user, 'json', ['groups' => ['user:read']]);
            return $this->jsonResponse($responseData);
        }

        return $this->jsonError('Erreur lors de la mise à jour de l\'utilisateur', 500);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[IsGranted('delete', 'user')]
    public function delete(User $user): JsonResponse
    {
        if ($this->userService->delete($user)) {
            return $this->jsonResponse(null, 204);
        }

        return $this->jsonError('Erreur lors de la suppression de l\'utilisateur', 500);
    }

    #[Route('/profile', name: 'profile', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function profile(): JsonResponse
    {
        $user = $this->getUser();
        $data = $this->serializer->normalize($user, 'json', ['groups' => ['user:profile']]);
        return $this->jsonResponse($data);
    }

    #[Route('/profile', name: 'update_profile', methods: ['PUT'])]
    #[IsGranted('ROLE_USER')]
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        // Seuls certains champs peuvent être modifiés
        $allowedFields = ['firstname', 'lastname', 'email'];
        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $this->serializer->denormalize($filteredData, User::class, 'json', [
            'object_to_populate' => $user,
            'groups' => ['user:profile_write']
        ]);

        $violations = $this->validator->validate($user);
        if (count($violations) > 0) {
            return $this->jsonValidationError($violations);
        }

        if ($this->userService->update($user)) {
            $responseData = $this->serializer->normalize($user, 'json', ['groups' => ['user:profile']]);
            return $this->jsonResponse($responseData);
        }

        return $this->jsonError('Erreur lors de la mise à jour du profil', 500);
    }
}
```

### RequestApiController

```php
#[Route('/api/v1/requests', name: 'api_v1_requests_')]
final class RequestApiController extends BaseApiController
{
    public function __construct(
        private RequestService $requestService,
        private ValidatorInterface $validator,
        private SerializerInterface $serializer
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(Request $httpRequest): JsonResponse
    {
        $page = $httpRequest->query->getInt('page', 1);
        $limit = $httpRequest->query->getInt('limit', 20);

        $filters = [
            'status' => $httpRequest->query->get('status'),
            'category' => $httpRequest->query->get('category'),
            'search' => $httpRequest->query->get('search'),
            'date_from' => $httpRequest->query->get('date_from'),
            'date_to' => $httpRequest->query->get('date_to')
        ];

        // Les utilisateurs ne voient que leurs demandes
        if (!$this->isGranted('ROLE_ADMIN')) {
            $filters['user_id'] = $this->getUser()->getId();
        }

        $pagination = $this->requestService->searchRequests($filters, $page, $limit);

        return $this->paginatedResponse($pagination, 'api_v1_requests_list', array_filter($filters));
    }

    #[Route('/{id}', name: 'show', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[IsGranted('view', 'request')]
    public function show(\App\Entity\Request $request): JsonResponse
    {
        $data = $this->serializer->normalize($request, 'json', [
            'groups' => ['request:read', 'user:read', 'file:read']
        ]);
        return $this->jsonResponse($data);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(Request $httpRequest): JsonResponse
    {
        $data = json_decode($httpRequest->getContent(), true);

        $request = new \App\Entity\Request();
        $this->serializer->denormalize($data, \App\Entity\Request::class, 'json', [
            'object_to_populate' => $request,
            'groups' => ['request:write']
        ]);

        $violations = $this->validator->validate($request);
        if (count($violations) > 0) {
            return $this->jsonValidationError($violations);
        }

        if ($this->requestService->createRequest($request)) {
            $responseData = $this->serializer->normalize($request, 'json', ['groups' => ['request:read']]);
            return $this->jsonResponse($responseData, 201);
        }

        return $this->jsonError('Erreur lors de la création de la demande', 500);
    }

    #[Route('/{id}/status', name: 'update_status', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_ADMIN')]
    public function updateStatus(\App\Entity\Request $request, Request $httpRequest): JsonResponse
    {
        $data = json_decode($httpRequest->getContent(), true);

        if (!isset($data['status'])) {
            return $this->jsonError('Le statut est requis', 400);
        }

        try {
            $newStatus = RequestStatusEnum::from($data['status']);
        } catch (\ValueError $e) {
            return $this->jsonError('Statut invalide', 400);
        }

        $comment = $data['comment'] ?? null;
        $assignedTo = null;

        if (isset($data['assigned_to_id'])) {
            $assignedTo = $this->userService->findById($data['assigned_to_id']);
            if (!$assignedTo) {
                return $this->jsonError('Utilisateur assigné non trouvé', 400);
            }
        }

        if ($this->requestService->updateStatus($request, $newStatus, $comment, $assignedTo)) {
            $responseData = $this->serializer->normalize($request, 'json', ['groups' => ['request:read']]);
            return $this->jsonResponse($responseData);
        }

        return $this->jsonError('Erreur lors de la mise à jour du statut', 500);
    }

    #[Route('/{id}/comments', name: 'add_comment', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[IsGranted('view', 'request')]
    public function addComment(\App\Entity\Request $request, Request $httpRequest): JsonResponse
    {
        $data = json_decode($httpRequest->getContent(), true);

        if (!isset($data['comment']) || empty(trim($data['comment']))) {
            return $this->jsonError('Le commentaire est requis', 400);
        }

        if ($this->requestService->addComment($request, trim($data['comment']))) {
            return $this->jsonResponse(['message' => 'Commentaire ajouté avec succès'], 201);
        }

        return $this->jsonError('Erreur lors de l\'ajout du commentaire', 500);
    }

    #[Route('/statistics', name: 'statistics', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function statistics(Request $request): JsonResponse
    {
        $from = new \DateTimeImmutable($request->query->get('from', '-30 days'));
        $to = new \DateTimeImmutable($request->query->get('to', 'now'));

        $statistics = $this->requestService->getStatistics($from, $to);

        return $this->jsonResponse($statistics);
    }
}
```

## Serialization et Groupes

### Configuration des groupes Symfony Serializer

```php
// Entity/User.php
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[Groups(['user:read', 'user:profile'])]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    #[Groups(['user:read', 'user:write', 'user:profile', 'user:profile_write'])]
    #[Assert\NotBlank(groups: ['user:write'])]
    #[Assert\Email(groups: ['user:write', 'user:profile_write'])]
    private ?string $email = null;

    #[ORM\Column]
    #[Groups(['user:write'])]
    #[Assert\NotBlank(groups: ['user:write'])]
    private ?string $password = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['user:read', 'user:write', 'user:profile', 'user:profile_write'])]
    private ?string $firstname = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['user:read', 'user:write', 'user:profile', 'user:profile_write'])]
    private ?string $lastname = null;

    #[ORM\Column(length: 100)]
    #[Groups(['user:read', 'user:write'])]
    #[Assert\NotBlank(groups: ['user:write'])]
    private ?string $username = null;

    #[ORM\Column]
    #[Groups(['user:read'])]
    private array $roles = [];

    #[ORM\Column]
    #[Groups(['user:read'])]
    private ?\DateTimeImmutable $registered_at = null;

    #[ORM\Column]
    #[Groups(['user:read', 'user:write'])]
    private ?bool $active = null;

    // ...
}
```

## Validation et DTOs

### RequestCreateDto

```php
class RequestCreateDto
{
    #[Assert\NotBlank]
    #[Assert\Length(max: 255)]
    public string $title;

    #[Assert\NotBlank]
    public string $description;

    #[Assert\Choice(choices: ['support', 'information', 'bug', 'feature', 'other'])]
    public string $category;

    #[Assert\Choice(choices: ['low', 'normal', 'high', 'urgent'])]
    public string $priority = 'normal';

    #[Assert\Type('\DateTimeInterface')]
    public ?\DateTimeInterface $due_date = null;

    public array $metadata = [];

    public function toEntity(): \App\Entity\Request
    {
        $request = new \App\Entity\Request();
        $request->setTitle($this->title)
               ->setDescription($this->description)
               ->setCategory($this->category)
               ->setPriority($this->priority)
               ->setDueDate($this->due_date)
               ->setMetadata($this->metadata);

        return $request;
    }
}
```

## Middleware et Event Listeners

### ApiExceptionListener

```php
class ApiExceptionListener
{
    public function __construct(
        private LoggerInterface $logger,
        private bool $debug = false
    ) {}

    public function onKernelException(ExceptionEvent $event): void
    {
        $request = $event->getRequest();

        // Ne traiter que les requêtes API
        if (!str_starts_with($request->getPathInfo(), '/api/')) {
            return;
        }

        $throwable = $event->getThrowable();

        $response = match(true) {
            $throwable instanceof NotFoundHttpException => $this->createErrorResponse(
                'Ressource non trouvée',
                404,
                'RESOURCE_NOT_FOUND'
            ),
            $throwable instanceof AccessDeniedException => $this->createErrorResponse(
                'Accès refusé',
                403,
                'ACCESS_DENIED'
            ),
            $throwable instanceof AuthenticationException => $this->createErrorResponse(
                'Authentification requise',
                401,
                'AUTHENTICATION_REQUIRED'
            ),
            $throwable instanceof ValidationException => $this->createValidationErrorResponse($throwable),
            default => $this->createErrorResponse(
                $this->debug ? $throwable->getMessage() : 'Erreur interne du serveur',
                500,
                'INTERNAL_SERVER_ERROR'
            )
        };

        // Log de l'erreur
        $this->logger->error('API Exception', [
            'exception' => $throwable->getMessage(),
            'file' => $throwable->getFile(),
            'line' => $throwable->getLine(),
            'request_uri' => $request->getUri()
        ]);

        $event->setResponse($response);
    }

    private function createErrorResponse(string $message, int $status, string $code): JsonResponse
    {
        return new JsonResponse([
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message
            ],
            'meta' => [
                'timestamp' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM)
            ]
        ], $status);
    }

    private function createValidationErrorResponse(ValidationException $exception): JsonResponse
    {
        $errors = [];
        foreach ($exception->getViolations() as $violation) {
            $errors[$violation->getPropertyPath()][] = $violation->getMessage();
        }

        return new JsonResponse([
            'success' => false,
            'error' => [
                'code' => 'VALIDATION_ERROR',
                'message' => 'Les données fournies ne sont pas valides',
                'details' => $errors
            ],
            'meta' => [
                'timestamp' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM)
            ]
        ], 422);
    }
}
```

### RateLimitListener

```php
class RateLimitListener
{
    public function __construct(
        private CacheInterface $cache,
        private int $maxRequests = 100,
        private int $timeWindow = 3600 // 1 heure
    ) {}

    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();

        // Appliquer uniquement aux routes API
        if (!str_starts_with($request->getPathInfo(), '/api/')) {
            return;
        }

        $clientIp = $request->getClientIp();
        $cacheKey = 'rate_limit:' . md5($clientIp);

        $requests = $this->cache->get($cacheKey, function () {
            return ['count' => 0, 'reset_time' => time() + $this->timeWindow];
        });

        // Reset du compteur si la fenêtre de temps est expirée
        if (time() > $requests['reset_time']) {
            $requests = ['count' => 0, 'reset_time' => time() + $this->timeWindow];
        }

        $requests['count']++;

        if ($requests['count'] > $this->maxRequests) {
            $response = new JsonResponse([
                'success' => false,
                'error' => [
                    'code' => 'RATE_LIMIT_EXCEEDED',
                    'message' => 'Trop de requêtes. Veuillez réessayer plus tard.'
                ],
                'meta' => [
                    'rate_limit' => [
                        'limit' => $this->maxRequests,
                        'remaining' => 0,
                        'reset' => $requests['reset_time']
                    ]
                ]
            ], 429);

            $event->setResponse($response);
            return;
        }

        // Sauvegarder le compteur mis à jour
        $this->cache->set($cacheKey, $requests, $this->timeWindow);

        // Ajouter les headers de rate limiting
        $event->getRequest()->attributes->set('rate_limit_headers', [
            'X-RateLimit-Limit' => $this->maxRequests,
            'X-RateLimit-Remaining' => max(0, $this->maxRequests - $requests['count']),
            'X-RateLimit-Reset' => $requests['reset_time']
        ]);
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        $headers = $event->getRequest()->attributes->get('rate_limit_headers', []);

        foreach ($headers as $name => $value) {
            $event->getResponse()->headers->set($name, $value);
        }
    }
}
```

## Documentation API avec OpenAPI

### Configuration OpenAPI

```yaml
# config/packages/nelmio_api_doc.yaml
nelmio_api_doc:
  documentation:
    info:
      title: 'Application API'
      description: "API REST pour l'application"
      version: '1.0.0'
    servers:
      - url: '/api/v1'
        description: 'API v1'
    components:
      securitySchemes:
        Bearer:
          type: http
          scheme: bearer
          bearerFormat: JWT
    security:
      - Bearer: []
  areas:
    path_patterns:
      - ^/api(?!/doc$)
```

### Annotations OpenAPI

```php
#[Route('/api/v1/users', name: 'api_v1_users_')]
#[OA\Tag(name: 'Users')]
final class UserApiController extends BaseApiController
{
    #[Route('', name: 'list', methods: ['GET'])]
    #[OA\Get(
        path: '/api/v1/users',
        summary: 'Liste des utilisateurs',
        security: [['Bearer' => []]],
        parameters: [
            new OA\Parameter(
                name: 'page',
                in: 'query',
                description: 'Numéro de page',
                schema: new OA\Schema(type: 'integer', minimum: 1, default: 1)
            ),
            new OA\Parameter(
                name: 'limit',
                in: 'query',
                description: 'Nombre d\'éléments par page',
                schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 20)
            ),
            new OA\Parameter(
                name: 'search',
                in: 'query',
                description: 'Terme de recherche',
                schema: new OA\Schema(type: 'string')
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Liste des utilisateurs',
                content: new OA\JsonContent(
                    properties: [
                        'success' => new OA\Property(property: 'success', type: 'boolean', example: true),
                        'data' => new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(ref: '#/components/schemas/User')
                        ),
                        'meta' => new OA\Property(
                            property: 'meta',
                            ref: '#/components/schemas/PaginationMeta'
                        )
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 403, description: 'Accès refusé')
        ]
    )]
    public function list(Request $request): JsonResponse
    {
        // Implementation...
    }
}
```

## Client JavaScript pour l'API

### ApiClient TypeScript

```typescript
// public/ts/api/client.ts
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    pagination?: {
      current_page: number;
      total_pages: number;
      per_page: number;
      total_items: number;
    };
    timestamp: string;
    request_id: string;
  };
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  removeToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new ApiError(data.error?.message || 'Erreur API', response.status, data.error);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError('Erreur de connexion', 0, { code: 'NETWORK_ERROR', message: error.message });
    }
  }

  // Méthodes HTTP
  async get<T>(endpoint: string, params: Record<string, any> = {}): Promise<ApiResponse<T>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const url = searchParams.toString() ? `${endpoint}?${searchParams}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // API Resources
  users = {
    list: (params: any = {}) => this.get<User[]>('/users', params),
    show: (id: number) => this.get<User>(`/users/${id}`),
    create: (data: UserCreateData) => this.post<User>('/users', data),
    update: (id: number, data: UserUpdateData) => this.put<User>(`/users/${id}`, data),
    delete: (id: number) => this.delete(`/users/${id}`),
    profile: () => this.get<User>('/users/profile'),
    updateProfile: (data: UserProfileData) => this.put<User>('/users/profile', data),
  };

  requests = {
    list: (params: any = {}) => this.get<Request[]>('/requests', params),
    show: (id: number) => this.get<Request>(`/requests/${id}`),
    create: (data: RequestCreateData) => this.post<Request>('/requests', data),
    updateStatus: (id: number, status: string, comment?: string) =>
      this.patch<Request>(`/requests/${id}/status`, { status, comment }),
    addComment: (id: number, comment: string) => this.post(`/requests/${id}/comments`, { comment }),
    statistics: (from?: string, to?: string) => this.get<RequestStatistics>('/requests/statistics', { from, to }),
  };
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public error?: { code: string; message: string; details?: Record<string, string[]> }
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Export global
const apiClient = new ApiClient();
export default apiClient;
```

## Authentification API

### JWT Authentication

```php
// Security/JwtAuthenticator.php
class JwtAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        private JWTEncoderInterface $jwtEncoder,
        private UserRepository $userRepository
    ) {}

    public function supports(Request $request): ?bool
    {
        return str_starts_with($request->getPathInfo(), '/api/')
            && $request->headers->has('Authorization');
    }

    public function authenticate(Request $request): Passport
    {
        $authHeader = $request->headers->get('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            throw new CustomUserMessageAuthenticationException('Token manquant');
        }

        $token = substr($authHeader, 7);

        try {
            $payload = $this->jwtEncoder->decode($token);
        } catch (JWTDecodeFailureException $e) {
            throw new CustomUserMessageAuthenticationException('Token invalide');
        }

        $user = $this->userRepository->findOneBy(['email' => $payload['email']]);

        if (!$user) {
            throw new CustomUserMessageAuthenticationException('Utilisateur non trouvé');
        }

        return new SelfValidatingPassport(new UserBadge($user->getEmail()));
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse([
            'success' => false,
            'error' => [
                'code' => 'AUTHENTICATION_FAILED',
                'message' => $exception->getMessage()
            ]
        ], 401);
    }
}
```

## Tests API

### Exemples de tests fonctionnels

```php
// tests/Api/UserApiTest.php
class UserApiTest extends ApiTestCase
{
    public function testListUsers(): void
    {
        $this->loginAsAdmin();

        $this->client->request('GET', '/api/v1/users');

        $this->assertResponseIsSuccessful();
        $this->assertJson($this->client->getResponse()->getContent());

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($data['success']);
        $this->assertArrayHasKey('data', $data);
        $this->assertArrayHasKey('meta', $data);
    }

    public function testCreateUser(): void
    {
        $this->loginAsAdmin();

        $userData = [
            'email' => 'test@example.com',
            'username' => 'testuser',
            'password' => 'SecurePass123',
            'firstname' => 'Test',
            'lastname' => 'User'
        ];

        $this->client->request('POST', '/api/v1/users', [], [], [], json_encode($userData));

        $this->assertResponseStatusCodeSame(201);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($data['success']);
        $this->assertEquals($userData['email'], $data['data']['email']);
    }

    public function testUnauthorizedAccess(): void
    {
        $this->client->request('GET', '/api/v1/users');

        $this->assertResponseStatusCodeSame(401);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertFalse($data['success']);
        $this->assertEquals('AUTHENTICATION_REQUIRED', $data['error']['code']);
    }
}
```

## Configuration et Optimisation

### Configuration CORS

```yaml
# config/packages/nelmio_cors.yaml
nelmio_cors:
  defaults:
    origin_regex: true
    allow_origin: ['%env(CORS_ALLOW_ORIGIN)%']
    allow_methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']
    allow_headers: ['Content-Type', 'Authorization']
    expose_headers: ['Link']
    max_age: 3600
  paths:
    '^/api/':
      allow_origin: ['*']
      allow_headers: ['X-Custom-Auth']
      allow_methods: ['POST', 'PUT', 'GET', 'DELETE']
      max_age: 3600
```

### Cache des réponses API

```php
// EventListener/ApiCacheListener.php
class ApiCacheListener
{
    public function onKernelResponse(ResponseEvent $event): void
    {
        $request = $event->getRequest();
        $response = $event->getResponse();

        if (!str_starts_with($request->getPathInfo(), '/api/')) {
            return;
        }

        // Cache uniquement les GET requests réussites
        if ($request->getMethod() === 'GET' && $response->getStatusCode() === 200) {
            $response->setMaxAge(300); // 5 minutes
            $response->setPublic();

            // ETag basé sur le contenu
            $response->setEtag(md5($response->getContent()));
        }
    }
}
```

L'API REST interne fournit une interface robuste, sécurisée et bien documentée pour toutes les fonctionnalités de l'application, avec une gestion d'erreurs cohérente et des performances optimisées.
