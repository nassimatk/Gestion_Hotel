<?php

namespace App\Http\Middleware;

use Closure;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class JwtAuthMiddleware
{
    public function handle(Request $request, Closure $next, ?string $requiredRole = null): Response
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json([
                'success' => false,
                'error' => 'Token JWT manquant ou invalide.',
            ], 401);
        }

        $token = trim(substr($authHeader, 7));
        $secret = env('JWT_SECRET');

        if (!$secret) {
            return response()->json([
                'success' => false,
                'error' => 'Configuration JWT_SECRET manquante sur le serveur.',
            ], 500);
        }

        try {
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));
        } catch (ExpiredException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Token JWT expiré.',
            ], 401);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'Token JWT invalide.',
            ], 401);
        }

        $role = $decoded->role ?? null;
        $userId = $decoded->sub ?? null;

        if ($requiredRole !== null && $role !== $requiredRole) {
            return response()->json([
                'success' => false,
                'error' => 'Accès refusé : rôle ' . $requiredRole . ' requis.',
            ], 403);
        }

        $request->attributes->set('jwt_user_id', $userId);
        $request->attributes->set('jwt_role', $role);

        return $next($request);
    }
}