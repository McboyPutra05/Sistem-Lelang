<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bid extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'user_id',
        'amount',
    ];

    // Relasi: Penawaran ini milik satu item
    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    // Relasi: Penawaran ini milik satu user
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}