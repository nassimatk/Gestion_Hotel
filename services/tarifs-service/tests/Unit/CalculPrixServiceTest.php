<?php

namespace Tests\Unit;

use App\Services\CalculPrixService;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class CalculPrixServiceTest extends TestCase
{
    private CalculPrixService $service;
    private array $saisons;

    protected function setUp(): void
    {
        $this->service = new CalculPrixService();
        $this->saisons = [
            ['date_debut' => '2026-12-15', 'date_fin' => '2027-01-05', 'prix_nuit' => 1000.0],
        ];
    }

    // ----- nombreNuits -----

    public function test_nombre_nuits_cas_normal(): void
    {
        $this->assertSame(7, $this->service->nombreNuits('2026-12-20', '2026-12-27'));
    }

    public function test_nombre_nuits_limite_une_seule_nuit(): void
    {
        $this->assertSame(1, $this->service->nombreNuits('2026-12-20', '2026-12-21'));
    }

    public function test_nombre_nuits_erreur_depart_avant_arrivee(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->service->nombreNuits('2026-12-27', '2026-12-20');
    }

    public function test_nombre_nuits_erreur_meme_jour(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->service->nombreNuits('2026-12-20', '2026-12-20');
    }

    // ----- prixNuit -----

    public function test_prix_nuit_cas_normal_hors_saison(): void
    {
        $this->assertSame(500.0, $this->service->prixNuit('2026-06-10', 500.0, $this->saisons));
    }

    public function test_prix_nuit_cas_normal_dans_saison(): void
    {
        $this->assertSame(1000.0, $this->service->prixNuit('2026-12-25', 500.0, $this->saisons));
    }

    public function test_prix_nuit_limite_bornes_de_saison_incluses(): void
    {
        $this->assertSame(1000.0, $this->service->prixNuit('2026-12-15', 500.0, $this->saisons));
        $this->assertSame(1000.0, $this->service->prixNuit('2027-01-05', 500.0, $this->saisons));
        $this->assertSame(500.0, $this->service->prixNuit('2027-01-06', 500.0, $this->saisons));
    }

    // ----- appliquerPromotion -----

    public function test_promotion_cas_normal_pourcentage(): void
    {
        $promo = ['type_reduction' => 'POURCENTAGE', 'valeur' => 10, 'nuits_min' => 7];
        $this->assertEqualsWithDelta(6300.0, $this->service->appliquerPromotion(7000.0, $promo, 7), 0.001);
    }

    public function test_promotion_limite_nuits_min_non_atteint(): void
    {
        $promo = ['type_reduction' => 'POURCENTAGE', 'valeur' => 10, 'nuits_min' => 7];
        $this->assertEqualsWithDelta(6000.0, $this->service->appliquerPromotion(6000.0, $promo, 6), 0.001);
    }

    public function test_promotion_limite_montant_fixe_jamais_negatif(): void
    {
        $promo = ['type_reduction' => 'MONTANT_FIXE', 'valeur' => 500, 'nuits_min' => 1];
        $this->assertEqualsWithDelta(0.0, $this->service->appliquerPromotion(100.0, $promo, 2), 0.001);
    }

    public function test_promotion_erreur_pourcentage_100(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $promo = ['type_reduction' => 'POURCENTAGE', 'valeur' => 100, 'nuits_min' => 1];
        $this->service->appliquerPromotion(1000.0, $promo, 3);
    }

    // ----- calculerSejour -----

    public function test_sejour_a_cheval_sur_deux_periodes(): void
    {
        // 14/12 hors saison (500), 15/12 et 16/12 en saison (1000 x 2) = 2500
        $r = $this->service->calculerSejour('2026-12-14', '2026-12-17', 500.0, $this->saisons);

        $this->assertSame(3, $r['nb_nuits']);
        $this->assertEqualsWithDelta(2500.0, $r['prix_total'], 0.001);
    }
}