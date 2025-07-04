<?php

namespace Fagathe\Libs\Helpers\Request;

/**
 * Class NativeSession
 * @package Fagathe\Libs\Helpers\Request
 */
class NativeSession
{

    public function __construct()
    {
        $this->start(); // Démarre la session si elle n'est pas déjà active
    }

    public function add(string $key, mixed $value): self
    {
        $_SESSION[$key] = [...($_SESSION[$key] ?? []), $value];

        return $this;
    }

    /**
     * Définit une valeur en session.
     *
     * @param string $key La clé de session.
     * @param mixed $value La valeur à stocker.
     *
     * @example
     * $session->set('user_id', 42);
     */
    public function set(string $key, mixed $value): self
    {
        $_SESSION[$key] = $value;

        return $this;
    }

    /**
     * Récupère une valeur depuis la session.
     *
     * @param string $key La clé de session.
     * @param mixed $defaultValue La valeur par défaut si la clé n'existe pas.
     * @return mixed La valeur stockée ou la valeur par défaut.
     *
     * @example
     * $userId = $session->get('user_id', 0);
     */
    public function get(string $key, mixed $defaultValue = null): mixed
    {
        return $_SESSION[$key] ?? $defaultValue;
    }

    /**
     * Vérifie si une clé existe et n'est pas nulle dans la session.
     *
     * @param string $key La clé à vérifier.
     * @return bool Vrai si la clé existe et n'est pas nulle.
     *
     * @example
     * if ($session->has('user_id')) { ... }
     */
    public function has(string $key): bool
    {
        return array_key_exists($key, $_SESSION) && $this->get($key) !== null;
    }

    /**
     * Supprime une clé de la session.
     *
     * @param string $key La clé à supprimer.
     *
     * @example
     * $session->remove('user_id');
     */
    public function remove(string $key): void
    {
        unset($_SESSION[$key]);
    }

    /**
     * Vide toutes les variables de session.
     *
     * @example
     * $session->clear();
     */
    public function clear(): void
    {
        session_unset();
    }

    /**
     * Détruit complètement la session.
     *
     * @example
     * $session->destroy();
     */
    public function destroy(): void
    {
        session_destroy();
    }

    /**
     * Démarre la session si elle n'est pas déjà active.
     *
     * @example
     * $session->start();
     */
    public function start(): void
    {
        if ($this->isStarted() === false) {
            session_start();
        }
    }

    /**
     * Régénère l'identifiant de session.
     *
     * @param bool $deleteOldSession Supprime l'ancienne session si vrai.
     *
     * @example
     * $session->regenerate(true);
     */
    public function regenerate(bool $deleteOldSession = false): void
    {
        session_regenerate_id($deleteOldSession);
    }

    /**
     * Récupère l'identifiant de session courant.
     *
     * @return string L'identifiant de session.
     *
     * @example
     * $id = $session->getId();
     */
    public function getId(): string
    {
        return session_id();
    }

    public function keys(): array
    {
        return array_keys($_SESSION);
    }

    public function values(): array
    {
        return array_values($_SESSION);
    }

    /**
     * Définit l'identifiant de session.
     *
     * @param string $id L'identifiant à définir.
     *
     * @example
     * $session->setId('my-session-id');
     */
    public function setId(string $id): void
    {
        session_id($id);
    }

    /**
     * Récupère le nom de la session.
     *
     * @return string Le nom de la session.
     *
     * @example
     * $name = $session->getName();
     */
    public function getName(): string
    {
        return session_name();
    }

    /**
     * Définit le nom de la session.
     *
     * @param string $name Le nom à définir.
     *
     * @example
     * $session->setName('MYSESSION');
     */
    public function setName(string $name): void
    {
        session_name($name);
    }

    /**
     * Récupère toutes les variables de session.
     *
     * @return array Le tableau des variables de session.
     *
     * @example
     * $all = $session->all();
     */
    public function all(): array
    {
        return $_SESSION;
    }

    /**
     * Vérifie si la session est démarrée.
     *
     * @return bool Vrai si la session est active.
     *
     * @example
     * if ($session->isStarted()) { ... }
     */
    public function isStarted(): bool
    {
        return session_status() === PHP_SESSION_ACTIVE;
    }
}
