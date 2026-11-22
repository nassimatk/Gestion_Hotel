<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\VerifieChambre;
use App\Http\Controllers\Controller;
use App\Models\Promotion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    use VerifieChambre;

    public function index(Request $request): JsonResponse
    {
        $query = Promotion::query();

        if ($request->filled('statut')) {
            $query->where('statut', $request->query('statut'));
        }

        if ($request->filled('chambre_id')) {
            $chambreId = (int) $request->query('chambre_id');
            $query->where(function ($q) use ($chambreId) {
                $q->whereNull('chambre_id')->orWhere('chambre_id', $chambreId);
            });
        }

        $promotions = $query->orderByDesc('created_at')->get()->toArray();

        return response()->json([
            'success' => true,
            'data' => $this->avecChambres($promotions),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $promotion = Promotion::find($id);

        if (!$promotion) {
            return response()->json(['success' => false, 'error' => 'Promotion introuvable.'], 404);
        }

        [$donnees] = $this->avecChambres([$promotion->toArray()]);

        return response()->json(['success' => true, 'data' => $donnees]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'libelle' => 'required|string|max:100',
            'chambre_id' => 'nullable|integer|min:1',
            'type_reduction' => 'required|in:POURCENTAGE,MONTANT_FIXE',
            'valeur' => 'required|numeric|gt:0',
            'nuits_min' => 'sometimes|integer|min:1',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'statut' => 'sometimes|in:active,inactive',
        ]);

        if ($validated['type_reduction'] === 'POURCENTAGE' && $validated['valeur'] >= 100) {
            return response()->json([
                'success' => false,
                'error' => 'Un pourcentage de réduction doit être strictement inférieur à 100.',
            ], 422);
        }

        // Si la promotion cible une chambre, on la recherche réellement dans le service Chambres
        if (!empty($validated['chambre_id']) && ($erreur = $this->erreurChambre((int) $validated['chambre_id']))) {
            return $erreur;
        }

        $promotion = Promotion::create([
            'libelle' => $validated['libelle'],
            'chambre_id' => $validated['chambre_id'] ?? null,
            'type_reduction' => $validated['type_reduction'],
            'valeur' => $validated['valeur'],
            'nuits_min' => $validated['nuits_min'] ?? 1,
            'date_debut' => $validated['date_debut'],
            'date_fin' => $validated['date_fin'],
            'statut' => $validated['statut'] ?? 'active',
        ]);

        [$donnees] = $this->avecChambres([$promotion->toArray()]);

        return response()->json(['success' => true, 'data' => $donnees], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $promotion = Promotion::find($id);

        if (!$promotion) {
            return response()->json(['success' => false, 'error' => 'Promotion introuvable.'], 404);
        }

        $validated = $request->validate([
            'libelle' => 'sometimes|required|string|max:100',
            'chambre_id' => 'nullable|integer|min:1',
            'type_reduction' => 'sometimes|required|in:POURCENTAGE,MONTANT_FIXE',
            'valeur' => 'sometimes|required|numeric|gt:0',
            'nuits_min' => 'sometimes|integer|min:1',
            'date_debut' => 'sometimes|required|date',
            'date_fin' => 'sometimes|required|date',
            'statut' => 'sometimes|in:active,inactive',
        ]);

        $type = $validated['type_reduction'] ?? $promotion->type_reduction;
        $valeur = $validated['valeur'] ?? $promotion->valeur;
        $dateDebut = $validated['date_debut'] ?? $promotion->date_debut->format('Y-m-d');
        $dateFin = $validated['date_fin'] ?? $promotion->date_fin->format('Y-m-d');

        if ($type === 'POURCENTAGE' && $valeur >= 100) {
            return response()->json([
                'success' => false,
                'error' => 'Un pourcentage de réduction doit être strictement inférieur à 100.',
            ], 422);
        }

        if ($dateFin < $dateDebut) {
            return response()->json([
                'success' => false,
                'error' => 'La date de fin doit être postérieure ou égale à la date de début.',
            ], 422);
        }

        if (!empty($validated['chambre_id']) && ($erreur = $this->erreurChambre((int) $validated['chambre_id']))) {
            return $erreur;
        }

        $promotion->update($validated);

        [$donnees] = $this->avecChambres([$promotion->fresh()->toArray()]);

        return response()->json(['success' => true, 'data' => $donnees]);
    }

    public function destroy(int $id): JsonResponse
    {
        $promotion = Promotion::find($id);

        if (!$promotion) {
            return response()->json(['success' => false, 'error' => 'Promotion introuvable.'], 404);
        }

        $promotion->delete();

        return response()->json(['success' => true, 'message' => 'Promotion supprimée.']);
    }
}