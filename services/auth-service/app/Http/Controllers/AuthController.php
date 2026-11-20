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
