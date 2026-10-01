<?php

namespace App\Http\Controllers;


use App\Models\Facture;
use App\Models\FactureLigne;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FactureController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => Facture::with(['client', 'lignes.produit'])->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_client' => 'required|exists:CLIENTS,id_client',
            'date_facture' => 'required|date',
            'statut' => 'required|string|max:50',
            'lignes' => 'required|array|min:1',
            'lignes.*.id_produit' => 'required|exists:PRODUITS,id_produit',
            'lignes.*.quantite' => 'required|integer|min:1',
            'lignes.*.prix_unitaire' => 'required|numeric',
        ]);

        // Utilisation d'une transaction pour garantir l'intégrité (En-tête + Lignes)
        $montantTotal = 0;
        foreach ($validated['lignes'] as $ligne) {
            $montantTotal += $ligne['quantite'] * $ligne['prix_unitaire'];
        }

        $facture = Facture::create([
            'id_client' => $validated['id_client'],
            'date_facture' => $validated['date_facture'],
            'statut' => $validated['statut'],
            'montant_total' => $montantTotal,
        ]);

        foreach ($validated['lignes'] as $ligne) {
            FactureLigne::create([
                'id_facture' => $facture->id_facture,
                'id_produit' => $ligne['id_produit'],
                'quantite' => $ligne['quantite'],
                'prix_unitaire' => $ligne['prix_unitaire'],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Facture générée avec succès !',
            'data' => $facture->load('lignes')
        ], 201);
    }
}