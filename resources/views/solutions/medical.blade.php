@extends('layouts.app')

@section('title', 'Medical Device Battery Solutions - ZUFEK')
@section('description', 'Discover ZUFEK medical battery technology: biocompatible, regulated compliance, high reliability for implantable and medical devices.')

@section('content')
<!-- Hero Section -->
<section class="bg-gradient-to-r from-rose-600 to-pink-700 text-white py-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
                <h1 class="text-4xl md:text-5xl font-bold mb-6 animate-slideInDown">Medical Device Battery Technology</h1>
                <p class="text-xl text-rose-100 mb-8 animate-slideInUp" style="animation-delay: 0.2s;">
                    Biocompatible batteries with regulated compliance and exceptional reliability. Engineered for critical medical applications.
                </p>
                <div class="flex gap-4">
                    <a href="/contact" class="bg-white text-rose-600 px-6 py-3 rounded-lg font-bold hover:bg-rose-50 transition-all">
                        <i class="fas fa-envelope mr-2"></i>Request Quote
                    </a>
                    <a href="#specs" class="border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition-all">
                        <i class="fas fa-arrow-down mr-2"></i>Learn More
                    </a>
                </div>
            </div>
            <div class="hidden md:flex justify-center">
                <div class="text-rose-200/30 text-9xl">
                    <i class="fas fa-heartbeat"></i>
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
            <div class="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-8 border border-rose-200" data-aos="fade-in-up">
                <div class="text-4xl text-white mb-4 bg-rose-600 w-16 h-16 rounded-lg flex items-center justify-center">
                    <i class="fas fa-flask"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-3">Biocompatible Materials</h3>
                <p class="text-gray-700">
                    Medical-grade materials that are safe for implantation and long-term contact with biological tissues without adverse reactions.
                </p>
            </div>

            <div class="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-8 border border-rose-200" data-aos="fade-in-up" data-aos-delay="100">
                <div class="text-4xl text-white mb-4 bg-rose-600 w-16 h-16 rounded-lg flex items-center justify-center">
                    <i class="fas fa-certificate"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-3">Regulatory Compliance</h3>
                <p class="text-gray-700">
                    Full compliance with FDA, CE Mark, and other international medical device regulations and standards.
                </p>
            </div>

            <div class="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-8 border border-rose-200" data-aos="fade-in-up" data-aos-delay="200">
                <div class="text-4xl text-white mb-4 bg-rose-600 w-16 h-16 rounded-lg flex items-center justify-center">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-3">High Reliability</h3>
                <p class="text-gray-700">
                    Exceptional durability and consistent performance for critical life-saving medical applications with zero tolerance for failure.
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
                <thead class="bg-rose-600 text-white">
                    <tr>
                        <th class="px-6 py-4 text-left font-bold">Parameter</th>
                        <th class="px-6 py-4 text-left font-bold">Typical Range</th>
                        <th class="px-6 py-4 text-left font-bold">Notes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-b hover:bg-rose-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Capacity</td>
                        <td class="px-6 py-4 text-gray-700">200 - 3000 mAh</td>
                        <td class="px-6 py-4 text-gray-600">Customizable</td>
                    </tr>
                    <tr class="border-b hover:bg-rose-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Internal Resistance</td>
                        <td class="px-6 py-4 text-gray-700">80 - 200 mΩ</td>
                        <td class="px-6 py-4 text-gray-600">Size dependent</td>
                    </tr>
                    <tr class="border-b hover:bg-rose-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Cycle Life</td>
                        <td class="px-6 py-4 text-gray-700">500 - 1000 cycles</td>
                        <td class="px-6 py-4 text-gray-600">@ 80% capacity</td>
                    </tr>
                    <tr class="border-b hover:bg-rose-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Operating Temperature</td>
                        <td class="px-6 py-4 text-gray-700">-5°C to +55°C</td>
                        <td class="px-6 py-4 text-gray-600">Body-safe range</td>
                    </tr>
                    <tr class="hover:bg-rose-50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">Shelf Life</td>
                        <td class="px-6 py-4 text-gray-700">Up to 10 years</td>
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
            <div class="flex items-start p-6 bg-rose-50 rounded-lg border border-rose-200">
                <div class="text-3xl text-white bg-rose-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i class="fas fa-heartbeat"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Pacemakers</h3>
                    <p class="text-gray-700">Life-sustaining implantable cardiac devices for heart rhythm management</p>
                </div>
            </div>

            <div class="flex items-start p-6 bg-rose-50 rounded-lg border border-rose-200">
                <div class="text-3xl text-white bg-rose-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i class="fas fa-brain"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Neural Stimulators</h3>
                    <p class="text-gray-700">Implantable neurostimulation devices for pain management and neurological conditions</p>
                </div>
            </div>

            <div class="flex items-start p-6 bg-rose-50 rounded-lg border border-rose-200">
                <div class="text-3xl text-white bg-rose-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i class="fas fa-thermometer-half"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Medical Monitors</h3>
                    <p class="text-gray-700">Continuous monitoring devices for vital signs and health parameters</p>
                </div>
            </div>

            <div class="flex items-start p-6 bg-rose-50 rounded-lg border border-rose-200">
                <div class="text-3xl text-white bg-rose-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i class="fas fa-stethoscope"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 mb-2">Diagnostic Equipment</h3>
                    <p class="text-gray-700">Portable and implantable diagnostic devices for medical assessment</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Products Section -->
@if($products->count() > 0)
<section class="py-20 bg-gray-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-800 mb-12">Medical Battery Products</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            @foreach($products as $product)
            <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all group">
                <div class="h-48 bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                    <i class="fas fa-heartbeat text-rose-600 text-6xl opacity-20 group-hover:scale-110 transition-transform"></i>
                </div>
                <div class="p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-2">{{ $product->name }}</h3>
                    @if($product->model)
                    <p class="text-sm text-gray-600 mb-3">
                        <i class="fas fa-microchip text-rose-600 mr-2"></i>{{ $product->model }}
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
                    <a href="{{ route('products.show', $product->slug) }}" class="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 rounded-lg transition-all text-center">
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
<section class="bg-gradient-to-r from-rose-600 to-pink-700 text-white py-16">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold mb-4">Trusted for Life-Critical Applications</h2>
        <p class="text-rose-100 text-lg mb-8">
            Experience the reliability and safety of ZUFEK medical batteries in your most critical medical devices.
        </p>
        <a href="/contact" class="inline-block bg-white text-rose-600 px-8 py-3 rounded-lg font-bold hover:bg-rose-50 hover:shadow-lg transition-all duration-300">
            <i class="fas fa-envelope mr-2"></i>Contact Our Sales Team
        </a>
    </div>
</section>

@endsection
