<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Models\Auction;
use Carbon\Carbon;

class AuctionController extends Controller
{
    // Menampilkan semua lelang, dan update status jika waktunya habis
    public function index()
    {
        $auctions = Auction::all();

        foreach ($auctions as $auction) {
            if ($auction->status !== 'tertutup' && $auction->end_time < Carbon::now()) {
                $auction->status = 'tertutup';
                $auction->save();
            }
        }

        return response()->json($auctions);
    }

    // Melakukan penawaran (bid)
    public function placeBid(Request $request, $id)
    {
        $auction = Auction::findOrFail($id);

        // Cek apakah lelang masih dibuka dan belum habis waktunya
        if ($auction->status === 'tertutup' || $auction->end_time < Carbon::now()) {
            return response()->json([
                'message' => 'Lelang sudah ditutup, tidak bisa melakukan penawaran lagi.'
            ], 403);
        }

        // TODO: Logika simpan bid di sini
        return response()->json([
            'message' => 'Bid berhasil'
        ]);
    }

    public function show($id)
    {
    $auction = Auction::with('bids')->find($id);

    if (!$auction) {
        return response()->json(['message' => 'Lelang tidak ditemukan'], 404);
    }

    return response()->json($auction);
    }

}
