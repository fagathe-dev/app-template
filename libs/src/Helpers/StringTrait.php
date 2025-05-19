<?php

namespace Fagathe\Libs\Helpers;

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
}
