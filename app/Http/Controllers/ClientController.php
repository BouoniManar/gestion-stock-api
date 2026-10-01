<?php


namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => Client::all()]);
    }

 public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'adresse' => 'nullable|string',
            'email' => 'nullable|email|max:255', // Retrait temporaire ou définitif de 'unique:CLIENTS,email'
            'telephone' => 'nullable|string|max:50',
        ]);

        $client = Client::create($validated);
        return response()->json(['success' => true, 'message' => 'Client créé avec succès', 'data' => $client], 201);
    }

    public function show($id)
    {
        $client = Client::findOrFail($id);
        return response()->json(['success' => true, 'data' => $client]);
    }

    public function destroy($id)
    {
        Client::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Client supprimé avec succès']);
    }
}