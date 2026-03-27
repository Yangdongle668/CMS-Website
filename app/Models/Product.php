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
        'process_type',
        'capacity_min',
        'capacity_max',
        'internal_resistance',
        'cycle_life',
        'energy_density',
        'applications',
        'certifications',
        'customization_info',
        'highlights',
        'operating_temperature',
        'weight',
    ];

    public function inquiries()
    {
        return $this->hasMany(Inquiry::class);
    }
}
