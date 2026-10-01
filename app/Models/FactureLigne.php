<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FactureLigne extends Model
{
    use HasFactory;

    protected $connection = 'oracle';
    protected $table = 'FACTURE_LIGNES';
    protected $primaryKey = 'id_ligne';
    public $timestamps = false;

    protected $fillable = [
        'id_facture',
        'id_produit',
        'quantite',
        'prix_unitaire',
    ];

    public function facture()
    {
        return $this->belongsTo(Facture::class, 'id_facture', 'id_facture');
    }

    public function produit()
    {
        return $this->belongsTo(Produit::class, 'id_produit', 'id_produit');
    }
}