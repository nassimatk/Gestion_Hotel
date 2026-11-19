<?php

namespace App\Http\Controllers;

use App\Models\Chambre;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * ChambreController
 *
 * Gère les opérations CRUD sur les chambres.
 * - Routes GET  : publiques (aucun token requis)
 * - Routes POST/PUT/DELETE : protégées (jwt.admin middleware)
 */
class ChambreController extends Controller
{
    /* ------------------------------------------------------------------ */
    /*  HEALTH CHECK                                                        */
    /* ------------------------------------------------------------------ */

    /**
     * GET /api/health
     * Vérifie que le service est opérationnel.
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'status'  => 'ok',
            'service' => 'chambres-service',
            'version' => '1.0.0',
        ], 200);
    }

    /* ------------------------------------------------------------------ */
    /*  LECTURE (publique)                                                  */
    /* ------------------------------------------------------------------ */

    /**
     * GET /api/chambres
     * Retourne la liste des chambres disponibles (non supprimées).
     * Supporte les filtres : type, capacite, prix_min, prix_max, statut.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Chambre::query();

        // Filtres optionnels
        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }
        if ($request->filled('capacite')) {
            $query->where('capacite', '>=', (int) $request->input('capacite'));
        }
        if ($request->filled('prix_min')) {
            $query->where('prix_nuit', '>=', (float) $request->input('prix_min'));
        }
        if ($request->filled('prix_max')) {
            $query->where('prix_nuit', '<=', (float) $request->input('prix_max'));
        }
        if ($request->filled('statut')) {
            $query->where('statut', $request->input('statut'));
        }

        $chambres = $query->orderBy('numero')->get();

        return response()->json([
            'data'  => $chambres,
            'total' => $chambres->count(),
        ], 200);
    }

    /**
     * GET /api/chambres/{id}
     * Retourne le détail d'une chambre par son identifiant.
     */
    public function show(int $id): JsonResponse
    {
        $chambre = Chambre::find($id);

        if (!$chambre) {
            return response()->json([
                'error' => 'Chambre introuvable.',
                'code'  => 404,
            ], 404);
        }

        return response()->json(['data' => $chambre], 200);
    }

    /* ------------------------------------------------------------------ */
    /*  ÉCRITURE (admin uniquement)                                         */
    /* ------------------------------------------------------------------ */

    /**
     * POST /api/chambres
     * Crée une nouvelle chambre.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom'          => 'nullable|string|max:150',
            'numero'       => 'required|string|max:10|unique:chambres,numero',
            'type'         => 'required|in:simple,double,suite,presidentielle',
            'capacite'     => 'required|integer|min:1|max:10',
            'prix_nuit'    => 'required|numeric|min:0',
            'description'  => 'nullable|string|max:2000',
            'superficie'   => 'nullable|numeric|min:0',
            'etage'        => 'nullable|integer|min:0',
            'vue'          => 'nullable|string|max:100',
            'equipements'  => 'nullable|array',
            'images'       => 'nullable|array',
            'statut'       => 'sometimes|in:disponible,occupee,maintenance',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error'  => 'Données invalides.',
                'errors' => $validator->errors(),
                'code'   => 422,
            ], 422);
        }

        $chambre = Chambre::create($validator->validated());

        return response()->json(['data' => $chambre], 201);
    }

    /**
     * PUT /api/chambres/{id}
     * Met à jour les informations d'une chambre existante.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $chambre = Chambre::find($id);

        if (!$chambre) {
            return response()->json([
                'error' => 'Chambre introuvable.',
                'code'  => 404,
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nom'          => 'nullable|string|max:150',
            'numero'       => 'sometimes|string|max:10|unique:chambres,numero,' . $id,
            'type'         => 'sometimes|in:simple,double,suite,presidentielle',
            'capacite'     => 'sometimes|integer|min:1|max:10',
            'prix_nuit'    => 'sometimes|numeric|min:0',
            'description'  => 'nullable|string|max:2000',
            'superficie'   => 'nullable|numeric|min:0',
            'etage'        => 'nullable|integer|min:0',
            'vue'          => 'nullable|string|max:100',
            'equipements'  => 'nullable|array',
            'images'       => 'nullable|array',
            'statut'       => 'sometimes|in:disponible,occupee,maintenance',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error'  => 'Données invalides.',
                'errors' => $validator->errors(),
                'code'   => 422,
            ], 422);
        }

        $chambre->update($validator->validated());

        return response()->json(['data' => $chambre->fresh()], 200);
    }

    /**
     * DELETE /api/chambres/{id}
     * Soft-delete d'une chambre (jamais de suppression physique).
     */
    public function destroy(int $id): JsonResponse
    {
        $chambre = Chambre::find($id);

        if (!$chambre) {
            return response()->json([
                'error' => 'Chambre introuvable.',
                'code'  => 404,
            ], 404);
        }

        $chambre->delete(); // SoftDelete : remplit deleted_at, ne supprime pas la ligne

        return response()->json(null, 204);
    }
}
