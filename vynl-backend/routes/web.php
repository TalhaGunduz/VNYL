<?php


use Illuminate\Support\Facades\Route;

Route::middleware('api')->prefix('api')->group(function () {
    Route::get('/test', function () {
        return ['message' => 'API çalışıyor!'];
    });
});
