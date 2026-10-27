<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Models\Role;
use App\Services\JwtService;

class AuthController extends Controller
{
    protected JwtService $jwtService;

    public function __construct(JwtService $jwtService)
    {
        $this->jwtService = $jwtService;
    }

    /**
     * GET /api/health
     */
    public function health()
    {
        return response()->json(['status' => 'ok']);
    }

    /**
     * POST /api/register
     */
    public function register(Request $request)
    {
        // 1. Validation selon diagramme (cas d'erreur)
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Données invalides',
                'code' => 422,
                'details' => $validator->errors(),
            ], 422);
        }

        // Vérification email déjà existant
        if (User::where('email', $request->email)->exists()) {
            return response()->json([
                'error' => 'Email déjà utilisé',
                'code' => 422,
            ], 422);
        }

        // 2. Rôle 'client' par défaut
        $clientRole = Role::firstOrCreate(['name' => 'client']);

        // 3. Création utilisateur
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $clientRole->id,
        ]);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => 'client',
        ], 201);
    }

    /**
     * POST /api/login
     */
    public function login(Request $request)
    {
        // 1. Validation des champs
        $validator = Validator::make($request->all(), [
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Données invalides',
                'code' => 422,
            ], 422);
        }

        // 2. Recherche utilisateur avec son rôle
        $user = User::with('role')->where('email', $request->email)->first();

        // Sécurité : même message d'erreur si email inexistant ou mot de passe faux
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'error' => 'Identifiants invalides',
                'code' => 401,
            ], 401);
        }

        // 3. Génération du JWT (HS256)
        $jwtData = $this->jwtService->generateToken($user);

        return response()->json($jwtData, 200);
    }

    /**
     * GET /api/me
     */
    public function me(Request $request)
    {
        $user = $request->get('auth_user');

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ? $user->role->name : 'client',
        ], 200);
    }

    /**
     * GET /api/users/{id}
     * Permet aux autres microservices (ex. avis-service) de récupérer
     * les informations d'un utilisateur à partir de son identifiant.
     */
    public function getUserById($id)
    {
        $user = User::with('role')->find($id);

        if (!$user) {
            return response()->json([
                'error' => 'Utilisateur introuvable',
                'code' => 404,
            ], 404);
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ? $user->role->name : 'client',
        ], 200);
    }
}
