<?php

use App\Http\Controllers\Api\SocketAuthController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/socket/token', [SocketAuthController::class, 'token'])->name('api.socket.token');
});

Route::post('/socket/auth', [SocketAuthController::class, 'auth'])->name('api.socket.auth');
