@extends('layouts.app')

@section('title', 'Products - B2B Battery Solutions')
@section('description', 'Browse our complete range of professional B2B lithium batteries for AR glasses and electronic devices.')

@section('content')
<section class="py-12">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-8">
            <h1 class="text-4xl font-bold mb-4">Our Products</h1>
            <p class="text-gray-600 text-lg">Explore our comprehensive range of high-performance lithium batteries</p>
        </div>

        @if($products->count() > 0)
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                @foreach($products as $product)
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1">
                        @if($product->image)
                            <img src="{{ asset('storage/' . $product->image) }}" alt="{{ $product->name }}" class="w-full h-64 object-cover">
                        @else
                            <div class="w-full h-64 bg-gray-200 flex items-center justify-center">
                                <i class="fas fa-image text-gray-400 text-5xl"></i>
                            </div>
                        @endif

                        <div class="p-6">
                            <h3 class="text-2xl font-bold text-gray-800 mb-2">{{ $product->name }}</h3>

                            @if($product->model)
                                <p class="text-gray-500 text-sm mb-2">Model: <span class="font-semibold">{{ $product->model }}</span></p>
                            @endif

                            <p class="text-gray-600 mb-4 line-clamp-2">{{ $product->description }}</p>

                            <div class="grid grid-cols-2 gap-3 mb-4 text-sm bg-gray-50 p-3 rounded">
                                @if($product->capacity)
                                    <div>
                                        <span class="text-gray-600">Capacity</span>
                                        <p class="font-bold text-gray-800">{{ $product->capacity }} mAh</p>
                                    </div>
                                @endif
                                @if($product->voltage)
                                    <div>
                                        <span class="text-gray-600">Voltage</span>
                                        <p class="font-bold text-gray-800">{{ $product->voltage }}V</p>
                                    </div>
                                @endif
                                @if($product->size)
                                    <div>
                                        <span class="text-gray-600">Size</span>
                                        <p class="font-bold text-gray-800">{{ $product->size }}</p>
                                    </div>
                                @endif
                            </div>

                            <a href="{{ route('products.show', $product->slug) }}" class="btn-primary text-center block">
                                View Details
                            </a>
                        </div>
                    </div>
                @endforeach
            </div>

            <!-- Pagination -->
            <div class="flex justify-center">
                {{ $products->links() }}
            </div>
        @else
            <div class="text-center py-16">
                <i class="fas fa-inbox text-gray-400 text-6xl mb-4"></i>
                <p class="text-gray-600 text-xl">No products available at the moment.</p>
            </div>
        @endif
    </div>
</section>
@endsection
