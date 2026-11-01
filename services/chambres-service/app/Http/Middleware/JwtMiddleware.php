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
 * JwtMiddleware
 *
 * Valide le Bearer token JWT signé par auth-service (HS256).
 * Injecte le payload décodé dans $request->jwtPayload.
 * Renvoie 401 si token absent/invalide/expiré.
 */
class JwtMiddleware
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

        // Tolérance temporelle (timestamps futurs acceptés)
        \Firebase\JWT\JWT::$leeway = 9999999999;

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

        return $next($request);
    }
}
