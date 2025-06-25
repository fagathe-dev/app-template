<?php

namespace Fagathe\Libs\Helpers\String;

trait StringTrait
{

    /**
     * @param string $input
     * 
     * @return string
     */
    public function sanitizeText(string $input): string
    {
        // Décoder les entités HTML
        $decoded = html_entity_decode($input, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Supprimer les accents
        $normalized = iconv('UTF-8', 'ASCII//TRANSLIT', $decoded);

        // Supprimer les traits d'union et apostrophes
        $normalized = preg_replace('/[-\']/u', ' ', $normalized);

        // Supprimer certains préfixes (l', d', t'y...)
        $normalized = preg_replace('/\b[lLdDtTyY]\'/', '', $normalized);

        // Nettoyer les espaces multiples
        return preg_replace('/\s+/', ' ', trim($normalized));
    }


    /**
     * Generate a token
     * @param integer $length
     * @return string
     */
    public function generateShuffleChars(int $length = 10): string
    {
        $char_to_shuffle = 'azertyuiopqsdfghjklwxcvbnAZERTYUIOPQSDFGHJKLLMWXCVBN1234567890';
        return substr(str_shuffle($char_to_shuffle), 0, $length);
    }


    /**
     * Generate Random string token
     *
     * @param int $length
     * @return string
     */
    public function generateToken(int $length = 50): string
    {
        return uniqid($this->generateShuffleChars($length), true);
    }

    /**
     * Implémente une version personnalisée de wordwrap().
     *
     * @see https://www.php.net/manual/fr/function.wordwrap.php Documentation de wordwrap() en PHP
     * @param string $text Texte à découper
     * @param int $width Largeur maximale des lignes
     * @param string $break Séparateur entre les lignes
     * @param bool $cut Indique si les mots doivent être coupés
     * @return string Texte formaté avec sauts de ligne
     */
    public function wordwrap(string $string, int $width = 75, string $break = "\n", bool $cut = false): string
    {
        return wordwrap($string, $width, $break, $cut);
    }

    /**
     * Coupe une phrase à une longueur maximale spécifiée sans couper les mots.
     *
     * @param string $str    Le texte à couper.
     * @param int    $length La longueur maximale de la phrase (par défaut 60 caractères).
     * @return string          Le texte coupé, éventuellement suivi de points de suspension.
     *
     * @example
     *   $str = "Ceci est une phrase très longue qui doit être coupée proprement.";
     *   echo $this->cutText($str, 25);
     *   // Résultat : "Ceci est une phrase très..."
     */
    public function cutText(string $str, int $length = 60, string $ending = '...'): string
    {
        if (strlen($str) <= $length) {
            return $str; // Retourne la chaîne si elle est plus courte que la limite
        }

        $str = substr($str, 0, $length); // Coupe à la longueur souhaitée
        $dernierEspace = strrpos($str, ' '); // Trouve le dernier espace avant la coupure

        if ($dernierEspace !== false) {
            $str = substr($str, 0, $dernierEspace); // Coupe avant le dernier mot
        }

        return $str . $ending; // Ajoute les points de suspension pour indiquer la coupure
    }
}
