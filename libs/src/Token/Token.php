<?php

namespace Fagathe\Phplib\Token;

final class Token
{
    public const NUMERIC = '1234567890';

    public const ALPHANUMERIC = 'azertyuiopqsdfghjklmwxcvbnAZERTYUIOPQSDFGHJKLMWXCVBN1234567890';

    public const UPPERCASE = 'AZERTYUIOPQSDFGHJKLMWXCVBN';

    public const LOWERCASE = 'azertyuiopqsdfghjklmwxcvbn';

    /**
     * generate
     *
     * @param  int $length 
     * @param  string $chars 'all' | 'numeric' | 'uppercase' | 'lowercase'
     * @param  bool $unique
     * @return string
     */
    public static function generate(?int $length = 10, ?string $type = 'all', ?bool $unique = false): string
    {
        $chars = match ($type) {
            'uppercase' => static::UPPERCASE,
            'lowercase' => static::LOWERCASE,
            'numeric' => static::NUMERIC,
            default => static::ALPHANUMERIC,
        };
        if ($unique) {
            return uniqid(static::generateRandomString($length, $chars), true);
        }

        return static::generateRandomString($length, $chars);
    }

    /**
     * generateCode
     *
     * @return string
     */
    public static function generateCode(): string
    {
        return static::generateRandomString(6, static::NUMERIC);
    }

    /**
     * generateRandomString
     *
     * @param  mixed $length
     * @param  mixed $chars
     * @return string
     */
    public static function generateRandomString(?int $length = 10, ?string $chars = self::ALPHANUMERIC): string
    {
        return substr(str_shuffle($chars), 0, $length);
    }
}
