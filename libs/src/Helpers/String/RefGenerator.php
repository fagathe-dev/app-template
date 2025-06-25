<?php

namespace Fagathe\Libs\Helpers\String;

use Fagathe\Libs\Helpers\DateTimeTrait;

trait RefGenerator
{
    use DateTimeTrait;

    /**
     * @param string $prefix
     * 
     * @return string
     */
    public function generateRef(string $prefix = 'REF'): string
    {
        return $prefix . '_' . $this->now()->format('YmdHis');
    }
}
