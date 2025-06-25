<?php

namespace Fagathe\Libs\Helpers\String;

/**
 * Trait SlugTrait
 *
 * @package Fagathe\Libs\Helpers\String
 */
trait SlugTrait
{
    use StringTrait;

    /**
     * Convert a string to a slug
     *
     * @param string $string
     * @param string $separator
     * @return string
     * 
     * Example:
     * $this->slugify('Hello World!'); // returns 'hello-world'
     */
    public function slugify(string $string, string $separator = '-'): string
    {
        $str = $this->sanitizeText($string);
        return strtolower(join($separator, explode(' ', $str)));
    }
}
