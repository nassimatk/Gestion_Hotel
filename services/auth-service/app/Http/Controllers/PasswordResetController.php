<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\User;

class PasswordResetController extends Controller
{
    /**
     * POST /api/forgot-password
     *
     * Génère un token de réinitialisation valable 1 heure.
     * En dev : retourne le token dans la réponse (à remplacer par email en prod).
     * En prod : envoyer le token par email et ne pas l'exposer dans la réponse.
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error'  => 'Email invalide',
                'code'   => 422,
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        // Sécurité : même réponse que l'email existe ou non (évite l'énumération)
        if (!$user) {
            return response()->json([
                'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.',
            ], 200);
        }

        // Supprimer les anciens tokens pour cet email
        DB::table('password_resets')->where('email', $request->email)->delete();

        // Générer un token unique de 64 caractères
        $token = Str::random(64);
        $expiresAt = now()->addHour();

        DB::table('password_resets')->insert([
            'email'      => $request->email,
            'token'      => $token,
            'expires_at' => $expiresAt,
            'created_at' => now(),
        ]);

        // TODO (production) : envoyer le token par email
        // Mail::to($request->email)->send(new PasswordResetMail($token));

        // En mode développement : retourner le token directement pour les tests
        $response = [
            'message'    => 'Si cet email existe, un lien de réinitialisation a été envoyé.',
        ];

        if (config('app.env') === 'local' || config('app.env') === 'testing') {
            $response['reset_token'] = $token;
            $response['expires_at']  = $expiresAt->toISOString();
            $response['note']        = 'Token exposé uniquement en mode développement (APP_ENV=local)';
        }

        return response()->json($response, 200);
    }

    /**
     * POST /api/reset-password
     *
     * Valide le token et met à jour le mot de passe.
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token'                 => 'required|string|size:64',
            'password'              => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error'   => 'Données invalides',
                'code'    => 422,
                'details' => $validator->errors(),
            ], 422);
        }

        // Chercher le token en base
        $resetRecord = DB::table('password_resets')
            ->where('token', $request->token)
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'error' => 'Token invalide ou déjà utilisé',
                'code'  => 400,
            ], 400);
        }

        // Vérifier l'expiration (1 heure)
        if (now()->isAfter($resetRecord->expires_at)) {
            DB::table('password_resets')->where('token', $request->token)->delete();

            return response()->json([
                'error' => 'Token expiré. Veuillez refaire une demande de réinitialisation.',
                'code'  => 400,
            ], 400);
        }

        // Trouver l'utilisateur et mettre à jour le mot de passe
        $user = User::where('email', $resetRecord->email)->first();

        if (!$user) {
            return response()->json([
                'error' => 'Utilisateur introuvable',
                'code'  => 404,
            ], 404);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Supprimer le token après utilisation (usage unique)
        DB::table('password_resets')->where('token', $request->token)->delete();

        return response()->json([
            'message' => 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
        ], 200);
    }

    /**
     * GET /api/reset-password/validate/{token}
     *
     * Vérifie si un token est valide sans le consommer.
     * Utilisé par le frontend pour valider le token avant d'afficher le formulaire.
     */
    public function validateToken(string $token)
    {
        $resetRecord = DB::table('password_resets')
            ->where('token', $token)
            ->first();

        if (!$resetRecord || now()->isAfter($resetRecord->expires_at)) {
            return response()->json([
                'valid' => false,
                'error' => 'Token invalide ou expiré',
                'code'  => 400,
            ], 400);
        }

        return response()->json([
            'valid'      => true,
            'expires_at' => $resetRecord->expires_at,
        ], 200);
    }

    /**
     * POST /api/change-password-direct
     *
     * Modifie directement le mot de passe en vérifiant le mot de passe actuel.
     * Accessible publiquement via validation de l'ancien mot de passe.
     */
    public function changePasswordDirect(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password'      => 'required|string',
            'new_password'          => 'required|string|min:8|confirmed',
            'new_password_confirmation' => 'required|string',
            'email'                 => 'nullable|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error'   => 'Données invalides',
                'code'    => 422,
                'details' => $validator->errors(),
            ], 422);
        }

        // Si l'utilisateur a fourni un email, ou prend le premier utilisateur correspondant au mot de passe
        $query = User::query();
        if ($request->filled('email')) {
            $query->where('email', $request->email);
        }

        $users = $query->get();
        $targetUser = null;

        foreach ($users as $u) {
            if (Hash::check($request->current_password, $u->password)) {
                $targetUser = $u;
                break;
            }
        }

        if (!$targetUser) {
            return response()->json([
                'error' => 'Le mot de passe actuel est incorrect.',
                'code'  => 401,
            ], 401);
        }

        $targetUser->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'message' => 'Mot de passe mis à jour avec succès.',
            'user'    => [
                'id'    => $targetUser->id,
                'email' => $targetUser->email,
            ]
        ], 200);
    }
}
