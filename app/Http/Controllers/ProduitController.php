<?php

namespace App\Http\Controllers;

use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProduitController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => Produit::all()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'reference' => 'required|string|max:100|unique:PRODUITS,reference',
            'designation' => 'required|string|max:255',
            'prix_unitaire' => 'required|numeric|min:0',
            'seuil_alerte' => 'nullable|integer|min:0',
        ]);

        $produit = Produit::create($validated);
        return response()->json(['success' => true, 'message' => 'Produit créé avec succès !', 'data' => $produit], 201);
    }

    public function update(Request $request, $id)
    {
        $produit = Produit::findOrFail($id);

        $validated = $request->validate([
            'reference' => ['required', 'string', 'max:100',
                Rule::unique('PRODUITS', 'reference')->ignore($produit->getKey(), $produit->getKeyName())],
            'designation' => 'required|string|max:255',
            'prix_unitaire' => 'required|numeric|min:0',
            'seuil_alerte' => 'nullable|integer|min:0',
        ]);

        $produit->update($validated);
        return response()->json(['success' => true, 'message' => 'Produit modifié avec succès !', 'data' => $produit]);
    }

    public function destroy($id)
    {
        Produit::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Produit supprimé avec succès']);
    }
}

/*
 |--------------------------------------------------------------------
 | routes/api.php  (les routes vont ICI, jamais dans le contrôleur)
 |--------------------------------------------------------------------
 | Route::get('/produits', [ProduitController::class, 'index']);
 | Route::post('/produits', [ProduitController::class, 'store']);
 | Route::put('/produits/{id}', [ProduitController::class, 'update']);
 | Route::delete('/produits/{id}', [ProduitController::class, 'destroy']);
 |
 | Modèle Produit : protected $fillable = ['reference','designation','prix_unitaire','seuil_alerte'];
 */