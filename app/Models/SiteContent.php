<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SiteContent extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
        'description',
    ];

    public $timestamps = false;
    public const UPDATED_AT = 'updated_at';
    public const CREATED_AT = null;

    protected $casts = [
        'updated_at' => 'datetime',
    ];
}
