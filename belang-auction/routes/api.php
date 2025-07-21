<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BidController;
use App\Http\Controllers\OfferController;
use App\Http\Controllers\AuctionController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Auth Routes - Publik
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    
    // Auth routes yang memerlukan token
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', function (Request $request) {
            return $request->user();
        });
    });
});

// Items Routes - Publik (bisa melihat barang)
Route::get('/items', [ItemController::class, 'index']);
Route::get('/items/{item}', [ItemController::class, 'show']);

// Items Routes - Terproteksi
Route::middleware('auth:sanctum')->group(function () {
    // CRUD Operations
    Route::post('/items', [ItemController::class, 'store']);
    Route::put('/items/{item}', [ItemController::class, 'update']); // Tambah update
    Route::delete('/items/{item}', [ItemController::class, 'destroy']);
    
    // Bidding Operations
    Route::post('/items/{item}/bids', [ItemController::class, 'placeBid']);
    Route::get('/items/{item}/bids', [ItemController::class, 'getBids']); // Tambah get bids
    
    // Status Operations
    Route::patch('/items/{item}/status', [ItemController::class, 'updateStatus']); // Ubah ke PATCH

    Route::middleware('auth:sanctum')->post('/profile/update', [UserController::class, 'update']);
    
    Route::middleware('auth:sanctum')->get('/offers/user', [OfferController::class, 'userOffers']);

    // routes/api.php
    Route::middleware('auth:sanctum')->get('/profile', function (Request $request) {
        return response()->json($request->user());
    });

    Route::get('/auctions', [AuctionController::class, 'index']);
    Route::post('/auctions/{id}/bid', [AuctionController::class, 'placeBid']);

    Route::get('/auctions/{id}', [AuctionController::class, 'show']);

});