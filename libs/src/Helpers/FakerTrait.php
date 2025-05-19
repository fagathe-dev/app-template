<?php

namespace Fagathe\Libs\Helpers;

use DateTimeImmutable;
use Faker\Factory;

trait FakerTrait
{

    /**
     * @param DateTimeImmutable $originalDateTime
     *
     * @return bool|DateTimeImmutable
     */
    public function setRandomDatetimeAfter(DateTimeImmutable $originalDateTime): DateTimeImmutable
    {
        $int = random_int(-60, 300);
        return $originalDateTime->modify(($int < 0 ? '+' : '-') . (string) $int . ' days');
    }

    /**
     * @param array|null $array
     *
     * @return string
     */
    public function setPageContent(?array $array = null): string
    {
        $faker = Factory::create('fr_FR');
        $sentences = is_array($array) ? $array : $faker->sentences(random_int(1, 4));
        $text = [];

        foreach ($sentences as $key => $sentence) {
            $text[$key] = '<p>' . $sentence . '</p>';
        }

        return join("\\n\\r", $text);
    }

    /**
     * @param array|null $array
     * @param int|null $limit
     *
     * @return array
     */
    public function selectRandomArrayElements(?array $array, ?int $limit = null): array
    {
        shuffle($array);
        $array_limit = $limit ?? count($array) - 1;
        return array_slice(
            $array,
            1,
            random_int(1, $array_limit)
        );
    }
    
    /**
     * Get random items of an array
     *
     * @param array $array
     * @param int|null $num
     * 
     * @return array
     * 
     */
    public function randomElements(array $array, ?int $num = null): array
    {
        $count = count($array);
        shuffle($array);
        $array = array_slice($array, 0, $num ?? random_int(1, $count - 1), true);

        return $array;
    }

    /**
     * Get a random item of an array
     *
     * @param array $array
     * @param int|null $num
     * 
     * @return mixed|array|string|bool|null
     * 
     */
    public function randomElement(array $array): mixed
    {
        if (count($array) > 1) {
            $count = count($array) - 1;

            $element = count($array) > 1 ? $array[random_int(0, $count)] : $array[0];

            return $element;
        }

        return $array[0];
    }

    /**
     * surround
     *
     * @param  mixed $text
     * @param  mixed $tag
     * @return string
     */
    public function surround(array $text = [], string $tag = 'p'): string
    {
        $str = '';
        foreach ($text as $p) {
            $str .= "<{$tag}>{$p}</{$tag}>";
        }

        return $str;
    }

}