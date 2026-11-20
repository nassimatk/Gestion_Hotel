<?php

namespace App\Services;

use DateTimeImmutable;
use InvalidArgumentException;

class CalculPrixService
{
    /** Nombre de nuits entre l'arrivée et le départ. */
    public function nombreNuits(string $arrivee, string $depart): int
    {
        $a = new DateTimeImmutable($arrivee);
        $d = new DateTimeImmutable($depart);

        if ($d <= $a) {
            throw new InvalidArgumentException("La date de départ doit être postérieure à la date d'arrivée");
        }

        return (int) $a->diff($d)->days;
    }

    /**
     * Prix d'une nuit : tarif de la saison qui couvre la date, sinon tarif standard.
     * $saisons : [['date_debut' => 'Y-m-d', 'date_fin' => 'Y-m-d', 'prix_nuit' => float], ...]
     */
    public function prixNuit(string $date, float $prixStandard, array $saisons = []): float
    {
        foreach ($saisons as $s) {
            if ($date >= $s['date_debut'] && $date <= $s['date_fin']) {
                return (float) $s['prix_nuit'];
            }
        }

        return $prixStandard;
    }

    /**
     * Applique une promotion au montant.
     * $promotion : ['type_reduction' => 'POURCENTAGE'|'MONTANT_FIXE', 'valeur' => float, 'nuits_min' => int]
     */
    public function appliquerPromotion(float $montant, array $promotion, int $nbNuits): float
    {
        $type = $promotion['type_reduction'] ?? null;
        $valeur = (float) ($promotion['valeur'] ?? 0);
        $nuitsMin = (int) ($promotion['nuits_min'] ?? 1);

        if ($type === 'POURCENTAGE') {
            if ($valeur <= 0 || $valeur >= 100) {
                throw new InvalidArgumentException('Le pourcentage doit être compris entre 0 et 100 exclus');
            }
        } elseif ($type === 'MONTANT_FIXE') {
            if ($valeur <= 0) {
                throw new InvalidArgumentException('Le montant fixe doit être strictement positif');
            }
        } else {
            throw new InvalidArgumentException('Type de réduction inconnu');
        }

        if ($nbNuits < $nuitsMin) {
            return round($montant, 2);
        }

        $reduction = $type === 'POURCENTAGE' ? $montant * $valeur / 100 : $valeur;

        return round(max(0.0, $montant - $reduction), 2);
    }

    /** Calcul complet d'un séjour, nuit par nuit. */
    public function calculerSejour(
        string $arrivee,
        string $depart,
        float $prixStandard,
        array $saisons = [],
        ?array $promotion = null
    ): array {
        $nbNuits = $this->nombreNuits($arrivee, $depart);
        $debut = new DateTimeImmutable($arrivee);

        $sousTotal = 0.0;
        for ($i = 0; $i < $nbNuits; $i++) {
            $date = $debut->modify("+{$i} day")->format('Y-m-d');
            $sousTotal += $this->prixNuit($date, $prixStandard, $saisons);
        }

        $total = $promotion ? $this->appliquerPromotion($sousTotal, $promotion, $nbNuits) : $sousTotal;

        return [
            'nb_nuits'   => $nbNuits,
            'sous_total' => round($sousTotal, 2),
            'prix_total' => round($total, 2),
        ];
    }
}