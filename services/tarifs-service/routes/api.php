<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CalculTarifController;


Route::get('/health', fn () => response()->json(['status' => 'ok']));
Route::post('/tarifs/calcul', [CalculTarifController::class, 'calculer']);