@extends('layouts.app')

@section('title', 'Home - B2B Battery Solutions')
@section('description', 'Professional B2B battery solutions for AR glasses and electronic devices. Explore our high-quality lithium batteries.')

@section('schema')
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Raven Battery",
  "url": "{{ url('/') }}",
  "logo": "{{ url('/logo.png') }}",
  "description": "Professional B2B battery solutions",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-123-4567",
    "contactType": "Sales"
  }
}
</script>
@endsection

@section('content')
<!-- Hero Section -->
<section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
            <h1 class="text-5xl font-bold mb-4">B2B Battery Solutions</h1>
            <p class="text-xl text-blue-100 mb-8">High-quality lithium batteries for AR glasses and electronic devices</p>
            <a href="/products" class="btn-primary text-white">Explore Products</a>
        </div>
    </div>
</section>

<!-- Featured Products Section -->
<section class="py-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-4xl font-bold text-center mb-12">Featured Products</h2>

        @if($products->count() > 0)
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                @foreach($products as $product)
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                        @if($product->image)
                            <img src="{{ asset('storage/' . $product->image) }}" alt="{{ $product->name }}" class="w-full h-48 object-cover">
                        @else
                            <div class="w-full h-48 bg-gray-200 flex items-center justify-center">
                                <i class="fas fa-image text-gray-400 text-4xl"></i>
                            </div>
                        @endif

                        <div class="p-6">
                            <h3 class="text-xl font-bold text-gray-800 mb-2">{{ $product->name }}</h3>
                            <p class="text-gray-600 text-sm mb-4">{{ Str::limit($product->description, 100) }}</p>

                            <div class="grid grid-cols-2 gap-2 mb-4 text-sm">
                                @if($product->capacity)
                                    <div><span class="font-semibold">Capacity:</span> {{ $product->capacity }} mAh</div>
                                @endif
                                @if($product->voltage)
                                    <div><span class="font-semibold">Voltage:</span> {{ $product->voltage }}V</div>
                                @endif
                            </div>

                            <a href="{{ route('products.show', $product->slug) }}" class="btn-primary text-sm">View Details</a>
                        </div>
                    </div>
                @endforeach
            </div>

            <div class="text-center mt-12">
                <a href="/products" class="btn-secondary">View All Products</a>
            </div>
        @else
            <div class="text-center py-12">
                <p class="text-gray-600 text-lg">No products available yet.</p>
            </div>
        @endif
    </div>
</section>

<!-- About Section -->
<section class="bg-gray-100 py-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-4xl font-bold text-center mb-12">Why Choose Us</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="text-center">
                <i class="fas fa-bolt text-blue-600 text-5xl mb-4"></i>
                <h3 class="text-xl font-bold mb-2">High Performance</h3>
                <p class="text-gray-600">Industry-leading capacity and voltage ratings for optimal device performance.</p>
            </div>
            <div class="text-center">
                <i class="fas fa-shield-alt text-blue-600 text-5xl mb-4"></i>
                <h3 class="text-xl font-bold mb-2">Safety First</h3>
                <p class="text-gray-600">Certified and tested batteries with comprehensive safety mechanisms.</p>
            </div>
            <div class="text-center">
                <i class="fas fa-shipping-fast text-blue-600 text-5xl mb-4"></i>
                <h3 class="text-xl font-bold mb-2">Fast Delivery</h3>
                <p class="text-gray-600">Reliable B2B logistics with competitive pricing and bulk order support.</p>
            </div>
        </div>
    </div>
</section>

<!-- CTA Section -->
<section class="bg-blue-600 text-white py-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-4xl font-bold mb-4">Ready to Partner With Us?</h2>
        <p class="text-xl text-blue-100 mb-8">Contact our sales team for bulk orders and custom solutions.</p>
        <a href="/contact" class="btn-primary">Send Inquiry</a>
    </div>
</section>
@endsection
