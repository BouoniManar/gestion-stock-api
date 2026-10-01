<?php

namespace App\Http\Controllers;

use App\Models\StockMouvement;
use Illuminate\Http\Request;

class StockMouvementController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => StockMouvement::with('produit')->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_produit' => 'required|exists:PRODUITS,id_produit',
            'type' => 'required|in:ENTREE,SORTIE',
            'quantite' => 'required|integer|min:1',
            'date_mouvement' => 'required|date',
        ]);

        $mouvement = StockMouvement::create($validated);
        return response()->json(['success' => true, 'message' => 'Mouvement de stock enregistré', 'data' => $mouvement], 201);
    }
}