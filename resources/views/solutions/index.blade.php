@extends('layouts.app')

@section('title', 'Battery Solutions - ZUFEK Polymer Lithium Batteries')
@section('description', 'Explore ZUFEK comprehensive battery solutions for wearables, medical devices, and IoT applications with advanced wound and stacked cell technology.')

@section('content')
<!-- Hero Section -->
<section class="bg-gradient-to-r from-cyan-600 to-blue-700 text-white py-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
            <h1 class="text-4xl md:text-5xl font-bold mb-6 animate-slideInDown">Battery Solutions</h1>
            <p class="text-xl text-cyan-100 max-w-3xl mx-auto animate-slideInUp" style="animation-delay: 0.2s;">
                Tailored polymer lithium battery solutions for every application — from wearables to medical devices and beyond
            </p>
        </div>
    </div>
</section>

<!-- Technology Solutions -->
<section class="py-20 bg-white">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-800 mb-12" data-aos="fade-in">
            <i class="fas fa-microchip text-cyan-600 mr-3"></i>Manufacturing Technologies
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8" data-aos="fade-in-up">
            <!-- Wound Cell Technology -->
            <div class="group bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <div class="relative h-64 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center group-hover:from-green-200 group-hover:to-emerald-200 transition-all">
                    <i class="fas fa-circle text-green-600 text-8xl opacity-20"></i>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <span class="inline-block bg-green-600 text-white font-bold px-6 py-2 rounded-full text-sm">Wound Cell</span>
                    </div>
                </div>
                <div class="p-8">
                    <h3 class="text-2xl font-bold text-gray-800 mb-3 group-hover:text-green-600 transition-colors">
                        Wound Cell Technology
                    </h3>
                    <p class="text-gray-600 mb-4 leading-relaxed">
                        Optimized for fast production cycles and cost efficiency. Ideal for high-volume production of batteries requiring quick turnaround times.
                    </p>
                    <ul class="space-y-2 mb-6 text-sm text-gray-700">
                        <li class="flex items-center">
                            <i class="fas fa-check text-green-600 mr-3"></i>
                            <span>Lower production costs</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-green-600 mr-3"></i>
                            <span>Faster delivery times</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-green-600 mr-3"></i>
                            <span>High consistency</span>
                        </li>
                    </ul>
                    <a href="{{ route('solutions.wound-cell') }}" class="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300">
                        Learn More <i class="fas fa-arrow-right ml-2"></i>
                    </a>
                </div>
            </div>

            <!-- Stacked Cell Technology -->
            <div class="group bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <div class="relative h-64 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center group-hover:from-purple-200 group-hover:to-indigo-200 transition-all">
                    <i class="fas fa-layer-group text-purple-600 text-8xl opacity-20"></i>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <span class="inline-block bg-purple-600 text-white font-bold px-6 py-2 rounded-full text-sm">Stacked Cell</span>
                    </div>
                </div>
                <div class="p-8">
                    <h3 class="text-2xl font-bold text-gray-800 mb-3 group-hover:text-purple-600 transition-colors">
                        Stacked Cell Technology
                    </h3>
                    <p class="text-gray-600 mb-4 leading-relaxed">
                        Superior performance with lower internal resistance. Perfect for high-power applications requiring excellent cycle life and reliability.
                    </p>
                    <ul class="space-y-2 mb-6 text-sm text-gray-700">
                        <li class="flex items-center">
                            <i class="fas fa-check text-purple-600 mr-3"></i>
                            <span>Lower internal resistance</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-purple-600 mr-3"></i>
                            <span>Higher cycle life</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-purple-600 mr-3"></i>
                            <span>Superior performance</span>
                        </li>
                    </ul>
                    <a href="{{ route('solutions.stacked-cell') }}" class="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300">
                        Learn More <i class="fas fa-arrow-right ml-2"></i>
                    </a>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Application Solutions -->
<section class="py-20 bg-gradient-to-b from-gray-50 to-white">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-800 mb-12" data-aos="fade-in">
            <i class="fas fa-layer-group text-cyan-600 mr-3"></i>Industry Solutions
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Wearables -->
            <a href="{{ route('solutions.wearables') }}" class="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                <div class="text-5xl mb-4">
                    <i class="fas fa-watch text-cyan-500"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-2 group-hover:text-cyan-600 transition-colors">
                    Wearables
                </h3>
                <p class="text-gray-600 text-sm mb-4">
                    Compact, lightweight batteries for smartwatches, fitness trackers, and wearable devices.
                </p>
                <span class="text-cyan-600 font-semibold group-hover:translate-x-2 transition-transform inline-block">
                    Explore <i class="fas fa-arrow-right ml-2"></i>
                </span>
            </a>

            <!-- Medical Devices -->
            <a href="{{ route('solutions.medical') }}" class="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                <div class="text-5xl mb-4">
                    <i class="fas fa-heartbeat text-rose-500"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-2 group-hover:text-rose-600 transition-colors">
                    Medical Devices
                </h3>
                <p class="text-gray-600 text-sm mb-4">
                    Reliable, certified batteries for implantable devices and medical equipment.
                </p>
                <span class="text-rose-600 font-semibold group-hover:translate-x-2 transition-transform inline-block">
                    Explore <i class="fas fa-arrow-right ml-2"></i>
                </span>
            </a>

            <!-- IoT & Smart Devices -->
            <a href="{{ route('solutions.iot') }}" class="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                <div class="text-5xl mb-4">
                    <i class="fas fa-wifi text-blue-500"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                    IoT & Smart Devices
                </h3>
                <p class="text-gray-600 text-sm mb-4">
                    Efficient, long-lasting batteries for connected devices and smart home solutions.
                </p>
                <span class="text-blue-600 font-semibold group-hover:translate-x-2 transition-transform inline-block">
                    Explore <i class="fas fa-arrow-right ml-2"></i>
                </span>
            </a>
        </div>
    </div>
</section>

<!-- Why Choose ZUFEK -->
<section class="py-20 bg-white">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-800 mb-12" data-aos="fade-in">
            Why Choose ZUFEK Solutions
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="text-center p-6" data-aos="fade-in-up" data-aos-delay="0">
                <div class="text-4xl mb-4 h-16 flex items-center justify-center">
                    <i class="fas fa-shield-alt text-cyan-600"></i>
                </div>
                <h3 class="font-bold text-gray-800 mb-2">Industry Certified</h3>
                <p class="text-gray-600 text-sm">UL, FDA, CE/RoHS, ISO 9001 certified</p>
            </div>

            <div class="text-center p-6" data-aos="fade-in-up" data-aos-delay="100">
                <div class="text-4xl mb-4 h-16 flex items-center justify-center">
                    <i class="fas fa-cog text-cyan-600"></i>
                </div>
                <h3 class="font-bold text-gray-800 mb-2">Custom Design</h3>
                <p class="text-gray-600 text-sm">Flexible design for any shape or size</p>
            </div>

            <div class="text-center p-6" data-aos="fade-in-up" data-aos-delay="200">
                <div class="text-4xl mb-4 h-16 flex items-center justify-center">
                    <i class="fas fa-rocket text-cyan-600"></i>
                </div>
                <h3 class="font-bold text-gray-800 mb-2">Fast Delivery</h3>
                <p class="text-gray-600 text-sm">Quick turnaround without compromising quality</p>
            </div>

            <div class="text-center p-6" data-aos="fade-in-up" data-aos-delay="300">
                <div class="text-4xl mb-4 h-16 flex items-center justify-center">
                    <i class="fas fa-handshake text-cyan-600"></i>
                </div>
                <h3 class="font-bold text-gray-800 mb-2">Global Support</h3>
                <p class="text-gray-600 text-sm">Support for customers worldwide</p>
            </div>
        </div>
    </div>
</section>

<!-- CTA Section -->
<section class="bg-gradient-to-r from-cyan-600 to-blue-700 text-white py-16">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold mb-4">Ready to Find Your Perfect Solution?</h2>
        <p class="text-cyan-100 text-lg mb-8">
            Contact our sales team to discuss your specific requirements and get expert recommendations.
        </p>
        <a href="/contact" class="inline-block bg-white text-cyan-600 px-8 py-3 rounded-lg font-bold hover:bg-cyan-50 hover:shadow-lg transition-all duration-300">
            <i class="fas fa-envelope mr-2"></i>Get In Touch Today
        </a>
    </div>
</section>

@endsection
