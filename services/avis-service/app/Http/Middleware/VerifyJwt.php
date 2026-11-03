<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use Throwable;

class VerifyJwt
{
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Récupérer le token envoyé par React
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'message' => 'Token JWT manquant.'
            ], 401);
        }

        // 2. Récupérer la clé secrète partagée
        $secret = config('services.auth.jwt_secret');

        if (!$secret) {
            return response()->json([
                'message' => 'Configuration JWT manquante sur le service Avis.'
            ], 500);
        }

        try {
            // 3. Vérifier la signature et décoder le JWT
            $decoded = JWT::decode(
                $token,
                new Key($secret, 'HS256')
            );

            // 4. Récupérer l'identifiant utilisateur
            $userId = $decoded->sub ?? null;

            if (!is_numeric($userId) || (int) $userId <= 0) {
                return response()->json([
                    'message' => 'Identifiant utilisateur invalide.'
                ], 401);
            }

            // 5. Transmettre les informations au contrôleur
            $request->attributes->set('authenticated_user', [
                'id' => (int) $userId,
                'role' => $decoded->role ?? null,
            ]);

            return $next($request);

        } catch (ExpiredException $e) {
            return response()->json([
                'message' => 'Token JWT expiré.'
            ], 401);

        } catch (SignatureInvalidException $e) {
            return response()->json([
                'message' => 'Signature JWT invalide.'
            ], 401);

        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Token JWT invalide.'
            ], 401);
        }
    }
}