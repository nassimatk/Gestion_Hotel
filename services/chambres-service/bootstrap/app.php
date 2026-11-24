<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

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
        // Toujours répondre en JSON sur /api/*
        $exceptions->shouldRenderJsonWhen(fn ($request, $e) => $request->is('api/*') || $request->expectsJson());

        $exceptions->render(function (NotFoundHttpException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['error' => 'Ressource introuvable.', 'code' => 404], 404);
            }
        });

        $exceptions->render(function (MethodNotAllowedHttpException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['error' => 'Méthode non autorisée.', 'code' => 405], 405);
            }
        });
    })
    ->create();