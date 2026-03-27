@extends('layouts.app')

@section('title', '聚合物锂电池供应商 - 可穿戴&医疗设备电池方案 - ZUFEK')
@section('description', 'DONGGUAN ZUFEK是专业的聚合物锂电池供应商，提供卷绕工艺和叠片工艺电池，广泛应用于可穿戴设备和医疗设备。支持异形电池定制。')
@section('keywords', '聚合物锂电池,异形电池,卷绕工艺,叠片工艺,可穿戴设备,医疗设备,B2B电池供应商')

@section('schema')
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Raven Battery",
  "url": "{{ url('/') }}",
  "logo": "{{ url('/logo.png') }}",
  "description": "Professional B2B battery solutions",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-123-4567",
    "contactType": "Sales"
  }
}
</script>
@endsection

@section('content')
<!-- Hero Section -->
<section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
            <h1 class="text-5xl font-bold mb-4">DONGGUAN ZUFEK TECHNOLOGY</h1>
            <p class="text-2xl text-blue-100 mb-2">专业聚合物锂电池供应商</p>
            <p class="text-xl text-blue-100 mb-8">为可穿戴设备和医疗设备提供卷绕工艺和叠片工艺电池解决方案</p>
            <div class="space-x-4">
                <a href="/products" class="inline-block btn-primary text-white">浏览产品</a>
                <a href="/contact" class="inline-block btn-secondary">联系我们</a>
            </div>
        </div>
    </div>
</section>

<!-- 公司简介 -->
<section class="bg-white py-12">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
                <h2 class="text-3xl font-bold text-gray-800 mb-4">关于 ZUFEK</h2>
                <p class="text-gray-600 mb-4">DONGGUAN ZUFEK TECHNOLOGY CO.,LTD 成立于2018年，是一家专注于聚合物锂电池研发和生产的高新技术企业。我们拥有先进的卷绕和叠片工艺技术，为全球可穿戴设备制造商和医疗设备企业提供高品质的电池解决方案。</p>
                <p class="text-gray-600 mb-4">多年的行业经验使我们深刻理解客户需求，能够提供快速交样、成本优化和可靠的异形电池定制服务。</p>
                <div class="flex space-x-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">2018</div>
                        <div class="text-sm text-gray-600">成立年份</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">东莞</div>
                        <div class="text-sm text-gray-600">生产基地</div>
                    </div>
                </div>
            </div>
            <div class="bg-blue-50 p-8 rounded-lg">
                <h3 class="text-xl font-bold text-gray-800 mb-4">核心优势</h3>
                <ul class="space-y-3">
                    <li class="flex items-start">
                        <i class="fas fa-check text-blue-600 mr-3 mt-1"></i>
                        <span class="text-gray-700"><strong>卷绕工艺：</strong>成本低、交期快、可靠稳定</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-blue-600 mr-3 mt-1"></i>
                        <span class="text-gray-700"><strong>叠片工艺：</strong>内阻低、循环性能强、能量密度高</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-blue-600 mr-3 mt-1"></i>
                        <span class="text-gray-700"><strong>异形定制：</strong>任意形状设计，充分利用可用空间</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-blue-600 mr-3 mt-1"></i>
                        <span class="text-gray-700"><strong>快速交样：</strong>3-10天完成样品，减少上市周期</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check text-blue-600 mr-3 mt-1"></i>
                        <span class="text-gray-700"><strong>医疗级认证：</strong>UL2054、CE、医疗器械认证</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</section>

<!-- Featured Products Section -->
<section class="py-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-4xl font-bold text-center mb-12">Featured Products</h2>

        @if($products->count() > 0)
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                @foreach($products as $product)
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                        @if($product->image)
                            <img src="{{ asset('storage/' . $product->image) }}" alt="{{ $product->name }}" class="w-full h-48 object-cover">
                        @else
                            <div class="w-full h-48 bg-gray-200 flex items-center justify-center">
                                <i class="fas fa-image text-gray-400 text-4xl"></i>
                            </div>
                        @endif

                        <div class="p-6">
                            <h3 class="text-xl font-bold text-gray-800 mb-2">{{ $product->name }}</h3>
                            <p class="text-gray-600 text-sm mb-4">{{ Str::limit($product->description, 100) }}</p>

                            <div class="grid grid-cols-2 gap-2 mb-4 text-sm">
                                @if($product->capacity)
                                    <div><span class="font-semibold">Capacity:</span> {{ $product->capacity }} mAh</div>
                                @endif
                                @if($product->voltage)
                                    <div><span class="font-semibold">Voltage:</span> {{ $product->voltage }}V</div>
                                @endif
                            </div>

                            <a href="{{ route('products.show', $product->slug) }}" class="btn-primary text-sm">View Details</a>
                        </div>
                    </div>
                @endforeach
            </div>

            <div class="text-center mt-12">
                <a href="/products" class="btn-secondary">View All Products</a>
            </div>
        @else
            <div class="text-center py-12">
                <p class="text-gray-600 text-lg">No products available yet.</p>
            </div>
        @endif
    </div>
</section>

<!-- 工艺技术对比 -->
<section class="bg-gray-100 py-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-4xl font-bold text-center mb-12">ZUFEK 工艺技术对比</h2>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <!-- 卷绕工艺 -->
            <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
                    <h3 class="text-2xl font-bold flex items-center">
                        <i class="fas fa-circle text-yellow-300 mr-3"></i>卷绕工艺
                    </h3>
                </div>
                <div class="p-8">
                    <div class="space-y-4">
                        <div class="border-b pb-3">
                            <h4 class="font-bold text-gray-800 mb-2">核心优势</h4>
                            <ul class="text-gray-600 space-y-1 text-sm">
                                <li>✓ 成本低：高效生产工艺，价格优势明显</li>
                                <li>✓ 交期快：3-5天可交样，批量交货周期短</li>
                                <li>✓ 可靠稳定：成熟稳定的工艺，一致性好</li>
                                <li>✓ 容量范围广：300-2000+ mAh灵活覆盖</li>
                            </ul>
                        </div>
                        <div class="border-b pb-3">
                            <h4 class="font-bold text-gray-800 mb-2">应用领域</h4>
                            <p class="text-gray-600 text-sm">智能手表、手环、医疗监护设备、消费级可穿戴</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-800 mb-2">典型指标</h4>
                            <p class="text-gray-600 text-sm">内阻: 70-85 mΩ | 循环寿命: >1000次 | 能量密度: 200+ Wh/L</p>
                        </div>
                    </div>
                    <a href="/products" class="mt-6 block w-full bg-green-500 text-white text-center py-2 rounded font-semibold hover:bg-green-600">浏览卷绕电池</a>
                </div>
            </div>

            <!-- 叠片工艺 -->
            <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
                    <h3 class="text-2xl font-bold flex items-center">
                        <i class="fas fa-layer-group text-yellow-300 mr-3"></i>叠片工艺
                    </h3>
                </div>
                <div class="p-8">
                    <div class="space-y-4">
                        <div class="border-b pb-3">
                            <h4 class="font-bold text-gray-800 mb-2">核心优势</h4>
                            <ul class="text-gray-600 space-y-1 text-sm">
                                <li>✓ 内阻极低：25-35 mΩ，支持高倍率放电</li>
                                <li>✓ 循环性能强：>2000次循环，寿命长</li>
                                <li>✓ 能量密度高：230+ Wh/L，空间利用最优</li>
                                <li>✓ 安全可靠：多层隔膜设计，防爆裂</li>
                            </ul>
                        </div>
                        <div class="border-b pb-3">
                            <h4 class="font-bold text-gray-800 mb-2">应用领域</h4>
                            <p class="text-gray-600 text-sm">医疗级可穿戴、诊断设备、高功率应用、运动设备</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-800 mb-2">典型指标</h4>
                            <p class="text-gray-600 text-sm">内阻: 25-35 mΩ | 循环寿命: >2000次 | 能量密度: 230+ Wh/L</p>
                        </div>
                    </div>
                    <a href="/products" class="mt-6 block w-full bg-purple-500 text-white text-center py-2 rounded font-semibold hover:bg-purple-600">浏览叠片电池</a>
                </div>
            </div>
        </div>

        <!-- 异形电池定制 -->
        <div class="bg-white rounded-lg shadow-lg p-8">
            <h3 class="text-2xl font-bold text-gray-800 mb-4">异形电池定制能力</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="text-center">
                    <i class="fas fa-pen text-blue-600 text-4xl mb-4"></i>
                    <h4 class="font-bold text-gray-800 mb-2">自由设计</h4>
                    <p class="text-gray-600 text-sm">L型、T型、弧形、圆形等任意形状，充分利用设备空间</p>
                </div>
                <div class="text-center">
                    <i class="fas fa-tachometer-alt text-blue-600 text-4xl mb-4"></i>
                    <h4 class="font-bold text-gray-800 mb-2">快速交样</h4>
                    <p class="text-gray-600 text-sm">3-10天完成工程样品，加速您的产品开发周期</p>
                </div>
                <div class="text-center">
                    <i class="fas fa-check-circle text-blue-600 text-4xl mb-4"></i>
                    <h4 class="font-bold text-gray-800 mb-2">可行性评估</h4>
                    <p class="text-gray-600 text-sm">专业团队评估，提供设计建议，确保最优方案</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- CTA Section -->
<section class="bg-blue-600 text-white py-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-4xl font-bold mb-4">准备与 ZUFEK 合作？</h2>
        <p class="text-xl text-blue-100 mb-8">
            无论您需要卷绕工艺还是叠片工艺电池，是否需要异形定制，ZUFEK都有专业团队为您服务。<br>
            快速交样、成本透明、品质保证。
        </p>
        <div class="space-x-4">
            <a href="/contact" class="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100">发送询盘</a>
            <a href="/products" class="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700">浏览全部产品</a>
        </div>
    </div>
</section>
@endsection
