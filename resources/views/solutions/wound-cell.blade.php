@extends('layouts.app')

@section('title', 'Wound Cell Battery Solutions - ZUFEK')
@section('description', 'Discover ZUFEK wound cell battery technology: cost-effective, fast production, ideal for high-volume applications.')

@section('content')
<!-- Hero Section -->
<section class="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
                <h1 class="text-4xl md:text-5xl font-bold mb-6 animate-slideInDown">Wound Cell Technology</h1>
                <p class="text-xl text-green-100 mb-8 animate-slideInUp" style="animation-delay: 0.2s;">
                    Efficient, cost-effective battery production optimized for speed and consistency. Perfect for high-volume manufacturing.
                </p>
                <div class="flex gap-4">
                    <a href="/contact" class="bg-white text-green-600 px-6 py-3 rounded-lg font-bold hover:bg-green-50 transition-all">
                        <i class="fas fa-envelope mr-2"></i>Request Quote
                    </a>
                    <a href="#specs" class="border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition-all">
                        <i class="fas fa-arrow-down mr-2"></i>Learn More
                    </a>
                </div>
            </div>
            <div class="hidden md:flex justify-center">
                <div class="text-green-200/30 text-9xl">
                    <i class="fas fa-circle"></i>
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
            <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200" data-aos="fade-in-up">
                <div class="text-4xl text-green-600 mb-4">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-3">Cost Effective</h3>
                <p class="text-gray-700">
                    Lower production costs without compromising on quality. Ideal for large-scale manufacturing.
                </p>
            </div>

            <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200" data-aos="fade-in-up" data-aos-delay="100">
                <div class="text-4xl text-green-600 mb-4">
                    <i class="fas fa-tachometer-alt"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-3">Fast Production</h3>
                <p class="text-gray-700">
                    Quick manufacturing cycles enable rapid delivery without sacrificing consistency or quality.
                </p>
            </div>

            <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200" data-aos="fade-in-up" data-aos-delay="200">
                <div class="text-4xl text-green-600 mb-4">
                    <i class="fas fa-chart-line"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-3">High Consistency</h3>
                <p class="text-gray-700">
                    Reliable batch-to-batch consistency with strict quality control throughout production.
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
                <thead class="bg-green-600 text-white">
                    <tr>
                        <th class="px-6 py-4 text-left font-bold">Parameter</th>
                        <th class="px-6 py-4 text-left font-bold">Typical Range</th>
                        <th class="px-6 py-4 text-left font-bold">Notes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-b hover:bg-green-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Capacity</td>
                        <td class="px-6 py-4 text-gray-700">100 - 5000 mAh</td>
                        <td class="px-6 py-4 text-gray-600">Customizable</td>
                    </tr>
                    <tr class="border-b hover:bg-green-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Internal Resistance</td>
                        <td class="px-6 py-4 text-gray-700">50 - 200 mΩ</td>
                        <td class="px-6 py-4 text-gray-600">Size dependent</td>
                    </tr>
                    <tr class="border-b hover:bg-green-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Cycle Life</td>
                        <td class="px-6 py-4 text-gray-700">300 - 500 cycles</td>
                        <td class="px-6 py-4 text-gray-600">@ 80% capacity</td>
                    </tr>
                    <tr class="border-b hover:bg-green-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Energy Density</td>
                        <td class="px-6 py-4 text-gray-700">150 - 200 Wh/kg</td>
                        <td class="px-6 py-4 text-gray-600">Industry standard</td>
                    </tr>
                    <tr class="hover:bg-green-50 transition-colors">
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
            <div class="flex items-start p-6 bg-green-50 rounded-lg border border-green-200">
                <div class="text-3xl text-green-600 mr-4 flex-shrink-0">
                    <i class="fas fa-watch"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Consumer Electronics</h3>
                    <p class="text-gray-700">Smartwatches, fitness trackers, portable devices</p>
                </div>
            </div>

            <div class="flex items-start p-6 bg-green-50 rounded-lg border border-green-200">
                <div class="text-3xl text-green-600 mr-4 flex-shrink-0">
                    <i class="fas fa-heartbeat"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Medical Monitoring</h3>
                    <p class="text-gray-700">Health monitoring devices, diagnostic tools</p>
                </div>
            </div>

            <div class="flex items-start p-6 bg-green-50 rounded-lg border border-green-200">
                <div class="text-3xl text-green-600 mr-4 flex-shrink-0">
                    <i class="fas fa-wifi"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">IoT Devices</h3>
                    <p class="text-gray-700">Connected sensors, smart home devices</p>
                </div>
            </div>

            <div class="flex items-start p-6 bg-green-50 rounded-lg border border-green-200">
                <div class="text-3xl text-green-600 mr-4 flex-shrink-0">
                    <i class="fas fa-mobile-alt"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Mobile Accessories</h3>
                    <p class="text-gray-700">Portable chargers, wireless devices</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Products Section -->
@if($products->count() > 0)
<section class="py-20 bg-gray-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-800 mb-12">Wound Cell Products</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            @foreach($products as $product)
            <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all group">
                <div class="h-48 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                    <i class="fas fa-battery-full text-green-600 text-6xl opacity-20 group-hover:scale-110 transition-transform"></i>
                </div>
                <div class="p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-2">{{ $product->name }}</h3>
                    @if($product->model)
                    <p class="text-sm text-gray-600 mb-3">
                        <i class="fas fa-microchip text-green-600 mr-2"></i>{{ $product->model }}
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
                    <a href="{{ route('products.show', $product->slug) }}" class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-all text-center">
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
<section class="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-16">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold mb-4">Ready to Implement Wound Cell Technology?</h2>
        <p class="text-green-100 text-lg mb-8">
            Our team is ready to help you find the perfect wound cell battery solution for your application.
        </p>
        <a href="/contact" class="inline-block bg-white text-green-600 px-8 py-3 rounded-lg font-bold hover:bg-green-50 hover:shadow-lg transition-all duration-300">
            <i class="fas fa-envelope mr-2"></i>Contact Our Sales Team
        </a>
    </div>
</section>

@endsection
