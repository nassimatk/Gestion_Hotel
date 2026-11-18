<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Middleware JWT standard (authentifié uniquement)
        $middleware->alias([
            'jwt'       => \App\Http\Middleware\JwtMiddleware::class,
            'jwt.admin' => \App\Http\Middleware\JwtAdminMiddleware::class,
        ]);
    })
    
    ->withExceptions(function (Exceptions $exceptions) {
        // Gestion globale des exceptions
        $exceptions->shouldRenderJsonWhen(fn ($request, $e) => $request->is('api/*') || $request->expectsJson());
    $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $request) {
        if ($request->is('api/*')) {
            return response()->json(['error' => 'Ressource introuvable.', 'code' => 404], 404);
        }
    });
    $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException $e, $request) {
        if ($request->is('api/*')) {
            return response()->json(['error' => 'Méthode non autorisée.', 'code' => 405], 405);
        }
    });
    });
    
