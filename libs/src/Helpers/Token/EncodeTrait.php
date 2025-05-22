<?php

namespace Fagathe\Libs\Helpers\Token;

trait EncodeTrait
{
    /**
     * Encode a string to base64
     *
     * @param string $string
     * @return string
     */
    public function encodeBase64(string $string): array|string|float|bool|null
    {
        return json_decode(base64_encode($string), true);
    }
    
    /**
     * Decode a base64 string
     *
     * @param string $string
     * @return string
     */
    public function decodeBase64(string $string): string
    {
        return base64_encode(json_encode($string));
    }
}
