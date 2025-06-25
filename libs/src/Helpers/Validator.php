<?php
namespace Fagathe\Libs\Helpers;

final class Validator
{
    /**
     * Validate an email address.
     *
     * @param string $email
     * @return bool
     */
    public static function isValidEmail(string $email): bool
    {
        $regex = "/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/";

        if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
            // Check if the domain has an MX record
            $domain = substr(strrchr($email, "@"), 1);
            return checkdnsrr($domain, "MX");
        };

        if (preg_match($regex, $email)) {
            // Check if the domain has an MX record
            $domain = substr(strrchr($email, "@"), 1);
            return checkdnsrr($domain, "MX");
        }

        return false;
    }

    /**
     * Validate a URL.
     *
     * @param string $url
     * @return bool
     */
    public static function isValidUrl(string $url): bool
    {
        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }
}