# Protection des Données et Conformité RGPD

## Vue d'ensemble

Ce document détaille les mesures de protection des données personnelles, la conformité RGPD (Règlement Général sur la Protection des Données), la gestion des consentements et les procédures de sécurité des données.

## Cadre Légal et Conformité

### Principes RGPD appliqués

- **Licéité** : Traitement basé sur des bases légales claires
- **Limitation des finalités** : Données collectées pour des objectifs définis
- **Minimisation** : Collecte limitée au nécessaire
- **Exactitude** : Maintien de données à jour et correctes
- **Limitation de conservation** : Durée de stockage définie
- **Intégrité et confidentialité** : Sécurité appropriée
- **Responsabilité** : Capacité à démontrer la conformité

### Bases légales pour le traitement

1. **Consentement** : Inscription, newsletter, cookies non essentiels
2. **Exécution contractuelle** : Gestion du compte utilisateur
3. **Obligation légale** : Conservation des logs, facturation
4. **Intérêt légitime** : Analytics anonymisées, sécurité

## Service de Gestion des Données Personnelles

### DataProtectionService

```php
<?php

namespace App\Service;

use App\Entity\User;
use App\Entity\DataProcessingConsent;
use App\Entity\DataExportRequest;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Serializer\SerializerInterface;
use Psr\Log\LoggerInterface;

final class DataProtectionService
{
    use ResponseTrait;

    private const LOG_FILE = 'security/data_protection';

    // Durées de conservation par type de données
    private const RETENTION_PERIODS = [
        'user_account' => 'P3Y',        // 3 ans après suppression du compte
        'request_data' => 'P5Y',        // 5 ans pour les demandes
        'analytics' => 'P2Y',           // 2 ans pour les analytics
        'logs_security' => 'P1Y',       // 1 an pour les logs de sécurité
        'logs_application' => 'P6M',    // 6 mois pour les logs applicatifs
        'session_data' => 'P1M',        // 1 mois pour les données de session
        'temporary_files' => 'P7D'      // 7 jours pour les fichiers temporaires
    ];

    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserRepository $userRepository,
        private SerializerInterface $serializer,
        private LoggerInterface $logger,
        private string $dataExportPath
    ) {}

    /**
     * Enregistrer un consentement
     */
    public function recordConsent(User $user, string $purpose, bool $granted, array $metadata = []): DataProcessingConsent
    {
        $consent = new DataProcessingConsent();
        $consent->setUser($user)
               ->setPurpose($purpose)
               ->setGranted($granted)
               ->setMetadata($metadata)
               ->setRecordedAt(new \DateTimeImmutable())
               ->setIpAddress($_SERVER['REMOTE_ADDR'] ?? null)
               ->setUserAgent($_SERVER['HTTP_USER_AGENT'] ?? null);

        $this->entityManager->persist($consent);
        $this->entityManager->flush();

        $this->logInfo('Consent recorded', [
            'user_id' => $user->getId(),
            'purpose' => $purpose,
            'granted' => $granted
        ]);

        return $consent;
    }

    /**
     * Vérifier si un consentement est valide
     */
    public function hasValidConsent(User $user, string $purpose): bool
    {
        $consent = $this->entityManager
            ->getRepository(DataProcessingConsent::class)
            ->findOneBy(
                ['user' => $user, 'purpose' => $purpose],
                ['recordedAt' => 'DESC']
            );

        if (!$consent) {
            return false;
        }

        // Vérifier que le consentement n'est pas expiré (max 2 ans selon RGPD)
        $maxAge = new \DateTimeImmutable('-2 years');
        if ($consent->getRecordedAt() < $maxAge) {
            return false;
        }

        return $consent->isGranted();
    }

    /**
     * Retirer un consentement
     */
    public function withdrawConsent(User $user, string $purpose): bool
    {
        try {
            // Enregistrer le retrait
            $this->recordConsent($user, $purpose, false, ['action' => 'withdrawal']);

            // Appliquer les conséquences du retrait
            $this->applyConsentWithdrawal($user, $purpose);

            $this->logInfo('Consent withdrawn', [
                'user_id' => $user->getId(),
                'purpose' => $purpose
            ]);

            return true;
        } catch (\Exception $e) {
            $this->logError('Consent withdrawal failed', $e, [
                'user_id' => $user->getId(),
                'purpose' => $purpose
            ]);

            return false;
        }
    }

    /**
     * Appliquer les conséquences du retrait de consentement
     */
    private function applyConsentWithdrawal(User $user, string $purpose): void
    {
        switch ($purpose) {
            case 'marketing':
                // Supprimer des listes de diffusion
                $this->removeFromMarketingLists($user);
                break;

            case 'analytics':
                // Anonymiser les données analytics existantes
                $this->anonymizeAnalyticsData($user);
                break;

            case 'personalization':
                // Supprimer les préférences personnalisées
                $this->clearPersonalizationData($user);
                break;
        }
    }

    /**
     * Exporter toutes les données personnelles d'un utilisateur (droit à la portabilité)
     */
    public function exportUserData(User $user): string
    {
        try {
            $exportData = [
                'export_date' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
                'user_id' => $user->getId(),
                'personal_data' => $this->collectPersonalData($user),
                'processing_activities' => $this->collectProcessingActivities($user),
                'consents' => $this->collectConsentHistory($user)
            ];

            $filename = sprintf(
                'user_data_export_%d_%s.json',
                $user->getId(),
                date('Y-m-d_H-i-s')
            );

            $filepath = $this->dataExportPath . '/' . $filename;

            // Créer le dossier si nécessaire
            if (!is_dir($this->dataExportPath)) {
                mkdir($this->dataExportPath, 0755, true);
            }

            file_put_contents(
                $filepath,
                $this->serializer->serialize($exportData, 'json', ['json_encode_options' => JSON_PRETTY_PRINT])
            );

            // Enregistrer la demande d'export
            $exportRequest = new DataExportRequest();
            $exportRequest->setUser($user)
                         ->setFilename($filename)
                         ->setStatus('completed')
                         ->setRequestedAt(new \DateTimeImmutable())
                         ->setCompletedAt(new \DateTimeImmutable());

            $this->entityManager->persist($exportRequest);
            $this->entityManager->flush();

            $this->logInfo('Data export completed', [
                'user_id' => $user->getId(),
                'filename' => $filename
            ]);

            return $filename;
        } catch (\Exception $e) {
            $this->logError('Data export failed', $e, ['user_id' => $user->getId()]);
            throw $e;
        }
    }

    /**
     * Collecter toutes les données personnelles
     */
    private function collectPersonalData(User $user): array
    {
        return [
            'account' => [
                'id' => $user->getId(),
                'username' => $user->getUsername(),
                'email' => $user->getEmail(),
                'firstname' => $user->getFirstname(),
                'lastname' => $user->getLastname(),
                'phone' => $user->getPhone(),
                'birthdate' => $user->getBirthdate()?->format('Y-m-d'),
                'gender' => $user->getGender(),
                'preferences' => $user->getPreferences(),
                'created_at' => $user->getCreatedAt()->format(\DateTimeInterface::ATOM),
                'last_login_at' => $user->getLastLoginAt()?->format(\DateTimeInterface::ATOM)
            ],
            'requests' => $this->collectUserRequests($user),
            'files' => $this->collectUserFiles($user),
            'tracking_events' => $this->collectTrackingData($user),
            'login_history' => $this->collectLoginHistory($user)
        ];
    }

    /**
     * Collecter l'historique des demandes
     */
    private function collectUserRequests(User $user): array
    {
        $requests = $this->entityManager
            ->getRepository(\App\Entity\Request::class)
            ->findBy(['user' => $user]);

        return array_map(function($request) {
            return [
                'id' => $request->getId(),
                'title' => $request->getTitle(),
                'description' => $request->getDescription(),
                'status' => $request->getStatus(),
                'created_at' => $request->getCreatedAt()->format(\DateTimeInterface::ATOM),
                'resolved_at' => $request->getResolvedAt()?->format(\DateTimeInterface::ATOM)
            ];
        }, $requests);
    }

    /**
     * Supprimer définitivement un compte utilisateur (droit à l'effacement)
     */
    public function deleteUserAccount(User $user, string $reason = 'user_request'): bool
    {
        try {
            $userId = $user->getId();

            // 1. Exporter les données avant suppression (si requis)
            if ($reason === 'user_request') {
                $this->exportUserData($user);
            }

            // 2. Anonymiser les données qui doivent être conservées
            $this->anonymizeRequiredData($user);

            // 3. Supprimer les données personnelles
            $this->deletePersonalData($user);

            // 4. Supprimer le compte utilisateur
            $this->entityManager->remove($user);
            $this->entityManager->flush();

            $this->logInfo('User account deleted', [
                'user_id' => $userId,
                'reason' => $reason
            ]);

            return true;
        } catch (\Exception $e) {
            $this->logError('User account deletion failed', $e, [
                'user_id' => $user->getId(),
                'reason' => $reason
            ]);

            return false;
        }
    }

    /**
     * Anonymiser les données qui doivent être conservées
     */
    private function anonymizeRequiredData(User $user): void
    {
        // Anonymiser les données de tracking en gardant les statistiques
        $this->entityManager->createQuery('
            UPDATE App\Entity\XtrackingEvent e
            SET e.user = NULL,
                e.customData = NULL
            WHERE e.user = :user
        ')->setParameter('user', $user)->execute();

        // Anonymiser les logs de requêtes
        $this->entityManager->createQuery('
            UPDATE App\Entity\Request r
            SET r.user = NULL,
                r.headers = NULL,
                r.body = NULL
            WHERE r.user = :user
        ')->setParameter('user', $user)->execute();
    }

    /**
     * Supprimer les données personnelles non essentielles
     */
    private function deletePersonalData(User $user): void
    {
        // Supprimer les fichiers uploadés
        $files = $this->entityManager
            ->getRepository(\App\Entity\File::class)
            ->findBy(['user' => $user]);

        foreach ($files as $file) {
            // Supprimer le fichier physique
            if (file_exists($file->getPath())) {
                unlink($file->getPath());
            }
            $this->entityManager->remove($file);
        }

        // Supprimer les consentements
        $consents = $this->entityManager
            ->getRepository(DataProcessingConsent::class)
            ->findBy(['user' => $user]);

        foreach ($consents as $consent) {
            $this->entityManager->remove($consent);
        }
    }

    /**
     * Nettoyer automatiquement les données expirées
     */
    public function cleanupExpiredData(): array
    {
        $results = [];

        foreach (self::RETENTION_PERIODS as $dataType => $period) {
            $expiredDate = (new \DateTimeImmutable())->sub(new \DateInterval($period));
            $count = $this->cleanupDataByType($dataType, $expiredDate);

            $results[$dataType] = $count;

            $this->logInfo('Expired data cleanup', [
                'data_type' => $dataType,
                'expired_before' => $expiredDate->format('Y-m-d'),
                'deleted_count' => $count
            ]);
        }

        return $results;
    }

    /**
     * Nettoyer un type de données spécifique
     */
    private function cleanupDataByType(string $dataType, \DateTimeImmutable $expiredDate): int
    {
        return match($dataType) {
            'analytics' => $this->cleanupAnalytics($expiredDate),
            'logs_security' => $this->cleanupSecurityLogs($expiredDate),
            'logs_application' => $this->cleanupApplicationLogs($expiredDate),
            'session_data' => $this->cleanupSessionData($expiredDate),
            'temporary_files' => $this->cleanupTemporaryFiles($expiredDate),
            default => 0
        };
    }

    /**
     * Nettoyer les données analytics expirées
     */
    private function cleanupAnalytics(\DateTimeImmutable $expiredDate): int
    {
        return $this->entityManager->createQuery('
            DELETE FROM App\Entity\XtrackingEvent e
            WHERE e.createdAt < :expiredDate
        ')->setParameter('expiredDate', $expiredDate)->execute();
    }

    /**
     * Nettoyer les logs de sécurité expirés
     */
    private function cleanupSecurityLogs(\DateTimeImmutable $expiredDate): int
    {
        // Implémentation selon votre système de logs
        return 0;
    }

    /**
     * Générer un rapport de conformité RGPD
     */
    public function generateComplianceReport(): array
    {
        $report = [
            'generated_at' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
            'data_inventory' => $this->getDataInventory(),
            'consent_statistics' => $this->getConsentStatistics(),
            'retention_compliance' => $this->checkRetentionCompliance(),
            'security_measures' => $this->getSecurityMeasures(),
            'data_processing_activities' => $this->getProcessingActivities()
        ];

        return $report;
    }

    /**
     * Obtenir l'inventaire des données
     */
    private function getDataInventory(): array
    {
        return [
            'total_users' => $this->userRepository->count([]),
            'active_users' => $this->userRepository->count(['isActive' => true]),
            'verified_users' => $this->userRepository->count(['isVerified' => true]),
            'total_requests' => $this->entityManager
                ->getRepository(\App\Entity\Request::class)->count([]),
            'total_files' => $this->entityManager
                ->getRepository(\App\Entity\File::class)->count([]),
            'total_tracking_events' => $this->entityManager
                ->getRepository(\App\Entity\XtrackingEvent::class)->count([])
        ];
    }

    /**
     * Obtenir les statistiques de consentement
     */
    private function getConsentStatistics(): array
    {
        $stats = [];
        $purposes = ['marketing', 'analytics', 'personalization'];

        foreach ($purposes as $purpose) {
            $total = $this->entityManager
                ->getRepository(DataProcessingConsent::class)
                ->count(['purpose' => $purpose]);

            $granted = $this->entityManager
                ->getRepository(DataProcessingConsent::class)
                ->count(['purpose' => $purpose, 'granted' => true]);

            $stats[$purpose] = [
                'total_requests' => $total,
                'granted' => $granted,
                'denied' => $total - $granted,
                'consent_rate' => $total > 0 ? round(($granted / $total) * 100, 2) : 0
            ];
        }

        return $stats;
    }

    /**
     * Vérifier la conformité des durées de conservation
     */
    private function checkRetentionCompliance(): array
    {
        $compliance = [];

        foreach (self::RETENTION_PERIODS as $dataType => $period) {
            $expiredDate = (new \DateTimeImmutable())->sub(new \DateInterval($period));
            $expiredCount = $this->countExpiredData($dataType, $expiredDate);

            $compliance[$dataType] = [
                'retention_period' => $period,
                'expired_data_count' => $expiredCount,
                'compliant' => $expiredCount === 0
            ];
        }

        return $compliance;
    }

    /**
     * Compter les données expirées par type
     */
    private function countExpiredData(string $dataType, \DateTimeImmutable $expiredDate): int
    {
        return match($dataType) {
            'analytics' => $this->entityManager->createQuery('
                SELECT COUNT(e.id) FROM App\Entity\XtrackingEvent e
                WHERE e.createdAt < :expiredDate
            ')->setParameter('expiredDate', $expiredDate)->getSingleScalarResult(),

            default => 0
        };
    }

    /**
     * Anonymiser les données d'un utilisateur sans supprimer le compte
     */
    public function anonymizeUserData(User $user): bool
    {
        try {
            // Anonymiser les données personnelles
            $user->setFirstname('Anonymized')
                 ->setLastname('User')
                 ->setPhone(null)
                 ->setBirthdate(null)
                 ->setGender(null)
                 ->setPreferences(null);

            // Anonymiser l'email en gardant le domaine pour les statistiques
            $emailParts = explode('@', $user->getEmail());
            $anonymizedEmail = 'anonymized_' . $user->getId() . '@' . $emailParts[1];
            $user->setEmail($anonymizedEmail);

            $this->entityManager->flush();

            $this->logInfo('User data anonymized', ['user_id' => $user->getId()]);

            return true;
        } catch (\Exception $e) {
            $this->logError('User data anonymization failed', $e, ['user_id' => $user->getId()]);
            return false;
        }
    }
}
```

## Entité de Consentement

### DataProcessingConsent

```php
<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'data_processing_consent')]
#[ORM\Index(name: 'idx_consent_user_purpose', columns: ['user_id', 'purpose'])]
#[ORM\Index(name: 'idx_consent_recorded_at', columns: ['recorded_at'])]
class DataProcessingConsent
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(type: 'string', length: 100)]
    private ?string $purpose = null;

    #[ORM\Column(type: 'boolean')]
    private bool $granted = false;

    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $metadata = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $recordedAt = null;

    #[ORM\Column(type: 'string', length: 45, nullable: true)]
    private ?string $ipAddress = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $userAgent = null;

    // Getters et setters...
}
```

## Contrôleur de Gestion des Données

### DataProtectionController

```php
<?php

namespace App\Controller;

use App\Service\DataProtectionService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/privacy')]
#[IsGranted('ROLE_USER')]
final class DataProtectionController extends AbstractController
{
    public function __construct(
        private DataProtectionService $dataProtectionService
    ) {}

    #[Route('/consent', name: 'privacy_consent')]
    public function manageConsent(Request $request): Response
    {
        $user = $this->getUser();

        if ($request->isMethod('POST')) {
            $consents = $request->request->all('consent');

            foreach ($consents as $purpose => $granted) {
                $this->dataProtectionService->recordConsent(
                    $user,
                    $purpose,
                    (bool) $granted
                );
            }

            $this->addFlash('success', 'Vos préférences de consentement ont été mises à jour.');
            return $this->redirectToRoute('privacy_consent');
        }

        $currentConsents = [
            'marketing' => $this->dataProtectionService->hasValidConsent($user, 'marketing'),
            'analytics' => $this->dataProtectionService->hasValidConsent($user, 'analytics'),
            'personalization' => $this->dataProtectionService->hasValidConsent($user, 'personalization')
        ];

        return $this->render('privacy/consent.html.twig', [
            'current_consents' => $currentConsents
        ]);
    }

    #[Route('/export', name: 'privacy_export_data')]
    public function exportData(): Response
    {
        $user = $this->getUser();

        try {
            $filename = $this->dataProtectionService->exportUserData($user);

            $this->addFlash('success',
                'Vos données ont été exportées. Le téléchargement va commencer automatiquement.'
            );

            return $this->redirect($this->generateUrl('privacy_download_export', [
                'filename' => $filename
            ]));
        } catch (\Exception $e) {
            $this->addFlash('error', 'Erreur lors de l\'export des données : ' . $e->getMessage());
            return $this->redirectToRoute('privacy_consent');
        }
    }

    #[Route('/download/{filename}', name: 'privacy_download_export')]
    public function downloadExport(string $filename): Response
    {
        $user = $this->getUser();
        $filepath = $this->getParameter('data_export_path') . '/' . $filename;

        // Vérifier que le fichier appartient à l'utilisateur
        if (!str_contains($filename, 'user_data_export_' . $user->getId())) {
            throw $this->createAccessDeniedException();
        }

        if (!file_exists($filepath)) {
            throw $this->createNotFoundException('Fichier d\'export non trouvé');
        }

        $response = new BinaryFileResponse($filepath);
        $response->setContentDisposition('attachment', $filename);

        return $response;
    }

    #[Route('/delete-account', name: 'privacy_delete_account', methods: ['POST'])]
    public function deleteAccount(Request $request): Response
    {
        $user = $this->getUser();

        // Vérifier le token CSRF
        if (!$this->isCsrfTokenValid('delete_account', $request->request->get('_token'))) {
            throw $this->createAccessDeniedException('Token CSRF invalide');
        }

        // Vérifier le mot de passe
        $password = $request->request->get('password');
        if (!$this->isPasswordValid($user, $password)) {
            $this->addFlash('error', 'Mot de passe incorrect');
            return $this->redirectToRoute('privacy_consent');
        }

        try {
            $this->dataProtectionService->deleteUserAccount($user, 'user_request');

            // Déconnecter l'utilisateur
            $this->container->get('security.token_storage')->setToken(null);

            $this->addFlash('success', 'Votre compte a été supprimé définitivement.');
            return $this->redirectToRoute('app_home');
        } catch (\Exception $e) {
            $this->addFlash('error', 'Erreur lors de la suppression du compte : ' . $e->getMessage());
            return $this->redirectToRoute('privacy_consent');
        }
    }
}
```

## Templates de Gestion des Consentements

### Formulaire de consentement

```twig
{# templates/privacy/consent.html.twig #}
{% extends 'base.html.twig' %}

{% block title %}Gestion de vos données personnelles{% endblock %}

{% block body %}
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header">
                    <h3>Gestion de vos données personnelles</h3>
                </div>
                <div class="card-body">

                    <div class="alert alert-info">
                        <strong>Vos droits :</strong>
                        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification,
                        de portabilité et d'effacement de vos données personnelles.
                    </div>

                    <form method="post">
                        <h4>Préférences de consentement</h4>

                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox"
                                       name="consent[marketing]" value="1"
                                       {{ current_consents.marketing ? 'checked' : '' }}
                                       id="consent_marketing">
                                <label class="form-check-label" for="consent_marketing">
                                    <strong>Communications marketing</strong><br>
                                    <small class="text-muted">
                                        Recevoir des emails promotionnels et des newsletters
                                    </small>
                                </label>
                            </div>
                        </div>

                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox"
                                       name="consent[analytics]" value="1"
                                       {{ current_consents.analytics ? 'checked' : '' }}
                                       id="consent_analytics">
                                <label class="form-check-label" for="consent_analytics">
                                    <strong>Analytics et amélioration</strong><br>
                                    <small class="text-muted">
                                        Collecter des données d'usage anonymisées pour améliorer nos services
                                    </small>
                                </label>
                            </div>
                        </div>

                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox"
                                       name="consent[personalization]" value="1"
                                       {{ current_consents.personalization ? 'checked' : '' }}
                                       id="consent_personalization">
                                <label class="form-check-label" for="consent_personalization">
                                    <strong>Personnalisation</strong><br>
                                    <small class="text-muted">
                                        Personnaliser votre expérience en fonction de vos préférences
                                    </small>
                                </label>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary">
                            Mettre à jour mes préférences
                        </button>
                    </form>

                    <hr>

                    <h4>Actions sur vos données</h4>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-body">
                                    <h5 class="card-title">Exporter mes données</h5>
                                    <p class="card-text">
                                        Télécharger toutes vos données personnelles dans un format portable.
                                    </p>
                                    <a href="{{ path('privacy_export_data') }}" class="btn btn-outline-primary">
                                        Exporter mes données
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-body">
                                    <h5 class="card-title text-danger">Supprimer mon compte</h5>
                                    <p class="card-text">
                                        Supprimer définitivement votre compte et toutes vos données.
                                        <strong>Cette action est irréversible.</strong>
                                    </p>
                                    <button type="button" class="btn btn-outline-danger"
                                            data-bs-toggle="modal" data-bs-target="#deleteAccountModal">
                                        Supprimer mon compte
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="alert alert-warning">
                        <strong>Note importante :</strong>
                        Certaines données peuvent être conservées pour des raisons légales
                        (facturation, lutte contre la fraude) conformément aux durées légales de conservation.
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

{# Modal de confirmation de suppression #}
<div class="modal fade" id="deleteAccountModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Confirmer la suppression du compte</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form method="post" action="{{ path('privacy_delete_account') }}">
                <div class="modal-body">
                    <div class="alert alert-danger">
                        <strong>Attention !</strong> Cette action supprimera définitivement votre compte
                        et toutes vos données. Cette action ne peut pas être annulée.
                    </div>

                    <div class="mb-3">
                        <label for="password" class="form-label">
                            Confirmez votre mot de passe :
                        </label>
                        <input type="password" class="form-control" id="password"
                               name="password" required>
                    </div>

                    <input type="hidden" name="_token" value="{{ csrf_token('delete_account') }}">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        Annuler
                    </button>
                    <button type="submit" class="btn btn-danger">
                        Supprimer définitivement mon compte
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
{% endblock %}
```

## Commande de Nettoyage Automatique

### DataCleanupCommand

```php
<?php

namespace App\Command;

use App\Service\DataProtectionService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:data:cleanup',
    description: 'Nettoyer les données expirées selon les durées de conservation RGPD'
)]
final class DataCleanupCommand extends Command
{
    public function __construct(
        private DataProtectionService $dataProtectionService
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $io->title('Nettoyage des données expirées');

        try {
            $results = $this->dataProtectionService->cleanupExpiredData();

            $io->section('Résultats du nettoyage :');

            foreach ($results as $dataType => $count) {
                if ($count > 0) {
                    $io->text("✓ {$dataType}: {$count} enregistrements supprimés");
                } else {
                    $io->text("- {$dataType}: aucune donnée expirée");
                }
            }

            $totalDeleted = array_sum($results);

            if ($totalDeleted > 0) {
                $io->success("Nettoyage terminé : {$totalDeleted} enregistrements supprimés au total");
            } else {
                $io->info('Aucune donnée expirée trouvée');
            }

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $io->error('Erreur lors du nettoyage : ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
```

## Configuration des Tâches Automatisées

### Cron jobs pour le nettoyage

```bash
# Crontab pour le nettoyage automatique des données
# Tous les jours à 2h du matin
0 2 * * * cd /path/to/app && php bin/console app:data:cleanup

# Sauvegarde avant nettoyage (tous les dimanches à 1h)
0 1 * * 0 cd /path/to/app && php bin/console app:database:backup

# Génération du rapport de conformité (tous les mois)
0 3 1 * * cd /path/to/app && php bin/console app:compliance:report
```

Ce système de protection des données assure une conformité complète au RGPD tout en offrant aux utilisateurs un contrôle total sur leurs données personnelles, avec des mécanismes automatiques de nettoyage et de conservation appropriés.
