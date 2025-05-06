<?php

namespace Fagathe\Libs\JSON;

interface JsonPersistInterface
{

    /**
     * Persists the given data.
     *
     * This method is responsible for saving or processing the provided
     * array of data. The implementation details depend on the class
     * implementing this interface.
     * @param array $data The data to be persisted. Defaults to an empty array.
     *
     * @return void
     */
    public function persist(array $data = []): void;
}
