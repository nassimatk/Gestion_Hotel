<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AvisController;

// Vérification du fonctionnement du service
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'avis-service',
    ]);
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