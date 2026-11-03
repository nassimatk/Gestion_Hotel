<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordResetController;
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

// Endpoint inter-services : consultation publique/interne d'un utilisateur par ID
Route::get('/users/{id}', [AuthController::class, 'getUserById']);

// Mot de passe oublié (publics, sans JWT)
Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword']);
Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);
Route::get('/reset-password/validate/{token}', [PasswordResetController::class, 'validateToken']);
Route::post('/change-password-direct', [PasswordResetController::class, 'changePasswordDirect']);

// Routes protégées par JWT
Route::middleware([JwtAuthenticate::class])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
});
