@extends('layouts.app')

@section('title', '产品对比 - ZUFEK 聚合物电池对比')
@section('description', '在线对比ZUFEK聚合物锂电池产品，轻松比较技术参数和性能指标。')

@section('content')
<!-- Hero Section -->
<section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-4xl md:text-5xl font-bold mb-4 animate-slideInDown">产品对比</h1>
        <p class="text-xl text-blue-100 max-w-2xl animate-slideInUp" style="animation-delay: 0.2s;">
            选择产品进行详细对比，找到最适合您需求的电池方案
        </p>
    </div>
</section>

<section class="py-12 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Product Selection -->
        <div class="mb-12" data-aos="fade-in">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">选择要对比的产品</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                @foreach($allProducts as $product)
                    <div class="group relative">
                        <input type="checkbox" class="product-checkbox" value="{{ $product->id }}" data-slug="{{ $product->slug }}"
                               id="product-{{ $product->id }}" class="sr-only">
                        <label for="product-{{ $product->id }}" class="block cursor-pointer">
                            <div class="border-2 border-gray-300 rounded-lg p-4 group-hover:border-blue-500 group-hover:bg-blue-50 transition-all duration-300">
                                <div class="font-semibold text-gray-800 text-sm mb-2">{{ $product->name }}</div>
                                <div class="flex items-center space-x-2 text-xs">
                                    @if($product->capacity)
                                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">{{ $product->capacity }} mAh</span>
                                    @endif
                                    @if($product->process_type)
                                        @if($product->process_type === 'wound')
                                            <span class="bg-green-100 text-green-800 px-2 py-1 rounded">卷绕</span>
                                        @else
                                            <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded">叠片</span>
                                        @endif
                                    @endif
                                </div>
                            </div>
                        </label>
                    </div>
                @endforeach
            </div>
            <p class="text-gray-600 text-sm mt-4">最多可选择4个产品进行对比</p>
        </div>

        <!-- Comparison Table -->
        <div id="comparisonContainer" class="hidden" data-aos="fade-in">
            <div class="overflow-x-auto rounded-lg shadow-lg">
                <table class="w-full bg-white">
                    <!-- Header with product names -->
                    <thead class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                        <tr>
                            <th class="px-6 py-4 text-left font-bold w-1/4">规格参数</th>
                            <td colspan="4" class="text-center">
                                <button class="text-white hover:text-blue-100 transition-colors" onclick="this.closest('.comparison-table').remove()">
                                    <i class="fas fa-times"></i>
                                </button>
                            </td>
                        </tr>
                        <tr class="bg-blue-50 border-b">
                            <th class="px-6 py-3 text-left text-gray-800 font-semibold">产品信息</th>
                            @for($i = 0; $i < 4; $i++)
                                <td class="px-6 py-3 text-center compare-product-header-{{ $i }}" style="display: none;">
                                    <div class="font-bold text-gray-800 product-name-{{ $i }}"></div>
                                    <button class="text-red-500 hover:text-red-700 text-sm mt-2 remove-product" data-index="{{ $i }}">
                                        <i class="fas fa-trash-alt"></i> 移除
                                    </button>
                                </td>
                            @endfor
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        <!-- Process Type -->
                        <tr class="hover:bg-blue-50 transition-colors">
                            <td class="px-6 py-4 font-semibold text-gray-700">工艺类型</td>
                            @for($i = 0; $i < 4; $i++)
                                <td class="px-6 py-4 text-center compare-product-{{ $i }}" style="display: none;" data-field="process_type"></td>
                            @endfor
                        </tr>

                        <!-- Model -->
                        <tr class="hover:bg-blue-50 transition-colors">
                            <td class="px-6 py-4 font-semibold text-gray-700">产品型号</td>
                            @for($i = 0; $i < 4; $i++)
                                <td class="px-6 py-4 text-center compare-product-{{ $i }}" style="display: none;" data-field="model"></td>
                            @endfor
                        </tr>

                        <!-- Capacity -->
                        <tr class="hover:bg-blue-50 transition-colors">
                            <td class="px-6 py-4 font-semibold text-gray-700">容量</td>
                            @for($i = 0; $i < 4; $i++)
                                <td class="px-6 py-4 text-center text-blue-600 font-bold compare-product-{{ $i }}" style="display: none;" data-field="capacity"></td>
                            @endfor
                        </tr>

                        <!-- Voltage -->
                        <tr class="hover:bg-blue-50 transition-colors">
                            <td class="px-6 py-4 font-semibold text-gray-700">额定电压</td>
                            @for($i = 0; $i < 4; $i++)
                                <td class="px-6 py-4 text-center compare-product-{{ $i }}" style="display: none;" data-field="voltage"></td>
                            @endfor
                        </tr>

                        <!-- Internal Resistance -->
                        <tr class="hover:bg-purple-50 transition-colors">
                            <td class="px-6 py-4 font-semibold text-gray-700">内阻</td>
                            @for($i = 0; $i < 4; $i++)
                                <td class="px-6 py-4 text-center text-purple-600 font-bold compare-product-{{ $i }}" style="display: none;" data-field="internal_resistance"></td>
                            @endfor
                        </tr>

                        <!-- Cycle Life -->
                        <tr class="hover:bg-blue-50 transition-colors">
                            <td class="px-6 py-4 font-semibold text-gray-700">循环寿命</td>
                            @for($i = 0; $i < 4; $i++)
                                <td class="px-6 py-4 text-center font-semibold compare-product-{{ $i }}" style="display: none;" data-field="cycle_life"></td>
                            @endfor
                        </tr>

                        <!-- Energy Density -->
                        <tr class="hover:bg-blue-50 transition-colors">
                            <td class="px-6 py-4 font-semibold text-gray-700">能量密度</td>
                            @for($i = 0; $i < 4; $i++)
                                <td class="px-6 py-4 text-center compare-product-{{ $i }}" style="display: none;" data-field="energy_density"></td>
                            @endfor
                        </tr>

                        <!-- Operating Temperature -->
                        <tr class="hover:bg-blue-50 transition-colors">
                            <td class="px-6 py-4 font-semibold text-gray-700">工作温度</td>
                            @for($i = 0; $i < 4; $i++)
                                <td class="px-6 py-4 text-center compare-product-{{ $i }}" style="display: none;" data-field="operating_temperature"></td>
                            @endfor
                        </tr>

                        <!-- Certifications -->
                        <tr class="hover:bg-green-50 transition-colors">
                            <td class="px-6 py-4 font-semibold text-gray-700">认证</td>
                            @for($i = 0; $i < 4; $i++)
                                <td class="px-6 py-4 text-center compare-product-{{ $i }}" style="display: none;" data-field="certifications"></td>
                            @endfor
                        </tr>

                        <!-- Applications -->
                        <tr class="hover:bg-blue-50 transition-colors">
                            <td class="px-6 py-4 font-semibold text-gray-700">应用领域</td>
                            @for($i = 0; $i < 4; $i++)
                                <td class="px-6 py-4 text-center text-sm compare-product-{{ $i }}" style="display: none;" data-field="applications"></td>
                            @endfor
                        </tr>

                        <!-- Highlights -->
                        <tr class="hover:bg-yellow-50 transition-colors">
                            <td class="px-6 py-4 font-semibold text-gray-700">核心亮点</td>
                            @for($i = 0; $i < 4; $i++)
                                <td class="px-6 py-4 text-center text-sm compare-product-{{ $i }}" style="display: none;" data-field="highlights"></td>
                            @endfor
                        </tr>

                        <!-- Size -->
                        <tr class="hover:bg-blue-50 transition-colors">
                            <td class="px-6 py-4 font-semibold text-gray-700">尺寸</td>
                            @for($i = 0; $i < 4; $i++)
                                <td class="px-6 py-4 text-center compare-product-{{ $i }}" style="display: none;" data-field="size"></td>
                            @endfor
                        </tr>

                        <!-- Weight -->
                        <tr class="hover:bg-blue-50 transition-colors">
                            <td class="px-6 py-4 font-semibold text-gray-700">重量</td>
                            @for($i = 0; $i < 4; $i++)
                                <td class="px-6 py-4 text-center compare-product-{{ $i }}" style="display: none;" data-field="weight"></td>
                            @endfor
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Action Buttons -->
            <div class="mt-8 flex gap-4 justify-center">
                <a href="/products" class="btn-secondary hover:shadow-lg transition-all duration-300">
                    <i class="fas fa-arrow-left mr-2"></i>返回产品列表
                </a>
                <a href="/contact" class="btn-primary hover:shadow-lg transition-all duration-300">
                    <i class="fas fa-envelope mr-2"></i>询问产品
                </a>
            </div>
        </div>

        <!-- Empty State -->
        <div id="emptyState" class="text-center py-20">
            <i class="fas fa-balance-scale text-gray-300 text-7xl mb-4"></i>
            <p class="text-gray-600 text-xl mb-2">选择至少2个产品开始对比</p>
            <p class="text-gray-500 text-sm">点击上方产品即可添加到对比列表</p>
        </div>
    </div>
</section>

@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const checkboxes = document.querySelectorAll('.product-checkbox');
    const comparisonContainer = document.getElementById('comparisonContainer');
    const emptyState = document.getElementById('emptyState');
    const selectedProducts = {};
    const maxProducts = 4;

    // Product data (from blade)
    const productsData = {!! json_encode($allProducts->map(fn($p) => [
        'id' => $p->id,
        'name' => $p->name,
        'model' => $p->model,
        'capacity' => $p->capacity . ' mAh',
        'voltage' => $p->voltage . 'V',
        'process_type' => $p->process_type === 'wound' ? '卷绕工艺' : '叠片工艺',
        'internal_resistance' => ($p->internal_resistance ?? '-') . ' mΩ',
        'cycle_life' => $p->cycle_life ?? '-',
        'energy_density' => $p->energy_density ?? '-',
        'operating_temperature' => $p->operating_temperature ?? '-',
        'certifications' => $p->certifications ?? '-',
        'applications' => $p->applications ?? '-',
        'highlights' => $p->highlights ?? '-',
        'size' => $p->size ?? '-',
        'weight' => ($p->weight ?? '-'),
    ])->keyBy('id')) !!};

    function updateComparison() {
        const selected = Object.values(selectedProducts).filter(p => p);

        if (selected.length < 2) {
            comparisonContainer.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        comparisonContainer.classList.remove('hidden');
        emptyState.classList.add('hidden');

        // Clear and populate table
        selected.forEach((productId, index) => {
            const product = productsData[productId];
            if (!product) return;

            // Show column
            document.querySelectorAll(`.compare-product-header-${index}`).forEach(el => el.style.display = '');
            document.querySelectorAll(`.compare-product-${index}`).forEach(el => el.style.display = '');

            // Update product name
            document.querySelector(`.product-name-${index}`).textContent = product.name;

            // Update fields
            document.querySelectorAll(`.compare-product-${index}`).forEach(cell => {
                const field = cell.dataset.field;
                const value = product[field] || '-';
                cell.textContent = value;
            });
        });

        // Hide unused columns
        for (let i = selected.length; i < maxProducts; i++) {
            document.querySelectorAll(`.compare-product-header-${i}`).forEach(el => el.style.display = 'none');
            document.querySelectorAll(`.compare-product-${i}`).forEach(el => el.style.display = 'none');
        }
    }

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const productId = this.value;

            if (this.checked) {
                // Check max products
                if (Object.keys(selectedProducts).length >= maxProducts) {
                    this.checked = false;
                    alert(`最多只能选择${maxProducts}个产品进行对比`);
                    return;
                }
                selectedProducts[productId] = productId;
            } else {
                delete selectedProducts[productId];
            }

            updateComparison();
        });
    });

    // Remove button handler
    document.addEventListener('click', function(e) {
        if (e.target.closest('.remove-product')) {
            const index = parseInt(e.target.closest('.remove-product').dataset.index);
            const selected = Object.values(selectedProducts).filter(p => p);
            const productIdToRemove = selected[index];

            document.querySelector(`#product-${productIdToRemove}`).checked = false;
            document.querySelector(`#product-${productIdToRemove}`).dispatchEvent(new Event('change'));
        }
    });
});
</script>
@endpush
