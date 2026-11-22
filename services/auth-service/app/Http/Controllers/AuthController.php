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

        if (User::where('email', $request->email)->exists()) {
            return response()->json([
                'error' => 'Email déjà utilisé',
                'code' => 422,
            ], 422);
        }

        $clientRole = Role::firstOrCreate(['name' => 'client']);

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

        $user = User::with('role')
            ->where('email', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'error' => 'Identifiants invalides',
                'code' => 401,
            ], 401);
        }

        $jwtData = $this->jwtService->generateToken($user);

        return response()->json($jwtData, 200);
    }

    /**
     * GET /api/me
     */
    public function me(Request $request)
    {
        $user = $request->attributes->get('auth_user');

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ? $user->role->name : 'client',
        ], 200);
    }

    /**
     * GET /api/users
     * Récupérer tous les utilisateurs
     */
    public function getAllUsers()
    {
        $users = User::with('role')
            ->select('id', 'name', 'email', 'role_id', 'created_at')
            ->get();

        return response()->json([
            'total' => $users->count(),
            'data' => $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role
                        ? $user->role->name
                        : 'client',
                    'created_at' => $user->created_at,
                ];
            }),
        ], 200);
    }

    /**
     * GET /api/users/{id}
     * Récupérer un utilisateur par ID
     */
    public function getUserById($id)
    {
        $user = User::withTrashed()->with('role')->find($id);

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
            'is_active' => !$user->trashed(),
        ], 200);
    }

    /**
     * DELETE /api/users/{id}
     * Supprimer un compte utilisateur (Administrateur uniquement)
     */
    public function destroy(Request $request, $id)
    {
        $authUser = $request->attributes->get('auth_user');

        // 1. Vérification que l'utilisateur connecté est administrateur
        $role = $authUser && $authUser->role ? $authUser->role->name : 'client';
        if ($role !== 'admin') {
            return response()->json([
                'error' => 'Accès refusé : seuls les administrateurs peuvent supprimer un compte.',
                'code' => 403,
            ], 403);
        }

        // 2. Interdire la suppression de son propre compte
        if ((int) $authUser->id === (int) $id) {
            return response()->json([
                'error' => 'Action impossible : vous ne pouvez pas supprimer votre propre compte administrateur.',
                'code' => 400,
            ], 400);
        }

        // 3. Recherche de l'utilisateur à supprimer
        $targetUser = User::with('role')->find($id);

        if (!$targetUser) {
            return response()->json([
                'error' => 'Utilisateur introuvable.',
                'code' => 404,
            ], 404);
        }

        // 4. Interdire la suppression d'un autre compte administrateur
        $targetRole = $targetUser->role ? $targetUser->role->name : 'client';
        if ($targetRole === 'admin' || (int) $targetUser->id === 1) {
            return response()->json([
                'error' => 'Action impossible : la suppression d\'un compte administrateur est interdite.',
                'code' => 403,
            ], 403);
        }

        $userId = $targetUser->id;
        $userEmail = $targetUser->email;
        $userName = $targetUser->name;

        // 5. Nettoyage des tokens de réinitialisation associés
        \Illuminate\Support\Facades\DB::table('password_resets')->where('email', $userEmail)->delete();

        // 6. Suppression (Soft Delete par défaut, ou Hard Delete si ?force=true)
        if ($request->query('force') === 'true' || $request->query('force') === '1') {
            $targetUser->forceDelete();
            $mode = 'definitive';
        } else {
            $targetUser->delete();
            $mode = 'soft';
        }

        return response()->json([
            'message' => 'Compte utilisateur supprimé avec succès.',
            'data' => [
                'id' => $userId,
                'name' => $userName,
                'email' => $userEmail,
                'mode' => $mode,
            ],
        ], 200);
    }
}
