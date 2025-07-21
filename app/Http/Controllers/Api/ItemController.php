<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ItemController extends Controller
{
    // Mendapatkan semua item lelang
    public function index()
    {
        // Eager load relasi untuk efisiensi, sesuai kebutuhan frontend
        $items = Item::with('bids.user', 'creator')->latest()->get();
        return response()->json($items);
    }

    // Mendapatkan detail satu item
    public function show(Item $item)
    {
        $item->load('bids.user', 'creator');
        return response()->json($item);
    }
    
    // Menambah barang baru, ini yang jadi masalah utama Anda sebelumnya
    public function store(Request $request)
    {
    $user = $request->user();

    if ($user->role !== 'administrator' && $user->role !== 'petugas') {
        return response()->json(['message' => 'Forbidden. You do not have the required permissions.'], 403);
    }

    $validatedData = $request->validate([
        'name' => 'required|string|max:255',
        'description' => 'required|string',
        'starting_price' => 'required|numeric|min:0',
        'end_date' => 'required|date|after:now',
        'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
    ]);

    $path = $request->file('image')->store('items', 'public');
    $filename = basename($path); // ✅ hanya ambil nama file-nya

    $item = Item::create([
        'name' => $validatedData['name'],
        'description' => $validatedData['description'],
        'starting_price' => $validatedData['starting_price'],
        'current_price' => $validatedData['starting_price'],
        'end_date' => $validatedData['end_date'],
        'image_url' => $filename, // ✅ bukan full URL
        'created_by' => $user->id,
    ]);

    return response()->json(['message' => 'Barang baru berhasil ditambahkan!', 'item' => $item], 201);
    }

    // Mengajukan penawaran
    public function placeBid(Request $request, Item $item)
    {
        // Validasi sesuai form bid di app.js
        $validatedData = $request->validate([
            'amount' => 'required|numeric|gt:' . $item->current_price,
        ]);

        if ($item->status !== 'open' || now()->greaterThan($item->end_date)) {
            return response()->json(['message' => 'Auction is closed.'], 400);
        }

        // Gunakan transaction untuk menjaga data tetap konsisten
        try {
            DB::beginTransaction();

            $item->bids()->create([
                'user_id' => $request->user()->id,
                'amount' => $validatedData['amount'],
            ]);

            $item->current_price = $validatedData['amount'];
            $item->save();

            DB::commit();

            return response()->json(['message' => 'Penawaran Anda berhasil diajukan!']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal mengajukan penawaran.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Menghapus item dari database.
     */
    public function destroy(Item $item, Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'administrator' && $user->role !== 'petugas') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        // Hapus file gambar dari storage sebelum menghapus data dari DB
        if ($item->image_url) {
            // Ubah URL menjadi path di storage (misal: dari /storage/items/foto.jpg menjadi items/foto.jpg)
            $path = str_replace('/storage/', '', parse_url($item->image_url, PHP_URL_PATH));
            Storage::disk('public')->delete($path);
        }

        $item->delete();

        return response()->json(['message' => 'Barang berhasil dihapus.']);
    }

    /**
     * Mengubah status lelang (open/closed).
     */
    public function updateStatus(Request $request, Item $item)
    {
        $user = $request->user();
        if ($user->role !== 'administrator' && $user->role !== 'petugas') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:open,closed',
        ]);

        $item->status = $validated['status'];
        $item->save();

        return response()->json([
            'message' => 'Status lelang berhasil diubah.',
            'item' => $item
        ]);
    }
}