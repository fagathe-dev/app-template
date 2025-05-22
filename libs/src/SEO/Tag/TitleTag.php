<?php
namespace Fagathe\Libs\SEO\Tag;
use App\Entity\Seo;

final class TitleTag
{

    public function __construct(private Seo $seo)
    {
    }

    /**
     * Generates and returns the meta title tag as a string.
     *
     * @return string The generated meta title tag.
     */
    public function generate(): string
    {
        $title = $this->seo->getTitle();

        if (empty($title)) {
            return '';
        }

        return '<title>' . wordwrap(htmlspecialchars($title, ENT_QUOTES, 'UTF-8'), 70) . '</title>' . PHP_EOL;
    }

}