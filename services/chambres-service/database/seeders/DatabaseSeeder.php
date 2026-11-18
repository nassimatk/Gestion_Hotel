<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * DatabaseSeeder
 *
 * Insère 6 chambres de démonstration avec des données réalistes.
 * Prix en MAD (dirham marocain).
 * Utilise DB::table pour éviter les doublons via truncate.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Supprime les données existantes et remet l'auto-increment à 1
        // Utilise SQL direct pour garantir le bon search_path (schema chambres)
        DB::statement('TRUNCATE TABLE chambres.chambres RESTART IDENTITY CASCADE');

        $chambres = [
            [
                'numero'      => '101',
                'type'        => 'simple',
                'capacite'    => 1,
                'prix_nuit'   => 450.00,
                'description' => 'Chambre simple confortable avec vue sur le jardin intérieur. Idéale pour les voyageurs d\'affaires.',
                'superficie'  => 22.0,
                'etage'       => 1,
                'vue'         => 'Jardin',
                'equipements' => json_encode(['Wi-Fi', 'Climatisation', 'TV 43"', 'Coffre-fort', 'Mini-bar']),
                'images'      => json_encode(['chambres/101/main.jpg', 'chambres/101/salle-de-bain.jpg']),
                'statut'      => 'disponible',
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
            [
                'numero'      => '102',
                'type'        => 'simple',
                'capacite'    => 1,
                'prix_nuit'   => 480.00,
                'description' => 'Chambre simple avec vue sur la mer. Décoration moderne et matériaux haut de gamme.',
                'superficie'  => 24.0,
                'etage'       => 1,
                'vue'         => 'Mer',
                'equipements' => json_encode(['Wi-Fi', 'Climatisation', 'TV 43"', 'Coffre-fort', 'Mini-bar', 'Balcon']),
                'images'      => json_encode(['chambres/102/main.jpg']),
                'statut'      => 'disponible',
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
            [
                'numero'      => '201',
                'type'        => 'double',
                'capacite'    => 2,
                'prix_nuit'   => 750.00,
                'description' => 'Chambre double spacieuse avec lit king-size et vue panoramique sur la ville.',
                'superficie'  => 36.0,
                'etage'       => 2,
                'vue'         => 'Ville',
                'equipements' => json_encode(['Wi-Fi', 'Climatisation', 'TV 55"', 'Coffre-fort', 'Mini-bar', 'Baignoire', 'Peignoirs']),
                'images'      => json_encode(['chambres/201/main.jpg', 'chambres/201/lit.jpg']),
                'statut'      => 'disponible',
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
            [
                'numero'      => '202',
                'type'        => 'double',
                'capacite'    => 2,
                'prix_nuit'   => 820.00,
                'description' => 'Chambre double premium avec deux lits queen et accès direct à la piscine.',
                'superficie'  => 40.0,
                'etage'       => 2,
                'vue'         => 'Piscine',
                'equipements' => json_encode(['Wi-Fi', 'Climatisation', 'TV 55"', 'Coffre-fort', 'Mini-bar', 'Terrasse privée']),
                'images'      => json_encode(['chambres/202/main.jpg', 'chambres/202/terrasse.jpg']),
                'statut'      => 'occupee',
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
            [
                'numero'      => '301',
                'type'        => 'suite',
                'capacite'    => 4,
                'prix_nuit'   => 1800.00,
                'description' => 'Suite luxueuse avec salon séparé, jacuzzi privatif et vue mer à 180°. Idéale pour les séjours romantiques.',
                'superficie'  => 85.0,
                'etage'       => 3,
                'vue'         => 'Mer panoramique',
                'equipements' => json_encode(['Wi-Fi haut débit', 'Climatisation', 'TV 65"', 'Système audio Bose', 'Jacuzzi', 'Coffre-fort', 'Bar privé', 'Terrasse', 'Service en chambre 24h/24']),
                'images'      => json_encode(['chambres/301/main.jpg', 'chambres/301/salon.jpg', 'chambres/301/jacuzzi.jpg']),
                'statut'      => 'disponible',
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
            [
                'numero'      => '401',
                'type'        => 'presidentielle',
                'capacite'    => 6,
                'prix_nuit'   => 4500.00,
                'description' => 'Suite présidentielle sur deux niveaux avec terrasse privée, piscine à débordement, salle à manger et service butler personnalisé.',
                'superficie'  => 250.0,
                'etage'       => 4,
                'vue'         => 'Vue 360° sur l\'océan et la médina',
                'equipements' => json_encode(['Wi-Fi fibré dédié', 'Climatisation multi-zone', '3 TV 75"', 'Home cinéma', 'Piscine privée', 'Jacuzzi', 'Cuisine équipée', 'Salle de sport', 'Butler 24h/24', 'Transfert aéroport inclus', 'Petit-déjeuner inclus']),
                'images'      => json_encode(['chambres/401/main.jpg', 'chambres/401/piscine.jpg', 'chambres/401/terrasse.jpg', 'chambres/401/salon.jpg']),
                'statut'      => 'disponible',
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
        ];

        DB::table('chambres')->insert($chambres);

        $this->command->info('✅ 6 chambres insérées avec succès (prix en MAD).');
    }
}
