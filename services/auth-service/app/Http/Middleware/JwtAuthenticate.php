<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\JwtService;
use App\Models\User;
use Symfony\Component\HttpFoundation\Response;

class JwtAuthenticate
{
    protected JwtService $jwtService;

    public function __construct(JwtService $jwtService)
    {
        $this->jwtService = $jwtService;
    }

    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization');

        if (!$header || !str_starts_with($header, 'Bearer ')) {
            return response()->json([
                'error' => 'Token manquant',
                'code' => 401,
            ], 401);
        }

        $token = substr($header, 7);
        $payload = $this->jwtService->decodeToken($token);

        if (!$payload) {
            return response()->json([
                'error' => 'Token invalide ou expiré',
                'code' => 401,
            ], 401);
        }

        $user = User::with('role')->find($payload->sub);

        if (!$user) {
            return response()->json([
                'error' => 'Utilisateur introuvable',
                'code' => 401,
            ], 401);
        }

        // Associer l'utilisateur connecté à la requête
        $request->merge(['auth_user' => $user]);

        return $next($request);
    }
}
