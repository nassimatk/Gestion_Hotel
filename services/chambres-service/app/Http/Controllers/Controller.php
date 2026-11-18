<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

/**
 * Contrôleur de base pour chambres-service.
 * Hérite du contrôleur Laravel avec les traits standards.
 */
class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;
}
