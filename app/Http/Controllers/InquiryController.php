<?php

namespace App\Http\Controllers;

use App\Models\Inquiry;
use App\Models\Product;
use Illuminate\Http\Request;

class InquiryController extends Controller
{
    public function create($productId = null)
    {
        $product = null;
        if ($productId) {
            $product = Product::findOrFail($productId);
        }
        $products = Product::all();
        return view('inquiries.create', compact('product', 'products'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'message' => 'required|string',
            'product_id' => 'nullable|exists:products,id',
        ]);

        Inquiry::create($validated);

        return redirect()->back()->with('success', 'Thank you for your inquiry! We will contact you soon.');
    }
}
