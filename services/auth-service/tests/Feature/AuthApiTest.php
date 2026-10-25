<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Role;
use App\Services\JwtService;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    private Role $clientRole;
    private Role $adminRole;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clientRole = Role::create([
            'name' => 'client',
            'description' => 'Client de l\'hôtel'
        ]);

        $this->adminRole = Role::create([
            'name' => 'admin',
            'description' => 'Administrateur'
        ]);
    }

    public function test_health_check_returns_ok(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
                 ->assertJson(['status' => 'ok']);
    }

    public function test_register_creates_client_user(): void
    {
        $payload = [
            'name' => 'Alice Martin',
            'email' => 'alice@example.com',
            'password' => 'secret1234',
        ];

        $response = $this->postJson('/api/register', $payload);

        $response->assertStatus(201)
                 ->assertJsonStructure(['id', 'name', 'email', 'role'])
                 ->assertJson([
                     'name' => 'Alice Martin',
                     'email' => 'alice@example.com',
                     'role' => 'client',
                 ]);

        $this->assertDatabaseHas('users', [
            'email' => 'alice@example.com',
            'role_id' => $this->clientRole->id,
        ]);
    }

    public function test_register_fails_with_invalid_data(): void
    {
        // Mot de passe trop court (< 8 caractères)
        $payload = [
            'name' => 'Bob',
            'email' => 'bob@example.com',
            'password' => '123',
        ];

        $response = $this->postJson('/api/register', $payload);

        $response->assertStatus(422)
                 ->assertJson([
                     'error' => 'Données invalides',
                     'code' => 422,
                 ]);
    }

    public function test_register_fails_when_email_already_used(): void
    {
        User::create([
            'name' => 'Existant',
            'email' => 'doublon@example.com',
            'password' => Hash::make('secret1234'),
            'role_id' => $this->clientRole->id,
        ]);

        $payload = [
            'name' => 'Nouveau',
            'email' => 'doublon@example.com',
            'password' => 'secret1234',
        ];

        $response = $this->postJson('/api/register', $payload);

        $response->assertStatus(422)
                 ->assertJson([
                     'error' => 'Email déjà utilisé',
                     'code' => 422,
                 ]);
    }

    public function test_login_successful_returns_jwt(): void
    {
        User::create([
            'name' => 'Client Test',
            'email' => 'client@hotelhub.com',
            'password' => Hash::make('password123'),
            'role_id' => $this->clientRole->id,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'client@hotelhub.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'token',
                     'token_type',
                     'expires_in',
                 ])
                 ->assertJson([
                     'token_type' => 'Bearer',
                     'expires_in' => 3600,
                 ]);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::create([
            'name' => 'Client Test',
            'email' => 'client@hotelhub.com',
            'password' => Hash::make('password123'),
            'role_id' => $this->clientRole->id,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'client@hotelhub.com',
            'password' => 'mauvais_mot_de_passe',
        ]);

        $response->assertStatus(401)
                 ->assertJson([
                     'error' => 'Identifiants invalides',
                     'code' => 401,
                 ]);
    }

    public function test_login_fails_with_unknown_email(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'inconnu@hotelhub.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(401)
                 ->assertJson([
                     'error' => 'Identifiants invalides',
                     'code' => 401,
                 ]);
    }

    public function test_me_returns_profile_when_authenticated(): void
    {
        $user = User::create([
            'name' => 'Charlie',
            'email' => 'charlie@hotelhub.com',
            'password' => Hash::make('password123'),
            'role_id' => $this->adminRole->id,
        ]);

        $jwtService = new JwtService();
        $jwt = $jwtService->generateToken($user);

        $response = $this->withHeader('Authorization', 'Bearer ' . $jwt['token'])
                         ->getJson('/api/me');

        $response->assertStatus(200)
                 ->assertJson([
                     'id' => $user->id,
                     'name' => 'Charlie',
                     'email' => 'charlie@hotelhub.com',
                     'role' => 'admin',
                 ]);
    }

    public function test_me_fails_without_token(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertStatus(401)
                 ->assertJson([
                     'error' => 'Token manquant',
                     'code' => 401,
                 ]);
    }

    public function test_me_fails_with_invalid_token(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer token_invalide_xyz')
                         ->getJson('/api/me');

        $response->assertStatus(401)
                 ->assertJson([
                     'error' => 'Token invalide ou expiré',
                     'code' => 401,
                 ]);
    }
}
