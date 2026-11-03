<?php

namespace App\Http\Controllers;

use App\Models\Avis;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AvisController extends Controller
{
    /**
     * GET /api/avis
     * Liste paginée des avis.
     */
    public function index(): JsonResponse
    {
        $avis = Avis::query()
            ->latest()
            ->paginate(10);

        return response()->json($avis);
    }

    /**
     * POST /api/avis
     * Créer un avis avec l'utilisateur authentifié.
     */
    public function store(Request $request): JsonResponse
    {
        // Récupérer l'utilisateur depuis le middleware JWT
        $authenticatedUser = $request->attributes->get('authenticated_user');

        $validated = $request->validate([
            'chambre_id' => ['required', 'integer', 'min:1'],
            'note' => ['required', 'integer', 'between:1,5'],
            'commentaire' => ['required', 'string', 'min:3', 'max:2000'],
        ]);

        // Le user_id vient du JWT, pas du frontend
        $validated['user_id'] = $authenticatedUser['id'];

        $avis = Avis::create($validated);

        return response()->json([
            'message' => 'Avis créé avec succès.',
            'data' => $avis,
        ], 201);
    }

    /**
     * GET /api/avis/{avi}
     * Consulter un avis.
     */
    public function show(Avis $avi): JsonResponse
    {
        return response()->json([
            'data' => $avi,
        ]);
    }

    /**
     * PUT/PATCH /api/avis/{avi}
     * Modifier son propre avis.
     */
    public function update(Request $request, Avis $avi): JsonResponse
    {
        $authenticatedUser = $request->attributes->get('authenticated_user');

        // Vérifier que l'avis appartient à l'utilisateur connecté
        if ((int) $avi->user_id !== $authenticatedUser['id']) {
            return response()->json([
                'message' => 'Vous ne pouvez pas modifier cet avis.',
            ], 403);
        }

        $validated = $request->validate([
            'note' => ['sometimes', 'required', 'integer', 'between:1,5'],
            'commentaire' => [
                'sometimes',
                'required',
                'string',
                'min:3',
                'max:2000',
            ],
        ]);

        $avi->update($validated);

        return response()->json([
            'message' => 'Avis modifié avec succès.',
            'data' => $avi->fresh(),
        ]);
    }

    /**
     * DELETE /api/avis/{avi}
     * Supprimer son propre avis.
     */
    public function destroy(Request $request, Avis $avi): JsonResponse
    {
        $authenticatedUser = $request->attributes->get('authenticated_user');

        // Vérifier que l'avis appartient à l'utilisateur connecté
        if ((int) $avi->user_id !== $authenticatedUser['id']) {
            return response()->json([
                'message' => 'Vous ne pouvez pas supprimer cet avis.',
            ], 403);
        }

        $avi->delete();

        return response()->json([
            'message' => 'Avis supprimé avec succès.',
        ]);
    }
}