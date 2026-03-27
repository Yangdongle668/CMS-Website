<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'model',
        'capacity',
        'voltage',
        'size',
        'description',
        'image',
        'slug',
        'meta_title',
        'meta_description',
    ];

    public function inquiries()
    {
        return $this->hasMany(Inquiry::class);
    }
}
