<?php

namespace Tests\Feature;

use App\Models\Promotion;
use App\Models\Saison;
use App\Models\Tarif;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TarifsApiTest extends TestCase
{
    use RefreshDatabase;

    private string $secret = 'test_jwt_secret_key_for_phpunit_2026';

    protected function setUp(): void
    {
        parent::setUp();
        putenv("JWT_SECRET={$this->secret}");
        $_ENV['JWT_SECRET'] = $this->secret;
    }

    private function genererToken(string $role = 'admin', int $sub = 1, int $expOffset = 3600): string
    {
        return JWT::encode([
            'sub' => $sub,
            'role' => $role,
            'exp' => time() + $expOffset,
        ], $this->secret, 'HS256');
    }

    public function test_health_endpoint_retourne_ok(): void
    {
        $this->getJson('/api/health')
            ->assertStatus(200)
            ->assertJson(['status' => 'ok']);
    }

    public function test_creation_sans_token_retourne_401(): void
    {
        $this->postJson('/api/saisons', [
            'nom' => 'Haute Saison',
            'date_debut' => '2026-07-01',
            'date_fin' => '2026-08-31',
        ])->assertStatus(401);
    }

    public function test_creation_avec_token_expire_retourne_401(): void
    {
        $tokenExpire = $this->genererToken('admin', 1, -60);

        $this->withHeader('Authorization', "Bearer {$tokenExpire}")
            ->postJson('/api/saisons', [
                'nom' => 'Haute Saison',
                'date_debut' => '2026-07-01',
                'date_fin' => '2026-08-31',
            ])->assertStatus(401);
    }

    public function test_creation_avec_role_client_retourne_403(): void
    {
        $tokenClient = $this->genererToken('client', 2);

        $this->withHeader('Authorization', "Bearer {$tokenClient}")
            ->postJson('/api/saisons', [
                'nom' => 'Haute Saison',
                'date_debut' => '2026-07-01',
                'date_fin' => '2026-08-31',
            ])->assertStatus(403);
    }

    public function test_admin_peut_creer_et_lister_saisons_sans_chevauchement(): void
    {
        $tokenAdmin = $this->genererToken('admin');

        $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
            ->postJson('/api/saisons', [
                'nom' => 'Été 2026',
                'date_debut' => '2026-07-01',
                'date_fin' => '2026-08-31',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.nom', 'Été 2026');

        // Chevauchement refusé (422)
        $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
            ->postJson('/api/saisons', [
                'nom' => 'Chevauchement',
                'date_debut' => '2026-08-15',
                'date_fin' => '2026-09-15',
            ])
            ->assertStatus(422);

        $this->getJson('/api/saisons')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_peut_creer_tarif_et_doublon_rg4_refuse(): void
    {
        Http::fake([
            '*/chambres/10' => Http::response(['id' => 10], 200),
            '*/chambres/999' => Http::response(['error' => 'Not found'], 404),
        ]);

        $tokenAdmin = $this->genererToken('admin');

        // Chambre inexistante -> 404
        $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
            ->postJson('/api/tarifs', [
                'chambre_id' => 999,
                'prix_nuit' => 500,
            ])
            ->assertStatus(404);

        // Création tarif standard -> 201
        $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
            ->postJson('/api/tarifs', [
                'chambre_id' => 10,
                'prix_nuit' => 500,
            ])
            ->assertStatus(201);

        // Doublon tarif standard pour la même chambre -> 422
        $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
            ->postJson('/api/tarifs', [
                'chambre_id' => 10,
                'prix_nuit' => 600,
            ])
            ->assertStatus(422);
    }

    public function test_calcul_depuis_base_combine_standard_saison_et_promotion(): void
    {
        // Tarif standard : 500 MAD/nuit
        Tarif::create([
            'chambre_id' => 1,
            'saison_id' => null,
            'prix_nuit' => 500,
            'devise' => 'MAD',
            'statut' => 'active',
        ]);

        // Saison haute du 12 au 15 juillet : 800 MAD/nuit
        $saison = Saison::create([
            'nom' => 'Haute Saison',
            'date_debut' => '2026-07-12',
            'date_fin' => '2026-07-20',
        ]);

        Tarif::create([
            'chambre_id' => 1,
            'saison_id' => $saison->id,
            'prix_nuit' => 800,
            'devise' => 'MAD',
            'statut' => 'active',
        ]);

        // Promotion 10% dès 3 nuits
        Promotion::create([
            'libelle' => 'Offre Été -10%',
            'chambre_id' => 1,
            'type_reduction' => 'POURCENTAGE',
            'valeur' => 10,
            'nuits_min' => 3,
            'date_debut' => '2026-07-01',
            'date_fin' => '2026-07-31',
            'statut' => 'active',
        ]);

        // Séjour du 10 au 14 juillet (4 nuits : 2 à 500 + 2 à 800 = 2600, -10% = 2340)
        $this->getJson('/api/tarifs/calcul?chambre_id=1&arrivee=2026-07-10&depart=2026-07-14')
            ->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'nb_nuits' => 4,
                    'sous_total' => 2600,
                    'prix_total' => 2340,
                    'chambre_id' => 1,
                    'devise' => 'MAD',
                    'promotion_appliquee' => 'Offre Été -10%',
                ],
            ]);
    }
}