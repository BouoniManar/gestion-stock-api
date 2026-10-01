<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $table = 'CLIENTS';
    protected $primaryKey = 'id_client';
    
    // Désactiver l'auto-incrémentation native si Oracle utilise une séquence/trigger, 
    // ou s'assurer que Laravel sait que c'est un entier incrémenté :
    public $incrementing = true;
    protected $keyType = 'int';

    // Ajoute ceci pour empêcher Laravel de chercher à faire un "RETURNING ID_CLIENT" qui plante sur certains drivers Oracle :
    // (Selon la version du driver oci8, parfois il faut laisser Eloquent gérer l'insertion sans clause returning)
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'nom',
        'adresse',
        'email',
        'telephone',
    ];
}