<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tarif;
use App\Services\ChambreClientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TarifController extends Controller
{
    public function __construct(
        protected ChambreClientService $chambreClient
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Tarif::with('saison');

        if ($request->filled('chambre_id')) {
            $query->where('chambre_id', (int) $request->query('chambre_id'));
        }

        if ($request->filled('saison_id')) {
            $query->where('saison_id', (int) $request->query('saison_id'));
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->query('statut'));
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('chambre_id')->orderBy('saison_id')->get(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $tarif = Tarif::with('saison')->find($id);

        if (!$tarif) {
            return response()->json(['success' => false, 'error' => 'Tarif introuvable.'], 404);
        }

        return response()->json(['success' => true, 'data' => $tarif]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'chambre_id' => 'required|integer|min:1',
            'saison_id' => 'nullable|integer|exists:saisons,id',
            'prix_nuit' => 'required|numeric|gt:0',
            'devise' => 'sometimes|string|size:3',
            'statut' => 'sometimes|in:active,inactive',
        ]);

        // Vérifier l'existence de la chambre via chambres-service
        if ($this->chambreClient->verifierChambreExiste((int) $validated['chambre_id']) === false) {
            return response()->json([
                'success' => false,
                'error' => 'La chambre spécifiée est introuvable dans chambres-service.',
            ], 404);
        }

        // Vérifier l'unicité (RG4 : 1 tarif standard ou 1 tarif par saison et par chambre)
        $saisonId = $validated['saison_id'] ?? null;
        $doublon = Tarif::where('chambre_id', $validated['chambre_id'])
            ->when($saisonId === null, fn ($q) => $q->whereNull('saison_id'))
            ->when($saisonId !== null, fn ($q) => $q->where('saison_id', $saisonId))
            ->exists();

        if ($doublon) {
            return response()->json([
                'success' => false,
                'error' => 'Un tarif existe déjà pour cette chambre et cette saison.',
            ], 422);
        }

        $tarif = Tarif::create([
            'chambre_id' => $validated['chambre_id'],
            'saison_id' => $saisonId,
            'prix_nuit' => $validated['prix_nuit'],
            'devise' => strtoupper($validated['devise'] ?? 'MAD'),
            'statut' => $validated['statut'] ?? 'active',
        ]);

        return response()->json([
            'success' => true,
            'data' => $tarif->load('saison'),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tarif = Tarif::find($id);

        if (!$tarif) {
            return response()->json(['success' => false, 'error' => 'Tarif introuvable.'], 404);
        }

        $validated = $request->validate([
            'prix_nuit' => 'sometimes|required|numeric|gt:0',
            'devise' => 'sometimes|string|size:3',
            'statut' => 'sometimes|in:active,inactive',
        ]);

        if (isset($validated['devise'])) {
            $validated['devise'] = strtoupper($validated['devise']);
        }

        $tarif->update($validated);

        return response()->json([
            'success' => true,
            'data' => $tarif->fresh('saison'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $tarif = Tarif::find($id);

        if (!$tarif) {
            return response()->json(['success' => false, 'error' => 'Tarif introuvable.'], 404);
        }

        $tarif->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tarif supprimé.',
        ]);
    }
}