<?php

use App\Http\Controllers\ChambreController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes API — chambres-service
|--------------------------------------------------------------------------
| Routes publiques  : GET (lecture seule, aucun token requis)
| Routes protégées  : POST / PUT / DELETE (middleware jwt.admin)
*/

// ── Health check ────────────────────────────────────────────────────────────
Route::get('/health', [ChambreController::class, 'health']);

// ── Routes publiques (lecture) ───────────────────────────────────────────────
Route::get('/chambres',      [ChambreController::class, 'index']);
Route::get('/chambres/{id}', [ChambreController::class, 'show'])->where('id', '[0-9]+');

// ── Routes protégées (admin JWT requis) ─────────────────────────────────────
Route::middleware('jwt.admin')->group(function () {
    Route::post  ('/chambres',      [ChambreController::class, 'store']);
    Route::put   ('/chambres/{id}', [ChambreController::class, 'update'])->where('id', '[0-9]+');
    Route::delete('/chambres/{id}', [ChambreController::class, 'destroy'])->where('id', '[0-9]+');
});
