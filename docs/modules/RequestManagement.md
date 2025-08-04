# Module de Gestion des Demandes

## Vue d'ensemble

Le module de gestion des demandes constitue le cœur métier de l'application, permettant aux utilisateurs de créer, soumettre et suivre leurs demandes. Il offre un workflow complet avec gestion des statuts, des fichiers attachés, des notifications et un système d'administration pour traiter efficacement les demandes.

## Rôle et Responsabilités

### Fonctionnalités principales

- **Création de demandes** : Interface utilisateur pour soumettre des demandes
- **Gestion du workflow** : Cycle de vie complet avec statuts et transitions
- **Fichiers attachés** : Upload et gestion des documents
- **Notifications** : Alertes email et in-app sur les changements de statut
- **Suivi** : Interface de consultation de l'historique des demandes
- **Administration** : Interface back-office pour traitement des demandes
- **Rapports** : Statistiques et exports des données

## Entités et Modèles Doctrine

### Entité Request

```php
#[ORM\Entity(repositoryClass: RequestRepository::class)]
class Request
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 255)]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Assert\NotBlank]
    private ?string $description = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    private ?string $status = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $category = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $priority = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $metadata = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $admin_notes = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $due_date = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updated_at = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $processed_at = null;

    // Relations
    #[ORM\ManyToOne(inversedBy: 'requests')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?User $assigned_to = null;

    #[ORM\OneToMany(targetEntity: File::class, mappedBy: 'request', cascade: ['persist', 'remove'])]
    private Collection $files;

    #[ORM\OneToMany(targetEntity: RequestHistory::class, mappedBy: 'request', cascade: ['persist', 'remove'])]
    private Collection $history;

    public function __construct()
    {
        $this->files = new ArrayCollection();
        $this->history = new ArrayCollection();
        $this->created_at = new \DateTimeImmutable();
        $this->status = RequestStatusEnum::PENDING->value;
    }

    // Getters et Setters...

    /**
     * Vérifier si la demande peut changer de statut
     */
    public function canTransitionTo(RequestStatusEnum $newStatus): bool
    {
        $currentStatus = RequestStatusEnum::from($this->status);

        return match($currentStatus) {
            RequestStatusEnum::PENDING => in_array($newStatus, [
                RequestStatusEnum::IN_PROGRESS,
                RequestStatusEnum::REJECTED,
                RequestStatusEnum::CANCELLED
            ]),
            RequestStatusEnum::IN_PROGRESS => in_array($newStatus, [
                RequestStatusEnum::COMPLETED,
                RequestStatusEnum::ON_HOLD,
                RequestStatusEnum::REJECTED,
                RequestStatusEnum::CANCELLED
            ]),
            RequestStatusEnum::ON_HOLD => in_array($newStatus, [
                RequestStatusEnum::IN_PROGRESS,
                RequestStatusEnum::CANCELLED
            ]),
            RequestStatusEnum::COMPLETED => false,
            RequestStatusEnum::REJECTED => false,
            RequestStatusEnum::CANCELLED => false
        };
    }
}
```

### Entité File

```php
#[ORM\Entity(repositoryClass: FileRepository::class)]
class File
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private ?string $filename = null;

    #[ORM\Column(length: 255)]
    private ?string $original_filename = null;

    #[ORM\Column(length: 100)]
    private ?string $mime_type = null;

    #[ORM\Column]
    private ?int $file_size = null;

    #[ORM\Column(length: 500)]
    private ?string $file_path = null;

    #[ORM\Column(length: 64, nullable: true)]
    private ?string $hash = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $uploaded_at = null;

    // Relations
    #[ORM\ManyToOne(inversedBy: 'files')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Request $request = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $uploaded_by = null;

    public function __construct()
    {
        $this->uploaded_at = new \DateTimeImmutable();
    }

    // Getters et Setters...

    /**
     * Obtenir l'extension du fichier
     */
    public function getExtension(): string
    {
        return pathinfo($this->original_filename, PATHINFO_EXTENSION);
    }

    /**
     * Obtenir la taille formatée
     */
    public function getFormattedSize(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }
}
```

### Entité RequestHistory

```php
#[ORM\Entity(repositoryClass: RequestHistoryRepository::class)]
class RequestHistory
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'history')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Request $request = null;

    #[ORM\Column(length: 50)]
    private ?string $action = null; // STATUS_CHANGE, COMMENT_ADDED, FILE_UPLOADED, etc.

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $old_value = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $new_value = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $comment = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $metadata = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    public function __construct()
    {
        $this->created_at = new \DateTimeImmutable();
    }

    // Getters et Setters...
}
```

## Énumérations

### RequestStatusEnum

```php
enum RequestStatusEnum: string
{
    case PENDING = 'pending';
    case IN_PROGRESS = 'in_progress';
    case ON_HOLD = 'on_hold';
    case COMPLETED = 'completed';
    case REJECTED = 'rejected';
    case CANCELLED = 'cancelled';

    public function getDisplayName(): string
    {
        return match($this) {
            self::PENDING => 'En attente',
            self::IN_PROGRESS => 'En cours',
            self::ON_HOLD => 'En suspens',
            self::COMPLETED => 'Terminée',
            self::REJECTED => 'Rejetée',
            self::CANCELLED => 'Annulée'
        };
    }

    public function getColor(): string
    {
        return match($this) {
            self::PENDING => 'warning',
            self::IN_PROGRESS => 'info',
            self::ON_HOLD => 'secondary',
            self::COMPLETED => 'success',
            self::REJECTED => 'danger',
            self::CANCELLED => 'dark'
        };
    }

    public function getIcon(): string
    {
        return match($this) {
            self::PENDING => 'clock',
            self::IN_PROGRESS => 'play-circle',
            self::ON_HOLD => 'pause-circle',
            self::COMPLETED => 'check-circle',
            self::REJECTED => 'x-circle',
            self::CANCELLED => 'ban'
        };
    }
}
```

### RequestPriorityEnum

```php
enum RequestPriorityEnum: string
{
    case LOW = 'low';
    case NORMAL = 'normal';
    case HIGH = 'high';
    case URGENT = 'urgent';

    public function getDisplayName(): string
    {
        return match($this) {
            self::LOW => 'Faible',
            self::NORMAL => 'Normale',
            self::HIGH => 'Élevée',
            self::URGENT => 'Urgente'
        };
    }

    public function getColor(): string
    {
        return match($this) {
            self::LOW => 'secondary',
            self::NORMAL => 'primary',
            self::HIGH => 'warning',
            self::URGENT => 'danger'
        };
    }

    public function getSortOrder(): int
    {
        return match($this) {
            self::LOW => 1,
            self::NORMAL => 2,
            self::HIGH => 3,
            self::URGENT => 4
        };
    }
}
```

## Services Principaux

### RequestService (App\Service\RequestService)

Service principal de gestion des demandes.

```php
final class RequestService
{
    use ResponseTrait, DateTimeTrait;

    private const LOG_FILE = 'service/request-service';

    public function __construct(
        private RequestRepository $requestRepository,
        private FileService $fileService,
        private NotificationService $notificationService,
        private EntityManagerInterface $manager,
        private Security $security,
        private PaginatorInterface $paginator
    ) {}

    /**
     * Créer une nouvelle demande
     */
    public function createRequest(Request $request, array $uploadedFiles = []): bool
    {
        try {
            $user = $this->security->getUser();
            if (!$user) {
                throw new \LogicException('Utilisateur non authentifié');
            }

            $request->setUser($user)
                   ->setStatus(RequestStatusEnum::PENDING->value)
                   ->setCreatedAt($this->now());

            $this->manager->persist($request);

            // Traitement des fichiers uploadés
            foreach ($uploadedFiles as $uploadedFile) {
                $file = $this->fileService->handleUpload($uploadedFile, $request, $user);
                $request->getFiles()->add($file);
            }

            // Création de l'historique initial
            $this->createHistoryEntry(
                $request,
                'REQUEST_CREATED',
                null,
                RequestStatusEnum::PENDING->value,
                'Demande créée'
            );

            $this->manager->flush();

            // Notification aux administrateurs
            $this->notificationService->notifyNewRequest($request);

            $this->addFlash('success', 'Votre demande a été soumise avec succès.');
            $this->logInfo('Request created successfully', ['request_id' => $request->getId()]);

            return true;
        } catch (\Exception $e) {
            $this->logError('Failed to create request', $e);
            $this->addFlash('danger', 'Erreur lors de la création de la demande.');
            return false;
        }
    }

    /**
     * Mettre à jour le statut d'une demande
     */
    public function updateStatus(
        Request $request,
        RequestStatusEnum $newStatus,
        ?string $comment = null,
        ?User $assignedTo = null
    ): bool {
        try {
            $oldStatus = RequestStatusEnum::from($request->getStatus());

            // Vérification des transitions autorisées
            if (!$request->canTransitionTo($newStatus)) {
                $this->addFlash('danger', 'Transition de statut non autorisée.');
                return false;
            }

            $request->setStatus($newStatus->value)
                   ->setUpdatedAt($this->now());

            if ($assignedTo) {
                $request->setAssignedTo($assignedTo);
            }

            if ($newStatus === RequestStatusEnum::COMPLETED) {
                $request->setProcessedAt($this->now());
            }

            // Création de l'historique
            $this->createHistoryEntry(
                $request,
                'STATUS_CHANGE',
                $oldStatus->value,
                $newStatus->value,
                $comment
            );

            $this->manager->persist($request);
            $this->manager->flush();

            // Notification à l'utilisateur
            $this->notificationService->notifyStatusChange($request, $oldStatus, $newStatus);

            $this->addFlash('success', 'Statut mis à jour avec succès.');
            $this->logInfo('Request status updated', [
                'request_id' => $request->getId(),
                'old_status' => $oldStatus->value,
                'new_status' => $newStatus->value
            ]);

            return true;
        } catch (\Exception $e) {
            $this->logError('Failed to update request status', $e);
            $this->addFlash('danger', 'Erreur lors de la mise à jour du statut.');
            return false;
        }
    }

    /**
     * Ajouter un commentaire à une demande
     */
    public function addComment(Request $request, string $comment): bool
    {
        try {
            $this->createHistoryEntry(
                $request,
                'COMMENT_ADDED',
                null,
                null,
                $comment
            );

            $request->setUpdatedAt($this->now());
            $this->manager->persist($request);
            $this->manager->flush();

            // Notification selon qui ajoute le commentaire
            $currentUser = $this->security->getUser();
            if ($currentUser === $request->getUser()) {
                // Commentaire de l'utilisateur -> notifier les admins
                $this->notificationService->notifyUserComment($request, $comment);
            } else {
                // Commentaire admin -> notifier l'utilisateur
                $this->notificationService->notifyAdminComment($request, $comment);
            }

            $this->addFlash('success', 'Commentaire ajouté avec succès.');
            return true;
        } catch (\Exception $e) {
            $this->logError('Failed to add comment', $e);
            $this->addFlash('danger', 'Erreur lors de l\'ajout du commentaire.');
            return false;
        }
    }

    /**
     * Rechercher des demandes avec filtres
     */
    public function searchRequests(array $filters, int $page = 1, int $limit = 20): PaginationInterface
    {
        $queryBuilder = $this->requestRepository->createQueryBuilder('r')
            ->leftJoin('r.user', 'u')
            ->addSelect('u');

        // Filtrage par statut
        if (!empty($filters['status'])) {
            $queryBuilder->andWhere('r.status = :status')
                        ->setParameter('status', $filters['status']);
        }

        // Filtrage par utilisateur (pour les admins)
        if (!empty($filters['user_id'])) {
            $queryBuilder->andWhere('r.user = :user_id')
                        ->setParameter('user_id', $filters['user_id']);
        }

        // Filtrage par période
        if (!empty($filters['date_from'])) {
            $queryBuilder->andWhere('r.created_at >= :date_from')
                        ->setParameter('date_from', new \DateTimeImmutable($filters['date_from']));
        }

        if (!empty($filters['date_to'])) {
            $queryBuilder->andWhere('r.created_at <= :date_to')
                        ->setParameter('date_to', new \DateTimeImmutable($filters['date_to']));
        }

        // Recherche textuelle
        if (!empty($filters['search'])) {
            $queryBuilder->andWhere('r.title LIKE :search OR r.description LIKE :search')
                        ->setParameter('search', '%' . $filters['search'] . '%');
        }

        // Tri
        $sortField = $filters['sort'] ?? 'created_at';
        $sortDirection = $filters['direction'] ?? 'DESC';
        $queryBuilder->orderBy('r.' . $sortField, $sortDirection);

        return $this->paginator->paginate($queryBuilder, $page, $limit);
    }

    /**
     * Obtenir les statistiques des demandes
     */
    public function getStatistics(\DateTimeInterface $from, \DateTimeInterface $to): array
    {
        return [
            'total' => $this->requestRepository->countByDateRange($from, $to),
            'by_status' => $this->requestRepository->countByStatusAndDateRange($from, $to),
            'by_priority' => $this->requestRepository->countByPriorityAndDateRange($from, $to),
            'processing_time' => $this->requestRepository->getAverageProcessingTime($from, $to),
            'completion_rate' => $this->requestRepository->getCompletionRate($from, $to)
        ];
    }

    /**
     * Créer une entrée dans l'historique
     */
    private function createHistoryEntry(
        Request $request,
        string $action,
        ?string $oldValue,
        ?string $newValue,
        ?string $comment
    ): void {
        $history = new RequestHistory();
        $history->setRequest($request)
               ->setAction($action)
               ->setOldValue($oldValue)
               ->setNewValue($newValue)
               ->setComment($comment)
               ->setUser($this->security->getUser())
               ->setCreatedAt($this->now());

        $this->manager->persist($history);
    }

    /**
     * Vérifier les demandes expirées
     */
    public function checkExpiredRequests(): int
    {
        $expiredRequests = $this->requestRepository->findExpiredRequests();
        $count = 0;

        foreach ($expiredRequests as $request) {
            if ($this->updateStatus($request, RequestStatusEnum::ON_HOLD, 'Demande expirée automatiquement')) {
                $count++;
            }
        }

        return $count;
    }
}
```

### FileService (App\Service\FileService)

Service de gestion des fichiers uploadés.

```php
final class FileService
{
    use ResponseTrait, DateTimeTrait;

    private const LOG_FILE = 'service/file-service';
    private const UPLOAD_DIR = 'uploads/requests';
    private const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif'];

    public function __construct(
        private FileRepository $fileRepository,
        private EntityManagerInterface $manager,
        private KernelInterface $kernel,
        private string $uploadsDirectory
    ) {}

    /**
     * Traiter l'upload d'un fichier
     */
    public function handleUpload(UploadedFile $uploadedFile, Request $request, User $user): File
    {
        // Validation du fichier
        $this->validateFile($uploadedFile);

        // Génération du nom de fichier unique
        $filename = $this->generateUniqueFilename($uploadedFile);
        $uploadPath = $this->getUploadPath() . '/' . $filename;

        // Déplacement du fichier
        $uploadedFile->move($this->getUploadPath(), $filename);

        // Création de l'entité File
        $file = new File();
        $file->setFilename($filename)
             ->setOriginalFilename($uploadedFile->getClientOriginalName())
             ->setMimeType($uploadedFile->getMimeType())
             ->setFileSize($uploadedFile->getSize())
             ->setFilePath($uploadPath)
             ->setHash(hash_file('sha256', $uploadPath))
             ->setRequest($request)
             ->setUploadedBy($user)
             ->setUploadedAt($this->now());

        $this->manager->persist($file);

        // Ajout à l'historique
        $this->addToHistory($request, $file, $user);

        return $file;
    }

    /**
     * Valider un fichier uploadé
     */
    private function validateFile(UploadedFile $file): void
    {
        // Vérification de la taille
        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw new \InvalidArgumentException('Le fichier est trop volumineux (max 10MB).');
        }

        // Vérification de l'extension
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, self::ALLOWED_EXTENSIONS)) {
            throw new \InvalidArgumentException(
                'Type de fichier non autorisé. Extensions autorisées: ' . implode(', ', self::ALLOWED_EXTENSIONS)
            );
        }

        // Vérification du MIME type
        $allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];

        if (!in_array($file->getMimeType(), $allowedMimes)) {
            throw new \InvalidArgumentException('Type MIME non autorisé.');
        }
    }

    /**
     * Générer un nom de fichier unique
     */
    private function generateUniqueFilename(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        return uniqid() . '_' . time() . '.' . $extension;
    }

    /**
     * Obtenir le chemin d'upload
     */
    private function getUploadPath(): string
    {
        $path = $this->uploadsDirectory . '/' . self::UPLOAD_DIR;

        if (!is_dir($path)) {
            mkdir($path, 0755, true);
        }

        return $path;
    }

    /**
     * Supprimer un fichier
     */
    public function deleteFile(File $file): bool
    {
        try {
            // Suppression du fichier physique
            if (file_exists($file->getFilePath())) {
                unlink($file->getFilePath());
            }

            // Suppression de l'entité
            $this->manager->remove($file);
            $this->manager->flush();

            return true;
        } catch (\Exception $e) {
            $this->logError('Failed to delete file', $e);
            return false;
        }
    }

    /**
     * Télécharger un fichier
     */
    public function downloadFile(File $file): BinaryFileResponse
    {
        if (!file_exists($file->getFilePath())) {
            throw new NotFoundHttpException('Fichier non trouvé.');
        }

        $response = new BinaryFileResponse($file->getFilePath());
        $response->setContentDisposition(
            ResponseHeaderBag::DISPOSITION_ATTACHMENT,
            $file->getOriginalFilename()
        );

        return $response;
    }

    /**
     * Ajouter l'upload à l'historique de la demande
     */
    private function addToHistory(Request $request, File $file, User $user): void
    {
        $history = new RequestHistory();
        $history->setRequest($request)
               ->setAction('FILE_UPLOADED')
               ->setComment('Fichier uploadé: ' . $file->getOriginalFilename())
               ->setUser($user)
               ->setMetadata(['file_id' => $file->getId()])
               ->setCreatedAt($this->now());

        $this->manager->persist($history);
    }
}
```

## Contrôleurs

### RequestController (Interface utilisateur)

```php
#[Route('/request', name: 'app_request_')]
final class RequestController extends AbstractController
{
    public function __construct(
        private RequestService $requestService,
        private FileService $fileService
    ) {}

    #[Route('', name: 'index', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function index(Request $request): Response
    {
        $page = $request->query->getInt('page', 1);
        $filters = [
            'user_id' => $this->getUser()->getId(),
            'status' => $request->query->get('status'),
            'search' => $request->query->get('search')
        ];

        $pagination = $this->requestService->searchRequests($filters, $page);

        return $this->render('request/index.html.twig', [
            'pagination' => $pagination,
            'filters' => $filters
        ]);
    }

    #[Route('/create', name: 'create', methods: ['GET', 'POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(Request $httpRequest): Response
    {
        $request = new \App\Entity\Request();
        $form = $this->createForm(RequestType::class, $request);

        $form->handleRequest($httpRequest);
        if ($form->isSubmitted() && $form->isValid()) {
            $uploadedFiles = $form->get('files')->getData();

            if ($this->requestService->createRequest($request, $uploadedFiles)) {
                return $this->redirectToRoute('app_request_show', ['id' => $request->getId()]);
            }
        }

        return $this->render('request/create.html.twig', [
            'form' => $form,
            'request' => $request
        ]);
    }

    #[Route('/{id}', name: 'show', methods: ['GET', 'POST'])]
    #[IsGranted('view', 'request')]
    public function show(\App\Entity\Request $request, Request $httpRequest): Response
    {
        // Formulaire d'ajout de commentaire
        $commentForm = $this->createForm(CommentType::class);
        $commentForm->handleRequest($httpRequest);

        if ($commentForm->isSubmitted() && $commentForm->isValid()) {
            $comment = $commentForm->get('comment')->getData();
            $this->requestService->addComment($request, $comment);

            return $this->redirectToRoute('app_request_show', ['id' => $request->getId()]);
        }

        return $this->render('request/show.html.twig', [
            'request' => $request,
            'comment_form' => $commentForm
        ]);
    }

    #[Route('/{id}/cancel', name: 'cancel', methods: ['POST'])]
    #[IsGranted('edit', 'request')]
    public function cancel(\App\Entity\Request $request): RedirectResponse
    {
        $this->requestService->updateStatus(
            $request,
            RequestStatusEnum::CANCELLED,
            'Demande annulée par l\'utilisateur'
        );

        return $this->redirectToRoute('app_request_show', ['id' => $request->getId()]);
    }

    #[Route('/file/{id}/download', name: 'download_file', methods: ['GET'])]
    #[IsGranted('view', 'file')]
    public function downloadFile(File $file): BinaryFileResponse
    {
        return $this->fileService->downloadFile($file);
    }
}
```

### AdminRequestController (Interface d'administration)

```php
#[Route('/admin/request', name: 'admin_request_')]
final class AdminRequestController extends AbstractController
{
    public function __construct(
        private RequestService $requestService
    ) {}

    #[Route('', name: 'index', methods: ['GET'])]
    #[IsGranted('admin.request.list')]
    public function index(Request $request): Response
    {
        $page = $request->query->getInt('page', 1);
        $filters = [
            'status' => $request->query->get('status'),
            'priority' => $request->query->get('priority'),
            'search' => $request->query->get('search'),
            'date_from' => $request->query->get('date_from'),
            'date_to' => $request->query->get('date_to'),
            'assigned_to' => $request->query->get('assigned_to')
        ];

        $pagination = $this->requestService->searchRequests($filters, $page);

        return $this->render('@admin/request/index.html.twig', [
            'pagination' => $pagination,
            'filters' => $filters,
            'statuses' => RequestStatusEnum::cases(),
            'priorities' => RequestPriorityEnum::cases()
        ]);
    }

    #[Route('/{id}', name: 'show', methods: ['GET', 'POST'])]
    #[IsGranted('admin.request.view')]
    public function show(\App\Entity\Request $request, Request $httpRequest): Response
    {
        // Formulaire de mise à jour du statut
        $statusForm = $this->createForm(RequestStatusType::class, [
            'status' => $request->getStatus(),
            'assigned_to' => $request->getAssignedTo()
        ]);

        $statusForm->handleRequest($httpRequest);
        if ($statusForm->isSubmitted() && $statusForm->isValid()) {
            $data = $statusForm->getData();

            $this->requestService->updateStatus(
                $request,
                RequestStatusEnum::from($data['status']),
                $data['comment'] ?? null,
                $data['assigned_to'] ?? null
            );

            return $this->redirectToRoute('admin_request_show', ['id' => $request->getId()]);
        }

        return $this->render('@admin/request/show.html.twig', [
            'request' => $request,
            'status_form' => $statusForm
        ]);
    }

    #[Route('/statistics', name: 'statistics', methods: ['GET'])]
    #[IsGranted('admin.request.statistics')]
    public function statistics(Request $request): Response
    {
        $from = new \DateTimeImmutable($request->query->get('from', '-30 days'));
        $to = new \DateTimeImmutable($request->query->get('to', 'now'));

        $statistics = $this->requestService->getStatistics($from, $to);

        return $this->render('@admin/request/statistics.html.twig', [
            'statistics' => $statistics,
            'from' => $from,
            'to' => $to
        ]);
    }
}
```

## Formulaires Symfony

### RequestType

```php
class RequestType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('title', TextType::class, [
                'label' => 'Titre de la demande',
                'attr' => ['placeholder' => 'Décrivez brièvement votre demande']
            ])
            ->add('description', TextareaType::class, [
                'label' => 'Description détaillée',
                'attr' => [
                    'rows' => 8,
                    'placeholder' => 'Décrivez en détail votre demande...'
                ]
            ])
            ->add('category', ChoiceType::class, [
                'label' => 'Catégorie',
                'choices' => [
                    'Support technique' => 'support',
                    'Demande d\'information' => 'information',
                    'Signalement de bug' => 'bug',
                    'Demande de fonctionnalité' => 'feature',
                    'Autre' => 'other'
                ],
                'placeholder' => 'Sélectionner une catégorie'
            ])
            ->add('priority', ChoiceType::class, [
                'label' => 'Priorité',
                'choices' => array_combine(
                    array_map(fn($p) => $p->getDisplayName(), RequestPriorityEnum::cases()),
                    array_map(fn($p) => $p->value, RequestPriorityEnum::cases())
                ),
                'data' => RequestPriorityEnum::NORMAL->value
            ])
            ->add('due_date', DateType::class, [
                'label' => 'Date limite souhaitée',
                'required' => false,
                'widget' => 'single_text',
                'attr' => ['min' => (new \DateTime())->format('Y-m-d')]
            ])
            ->add('files', FileType::class, [
                'label' => 'Fichiers joints',
                'multiple' => true,
                'required' => false,
                'mapped' => false,
                'attr' => [
                    'accept' => '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif',
                    'multiple' => 'multiple'
                ],
                'help' => 'Formats autorisés: PDF, Word, Images (max 10MB par fichier)'
            ])
            ->add('submit', SubmitType::class, [
                'label' => 'Soumettre la demande',
                'attr' => ['class' => 'btn btn-primary']
            ]);
    }
}
```

### RequestStatusType (Admin)

```php
class RequestStatusType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('status', ChoiceType::class, [
                'label' => 'Nouveau statut',
                'choices' => array_combine(
                    array_map(fn($s) => $s->getDisplayName(), RequestStatusEnum::cases()),
                    array_map(fn($s) => $s->value, RequestStatusEnum::cases())
                )
            ])
            ->add('assigned_to', EntityType::class, [
                'label' => 'Assigner à',
                'class' => User::class,
                'choice_label' => 'username',
                'required' => false,
                'placeholder' => 'Non assigné',
                'query_builder' => function (UserRepository $er) {
                    return $er->createQueryBuilder('u')
                              ->where('u.roles LIKE :role')
                              ->setParameter('role', '%ROLE_ADMIN%')
                              ->orderBy('u.username', 'ASC');
                }
            ])
            ->add('comment', TextareaType::class, [
                'label' => 'Commentaire',
                'required' => false,
                'attr' => ['rows' => 4]
            ])
            ->add('submit', SubmitType::class, [
                'label' => 'Mettre à jour',
                'attr' => ['class' => 'btn btn-primary']
            ]);
    }
}
```

## Templates Twig

### Liste des demandes utilisateur

```twig
{% extends 'base.html.twig' %}

{% block title %}Mes demandes{% endblock %}

{% block content %}
<div class="container">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Mes demandes</h1>
        <a href="{{ path('app_request_create') }}" class="btn btn-primary">
            <i class="fas fa-plus"></i> Nouvelle demande
        </a>
    </div>

    <!-- Filtres -->
    <div class="card mb-4">
        <div class="card-body">
            <form method="GET" class="row g-3">
                <div class="col-md-4">
                    <label for="status" class="form-label">Statut</label>
                    <select name="status" id="status" class="form-select">
                        <option value="">Tous les statuts</option>
                        {% for status in constant('App\\Enum\\RequestStatusEnum::cases()') %}
                            <option value="{{ status.value }}" {{ filters.status == status.value ? 'selected' : '' }}>
                                {{ status.displayName }}
                            </option>
                        {% endfor %}
                    </select>
                </div>
                <div class="col-md-6">
                    <label for="search" class="form-label">Recherche</label>
                    <input type="text" name="search" id="search" class="form-control"
                           value="{{ filters.search }}" placeholder="Titre ou description...">
                </div>
                <div class="col-md-2">
                    <label class="form-label">&nbsp;</label>
                    <button type="submit" class="btn btn-outline-primary d-block w-100">
                        <i class="fas fa-search"></i> Filtrer
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Liste des demandes -->
    <div class="row">
        {% for request in pagination %}
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="card-title mb-0">{{ request.title }}</h5>
                            <span class="badge bg-{{ constant('App\\Enum\\RequestStatusEnum::from(request.status)').color }}">
                                <i class="fas fa-{{ constant('App\\Enum\\RequestStatusEnum::from(request.status)').icon }}"></i>
                                {{ constant('App\\Enum\\RequestStatusEnum::from(request.status)').displayName }}
                            </span>
                        </div>

                        <p class="card-text text-muted">
                            {{ request.description|length > 100 ? request.description|slice(0, 100) ~ '...' : request.description }}
                        </p>

                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="fas fa-calendar"></i>
                                {{ request.createdAt|date('d/m/Y à H:i') }}
                            </small>

                            <div>
                                {% if request.files|length > 0 %}
                                    <i class="fas fa-paperclip text-muted" title="{{ request.files|length }} fichier(s)"></i>
                                {% endif %}

                                {% if request.priority == 'urgent' %}
                                    <i class="fas fa-exclamation-triangle text-danger" title="Urgent"></i>
                                {% elseif request.priority == 'high' %}
                                    <i class="fas fa-exclamation text-warning" title="Priorité élevée"></i>
                                {% endif %}
                            </div>
                        </div>
                    </div>

                    <div class="card-footer">
                        <a href="{{ path('app_request_show', {id: request.id}) }}" class="btn btn-outline-primary btn-sm">
                            <i class="fas fa-eye"></i> Voir les détails
                        </a>
                    </div>
                </div>
            </div>
        {% else %}
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle"></i>
                    Aucune demande trouvée. <a href="{{ path('app_request_create') }}">Créer votre première demande</a>
                </div>
            </div>
        {% endfor %}
    </div>

    <!-- Pagination -->
    {{ knp_pagination_render(pagination) }}
</div>
{% endblock %}
```

## Routes et Endpoints

### Routes utilisateur

- `GET /request` : Liste des demandes utilisateur
- `GET|POST /request/create` : Création d'une demande
- `GET|POST /request/{id}` : Détail et commentaires d'une demande
- `POST /request/{id}/cancel` : Annulation d'une demande
- `GET /request/file/{id}/download` : Téléchargement d'un fichier

### Routes d'administration

- `GET /admin/request` : Liste toutes les demandes
- `GET|POST /admin/request/{id}` : Détail et gestion d'une demande
- `GET /admin/request/statistics` : Statistiques des demandes
- `POST /admin/request/{id}/assign` : Assignation d'une demande
- `POST /admin/request/bulk-action` : Actions en lot

### API REST

```typescript
// Client API pour les demandes
const requestAPI = {
  async getRequests(filters: RequestFilters): Promise<RequestList> {
    return fetchGET('/api/requests', { params: filters });
  },

  async createRequest(data: RequestData): Promise<Request> {
    return fetchPOST('/api/requests', data);
  },

  async updateStatus(id: number, status: string, comment?: string): Promise<Request> {
    return fetchPATCH(`/api/requests/${id}/status`, { status, comment });
  },

  async addComment(id: number, comment: string): Promise<void> {
    return fetchPOST(`/api/requests/${id}/comments`, { comment });
  },
};
```

## Notifications et Emails

### Service de notification

```php
final class NotificationService
{
    public function notifyNewRequest(Request $request): void
    {
        // Email aux admins
        $this->mailer->send(new NewRequestNotification($request));

        // Notification in-app
        $this->createInAppNotification(
            'Nouvelle demande créée',
            'Une nouvelle demande a été soumise: ' . $request->getTitle(),
            'admin'
        );
    }

    public function notifyStatusChange(Request $request, RequestStatusEnum $oldStatus, RequestStatusEnum $newStatus): void
    {
        // Email à l'utilisateur
        $this->mailer->send(new StatusChangeNotification($request, $oldStatus, $newStatus));

        // Notification in-app
        $this->createInAppNotification(
            'Statut de demande mis à jour',
            sprintf('Votre demande "%s" est maintenant %s', $request->getTitle(), $newStatus->getDisplayName()),
            $request->getUser()
        );
    }
}
```

## Interdépendances

### Modules utilisés

- **UserManagement** : Association des demandes aux utilisateurs
- **FileManagement** : Gestion des fichiers attachés
- **NotificationService** : Alertes et emails
- **TrackingService** : Suivi des interactions

### Services externes

- **MailerService** : Envoi d'emails de notification
- **CacheService** : Cache des statistiques
- **QueueService** : Traitement asynchrone des notifications

Le module de gestion des demandes offre un workflow complet et professionnel pour traiter efficacement les demandes utilisateur avec un suivi détaillé et des notifications automatiques.
