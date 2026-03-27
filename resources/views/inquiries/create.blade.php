@extends('layouts.app')

@section('title', 'Contact Us - B2B Battery Solutions')
@section('description', 'Get in touch with our sales team for bulk orders, custom solutions, and partnerships.')

@section('content')
<section class="py-12">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
            <h1 class="text-4xl font-bold text-gray-800 mb-4">Contact Us</h1>
            <p class="text-gray-600 text-lg">Have questions? We're here to help. Send us an inquiry and our sales team will respond within 24 hours.</p>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-8">
            <form action="{{ route('inquiries.store') }}" method="POST">
                @csrf

                <!-- Product Selection (if not pre-selected) -->
                @if(!$product)
                    <div class="mb-6">
                        <label for="product_id" class="block text-sm font-semibold text-gray-700 mb-2">
                            Interested Product (Optional)
                        </label>
                        <select name="product_id" id="product_id" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
                            <option value="">-- Select a product --</option>
                            @foreach($products as $prod)
                                <option value="{{ $prod->id }}">{{ $prod->name }} @if($prod->model)- {{ $prod->model }} @endif</option>
                            @endforeach
                        </select>
                    </div>
                @else
                    <div class="mb-6 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                        <p class="text-sm text-gray-600">Interested Product:</p>
                        <p class="text-lg font-bold text-cyan-600">{{ $product->name }}</p>
                        <input type="hidden" name="product_id" value="{{ $product->id }}">
                    </div>
                @endif

                <!-- Name -->
                <div class="mb-6">
                    <label for="name" class="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name <span class="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        value="{{ old('name') }}"
                        required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent @error('name') border-red-500 @enderror"
                        placeholder="John Doe"
                    >
                    @error('name')
                        <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Email -->
                <div class="mb-6">
                    <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address <span class="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        value="{{ old('email') }}"
                        required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent @error('email') border-red-500 @enderror"
                        placeholder="john@company.com"
                    >
                    @error('email')
                        <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Message -->
                <div class="mb-6">
                    <label for="message" class="block text-sm font-semibold text-gray-700 mb-2">
                        Message <span class="text-red-500">*</span>
                    </label>
                    <textarea
                        name="message"
                        id="message"
                        rows="6"
                        required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent @error('message') border-red-500 @enderror"
                        placeholder="Tell us about your inquiry, requirements, or custom needs..."
                    >{{ old('message') }}</textarea>
                    @error('message')
                        <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Submit Button -->
                <button
                    type="submit"
                    class="w-full btn-primary text-center font-bold text-lg py-3"
                >
                    <i class="fas fa-paper-plane mr-2"></i> Send Inquiry
                </button>

                <p class="text-center text-gray-500 text-sm mt-4">
                    We respect your privacy. Your information will only be used to respond to your inquiry.
                </p>
            </form>
        </div>

        <!-- Contact Information -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div class="text-center">
                <i class="fas fa-envelope text-cyan-600 text-4xl mb-4"></i>
                <h3 class="font-bold text-gray-800 mb-2">Email</h3>
                <p class="text-gray-600">sales@zufek.com</p>
            </div>
            <div class="text-center">
                <i class="fas fa-phone text-cyan-600 text-4xl mb-4"></i>
                <h3 class="font-bold text-gray-800 mb-2">Phone</h3>
                <p class="text-gray-600">+86 138 0013 8000</p>
            </div>
            <div class="text-center">
                <i class="fas fa-map-marker-alt text-cyan-600 text-4xl mb-4"></i>
                <h3 class="font-bold text-gray-800 mb-2">Address</h3>
                <p class="text-gray-600">Dongguan, Guangdong, China</p>
            </div>
        </div>
    </div>
</section>
@endsection
