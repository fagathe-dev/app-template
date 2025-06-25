<?php

namespace Fagathe\Libs\SEO\Tag;

use App\Entity\SeoTag;
use Fagathe\Libs\Helpers\String\StringTrait;

final class MetaTag
{

    use StringTrait;


    public function __construct(private SeoTag $tag) {}

    public function generate(): string
    {
        $name = $this->tag->getName();
        $attribute = $this->tag->getAttribute();
        $content = $this->tag->getContent();

        $html = '<meta ' . $attribute . '="' . $name . '" content="' . $this->cutText($content, 180, '.') . '">' . PHP_EOL;

        if ($this->tag->isOg()) {
            $html .= '<meta property="og:' . $name . '" content="' . $this->cutText($content, 250, '.') . '">' . PHP_EOL;
        }

        return $html;
    }
}
