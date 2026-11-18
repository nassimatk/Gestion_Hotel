<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Models\User;
use Exception;

class JwtService
{
    private string $secret;

    public function __construct()
    {
        $secret = env('JWT_SECRET', 'change_me_long_random_secret_hotelhub_2026');
        if (strlen($secret) < 32) {
            $secret = str_pad($secret, 32, '0');
        }
        $this->secret = $secret;
    }

    /**
     * Génère un token JWT HS256 avec sub, role, iat, exp, iss
     */
    public function generateToken(User $user, int $expiresIn = 3600): array
    {
        $user->loadMissing('role');

        $issuedAt = time();
        $expire = $issuedAt + $expiresIn;

        $payload = [
            'iss' => 'hotelhub-auth-service',
            'sub' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ? $user->role->name : 'client',
            'iat' => $issuedAt,
            'exp' => $expire,
        ];

        $token = JWT::encode($payload, $this->secret, 'HS256');

        return [
            'token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => $expiresIn,
        ];
    }

    /**
     * Valide et décode un token JWT
     */
    public function decodeToken(string $token): ?object
    {
        try {
            return JWT::decode($token, new Key($this->secret, 'HS256'));
        } catch (Exception $e) {
            return null;
        }
    }
}
