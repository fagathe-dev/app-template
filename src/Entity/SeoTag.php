<?php

namespace App\Entity;

use App\Repository\SeoTagRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SeoTagRepository::class)]
class SeoTag
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 160)]
    private ?string $name = null;

    #[ORM\Column(length: 40)]
    private ?string $attribute = null;

    #[ORM\Column(length: 300)]
    private ?string $content = null;

    #[ORM\Column(nullable: true)]
    private ?bool $og = null;

    #[ORM\ManyToOne(inversedBy: 'tags')]
    private ?Seo $seo = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getAttribute(): ?string
    {
        return $this->attribute;
    }

    public function setAttribute(string $attribute): static
    {
        $this->attribute = $attribute;

        return $this;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(string $content): static
    {
        $this->content = $content;

        return $this;
    }

    public function isOg(): ?bool
    {
        return $this->og;
    }

    public function setOg(?bool $og): static
    {
        $this->og = $og;

        return $this;
    }

    public function getSeo(): ?Seo
    {
        return $this->seo;
    }

    public function setSeo(?Seo $seo): static
    {
        $this->seo = $seo;

        return $this;
    }
}
