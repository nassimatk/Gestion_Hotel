<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CalculPrixService;
use Illuminate\Http\Request;

class CalculTarifController extends Controller
{
    protected CalculPrixService $calculPrixService;

    public function __construct(CalculPrixService $calculPrixService)
    {
        $this->calculPrixService = $calculPrixService;
    }

    public function calculer(Request $request)
    {
        $validated = $request->validate([
            'arrivee' => 'required|date',
            'depart' => 'required|date|after:arrivee',
            'prix_standard' => 'required|numeric|min:0',
            'saisons' => 'array',
            'promotion' => 'nullable|array',
        ]);

        try {
            $resultat = $this->calculPrixService->calculerSejour(
                $validated['arrivee'],
                $validated['depart'],
                $validated['prix_standard'],
                $validated['saisons'] ?? [],
                $validated['promotion'] ?? null
            );

            return response()->json([
                'success' => true,
                'data' => $resultat
            ], 200);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 422);
        }
    }
}