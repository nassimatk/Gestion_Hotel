<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles prévus dans le diagramme
        $clientRole = Role::firstOrCreate(
            ['name' => 'client'],
            ['description' => 'Client de l\'hôtel']
        );

        $adminRole = Role::firstOrCreate(
            ['name' => 'admin'],
            ['description' => 'Administrateur du système']
        );

        // 2. Exemples de permissions du diagramme
        $p1 = Permission::firstOrCreate(['name' => 'chambres.write'], ['description' => 'Créer/modifier des chambres']);
        $p2 = Permission::firstOrCreate(['name' => 'avis.moderate'], ['description' => 'Modérer les avis']);
        $p3 = Permission::firstOrCreate(['name' => 'users.list'], ['description' => 'Lister les utilisateurs']);

        // Associer toutes les permissions au rôle admin
        $adminRole->permissions()->syncWithoutDetaching([$p1->id, $p2->id, $p3->id]);

        // 3. Créer un administrateur par défaut
        User::firstOrCreate(
            ['email' => 'admin@hotelhub.com'],
            [
                'name' => 'Administrateur HotelHub',
                'password' => Hash::make('admin_secret'),
                'role_id' => $adminRole->id,
            ]
        );
    }
}
