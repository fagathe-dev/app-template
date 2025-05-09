<?php

namespace Fagathe\Libs\JSON;

final class JsonService implements JsonPersistInterface
{
    public function __construct(private string $filePath) {}

    /**
     * Persists the given data to the JSON file.
     *
     * This method is responsible for saving or processing the provided
     * array of data. The implementation details depend on the class
     * implementing this interface.
     *
     * @param array $data The data to be persisted. Defaults to an empty array.
     *
     * @return void
     */
    public function persist(array $data = []): void
    {
        try {
            $data = array_values($data);
            $jsonFileManager = new JsonFileManager($this->filePath);
            $jsonFileManager->write($data);
        } catch (JsonFileException $e) {
            // Handle the exception as needed (e.g., log it, rethrow it, etc.)
            // TODO: Implement a logger
            // For now, we'll just echo the error message
            echo 'Une erreur est survenue : ' . $e->getMessage();
        }
    }

    /**
     * Finds one item in the JSON file by a specific key and value.
     *
     * This method reads the JSON file specified by `$filePath` and filters
     * the data based on the provided key and value. It returns the first
     * matching item as an associative array or null if no match is found.
     *
     * @param string $key The key to filter by.
     * @param string|int $value The value to filter by.
     *
     * @return array|null The first matching item as an associative array or null if not found.
     */
    public function findBy(string $key, string|int $value): ?array
    {
        $filteredData = null;
        try {
            $data = $this->findAll();
            if (is_null($data)) {
                // Handle the case where the data is null (e.g., file not found or empty)
                return null;
            }

            // Check if the data is empty and set $filteredData to null
            count($data) === 0 ? null : $filteredData = [];
            $filteredData = array_filter($data, fn($item) => isset($item[$key]) && $item[$key] === $value);

            $filteredData = array_values($filteredData);
        } catch (JsonFileException $e) {
            // Handle the exception as needed (e.g., log it, rethrow it, etc.)
            # TODO: Implement a logger
            // For now, we'll just echo the error message
            echo 'Une erreur est survenue : ' . $e->getMessage();
        }

        return $filteredData;
    }

    /**
     * Finds all items in the JSON file.
     *
     * This method reads the JSON file specified by `$filePath` and returns
     * all items as an associative array. If the file does not exist or is
     * empty, it returns null.
     *
     * @return array|null The decoded JSON data as an associative array or null if not found.
     */
    public function findAll(): ?array
    {
        try {
            $jsonFileManager = new JsonFileManager($this->filePath);
            return $jsonFileManager->read();
        } catch (JsonFileException $e) {
            // Handle the exception as needed (e.g., log it, rethrow it, etc.)
            # TODO: Implement a logger
            // For now, we'll just echo the error message
            echo 'Une erreur est survenue lors de la lecture : ' . $e->getMessage();
        }

        return null;
    }

    /**
     * Finds one item in the JSON file by a specific key and value.
     *
     * This method reads the JSON file specified by `$filePath` and filters
     * the data based on the provided key and value. It returns the first
     * matching item as an associative array or null if no match is found.
     *
     * @param string $key The key to filter by.
     * @param string|int $value The value to filter by.
     *
     * @return array|null The first matching item as an associative array or null if not found.
     */
    public function findOneBy(string $key, string|int $value): ?array
    {
        return $this->findBy($key, $value)[0] ?? null;
    }

    /**
     * Finds one item in the JSON file by a specific identifier.
     *
     * This method reads the JSON file specified by `$filePath` and filters
     * the data based on the provided identifier. It returns the first
     * matching item as an associative array or null if no match is found.
     *
     * @param string|int $id The identifier to filter by.
     * @param string $identifier The key to filter by. Defaults to 'id'.
     *
     * @return array|null The first matching item as an associative array or null if not found.
     */
    public function find(string|int $id, string $identifier = 'id'): ?array
    {
        return $this->findOneBy($identifier, $id);
    }

    /**
     * Adds a new item to the JSON file.
     *
     * This method reads the existing data from the JSON file, appends the
     * new item to the array, and then persists the updated data back to the file.
     *
     * @param string $identifier The key to filter by. Defaults to 'id'.
     * @param array $data The new item to add as an associative array.
     *
     * @return void
     */
    public function add(array $data, string $identifier = 'id'): void
    {
        try {
            $existingData = $this->findAll();
            if ($existingData === null) {
                $existingData = [];
            }
            $existingData[] = [$identifier => $this->getLastIndex($identifier), ...$data];
            $this->persist($existingData);
        } catch (JsonFileException $e) {
            // Handle the exception as needed (e.g., log it, rethrow it, etc.)
            # TODO: Implement a logger
            // For now, we'll just echo the error message
            echo 'Une erreur est survenue lors de l\'ajout : ' . $e->getMessage();
        }
    }

    /**
     * Generates a new ID for the item to be added.
     * @param string $identifier The key to filter by. Defaults to 'id'.
     * 
     * @return int The new ID for the item.
     */
    private function getLastIndex(string $identifier = 'id'): int
    {
        $data = $this->findAll();
        if ($data === null) {
            return 0; // Return 0 if the data is null (e.g., file not found or empty)
        }
        // Check if the data is empty and return 0 if it is
        if (count($data) === 0) {
            return 0;
        }
        // Check if the data is not empty and return the maximum ID
        // Use array_column to extract the 'id' values and then use max to find the maximum
        return max(array_column($data, $identifier)) + 1;
    }

    /**
     * Updates an item in the JSON file by a specific identifier.
     *
     * This method reads the JSON file specified by `$filePath`, updates the
     * item with the given identifier, and then persists the updated data back to the file.
     *
     * @param string|int $id The identifier of the item to update.
     * @param array $data The new data to update the item with.
     * @param string $identifier The key to filter by. Defaults to 'id'.
     *
     * @return void
     */
    public function update(string|int $id, array $data, string $identifier = 'id'): void
    {
        try {
            $existingData = $this->findAll();
            if ($existingData === null) {
                return;
            }
            $updatedData = array_map(function ($item) use ($identifier, $id, $data) {
                if (isset($item[$identifier]) && $item[$identifier] === $id) {
                    return array_merge($item, $data);
                }
                return $item;
            }, $existingData);
            $this->persist($updatedData);
        } catch (JsonFileException $e) {
            // Handle the exception as needed (e.g., log it, rethrow it, etc.)
            #   TODO: Implement a logger
            // For now, we'll just echo the error message
            echo 'Une erreur est survenue lors de la mise à jour : ' . $e->getMessage();
        }
    }

    /**
     * Removes an item from the JSON file by a specific identifier.
     *
     * This method reads the JSON file specified by `$filePath`, filters
     * the data to exclude the item with the given identifier, and then
     * persists the updated data back to the file.
     *
     * @param string|int $id The identifier of the item to remove.
     * @param string $identifier The key to filter by. Defaults to 'id'.
     *
     * @return void
     */
    public function remove(string|int $id, string $identifier = 'id'): void
    {
        try {
            $data = $this->findAll();
            if ($data === null) {
                return;
            }
            $filteredData = array_filter($data, function ($item) use ($identifier, $id) {
                return isset($item[$identifier]) && $item[$identifier] !== $id;
            });
            $this->persist($filteredData);
        } catch (JsonFileException $e) {
            // Handle the exception as needed (e.g., log it, rethrow it, etc.)
            # TODO: Implement a logger
            // For now, we'll just echo the error message
            echo 'Une erreur est survenue lors de la suppression : ' . $e->getMessage();
        }
    }
}
