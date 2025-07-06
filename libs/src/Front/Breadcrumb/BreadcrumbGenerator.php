<?php

namespace Fagathe\Libs\Front\Breadcrumb;

use Fagathe\Libs\Helpers\Request\RequestTrait;
use Fagathe\Libs\Front\Breadcrumb\Breadcrumb;
use Fagathe\Libs\Front\Breadcrumb\BreadcrumbItem;

class BreadcrumbGenerator
{

    use RequestTrait;

    private const DEFAULT_BASE_ROUTE = '/';
    private const ADMIN_BASE_ROUTE = '/admin/dashboard';

    public function __construct(
        private ?Breadcrumb $breadcrumb = null
    ) {}

    /**
     * breadcrumbStart
     *
     * @return string
     */
    private function breadcrumbStart(): string
    {
        $items = $this->breadcrumb->getItems();
        $lastItem = end($items);

        return '<div class="row">
                    <div class="col-12">
                        <div class="page-title-box d-sm-flex align-items-center justify-content-between">
                            
                            <h4 class="mb-sm-0">' . $lastItem->getName() . '</h4>

                            <nav class="page-title-right" style="--vz-breadcrumb-divider: \'' . $this->breadcrumb->getSeparator() . '\';" aria-label="breadcrumb">
                                <ol class="breadcrumb">';
    }

    /**
     * breadcrumbEnd
     *
     * @return string
     */
    private function breadcrumbEnd(): string
    {
        return '                </ol>
                            </nav>
                        </div>
                    </div>
                </div>';
    }

    /**
     * breadcrumbItem
     *
     * @param  mixed $item
     * @param  mixed $isActive
     * @return string
     */
    private function breadcrumbItem(BreadcrumbItem $item, bool $isActive = false): string
    {
        $active = $isActive ? ' active" aria-current="page' : '';
        $html = '<li class="breadcrumb-item' . $active . '">';
        $html .= $isActive || is_null($item->getLink()) ? $item->getName() : '<a href="' . $item->getLink() . '">' . $item->getName() . '</a>';

        return $html . '</li>';
    }

    /**
     * lastKey
     *
     * @param  mixed $arr
     * @return int
     */
    private function lastKey(array $arr = []): int
    {
        $keys = array_keys($arr);
        return end($keys);
    }

    /**
     * @return bool
     */
    private function isAdmin(): bool
    {
        return str_starts_with($this->getRequestPath(), '/admin');
    }

    /**
     * generate
     *
     * @return string
     */
    public function generate(): ?string
    {
        if ($this->breadcrumb->getHomePage()) {
            $route = match (true) {
                $this->isAdmin() => static::ADMIN_BASE_ROUTE,
                default => static::DEFAULT_BASE_ROUTE,
            };

            $this->breadcrumb->addItem(new BreadcrumbItem('Accueil', $route));
        }

        $html = $this->breadcrumbStart();
        $lastKey = $this->lastKey($this->breadcrumb->getItems());

        foreach ($this->breadcrumb->getItems() as $key => $item) {
            $html .= $this->breadcrumbItem($item, $key === $lastKey);
        }
        $html .= $this->breadcrumbEnd();

        return $html;
    }
}
