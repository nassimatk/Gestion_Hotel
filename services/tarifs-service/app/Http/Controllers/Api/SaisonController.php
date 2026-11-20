<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Saison;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaisonController extends Controller
{
    public function index(): JsonResponse
    {
        $saisons = Saison::orderBy('date_debut')->get();

        return response()->json([
            'success' => true,
            'data' => $saisons,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $saison = Saison::find($id);

        if (!$saison) {
            return response()->json(['success' => false, 'error' => 'Saison introuvable.'], 404);
        }

        return response()->json(['success' => true, 'data' => $saison]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
        ]);

        // Vérifier le chevauchement avec une saison existante
        $chevauchement = Saison::where('date_debut', '<=', $validated['date_fin'])
            ->where('date_fin', '>=', $validated['date_debut'])
            ->exists();

        if ($chevauchement) {
            return response()->json([
                'success' => false,
                'error' => 'Cette période chevauche une saison déjà existante.',
            ], 422);
        }

        $saison = Saison::create($validated);

        return response()->json([
            'success' => true,
            'data' => $saison,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $saison = Saison::find($id);

        if (!$saison) {
            return response()->json(['success' => false, 'error' => 'Saison introuvable.'], 404);
        }

        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'date_debut' => 'sometimes|required|date',
            'date_fin' => 'sometimes|required|date',
        ]);

        $dateDebut = $validated['date_debut'] ?? $saison->date_debut->format('Y-m-d');
        $dateFin = $validated['date_fin'] ?? $saison->date_fin->format('Y-m-d');

        if ($dateFin < $dateDebut) {
            return response()->json([
                'success' => false,
                'error' => 'La date de fin doit être postérieure ou égale à la date de début.',
            ], 422);
        }

        $chevauchement = Saison::where('id', '!=', $saison->id)
            ->where('date_debut', '<=', $dateFin)
            ->where('date_fin', '>=', $dateDebut)
            ->exists();

        if ($chevauchement) {
            return response()->json([
                'success' => false,
                'error' => 'Cette période chevauche une saison déjà existante.',
            ], 422);
        }

        $saison->update($validated);

        return response()->json([
            'success' => true,
            'data' => $saison->fresh(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $saison = Saison::find($id);

        if (!$saison) {
            return response()->json(['success' => false, 'error' => 'Saison introuvable.'], 404);
        }

        $saison->delete();

        return response()->json([
            'success' => true,
            'message' => 'Saison supprimée.',
        ]);
    }
}