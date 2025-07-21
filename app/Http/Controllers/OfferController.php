<?php

namespace App\Http\Controllers;

use App\Models\Bid; // Pastikan Anda menggunakan model yang benar (Bid atau Offer)
use Illuminate\Http\Request;
use Carbon\Carbon;

class OfferController extends Controller
{
    public function userOffers(Request $request)
    {
        $user = $request->user();

        // Gunakan model Bid atau Offer sesuai dengan proyek Anda
        // Saya akan menggunakan 'Bid' sebagai contoh yang lebih umum
        $userBids = Bid::where('user_id', $user->id)
                        ->with('item') // Eager load relasi ke item
                        ->orderBy('created_at', 'desc')
                        ->get();

        // Proses setiap penawaran untuk menambahkan status
        $processedBids = $userBids->map(function ($bid) {
            // Dapatkan penawaran tertinggi untuk item ini
            $highestBid = Bid::where('item_id', $bid->item_id)->orderBy('amount', 'desc')->first();

            $status = 'Kalah'; // Default status

            if ($highestBid && $bid->id === $highestBid->id) {
                // Jika bid ini adalah yang tertinggi
                if (Carbon::now()->gt($bid->item->end_date)) {
                    // dan lelang sudah berakhir
                    $status = 'Menang';
                } else {
                    // dan lelang masih berjalan
                    $status = 'Memimpin';
                }
            }

            // Gabungkan data yang dibutuhkan
            return [
                'id' => $bid->id,
                'amount' => $bid->amount,
                'created_at' => $bid->created_at->toDateTimeString(),
                'item' => $bid->item, // Kirim seluruh objek item
                'status' => $status
            ];
        });

        return response()->json($processedBids);
    }
}