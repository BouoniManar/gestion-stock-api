<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\ProduitController;


use App\Http\Controllers\ClientController;
use App\Http\Controllers\StockMouvementController;
use App\Http\Controllers\FactureController;




// Routes Produits
Route::get('/produits', [ProduitController::class, 'index']);
Route::post('/produits', [ProduitController::class, 'store']);

// Routes Clients
Route::get('/clients', [ClientController::class, 'index']);
Route::post('/clients', [ClientController::class, 'store']);
Route::get('/clients/{id}', [ClientController::class, 'show']);
Route::delete('/clients/{id}', [ClientController::class, 'destroy']);

// Routes Mouvements de stock
Route::get('/stock', [StockMouvementController::class, 'index']);
Route::post('/stock', [StockMouvementController::class, 'store']);

// Routes Factures
Route::get('/factures', [FactureController::class, 'index']);
Route::post('/factures', [FactureController::class, 'store']);