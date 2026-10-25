<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Services\JwtService;

class JwtServiceTest extends TestCase
{
    private JwtService $jwtService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->jwtService = new JwtService();
    }

    public function test_can_generate_valid_jwt_token(): void
    {
        $role = new Role(['name' => 'client']);
        $user = new User([
            'name' => 'Jean Dupont',
            'email' => 'jean@example.com',
        ]);
        $user->id = 42;
        $user->setRelation('role', $role);

        $result = $this->jwtService->generateToken($user, 3600);

        $this->assertArrayHasKey('token', $result);
        $this->assertEquals('Bearer', $result['token_type']);
        $this->assertEquals(3600, $result['expires_in']);

        $decoded = $this->jwtService->decodeToken($result['token']);
        $this->assertNotNull($decoded);
        $this->assertEquals(42, $decoded->sub);
        $this->assertEquals('client', $decoded->role);
        $this->assertEquals('hotelhub-auth-service', $decoded->iss);
    }

    public function test_decode_invalid_token_returns_null(): void
    {
        $decoded = $this->jwtService->decodeToken('token.invalide.fausse_signature');
        $this->assertNull($decoded);
    }
}
