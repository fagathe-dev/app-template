# Module d'Administration

## Vue d'ensemble

Le module d'administration (AdminBundle) constitue l'interface de gestion complète de l'application. Il fournit un tableau de bord centralisé pour administrer les utilisateurs, le contenu, les demandes et l'ensemble des données de l'application avec des permissions granulaires et une interface moderne.

## Rôle et Responsabilités

### Fonctionnalités principales

- **Tableau de bord** : Vue d'ensemble avec métriques et statistiques
- **Gestion des utilisateurs** : CRUD complet avec rôles et permissions
- **Administration du contenu** : Gestion des demandes, fichiers, SEO
- **Outils de monitoring** : Logs, events de tracking, performances
- **Configuration** : Paramètres système et fonctionnalités
- **Exports et rapports** : Génération de données au format Excel/CSV

## Architecture du Bundle

### Structure des répertoires

```
admin/
├─ config/
│  └─ services.yaml              # Configuration services AdminBundle
├─ src/
│  ├─ AdminBundle.php           # Classe principale du bundle
│  ├─ Controller/               # Contrôleurs admin
│  │  ├─ AdminController.php    # Dashboard principal
│  │  ├─ UserController.php     # Gestion utilisateurs
│  │  ├─ RequestController.php  # Gestion des demandes
│  │  ├─ FileController.php     # Gestion des fichiers
│  │  └─ SeoController.php      # Interface SEO
│  ├─ Form/                     # Formulaires spécifiques admin
│  │  ├─ UserType.php          # Formulaire utilisateur admin
│  │  ├─ RequestType.php       # Formulaire demandes
│  │  └─ SeoType.php           # Formulaire SEO
│  └─ Service/                  # Services métier admin
│     ├─ AdminService.php      # Service principal admin
│     ├─ DashboardService.php  # Service tableau de bord
│     └─ ExportService.php     # Service d'export
└─ templates/
   ├─ layout.html.twig          # Layout admin avec sidebar
   ├─ index.html.twig           # Dashboard principal
   ├─ components/               # Composants réutilisables
   │  ├─ stats-card.html.twig   # Cartes statistiques
   │  ├─ data-table.html.twig   # Tableaux de données
   │  └─ modal.html.twig        # Fenêtres modales
   ├─ user/                     # Templates gestion users
   ├─ request/                  # Templates gestion demandes
   ├─ file/                     # Templates gestion fichiers
   └─ seo/                      # Templates gestion SEO
```

## Services Principaux

### AdminService (Admin\Service\AdminService)

Service principal orchestrant les fonctionnalités d'administration.

```php
final class AdminService
{
    use ResponseTrait, DateTimeTrait;

    private const LOG_FILE = 'admin/admin-service';

    public function __construct(
        private UserRepository $userRepository,
        private RequestRepository $requestRepository,
        private FileRepository $fileRepository,
        private EntityManagerInterface $manager,
        private Security $security,
        private PaginatorInterface $paginator
    ) {}

    /**
     * Récupérer les métriques du dashboard
     */
    public function getDashboardMetrics(): array
    {
        return [
            'users' => [
                'total' => $this->userRepository->count([]),
                'active' => $this->userRepository->count(['active' => true]),
                'new_this_month' => $this->userRepository->countNewThisMonth(),
                'admins' => $this->userRepository->countByRole('ROLE_ADMIN')
            ],
            'requests' => [
                'total' => $this->requestRepository->count([]),
                'pending' => $this->requestRepository->countPending(),
                'completed' => $this->requestRepository->countCompleted(),
                'this_week' => $this->requestRepository->countThisWeek()
            ],
            'files' => [
                'total' => $this->fileRepository->count([]),
                'total_size' => $this->fileRepository->getTotalSize(),
                'images' => $this->fileRepository->countByType('image'),
                'documents' => $this->fileRepository->countByType('document')
            ],
            'system' => [
                'disk_usage' => $this->getSystemDiskUsage(),
                'memory_usage' => $this->getSystemMemoryUsage(),
                'cache_size' => $this->getCacheSize()
            ]
        ];
    }

    /**
     * Recherche globale dans l'admin
     */
    public function globalSearch(string $query, int $page = 1): array
    {
        $results = [
            'users' => $this->userRepository->search($query),
            'requests' => $this->requestRepository->search($query),
            'files' => $this->fileRepository->search($query)
        ];

        return [
            'results' => $results,
            'total' => array_sum(array_map('count', $results)),
            'query' => $query,
            'page' => $page
        ];
    }
}
```

### DashboardService (Admin\Service\DashboardService)

Service spécialisé pour les données du tableau de bord.

```php
final class DashboardService
{
    use DateTimeTrait;

    public function __construct(
        private EntityManagerInterface $manager,
        private CacheInterface $cache
    ) {}

    /**
     * Obtenir les statistiques avec cache
     */
    public function getStatistics(): array
    {
        return $this->cache->get('admin_dashboard_stats', function () {
            return $this->calculateStatistics();
        });
    }

    /**
     * Calcul des statistiques temps réel
     */
    private function calculateStatistics(): array
    {
        $connection = $this->manager->getConnection();

        // Statistiques utilisateurs
        $userStats = $connection->executeQuery("
            SELECT
                COUNT(*) as total_users,
                COUNT(CASE WHEN active = 1 THEN 1 END) as active_users,
                COUNT(CASE WHEN registered_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_month
            FROM `user`
        ")->fetchAssociative();

        // Statistiques des demandes
        $requestStats = $connection->executeQuery("
            SELECT
                COUNT(*) as total_requests,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as requests_week
            FROM request
        ")->fetchAssociative();

        // Évolution mensuelle
        $monthlyEvolution = $connection->executeQuery("
            SELECT
                MONTH(registered_at) as month,
                YEAR(registered_at) as year,
                COUNT(*) as count
            FROM `user`
            WHERE registered_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY YEAR(registered_at), MONTH(registered_at)
            ORDER BY year DESC, month DESC
        ")->fetchAllAssociative();

        return [
            'users' => $userStats,
            'requests' => $requestStats,
            'evolution' => $monthlyEvolution,
            'updated_at' => $this->now()
        ];
    }

    /**
     * Données pour les graphiques
     */
    public function getChartData(): array
    {
        return [
            'user_registration' => $this->getUserRegistrationChart(),
            'request_status' => $this->getRequestStatusChart(),
            'activity_timeline' => $this->getActivityTimelineChart()
        ];
    }
}
```

### ExportService (Admin\Service\ExportService)

Service de génération d'exports (Excel, CSV, PDF).

```php
final class ExportService
{
    public function __construct(
        private EntityManagerInterface $manager,
        private KernelInterface $kernel
    ) {}

    /**
     * Exporter les utilisateurs au format Excel
     */
    public function exportUsers(array $filters = []): string
    {
        $qb = $this->manager->createQueryBuilder()
            ->select('u')
            ->from(User::class, 'u');

        // Application des filtres
        if (!empty($filters['role'])) {
            $qb->andWhere('u.roles LIKE :role')
               ->setParameter('role', '%' . $filters['role'] . '%');
        }

        if (!empty($filters['active'])) {
            $qb->andWhere('u.active = :active')
               ->setParameter('active', $filters['active']);
        }

        $users = $qb->getQuery()->getResult();

        // Génération du fichier Excel
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // En-têtes
        $headers = ['ID', 'Username', 'Email', 'Prénom', 'Nom', 'Rôles', 'Actif', 'Inscrit le'];
        $sheet->fromArray($headers, null, 'A1');

        // Données
        $row = 2;
        foreach ($users as $user) {
            $sheet->fromArray([
                $user->getId(),
                $user->getUsername(),
                $user->getEmail(),
                $user->getFirstname(),
                $user->getLastname(),
                implode(', ', $user->getRoles()),
                $user->isActive() ? 'Oui' : 'Non',
                $user->getRegisteredAt()->format('d/m/Y H:i')
            ], null, 'A' . $row);
            $row++;
        }

        // Style
        $this->styleExcelSheet($sheet, count($headers));

        // Sauvegarde
        $filename = 'export_users_' . date('Y-m-d_H-i-s') . '.xlsx';
        $filepath = $this->kernel->getProjectDir() . '/var/exports/' . $filename;

        $writer = new Xlsx($spreadsheet);
        $writer->save($filepath);

        return $filename;
    }

    /**
     * Exporter les données au format CSV
     */
    public function exportToCsv(string $entity, array $filters = []): string
    {
        $repository = $this->manager->getRepository($entity);
        $data = $repository->findBy($filters);

        $filename = 'export_' . strtolower($entity) . '_' . date('Y-m-d_H-i-s') . '.csv';
        $filepath = $this->kernel->getProjectDir() . '/var/exports/' . $filename;

        $handle = fopen($filepath, 'w');

        // En-têtes CSV
        if (!empty($data)) {
            $headers = $this->getEntityHeaders($entity);
            fputcsv($handle, $headers);

            // Données
            foreach ($data as $item) {
                $row = $this->entityToArray($item);
                fputcsv($handle, $row);
            }
        }

        fclose($handle);
        return $filename;
    }
}
```

## Contrôleurs d'Administration

### AdminController (Dashboard principal)

```php
#[Route('/admin', name: 'admin_')]
final class AdminController extends AbstractController
{
    public function __construct(
        private AdminService $adminService,
        private DashboardService $dashboardService
    ) {}

    #[Route('', name: 'index', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function index(): Response
    {
        $metrics = $this->adminService->getDashboardMetrics();
        $chartData = $this->dashboardService->getChartData();

        return $this->render('@admin/index.html.twig', [
            'metrics' => $metrics,
            'charts' => $chartData,
            'user' => $this->getUser()
        ]);
    }

    #[Route('/search', name: 'search', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function search(Request $request): Response
    {
        $query = $request->query->get('q', '');
        $page = $request->query->getInt('page', 1);

        if (empty($query)) {
            return $this->json(['error' => 'Query required'], 400);
        }

        $results = $this->adminService->globalSearch($query, $page);

        return $this->json($results);
    }

    #[Route('/export/{type}', name: 'export', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function export(string $type, Request $request): Response
    {
        $filters = $request->request->all();

        try {
            $filename = match($type) {
                'users' => $this->exportService->exportUsers($filters),
                'requests' => $this->exportService->exportRequests($filters),
                default => throw new BadRequestException('Invalid export type')
            };

            return $this->json([
                'success' => true,
                'filename' => $filename,
                'download_url' => $this->generateUrl('admin_download', ['file' => $filename])
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }
}
```

### UserController (Gestion des utilisateurs)

```php
#[Route('/admin/user', name: 'admin_user_')]
final class UserController extends AbstractController
{
    public function __construct(
        private UserService $userService,
        private PaginatorInterface $paginator
    ) {}

    #[Route('', name: 'index', methods: ['GET'])]
    #[IsGranted('admin.user.list')]
    public function index(Request $request): Response
    {
        $page = $request->query->getInt('page', 1);
        $search = $request->query->get('search', '');
        $role = $request->query->get('role', '');

        $queryBuilder = $this->userService->getUsersQueryBuilder($search, $role);

        $pagination = $this->paginator->paginate(
            $queryBuilder,
            $page,
            20
        );

        return $this->render('@admin/user/index.html.twig', [
            'pagination' => $pagination,
            'search' => $search,
            'role' => $role,
            'roles' => RoleEnum::choices()
        ]);
    }

    #[Route('/create', name: 'create', methods: ['GET', 'POST'])]
    #[IsGranted('admin.user.create')]
    public function create(Request $request): Response
    {
        $user = new User();
        $form = $this->createForm(UserType::class, $user);

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            if ($this->userService->create($user)) {
                $this->addFlash('success', 'Utilisateur créé avec succès');
                return $this->redirectToRoute('admin_user_index');
            }
        }

        return $this->render('@admin/user/create.html.twig', [
            'form' => $form,
            'user' => $user
        ]);
    }

    #[Route('/{id}/edit', name: 'edit', methods: ['GET', 'POST'])]
    #[IsGranted('admin.user.edit')]
    public function edit(User $user, Request $request): Response
    {
        $form = $this->createForm(UserType::class, $user);

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            if ($this->userService->update($user)) {
                $this->addFlash('success', 'Utilisateur modifié avec succès');
                return $this->redirectToRoute('admin_user_index');
            }
        }

        return $this->render('@admin/user/edit.html.twig', [
            'form' => $form,
            'user' => $user
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('admin.user.delete')]
    public function delete(User $user): JsonResponse
    {
        try {
            $this->userService->delete($user);
            return $this->json(['success' => true]);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }

    #[Route('/bulk-action', name: 'bulk_action', methods: ['POST'])]
    #[IsGranted('admin.user.bulk_edit')]
    public function bulkAction(Request $request): JsonResponse
    {
        $action = $request->request->get('action');
        $userIds = $request->request->all('user_ids');

        return match($action) {
            'activate' => $this->userService->bulkActivate($userIds),
            'deactivate' => $this->userService->bulkDeactivate($userIds),
            'delete' => $this->userService->bulkDelete($userIds),
            default => $this->json(['error' => 'Action invalide'], 400)
        };
    }
}
```

## Templates et Interface Utilisateur

### Layout principal (layout.html.twig)

```twig
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}Administration{% endblock %}</title>

    {{ encore_entry_link_tags('admin') }}
    {{ encore_entry_link_tags('app') }}
</head>
<body class="admin-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="sidebar-header">
            <h2>{{ app.name }}</h2>
        </div>

        <nav class="sidebar-nav">
            <ul>
                <li><a href="{{ path('admin_index') }}" class="nav-link">
                    <i class="icon-dashboard"></i> Tableau de bord
                </a></li>

                {% if is_granted('admin.user.list') %}
                <li><a href="{{ path('admin_user_index') }}" class="nav-link">
                    <i class="icon-users"></i> Utilisateurs
                </a></li>
                {% endif %}

                {% if is_granted('admin.request.list') %}
                <li><a href="{{ path('admin_request_index') }}" class="nav-link">
                    <i class="icon-requests"></i> Demandes
                </a></li>
                {% endif %}

                {% if is_granted('admin.file.list') %}
                <li><a href="{{ path('admin_file_index') }}" class="nav-link">
                    <i class="icon-files"></i> Fichiers
                </a></li>
                {% endif %}

                {% if is_granted('admin.seo.manage') %}
                <li><a href="{{ path('admin_seo_index') }}" class="nav-link">
                    <i class="icon-seo"></i> SEO
                </a></li>
                {% endif %}
            </ul>
        </nav>
    </aside>

    <!-- Main content -->
    <main class="main-content">
        <!-- Top bar -->
        <header class="topbar">
            <div class="topbar-left">
                <button class="sidebar-toggle">☰</button>
                <h1>{% block page_title %}Administration{% endblock %}</h1>
            </div>

            <div class="topbar-right">
                <div class="search-box">
                    <input type="search" placeholder="Rechercher..." id="global-search">
                </div>

                <div class="user-menu">
                    <span>{{ app.user.username }}</span>
                    <a href="{{ path('auth_logout') }}">Déconnexion</a>
                </div>
            </div>
        </header>

        <!-- Content area -->
        <div class="content">
            {% include '@admin/components/flash-messages.html.twig' %}

            {% block content %}{% endblock %}
        </div>
    </main>

    {{ encore_entry_script_tags('admin') }}
    {{ encore_entry_script_tags('app') }}
</body>
</html>
```

### Dashboard (index.html.twig)

```twig
{% extends '@admin/layout.html.twig' %}

{% block page_title %}Tableau de bord{% endblock %}

{% block content %}
<div class="dashboard">
    <!-- Cartes de statistiques -->
    <div class="stats-grid">
        {% include '@admin/components/stats-card.html.twig' with {
            'title': 'Utilisateurs',
            'value': metrics.users.total,
            'change': '+' ~ metrics.users.new_this_month ~ ' ce mois',
            'icon': 'users',
            'color': 'blue'
        } %}

        {% include '@admin/components/stats-card.html.twig' with {
            'title': 'Demandes',
            'value': metrics.requests.total,
            'change': metrics.requests.pending ~ ' en attente',
            'icon': 'requests',
            'color': 'green'
        } %}

        {% include '@admin/components/stats-card.html.twig' with {
            'title': 'Fichiers',
            'value': metrics.files.total,
            'change': (metrics.files.total_size / 1024 / 1024)|round(2) ~ ' MB',
            'icon': 'files',
            'color': 'purple'
        } %}

        {% include '@admin/components/stats-card.html.twig' with {
            'title': 'Système',
            'value': metrics.system.disk_usage ~ '%',
            'change': 'Disque utilisé',
            'icon': 'server',
            'color': 'orange'
        } %}
    </div>

    <!-- Graphiques -->
    <div class="charts-grid">
        <div class="chart-container">
            <h3>Inscriptions mensuelles</h3>
            <canvas id="userRegistrationChart"></canvas>
        </div>

        <div class="chart-container">
            <h3>Statut des demandes</h3>
            <canvas id="requestStatusChart"></canvas>
        </div>
    </div>

    <!-- Tables récentes -->
    <div class="recent-data">
        <div class="recent-users">
            <h3>Utilisateurs récents</h3>
            {% include '@admin/components/data-table.html.twig' with {
                'data': recent_users,
                'columns': ['username', 'email', 'registered_at'],
                'actions': ['view', 'edit']
            } %}
        </div>

        <div class="recent-requests">
            <h3>Demandes récentes</h3>
            {% include '@admin/components/data-table.html.twig' with {
                'data': recent_requests,
                'columns': ['title', 'user', 'status', 'created_at'],
                'actions': ['view', 'edit']
            } %}
        </div>
    </div>
</div>

<script>
// Initialisation des graphiques
document.addEventListener('DOMContentLoaded', function() {
    // Graphique inscriptions
    const userChart = new Chart('userRegistrationChart', {
        type: 'line',
        data: {{ charts.user_registration|json_encode|raw }},
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Graphique statuts demandes
    const requestChart = new Chart('requestStatusChart', {
        type: 'doughnut',
        data: {{ charts.request_status|json_encode|raw }},
        options: { responsive: true }
    });
});
</script>
{% endblock %}
```

## Permissions et Sécurité

### Système de permissions granulaires

```yaml
# config/packages/security.yaml
security:
  access_control:
    - { path: ^/admin/login, roles: PUBLIC_ACCESS }
    - { path: ^/admin, roles: ROLE_ADMIN }

  role_hierarchy:
    ROLE_EDITOR: ROLE_USER
    ROLE_ADMIN: [ROLE_USER, ROLE_EDITOR]
    ROLE_SUPER_ADMIN: [ROLE_ADMIN]
```

### Permissions spécifiques

```php
// Permissions par module
const ADMIN_PERMISSIONS = [
    'admin.dashboard.view' => 'ROLE_ADMIN',
    'admin.user.list' => 'ROLE_ADMIN',
    'admin.user.create' => 'ROLE_ADMIN',
    'admin.user.edit' => 'ROLE_ADMIN',
    'admin.user.delete' => 'ROLE_SUPER_ADMIN',
    'admin.user.bulk_edit' => 'ROLE_SUPER_ADMIN',
    'admin.request.list' => 'ROLE_EDITOR',
    'admin.request.manage' => 'ROLE_ADMIN',
    'admin.file.list' => 'ROLE_EDITOR',
    'admin.file.upload' => 'ROLE_ADMIN',
    'admin.seo.manage' => 'ROLE_ADMIN',
    'admin.export.generate' => 'ROLE_ADMIN'
];
```

## Routes et API

### Routes principales

- `GET /admin` : Dashboard principal
- `GET /admin/search` : Recherche globale (AJAX)
- `POST /admin/export/{type}` : Génération d'exports
- `GET /admin/download/{file}` : Téléchargement de fichiers

### API REST

```typescript
// Client API TypeScript pour l'admin
class AdminAPI {
  async getDashboardStats(): Promise<DashboardStats> {
    return fetchGET('/admin/api/stats');
  }

  async globalSearch(query: string): Promise<SearchResults> {
    return fetchGET(`/admin/search?q=${encodeURIComponent(query)}`);
  }

  async exportData(type: string, filters: any): Promise<ExportResponse> {
    return fetchPOST(`/admin/export/${type}`, filters);
  }

  async bulkAction(entity: string, action: string, ids: number[]): Promise<BulkResponse> {
    return fetchPOST(`/admin/${entity}/bulk-action`, { action, ids });
  }
}
```

## Composants Frontend

### Scripts TypeScript

```
public/ts/admin/
├─ dashboard.ts          # Logique tableau de bord
├─ data-table.ts         # Composant tableau avec tri/pagination
├─ bulk-actions.ts       # Actions en lot
├─ export.ts             # Gestion des exports
├─ search.ts             # Recherche globale
└─ charts.ts             # Graphiques Chart.js
```

### Styles SCSS

```
public/scss/admin/
├─ layout.scss           # Layout général admin
├─ dashboard.scss        # Styles tableau de bord
├─ data-table.scss       # Styles tableaux
├─ forms.scss            # Formulaires admin
├─ components.scss       # Composants réutilisables
└─ responsive.scss       # Responsive design
```

## Interdépendances

### Modules administrés

- **UserManagement** : Gestion complète des utilisateurs
- **RequestManagement** : Administration des demandes
- **FileManagement** : Gestion des fichiers uploadés
- **SEO** : Interface de configuration SEO
- **Tracking** : Consultation des événements

### Services externes

- **ExportService** : Génération Excel/CSV
- **CacheService** : Cache des statistiques
- **LoggerService** : Logs d'administration
- **MailerService** : Notifications admin

Le module d'administration offre une interface complète et moderne pour gérer tous les aspects de l'application avec des permissions granulaires, des outils d'export et une expérience utilisateur optimisée.
