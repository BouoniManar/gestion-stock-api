<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Produit extends Model
{
    use HasFactory;

    // Préciser la connexion Oracle
    protected $connection = 'oracle';

    // Nom exact de la table dans Oracle
    protected $table = 'PRODUITS';

    // Clé primaire personnalisée
    protected $primaryKey = 'id_produit';

    // Désactiver les timestamps auto si tes tables n'ont pas created_at / updated_at
    public $timestamps = false;

    // Les champs remplissables (Mass Assignment)
    protected $fillable = [
        'reference',
        'designation',
        'prix_unitaire',
        'seuil_alerte',
    ];
}