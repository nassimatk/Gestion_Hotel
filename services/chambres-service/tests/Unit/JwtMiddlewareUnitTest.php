<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Http\Middleware\JwtMiddleware;
use App\Http\Middleware\JwtAdminMiddleware;
use Firebase\JWT\JWT;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Tests unitaires sur les middlewares JWT.
 * Teste la logique d'authentification et de filtrage RBAC de manière isolée.
 */
class JwtMiddlewareUnitTest extends TestCase
{
    private string $jwtSecret = 'hotelhub_super_secret_jwt_key_2026_dev_secure';

    /**
     * Helper pour forger un jeton de test.
     */
    private function forgeToken(string $role = 'client', int $ttl = 3600, ?string $secret = null): string
    {
        $payload = [
            'iss'  => 'hotelhub-auth',
            'sub'  => 42,
            'role' => $role,
            'iat'  => time(),
            'exp'  => time() + $ttl,
        ];

        return JWT::encode($payload, $secret ?? $this->jwtSecret, 'HS256');
    }

    /* ------------------------------------------------------------------ */
    /*  JwtMiddleware (Standard)                                          */
    /* ------------------------------------------------------------------ */

    public function test_jwt_middleware_rejects_missing_authorization_header(): void
    {
        $middleware = new JwtMiddleware();
        $request = Request::create('/api/test', 'GET');

        $response = $middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(401, $response->getStatusCode());
        $this->assertEquals('Token JWT manquant.', $response->getData()->error);
    }

    public function test_jwt_middleware_rejects_malformed_authorization_header(): void
    {
        $middleware = new JwtMiddleware();
        $request = Request::create('/api/test', 'GET');
        $request->headers->set('Authorization', 'Basic dXNlcjpwYXNz'); // Pas de Bearer

        $response = $middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(401, $response->getStatusCode());
        $this->assertEquals('Token JWT manquant.', $response->getData()->error);
    }

    public function test_jwt_middleware_rejects_invalid_token_signature(): void
    {
        $middleware = new JwtMiddleware();
        $fakeToken = $this->forgeToken('client', 3600, 'cle_secrete_completement_fausse_123456789');

        $request = Request::create('/api/test', 'GET');
        $request->headers->set('Authorization', "Bearer {$fakeToken}");

        $response = $middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(401, $response->getStatusCode());
        $this->assertEquals('Signature du token invalide.', $response->getData()->error);
    }

    public function test_jwt_middleware_rejects_expired_token(): void
    {
        $middleware = new JwtMiddleware();
        // Token expiré depuis 1 heure (TTL négatif)
        $expiredToken = $this->forgeToken('client', -3600);

        $request = Request::create('/api/test', 'GET');
        $request->headers->set('Authorization', "Bearer {$expiredToken}");

        // Leeway = 0 pour tester l'expiration stricte
        \Firebase\JWT\JWT::$leeway = 0;

        $response = $middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(401, $response->getStatusCode());
        $this->assertEquals('Token expiré.', $response->getData()->error);
    }

    public function test_jwt_middleware_allows_valid_token_and_attaches_payload(): void
    {
        $middleware = new JwtMiddleware();
        $token = $this->forgeToken('client', 3600);

        $request = Request::create('/api/test', 'GET');
        $request->headers->set('Authorization', "Bearer {$token}");

        $calledNext = false;
        $response = $middleware->handle($request, function ($req) use (&$calledNext) {
            $calledNext = true;
            // Vérifie que le payload décodé est bien disponible sur la requête
            $payload = (object) $req->get('jwtPayload');
            $this->assertNotNull($payload);
            $this->assertEquals('client', $payload->role);
            $this->assertEquals(42, $payload->sub);
            return response()->json(['status' => 'success']);
        });

        $this->assertTrue($calledNext);
        $this->assertEquals(200, $response->getStatusCode());
    }

    /* ------------------------------------------------------------------ */
    /*  JwtAdminMiddleware (RBAC Admin)                                    */
    /* ------------------------------------------------------------------ */

    public function test_jwt_admin_middleware_blocks_client_role_with_403(): void
    {
        $middleware = new JwtAdminMiddleware();
        // Token valide mais avec le rôle 'client'
        $token = $this->forgeToken('client', 3600);

        $request = Request::create('/api/chambres', 'POST');
        $request->headers->set('Authorization', "Bearer {$token}");

        $calledNext = false;
        $response = $middleware->handle($request, function () use (&$calledNext) {
            $calledNext = true;
            return response()->json(['status' => 'ok']);
        });

        $this->assertFalse($calledNext);
        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(403, $response->getStatusCode());
        $this->assertEquals('Accès réservé aux administrateurs.', $response->getData()->error);
    }

    public function test_jwt_admin_middleware_allows_admin_role(): void
    {
        $middleware = new JwtAdminMiddleware();
        // Token avec le rôle 'admin'
        $token = $this->forgeToken('admin', 3600);

        $request = Request::create('/api/chambres', 'POST');
        $request->headers->set('Authorization', "Bearer {$token}");

        $calledNext = false;
        $response = $middleware->handle($request, function ($req) use (&$calledNext) {
            $calledNext = true;
            return response()->json(['created' => true], 201);
        });

        $this->assertTrue($calledNext);
        $this->assertEquals(201, $response->getStatusCode());
    }
}
