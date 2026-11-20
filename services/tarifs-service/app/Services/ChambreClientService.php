<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Throwable;

class ChambreClientService
{
    /**
     * Vérifie si une chambre existe auprès de chambres-service.
     * Retourne true si elle existe, false si 404, ou null si chambres-service est injoignable.
     */
    public function verifierChambreExiste(int $chambreId): ?bool
    {
        $baseUrl = rtrim(env('CHAMBRES_SERVICE_URL', 'http://chambres-service:8000/api'), '/');

        try {
            $response = Http::timeout(3)->get("{$baseUrl}/chambres/{$chambreId}");

            if ($response->successful()) {
                return true;
            }

            if ($response->status() === 404) {
                return false;
            }

            return null;
        } catch (Throwable $e) {
            return null;
        }
    }
}