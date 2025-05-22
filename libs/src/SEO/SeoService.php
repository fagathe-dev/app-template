<?php

namespace Fagathe\Libs\SEO;

use App\Entity\Seo;
use App\Entity\SeoTag;
use Fagathe\Libs\Helpers\RequestTrait;
use Fagathe\Libs\Helpers\StringTrait;
use Fagathe\Libs\SEO\Meta\SeoInterface;
use Fagathe\Libs\SEO\Tag\MetaTag;
use Fagathe\Libs\SEO\Tag\TitleTag;

final class SeoService implements SeoInterface
{
    use RequestTrait, StringTrait;

    public function __construct(private ?Seo $seo = null) {}

    /**
     * Generates and returns the meta title tag as a string.
     * @param Seo $seo
     * 
     * @return string The generated meta title tag.
     */
    public function generateTitleTag(Seo $seo): string
    {
        return (new TitleTag($seo))->generate();
    }

    /**
     * Generates and returns the meta tags as a string.
     *
     * @param Seo $seo
     * 
     * @return string The generated meta tags.
     */
    public function generateMetas(Seo $seo): string
    {
        $html = '';

        foreach ($seo->getTags() as $indexTag) {
            $html .= (new MetaTag($indexTag))->generate();
        }

        return $html;
    }

    /**
     * @return string
     */
    private function generateCanonicalTag(): string
    {
        return '<link rel="canonical" href="' . htmlspecialchars($this->getRequestCanonicalUrl(), ENT_QUOTES, 'UTF-8') . '">' . PHP_EOL;
    }

    private function generateDefaultTags(): string
    {
        $html = '<meta charset="UTF-8">' . PHP_EOL .
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">' . PHP_EOL .
            '<meta http-equiv="X-UA-Compatible" content="IE=edge">' . PHP_EOL .
            '<meta name="author" content="' . APP_SEO_AUTHOR_DEFAULT . '">' . PHP_EOL .
            '<meta http-equiv="content-language" content="' . APP_SEO_LANGUAGE . '">' . PHP_EOL .
            '<meta name="locale" content="' . APP_SEO_LOCALE . '">' . PHP_EOL;

        if ($this->seo) {
            $html .= '<meta property="og:site_name" content="' . APP_NAME . '">' . PHP_EOL .
                '<meta property="og:image" content="' . $this->getOrigin() . '/' . APP_SEO_IMAGE . '">' . PHP_EOL;
        }

        return $html;
    }

    /**
     * @param Seo $seo
     * 
     * @return string
     */
    public function generateTags(): string
    {
        $html = '';

        $html .= $this->generateDefaultTags();
        $html .= $this->generateCanonicalTag();

        if ($this->seo) {
            $html .= $this->generateMetas($this->seo);

            if (is_array($this->seo->getKeywords()) && count($this->seo->getKeywords()) > 0) {
                $tag = (new SeoTag)
                    ->setName('keywords')
                    ->setAttribute('name')
                    ->setContent(join(', ', $this->seo->getKeywords()));
                $html .= (new MetaTag($tag))->generate();
            }

            $html .= $this->generateTitleTag($this->seo);

            if ($this->seo->getDescription()) {
                $tag = (new SeoTag)
                    ->setName('description')
                    ->setAttribute('name')
                    ->setContent($this->seo->getDescription())
                    ->setOg(true);
                $html .= (new MetaTag($tag))->generate();
            }

            if ($this->seo->getSettings()) {
                $tag = (new SeoTag)
                    ->setName('robots')
                    ->setAttribute('name')
                    ->setContent(join(', ', $this->seo->getSettings()));
                $html .= (new MetaTag($tag))->generate();
            }

            if (defined('APP_GOOGLE_ANALYTICS_SITE_KEY') && APP_GOOGLE_ANALYTICS_SITE_KEY !== '' && APP_GOOGLE_ANALYTICS_SITE_KEY !== null && APP_ENV !== 'dev') {
                $html .= '<script async src="https://www.googletagmanager.com/gtag/js?id=' . APP_GOOGLE_ANALYTICS_SITE_KEY . '"></script>' . PHP_EOL .
                    '<script>' . PHP_EOL .
                    "\t" . 'window.dataLayer = window.dataLayer || []' . PHP_EOL .
                    "\t" . 'function gtag(){dataLayer.push(arguments);}' . PHP_EOL .
                    "\t" . 'gtag(\'js\', new Date());' . PHP_EOL .

                    "\t" . 'gtag(\'config\', \'' . APP_GOOGLE_ANALYTICS_SITE_KEY . '\');' . PHP_EOL .
                    '</script>' . PHP_EOL;
            }
        }


        return $html;
    }
}
