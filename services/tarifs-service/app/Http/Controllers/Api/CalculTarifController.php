<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\VerifieChambre;
use App\Http\Controllers\Controller;
use App\Models\Promotion;
use App\Models\Tarif;
use App\Services\CalculPrixService;
use App\Services\ChambreClientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CalculTarifController extends Controller
{
    use VerifieChambre;

    public function __construct(
        protected CalculPrixService $calculPrixService
    ) {}

    /**
     * GET /api/tarifs/calcul?chambre_id=1&arrivee=2026-07-10&depart=2026-07-15
     * Vérifie la chambre dans le service Chambres, puis calcule le prix à partir
     * des tarifs, saisons et promotions enregistrés.
     */
    public function calculerDepuisBase(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'chambre_id' => 'required|integer|min:1',
            'arrivee' => 'required|date',
            'depart' => 'required|date|after:arrivee',
        ]);

        $chambreId = (int) $validated['chambre_id'];
        $arrivee = $validated['arrivee'];
        $depart = $validated['depart'];

        // 0. Recherche réelle de la chambre dans le service Chambres
        if ($erreur = $this->erreurChambre($chambreId)) {
            return $erreur;
        }

  
     // 1. Tarif standard actif de la chambre (ou prix de base de la chambre)
        $tarifStandard = Tarif::where('chambre_id', $chambreId)
            ->whereNull('saison_id')
            ->where('statut', 'active')
            ->first();

        $prixStandard = $tarifStandard
            ? (float) $tarifStandard->prix_nuit
            : (float) ($this->chambreTrouvee['prix_nuit'] ?? 0);

        if ($prixStandard <= 0) {
            return response()->json([
                'success' => false,
                'error' => 'Aucun tarif standard actif trouvé pour cette chambre.',
            ], 404);
        }

        // 2. Tarifs saisonniers actifs de la chambre
        $tarifsSaisonniers = Tarif::with('saison')
            ->where('chambre_id', $chambreId)
            ->whereNotNull('saison_id')
            ->where('statut', 'active')
            ->get();

        $saisons = $tarifsSaisonniers
            ->filter(fn (Tarif $t) => $t->saison !== null)
            ->map(fn (Tarif $t) => [
                'date_debut' => $t->saison->date_debut->format('Y-m-d'),
                'date_fin' => $t->saison->date_fin->format('Y-m-d'),
                'prix_nuit' => (float) $t->prix_nuit,
            ])
            ->values()
            ->all();

        // 3. Promotion active applicable (propre à la chambre ou globale)
        $nbNuits = $this->calculPrixService->nombreNuits($arrivee, $depart);

        $promoModel = Promotion::where('statut', 'active')
            ->whereDate('date_debut', '<=', $arrivee)
            ->whereDate('date_fin', '>=', $arrivee)
            ->where('nuits_min', '<=', $nbNuits)
            ->where(function ($q) use ($chambreId) {
                $q->where('chambre_id', $chambreId)->orWhereNull('chambre_id');
            })
            ->orderByRaw('CASE WHEN chambre_id IS NOT NULL THEN 0 ELSE 1 END')
            ->orderByDesc('valeur')
            ->first();

        $promotion = $promoModel ? [
            'type_reduction' => $promoModel->type_reduction,
            'valeur' => (float) $promoModel->valeur,
            'nuits_min' => (int) $promoModel->nuits_min,
        ] : null;

        try {
            $resultat = $this->calculPrixService->calculerSejour(
                $arrivee,
                $depart,
                $prixStandard,
                $saisons,
                $promotion
            );

            return response()->json([
                'success' => true,
                'data' => array_merge($resultat, [
                    'chambre_id' => $chambreId,
                    'chambre' => $this->chambreTrouvee
                        ? ['id' => $chambreId, 'nom' => ChambreClientService::nom($this->chambreTrouvee)]
                        : null,
                    'devise' => $tarifStandard?->devise ?? ($this->chambreTrouvee['devise'] ?? 'MAD'),
                    'promotion_appliquee' => $promoModel?->libelle,
                ]),
            ], 200);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * POST /api/tarifs/calcul (simulation directe avec paramètres fournis)
     */
    public function calculer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'arrivee' => 'required|date',
            'depart' => 'required|date|after:arrivee',
            'prix_standard' => 'required|numeric|min:0',
            'saisons' => 'array',
            'promotion' => 'nullable|array',
        ]);

        try {
            $resultat = $this->calculPrixService->calculerSejour(
                $validated['arrivee'],
                $validated['depart'],
                $validated['prix_standard'],
                $validated['saisons'] ?? [],
                $validated['promotion'] ?? null
            );

            return response()->json(['success' => true, 'data' => $resultat], 200);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }
}