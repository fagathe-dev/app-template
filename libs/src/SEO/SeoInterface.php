<?php

namespace Fagathe\Libs\SEO;

use App\Entity\Seo;

interface SeoInterface
{
    /**
     * @param Seo $seo
     * 
     * @return string
     */
    public function generateTitleTag(Seo $seo): string;

    /**
     * @param Seo $seo
     * 
     * @return string
     */
    public function generateMetas(Seo $seo): string;

    /**
     * @param Seo $seo
     * 
     * @return string
     */
    public function generateTags(): string;
}
