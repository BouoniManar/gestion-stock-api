<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMouvement extends Model
{
    use HasFactory;

    protected $connection = 'oracle';
    protected $table = 'STOCK_MOUVEMENTS';
    protected $primaryKey = 'id_mouvement';
    public $timestamps = false;

    protected $fillable = [
        'id_produit',
        'type', // 'ENTREE' ou 'SORTIE'
        'quantite',
        'date_mouvement',
    ];

    public function produit()
    {
        return $this->belongsTo(Produit::class, 'id_produit', 'id_produit');
    }
}