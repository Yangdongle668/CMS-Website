<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#0066cc">

    <title>@yield('title', 'ZUFEK - Advanced Polymer Lithium Battery Solutions')</title>
    <meta name="description" content="@yield('description', 'ZUFEK is a leading manufacturer of polymer lithium batteries for wearables, medical devices, and IoT applications. Premium quality with wound and stacked cell technology.')">
    <meta name="keywords" content="@yield('keywords', 'polymer lithium battery, wound cell, stacked cell, wearable battery, medical device battery, custom battery')">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
    <meta name="language" content="English">
    <meta name="author" content="ZUFEK TECHNOLOGY">

    <meta property="og:title" content="@yield('title', 'ZUFEK - Advanced Polymer Lithium Battery Solutions')">
    <meta property="og:description" content="@yield('description', 'Premium polymer lithium battery manufacturer for global markets')">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ url()->current() }}">
    @yield('og-image', '<meta property="og:image" content="' . url('/logo.png') . '">')

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="@yield('title', 'ZUFEK - Polymer Lithium Batteries')">
    <meta name="twitter:description" content="@yield('description', 'Advanced battery solutions for wearables and medical devices')">

    <link rel="canonical" href="{{ url()->current() }}">
    <link rel="alternate" hreflang="en" href="{{ url()->current() }}">

    @yield('schema')

    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        :root {
            --primary-color: #0066cc;
            --secondary-color: #00a8e1;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        }

        .btn-primary {
            @apply px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300;
        }

        .btn-secondary {
            @apply px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-300;
        }

        nav {
            transition: all 0.3s ease-in-out;
        }

        nav.scrolled {
            @apply shadow-lg;
        }

        .dropdown-menu {
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s ease-in-out;
            position: absolute;
            top: 100%;
            left: 0;
            z-index: 50;
        }

        .dropdown-group:hover .dropdown-menu {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .mobile-menu {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        }

        .mobile-menu.show {
            max-height: 500px;
        }

        @media (max-width: 768px) {
            .desktop-nav {
                display: none;
            }
        }

        @media (min-width: 769px) {
            .mobile-menu {
                display: none;
            }
        }
    </style>
</head>
<body class="bg-gray-50">
    @include('components.cookie-banner')

    <!-- Navigation Bar -->
    <nav id="mainNav" class="bg-white shadow-md sticky top-0 z-40 transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <!-- Logo -->
                <a href="/" class="flex items-center space-x-2 group">
                    <div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        Z
                    </div>
                    <div>
                        <div class="font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent text-lg">ZUFEK</div>
                        <div class="text-xs text-gray-600">Polymer Battery</div>
                    </div>
                </a>

                <!-- Desktop Navigation -->
                <div class="hidden md:flex items-center space-x-8">
                    <a href="/" class="text-gray-700 hover:text-cyan-600 font-medium transition-colors duration-300">
                        <i class="fas fa-home mr-2"></i>Home
                    </a>

                    <!-- Products Dropdown -->
                    <div class="dropdown-group relative">
                        <button class="text-gray-700 hover:text-cyan-600 font-medium transition-colors duration-300 flex items-center">
                            <i class="fas fa-battery-full mr-2"></i>Products
                            <i class="fas fa-chevron-down text-xs ml-1"></i>
                        </button>
                        <div class="dropdown-menu bg-white rounded-xl shadow-2xl mt-2 w-56 py-2 border border-gray-100">
                            <a href="/products" class="block px-4 py-2 text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors">
                                <i class="fas fa-th mr-2"></i>All Products
                            </a>
                            <a href="/products?process=wound" class="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors">
                                <i class="fas fa-circle text-green-500 mr-2" style="font-size: 6px;"></i>Wound Cell
                            </a>
                            <a href="/products?process=stacked" class="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                                <i class="fas fa-layer-group text-purple-500 mr-2"></i>Stacked Cell
                            </a>
                            <div class="border-t border-gray-200 my-2"></div>
                            <a href="/products/compare" class="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                <i class="fas fa-balance-scale mr-2"></i>Compare
                            </a>
                        </div>
                    </div>

                    <a href="/about" class="text-gray-700 hover:text-cyan-600 font-medium transition-colors duration-300">
                        <i class="fas fa-info-circle mr-2"></i>About
                    </a>

                    <a href="/contact" class="text-gray-700 hover:text-cyan-600 font-medium transition-colors duration-300">
                        <i class="fas fa-envelope mr-2"></i>Contact
                    </a>

                    <a href="/contact" class="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300">
                        Get Quote
                    </a>
                </div>

                <!-- Mobile Menu Button -->
                <div class="md:hidden">
                    <button id="mobileMenuBtn" class="text-gray-700 hover:text-blue-600 transition-colors duration-300">
                        <i class="fas fa-bars text-2xl"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Mobile Navigation Menu -->
        <div id="mobileMenu" class="mobile-menu bg-white border-t border-gray-200">
            <div class="px-4 py-3 space-y-2">
                <a href="/" class="block text-gray-700 hover:text-cyan-600 font-medium py-2 px-3 rounded-lg hover:bg-cyan-50 transition-colors">
                    <i class="fas fa-home mr-2"></i>Home
                </a>
                <a href="/products" class="block text-gray-700 hover:text-cyan-600 font-medium py-2 px-3 rounded-lg hover:bg-cyan-50 transition-colors">
                    <i class="fas fa-battery-full mr-2"></i>All Products
                </a>
                <a href="/products?process=wound" class="block text-gray-700 hover:text-green-600 font-medium py-2 px-3 pl-8 rounded-lg hover:bg-green-50 transition-colors">
                    <i class="fas fa-circle text-green-500 mr-2" style="font-size: 6px;"></i>Wound Cell
                </a>
                <a href="/products?process=stacked" class="block text-gray-700 hover:text-purple-600 font-medium py-2 px-3 pl-8 rounded-lg hover:bg-purple-50 transition-colors">
                    <i class="fas fa-layer-group text-purple-500 mr-2"></i>Stacked Cell
                </a>
                <a href="/products/compare" class="block text-gray-700 hover:text-blue-600 font-medium py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors">
                    <i class="fas fa-balance-scale mr-2"></i>Compare
                </a>
                <div class="border-t border-gray-200 my-2"></div>
                <a href="/about" class="block text-gray-700 hover:text-cyan-600 font-medium py-2 px-3 rounded-lg hover:bg-cyan-50 transition-colors">
                    <i class="fas fa-info-circle mr-2"></i>About
                </a>
                <a href="/contact" class="block text-gray-700 hover:text-cyan-600 font-medium py-2 px-3 rounded-lg hover:bg-cyan-50 transition-colors">
                    <i class="fas fa-envelope mr-2"></i>Contact
                </a>
                <a href="/contact" class="block w-full px-4 py-2 mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg text-center hover:shadow-lg transition-all duration-300">
                    Get Quote
                </a>
            </div>
        </div>
    </nav>

    <main>
        @if ($errors->any())
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-6xl mx-auto mt-4">
                <strong>Please correct the following errors:</strong>
                <ul class="mt-2 list-disc list-inside">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        @if (session('success'))
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded max-w-6xl mx-auto mt-4">
                {{ session('success') }}
            </div>
        @endif

        @yield('content')
    </main>

    <!-- Footer -->
    <footer class="bg-gradient-to-b from-gray-900 to-gray-950 text-white mt-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Main Footer Content -->
            <div class="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <!-- Company Info -->
                <div>
                    <div class="flex items-center space-x-2 mb-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                            Z
                        </div>
                        <div>
                            <div class="font-bold text-lg">ZUFEK</div>
                            <div class="text-xs text-gray-400">Polymer Battery Expert</div>
                        </div>
                    </div>
                    <p class="text-gray-400 text-sm leading-relaxed">
                        DONGGUAN ZUFEK TECHNOLOGY CO.,LTD specializes in research, development, and manufacturing of polymer lithium batteries for wearables and medical devices worldwide.
                    </p>
                </div>

                <!-- Quick Links -->
                <div>
                    <h4 class="font-bold text-lg mb-4 flex items-center">
                        <i class="fas fa-link text-cyan-400 mr-2"></i>Quick Links
                    </h4>
                    <ul class="space-y-3 text-gray-400 text-sm">
                        <li><a href="/" class="hover:text-cyan-400 transition-colors duration-300"><i class="fas fa-chevron-right mr-2"></i>Home</a></li>
                        <li><a href="/products" class="hover:text-cyan-400 transition-colors duration-300"><i class="fas fa-chevron-right mr-2"></i>Products</a></li>
                        <li><a href="/about" class="hover:text-cyan-400 transition-colors duration-300"><i class="fas fa-chevron-right mr-2"></i>About Us</a></li>
                        <li><a href="/contact" class="hover:text-cyan-400 transition-colors duration-300"><i class="fas fa-chevron-right mr-2"></i>Contact</a></li>
                    </ul>
                </div>

                <!-- Products -->
                <div>
                    <h4 class="font-bold text-lg mb-4 flex items-center">
                        <i class="fas fa-battery-full text-green-400 mr-2"></i>Products
                    </h4>
                    <ul class="space-y-3 text-gray-400 text-sm">
                        <li><a href="/products?process=wound" class="hover:text-green-400 transition-colors duration-300"><i class="fas fa-circle text-green-500 mr-2" style="font-size: 6px;"></i>Wound Cell Batteries</a></li>
                        <li><a href="/products?process=stacked" class="hover:text-purple-400 transition-colors duration-300"><i class="fas fa-layer-group text-purple-500 mr-2"></i>Stacked Cell Batteries</a></li>
                        <li><a href="/products/compare" class="hover:text-cyan-400 transition-colors duration-300"><i class="fas fa-balance-scale mr-2"></i>Compare Products</a></li>
                        <li><a href="/contact" class="hover:text-orange-400 transition-colors duration-300"><i class="fas fa-pen-nib mr-2"></i>Custom Shapes</a></li>
                    </ul>
                </div>

                <!-- Contact Info -->
                <div>
                    <h4 class="font-bold text-lg mb-4 flex items-center">
                        <i class="fas fa-phone text-cyan-400 mr-2"></i>Contact Us
                    </h4>
                    <ul class="space-y-3 text-gray-400 text-sm">
                        <li>
                            <span class="text-gray-500">Email:</span><br>
                            <a href="mailto:sales@zufek.com" class="hover:text-cyan-400 transition-colors">sales@zufek.com</a>
                        </li>
                        <li>
                            <span class="text-gray-500">Phone:</span><br>
                            <a href="tel:+8613800138000" class="hover:text-cyan-400 transition-colors">+86 138 0013 8000</a>
                        </li>
                        <li>
                            <span class="text-gray-500">Location:</span><br>
                            <span>Dongguan, Guangdong, China</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Divider -->
            <div class="border-t border-gray-800 my-8"></div>

            <!-- Bottom Footer -->
            <div class="py-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
                <div class="mb-4 md:mb-0">
                    <p>&copy; 2024 DONGGUAN ZUFEK TECHNOLOGY. All rights reserved.</p>
                </div>
                <div class="flex space-x-6">
                    <a href="/privacy" class="hover:text-cyan-400 transition-colors">Privacy Policy</a>
                    <a href="/cookies" class="hover:text-cyan-400 transition-colors">Cookie Policy</a>
                </div>
            </div>
        </div>
    </footer>

    <!-- Mobile Menu Script -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const mobileMenu = document.getElementById('mobileMenu');
            const mainNav = document.getElementById('mainNav');

            // Mobile menu toggle
            if (mobileMenuBtn) {
                mobileMenuBtn.addEventListener('click', function() {
                    mobileMenu.classList.toggle('show');
                    this.innerHTML = mobileMenu.classList.contains('show')
                        ? '<i class="fas fa-times text-2xl"></i>'
                        : '<i class="fas fa-bars text-2xl"></i>';
                });
            }

            // Close mobile menu when clicking on a link
            const mobileMenuLinks = document.querySelectorAll('#mobileMenu a');
            mobileMenuLinks.forEach(link => {
                link.addEventListener('click', function() {
                    mobileMenu.classList.remove('show');
                    if (mobileMenuBtn) {
                        mobileMenuBtn.innerHTML = '<i class="fas fa-bars text-2xl"></i>';
                    }
                });
            });

            // Sticky nav effect
            window.addEventListener('scroll', function() {
                if (window.scrollY > 100) {
                    mainNav.classList.add('scrolled');
                } else {
                    mainNav.classList.remove('scrolled');
                }
            });
        });
    </script>
</body>
</html>
