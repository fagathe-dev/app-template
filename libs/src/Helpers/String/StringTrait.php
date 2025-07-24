<?php

namespace Fagathe\Libs\Helpers\String;

trait StringTrait
{

    /**
     * @param string $str
     * 
     * @return string
     */
    public function sanitizeText(string $str): string
    {
        // 1. Translitérer les caractères accentués en leurs équivalents non accentués
        // iconv('UTF-8', 'ASCII//TRANSLIT', $chaine) tente de convertir la chaîne de l'UTF-8
        // vers l'ASCII. L'option '//TRANSLIT' est cruciale : elle remplace les caractères
        // non représentables en ASCII par leur équivalent le plus proche.
        // L'option '//IGNORE' (ajoutée ici pour plus de robustesse) supprime les caractères
        // qui ne peuvent pas être translittérés ou qui sont invalides.
        $chaineSansAccents = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $str);
        dump(__LINE__ . ' ' . $chaineSansAccents);

        // 2. Remplacer les caractères qui ne sont ni des lettres (a-z, A-Z), ni des chiffres (0-9),
        $chaineNettoyee = preg_replace('/[^a-zA-Z0-9\s]/', '', $chaineSansAccents);

        // 3. Remplacer les multiples espaces par un seul espace (pour nettoyer les doublons créés par le remplacement)
        $chaineNettoyee = preg_replace('/\s+/', ' ', $chaineNettoyee);

        // 4. Supprimer les espaces en début et fin de chaîne
        $chaineNettoyee = trim($chaineNettoyee);

        // Nettoyer les espaces multiples
        return $chaineNettoyee;
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
