<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`', indexes: [new ORM\Index(name: 'user_ids', columns: ['username', 'firstname', 'identifier', 'lastname', 'email', ], flags: ['fulltext'])])]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_USERNAME', fields: ['username'])]
#[UniqueEntity(
    fields: ['email'],
    errorPath: 'email',
    message: 'Cette adresse email est déjà utilisée !'
), UniqueEntity(
    fields: ['username'],
    errorPath: 'username',
    message: 'Ce nom d\'utilisateur est déjà utilisé !'
)]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank(message: 'L’email est requis.')]
    #[Assert\Email(message: 'L’email "{{ value }}" n’est pas valide.')]
    private ?string $email = null;

    /**
     * @var list<string> The user roles
     */
    #[ORM\Column]
    private array $roles = [];

    /**
     * @var string The hashed password
     */
    #[ORM\Column]
    private ?string $password = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $firstname = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $lastname = null;

    #[ORM\Column(length: 160, nullable: true)]
    private ?string $identifier = null;

    #[ORM\Column(length: 160, nullable: true)]
    private ?string $api_token = null;

    #[ORM\Column(nullable: true)]
    private ?bool $confirm = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $registered_at = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updated_at = null;

    #[Assert\NotBlank(message: 'Le nom d’utilisateur est requis.')]
    #[Assert\Length(min: 3, max: 100, minMessage: 'Le mot de passe doit contenir au moins {{ limit }} caractères.')]
    #[ORM\Column(length: 100)]
    private ?string $username = null;

    #[ORM\Column(length: 300, nullable: true)]
    private ?string $image = null;

    #[ORM\Column(length: 300, nullable: true)]
    private ?string $cover_image = null;

    /**
     * @var Collection<int, UserRequest>
     */
    #[ORM\OneToMany(targetEntity: UserRequest::class, mappedBy: 'user')]
    private Collection $requests;

    /**
     * @var Collection<int, UserMetadata>
     */
    #[ORM\OneToMany(targetEntity: UserMetadata::class, mappedBy: 'user')]
    private Collection $metadatas;

    public function __construct()
    {
        $this->requests = new ArrayCollection();
        $this->metadatas = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    /**
     * A visual identifier that represents this user.
     *
     * @see UserInterface
     */
    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    /**
     * @see UserInterface
     *
     * @return list<string>
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        // guarantee every user at least has ROLE_USER
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    /**
     * @param list<string> $roles
     */
    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    /**
     * @see UserInterface
     */
    public function eraseCredentials(): void
    {
        // If you store any temporary, sensitive data on the user, clear it here
        // $this->plainPassword = null;
    }

    public function getFirstname(): ?string
    {
        return $this->firstname;
    }

    public function setFirstname(?string $firstname): static
    {
        $this->firstname = $firstname;

        return $this;
    }

    public function getLastname(): ?string
    {
        return $this->lastname;
    }

    public function setLastname(?string $lastname): static
    {
        $this->lastname = $lastname;

        return $this;
    }

    public function getIdentifier(): ?string
    {
        return $this->identifier;
    }

    public function setIdentifier(?string $identifier): static
    {
        $this->identifier = $identifier;

        return $this;
    }

    public function getApiToken(): ?string
    {
        return $this->api_token;
    }

    public function setApiToken(?string $api_token): static
    {
        $this->api_token = $api_token;

        return $this;
    }

    public function isConfirm(): ?bool
    {
        return $this->confirm;
    }

    public function setConfirm(?bool $confirm): static
    {
        $this->confirm = $confirm;

        return $this;
    }

    public function getRegisteredAt(): ?\DateTimeImmutable
    {
        return $this->registered_at;
    }

    public function setRegisteredAt(\DateTimeImmutable $registered_at): static
    {
        $this->registered_at = $registered_at;

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

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function setUsername(string $username): static
    {
        $this->username = $username;

        return $this;
    }

    public function getImage(): ?string
    {
        return $this->image;
    }

    public function setImage(?string $image): static
    {
        $this->image = $image;

        return $this;
    }

    public function getCoverImage(): ?string
    {
        return $this->cover_image;
    }

    public function setCoverImage(?string $cover_image): static
    {
        $this->cover_image = $cover_image;

        return $this;
    }

    /**
     * @return Collection<int, UserRequest>
     */
    public function getRequests(): Collection
    {
        return $this->requests;
    }

    public function addRequest(UserRequest $request): static
    {
        if (!$this->requests->contains($request)) {
            $this->requests->add($request);
            $request->setUser($this);
        }

        return $this;
    }

    public function removeRequest(UserRequest $request): static
    {
        if ($this->requests->removeElement($request)) {
            // set the owning side to null (unless already changed)
            if ($request->getUser() === $this) {
                $request->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, UserMetadata>
     */
    public function getMetadatas(): Collection
    {
        return $this->metadatas;
    }

    public function addMetadata(UserMetadata $metadata): static
    {
        if (!$this->metadatas->contains($metadata)) {
            $this->metadatas->add($metadata);
            $metadata->setUser($this);
        }

        return $this;
    }

    public function removeMetadata(UserMetadata $metadata): static
    {
        if ($this->metadatas->removeElement($metadata)) {
            // set the owning side to null (unless already changed)
            if ($metadata->getUser() === $this) {
                $metadata->setUser(null);
            }
        }

        return $this;
    }
}
