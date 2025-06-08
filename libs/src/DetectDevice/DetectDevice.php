<?php

namespace Fagathe\Libs\DetectDevice;

use Detection\MobileDetect;
use Fagathe\Libs\DetectDevice\DeviceEnum;
use Fagathe\Libs\DetectDevice\BrowserEnum;
use Symfony\Component\HttpFoundation\Request;

final class DetectDevice
{

    private MobileDetect $detect;
    private Request $request;

    public function __construct()
    {
        $this->detect = new MobileDetect();
        $this->request = Request::createFromGlobals();
        if ($this->request->headers->has('User-Agent')) {
            $this->detect->setUserAgent($this->request->headers->get('User-Agent'));
        }
    }

    /**
     * Determines the type of device being used (e.g., mobile, tablet, desktop).
     *
     * @return DeviceEnum The type of device as a DeviceEnum object.
     *
     * @example
     * ```php
     * $detectDevice = new DetectDevice();
     * $deviceType = $detectDevice->getDeviceType();
     * echo $deviceType; // Output: "mobile", "tablet", or "desktop"
     * ```
     */
    public function getDeviceType(): DeviceEnum
    {
        $device = match (true) {
            $this->detect->isTablet() => DeviceEnum::Tablet,
            $this->detect->isMobile() => DeviceEnum::Mobile,
            $this->detect->isUserAgentEmpty() => DeviceEnum::Unknown,
            default => DeviceEnum::Desktop,
        };

        return $device;
    }

    /**
     * Retrieves the name of the browser being used.
     *
     * This method detects and returns the browser as a BrowserEnum object.
     *
     * @return BrowserEnum The name of the browser.
     *
     * @example
     * ```php
     * $detectDevice = new DetectDevice();
     * $browser = $detectDevice->getBrowser();
     * echo "Browser: " . $browser;
     * // Output: Browser: Chrome (example output, actual result depends on the user's browser)
     * ```
     */
    public function getBrowser(): BrowserEnum
    {
        $browser = match (true) {
            $this->detect->isEdge() || str_contains('Edg', $this->request->get('User-Agent')) => BrowserEnum::Edge,
            $this->detect->isSafari() => BrowserEnum::Safari,
            $this->detect->isFirefox() => BrowserEnum::Firefox,
            $this->detect->isChrome() => BrowserEnum::Chrome,
            $this->detect->isOpera() => BrowserEnum::Opera,
            $this->detect->isUserAgentEmpty() => BrowserEnum::Unknown,
            default => BrowserEnum::Unknown,
        };

        return $browser;
    }
}
