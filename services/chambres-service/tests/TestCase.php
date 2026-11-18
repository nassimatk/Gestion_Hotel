<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

/**
 * Classe de base pour tous les tests de chambres-service.
 * Laravel 12 : utilise l'ApplicationFactory automatique via bootstrap/app.php
 */
abstract class TestCase extends BaseTestCase
{
    // Laravel 12 détecte automatiquement bootstrap/app.php
    // Pas besoin de createApplication() manuel
}
