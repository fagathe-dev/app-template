<?php

namespace Admin;

use Symfony\Component\HttpKernel\Bundle\Bundle;

final class AdminBundle extends Bundle
{
    public function getPath(): string
    {
        return \dirname(__DIR__);
    }
}
