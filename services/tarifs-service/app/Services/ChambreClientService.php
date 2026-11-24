<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

/**
 * Connexion au service Chambres (appels REST, aucun accès à sa base de données).
 * URL lue dans CHAMBRES_SERVICE_URL (ex. http://chambres-service:8000/api).
 */
class ChambreClientService
{
    private function baseUrl(): string
    {
        return rtrim(env('CHAMBRES_SERVICE_URL', 'http://chambres-service:8000/api'), '/');
    }

    /** Chambre contenue dans une réponse {"data": {...}} ou {...}, ou null. */
    public static function extraireChambre($json): ?array
    {
        if (!is_array($json)) {
            return null;
        }
        $c = $json['data'] ?? $json;

        return (is_array($c) && isset($c['id'])) ? $c : null;
    }

    /** Liste [id => chambre] contenue dans [...], {"data": [...]} ou {"data": {"data": [...]}}. */
    public static function extraireListe($json): array
    {
        if (!is_array($json)) {
            return [];
        }
        $liste = $json['data'] ?? $json;
        if (is_array($liste) && isset($liste['data']) && is_array($liste['data'])) {
            $liste = $liste['data'];
        }
        if (!is_array($liste)) {
            return [];
        }

        $resultat = [];
        foreach ($liste as $c) {
            if (is_array($c) && isset($c['id'])) {
                $resultat[(int) $c['id']] = $c;
            }
        }

        return $resultat;
    }

    /** Nom affichable d'une chambre. */
    public static function nom(array $c): string
    {
        if (!empty($c['titre'])) {
            return (string) $c['titre'];
        }
        if (!empty($c['nom'])) {
            return (string) $c['nom'];
        }
        if (!empty($c['numero'])) {
            return 'Chambre ' . $c['numero'];
        }

        return 'Chambre #' . ($c['id'] ?? '?');
    }

    /**
     * Cherche réellement la chambre dans le service Chambres.
     *  - retourne le tableau de la chambre si elle existe ;
     *  - retourne null si le service répond qu'elle n'existe pas (404 JSON) ;
     *  - lève une RuntimeException si le service est injoignable ou répond de façon inattendue.
     */
    public function trouver(int $id): ?array
    {
        try {
            $reponse = Http::timeout(3)->acceptJson()->get($this->baseUrl() . "/chambres/{$id}");
        } catch (Throwable $e) {
            throw new RuntimeException('Service Chambres injoignable.', 0, $e);
        }

        if ($reponse->successful()) {
            return self::extraireChambre($reponse->json()) ?? ['id' => $id];
        }

        if ($reponse->status() === 404 && is_array($reponse->json())) {
            return null;
        }

        throw new RuntimeException('Réponse inattendue du service Chambres (HTTP ' . $reponse->status() . ').');
    }

    /** Liste des chambres [id => chambre] ; tableau vide si le service est injoignable (lecture seule). */
    public function lister(): array
    {
        try {
            $reponse = Http::timeout(3)->acceptJson()->get($this->baseUrl() . '/chambres');
        } catch (Throwable) {
            return [];
        }

        return $reponse->successful() ? self::extraireListe($reponse->json()) : [];
    }
}