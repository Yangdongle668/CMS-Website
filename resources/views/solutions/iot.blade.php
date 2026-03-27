@extends('layouts.app')

@section('title', 'IoT Battery Solutions - ZUFEK')
@section('description', 'Discover ZUFEK IoT battery technology: long battery life, connectivity support, scalable solutions for smart devices.')

@section('content')
<!-- Hero Section -->
<section class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
                <h1 class="text-4xl md:text-5xl font-bold mb-6 animate-slideInDown">IoT Battery Technology</h1>
                <p class="text-xl text-blue-100 mb-8 animate-slideInUp" style="animation-delay: 0.2s;">
                    Long-lasting, reliable power for connected devices. Perfect for smart sensors, smart home systems, and environmental monitoring.
                </p>
                <div class="flex gap-4">
                    <a href="/contact" class="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-all">
                        <i class="fas fa-envelope mr-2"></i>Request Quote
                    </a>
                    <a href="#specs" class="border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition-all">
                        <i class="fas fa-arrow-down mr-2"></i>Learn More
                    </a>
                </div>
            </div>
            <div class="hidden md:flex justify-center">
                <div class="text-blue-200/30 text-9xl">
                    <i class="fas fa-network-wired"></i>
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
            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200" data-aos="fade-in-up">
                <div class="text-4xl text-white mb-4 bg-blue-600 w-16 h-16 rounded-lg flex items-center justify-center">
                    <i class="fas fa-battery-full"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-3">Long Battery Life</h3>
                <p class="text-gray-700">
                    Extended operational life with minimal maintenance. Power your IoT devices for months or years on a single charge.
                </p>
            </div>

            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200" data-aos="fade-in-up" data-aos-delay="100">
                <div class="text-4xl text-white mb-4 bg-blue-600 w-16 h-16 rounded-lg flex items-center justify-center">
                    <i class="fas fa-wifi"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-3">Connectivity Support</h3>
                <p class="text-gray-700">
                    Compatible with various wireless protocols and connectivity standards for seamless IoT integration.
                </p>
            </div>

            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200" data-aos="fade-in-up" data-aos-delay="200">
                <div class="text-4xl text-white mb-4 bg-blue-600 w-16 h-16 rounded-lg flex items-center justify-center">
                    <i class="fas fa-expand"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-3">Scalability</h3>
                <p class="text-gray-700">
                    Easily scalable solutions for deployments ranging from single devices to large-scale IoT networks.
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
                <thead class="bg-blue-600 text-white">
                    <tr>
                        <th class="px-6 py-4 text-left font-bold">Parameter</th>
                        <th class="px-6 py-4 text-left font-bold">Typical Range</th>
                        <th class="px-6 py-4 text-left font-bold">Notes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-b hover:bg-blue-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Capacity</td>
                        <td class="px-6 py-4 text-gray-700">500 - 5000 mAh</td>
                        <td class="px-6 py-4 text-gray-600">Customizable</td>
                    </tr>
                    <tr class="border-b hover:bg-blue-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Internal Resistance</td>
                        <td class="px-6 py-4 text-gray-700">50 - 150 mΩ</td>
                        <td class="px-6 py-4 text-gray-600">Size dependent</td>
                    </tr>
                    <tr class="border-b hover:bg-blue-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Cycle Life</td>
                        <td class="px-6 py-4 text-gray-700">500 - 1000 cycles</td>
                        <td class="px-6 py-4 text-gray-600">@ 80% capacity</td>
                    </tr>
                    <tr class="border-b hover:bg-blue-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Operating Temperature</td>
                        <td class="px-6 py-4 text-gray-700">-20°C to +70°C</td>
                        <td class="px-6 py-4 text-gray-600">Extended range</td>
                    </tr>
                    <tr class="hover:bg-blue-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Shelf Life</td>
                        <td class="px-6 py-4 text-gray-700">Up to 5 years</td>
                        <td class="px-6 py-4 text-gray-600">With proper storage</td>
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
            <div class="flex items-start p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div class="text-3xl text-white bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i class="fas fa-wifi"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Smart Sensors</h3>
                    <p class="text-gray-700">Temperature, humidity, and environmental monitoring sensors with wireless connectivity</p>
                </div>
            </div>

            <div class="flex items-start p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div class="text-3xl text-white bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i class="fas fa-home"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Smart Home Devices</h3>
                    <p class="text-gray-700">Connected switches, locks, thermostats, and automation controllers</p>
                </div>
            </div>

            <div class="flex items-start p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div class="text-3xl text-white bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i class="fas fa-leaf"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Environmental Monitoring</h3>
                    <p class="text-gray-700">Air quality, water quality, and weather monitoring systems</p>
                </div>
            </div>

            <div class="flex items-start p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div class="text-3xl text-white bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i class="fas fa-industry"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Industrial IoT</h3>
                    <p class="text-gray-700">Machine monitoring, asset tracking, and industrial automation systems</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Products Section -->
@if($products->count() > 0)
<section class="py-20 bg-gray-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-800 mb-12">IoT Battery Products</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            @foreach($products as $product)
            <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all group">
                <div class="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <i class="fas fa-network-wired text-blue-600 text-6xl opacity-20 group-hover:scale-110 transition-transform"></i>
                </div>
                <div class="p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-2">{{ $product->name }}</h3>
                    @if($product->model)
                    <p class="text-sm text-gray-600 mb-3">
                        <i class="fas fa-microchip text-blue-600 mr-2"></i>{{ $product->model }}
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
                    <a href="{{ route('products.show', $product->slug) }}" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-all text-center">
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
<section class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold mb-4">Connect Your IoT Ecosystem</h2>
        <p class="text-blue-100 text-lg mb-8">
            Deploy ZUFEK IoT batteries across your connected network with confidence in long-lasting, reliable power.
        </p>
        <a href="/contact" class="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 hover:shadow-lg transition-all duration-300">
            <i class="fas fa-envelope mr-2"></i>Contact Our Sales Team
        </a>
    </div>
</section>

@endsection
