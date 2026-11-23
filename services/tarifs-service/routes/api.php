<?php

use App\Http\Controllers\Api\CalculTarifController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\SaisonController;
use App\Http\Controllers\Api\TarifController;
use Illuminate\Support\Facades\Route;

// Santé du service
Route::get('/health', fn () => response()->json(['status' => 'ok']));

// Routes publiques de consultation et calcul
Route::get('/tarifs/calcul', [CalculTarifController::class, 'calculerDepuisBase']);
Route::post('/tarifs/calcul', [CalculTarifController::class, 'calculer']);

Route::get('/tarifs', [TarifController::class, 'index']);
Route::get('/tarifs/{id}', [TarifController::class, 'show'])->whereNumber('id');

Route::get('/saisons', [SaisonController::class, 'index']);
Route::get('/saisons/{id}', [SaisonController::class, 'show'])->whereNumber('id');

Route::get('/promotions', [PromotionController::class, 'index']);
Route::get('/promotions/{id}', [PromotionController::class, 'show'])->whereNumber('id');

// Routes d'administration protégées par JWT (401 sans token, 403 si non-admin)
Route::middleware('jwt:admin')->group(function () {
    Route::post('/tarifs', [TarifController::class, 'store']);
    Route::put('/tarifs/{id}', [TarifController::class, 'update'])->whereNumber('id');
    Route::delete('/tarifs/{id}', [TarifController::class, 'destroy'])->whereNumber('id');

    Route::post('/saisons', [SaisonController::class, 'store']);
    Route::put('/saisons/{id}', [SaisonController::class, 'update'])->whereNumber('id');
    Route::delete('/saisons/{id}', [SaisonController::class, 'destroy'])->whereNumber('id');

    Route::post('/promotions', [PromotionController::class, 'store']);
    Route::put('/promotions/{id}', [PromotionController::class, 'update'])->whereNumber('id');
    Route::delete('/promotions/{id}', [PromotionController::class, 'destroy'])->whereNumber('id');

});