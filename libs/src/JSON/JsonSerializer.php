<?php

namespace Fagathe\Libs\JSON;

use DateTimeImmutable;
use InvalidArgumentException;
use ReflectionClass;
use ReflectionProperty;

final class JsonSerializer
{

    public const OBJECT_TO_POPULATE = 'object_to_populate';

    /**
     * @param object $object
     * @param bool $boolJsonPretty
     * 
     * @return string
     */
    public function serialize(object $object, bool $boolJsonPretty = false): string
    {
        if ($boolJsonPretty === true) {
            return json_encode($this->normalize($object), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }

        return json_encode($this->normalize($object), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    /**
     * @param object $object
     * 
     * @return array
     */
    public function normalize(object $object): array
    {
        $reflection = new ReflectionClass($object);
        $properties = $reflection->getProperties();
        $data = [];

        foreach ($properties as $property) {
            $property->setAccessible(true);
            $value = $property->getValue($object);
            dump(gettype($value));
            if (gettype($value) === 'object') {
                $propRefection = new ReflectionClass($value);
                if ($value instanceof DateTimeImmutable) {
                    $value = $value->format('Y-m-d H:i:s');
                } elseif ($propRefection->isEnum()) {
                    $value = $value->value;
                }
            }

            // Gérer le formatage de DateTimeImmutable
            $data[$property->getName()] = $value;
        }

        return $data;
    }


    public function deserialize(array $vars, string $class_to_serialize, ?array $context = []): object
    {
        if (!class_exists($class_to_serialize)) {
            throw new InvalidArgumentException("La classe `{$class_to_serialize}` n'existe pas.");
        }
        $has_object_to_populate = is_array($context) && array_key_exists(self::OBJECT_TO_POPULATE, $context) && $context[self::OBJECT_TO_POPULATE] instanceof $class_to_serialize;

        $reflection = new ReflectionClass($class_to_serialize);
        $props = $reflection->getProperties(ReflectionProperty::IS_PUBLIC | ReflectionProperty::IS_PROTECTED | ReflectionProperty::IS_PRIVATE);
        $object = $has_object_to_populate ? $context[self::OBJECT_TO_POPULATE] : new $class_to_serialize();

        foreach ($vars as $key => $value) {
            $setter = 'set' . ucfirst($key);
            if ($reflection->hasMethod($setter)) {
                $method = $reflection->getMethod($setter);
                if ($method->isPublic() && count($method->getParameters()) === 1) {
                    $param = $method->getParameters()[0];
                    $paramType = $param->getType();

                    if ($paramType && !$paramType->isBuiltin()) {
                        $paramClass = $paramType->getName();
                        if (class_exists($paramClass)) {
                            if ($paramClass === DateTimeImmutable::class) {
                                $value = new DateTimeImmutable($value);
                            } elseif (enum_exists($paramClass)) {
                                $value = $paramClass::tryFrom($value);
                            }
                        }
                    }

                    $method->invoke($object, $value);
                }
            }
        }

        foreach ($props as $key => $prop) {
            $propName = $prop->getName();
            if (!in_array($propName, array_keys($vars))) {
                $setter = $this->getSetter($propName);

                if ($reflection->hasMethod($setter)) {
                    $method = $reflection->getMethod($setter);
                    $param = $method->getParameters()[0];
                    $paramType = $param->getType();
                    $defaultValue = null;
                    $phpType = match ($paramType) {
                        'double' => 'float',
                        'integer' => 'int',
                        'object' => 'object',
                        default => strtolower($paramType),
                    };
                    if ($param->isOptional()) {
                        $defaultValue = match (true) {
                            $param->isDefaultValueAvailable() => $param->getDefaultValue(),
                            $paramType === 'string' => '',
                            $paramType === 'array' => [],
                            in_array($paramType, ['integer', 'double']) => 0,
                            $param->allowsNull() => null,
                            default => null
                        };

                        if ($param->isDefaultValueAvailable()) {
                            $defaultValue = $param->getDefaultValue();
                        } else if ($param->allowsNull()) {
                            $defaultValue = null;
                        } else
                            $object->$setter($defaultValue);
                    } else {
                        throw new InvalidArgumentException('`' . $object::class . '::' . $setter . '()` cannot be null, expect to be ' . $phpType . ' value ' . "\n\r");
                    }
                } else {
                    throw new InvalidArgumentException("La méthode $setter n'est pas publique ou n'existe pas dans la classe $class_to_serialize.");
                }
            }
        }


        return $object;
    }

    /**
     * Denormalizes an array of variables into an object of the specified class.
     *
     * @param array $vars The array of variables to denormalize.
     * @param string $class_to_normalize The fully qualified class name of the object to create.
     * @param array|null $context Optional context to customize the denormalization process.
     * 
     * @return object The denormalized object of the specified class.
     *
     * @example
     * $vars = ['name' => 'John Doe', 'age' => 30];
     * $class_to_normalize = MyClass::class;
     * $options = ['strict' => true];
     * $object_to_populate = null;
     * 
     * $result = $this->denormalize($vars, $class_to_normalize, $options, $object_to_populate);
     * // $result is an instance of MyClass populated with $vars data.
     */
    public function denormalize(array $vars, string $class_to_normalize, ?array $context = []): object
    {
        if (!class_exists($class_to_normalize)) {
            throw new InvalidArgumentException("La classe `{$class_to_normalize}` n'existe pas.");
        }
        $has_object_to_populate = is_array($context) && array_key_exists(self::OBJECT_TO_POPULATE, $context) && $context[self::OBJECT_TO_POPULATE] instanceof $class_to_normalize;

        $reflection = new ReflectionClass($class_to_normalize);
        $props = $reflection->getProperties(ReflectionProperty::IS_PUBLIC | ReflectionProperty::IS_PROTECTED | ReflectionProperty::IS_PRIVATE);
        $object = $has_object_to_populate ? $context[self::OBJECT_TO_POPULATE] : new $class_to_normalize();

        foreach ($vars as $key => $value) {
            $setter = $this->getSetter($key);
            if ($reflection->hasMethod($setter)) {
                $method = $reflection->getMethod($setter);
                if ($method->isPublic()) {
                    $paramType = $method->getParameters()[0]->getType();
                    if ($paramType && !$paramType->isBuiltin()) {
                        $paramClass = $paramType->getName();
                        if (class_exists($paramClass)) {
                            if ($paramClass === 'DateTimeImmutable') {
                                $value = new DateTimeImmutable($value);
                            } elseif (enum_exists($paramClass)) {
                                $value = $paramClass::tryFrom($value);
                            }
                        }
                    }
                    $object->$setter($value);
                } else {
                    throw new InvalidArgumentException("La méthode $setter n'est pas publique ou n'existe pas dans la classe $class_to_normalize.");
                }
            }
        }
        foreach ($props as $key => $prop) {
            $propName = $prop->getName();
            if (!in_array($propName, array_keys($vars))) {
                $setter = $this->getSetter($propName);

                if ($reflection->hasMethod($setter)) {
                    $method = $reflection->getMethod($setter);
                    $param = $method->getParameters()[0];
                    $paramType = $param->getType();
                    $defaultValue = null;
                    $phpType = match ($paramType) {
                        'double' => 'float',
                        'integer' => 'int',
                        'object' => 'object',
                        default => strtolower($paramType),
                    };
                    if ($param->isOptional()) {
                        $defaultValue = match (true) {
                            $param->isDefaultValueAvailable() => $param->getDefaultValue(),
                            $paramType === 'string' => '',
                            $paramType === 'array' => [],
                            in_array($paramType, ['integer', 'double']) => 0,
                            $param->allowsNull() => null,
                            default => null
                        };

                        if ($param->isDefaultValueAvailable()) {
                            $defaultValue = $param->getDefaultValue();
                        } else if ($param->allowsNull()) {
                            $defaultValue = null;
                        } else
                            $object->$setter($defaultValue);
                    } else {
                        throw new InvalidArgumentException('`' . $object::class . '::' . $setter . '()` cannot be null, expect to be ' . $phpType . ' value ' . "\n\r");
                    }
                } else {
                    throw new InvalidArgumentException("La méthode $setter n'est pas publique ou n'existe pas dans la classe $class_to_normalize.");
                }
            }
        }

        return $object;
    }

    private function getSetter(string $property): string
    {
        if (str_contains($property, '_')) {
            $parts = explode('_', $property);
            foreach ($parts as $part) {
                $parts[] = ucfirst($part);
            }
            $property = join('', $parts);
        } else {
            $property = ucfirst($property);
        }

        return 'set' . $property;
    }
}
