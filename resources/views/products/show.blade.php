@extends('layouts.app')

@section('title', $product->meta_title ?? $product->name)
@section('description', $product->meta_description ?? $product->description)

@section('schema')
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{{ $product->name }}",
  "description": "{{ $product->description }}",
  @if($product->image)
  "image": "{{ url('storage/' . $product->image) }}",
  @endif
  "brand": {
    "@type": "Brand",
    "name": "Raven Battery"
  },
  @if($product->model)
  "model": "{{ $product->model }}",
  @endif
  "sku": "{{ $product->slug }}"
}
</script>
@endsection

@section('content')
<section class="py-12">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Breadcrumb -->
        <nav class="flex mb-8" aria-label="Breadcrumb">
            <ol class="inline-flex items-center space-x-1 md:space-x-3">
                <li class="inline-flex items-center">
                    <a href="/" class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                        <i class="fas fa-home mr-2"></i> Home
                    </a>
                </li>
                <li>
                    <div class="flex items-center">
                        <i class="fas fa-chevron-right text-gray-400 mx-2"></i>
                        <a href="/products" class="text-sm font-medium text-gray-700 hover:text-blue-600">Products</a>
                    </div>
                </li>
                <li>
                    <div class="flex items-center">
                        <i class="fas fa-chevron-right text-gray-400 mx-2"></i>
                        <span class="text-sm font-medium text-gray-500">{{ $product->name }}</span>
                    </div>
                </li>
            </ol>
        </nav>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <!-- Product Image -->
            <div>
                @if($product->image)
                    <img src="{{ asset('storage/' . $product->image) }}" alt="{{ $product->name }}" class="w-full rounded-lg shadow-lg">
                @else
                    <div class="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                        <i class="fas fa-image text-gray-400 text-8xl"></i>
                    </div>
                @endif
            </div>

            <!-- Product Details -->
            <div>
                <h1 class="text-4xl font-bold text-gray-800 mb-2">{{ $product->name }}</h1>

                @if($product->model)
                    <p class="text-gray-500 text-lg mb-4">Model: <span class="font-semibold text-gray-700">{{ $product->model }}</span></p>
                @endif

                <p class="text-gray-600 mb-6 leading-relaxed">{{ $product->description }}</p>

                <!-- Specifications Table -->
                <div class="bg-gray-50 rounded-lg p-6 mb-8">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">Specifications</h3>
                    <div class="space-y-4">
                        @if($product->capacity)
                            <div class="flex justify-between border-b border-gray-200 pb-3">
                                <span class="text-gray-600 font-semibold">Capacity</span>
                                <span class="text-gray-800">{{ $product->capacity }} mAh</span>
                            </div>
                        @endif

                        @if($product->voltage)
                            <div class="flex justify-between border-b border-gray-200 pb-3">
                                <span class="text-gray-600 font-semibold">Voltage</span>
                                <span class="text-gray-800">{{ $product->voltage }} V</span>
                            </div>
                        @endif

                        @if($product->size)
                            <div class="flex justify-between">
                                <span class="text-gray-600 font-semibold">Size</span>
                                <span class="text-gray-800">{{ $product->size }}</span>
                            </div>
                        @endif
                    </div>
                </div>

                <!-- CTA Button -->
                <a href="{{ route('inquiries.create', ['product_id' => $product->id]) }}" class="btn-primary w-full text-center">
                    <i class="fas fa-envelope mr-2"></i> Request Quote
                </a>

                <button onclick="shareProduct()" class="w-full mt-3 btn-secondary">
                    <i class="fas fa-share-alt mr-2"></i> Share Product
                </button>
            </div>
        </div>

        <!-- Related Products -->
        @if($relatedProducts->count() > 0)
            <section class="mb-12">
                <h2 class="text-3xl font-bold text-gray-800 mb-8">Related Products</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    @foreach($relatedProducts as $related)
                        <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                            @if($related->image)
                                <img src="{{ asset('storage/' . $related->image) }}" alt="{{ $related->name }}" class="w-full h-48 object-cover">
                            @else
                                <div class="w-full h-48 bg-gray-200 flex items-center justify-center">
                                    <i class="fas fa-image text-gray-400 text-4xl"></i>
                                </div>
                            @endif

                            <div class="p-6">
                                <h3 class="text-lg font-bold text-gray-800 mb-2">{{ $related->name }}</h3>
                                <p class="text-gray-600 text-sm mb-4">{{ Str::limit($related->description, 80) }}</p>

                                <a href="{{ route('products.show', $related->slug) }}" class="btn-primary text-sm">
                                    View Details
                                </a>
                            </div>
                        </div>
                    @endforeach
                </div>
            </section>
        @endif
    </div>
</section>

<script>
function shareProduct() {
    if (navigator.share) {
        navigator.share({
            title: '{{ $product->name }}',
            text: '{{ $product->description }}',
            url: window.location.href,
        });
    } else {
        alert('Share functionality not supported in your browser');
    }
}
</script>
@endsection
