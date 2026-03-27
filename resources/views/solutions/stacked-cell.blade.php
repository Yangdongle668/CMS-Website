@extends('layouts.app')

@section('title', 'Stacked Cell Battery Solutions - ZUFEK')
@section('description', 'Explore ZUFEK stacked cell technology: superior performance, low resistance, ideal for high-power applications.')

@section('content')
<!-- Hero Section -->
<section class="bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
                <h1 class="text-4xl md:text-5xl font-bold mb-6 animate-slideInDown">Stacked Cell Technology</h1>
                <p class="text-xl text-purple-100 mb-8 animate-slideInUp" style="animation-delay: 0.2s;">
                    Superior performance with lower internal resistance. Engineered for demanding applications requiring maximum reliability and cycle life.
                </p>
                <div class="flex gap-4">
                    <a href="/contact" class="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-purple-50 transition-all">
                        <i class="fas fa-envelope mr-2"></i>Request Quote
                    </a>
                    <a href="#specs" class="border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition-all">
                        <i class="fas fa-arrow-down mr-2"></i>Learn More
                    </a>
                </div>
            </div>
            <div class="hidden md:flex justify-center">
                <div class="text-purple-200/30 text-9xl">
                    <i class="fas fa-layer-group"></i>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Key Advantages -->
<section class="py-20 bg-white" id="specs">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-800 mb-12">Key Advantages</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 border border-purple-200" data-aos="fade-in-up">
                <div class="text-4xl text-purple-600 mb-4">
                    <i class="fas fa-bolt"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-3">Low Internal Resistance</h3>
                <p class="text-gray-700">
                    Significantly reduced resistance enables higher power output and better performance in demanding applications.
                </p>
            </div>

            <div class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 border border-purple-200" data-aos="fade-in-up" data-aos-delay="100">
                <div class="text-4xl text-purple-600 mb-4">
                    <i class="fas fa-sync"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-3">Extended Cycle Life</h3>
                <p class="text-gray-700">
                    Superior durability with extended cycle life, perfect for applications requiring long-term reliability.
                </p>
            </div>

            <div class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 border border-purple-200" data-aos="fade-in-up" data-aos-delay="200">
                <div class="text-4xl text-purple-600 mb-4">
                    <i class="fas fa-chart-bar"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-3">Higher Performance</h3>
                <p class="text-gray-700">
                    Optimized for superior discharge rates and power delivery in high-demand applications.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- Technical Specifications -->
<section class="py-20 bg-gray-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-800 mb-12">Technical Specifications</h2>

        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <table class="w-full">
                <thead class="bg-purple-600 text-white">
                    <tr>
                        <th class="px-6 py-4 text-left font-bold">Parameter</th>
                        <th class="px-6 py-4 text-left font-bold">Typical Range</th>
                        <th class="px-6 py-4 text-left font-bold">Notes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-b hover:bg-purple-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Capacity</td>
                        <td class="px-6 py-4 text-gray-700">100 - 3000 mAh</td>
                        <td class="px-6 py-4 text-gray-600">Customizable</td>
                    </tr>
                    <tr class="border-b hover:bg-purple-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Internal Resistance</td>
                        <td class="px-6 py-4 text-gray-700">20 - 80 mΩ</td>
                        <td class="px-6 py-4 text-gray-600">Significantly lower</td>
                    </tr>
                    <tr class="border-b hover:bg-purple-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Cycle Life</td>
                        <td class="px-6 py-4 text-gray-700">500 - 800 cycles</td>
                        <td class="px-6 py-4 text-gray-600">@ 80% capacity</td>
                    </tr>
                    <tr class="border-b hover:bg-purple-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Energy Density</td>
                        <td class="px-6 py-4 text-gray-700">170 - 220 Wh/kg</td>
                        <td class="px-6 py-4 text-gray-600">Superior density</td>
                    </tr>
                    <tr class="hover:bg-purple-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Max Discharge Rate</td>
                        <td class="px-6 py-4 text-gray-700">Up to 10C</td>
                        <td class="px-6 py-4 text-gray-600">High power capable</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</section>

<!-- Applications -->
<section class="py-20 bg-white">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-800 mb-12">Ideal Applications</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex items-start p-6 bg-purple-50 rounded-lg border border-purple-200">
                <div class="text-3xl text-purple-600 mr-4 flex-shrink-0">
                    <i class="fas fa-heartbeat"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Implantable Devices</h3>
                    <p class="text-gray-700">Pacemakers, neurostimulators, drug pumps</p>
                </div>
            </div>

            <div class="flex items-start p-6 bg-purple-50 rounded-lg border border-purple-200">
                <div class="text-3xl text-purple-600 mr-4 flex-shrink-0">
                    <i class="fas fa-dumbbell"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">High-Power Tools</h3>
                    <p class="text-gray-700">Power drills, impact tools, cordless devices</p>
                </div>
            </div>

            <div class="flex items-start p-6 bg-purple-50 rounded-lg border border-purple-200">
                <div class="text-3xl text-purple-600 mr-4 flex-shrink-0">
                    <i class="fas fa-camera"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Photography Equipment</h3>
                    <p class="text-gray-700">Professional cameras, strobes, lighting</p>
                </div>
            </div>

            <div class="flex items-start p-6 bg-purple-50 rounded-lg border border-purple-200">
                <div class="text-3xl text-purple-600 mr-4 flex-shrink-0">
                    <i class="fas fa-cogs"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Industrial Equipment</h3>
                    <p class="text-gray-700">High-performance industrial systems</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Products Section -->
@if($products->count() > 0)
<section class="py-20 bg-gray-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-800 mb-12">Stacked Cell Products</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            @foreach($products as $product)
            <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all group">
                <div class="h-48 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                    <i class="fas fa-layer-group text-purple-600 text-6xl opacity-20 group-hover:scale-110 transition-transform"></i>
                </div>
                <div class="p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-2">{{ $product->name }}</h3>
                    @if($product->model)
                    <p class="text-sm text-gray-600 mb-3">
                        <i class="fas fa-microchip text-purple-600 mr-2"></i>{{ $product->model }}
                    </p>
                    @endif
                    <div class="grid grid-cols-2 gap-3 mb-4 text-sm">
                        @if($product->capacity)
                        <div>
                            <span class="text-gray-600">Capacity</span>
                            <p class="font-bold text-gray-800">{{ $product->capacity }} mAh</p>
                        </div>
                        @endif
                        @if($product->internal_resistance)
                        <div>
                            <span class="text-gray-600">Resistance</span>
                            <p class="font-bold text-purple-600">{{ $product->internal_resistance }} mΩ</p>
                        </div>
                        @endif
                    </div>
                    <a href="{{ route('products.show', $product->slug) }}" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition-all text-center">
                        View Details
                    </a>
                </div>
            </div>
            @endforeach
        </div>
    </div>
</section>
@endif

<!-- CTA Section -->
<section class="bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-16">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold mb-4">Experience Superior Stacked Cell Performance</h2>
        <p class="text-purple-100 text-lg mb-8">
            Discover how ZUFEK stacked cell technology can elevate your application's performance and reliability.
        </p>
        <a href="/contact" class="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-purple-50 hover:shadow-lg transition-all duration-300">
            <i class="fas fa-envelope mr-2"></i>Contact Our Sales Team
        </a>
    </div>
</section>

@endsection
