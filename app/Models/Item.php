<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'starting_price',
        'current_price',
        'image_url',
        'end_date',
        'status',
        'created_by',
    ];

    // Relasi: Item dimiliki oleh satu user (petugas/admin)
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Relasi: Item memiliki banyak penawaran
    public function bids()
    {
        return $this->hasMany(Bid::class)->orderBy('amount', 'desc');
    }

    public function winnerBid()
    {
        return $this->belongsTo(Bid::class, 'winner_bid_id');
    }

    public function show($id)
    {
    $item = Item::find($id); // atau Auction::find($id) kalau kamu punya model Auction

    if (!$item) {
        return response()->json(['message' => 'Lelang tidak ditemukan'], 404);
    }

    return response()->json($item);
    }

}