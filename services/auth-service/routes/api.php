<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Middleware\JwtAuthenticate;

/*
|--------------------------------------------------------------------------
| API Routes (auth-service)
|--------------------------------------------------------------------------
| Conformes aux diagrammes UML et au contrat OpenAPI
| Préfixe automatique : /api
*/

Route::get('/health', [AuthController::class, 'health']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Route protégée par JWT
Route::middleware([JwtAuthenticate::class])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
});
