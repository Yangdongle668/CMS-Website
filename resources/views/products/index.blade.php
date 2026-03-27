@extends('layouts.app')

@section('title', '聚合物锂电池产品 - ZUFEK 聚合物电池供应商')
@section('description', '浏览ZUFEK的完整产品线：卷绕工艺、叠片工艺、异形电池。可穿戴设备和医疗设备电池解决方案。')

@section('content')
<!-- Hero Section -->
<section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-4xl md:text-5xl font-bold mb-4 animate-slideInDown">ZUFEK 聚合物电池产品</h1>
        <p class="text-xl text-blue-100 max-w-2xl animate-slideInUp" style="animation-delay: 0.2s;">
            卷绕工艺、叠片工艺、异形定制——为可穿戴设备和医疗设备提供专业的电池解决方案
        </p>
    </div>
</section>

<section class="py-12 bg-white">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Filters Section -->
        <div class="mb-12" data-aos="fade-in">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">筛选产品</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Process Type Filter -->
                <div class="group">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">工艺类型</label>
                    <select id="processFilter" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-400">
                        <option value="">全部工艺</option>
                        <option value="wound">卷绕工艺</option>
                        <option value="stacked">叠片工艺</option>
                    </select>
                </div>

                <!-- Application Filter -->
                <div class="group">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">应用领域</label>
                    <select id="applicationFilter" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-400">
                        <option value="">全部应用</option>
                        <option value="可穿戴">可穿戴设备</option>
                        <option value="医疗">医疗设备</option>
                    </select>
                </div>

                <!-- Capacity Filter -->
                <div class="group">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">容量范围</label>
                    <select id="capacityFilter" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-400">
                        <option value="">全部容量</option>
                        <option value="300-600">300-600 mAh</option>
                        <option value="600-1000">600-1000 mAh</option>
                        <option value="1000-2000">1000-2000 mAh</option>
                        <option value="2000+">2000+ mAh</option>
                    </select>
                </div>

                <!-- Sort Filter -->
                <div class="group">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">排序方式</label>
                    <select id="sortFilter" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-400">
                        <option value="default">默认排序</option>
                        <option value="capacity-asc">容量：低到高</option>
                        <option value="capacity-desc">容量：高到低</option>
                        <option value="resistance-asc">内阻：低到高</option>
                    </select>
                </div>
            </div>

            <div class="mt-4">
                <button id="resetFilters" class="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors">
                    <i class="fas fa-redo mr-2"></i>重置筛选
                </button>
            </div>
        </div>

        <!-- Products Grid -->
        @if($products->count() > 0)
            <div class="mb-8">
                <p class="text-gray-600 text-sm">
                    共 <span class="font-bold text-blue-600">{{ $products->total() }}</span> 个产品
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12" id="productsGrid">
                @foreach($products as $product)
                    <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group product-card"
                         data-process="{{ $product->process_type }}"
                         data-capacity="{{ $product->capacity }}"
                         data-applications="{{ $product->applications }}"
                         data-aos="fade-in-up"
                         data-aos-delay="{{ $loop->index % 3 * 100 }}">

                        <!-- Image Section -->
                        @if($product->image)
                            <div class="relative overflow-hidden h-56">
                                <img src="{{ asset('storage/' . $product->image) }}" alt="{{ $product->name }}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                                @if($product->process_type)
                                    <div class="absolute top-4 right-4">
                                        @if($product->process_type === 'wound')
                                            <span class="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">卷绕工艺</span>
                                        @else
                                            <span class="inline-block bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">叠片工艺</span>
                                        @endif
                                    </div>
                                @endif
                            </div>
                        @else
                            <div class="relative h-56 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all">
                                <i class="fas fa-battery-full text-blue-600 text-6xl group-hover:scale-125 transition-transform"></i>
                                @if($product->process_type)
                                    <div class="absolute top-4 right-4">
                                        @if($product->process_type === 'wound')
                                            <span class="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">卷绕工艺</span>
                                        @else
                                            <span class="inline-block bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">叠片工艺</span>
                                        @endif
                                    </div>
                                @endif
                            </div>
                        @endif

                        <!-- Content Section -->
                        <div class="p-6">
                            <h3 class="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{{ $product->name }}</h3>

                            @if($product->model)
                                <p class="text-gray-500 text-sm mb-3">
                                    <i class="fas fa-microchip text-blue-600 mr-2"></i>
                                    <span class="font-semibold">{{ $product->model }}</span>
                                </p>
                            @endif

                            <p class="text-gray-600 text-sm mb-4 line-clamp-2">{{ $product->description }}</p>

                            <!-- Key Specs -->
                            <div class="grid grid-cols-2 gap-3 mb-6 text-sm bg-gray-50 p-4 rounded-lg">
                                @if($product->capacity)
                                    <div>
                                        <span class="text-gray-600 text-xs">容量</span>
                                        <p class="font-bold text-gray-800">{{ $product->capacity }}<span class="text-xs ml-1">mAh</span></p>
                                    </div>
                                @endif
                                @if($product->voltage)
                                    <div>
                                        <span class="text-gray-600 text-xs">电压</span>
                                        <p class="font-bold text-gray-800">{{ $product->voltage }}<span class="text-xs ml-1">V</span></p>
                                    </div>
                                @endif
                                @if($product->internal_resistance)
                                    <div>
                                        <span class="text-gray-600 text-xs">内阻</span>
                                        <p class="font-bold text-blue-600">{{ $product->internal_resistance }}<span class="text-xs ml-1">mΩ</span></p>
                                    </div>
                                @endif
                                @if($product->cycle_life)
                                    <div>
                                        <span class="text-gray-600 text-xs">循环</span>
                                        <p class="font-bold text-gray-800">{{ $product->cycle_life }}</p>
                                    </div>
                                @endif
                            </div>

                            <!-- Highlights -->
                            @if($product->highlights)
                                <p class="text-sm text-blue-600 mb-4 line-clamp-2">
                                    <i class="fas fa-star text-yellow-400 mr-1"></i>
                                    {{ $product->highlights }}
                                </p>
                            @endif

                            <!-- Action Button -->
                            <a href="{{ route('products.show', $product->slug) }}" class="btn-primary text-center block hover:shadow-lg hover:scale-105 transition-all duration-300">
                                <i class="fas fa-arrow-right mr-2"></i>查看详情
                            </a>
                        </div>
                    </div>
                @endforeach
            </div>

            <!-- Pagination -->
            <div class="flex justify-center items-center space-x-4 mt-12">
                {{ $products->links() }}
            </div>
        @else
            <div class="text-center py-20">
                <i class="fas fa-inbox text-gray-300 text-7xl mb-4"></i>
                <p class="text-gray-600 text-xl mb-2">未找到相关产品</p>
                <p class="text-gray-500 text-sm">请尝试调整筛选条件</p>
                <button id="resetFilters" class="mt-6 text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                    <i class="fas fa-redo mr-2"></i>重置筛选
                </button>
            </div>
        @endif
    </div>
</section>

<!-- CTA Section -->
<section class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold mb-4">没找到合适的产品？</h2>
        <p class="text-blue-100 text-lg mb-8">ZUFEK支持异形电池定制，根据您的需求设计专属解决方案</p>
        <a href="/contact" class="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 hover:shadow-lg transition-all duration-300">
            <i class="fas fa-envelope mr-2"></i>发送定制询盘
        </a>
    </div>
</section>

@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const processFilter = document.getElementById('processFilter');
    const applicationFilter = document.getElementById('applicationFilter');
    const capacityFilter = document.getElementById('capacityFilter');
    const sortFilter = document.getElementById('sortFilter');
    const resetButton = document.getElementById('resetFilters');
    const productsGrid = document.getElementById('productsGrid');
    const productCards = document.querySelectorAll('.product-card');

    function filterProducts() {
        const processValue = processFilter.value.toLowerCase();
        const applicationValue = applicationFilter.value.toLowerCase();
        const capacityValue = capacityFilter.value;

        let visibleCount = 0;

        productCards.forEach(card => {
            let show = true;

            // Process filter
            if (processValue && !card.dataset.process.includes(processValue)) {
                show = false;
            }

            // Application filter
            if (applicationValue && !card.dataset.applications.toLowerCase().includes(applicationValue)) {
                show = false;
            }

            // Capacity filter
            if (capacityValue) {
                const capacity = parseInt(card.dataset.capacity);
                const [min, max] = capacityValue.includes('+')
                    ? [parseInt(capacityValue), Infinity]
                    : capacityValue.split('-').map(Number);

                if (capacity < min || capacity > max) {
                    show = false;
                }
            }

            card.style.display = show ? 'block' : 'none';
            if (show) visibleCount++;
        });

        // Show no results message if needed
        if (visibleCount === 0 && productsGrid) {
            // Could add dynamic no results message here
        }
    }

    function sortProducts() {
        const sortValue = sortFilter.value;
        const cardsArray = Array.from(productCards).filter(card => card.style.display !== 'none');

        cardsArray.sort((a, b) => {
            switch(sortValue) {
                case 'capacity-asc':
                    return parseInt(a.dataset.capacity) - parseInt(b.dataset.capacity);
                case 'capacity-desc':
                    return parseInt(b.dataset.capacity) - parseInt(a.dataset.capacity);
                case 'resistance-asc':
                    const resA = parseFloat(a.querySelector('[data-resistance]')?.dataset.resistance || '999');
                    const resB = parseFloat(b.querySelector('[data-resistance]')?.dataset.resistance || '999');
                    return resA - resB;
                default:
                    return 0;
            }
        });

        if (productsGrid) {
            cardsArray.forEach(card => productsGrid.appendChild(card));
        }
    }

    // Event listeners
    if (processFilter) processFilter.addEventListener('change', filterProducts);
    if (applicationFilter) applicationFilter.addEventListener('change', filterProducts);
    if (capacityFilter) capacityFilter.addEventListener('change', filterProducts);
    if (sortFilter) sortFilter.addEventListener('change', sortProducts);

    if (resetButton) {
        resetButton.addEventListener('click', function() {
            processFilter.value = '';
            applicationFilter.value = '';
            capacityFilter.value = '';
            sortFilter.value = 'default';
            filterProducts();
        });
    }
});
</script>
@endpush
