<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inquiry extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'message',
        'product_id',
        'status',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
