<?php

namespace App\Http\Controllers;

use App\Models\Avis;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;

class AvisController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | 1. COMMUNICATION AVEC AUTH SERVICE
    |--------------------------------------------------------------------------
    */

    private function fetchUser(int $userId): ?Response
    {
        try {
            $baseUrl = rtrim(config('services.auth.base_url'), '/');

            return Http::acceptJson()
                ->timeout(5)
                ->get($baseUrl . '/users/' . $userId);

        } catch (ConnectionException $e) {
            report($e);
            return null;
        }
    }

    private function verifierUtilisateur(int $userId): ?JsonResponse
    {
        $response = $this->fetchUser($userId);

        if ($response === null) {
            return response()->json([
                'message' => 'Impossible de contacter Auth Service.'
            ], 503);
        }

        if ($response->status() === 404) {
            return response()->json([
                'message' => 'Utilisateur introuvable.'
            ], 404);
        }

        if (!$response->successful()) {
            return response()->json([
                'message' => 'Erreur lors de la vérification de l’utilisateur.',
                'service' => 'Auth Service'
            ], 503);
        }

        return null;
    }

    /**
     * Normaliser les informations utilisateur.
     */
    private function extraireUtilisateur(array $userData): array
    {
        while (true) {

            if (isset($userData['data']) && is_array($userData['data'])) {
                $userData = $userData['data'];
                continue;
            }

            if (isset($userData['user']) && is_array($userData['user'])) {
                $userData = $userData['user'];
                continue;
            }

            break;
        }

        return [
            'id' => $userData['id'] ?? null,
            'name' => $userData['name'] ?? $userData['nom'] ?? null,
            'email' => $userData['email'] ?? null,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | 2. COMMUNICATION AVEC CHAMBRES SERVICE
    |--------------------------------------------------------------------------
    */

    private function fetchChambre(int $chambreId): ?Response
    {
        try {
            $baseUrl = rtrim(config('services.chambres.base_url'), '/');

            return Http::acceptJson()
                ->timeout(5)
                ->get($baseUrl . '/chambres/' . $chambreId);

        } catch (ConnectionException $e) {
            report($e);
            return null;
        }
    }

    /**
     * Extraire et normaliser toutes les informations de la chambre.
     */
    private function extraireChambre(array $chambreData): array
    {
        // Prendre en charge les réponses JSON imbriquées.
        while (true) {

            if (isset($chambreData['data']) && is_array($chambreData['data'])) {
                $chambreData = $chambreData['data'];
                continue;
            }

            if (isset($chambreData['chambre']) && is_array($chambreData['chambre'])) {
                $chambreData = $chambreData['chambre'];
                continue;
            }

            break;
        }

        // Conserver les informations originales et normaliser les champs.
        return array_merge($chambreData, [

            'id' => $chambreData['id'] ?? null,

            'numero' =>
                $chambreData['numero']
                ?? $chambreData['numero_chambre']
                ?? $chambreData['num_chambre']
                ?? null,

            'nom' =>
                $chambreData['nom']
                ?? $chambreData['nom_chambre']
                ?? null,

            'description' =>
                $chambreData['description']
                ?? null,

            'type' =>
                $chambreData['type']
                ?? $chambreData['type_chambre']
                ?? $chambreData['categorie']
                ?? null,

            'etage' =>
                $chambreData['etage']
                ?? $chambreData['numero_etage']
                ?? null,

            'capacite' =>
                $chambreData['capacite']
                ?? $chambreData['capacite_max']
                ?? null,

            'nombre_lits' =>
                $chambreData['nombre_lits']
                ?? null,

            'type_lits' =>
                $chambreData['type_lits']
                ?? null,

            'surface' =>
                $chambreData['surface']
                ?? $chambreData['superficie']
                ?? null,

            'prix' =>
                $chambreData['prix']
                ?? $chambreData['prix_nuit']
                ?? null,

            'devise' =>
                $chambreData['devise']
                ?? 'MAD',

            'statut' =>
                $chambreData['statut']
                ?? null,
        ]);
    }

    /**
     * Vérifier l'existence d'une chambre.
     */
    private function chambreExists(int $chambreId): ?bool
    {
        $response = $this->fetchChambre($chambreId);

        if ($response === null) {
            return null;
        }

        if ($response->status() === 404) {
            return false;
        }

        return $response->successful() ? true : null;
    }

    private function verifierChambre(int $chambreId): ?JsonResponse
    {
        $exists = $this->chambreExists($chambreId);

        if ($exists === false) {
            return response()->json([
                'message' => 'Cette chambre n’existe pas.'
            ], 404);
        }

        if ($exists === null) {
            return response()->json([
                'message' => 'Impossible de contacter Chambres Service.'
            ], 503);
        }

        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | 3. ENRICHISSEMENT DES AVIS
    |--------------------------------------------------------------------------
    */

    /**
     * Ajouter les informations du client et de la chambre à un avis.
     */
    private function formatAvis(Avis $avi): array
    {
        $data = $avi->toArray();

        /*
         * INFORMATIONS DU CLIENT
         */

        $userResponse = $this->fetchUser(
            (int) $avi->user_id
        );

        $user = null;

        if ($userResponse !== null && $userResponse->successful()) {

            $user = $this->extraireUtilisateur(
                $userResponse->json() ?? []
            );

            if (empty($user['id'])) {
                $user = null;
            }
        }

        /*
         * INFORMATIONS COMPLETES DE LA CHAMBRE
         */

        $chambreResponse = $this->fetchChambre(
            (int) $avi->chambre_id
        );

        $chambre = null;

        if ($chambreResponse !== null && $chambreResponse->successful()) {

            $chambre = $this->extraireChambre(
                $chambreResponse->json() ?? []
            );

            if (empty($chambre['id'])) {
                $chambre = null;
            }
        }

        $data['user'] = $user;
        $data['chambre'] = $chambre;

        return $data;
    }

    /*
    |--------------------------------------------------------------------------
    | 4. LISTE DES AVIS
    |--------------------------------------------------------------------------
    */

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'chambre_id' => [
                'sometimes',
                'required',
                'integer',
                'min:1'
            ],
        ]);

        if ($request->filled('chambre_id')) {

            $error = $this->verifierChambre(
                (int) $request->chambre_id
            );

            if ($error !== null) {
                return $error;
            }
        }

        $avis = Avis::query()
            ->when(
                $request->filled('chambre_id'),
                fn ($query) => $query->where(
                    'chambre_id',
                    $request->chambre_id
                )
            )
            ->latest()
            ->paginate(10);

        $avis->through(function ($item) {
            return $this->formatAvis($item);
        });

        return response()->json($avis);
    }

    /*
    |--------------------------------------------------------------------------
    | 5. AJOUTER UN AVIS
    |--------------------------------------------------------------------------
    */

    public function store(Request $request): JsonResponse
    {
        $authenticatedUser = $request->attributes->get(
            'authenticated_user'
        );

        if (
            !is_array($authenticatedUser) ||
            empty($authenticatedUser['id'])
        ) {
            return response()->json([
                'message' => 'Utilisateur non authentifié.'
            ], 401);
        }

        $validated = $request->validate([
            'chambre_id' => [
                'required',
                'integer',
                'min:1'
            ],

            'note' => [
                'required',
                'integer',
                'between:1,5'
            ],

            'commentaire' => [
                'required',
                'string',
                'min:3',
                'max:2000'
            ],
        ]);

        $userId = (int) $authenticatedUser['id'];

        // Vérifier l'utilisateur dans Auth Service.
        $error = $this->verifierUtilisateur($userId);

        if ($error !== null) {
            return $error;
        }

        // Vérifier la chambre dans Chambres Service.
        $error = $this->verifierChambre(
            (int) $validated['chambre_id']
        );

        if ($error !== null) {
            return $error;
        }

        $validated['user_id'] = $userId;

        $avi = Avis::create($validated);

        return response()->json([
            'message' => 'Avis créé avec succès.',
            'data' => $this->formatAvis($avi)
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | 6. CONSULTER UN AVIS
    |--------------------------------------------------------------------------
    */

    public function show(Avis $avi): JsonResponse
    {
        $error = $this->verifierChambre(
            (int) $avi->chambre_id
        );

        if ($error !== null) {
            return $error;
        }

        return response()->json([
            'data' => $this->formatAvis($avi)
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 7. MODIFIER UN AVIS
    |--------------------------------------------------------------------------
    */

    public function update(Request $request, Avis $avi): JsonResponse
    {
        $authenticatedUser = $request->attributes->get(
            'authenticated_user'
        );

        if (
            !is_array($authenticatedUser) ||
            empty($authenticatedUser['id'])
        ) {
            return response()->json([
                'message' => 'Utilisateur non authentifié.'
            ], 401);
        }

        // Vérifier que l'avis appartient à l'utilisateur connecté.
        if (
            (int) $avi->user_id !==
            (int) $authenticatedUser['id']
        ) {
            return response()->json([
                'message' => 'Vous ne pouvez pas modifier cet avis.'
            ], 403);
        }

        $validated = $request->validate([
            'chambre_id' => [
                'sometimes',
                'required',
                'integer',
                'min:1'
            ],

            'note' => [
                'sometimes',
                'required',
                'integer',
                'between:1,5'
            ],

            'commentaire' => [
                'sometimes',
                'required',
                'string',
                'min:3',
                'max:2000'
            ],
        ]);

        // Vérifier la nouvelle chambre si elle est modifiée.
        if (isset($validated['chambre_id'])) {

            $error = $this->verifierChambre(
                (int) $validated['chambre_id']
            );

            if ($error !== null) {
                return $error;
            }
        }

        $avi->update($validated);

        return response()->json([
            'message' => 'Avis modifié avec succès.',
            'data' => $this->formatAvis($avi->fresh())
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 8. SUPPRIMER UN AVIS
    |--------------------------------------------------------------------------
    */

    public function destroy(Request $request, Avis $avi): JsonResponse
    {
        $authenticatedUser = $request->attributes->get(
            'authenticated_user'
        );

        if (
            !is_array($authenticatedUser) ||
            empty($authenticatedUser['id'])
        ) {
            return response()->json([
                'message' => 'Utilisateur non authentifié.'
            ], 401);
        }

        $userId = (int) $authenticatedUser['id'];

        $role = $authenticatedUser['role'] ?? null;

        $isAdmin = $role === 'admin';

        // Un administrateur peut supprimer tous les avis.
        // Un client peut supprimer uniquement ses propres avis.
        if (
            !$isAdmin &&
            (int) $avi->user_id !== $userId
        ) {
            return response()->json([
                'message' => 'Vous ne pouvez pas supprimer cet avis.'
            ], 403);
        }

        $avi->delete();

        return response()->json([
            'message' => 'Avis supprimé avec succès.'
        ]);
    }
}
