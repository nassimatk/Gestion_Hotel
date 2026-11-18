<?php

namespace App\Http\Middleware;

use Closure;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * JwtAdminMiddleware
 *
 * Valide le Bearer token JWT ET vérifie que le rôle est 'admin'
 * ou que l'utilisateur possède la permission 'chambres.write'.
 * Retourne 401 si token absent/invalide/expiré.
 * Retourne 403 si l'utilisateur n'est pas autorisé.
 */
class JwtAdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $authHeader = $request->header('Authorization', '');

        if (!str_starts_with($authHeader, 'Bearer ')) {
            return response()->json([
                'error' => 'Token JWT manquant.',
                'code'  => 401,
            ], 401);
        }

        $token  = substr($authHeader, 7);
        $secret = env('JWT_SECRET') ?: ($_ENV['JWT_SECRET'] ?? $_SERVER['JWT_SECRET'] ?? '');

        // Tolérance de dérive d'horloge standard (60 secondes)
        \Firebase\JWT\JWT::$leeway = 60;

        try {
            $payload = JWT::decode($token, new Key($secret, 'HS256'));
            $request->attributes->set('jwtPayload', $payload);
            $request->merge(['jwtPayload' => (array) $payload]);
        } catch (ExpiredException) {
            return response()->json([
                'error' => 'Token expiré.',
                'code'  => 401,
            ], 401);
        } catch (SignatureInvalidException) {
            return response()->json([
                'error' => 'Signature du token invalide.',
                'code'  => 401,
            ], 401);
        } catch (\Throwable) {
            return response()->json([
                'error' => 'Token JWT invalide.',
                'code'  => 401,
            ], 401);
        }

        // Vérification du rôle admin ou de la permission 'chambres.write'
        $role = $payload->role ?? null;
        $permissions = isset($payload->permissions) ? (array) $payload->permissions : [];

        $isAdmin = ($role === 'admin');
        $hasPermission = in_array('chambres.write', $permissions);

        if (!$isAdmin && !$hasPermission) {
            return response()->json([
                'error' => 'Accès réservé aux administrateurs.',
                'code'  => 403,
            ], 403);
        }

        return $next($request);
    }
}
