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
        $this->detect->setUserAgent($this->request->headers->get('User-Agent'));
    }

    public function getDeviceType(): string
    {
        $device = match (true) {
            $this->detect->isTablet() => DeviceEnum::Tablet,
            $this->detect->isMobile() => DeviceEnum::Mobile,
            $this->detect->isUserAgentEmpty() => DeviceEnum::Unknown,
            default => DeviceEnum::Desktop,
        };

        return $device->value;
    }

    public function getBrowser(): string
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

        return $browser->value;
    }
}
