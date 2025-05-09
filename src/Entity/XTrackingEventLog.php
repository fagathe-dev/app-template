<?php

namespace App\Entity;

use App\Repository\XTrackingEventLogRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: XTrackingEventLogRepository::class)]
class XTrackingEventLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 300)]
    private ?string $origin = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $timestamp = null;

    #[ORM\Column(length: 50)]
    private ?string $device = null;

    #[ORM\Column(length: 60)]
    private ?string $category = null;

    #[ORM\ManyToOne(inversedBy: 'logs')]
    private ?XTrackingEvent $event = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getOrigin(): ?string
    {
        return $this->origin;
    }

    public function setOrigin(string $origin): static
    {
        $this->origin = $origin;

        return $this;
    }

    public function getTimestamp(): ?\DateTimeImmutable
    {
        return $this->timestamp;
    }

    public function setTimestamp(\DateTimeImmutable $timestamp): static
    {
        $this->timestamp = $timestamp;

        return $this;
    }

    public function getDevice(): ?string
    {
        return $this->device;
    }

    public function setDevice(string $device): static
    {
        $this->device = $device;

        return $this;
    }

    public function getCategory(): ?string
    {
        return $this->category;
    }

    public function setCategory(string $category): static
    {
        $this->category = $category;

        return $this;
    }

    public function getEvent(): ?XTrackingEvent
    {
        return $this->event;
    }

    public function setEvent(?XTrackingEvent $event): static
    {
        $this->event = $event;

        return $this;
    }
}
