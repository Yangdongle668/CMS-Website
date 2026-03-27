<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnimationEffect extends Model
{
    use HasFactory;

    protected $fillable = [
        'target_element',
        'effect_type',
        'duration',
        'delay',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'duration' => 'integer',
        'delay' => 'integer',
    ];

    public const ANIMATION_TYPES = [
        'fadeIn' => 'Fade In',
        'slideInUp' => 'Slide In Up',
        'slideInDown' => 'Slide In Down',
        'slideInLeft' => 'Slide In Left',
        'slideInRight' => 'Slide In Right',
        'scaleIn' => 'Scale In',
        'pulse' => 'Pulse',
        'bounce' => 'Bounce',
        'glow' => 'Glow',
    ];
}
