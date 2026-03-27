<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'B2B Battery Solutions')</title>
    <meta name="description" content="@yield('description', 'Professional B2B battery solutions for AR glasses and electronic devices')">
    <meta name="robots" content="index, follow">

    @yield('schema')

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
            @apply px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition;
        }

        .btn-secondary {
            @apply px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition;
        }
    </style>
</head>
<body class="bg-gray-50">
    @include('components.cookie-banner')

    <nav class="bg-white shadow-md sticky top-0 z-40">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <a href="/" class="text-2xl font-bold text-blue-600">Raven Battery</a>
                <div class="hidden md:flex space-x-8">
                    <a href="/" class="text-gray-600 hover:text-blue-600 transition">Home</a>
                    <a href="/products" class="text-gray-600 hover:text-blue-600 transition">Products</a>
                    <a href="/about" class="text-gray-600 hover:text-blue-600 transition">About</a>
                    <a href="/contact" class="text-gray-600 hover:text-blue-600 transition">Contact</a>
                </div>
                <div class="md:hidden">
                    <button class="text-gray-600 hover:text-blue-600">
                        <i class="fas fa-bars text-2xl"></i>
                    </button>
                </div>
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

    <footer class="bg-gray-900 text-white mt-16">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <h3 class="text-xl font-bold mb-4">Raven Battery</h3>
                    <p class="text-gray-400">Professional B2B battery solutions for AR glasses and electronic devices.</p>
                </div>
                <div>
                    <h4 class="font-bold mb-4">Quick Links</h4>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="/products" class="hover:text-white transition">Products</a></li>
                        <li><a href="/about" class="hover:text-white transition">About Us</a></li>
                        <li><a href="/contact" class="hover:text-white transition">Contact</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4">Legal</h4>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="/privacy" class="hover:text-white transition">Privacy Policy</a></li>
                        <li><a href="/cookies" class="hover:text-white transition">Cookie Policy</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4">Contact</h4>
                    <p class="text-gray-400">
                        Email: sales@raven.com<br>
                        Phone: +1 (555) 123-4567
                    </p>
                </div>
            </div>
            <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                <p>&copy; 2024 Raven Battery. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>
