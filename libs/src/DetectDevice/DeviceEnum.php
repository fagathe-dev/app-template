<?php
namespace Fagathe\Libs\DetectDevice;

enum DeviceEnum: string
{
    case Desktop = 'Desktop';
    case Mobile = 'Mobile';
    case Tablet = 'Tablet'; 
    case Unknown = 'Unknown Device';
}
