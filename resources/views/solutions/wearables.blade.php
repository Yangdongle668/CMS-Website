@extends('layouts.app')

@section('title', 'Wearable Battery Solutions - ZUFEK')
@section('description', 'Discover ZUFEK wearable battery technology: compact, low power consumption, wireless capability for smartwatches and fitness trackers.')

@section('content')
<!-- Hero Section -->
<section class="bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
                <h1 class="text-4xl md:text-5xl font-bold mb-6 animate-slideInDown">Wearable Battery Technology</h1>
                <p class="text-xl text-cyan-100 mb-8 animate-slideInUp" style="animation-delay: 0.2s;">
                    Compact and lightweight batteries with low power consumption. Perfect for smartwatches, fitness trackers, and wearable devices.
                </p>
                <div class="flex gap-4">
                    <a href="/contact" class="bg-white text-cyan-600 px-6 py-3 rounded-lg font-bold hover:bg-cyan-50 transition-all">
                        <i class="fas fa-envelope mr-2"></i>Request Quote
                    </a>
                    <a href="#specs" class="border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition-all">
                        <i class="fas fa-arrow-down mr-2"></i>Learn More
                    </a>
                </div>
            </div>
            <div class="hidden md:flex justify-center">
                <div class="text-cyan-200/30 text-9xl">
                    <i class="fas fa-watch"></i>
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
            <div class="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-8 border border-cyan-200" data-aos="fade-in-up">
                <div class="text-4xl text-white mb-4 bg-cyan-600 w-16 h-16 rounded-lg flex items-center justify-center">
                    <i class="fas fa-compress"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-3">Compact Design</h3>
                <p class="text-gray-700">
                    Ultra-compact form factors that fit seamlessly into smartwatches, fitness bands, and other wearable devices without adding bulk.
                </p>
            </div>

            <div class="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-8 border border-cyan-200" data-aos="fade-in-up" data-aos-delay="100">
                <div class="text-4xl text-white mb-4 bg-cyan-600 w-16 h-16 rounded-lg flex items-center justify-center">
                    <i class="fas fa-leaf"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-3">Low Power Consumption</h3>
                <p class="text-gray-700">
                    Optimized for minimal energy drain, enabling extended battery life and longer time between charges for your wearable.
                </p>
            </div>

            <div class="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-8 border border-cyan-200" data-aos="fade-in-up" data-aos-delay="200">
                <div class="text-4xl text-white mb-4 bg-cyan-600 w-16 h-16 rounded-lg flex items-center justify-center">
                    <i class="fas fa-wifi"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-3">Wireless Capability</h3>
                <p class="text-gray-700">
                    Supports wireless charging and connectivity protocols, enabling seamless integration with modern wearable ecosystems.
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
                <thead class="bg-cyan-600 text-white">
                    <tr>
                        <th class="px-6 py-4 text-left font-bold">Parameter</th>
                        <th class="px-6 py-4 text-left font-bold">Typical Range</th>
                        <th class="px-6 py-4 text-left font-bold">Notes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-b hover:bg-cyan-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Capacity</td>
                        <td class="px-6 py-4 text-gray-700">50 - 500 mAh</td>
                        <td class="px-6 py-4 text-gray-600">Ultra-compact sizes</td>
                    </tr>
                    <tr class="border-b hover:bg-cyan-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Dimensions</td>
                        <td class="px-6 py-4 text-gray-700">10 x 10 x 5 mm (typical)</td>
                        <td class="px-6 py-4 text-gray-600">Customizable</td>
                    </tr>
                    <tr class="border-b hover:bg-cyan-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Internal Resistance</td>
                        <td class="px-6 py-4 text-gray-700">100 - 300 mΩ</td>
                        <td class="px-6 py-4 text-gray-600">Size dependent</td>
                    </tr>
                    <tr class="border-b hover:bg-cyan-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Cycle Life</td>
                        <td class="px-6 py-4 text-gray-700">300 - 500 cycles</td>
                        <td class="px-6 py-4 text-gray-600">@ 80% capacity</td>
                    </tr>
                    <tr class="hover:bg-cyan-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Operating Temperature</td>
                        <td class="px-6 py-4 text-gray-700">-10°C to +60°C</td>
                        <td class="px-6 py-4 text-gray-600">Standard range</td>
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
            <div class="flex items-start p-6 bg-cyan-50 rounded-lg border border-cyan-200">
                <div class="text-3xl text-white bg-cyan-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i class="fas fa-watch"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Smartwatches</h3>
                    <p class="text-gray-700">Wearable smart devices with health and fitness tracking capabilities</p>
                </div>
            </div>

            <div class="flex items-start p-6 bg-cyan-50 rounded-lg border border-cyan-200">
                <div class="text-3xl text-white bg-cyan-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i class="fas fa-heartbeat"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Fitness Trackers</h3>
                    <p class="text-gray-700">Bands and wristbands for activity and health monitoring</p>
                </div>
            </div>

            <div class="flex items-start p-6 bg-cyan-50 rounded-lg border border-cyan-200">
                <div class="text-3xl text-white bg-cyan-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i class="fas fa-square"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Smart Patches</h3>
                    <p class="text-gray-700">Medical and health monitoring patches for continuous tracking</p>
                </div>
            </div>

            <div class="flex items-start p-6 bg-cyan-50 rounded-lg border border-cyan-200">
                <div class="text-3xl text-white bg-cyan-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i class="fas fa-ring"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Smart Rings</h3>
                    <p class="text-gray-700">Compact wearable rings with biometric sensing capabilities</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Products Section -->
@if($products->count() > 0)
<section class="py-20 bg-gray-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-800 mb-12">Wearable Battery Products</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            @foreach($products as $product)
            <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all group">
                <div class="h-48 bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                    <i class="fas fa-watch text-cyan-600 text-6xl opacity-20 group-hover:scale-110 transition-transform"></i>
                </div>
                <div class="p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-2">{{ $product->name }}</h3>
                    @if($product->model)
                    <p class="text-sm text-gray-600 mb-3">
                        <i class="fas fa-microchip text-cyan-600 mr-2"></i>{{ $product->model }}
                    </p>
                    @endif
                    <div class="grid grid-cols-2 gap-3 mb-4 text-sm">
                        @if($product->capacity)
                        <div>
                            <span class="text-gray-600">Capacity</span>
                            <p class="font-bold text-gray-800">{{ $product->capacity }} mAh</p>
                        </div>
                        @endif
                        @if($product->voltage)
                        <div>
                            <span class="text-gray-600">Voltage</span>
                            <p class="font-bold text-gray-800">{{ $product->voltage }} V</p>
                        </div>
                        @endif
                    </div>
                    <a href="{{ route('products.show', $product->slug) }}" class="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 rounded-lg transition-all text-center">
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
<section class="bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-16">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold mb-4">Power Your Wearables Today</h2>
        <p class="text-cyan-100 text-lg mb-8">
            Our compact, high-performance wearable batteries are designed to keep your devices running longer.
        </p>
        <a href="/contact" class="inline-block bg-white text-cyan-600 px-8 py-3 rounded-lg font-bold hover:bg-cyan-50 hover:shadow-lg transition-all duration-300">
            <i class="fas fa-envelope mr-2"></i>Contact Our Sales Team
        </a>
    </div>
</section>

@endsection
