<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AvisController;

// Vérification du fonctionnement du service
use Illuminate\Support\Facades\Log;

Route::get('/health', function () {

    Log::info('HEALTH CHECK : route appelée');

    try {
        $response = [
            'status' => 'ok',
            'service' => 'avis-service',
        ];

        Log::info('HEALTH CHECK : réponse préparée', $response);

        return response()->json($response);

    } catch (\Throwable $e) {

        Log::error('HEALTH CHECK ERROR', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ]);

        return response()->json([
            'message' => 'Erreur interne',
        ], 500);
    }
});

// Consultation des avis
Route::get('/avis', [AvisController::class, 'index']);

Route::get('/avis/{avi}', [AvisController::class, 'show']);

// Opérations nécessitant une authentification JWT
Route::middleware('jwt.verify')->group(function () {

    // Ajouter un avis
    Route::post('/avis', [AvisController::class, 'store']);

    // Modifier un avis
    Route::put('/avis/{avi}', [AvisController::class, 'update']);

    Route::patch('/avis/{avi}', [AvisController::class, 'update']);

    // Supprimer un avis
    Route::delete('/avis/{avi}', [AvisController::class, 'destroy']);
});