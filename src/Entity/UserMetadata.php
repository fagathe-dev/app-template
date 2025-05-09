<?php

namespace App\Entity;

use App\Repository\UserMetadataRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UserMetadataRepository::class)]
class UserMetadata
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'metadatas')]
    private ?User $user = null;

    #[ORM\Column(length: 50)]
    private ?string $md_key = null;

    #[ORM\Column(length: 255)]
    private ?string $md_value = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updated_at = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getMdKey(): ?string
    {
        return $this->md_key;
    }

    public function setMdKey(string $md_key): static
    {
        $this->md_key = $md_key;

        return $this;
    }

    public function getMdValue(): ?string
    {
        return $this->md_value;
    }

    public function setMdValue(string $md_value): static
    {
        $this->md_value = $md_value;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->created_at;
    }

    public function setCreatedAt(\DateTimeImmutable $created_at): static
    {
        $this->created_at = $created_at;

        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updated_at;
    }

    public function setUpdatedAt(?\DateTimeImmutable $updated_at): static
    {
        $this->updated_at = $updated_at;

        return $this;
    }
}
