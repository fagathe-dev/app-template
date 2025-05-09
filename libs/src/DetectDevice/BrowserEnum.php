<?php
namespace Fagathe\Libs\DetectDevice;

enum BrowserEnum: string
{
    case Edge = 'Edge';
    case Safari = 'Safari';
    case Firefox = 'Firefox'; 
    case Chrome = 'Chrome'; 
    case Opera = 'Opera'; 
    case Unknown = 'Unknown Browser';
}