<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Services\ChambreClientService;
use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * Contrôle réel des chambres auprès du service Chambres.
 */
trait VerifieChambre
{
    /** Chambre trouvée par erreurChambre(), pour enrichir la réponse. */
    protected ?array $chambreTrouvee = null;

    protected function clientChambres(): ChambreClientService
    {
        return app(ChambreClientService::class);
    }

    /** Retourne une réponse d'erreur si la chambre n'existe pas (404) ou si Chambres est injoignable (500), sinon null. */
    protected function erreurChambre(int $chambreId): ?JsonResponse
    {
        try {
            $chambre = $this->clientChambres()->trouver($chambreId);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'error' => "Le service Chambres est indisponible : impossible de vérifier la chambre {$chambreId}.",
                'code' => 500,
            ], 500);
        }

        if ($chambre === null) {
            return response()->json([
                'success' => false,
                'error' => "La chambre {$chambreId} n'existe pas dans le service Chambres.",
                'code' => 404,
            ], 404);
        }

        $this->chambreTrouvee = $chambre;

        return null;
    }

    /** Ajoute à chaque ligne l'objet "chambre" ({id, nom}) lu dans le service Chambres. */
    protected function avecChambres(array $lignes): array
    {
        $chambres = $this->clientChambres()->lister();

        return array_map(function (array $ligne) use ($chambres) {
            $c = $chambres[(int) ($ligne['chambre_id'] ?? 0)] ?? null;
            $ligne['chambre'] = $c ? ['id' => (int) $c['id'], 'nom' => ChambreClientService::nom($c)] : null;

            return $ligne;
        }, $lignes);
    }
}