<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class BidController extends Controller
{
    public function userOffers(Request $request)
{
    $user = $request->user();

    $offers = \App\Models\Bid::with('item')
        ->where('user_id', $user->id)
        ->latest()
        ->get()
        ->map(function ($bid) {
            return [
                'item_name' => $bid->item->name,
                'amount' => $bid->amount,
                'created_at' => $bid->created_at,
                'is_winner' => $bid->item->winner_bid_id === $bid->id,
            ];
        });

    return response()->json($offers);
}

}
