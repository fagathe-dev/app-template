<?php

namespace App\Entity;

use App\Repository\RequestRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RequestRepository::class)]
class Request
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 60)]
    private ?string $state = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $message = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updated_at = null;

    /**
     * @var Collection<int, File>
     */
    #[ORM\OneToMany(targetEntity: File::class, mappedBy: 'request')]
    private Collection $file;

    #[ORM\Column(length: 40)]
    private ?string $type = null;

    /**
     * @var Collection<int, RequestMetadata>
     */
    #[ORM\OneToMany(targetEntity: RequestMetadata::class, mappedBy: 'request')]
    private Collection $metadatas;

    public function __construct()
    {
        $this->file = new ArrayCollection();
        $this->metadatas = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getState(): ?string
    {
        return $this->state;
    }

    public function setState(string $state): static
    {
        $this->state = $state;

        return $this;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function setMessage(string $message): static
    {
        $this->message = $message;

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

    /**
     * @return Collection<int, File>
     */
    public function getFile(): Collection
    {
        return $this->file;
    }

    public function addFile(File $file): static
    {
        if (!$this->file->contains($file)) {
            $this->file->add($file);
            $file->setRequest($this);
        }

        return $this;
    }

    public function removeFile(File $file): static
    {
        if ($this->file->removeElement($file)) {
            // set the owning side to null (unless already changed)
            if ($file->getRequest() === $this) {
                $file->setRequest(null);
            }
        }

        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;

        return $this;
    }

    /**
     * @return Collection<int, RequestMetadata>
     */
    public function getMetadatas(): Collection
    {
        return $this->metadatas;
    }

    public function addMetadata(RequestMetadata $metadata): static
    {
        if (!$this->metadatas->contains($metadata)) {
            $this->metadatas->add($metadata);
            $metadata->setRequest($this);
        }

        return $this;
    }

    public function removeMetadata(RequestMetadata $metadata): static
    {
        if ($this->metadatas->removeElement($metadata)) {
            // set the owning side to null (unless already changed)
            if ($metadata->getRequest() === $this) {
                $metadata->setRequest(null);
            }
        }

        return $this;
    }
}
