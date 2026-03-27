@extends('layouts.app')

@section('title', 'About ZUFEK - Polymer Battery Innovation Leader')
@section('description', 'Learn about ZUFEK\'s journey in polymer lithium battery innovation, our mission, team, and commitment to excellence in battery technology.')

@section('content')

<!-- ============================================================
     HERO SECTION
     ============================================================ -->
<section class="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden pt-20">
    <!-- Animated Background -->
    <div class="absolute inset-0 overflow-hidden">
        <div class="absolute top-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div class="absolute bottom-20 left-20 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse" style="animation-delay: 1s;"></div>
    </div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-screen flex items-center">
        <div class="w-full">
            <span class="inline-block px-4 py-2 bg-cyan-500/30 text-cyan-300 rounded-full text-sm font-semibold mb-4 backdrop-blur">ABOUT ZUFEK</span>
            <h1 class="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Innovating Battery <span class="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Technology</span> Since 2018
            </h1>
            <p class="text-xl text-blue-100 max-w-3xl leading-relaxed">
                ZUFEK is a pioneer in polymer lithium battery manufacturing, dedicated to delivering cutting-edge battery solutions for wearables, medical devices, and IoT applications worldwide.
            </p>
        </div>
    </div>
</section>

<!-- ============================================================
     COMPANY OVERVIEW
     ============================================================ -->
<section class="py-20 md:py-32 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Left Content -->
            <div data-aos="fade-in-right">
                <h2 class="text-5xl md:text-6xl font-bold text-slate-900 mb-6">Who We Are</h2>
                <p class="text-lg text-slate-600 mb-6 leading-relaxed">
                    Founded in 2018 in Dongguan, China, ZUFEK has established itself as a leading manufacturer of polymer lithium batteries. Our commitment to innovation, quality, and customer satisfaction has made us the trusted choice for global technology companies.
                </p>
                <p class="text-lg text-slate-600 mb-8 leading-relaxed">
                    With over 6 years of industry expertise, we've produced more than 500,000 units serving 50+ countries across diverse industries. Our state-of-the-art manufacturing facilities combine traditional craftsmanship with cutting-edge technology.
                </p>

                <div class="grid grid-cols-3 gap-6">
                    <div class="text-center">
                        <div class="text-4xl font-bold text-cyan-600 mb-2">6+</div>
                        <p class="text-slate-600 text-sm">Years Operating</p>
                    </div>
                    <div class="text-center">
                        <div class="text-4xl font-bold text-cyan-600 mb-2">50+</div>
                        <p class="text-slate-600 text-sm">Countries Served</p>
                    </div>
                    <div class="text-center">
                        <div class="text-4xl font-bold text-cyan-600 mb-2">99.8%</div>
                        <p class="text-slate-600 text-sm">Quality Rate</p>
                    </div>
                </div>
            </div>

            <!-- Right Visual -->
            <div class="relative" data-aos="fade-in-left">
                <div class="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur rounded-2xl p-8 border border-cyan-500/30">
                    <div class="aspect-square bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center">
                        <i class="fas fa-battery-full text-white text-9xl opacity-50"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ============================================================
     MISSION & VISION
     ============================================================ -->
<section class="py-20 md:py-32 bg-gradient-to-b from-slate-50 to-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
            <!-- Mission -->
            <div class="p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-cyan-400 hover:shadow-xl transition-all" data-aos="fade-in-up">
                <div class="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center mb-6">
                    <i class="fas fa-rocket text-white text-2xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-slate-900 mb-4">Our Mission</h3>
                <p class="text-slate-600 leading-relaxed">
                    To empower innovation worldwide by delivering reliable, high-performance polymer lithium batteries that enable the next generation of wearable and medical devices.
                </p>
            </div>

            <!-- Vision -->
            <div class="p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-purple-400 hover:shadow-xl transition-all" data-aos="fade-in-up" style="animation-delay: 0.1s;">
                <div class="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center mb-6">
                    <i class="fas fa-lightbulb text-white text-2xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-slate-900 mb-4">Our Vision</h3>
                <p class="text-slate-600 leading-relaxed">
                    To be the world's most trusted partner for advanced battery solutions, recognized for excellence in innovation, quality, and sustainability.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- ============================================================
     TIMELINE - Company Milestones
     ============================================================ -->
<section class="py-20 md:py-32 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-20" data-aos="fade-in">
            <h2 class="text-5xl md:text-6xl font-bold text-slate-900 mb-6">Our Journey</h2>
            <p class="text-xl text-slate-600 max-w-3xl mx-auto">Key milestones in ZUFEK's evolution</p>
        </div>

        <div class="relative">
            <!-- Timeline Line -->
            <div class="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-purple-500 md:transform md:-translate-x-1/2"></div>

            <!-- Timeline Events -->
            <div class="space-y-12">
                <!-- 2018 -->
                <div class="md:mb-8" data-aos="fade-in-right">
                    <div class="md:flex md:items-center">
                        <div class="md:w-1/2 md:pr-16 relative">
                            <div class="absolute right-0 top-4 w-8 h-8 bg-white border-4 border-cyan-500 rounded-full md:right-auto md:left-auto md:transform md:translate-x-1/2"></div>
                            <div class="bg-cyan-50 p-6 rounded-lg border-l-4 border-cyan-500 md:border-l-0 md:border-r-4 md:border-cyan-500 md:text-right">
                                <div class="text-sm font-bold text-cyan-600 mb-1">2018</div>
                                <h4 class="text-xl font-bold text-slate-900 mb-2">Founded</h4>
                                <p class="text-slate-600">ZUFEK established in Dongguan, China with focus on polymer lithium battery innovation</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 2020 -->
                <div class="md:mb-8" data-aos="fade-in-left">
                    <div class="md:flex md:items-center md:flex-row-reverse">
                        <div class="md:w-1/2 md:pl-16 relative">
                            <div class="absolute right-0 top-4 w-8 h-8 bg-white border-4 border-blue-500 rounded-full md:right-auto md:left-auto md:transform md:-translate-x-1/2"></div>
                            <div class="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500 md:border-l-0 md:border-r-4 md:border-blue-500 md:text-left ml-12 md:ml-0">
                                <div class="text-sm font-bold text-blue-600 mb-1">2020</div>
                                <h4 class="text-xl font-bold text-slate-900 mb-2">Global Expansion</h4>
                                <p class="text-slate-600">Expanded operations to 50+ countries with new manufacturing lines</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 2022 -->
                <div class="md:mb-8" data-aos="fade-in-right">
                    <div class="md:flex md:items-center">
                        <div class="md:w-1/2 md:pr-16 relative">
                            <div class="absolute right-0 top-4 w-8 h-8 bg-white border-4 border-purple-500 rounded-full md:right-auto md:left-auto md:transform md:translate-x-1/2"></div>
                            <div class="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500 md:border-l-0 md:border-r-4 md:border-purple-500 md:text-right">
                                <div class="text-sm font-bold text-purple-600 mb-1">2022</div>
                                <h4 class="text-xl font-bold text-slate-900 mb-2">Innovation Breakthrough</h4>
                                <p class="text-slate-600">Launched advanced stacked cell technology with ultra-low impedance</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 2024 -->
                <div data-aos="fade-in-left">
                    <div class="md:flex md:items-center md:flex-row-reverse">
                        <div class="md:w-1/2 md:pl-16 relative">
                            <div class="absolute right-0 top-4 w-8 h-8 bg-white border-4 border-cyan-500 rounded-full md:right-auto md:left-auto md:transform md:-translate-x-1/2"></div>
                            <div class="bg-cyan-50 p-6 rounded-lg border-l-4 border-cyan-500 md:border-l-0 md:border-r-4 md:border-cyan-500 md:text-left ml-12 md:ml-0">
                                <div class="text-sm font-bold text-cyan-600 mb-1">2024</div>
                                <h4 class="text-xl font-bold text-slate-900 mb-2">Reaching 500,000 Units</h4>
                                <p class="text-slate-600">Milestone achievement in battery production and customer satisfaction</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ============================================================
     CORE VALUES
     ============================================================ -->
<section class="py-20 md:py-32 bg-gradient-to-b from-slate-50 to-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-20" data-aos="fade-in">
            <h2 class="text-5xl md:text-6xl font-bold text-slate-900 mb-6">Our Core Values</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <!-- Innovation -->
            <div class="text-center p-8 hover:shadow-xl transition-all rounded-xl group" data-aos="fade-in-up">
                <div class="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <i class="fas fa-flask-vial text-white text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">Innovation</h3>
                <p class="text-slate-600">Continuous advancement in battery technology and manufacturing processes</p>
            </div>

            <!-- Quality -->
            <div class="text-center p-8 hover:shadow-xl transition-all rounded-xl group" data-aos="fade-in-up" style="animation-delay: 0.1s;">
                <div class="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <i class="fas fa-certificate text-white text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">Quality</h3>
                <p class="text-slate-600">Uncompromising standards in every battery we manufacture</p>
            </div>

            <!-- Reliability -->
            <div class="text-center p-8 hover:shadow-xl transition-all rounded-xl group" data-aos="fade-in-up" style="animation-delay: 0.2s;">
                <div class="w-20 h-20 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <i class="fas fa-shield text-white text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">Reliability</h3>
                <p class="text-slate-600">Consistent performance you can depend on in any environment</p>
            </div>

            <!-- Sustainability -->
            <div class="text-center p-8 hover:shadow-xl transition-all rounded-xl group" data-aos="fade-in-up" style="animation-delay: 0.3s;">
                <div class="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <i class="fas fa-leaf text-white text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">Sustainability</h3>
                <p class="text-slate-600">Environmental responsibility in manufacturing and recycling</p>
            </div>
        </div>
    </div>
</section>

<!-- ============================================================
     CERTIFICATIONS SECTION
     ============================================================ -->
<section id="certifications" class="py-20 md:py-32 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-20" data-aos="fade-in">
            <h2 class="text-5xl md:text-6xl font-bold text-slate-900 mb-6">Global Certifications</h2>
            <p class="text-xl text-slate-600 max-w-3xl mx-auto">ZUFEK maintains comprehensive certifications across all major markets</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- UL2054 -->
            <div class="p-8 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 hover:border-blue-500 hover:shadow-lg transition-all" data-aos="fade-in-up">
                <div class="text-5xl mb-4">🔒</div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">UL2054 Certification</h3>
                <p class="text-slate-600 mb-4">Standard for safety of Batteries for Use in Portable Electronics</p>
                <ul class="text-sm text-slate-600 space-y-2">
                    <li class="flex items-start">
                        <i class="fas fa-check text-cyan-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>Safety testing and validation</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-cyan-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>Performance evaluation</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-cyan-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>Annual audits</span>
                    </li>
                </ul>
            </div>

            <!-- FDA -->
            <div class="p-8 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border-2 border-red-200 hover:border-red-500 hover:shadow-lg transition-all" data-aos="fade-in-up" style="animation-delay: 0.1s;">
                <div class="text-5xl mb-4">⚕️</div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">FDA Registration</h3>
                <p class="text-slate-600 mb-4">Medical Device Classification for healthcare applications</p>
                <ul class="text-sm text-slate-600 space-y-2">
                    <li class="flex items-start">
                        <i class="fas fa-check text-red-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>Biocompatibility testing</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-red-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>Clinical documentation</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-red-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>Traceability systems</span>
                    </li>
                </ul>
            </div>

            <!-- CE & RoHS -->
            <div class="p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:border-green-500 hover:shadow-lg transition-all" data-aos="fade-in-up" style="animation-delay: 0.2s;">
                <div class="text-5xl mb-4">✓</div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">CE & RoHS Compliance</h3>
                <p class="text-slate-600 mb-4">European standards and environmental compliance</p>
                <ul class="text-sm text-slate-600 space-y-2">
                    <li class="flex items-start">
                        <i class="fas fa-check text-green-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>European directives</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-green-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>Hazardous substance limits</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-green-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>Waste management</span>
                    </li>
                </ul>
            </div>

            <!-- ISO 9001 -->
            <div class="p-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 hover:border-amber-500 hover:shadow-lg transition-all" data-aos="fade-in-up" style="animation-delay: 0.3s;">
                <div class="text-5xl mb-4">🏆</div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">ISO 9001:2015</h3>
                <p class="text-slate-600 mb-4">Quality Management System certification</p>
                <ul class="text-sm text-slate-600 space-y-2">
                    <li class="flex items-start">
                        <i class="fas fa-check text-amber-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>Process management</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-amber-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>Customer satisfaction</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-amber-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>Continuous improvement</span>
                    </li>
                </ul>
            </div>

            <!-- FCC -->
            <div class="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 hover:border-purple-500 hover:shadow-lg transition-all" data-aos="fade-in-up" style="animation-delay: 0.4s;">
                <div class="text-5xl mb-4">📡</div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">FCC Compliance</h3>
                <p class="text-slate-600 mb-4">Electromagnetic interference compliance</p>
                <ul class="text-sm text-slate-600 space-y-2">
                    <li class="flex items-start">
                        <i class="fas fa-check text-purple-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>EMI/RFI testing</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-purple-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>Device safety</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-purple-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>Signal integrity</span>
                    </li>
                </ul>
            </div>

            <!-- IATA -->
            <div class="p-8 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border-2 border-slate-200 hover:border-slate-500 hover:shadow-lg transition-all" data-aos="fade-in-up" style="animation-delay: 0.5s;">
                <div class="text-5xl mb-4">✈️</div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">IATA Shipping</h3>
                <p class="text-slate-600 mb-4">Dangerous Goods Regulation compliance</p>
                <ul class="text-sm text-slate-600 space-y-2">
                    <li class="flex items-start">
                        <i class="fas fa-check text-slate-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>Air transport approval</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-slate-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>Packaging standards</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-slate-600 mr-2 mt-1 flex-shrink-0"></i>
                        <span>Documentation</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</section>

<!-- ============================================================
     CTA SECTION
     ============================================================ -->
<section class="py-20 md:py-32 bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-5xl md:text-6xl font-bold mb-6" data-aos="fade-in">Join Our Innovation Journey</h2>
        <p class="text-xl text-cyan-50 mb-12 max-w-2xl mx-auto" data-aos="fade-in" data-aos-delay="200">
            Experience the ZUFEK difference in polymer lithium battery excellence
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center" data-aos="fade-in" data-aos-delay="400">
            <a href="/contact" class="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-slate-100 transition-all duration-300 shadow-lg hover:shadow-2xl">
                <i class="fas fa-envelope mr-2"></i>
                Contact Us
            </a>
            <a href="/products" class="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/20 transition-all duration-300">
                <i class="fas fa-briefcase mr-2"></i>
                View Products
            </a>
        </div>
    </div>
</section>

@endsection
