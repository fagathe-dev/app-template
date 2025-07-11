<?php

namespace Admin\Service;

use App\DTO\FeatureAccessRuleDTO;
use Fagathe\Libs\Front\Breadcrumb\Breadcrumb;
use Fagathe\Libs\Front\Breadcrumb\BreadcrumbItem;
use Symfony\Component\HttpKernel\KernelInterface;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

class FeatureAccessRuleService
{
    private const DATA_FILE = '/data/features_access_rules.json';
    private string $filePath;
    public function __construct(
        private KernelInterface $kernel,
        private readonly UrlGeneratorInterface $urlGenerator,
    ) {
        $this->filePath = $this->kernel->getProjectDir() . self::DATA_FILE;
    }

    /**
     * @param BreadcrumbItem[] $items 
     * 
     * @return Breadcrumb
     */
    private function breadcrumb(array $items = []): Breadcrumb
    {
        $breadcrumb = new Breadcrumb([
            new BreadcrumbItem(
                'Liste des permissions',
                $this->urlGenerator->generate('admin_features_access_rules_index'),
            ),
            ...$items
        ]);

        return $breadcrumb;
    }

    public function index(): array
    {
        // Cette méthode n'est pas utilisée dans ce service, mais peut être utile pour des opérations futures.
        // Vous pouvez la supprimer si elle n'est pas nécessaire.
        $features = $this->getAllFeatures();
        $breadcrumb = $this->breadcrumb();

        return compact('features', 'breadcrumb');
    }

    public function add(): array
    {
        $breadcrumb = $this->breadcrumb([
            new BreadcrumbItem(
                'Ajouter une permission',
                $this->urlGenerator->generate('admin_features_access_rules_new'),
            ),
        ]);

        return compact('breadcrumb');
    }

    public function edit(string $id): array
    {
        $breadcrumb = $this->breadcrumb([
            new BreadcrumbItem(
                'Modifier la permission ' . $id,
                $this->urlGenerator->generate('admin_features_access_rules_edit', ['id' => $id]),
            ),
        ]);

        return compact('breadcrumb');
    }

    public function getAllFeatures(): array
    {
        $data = $this->getRawFeatureData();

        $featureDtos = [];
        foreach ($data as $k => $v) {
            $dto = new FeatureAccessRuleDTO();

            $dto->setId($v['id'] ?? null)
                ->setName($v['name'] ?? null)
                ->setEnabled($v['enabled'] ?? false)
                ->setMinimumAccessRole($v['minimum_access_role'] ?? null)
                ->setRequiresOwnerMatch($v['requires_owner_match'] ?? false)
                ->setStrictOwnerOnly($v['strict_owner_only'] ?? false); // Ajout de la propriété strictOwnerOnly

            array_push($featureDtos, $dto);
        }

        return $featureDtos;
    }

    public function getFeatureConfig(string $fId): ?FeatureAccessRuleDTO
    {
        $features = $this->getAllFeatures();

        $feature = array_filter($features, fn($f) => $f->getId() === $fId);

        return array_pop($feature); // Retourne le premier élément ou null si aucun n'est trouvé
    }

    public function updateFeatureConfig(FeatureAccessRuleDTO $featureDTO): void
    {
        $key = null;

        $features = json_decode(file_get_contents($this->filePath), true);
        $featureToUpdate = null;
        $featureId = $featureDTO->getId();

        foreach ($features as $k => $feature) {
            if ($featureDTO->getId() === $feature['id']) {
                $key = $k; // On garde la clé pour la modification
                $featureToUpdate = $feature; // On garde la référence de la fonctionnalité à mettre à jour
                break;
            }
        }

        if ($key !== null && $featureToUpdate !== null) {

            // On met à jour la fonctionnalité
            $featureToUpdate['enabled'] = $featureDTO->isEnabled() ?? false; // Changement ici
            $featureToUpdate['name'] = $featureDTO->getName() ?? ucfirst(str_replace('_', ' ', $featureId)); // Changement ici
            $featureToUpdate['id'] = $featureId; // Assure que l'ID est toujours correct
            // Si le minimumAccessRole est null, on le supprime de la configuration
            $featureToUpdate['minimum_access_role'] = $featureDTO->getMinimumAccessRole(); // Changement ici
            $featureToUpdate['requires_owner_match'] = $featureDTO->getRequiresOwnerMatch();
            $featureToUpdate['strict_owner_only'] = $featureDTO->isStrictOwnerOnly(); // Ajout de la propriété strictOwnerOnly

            $features[$key] = $this->clearFeatureStructure($featureToUpdate); // On met à jour la fonctionnalité
        }

        if ($key === null && $featureToUpdate === null) {
            throw new \InvalidArgumentException("Feature with ID '$featureId' not found.");
        }

        $this->persistFeatureConfig($features);
    }

    public function addFeatureConfig(FeatureAccessRuleDTO $featureDTO): void
    {
        $features = $this->getRawFeatureData();

        // Vérifier si la fonctionnalité existe déjà
        foreach ($features as $feature) {
            if ($feature['id'] === $featureDTO->getId()) {
                throw new \InvalidArgumentException("Feature with ID '{$featureDTO->getId()}' already exists.");
            }
        }

        // Ajouter la nouvelle fonctionnalité
        $newFeature = [
            'id' => $featureDTO->getId(),
            'name' => $featureDTO->getName(),
            'enabled' => $featureDTO->isEnabled() ?? false,
            'minimum_access_role' => $featureDTO->getMinimumAccessRole(),
            'requires_owner_match' => $featureDTO->getRequiresOwnerMatch(),
            'strict_owner_only' => $featureDTO->isStrictOwnerOnly(), // Ajout de la propriété strictOwnerOnly
        ];

        array_push($features, $this->clearFeatureStructure($newFeature));
        $this->persistFeatureConfig($features);
    }

    private function persistFeatureConfig(array $features): void
    {
        $features = array_values($features); // Réindexer le tableau pour éviter les clés manquantes
        file_put_contents($this->filePath, json_encode($features, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    private function getRawFeatureData(): array
    {
        $featuresJSON = file_get_contents($this->filePath); // Forcing JSON decode to ensure the JSON extension is loaded

        if ($featuresJSON === false) {
            throw new \RuntimeException("Unable to read features data from file: {$this->filePath}");
        }

        $data = json_decode($featuresJSON, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException("Invalid JSON data in features file: " . json_last_error_msg());
        }

        return $data ?? [];
    }

    private function clearFeatureStructure(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->clearFeatureStructure($value);
            } elseif (
                is_null($value) ||
                (is_string($value) && trim($value) === '') || // Vérifie si c'est une chaîne vide
                (is_bool($value) && $value === false) // Vérifie si c'est un bool
            ) {
                unset($data[$key]);
            }
        }
        return $data;
    }

    public function deleteFeature(string $id): void
    {
        $features = $this->getRawFeatureData();
        $key = null;

        foreach ($features as $k => $feature) {
            if ($id === $feature['id']) {
                $key = $k; // On garde la clé pour la modification
                break;
            }
        }

        if ($key === null) {
            throw new \InvalidArgumentException("Feature with ID '$id' not found.");
        }
        // unset($features[$key]); // Supprimer la fonctionnalité par sa clé

        $this->persistFeatureConfig($features);
    }

    public function checkIfIDExists(string $id): bool
    {
        $features = $this->getRawFeatureData();
        foreach ($features as $feature) {
            if ($feature['id'] === $id) {
                return true; // L'ID existe déjà
            }
        }
        return false; // L'ID n'existe pas
    }
}
