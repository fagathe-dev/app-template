<?php

namespace Fagathe\Libs\Helpers;

use Symfony\Component\HttpFoundation\Request;

/**
 * Class DomainChecker
 *
 * This class is responsible for performing domain-related checks.
 *
 * @author Frédérick AGATHE <fagathe77@gmail.com>
 */
final class DomainChecker
{

    private Request $request;

    private const ALLOWED_DOMAINS = [
        'fagathe-dev.fr',
    ];

    public function __construct()
    {
        $this->request = Request::createFromGlobals();
    }

    /**
     * Retrieves the main domain of the current application or context.
     *
     * This method returns the primary domain name as a string.
     *
     * @return string The main domain name.
     *
     * @example
     * $domainChecker = new DomainChecker();
     * $mainDomain = $domainChecker->getMainDomain();
     * echo $mainDomain; // Output: "example.com"
     */
    public function getMainDomain(): string
    {
        $host = $this->request->getHost();

        $parts = explode('.', $host);
        $mainDomain = '';

        // Ensure it's a valid domain (e.g., "sub.example.com" → "example.com")
        if (count($parts) > 2) {
            $mainDomain = implode('.', array_slice($parts, -2));
        } else {
            $mainDomain = $host;
        }

        return $mainDomain;
    }

    /**
     * Checks if the given host is an allowed domain.
     *
     * This method verifies whether the provided domain (host) is permitted
     * based on the application's domain rules.
     *
     * @return bool Returns true if the domain is allowed, false otherwise.
     *
     * @example
     * $domainChecker = new DomainChecker();
     * $isAllowed = $domainChecker->isAllowedDomain();
     * // Example output:
     * // $isAllowed = true; // if 'example.com' is an allowed domain
     * // $isAllowed = false; // if 'example.com' is not an allowed domain
     */
    public function isAllowedDomain(): bool
    {
        return in_array($this->getMainDomain(), self::ALLOWED_DOMAINS, true);
    }
}
