@extends('layouts.app')

@section('title', 'Premium Polymer Lithium Battery Solutions - ZUFEK')
@section('description', 'ZUFEK provides professional polymer lithium battery solutions with wound and stacked cell technologies for wearables, medical devices, and IoT applications.')

@section('content')

<!-- ============================================================
     SECTION 1: HERO - With Dynamic Background & CTA
     ============================================================ -->
<section class="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
    <!-- Animated Background Elements -->
    <div class="absolute inset-0 overflow-hidden">
        <div class="absolute top-20 left-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div class="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse" style="animation-delay: 1s;"></div>
        <div class="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-10 animate-pulse" style="animation-delay: 2s;"></div>
    </div>

    <!-- Animated Grid Background -->
    <div class="absolute inset-0 bg-grid-pattern opacity-5"></div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-screen flex items-center">
        <div class="w-full">
            <!-- Main Headline -->
            <h1 class="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight animate-slideInDown">
                Advanced Polymer <span class="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Battery Solutions</span>
            </h1>

            <!-- Subheading -->
            <p class="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl leading-relaxed animate-slideInUp" style="animation-delay: 0.2s;">
                Engineered for performance. Designed for reliability. Powering tomorrow's wearables and medical devices with precision-crafted lithium polymer batteries.
            </p>

            <!-- Stats Row -->
            <div class="grid grid-cols-3 md:grid-cols-4 gap-6 mb-12 max-w-2xl">
                <div class="animate-slideInUp" style="animation-delay: 0.4s;">
                    <div class="text-4xl font-bold text-cyan-400 counter" data-target="500000">0</div>
                    <p class="text-sm text-blue-200 mt-2">Units Produced</p>
                </div>
                <div class="animate-slideInUp" style="animation-delay: 0.5s;">
                    <div class="text-4xl font-bold text-cyan-400 counter" data-target="50">0</div>
                    <p class="text-sm text-blue-200 mt-2">Countries Served</p>
                </div>
                <div class="animate-slideInUp" style="animation-delay: 0.6s;">
                    <div class="text-4xl font-bold text-cyan-400 counter" data-target="6">0</div>
                    <p class="text-sm text-blue-200 mt-2">Years Experience</p>
                </div>
                <div class="hidden md:block animate-slideInUp" style="animation-delay: 0.7s;">
                    <div class="text-4xl font-bold text-cyan-400">99.8%</div>
                    <p class="text-sm text-blue-200 mt-2">Quality Rate</p>
                </div>
            </div>

            <!-- CTA Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 animate-slideInUp" style="animation-delay: 0.8s;">
                <a href="#solutions" class="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 group">
                    Explore Solutions
                    <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                </a>
                <a href="/contact" class="inline-flex items-center justify-center px-8 py-4 border-2 border-cyan-400 text-cyan-400 font-bold rounded-lg hover:bg-cyan-400 hover:text-slate-900 transition-all duration-300">
                    Request Sample
                </a>
            </div>

            <!-- Scroll Indicator -->
            <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div class="flex flex-col items-center">
                    <p class="text-blue-300 text-sm mb-2">Scroll to discover</p>
                    <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                    </svg>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ============================================================
     SECTION 2: SOLUTIONS OVERVIEW
     ============================================================ -->
<section id="solutions" class="py-20 md:py-32 bg-white relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Section Header -->
        <div class="text-center mb-20" data-aos="fade-in">
            <span class="inline-block px-4 py-2 bg-cyan-100 text-cyan-600 rounded-full text-sm font-semibold mb-4">OUR SOLUTIONS</span>
            <h2 class="text-5xl md:text-6xl font-bold text-slate-900 mb-6">Comprehensive Battery Technology</h2>
            <p class="text-xl text-slate-600 max-w-3xl mx-auto">Two cutting-edge manufacturing processes engineered for different performance profiles</p>
        </div>

        <!-- Solutions Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <!-- Wound Cell Technology -->
            <div class="group relative" data-aos="fade-in-right">
                <div class="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div class="relative bg-white border-2 border-slate-200 group-hover:border-green-400 rounded-2xl p-8 transition-all duration-300">
                    <div class="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <i class="fas fa-circle text-white text-2xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-4">Wound Cell Technology</h3>
                    <p class="text-slate-600 mb-6">Cost-effective manufacturing with rapid turnaround times. Ideal for high-volume applications with proven reliability.</p>

                    <div class="space-y-4 mb-8">
                        <div class="flex items-center">
                            <span class="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                            <span class="text-slate-700"><strong>Internal Resistance:</strong> 70-85 mΩ</span>
                        </div>
                        <div class="flex items-center">
                            <span class="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                            <span class="text-slate-700"><strong>Cycle Life:</strong> >1000 cycles</span>
                        </div>
                        <div class="flex items-center">
                            <span class="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                            <span class="text-slate-700"><strong>Energy Density:</strong> 200+ Wh/L</span>
                        </div>
                        <div class="flex items-center">
                            <span class="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                            <span class="text-slate-700"><strong>Sample Lead Time:</strong> 3-5 days</span>
                        </div>
                    </div>

                    <a href="/products?process=wound" class="inline-block text-green-600 font-bold hover:text-green-700 transition-colors">
                        Explore Wound Cells <i class="fas fa-arrow-right ml-2"></i>
                    </a>
                </div>
            </div>

            <!-- Stacked Cell Technology -->
            <div class="group relative" data-aos="fade-in-left">
                <div class="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div class="relative bg-white border-2 border-slate-200 group-hover:border-purple-400 rounded-2xl p-8 transition-all duration-300">
                    <div class="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <i class="fas fa-layer-group text-white text-2xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-4">Stacked Cell Technology</h3>
                    <p class="text-slate-600 mb-6">Ultra-low impedance with exceptional cycle life. Premium performance for demanding medical and wearable applications.</p>

                    <div class="space-y-4 mb-8">
                        <div class="flex items-center">
                            <span class="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
                            <span class="text-slate-700"><strong>Internal Resistance:</strong> 25-35 mΩ</span>
                        </div>
                        <div class="flex items-center">
                            <span class="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
                            <span class="text-slate-700"><strong>Cycle Life:</strong> >2000 cycles</span>
                        </div>
                        <div class="flex items-center">
                            <span class="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
                            <span class="text-slate-700"><strong>Energy Density:</strong> 230+ Wh/L</span>
                        </div>
                        <div class="flex items-center">
                            <span class="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
                            <span class="text-slate-700"><strong>Sample Lead Time:</strong> 5-10 days</span>
                        </div>
                    </div>

                    <a href="/products?process=stacked" class="inline-block text-purple-600 font-bold hover:text-purple-700 transition-colors">
                        Explore Stacked Cells <i class="fas fa-arrow-right ml-2"></i>
                    </a>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ============================================================
     SECTION 3: CORE ADVANTAGES WITH ANIMATED STATS
     ============================================================ -->
<section class="py-20 md:py-32 bg-gradient-to-b from-slate-50 to-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-20" data-aos="fade-in">
            <h2 class="text-5xl md:text-6xl font-bold text-slate-900 mb-6">Why Choose ZUFEK</h2>
            <p class="text-xl text-slate-600 max-w-3xl mx-auto">Industry-leading expertise in polymer lithium battery innovation</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <!-- Advantage 1 -->
            <div class="group p-8 bg-white rounded-xl border-2 border-slate-200 hover:border-cyan-400 hover:shadow-xl transition-all duration-300" data-aos="fade-in-up">
                <div class="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                    <i class="fas fa-bolt text-cyan-600 group-hover:text-white"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">High Performance</h3>
                <p class="text-slate-600">Ultra-low internal resistance enables high-rate discharge with minimal energy loss</p>
            </div>

            <!-- Advantage 2 -->
            <div class="group p-8 bg-white rounded-xl border-2 border-slate-200 hover:border-green-400 hover:shadow-xl transition-all duration-300" data-aos="fade-in-up" style="animation-delay: 0.1s;">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500 group-hover:text-white transition-all">
                    <i class="fas fa-dollar-sign text-green-600 group-hover:text-white"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">Cost Optimized</h3>
                <p class="text-slate-600">Competitive pricing without compromising on quality or performance standards</p>
            </div>

            <!-- Advantage 3 -->
            <div class="group p-8 bg-white rounded-xl border-2 border-slate-200 hover:border-purple-400 hover:shadow-xl transition-all duration-300" data-aos="fade-in-up" style="animation-delay: 0.2s;">
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500 group-hover:text-white transition-all">
                    <i class="fas fa-rocket text-purple-600 group-hover:text-white"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">Rapid Delivery</h3>
                <p class="text-slate-600">Fast prototyping and sample production accelerates your time-to-market</p>
            </div>

            <!-- Advantage 4 -->
            <div class="group p-8 bg-white rounded-xl border-2 border-slate-200 hover:border-orange-400 hover:shadow-xl transition-all duration-300" data-aos="fade-in-up" style="animation-delay: 0.3s;">
                <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-all">
                    <i class="fas fa-check-circle text-orange-600 group-hover:text-white"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">Certified Quality</h3>
                <p class="text-slate-600">Comprehensive certifications meet global medical and industrial standards</p>
            </div>
        </div>
    </div>
</section>

<!-- ============================================================
     SECTION 4: TARGET MARKETS - Highlighted Applications
     ============================================================ -->
<section class="py-20 md:py-32 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-20" data-aos="fade-in">
            <span class="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">TARGET MARKETS</span>
            <h2 class="text-5xl md:text-6xl font-bold text-slate-900 mb-6">Powering Innovation Across Industries</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
            <!-- Wearables Market -->
            <div class="group" data-aos="fade-in-right">
                <div class="relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl overflow-hidden mb-6 h-80">
                    <div class="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-300"></div>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <i class="fas fa-watch text-8xl text-blue-200 group-hover:scale-110 transition-transform duration-300"></i>
                    </div>
                </div>
                <h3 class="text-2xl font-bold text-slate-900 mb-3">Wearable Devices</h3>
                <p class="text-slate-600 mb-6">Smartwatches, fitness trackers, AR glasses, and health monitoring devices demand compact, lightweight batteries with exceptional reliability.</p>
                <ul class="space-y-2 text-slate-700">
                    <li class="flex items-start">
                        <i class="fas fa-check text-cyan-500 mr-3 mt-1 flex-shrink-0"></i>
                        <span>Ultra-compact form factors</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-cyan-500 mr-3 mt-1 flex-shrink-0"></i>
                        <span>Long cycle life for daily use</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-cyan-500 mr-3 mt-1 flex-shrink-0"></i>
                        <span>Custom shapes available</span>
                    </li>
                </ul>
            </div>

            <!-- Medical Devices Market -->
            <div class="group" data-aos="fade-in-left">
                <div class="relative bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl overflow-hidden mb-6 h-80">
                    <div class="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 group-hover:from-red-500/30 group-hover:to-pink-500/30 transition-all duration-300"></div>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <i class="fas fa-heartbeat text-8xl text-red-200 group-hover:scale-110 transition-transform duration-300"></i>
                    </div>
                </div>
                <h3 class="text-2xl font-bold text-slate-900 mb-3">Medical Devices</h3>
                <p class="text-slate-600 mb-6">Portable diagnostic equipment, patient monitors, and implantable devices require medical-grade batteries with highest safety standards.</p>
                <ul class="space-y-2 text-slate-700">
                    <li class="flex items-start">
                        <i class="fas fa-check text-red-500 mr-3 mt-1 flex-shrink-0"></i>
                        <span>FDA & UL2054 certified</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-red-500 mr-3 mt-1 flex-shrink-0"></i>
                        <span>Biocompatible materials</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-red-500 mr-3 mt-1 flex-shrink-0"></i>
                        <span>Extended reliability testing</span>
                    </li>
                </ul>
            </div>
        </div>

        <!-- IoT and Other Markets -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div class="p-6 bg-slate-50 rounded-xl hover:shadow-lg transition-all" data-aos="fade-in-up">
                <i class="fas fa-cube text-4xl text-amber-500 mb-4"></i>
                <h4 class="text-lg font-bold text-slate-900 mb-2">IoT Sensors</h4>
                <p class="text-slate-600 text-sm">Connected devices requiring minimal power with maximum uptime</p>
            </div>
            <div class="p-6 bg-slate-50 rounded-xl hover:shadow-lg transition-all" data-aos="fade-in-up" style="animation-delay: 0.1s;">
                <i class="fas fa-power-off text-4xl text-green-500 mb-4"></i>
                <h4 class="text-lg font-bold text-slate-900 mb-2">Power Tools</h4>
                <p class="text-slate-600 text-sm">High-rate batteries for cordless tools and equipment</p>
            </div>
            <div class="p-6 bg-slate-50 rounded-xl hover:shadow-lg transition-all" data-aos="fade-in-up" style="animation-delay: 0.2s;">
                <i class="fas fa-building text-4xl text-blue-500 mb-4"></i>
                <h4 class="text-lg font-bold text-slate-900 mb-2">Smart Home</h4>
                <p class="text-slate-600 text-sm">IoT devices for connected home automation systems</p>
            </div>
        </div>
    </div>
</section>

<!-- ============================================================
     SECTION 5: CERTIFICATION SHOWCASE
     ============================================================ -->
<section class="py-20 md:py-32 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-20" data-aos="fade-in">
            <h2 class="text-5xl md:text-6xl font-bold mb-6">Global Certifications & Compliance</h2>
            <p class="text-xl text-slate-300 max-w-3xl mx-auto">ZUFEK batteries meet the highest international standards for safety, quality, and performance</p>
        </div>

        <!-- Certificates Carousel -->
        <div class="relative">
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                <!-- UL Certification -->
                <div class="group p-8 bg-white/10 backdrop-blur rounded-xl border border-white/20 hover:border-cyan-400 hover:bg-white/20 transition-all text-center" data-aos="fade-in-up">
                    <div class="text-5xl mb-4">🔒</div>
                    <h4 class="font-bold mb-2">UL2054</h4>
                    <p class="text-sm text-slate-300">Safety Standard</p>
                </div>

                <!-- CE Certification -->
                <div class="group p-8 bg-white/10 backdrop-blur rounded-xl border border-white/20 hover:border-cyan-400 hover:bg-white/20 transition-all text-center" data-aos="fade-in-up" style="animation-delay: 0.1s;">
                    <div class="text-5xl mb-4">✓</div>
                    <h4 class="font-bold mb-2">CE Mark</h4>
                    <p class="text-sm text-slate-300">European Compliance</p>
                </div>

                <!-- FDA -->
                <div class="group p-8 bg-white/10 backdrop-blur rounded-xl border border-white/20 hover:border-cyan-400 hover:bg-white/20 transition-all text-center" data-aos="fade-in-up" style="animation-delay: 0.2s;">
                    <div class="text-5xl mb-4">⚕️</div>
                    <h4 class="font-bold mb-2">FDA</h4>
                    <p class="text-sm text-slate-300">Medical Approval</p>
                </div>

                <!-- RoHS -->
                <div class="group p-8 bg-white/10 backdrop-blur rounded-xl border border-white/20 hover:border-cyan-400 hover:bg-white/20 transition-all text-center" data-aos="fade-in-up" style="animation-delay: 0.3s;">
                    <div class="text-5xl mb-4">♻️</div>
                    <h4 class="font-bold mb-2">RoHS</h4>
                    <p class="text-sm text-slate-300">Environmental</p>
                </div>

                <!-- FCC -->
                <div class="group p-8 bg-white/10 backdrop-blur rounded-xl border border-white/20 hover:border-cyan-400 hover:bg-white/20 transition-all text-center" data-aos="fade-in-up" style="animation-delay: 0.4s;">
                    <div class="text-5xl mb-4">📡</div>
                    <h4 class="font-bold mb-2">FCC</h4>
                    <p class="text-sm text-slate-300">EMI Compliance</p>
                </div>

                <!-- ISO 9001 -->
                <div class="group p-8 bg-white/10 backdrop-blur rounded-xl border border-white/20 hover:border-cyan-400 hover:bg-white/20 transition-all text-center" data-aos="fade-in-up" style="animation-delay: 0.5s;">
                    <div class="text-5xl mb-4">🏆</div>
                    <h4 class="font-bold mb-2">ISO 9001</h4>
                    <p class="text-sm text-slate-300">Quality Management</p>
                </div>
            </div>
        </div>

        <div class="text-center mt-12" data-aos="fade-in">
            <p class="text-slate-300 mb-6">All certifications validated and regularly audited to ensure continuous compliance</p>
            <a href="/about#certifications" class="inline-block px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all duration-300">
                View Full Certification Details
            </a>
        </div>
    </div>
</section>

<!-- ============================================================
     SECTION 6: FEATURED PRODUCTS
     ============================================================ -->
<section class="py-20 md:py-32 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-20" data-aos="fade-in">
            <span class="inline-block px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-semibold mb-4">PRODUCT PORTFOLIO</span>
            <h2 class="text-5xl md:text-6xl font-bold text-slate-900 mb-6">Engineered Excellence</h2>
            <p class="text-xl text-slate-600 max-w-3xl mx-auto">Explore our comprehensive range of polymer battery solutions</p>
        </div>

        @if($products && $products->count() > 0)
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                @foreach($products->take(6) as $product)
                    <div class="group bg-white border-2 border-slate-200 rounded-xl overflow-hidden hover:border-cyan-400 hover:shadow-2xl transition-all duration-300" data-aos="fade-in-up">
                        <div class="relative h-56 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
                            <i class="fas fa-battery-full text-8xl text-slate-300 group-hover:scale-110 transition-transform duration-300"></i>
                        </div>
                        <div class="p-6">
                            <h3 class="text-xl font-bold text-slate-900 mb-2">{{ $product->name }}</h3>
                            <p class="text-slate-600 text-sm mb-4">{{ Str::limit($product->description, 80) }}</p>

                            <div class="grid grid-cols-2 gap-3 mb-6 text-sm">
                                @if($product->capacity)
                                    <div class="bg-slate-50 p-3 rounded">
                                        <span class="text-slate-600">Capacity</span>
                                        <p class="font-bold text-slate-900">{{ $product->capacity }}mAh</p>
                                    </div>
                                @endif
                                @if($product->internal_resistance)
                                    <div class="bg-slate-50 p-3 rounded">
                                        <span class="text-slate-600">Impedance</span>
                                        <p class="font-bold text-slate-900">{{ $product->internal_resistance }}mΩ</p>
                                    </div>
                                @endif
                            </div>

                            <a href="{{ route('products.show', $product->slug) }}" class="block w-full text-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg transition-all">
                                View Details
                            </a>
                        </div>
                    </div>
                @endforeach
            </div>

            <div class="text-center mt-16">
                <a href="/products" class="inline-block px-8 py-4 border-2 border-slate-900 text-slate-900 font-bold rounded-lg hover:bg-slate-900 hover:text-white transition-all duration-300">
                    Browse All Products
                </a>
            </div>
        @endif
    </div>
</section>

<!-- ============================================================
     SECTION 7: CTA - Get in Touch
     ============================================================ -->
<section class="py-20 md:py-32 bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-5xl md:text-6xl font-bold mb-6" data-aos="fade-in">Ready to Power Your Innovation?</h2>
        <p class="text-xl text-cyan-50 mb-12 max-w-2xl mx-auto" data-aos="fade-in" data-aos-delay="200">
            Let's discuss how ZUFEK polymer lithium batteries can enhance your product performance
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center" data-aos="fade-in" data-aos-delay="400">
            <a href="/contact" class="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-slate-100 transition-all duration-300 shadow-lg hover:shadow-2xl">
                <i class="fas fa-envelope mr-2"></i>
                Send Inquiry
            </a>
            <a href="tel:+1234567890" class="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/20 transition-all duration-300">
                <i class="fas fa-phone mr-2"></i>
                Call Us
            </a>
        </div>
    </div>
</section>

@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Counter animation
    const counters = document.querySelectorAll('.counter');
    const speed = 200;
    const options = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                const target = parseInt(entry.target.dataset.target);
                const increment = target / speed;
                let current = 0;

                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        entry.target.textContent = target.toLocaleString();
                        entry.target.classList.add('counted');
                        clearInterval(timer);
                    } else {
                        entry.target.textContent = Math.floor(current).toLocaleString();
                    }
                }, 10);

                observer.unobserve(entry.target);
            }
        });
    }, options);

    counters.forEach(counter => observer.observe(counter));
});
</script>
@endpush
