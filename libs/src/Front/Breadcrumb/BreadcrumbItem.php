<?php

namespace Fagathe\Libs\Front\Breadcrumb;

final class BreadcrumbItem
{

    public function __construct(
        private string $name = '',
        private ?string $link = null
    ) {}


    /**
     * Get the value of link
     * 
     * @return string
     */
    public function getLink(): ?string
    {
        return $this->link;
    }

    /**
     * Get the value of name
     * 
     * @return null|string
     */
    public function getName(): string
    {
        return $this->name;
    }
}
