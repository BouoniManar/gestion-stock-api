<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    use HasFactory;

    protected $connection = 'oracle';
    protected $table = 'FACTURES';
    protected $primaryKey = 'id_facture';
    public $timestamps = false;

    protected $fillable = [
        'id_client',
        'date_facture',
        'statut',
        'montant_total',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'id_client', 'id_client');
    }

    public function lignes()
    {
        return $this->hasMany(FactureLigne::class, 'id_facture', 'id_facture');
    }
}