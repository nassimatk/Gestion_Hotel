<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Chambre;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * ChambreApiTest
 *
 * Suite complète de tests pour les endpoints de chambres-service.
 * Couvre : routes publiques, routes protégées (auth/authz), CRUD, soft delete,
 * validations et cas d'erreur.
 */
class ChambreApiTest extends TestCase
{
    use RefreshDatabase;

    private string $jwtSecret = 'hotelhub_super_secret_jwt_key_2026_dev_secure';

    /* ------------------------------------------------------------------ */
    /*  HELPERS                                                             */
    /* ------------------------------------------------------------------ */

    /**
     * Génère un token JWT valide pour un rôle donné.
     */
    private function makeToken(string $role = 'admin', int $ttl = 3600): string
    {
        $payload = [
            'iss'  => 'hotelhub-auth',
            'sub'  => 1,
            'role' => $role,
            'iat'  => time(),
            'exp'  => time() + $ttl,
        ];
        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    /**
     * Crée une chambre de test en base.
     */
    private function makeChambre(array $overrides = []): Chambre
    {
        static $counter = 0;
        $counter++;

        return Chambre::create(array_merge([
            'numero'      => "T{$counter}",
            'type'        => 'simple',
            'capacite'    => 1,
            'prix_nuit'   => 500.00,
            'description' => 'Chambre de test',
            'superficie'  => 20.0,
            'etage'       => 1,
            'vue'         => 'Cour',
            'equipements' => ['Wi-Fi'],
            'images'      => [],
            'statut'      => 'disponible',
        ], $overrides));
    }

    /* ------------------------------------------------------------------ */
    /*  HEALTH CHECK                                                        */
    /* ------------------------------------------------------------------ */

    public function test_health_endpoint_returns_ok(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
                 ->assertJson([
                     'status'  => 'ok',
                     'service' => 'chambres-service',
                 ]);
    }

    /* ------------------------------------------------------------------ */
    /*  LECTURE PUBLIQUE                                                    */
    /* ------------------------------------------------------------------ */

    public function test_index_returns_empty_list_when_no_chambres(): void
    {
        $response = $this->getJson('/api/chambres');

        $response->assertStatus(200)
                 ->assertJsonStructure(['data', 'total'])
                 ->assertJson(['total' => 0]);
    }

    public function test_index_returns_all_chambres(): void
    {
        $this->makeChambre();
        $this->makeChambre(['numero' => 'T_B', 'type' => 'double', 'capacite' => 2]);

        $response = $this->getJson('/api/chambres');

        $response->assertStatus(200)
                 ->assertJson(['total' => 2]);
    }

    public function test_index_filters_by_type(): void
    {
        $this->makeChambre(['type' => 'suite']);
        $this->makeChambre(['type' => 'simple']);

        $response = $this->getJson('/api/chambres?type=suite');

        $response->assertStatus(200)
                 ->assertJson(['total' => 1]);
    }

    public function test_index_filters_by_prix_max(): void
    {
        $this->makeChambre(['prix_nuit' => 300.00]);
        $this->makeChambre(['prix_nuit' => 1000.00]);

        $response = $this->getJson('/api/chambres?prix_max=500');

        $response->assertStatus(200)
                 ->assertJson(['total' => 1]);
    }

    public function test_show_returns_chambre(): void
    {
        $chambre = $this->makeChambre();

        $response = $this->getJson("/api/chambres/{$chambre->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('data.numero', $chambre->numero);
    }

    public function test_show_returns_404_for_unknown_id(): void
    {
        $response = $this->getJson('/api/chambres/9999');

        $response->assertStatus(404)
                 ->assertJsonPath('code', 404);
    }

    public function test_show_does_not_return_soft_deleted_chambre(): void
    {
        $chambre = $this->makeChambre();
        $chambre->delete(); // soft delete

        $response = $this->getJson("/api/chambres/{$chambre->id}");

        $response->assertStatus(404);
    }

    /* ------------------------------------------------------------------ */
    /*  AUTHENTIFICATION / AUTORISATION                                     */
    /* ------------------------------------------------------------------ */

    public function test_store_returns_401_without_token(): void
    {
        $response = $this->postJson('/api/chambres', []);

        $response->assertStatus(401)
                 ->assertJsonPath('code', 401);
    }

    public function test_store_returns_403_for_non_admin_token(): void
    {
        $token = $this->makeToken('client');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
                         ->postJson('/api/chambres', []);

        $response->assertStatus(403)
                 ->assertJsonPath('code', 403);
    }

    public function test_update_returns_401_without_token(): void
    {
        $chambre = $this->makeChambre();

        $response = $this->putJson("/api/chambres/{$chambre->id}", []);

        $response->assertStatus(401);
    }

    public function test_delete_returns_401_without_token(): void
    {
        $chambre = $this->makeChambre();

        $response = $this->deleteJson("/api/chambres/{$chambre->id}");

        $response->assertStatus(401);
    }

    /* ------------------------------------------------------------------ */
    /*  CRÉATION                                                            */
    /* ------------------------------------------------------------------ */

    public function test_store_creates_chambre_as_admin(): void
    {
        $token = $this->makeToken('admin');

        $payload = [
            'numero'      => '999',
            'type'        => 'double',
            'capacite'    => 2,
            'prix_nuit'   => 750.00,
            'description' => 'Chambre test créée par admin',
            'superficie'  => 35.0,
            'etage'       => 3,
            'vue'         => 'Mer',
            'equipements' => ['Wi-Fi', 'Climatisation'],
            'images'      => [],
            'statut'      => 'disponible',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
                         ->postJson('/api/chambres', $payload);

        $response->assertStatus(201)
                 ->assertJsonPath('data.numero', '999')
                 ->assertJsonPath('data.type', 'double');

        $this->assertDatabaseHas('chambres', ['numero' => '999']);
    }

    public function test_store_returns_422_when_required_fields_missing(): void
    {
        $token = $this->makeToken('admin');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
                         ->postJson('/api/chambres', ['type' => 'suite']); // manque numero, capacite, prix_nuit

        $response->assertStatus(422)
                 ->assertJsonPath('code', 422)
                 ->assertJsonStructure(['errors']);
    }

    public function test_store_returns_422_for_duplicate_numero(): void
    {
        $this->makeChambre(['numero' => 'DUP01']);
        $token = $this->makeToken('admin');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
                         ->postJson('/api/chambres', [
                             'numero'    => 'DUP01',
                             'type'      => 'simple',
                             'capacite'  => 1,
                             'prix_nuit' => 400,
                         ]);

        $response->assertStatus(422);
    }

    /* ------------------------------------------------------------------ */
    /*  MISE À JOUR                                                         */
    /* ------------------------------------------------------------------ */

    public function test_update_modifies_chambre_as_admin(): void
    {
        $chambre = $this->makeChambre(['prix_nuit' => 500]);
        $token   = $this->makeToken('admin');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
                         ->putJson("/api/chambres/{$chambre->id}", ['prix_nuit' => 999.99]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.prix_nuit', 999.99);
    }

    public function test_update_returns_404_for_unknown_id(): void
    {
        $token = $this->makeToken('admin');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
                         ->putJson('/api/chambres/9999', ['prix_nuit' => 999]);

        $response->assertStatus(404);
    }

    /* ------------------------------------------------------------------ */
    /*  SUPPRESSION (SOFT DELETE)                                           */
    /* ------------------------------------------------------------------ */

    public function test_destroy_soft_deletes_chambre(): void
    {
        $chambre = $this->makeChambre();
        $token   = $this->makeToken('admin');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
                         ->deleteJson("/api/chambres/{$chambre->id}");

        $response->assertStatus(204);

        // La ligne existe toujours en BDD avec deleted_at rempli
        $this->assertSoftDeleted('chambres', ['id' => $chambre->id]);
    }

    public function test_destroy_returns_404_for_unknown_id(): void
    {
        $token = $this->makeToken('admin');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
                         ->deleteJson('/api/chambres/9999');

        $response->assertStatus(404);
    }

    public function test_soft_deleted_chambre_not_visible_in_index(): void
    {
        $chambre = $this->makeChambre();

        // Soft delete directement via le modèle (sans passer par l'API)
        $chambre->delete();

        $response = $this->getJson('/api/chambres');
        $response->assertStatus(200)
                 ->assertJson(['total' => 0]);
    }
}
