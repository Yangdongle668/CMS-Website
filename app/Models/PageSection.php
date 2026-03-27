<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PageSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'page',
        'section_name',
        'title',
        'subtitle',
        'description',
        'image',
        'background_color',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    public function animationEffects()
    {
        return $this->hasMany(AnimationEffect::class, 'target_element', 'section_name');
    }
}
