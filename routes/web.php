<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\SolutionController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $products = \App\Models\Product::limit(6)->get();
    return view('home', compact('products'));
});

Route::get('/products', [ProductController::class, 'index'])->name('products.index');
Route::get('/products/compare', function () {
    $allProducts = \App\Models\Product::all();
    return view('products.compare', compact('allProducts'));
})->name('products.compare');
Route::get('/products/{slug}', [ProductController::class, 'show'])->name('products.show');

Route::get('/contact', [InquiryController::class, 'create'])->name('inquiries.create');
Route::post('/inquiries', [InquiryController::class, 'store'])->name('inquiries.store');

Route::get('/about', function () {
    return view('about');
});

Route::prefix('/solutions')->group(function () {
    Route::get('/', [SolutionController::class, 'index'])->name('solutions.index');
    Route::get('/wound-cell', [SolutionController::class, 'woundCell'])->name('solutions.wound-cell');
    Route::get('/stacked-cell', [SolutionController::class, 'stackedCell'])->name('solutions.stacked-cell');
    Route::get('/wearables', [SolutionController::class, 'wearables'])->name('solutions.wearables');
    Route::get('/medical', [SolutionController::class, 'medical'])->name('solutions.medical');
    Route::get('/iot', [SolutionController::class, 'iot'])->name('solutions.iot');
});

Route::get('/privacy', function () {
    return view('privacy');
});

Route::get('/cookies', function () {
    return view('cookies');
});
