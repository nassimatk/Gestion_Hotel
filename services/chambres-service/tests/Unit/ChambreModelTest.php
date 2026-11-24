<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Chambre;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Tests unitaires sur le modèle Chambre.
 * Vérifie le typage, les casts, le mass-assignment et le Soft Delete.
 */
class ChambreModelTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Teste la création d'une chambre avec les attributs fillable.
     */
    public function test_chambre_can_be_instantiated_with_fillable_attributes(): void
    {
        $chambre = Chambre::create([
            'numero'      => '501',
            'type'        => 'suite',
            'capacite'    => 3,
            'prix_nuit'   => 1200.50,
            'description' => 'Suite de luxe avec vue panoramique.',
            'superficie'  => 65.5,
            'etage'       => 5,
            'vue'         => 'Mer',
            'equipements' => ['Wi-Fi', 'Jacuzzi', 'Minibar'],
            'images'      => ['suite501_1.jpg', 'suite501_2.jpg'],
            'statut'      => 'disponible',
        ]);

        $this->assertInstanceOf(Chambre::class, $chambre);
        $this->assertEquals('501', $chambre->numero);
        $this->assertEquals('suite', $chambre->type);
        $this->assertEquals(3, $chambre->capacite);
        $this->assertEquals(1200.50, $chambre->prix_nuit);
        $this->assertEquals(65.5, $chambre->superficie);
        $this->assertEquals(5, $chambre->etage);
        $this->assertEquals('Mer', $chambre->vue);
        $this->assertEquals('disponible', $chambre->statut);
    }

    /**
     * Teste les casts stricts du modèle Chambre (array, float, int).
     */
    public function test_chambre_casts_attributes_correctly(): void
    {
        $chambre = Chambre::create([
            'numero'      => '105',
            'type'        => 'simple',
            'capacite'    => '2',       // passé en string
            'prix_nuit'   => '499.90',  // passé en string
            'superficie'  => '25.0',    // passé en string
            'etage'       => '1',       // passé en string
            'equipements' => ['Climatisation', 'TV'],
            'images'      => ['chambre.jpg'],
            'statut'      => 'disponible',
        ]);

        $this->assertIsInt($chambre->capacite);
        $this->assertSame(2, $chambre->capacite);

        $this->assertIsFloat($chambre->prix_nuit);
        $this->assertSame(499.90, $chambre->prix_nuit);

        $this->assertIsFloat($chambre->superficie);
        $this->assertSame(25.0, $chambre->superficie);

        $this->assertIsInt($chambre->etage);
        $this->assertSame(1, $chambre->etage);

        $this->assertIsArray($chambre->equipements);
        $this->assertCount(2, $chambre->equipements);
        $this->assertContains('Climatisation', $chambre->equipements);

        $this->assertIsArray($chambre->images);
        $this->assertCount(1, $chambre->images);
    }

    /**
     * Teste le mécanisme de Soft Delete (suppression logique).
     */
    public function test_chambre_uses_soft_deletes(): void
    {
        $chambre = Chambre::create([
            'numero'    => '303',
            'type'      => 'double',
            'capacite'  => 2,
            'prix_nuit' => 700.00,
        ]);

        $this->assertNull($chambre->deleted_at);
        $this->assertFalse($chambre->trashed());

        // Suppression logique
        $chambre->delete();

        $this->assertTrue($chambre->trashed());
        $this->assertNotNull($chambre->deleted_at);

        // La ligne existe toujours physiquement dans la table SQLite
        $this->assertDatabaseHas('chambres', [
            'id'     => $chambre->id,
            'numero' => '303',
        ]);
    }

    /**
     * Teste que les requêtes classiques ignorent les chambres soft-deleted.
     */
    public function test_soft_deleted_chambre_is_excluded_from_default_queries(): void
    {
        $chambre = Chambre::create([
            'numero'    => '304',
            'type'      => 'double',
            'capacite'  => 2,
            'prix_nuit' => 750.00,
        ]);

        $chambre->delete();

        // Query standard ne trouve rien
        $this->assertEquals(0, Chambre::count());
        $this->assertNull(Chambre::find($chambre->id));

        // Query withTrashed inclut la chambre
        $this->assertEquals(1, Chambre::withTrashed()->count());
        $this->assertNotNull(Chambre::withTrashed()->find($chambre->id));
    }

    /**
     * Teste la restauration d'une chambre après soft delete.
     */
    public function test_soft_deleted_chambre_can_be_restored(): void
    {
        $chambre = Chambre::create([
            'numero'    => '305',
            'type'      => 'double',
            'capacite'  => 2,
            'prix_nuit' => 750.00,
        ]);

        $chambre->delete();
        $this->assertTrue($chambre->trashed());

        // Restauration
        $chambre->restore();

        $this->assertFalse($chambre->fresh()->trashed());
        $this->assertNull($chambre->fresh()->deleted_at);
        $this->assertEquals(1, Chambre::count());
    }

    /**
     * Teste la suppression physique (forceDelete).
     */
    public function test_chambre_can_be_force_deleted(): void
    {
        $chambre = Chambre::create([
            'numero'    => '306',
            'type'      => 'double',
            'capacite'  => 2,
            'prix_nuit' => 750.00,
        ]);

        $chambre->forceDelete();

        $this->assertDatabaseMissing('chambres', [
            'id' => $chambre->id,
        ]);
        $this->assertEquals(0, Chambre::withTrashed()->count());
    }

    /**
     * Teste la protection Mass Assignment (champs non déclarés ignorés).
     */
    public function test_unfillable_attributes_are_ignored(): void
    {
        $chambre = Chambre::create([
            'numero'       => '307',
            'type'         => 'simple',
            'capacite'     => 1,
            'prix_nuit'    => 400.00,
            'champ_inconnu' => 'valeur_pirate',
        ]);

        $this->assertArrayNotHasKey('champ_inconnu', $chambre->toArray());
    }
}
