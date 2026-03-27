@extends('layouts.app')

@section('title', 'Polymer Lithium Batteries - ZUFEK Battery Manufacturer')
@section('description', 'Browse ZUFEK complete product line: wound cell batteries, stacked cell batteries, and custom-shaped batteries. Battery solutions for wearables and medical devices.')

@section('content')
<!-- Hero Section -->
<section class="bg-gradient-to-r from-cyan-600 to-blue-700 text-white py-12">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-4xl md:text-5xl font-bold mb-4 animate-slideInDown">Polymer Lithium Battery Products</h1>
        <p class="text-xl text-cyan-100 max-w-2xl animate-slideInUp" style="animation-delay: 0.2s;">
            Wound cell, stacked cell, and custom-shaped batteries — professional solutions for wearables and medical devices
        </p>
    </div>
</section>

<section class="py-12 bg-white">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Filters Section -->
        <div class="mb-12" data-aos="fade-in">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">Filter Products</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Process Type Filter -->
                <div class="group">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Process Type</label>
                    <select id="processFilter" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all hover:border-cyan-400">
                        <option value="">All Types</option>
                        <option value="wound">Wound Cell</option>
                        <option value="stacked">Stacked Cell</option>
                    </select>
                </div>

                <!-- Application Filter -->
                <div class="group">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Application</label>
                    <select id="applicationFilter" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all hover:border-cyan-400">
                        <option value="">All Applications</option>
                        <option value="wearable">Wearables</option>
                        <option value="medical">Medical Devices</option>
                    </select>
                </div>

                <!-- Capacity Filter -->
                <div class="group">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Capacity Range</label>
                    <select id="capacityFilter" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all hover:border-cyan-400">
                        <option value="">All Capacities</option>
                        <option value="300-600">300-600 mAh</option>
                        <option value="600-1000">600-1000 mAh</option>
                        <option value="1000-2000">1000-2000 mAh</option>
                        <option value="2000+">2000+ mAh</option>
                    </select>
                </div>

                <!-- Sort Filter -->
                <div class="group">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                    <select id="sortFilter" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all hover:border-cyan-400">
                        <option value="default">Default</option>
                        <option value="capacity-asc">Capacity: Low to High</option>
                        <option value="capacity-desc">Capacity: High to Low</option>
                        <option value="resistance-asc">Resistance: Low to High</option>
                    </select>
                </div>
            </div>

            <div class="mt-4">
                <button id="resetFilters" class="text-cyan-600 hover:text-cyan-800 font-semibold text-sm transition-colors">
                    <i class="fas fa-redo mr-2"></i>Reset Filters
                </button>
            </div>
        </div>

        <!-- Products Grid -->
        @if($products->count() > 0)
            <div class="mb-8">
                <p class="text-gray-600 text-sm">
                    Total <span class="font-bold text-cyan-600">{{ $products->total() }}</span> products
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12" id="productsGrid">
                @foreach($products as $product)
                    <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group product-card"
                         data-process="{{ $product->process_type }}"
                         data-capacity="{{ $product->capacity }}"
                         data-applications="{{ $product->applications }}"
                         data-aos="fade-in-up"
                         data-aos-delay="{{ $loop->index % 3 * 100 }}">

                        <!-- Image Section -->
                        @if($product->image)
                            <div class="relative overflow-hidden h-56">
                                <img src="{{ asset('storage/' . $product->image) }}" alt="{{ $product->name }}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                                @if($product->process_type)
                                    <div class="absolute top-4 right-4">
                                        @if($product->process_type === 'wound')
                                            <span class="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Wound Cell</span>
                                        @else
                                            <span class="inline-block bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Stacked Cell</span>
                                        @endif
                                    </div>
                                @endif
                            </div>
                        @else
                            <div class="relative h-56 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all">
                                <i class="fas fa-battery-full text-blue-600 text-6xl group-hover:scale-125 transition-transform"></i>
                                @if($product->process_type)
                                    <div class="absolute top-4 right-4">
                                        @if($product->process_type === 'wound')
                                            <span class="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Wound Cell</span>
                                        @else
                                            <span class="inline-block bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Stacked Cell</span>
                                        @endif
                                    </div>
                                @endif
                            </div>
                        @endif

                        <!-- Content Section -->
                        <div class="p-6">
                            <h3 class="text-xl font-bold text-gray-800 mb-2 group-hover:text-cyan-600 transition-colors">{{ $product->name }}</h3>

                            @if($product->model)
                                <p class="text-gray-500 text-sm mb-3">
                                    <i class="fas fa-microchip text-blue-600 mr-2"></i>
                                    <span class="font-semibold">{{ $product->model }}</span>
                                </p>
                            @endif

                            <p class="text-gray-600 text-sm mb-4 line-clamp-2">{{ $product->description }}</p>

                            <!-- Key Specs -->
                            <div class="grid grid-cols-2 gap-3 mb-6 text-sm bg-gray-50 p-4 rounded-lg">
                                @if($product->capacity)
                                    <div>
                                        <span class="text-gray-600 text-xs">Capacity</span>
                                        <p class="font-bold text-gray-800">{{ $product->capacity }}<span class="text-xs ml-1">mAh</span></p>
                                    </div>
                                @endif
                                @if($product->voltage)
                                    <div>
                                        <span class="text-gray-600 text-xs">Voltage</span>
                                        <p class="font-bold text-gray-800">{{ $product->voltage }}<span class="text-xs ml-1">V</span></p>
                                    </div>
                                @endif
                                @if($product->internal_resistance)
                                    <div>
                                        <span class="text-gray-600 text-xs">Resistance</span>
                                        <p class="font-bold text-cyan-600">{{ $product->internal_resistance }}<span class="text-xs ml-1">mΩ</span></p>
                                    </div>
                                @endif
                                @if($product->cycle_life)
                                    <div>
                                        <span class="text-gray-600 text-xs">Cycle Life</span>
                                        <p class="font-bold text-gray-800">{{ $product->cycle_life }}</p>
                                    </div>
                                @endif
                            </div>

                            <!-- Highlights -->
                            @if($product->highlights)
                                <p class="text-sm text-blue-600 mb-4 line-clamp-2">
                                    <i class="fas fa-star text-yellow-400 mr-1"></i>
                                    {{ $product->highlights }}
                                </p>
                            @endif

                            <!-- Action Button -->
                            <a href="{{ route('products.show', $product->slug) }}" class="btn-primary text-center block hover:shadow-lg hover:scale-105 transition-all duration-300">
                                <i class="fas fa-arrow-right mr-2"></i>View Details
                            </a>
                        </div>
                    </div>
                @endforeach
            </div>

            <!-- Pagination -->
            <div class="flex justify-center items-center space-x-4 mt-12">
                {{ $products->links() }}
            </div>
        @else
            <div class="text-center py-20">
                <i class="fas fa-inbox text-gray-300 text-7xl mb-4"></i>
                <p class="text-gray-600 text-xl mb-2">No products found</p>
                <p class="text-gray-500 text-sm">Try adjusting your filter criteria</p>
                <button id="resetFilters" class="mt-6 text-cyan-600 hover:text-cyan-800 font-semibold transition-colors">
                    <i class="fas fa-redo mr-2"></i>Reset Filters
                </button>
            </div>
        @endif
    </div>
</section>

<!-- CTA Section -->
<section class="bg-gradient-to-r from-cyan-600 to-blue-700 text-white py-16">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold mb-4">Can't find what you need?</h2>
        <p class="text-cyan-100 text-lg mb-8">ZUFEK specializes in custom-shaped battery designs tailored to your specific requirements</p>
        <a href="/contact" class="inline-block bg-white text-cyan-600 px-8 py-3 rounded-lg font-bold hover:bg-cyan-50 hover:shadow-lg transition-all duration-300">
            <i class="fas fa-envelope mr-2"></i>Request Custom Battery
        </a>
    </div>
</section>

@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const processFilter = document.getElementById('processFilter');
    const applicationFilter = document.getElementById('applicationFilter');
    const capacityFilter = document.getElementById('capacityFilter');
    const sortFilter = document.getElementById('sortFilter');
    const resetButton = document.getElementById('resetFilters');
    const productsGrid = document.getElementById('productsGrid');
    const productCards = document.querySelectorAll('.product-card');

    function filterProducts() {
        const processValue = processFilter.value.toLowerCase();
        const applicationValue = applicationFilter.value.toLowerCase();
        const capacityValue = capacityFilter.value;

        let visibleCount = 0;

        productCards.forEach(card => {
            let show = true;

            // Process filter
            if (processValue && !card.dataset.process.includes(processValue)) {
                show = false;
            }

            // Application filter
            if (applicationValue && !card.dataset.applications.toLowerCase().includes(applicationValue)) {
                show = false;
            }

            // Capacity filter
            if (capacityValue) {
                const capacity = parseInt(card.dataset.capacity);
                const [min, max] = capacityValue.includes('+')
                    ? [parseInt(capacityValue), Infinity]
                    : capacityValue.split('-').map(Number);

                if (capacity < min || capacity > max) {
                    show = false;
                }
            }

            card.style.display = show ? 'block' : 'none';
            if (show) visibleCount++;
        });

        // Show no results message if needed
        if (visibleCount === 0 && productsGrid) {
            // Could add dynamic no results message here
        }
    }

    function sortProducts() {
        const sortValue = sortFilter.value;
        const cardsArray = Array.from(productCards).filter(card => card.style.display !== 'none');

        cardsArray.sort((a, b) => {
            switch(sortValue) {
                case 'capacity-asc':
                    return parseInt(a.dataset.capacity) - parseInt(b.dataset.capacity);
                case 'capacity-desc':
                    return parseInt(b.dataset.capacity) - parseInt(a.dataset.capacity);
                case 'resistance-asc':
                    const resA = parseFloat(a.querySelector('[data-resistance]')?.dataset.resistance || '999');
                    const resB = parseFloat(b.querySelector('[data-resistance]')?.dataset.resistance || '999');
                    return resA - resB;
                default:
                    return 0;
            }
        });

        if (productsGrid) {
            cardsArray.forEach(card => productsGrid.appendChild(card));
        }
    }

    // Event listeners
    if (processFilter) processFilter.addEventListener('change', filterProducts);
    if (applicationFilter) applicationFilter.addEventListener('change', filterProducts);
    if (capacityFilter) capacityFilter.addEventListener('change', filterProducts);
    if (sortFilter) sortFilter.addEventListener('change', sortProducts);

    if (resetButton) {
        resetButton.addEventListener('click', function() {
            processFilter.value = '';
            applicationFilter.value = '';
            capacityFilter.value = '';
            sortFilter.value = 'default';
            filterProducts();
        });
    }
});
</script>
@endpush
