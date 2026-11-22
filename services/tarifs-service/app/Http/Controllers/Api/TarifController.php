<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tarif;
use Illuminate\Http\Request;

class TarifController extends Controller
{
    public function index()
    {
        $query = Tarif::query();

        if (method_exists(Tarif::class, 'saison') && method_exists(Tarif::class, 'promotion')) {
            $query->with(['saison', 'promotion']);
        }

        $tarifs = $query->orderByDesc('id')->get();

        return response()->json([
            'success' => true,
            'data'    => $tarifs,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'chambre_id'         => 'nullable|integer',
            'numero_chambre'     => 'required|string|max:50',
            'saison_id'          => 'nullable|integer',
            'coefficient_saison' => 'nullable|numeric|min:0.1',
            'promotion_id'       => 'nullable|integer',
            'promotion_pourcent' => 'nullable|numeric|min:0|max:100',
            'prix_base'          => 'nullable|numeric|min:0',
            'prix_nuit'          => 'required|numeric|min:0',
            'devise'             => 'required|string|max:10',
            'statut'             => 'required|string|in:active,inactive',
        ]);

        $tarif = Tarif::create([
            'chambre_id'         => $validated['chambre_id'] ?? null,
            'numero_chambre'     => $validated['numero_chambre'],
            'saison_id'          => $validated['saison_id'] ?? null,
            'coefficient_saison' => $validated['coefficient_saison'] ?? 1.0,
            'promotion_id'       => $validated['promotion_id'] ?? null,
            'promotion_pourcent' => $validated['promotion_pourcent'] ?? 0,
            'prix_base'          => $validated['prix_base'] ?? $validated['prix_nuit'],
            'prix_nuit'          => $validated['prix_nuit'],
            'devise'             => strtoupper($validated['devise']),
            'statut'             => $validated['statut'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tarif enregistré avec succès.',
            'data'    => (method_exists($tarif, 'saison') && method_exists($tarif, 'promotion'))
                ? $tarif->load(['saison', 'promotion'])
                : $tarif,
        ], 201);
    }
    //

    public function update(Request $request, int $id)
    {
        $tarif = Tarif::findOrFail($id);

        $validated = $request->validate([
            'chambre_id'         => 'nullable|integer',
            'numero_chambre'     => 'sometimes|string|max:50',
            'saison_id'          => 'nullable|integer',
            'coefficient_saison' => 'nullable|numeric|min:0.1',
            'promotion_id'       => 'nullable|integer',
            'promotion_pourcent' => 'nullable|numeric|min:0|max:100',
            'prix_base'          => 'nullable|numeric|min:0',
            'prix_nuit'          => 'sometimes|numeric|min:0',
            'devise'             => 'sometimes|string|max:10',
            'statut'             => 'sometimes|string|in:active,inactive',
        ]);

        $tarif->update($validated);

        return response()->json([
            'success' => true,
            'data'    => (method_exists($tarif, 'saison') && method_exists($tarif, 'promotion'))
                ? $tarif->load(['saison', 'promotion'])
                : $tarif->fresh(),
        ]);
    }

    public function destroy(int $id)
    {
        $tarif = Tarif::findOrFail($id);
        $tarif->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tarif supprimé.',
        ]);
    }
}