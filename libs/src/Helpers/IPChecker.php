<?php

namespace Fagathe\Libs\Helpers;

use Fagathe\Libs\Logger\Logger;
use Fagathe\Libs\Logger\LoggerLevelEnum;

/**
 * Class IPChecker
 *
 * A final class responsible for handling IP-related checks and validations.
 *
 * @package App\Helpers
 */
final class IPChecker
{
    public const IP_COOKIE_NAME = '__ffr_v4';
    public const ENCODING_PREFIX = 'FAG_.';

    private const LOG_FILE = 'ip-checker/find-ip';
    private DomainChecker $domainChecker;
    public function __construct()
    {
        $this->domainChecker = new DomainChecker();
    }

    /**
     * Retrieves the public IPv4 address of the user.
     *
     * This method fetches the user's public IPv4 address by making an external
     * HTTP request to a service that returns the IP address. It ensures that
     * the returned value is a valid public IPv4 address in string format.
     *
     * @return string The user's public IPv4 address.
     *
     * @example
     * $domainChecker = new DomainChecker(); // Assuming DomainChecker is properly instantiated
     * $ipChecker = new IPChecker($domainChecker);
     * $userIP = $ipChecker->getUserIPv4();
     * echo $userIP; // Output: "203.0.113.42" (example output)
     */
    private function getUserIPv4(): string
    {
        try {
            // create & initialize a curl session
            $curl = curl_init();
            $this->generateLog(
                ['message' => 'Starting cURL session to retrieve IP address'],
                ['action' => __METHOD__],
                LoggerLevelEnum::Debug,
            );

            // set our url with curl_setopt()
            curl_setopt($curl, CURLOPT_URL, "http://httpbin.org/ip");

            // return the transfer as a string, also with setopt()
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);

            // curl_exec() executes the started curl session
            // $output contains the output string
            $output = curl_exec($curl);

            // close curl resource to free up system resources
            // (deletes the variable made by curl_init)
            curl_close($curl);
            $ip = json_decode($output, true);
            $ipAddress = $ip['origin'];

            $this->generateLog(
                content: [
                    'message' => 'Ending cURL session to retrieve IP address',
                    'data' => $ipAddress
                ],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Debug,
            );

            // Create a cookie to store the IP address; expires in 1800 seconds (30 minutes)
            $_COOKIE[self::IP_COOKIE_NAME] = self::ENCODING_PREFIX . base64_encode($ipAddress);

            return $ipAddress;
        } catch (\Exception $e) {
            // Handle the exception (e.g., log it, return a default value, etc.)
            $this->generateLog(
                ['message' => 'Error retrieving IP address: ' . $e->getMessage()],
                ['action' => __METHOD__]
            );
        }

        return 'unknown IP address';
    }

    /**
     * Retrieves the IP address of the client.
     *
     * This method returns the IP address of the client making the request.
     * It can be used to identify the source of the request for logging,
     * analytics, or security purposes.
     *
     * @return string The IP address of the client.
     *
     * @example
     * $ipChecker = new IPChecker();
     * $clientIp = $ipChecker->getIp();
     * echo $clientIp; // Outputs: "192.168.1.1" (example IP address)
     */
    public function getIp(): string
    {
        // Check if the IP address is already stored in a cookie
        if (isset($_COOKIE[self::IP_COOKIE_NAME])) {

            $retrivedIp = $_COOKIE[self::IP_COOKIE_NAME];
            $retrivedIp = str_replace(self::ENCODING_PREFIX, '', $retrivedIp);
            // If the cookie is set, return the stored IP address
            return base64_decode($retrivedIp);
        }

        return $this->getUserIPv4();
    }


    /**
     * @param array $content
     * @param array $context
     * @param LoggerLevelEnum $level
     * 
     * @return void
     */
    private function generateLog(array $content, array $context = [], LoggerLevelEnum $level = LoggerLevelEnum::Error): void
    {
        echo 'Logging: ' . '</br>';
        $logger = new Logger(static::LOG_FILE, boolLogIP: false);
        $logger->log($level, $content, $context);
    }
}
