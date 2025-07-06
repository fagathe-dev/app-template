<?php

namespace App\DTO;

// src/DTO/FeatureAccessRuleDTO.php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Serializer\Annotation\Groups;

class FeatureAccessRuleDTO
{
    public function __construct(
        #[Assert\NotBlank(message: "L'identifiant de la fonctionnalité ne peut pas être vide.")]
        #[Groups(["feature:read", "feature:write"])]
        private ?string $id = null,

        #[Assert\NotBlank(message: "Le nom de la fonctionnalité ne peut pas être vide.")]
        #[Assert\Length(
            min: 3,
            max: 255,
            minMessage: "Le nom de la fonctionnalité doit contenir au moins {{ limit }} caractères.",
            maxMessage: "Le nom de la fonctionnalité ne peut pas dépasser {{ limit }} caractères."
        )]
        #[Groups(["feature:read", "feature:write"])]
        private ?string $name = null,

        #[Assert\NotNull(message: "Le statut 'activé' de la fonctionnalité doit être spécifié.")]
        #[Assert\Type(type: "bool", message: "Le statut 'activé' doit être un booléen.")]
        #[Groups(["feature:read", "feature:write"])]
        private ?bool $enabled = null,

        #[Assert\Type(type: "string", message: "Le rôle minimum doit être une chaîne de caractères.", groups: ["feature:write"])]
        #[Assert\Regex(
            pattern: '/^(PUBLIC_ACCESS|IS_AUTHENTICATED|ROLE_[A-Z_]+)$/',
            message: "Le format du rôle minimum est invalide (ex: ROLE_USER, PUBLIC_ACCESS).",
            groups: ["feature:write"]
        )]
        #[Groups(["feature:read", "feature:write"])]
        private ?string $minimumAccessRole = null,

        #[Assert\Type(type: "bool", message: "La propriété 'requires_owner_match' doit être un booléen.")]
        #[Groups(["feature:read", "feature:write"])]
        private ?bool $requiresOwnerMatch = null,

        #[Assert\NotNull(message: "La propriété 'strict_owner_only' doit être spécifiée.")]
        #[Assert\Type(type: "bool", message: "La propriété 'strict_owner_only' doit être un booléen.")]
        #[Groups(["feature:read", "feature:write"])]
        private ?bool $strictOwnerOnly = null,
    ) {}

    // Getters
    public function getId(): ?string
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function isEnabled(): ?bool
    {
        return $this->enabled;
    }

    public function getMinimumAccessRole(): ?string
    {
        return $this->minimumAccessRole;
    }

    public function getRequiresOwnerMatch(): ?bool
    {
        return $this->requiresOwnerMatch;
    }

    // Setters
    public function setId(?string $id): self
    {
        $this->id = $id;
        return $this;
    }

    public function setName(?string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function setEnabled(?bool $enabled): self
    {
        $this->enabled = $enabled;
        return $this;
    }

    public function setMinimumAccessRole(?string $minimumAccessRole): self
    {
        $this->minimumAccessRole = $minimumAccessRole;
        return $this;
    }

    public function setRequiresOwnerMatch(?bool $requiresOwnerMatch): self
    {
        $this->requiresOwnerMatch = $requiresOwnerMatch;
        return $this;
    }

    /**
     * Get the value of strictOwnerOnly
     */
    public function isStrictOwnerOnly(): ?bool
    {
        return $this->strictOwnerOnly;
    }

    /**
     * Set the value of strictOwnerOnly
     *
     * @return  self
     */
    public function setStrictOwnerOnly($strictOwnerOnly): static
    {
        $this->strictOwnerOnly = $strictOwnerOnly;

        return $this;
    }

    /**
     * @return bool
     */
    public function hasOwnerVerification(): bool
    {
        return $this->requiresOwnerMatch === true && in_array($this->isStrictOwnerOnly(), [true, false, null]);
    }
}
