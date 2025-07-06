<?php

// src/Security/Voter/FeatureAccessRuleVoter.php
namespace App\Security\Voter;

use Admin\Service\FeatureAccessRuleService;
use Fagathe\Libs\Logger\Logger;
use Fagathe\Libs\Logger\LoggerLevelEnum;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\User\UserInterface;
// La classe Security à utiliser pour les versions récentes de Symfony
use Symfony\Bundle\SecurityBundle\Security;

class FeatureAccessRuleVoter extends Voter
{
    // Attributs que ce voter peut gérer. Ce sont les IDs de vos features.
    public const EDIT_ARTICLE = 'edit_article';
    public const DELETE_ARTICLE = 'delete_article';
    public const USER_PROFILE_EDIT = 'user_profiles_edit';
    public const COMMENTING = 'commenting';
    public const PUBLIC_HOMEPAGE_FEATURE = 'public_homepage_feature';
    private const LOG_FILE = 'security/feature-access-rule-voter';


    public function __construct(
        private readonly FeatureAccessRuleService $featureService,
        private readonly Security $security
    ) {}

    protected function supports(string $attribute, mixed $subject): bool
    {
        // Vérifier si l'attribut est une fonctionnalité que nous gérons (par son ID)
        $featureConfig = $this->featureService->getFeatureConfig($attribute);
        if (null === $featureConfig) {
            $this->generateLog(
                ['message' => 'Contrôle de permission `' . $attribute . '` non reconnu'],
                ['action' => __METHOD__],
                LoggerLevelEnum::Debug,
            );
            return false; // Ce n'est pas une fonctionnalité que nous connaissons
        }

        // Si la fonctionnalité NE nécessite PAS de "owner match", le sujet peut être null ou non utilisé.
        // On retourne true car le voter supporte l'attribut.
        if (!($featureConfig->getRequiresOwnerMatch() ?? false)) {
            return true;
        }

        if ($subject === null && $featureConfig->getRequiresOwnerMatch()) {
            // Si le sujet est null, on ne peut pas vérifier le propriétaire, donc on refuse l'accès
            return true;
        }

        // Si la fonctionnalité REQUIERT un "owner match", le sujet DOIT être un objet
        // et cet objet doit avoir une méthode pour obtenir son propriétaire.
        return is_object($subject) && $this->hasOwnerResource($subject);
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        // 1. Initialiser les variables nécessaires
        $featureId = $attribute; // L'ID de la fonctionnalité est l'attribut
        $resource = $subject;    // La ressource (ex: Article, UserProfile) est le sujet
        $user = $token->getUser(); // L'utilisateur authentifié (peut être null)
        $canProceed = true; // Variable pour contrôler si l'accès peut être accordé ou non

        // Récupérer la configuration d'accès(permission) de la fonctionnalité
        $featureConfig = $this->featureService->getFeatureConfig($featureId);

        // Si la fonctionnalité n'existe pas ou n'est pas définie, on refuse l'accès par défaut.
        if (null === $featureConfig) {
            return false;
        }

        // Vérifier si le contrôle de l'accès est actif
        if (!($featureConfig->isEnabled() ?? false)) {
            return true; // Si le controle d'accès est désactivé, on autorise l'accès.
        }

        $minimumAccessRole = $featureConfig->getMinimumAccessRole() ?? null;
        $resourceOwner = null;

        // 4. Vérifier l'accès par rôle minimum
        $hasRoleAccess = false;
        if (null === $minimumAccessRole) {
            // Si aucun rôle minimum n'est spécifié, la fonctionnalité est publique (si enabled est true)
            $hasRoleAccess = true;
            $featureConfig->setMinimumAccessRole('PUBLIC_ACCESS'); // On considère que l'accès public est accordé
        } elseif (!$user instanceof UserInterface && $minimumAccessRole !== null) {
            // Si un rôle minimum est spécifié mais l'utilisateur n'est pas authentifié
            $hasRoleAccess = false;
            $canProceed = false; // On refuse l'accès si l'utilisateur n'est pas authentifié
        } else {
            // Utilisation de la nouvelle classe Security pour vérifier le rôle
            $hasRoleAccess = $this->security->isGranted($minimumAccessRole);
        }

        if ($resource !== null && $canProceed) {
            // Si le sujet est null et la fonctionnalité requiert un "owner match", on refuse l'accès
            // 3. Récupérer le rôle minimum requis
            if ($featureConfig->hasOwnerVerification()) {
                if ($user === null) {
                    $this->generateLog(
                        ['message' => 'Accès refusé : utilisateur non authentifié pour cette fonctionnalité `' . $featureId . '`'],
                        ['action' => __METHOD__],
                        LoggerLevelEnum::Warning,
                    );
                    return false; // Si l'utilisateur n'est pas authentifié, on refuse l'accès
                }

                // Si la fonctionnalité nécessite une vérification de propriétaire
                $resourceOwner = $this->getResourceOwner($resource);

                $isOwner = $user->getUserIdentifier() === $resourceOwner->getUserIdentifier();

                if ($resourceOwner === null) {
                    return false; // Si le propriétaire de la ressource est null, on refuse l'accès
                }

                $canProceed = match (true) {
                    $isOwner && in_array($featureConfig->isStrictOwnerOnly(), [true, false, null]) => true, // Si la fonctionnalité est strictement réservée au propriétaire et le propriétaire est null
                    $isOwner === false && $featureConfig->isStrictOwnerOnly() => false, // Si l'utilisateur n'est pas le propriétaire et la fonctionnalité est strictement réservée au propriétaire, on refuse l'accès
                    default => true, // Sinon, on continue
                };
            }

            return $canProceed; // Si on peut continuer, on retourne le résultat
        }

        if (!$canProceed) {
            return false; // Si on ne peut pas continuer, on refuse l'accès
        }

        $canProceed = $hasRoleAccess; // On met à jour la variable canProceed avec le résultat de la vérification du rôle
        if (!$hasRoleAccess) {
            $this->generateLog(
                ['message' => 'Accès refusé : rôle insuffisant pour la fonctionnalité `' . $featureId . '`'],
                ['action' => __METHOD__, 'uid' => $user?->getUserIdentifier() ?? 'anonymous'],
                LoggerLevelEnum::Warning,
            );
        }

        return $canProceed;
    }

    private function hasOwnerResource(mixed $resource): bool
    {
        // Vérifie si le sujet a une méthode pour obtenir son propriétaire
        return is_object($resource) && (method_exists($resource, 'getOwner') || method_exists($resource, 'getUser') || method_exists($resource, 'getAuthor'));
    }

    private function getResourceOwner(mixed $resource): ?UserInterface
    {
        if (!is_object($resource) || is_null($resource)) {
            return null; // Si le sujet n'est pas un objet, on ne peut pas obtenir son propriétaire
        }

        // Récupère le propriétaire de la ressource si possible
        if (method_exists($resource, 'getOwner')) {
            return $resource->getOwner();
        } elseif (method_exists($resource, 'getUser')) {
            return $resource->getUser();
        } elseif (method_exists($resource, 'getAuthor')) {
            return $resource->getAuthor();
        }
        return null;
    }

    /**
     * @param array $content
     * @param array $context
     * @param LoggerLevelEnum $level
     * 
     * @return void
     */
    private function generateLog(array $content, array $context = [], LoggerLevelEnum $level = LoggerLevelEnum::Error): void
    {
        $logger = new Logger(static::LOG_FILE, boolLogIP: false);
        $logger->log($level, $content, $context);
    }
}
