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
<!-- Hero Section with Parallax -->
<section class="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-32 overflow-hidden">
    <!-- Animated background elements -->
    <div class="absolute inset-0 opacity-10">
        <div class="absolute top-10 left-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute bottom-10 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" style="animation-delay: 0.5s;"></div>
    </div>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center">
            <h1 class="text-5xl md:text-6xl font-bold mb-4 animate-slideInDown">DONGGUAN ZUFEK TECHNOLOGY</h1>
            <p class="text-xl md:text-2xl text-blue-100 mb-2 animate-slideInUp" style="animation-delay: 0.2s;">专业聚合物锂电池供应商</p>
            <p class="text-lg md:text-xl text-blue-100 mb-8 max-w-3xl mx-auto animate-slideInUp" style="animation-delay: 0.4s;">为可穿戴设备和医疗设备提供卷绕工艺和叠片工艺电池解决方案</p>
            <div class="space-x-4 animate-slideInUp" style="animation-delay: 0.6s;">
                <a href="/products" class="inline-block btn-primary text-white hover:shadow-lg hover:scale-105 transition-all duration-300">浏览产品</a>
                <a href="/contact" class="inline-block btn-secondary hover:shadow-lg hover:scale-105 transition-all duration-300">联系我们</a>
            </div>
        </div>
    </div>
</section>

<!-- 公司简介 -->
<section class="bg-white py-16 md:py-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div data-aos="fade-in-up">
                <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-6">关于 ZUFEK</h2>
                <p class="text-gray-600 mb-4 leading-relaxed">DONGGUAN ZUFEK TECHNOLOGY CO.,LTD 成立于2018年，是一家专注于聚合物锂电池研发和生产的高新技术企业。我们拥有先进的卷绕和叠片工艺技术，为全球可穿戴设备制造商和医疗设备企业提供高品质的电池解决方案。</p>
                <p class="text-gray-600 mb-6 leading-relaxed">多年的行业经验使我们深刻理解客户需求，能够提供快速交样、成本优化和可靠的异形电池定制服务。</p>
                <div class="flex space-x-8">
                    <div class="text-center group">
                        <div class="text-3xl md:text-4xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">2018</div>
                        <div class="text-sm text-gray-600">成立年份</div>
                    </div>
                    <div class="text-center group">
                        <div class="text-3xl md:text-4xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">东莞</div>
                        <div class="text-sm text-gray-600">生产基地</div>
                    </div>
                </div>
            </div>
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-lg shadow-lg transform hover:shadow-2xl transition-all duration-300" data-aos="fade-in-left">
                <h3 class="text-xl font-bold text-gray-800 mb-6">核心优势</h3>
                <ul class="space-y-4">
                    <li class="flex items-start group hover:pl-2 transition-all duration-300">
                        <i class="fas fa-check text-blue-600 mr-3 mt-1 group-hover:scale-125 transition-transform"></i>
                        <span class="text-gray-700"><strong>卷绕工艺：</strong>成本低、交期快、可靠稳定</span>
                    </li>
                    <li class="flex items-start group hover:pl-2 transition-all duration-300">
                        <i class="fas fa-check text-blue-600 mr-3 mt-1 group-hover:scale-125 transition-transform"></i>
                        <span class="text-gray-700"><strong>叠片工艺：</strong>内阻低、循环性能强、能量密度高</span>
                    </li>
                    <li class="flex items-start group hover:pl-2 transition-all duration-300">
                        <i class="fas fa-check text-blue-600 mr-3 mt-1 group-hover:scale-125 transition-transform"></i>
                        <span class="text-gray-700"><strong>异形定制：</strong>任意形状设计，充分利用可用空间</span>
                    </li>
                    <li class="flex items-start group hover:pl-2 transition-all duration-300">
                        <i class="fas fa-check text-blue-600 mr-3 mt-1 group-hover:scale-125 transition-transform"></i>
                        <span class="text-gray-700"><strong>快速交样：</strong>3-10天完成样品，减少上市周期</span>
                    </li>
                    <li class="flex items-start group hover:pl-2 transition-all duration-300">
                        <i class="fas fa-check text-blue-600 mr-3 mt-1 group-hover:scale-125 transition-transform"></i>
                        <span class="text-gray-700"><strong>医疗级认证：</strong>UL2054、CE、医疗器械认证</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</section>

<!-- Featured Products Section -->
<section class="py-16 md:py-20 bg-gray-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800" data-aos="fade-in">精选产品</h2>
        <p class="text-center text-gray-600 mb-12 text-lg" data-aos="fade-in" data-aos-delay="200">高品质聚合物锂电池解决方案</p>

        @if($products->count() > 0)
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                @foreach($products as $product)
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300" data-aos="fade-in-up" data-aos-delay="{{ $loop->index * 100 }}">
                        @if($product->image)
                            <img src="{{ asset('storage/' . $product->image) }}" alt="{{ $product->name }}" class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300">
                        @else
                            <div class="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                <i class="fas fa-battery text-blue-600 text-4xl"></i>
                            </div>
                        @endif

                        <div class="p-6">
                            @if($product->process_type)
                                <div class="mb-3">
                                    @if($product->process_type === 'wound')
                                        <span class="inline-block bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">卷绕工艺</span>
                                    @else
                                        <span class="inline-block bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">叠片工艺</span>
                                    @endif
                                </div>
                            @endif

                            <h3 class="text-xl font-bold text-gray-800 mb-2">{{ $product->name }}</h3>
                            <p class="text-gray-600 text-sm mb-4">{{ Str::limit($product->description, 100) }}</p>

                            <div class="grid grid-cols-2 gap-3 mb-6 text-sm bg-gray-50 p-3 rounded">
                                @if($product->capacity)
                                    <div><span class="font-semibold text-blue-600">容量:</span> <span class="font-bold">{{ $product->capacity }}</span> mAh</div>
                                @endif
                                @if($product->voltage)
                                    <div><span class="font-semibold text-blue-600">电压:</span> <span class="font-bold">{{ $product->voltage }}</span>V</div>
                                @endif
                                @if($product->internal_resistance)
                                    <div><span class="font-semibold text-blue-600">内阻:</span> <span class="font-bold">{{ $product->internal_resistance }}</span> mΩ</div>
                                @endif
                                @if($product->cycle_life)
                                    <div><span class="font-semibold text-blue-600">循环:</span> <span class="font-bold">{{ $product->cycle_life }}</span></div>
                                @endif
                            </div>

                            <a href="{{ route('products.show', $product->slug) }}" class="btn-primary text-sm w-full text-center hover:shadow-lg transition-all duration-300">查看详情</a>
                        </div>
                    </div>
                @endforeach
            </div>

            <div class="text-center mt-16">
                <a href="/products" class="btn-secondary inline-block hover:shadow-lg hover:scale-105 transition-all duration-300">查看全部产品</a>
            </div>
        @else
            <div class="text-center py-12">
                <p class="text-gray-600 text-lg">暂无产品信息。</p>
            </div>
        @endif
    </div>
</section>

<!-- 工艺技术对比 -->
<section class="bg-gradient-to-b from-gray-50 to-gray-100 py-16 md:py-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800" data-aos="fade-in">ZUFEK 工艺技术对比</h2>
        <p class="text-center text-gray-600 mb-16 text-lg" data-aos="fade-in" data-aos-delay="200">两大核心工艺，满足多样化需求</p>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <!-- 卷绕工艺 -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group" data-aos="fade-in-right">
                <div class="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white p-8">
                    <h3 class="text-3xl font-bold flex items-center">
                        <i class="fas fa-circle text-yellow-300 mr-4 text-2xl"></i>卷绕工艺
                    </h3>
                    <p class="text-green-100 mt-2">Wound Cell Technology</p>
                </div>
                <div class="p-8">
                    <div class="space-y-6">
                        <div class="border-l-4 border-green-500 pl-4">
                            <h4 class="font-bold text-gray-800 mb-3 text-lg">核心优势</h4>
                            <ul class="text-gray-600 space-y-2 text-sm">
                                <li class="flex items-center hover:text-green-600 transition-colors"><i class="fas fa-check text-green-500 mr-2"></i>成本低：高效生产工艺，价格优势明显</li>
                                <li class="flex items-center hover:text-green-600 transition-colors"><i class="fas fa-check text-green-500 mr-2"></i>交期快：3-5天可交样，批量交货周期短</li>
                                <li class="flex items-center hover:text-green-600 transition-colors"><i class="fas fa-check text-green-500 mr-2"></i>可靠稳定：成熟稳定的工艺，一致性好</li>
                                <li class="flex items-center hover:text-green-600 transition-colors"><i class="fas fa-check text-green-500 mr-2"></i>容量范围广：300-2000+ mAh灵活覆盖</li>
                            </ul>
                        </div>
                        <div class="border-l-4 border-green-500 pl-4">
                            <h4 class="font-bold text-gray-800 mb-2">应用领域</h4>
                            <p class="text-gray-600 text-sm">智能手表、手环、医疗监护设备、消费级可穿戴</p>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                            <h4 class="font-bold text-gray-800 mb-3">典型指标</h4>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div><span class="text-gray-600">内阻:</span> <span class="font-bold text-green-600">70-85 mΩ</span></div>
                                <div><span class="text-gray-600">循环寿命:</span> <span class="font-bold text-green-600">>1000次</span></div>
                                <div class="col-span-2"><span class="text-gray-600">能量密度:</span> <span class="font-bold text-green-600">200+ Wh/L</span></div>
                            </div>
                        </div>
                    </div>
                    <a href="/products" class="mt-8 block w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center py-3 rounded-lg font-bold hover:shadow-lg transition-all duration-300 group-hover:scale-105">浏览卷绕电池</a>
                </div>
            </div>

            <!-- 叠片工艺 -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group" data-aos="fade-in-left">
                <div class="bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 text-white p-8">
                    <h3 class="text-3xl font-bold flex items-center">
                        <i class="fas fa-layer-group text-yellow-300 mr-4 text-2xl"></i>叠片工艺
                    </h3>
                    <p class="text-purple-100 mt-2">Stacked Cell Technology</p>
                </div>
                <div class="p-8">
                    <div class="space-y-6">
                        <div class="border-l-4 border-purple-500 pl-4">
                            <h4 class="font-bold text-gray-800 mb-3 text-lg">核心优势</h4>
                            <ul class="text-gray-600 space-y-2 text-sm">
                                <li class="flex items-center hover:text-purple-600 transition-colors"><i class="fas fa-check text-purple-500 mr-2"></i>内阻极低：25-35 mΩ，支持高倍率放电</li>
                                <li class="flex items-center hover:text-purple-600 transition-colors"><i class="fas fa-check text-purple-500 mr-2"></i>循环性能强：>2000次循环，寿命长</li>
                                <li class="flex items-center hover:text-purple-600 transition-colors"><i class="fas fa-check text-purple-500 mr-2"></i>能量密度高：230+ Wh/L，空间利用最优</li>
                                <li class="flex items-center hover:text-purple-600 transition-colors"><i class="fas fa-check text-purple-500 mr-2"></i>安全可靠：多层隔膜设计，防爆裂</li>
                            </ul>
                        </div>
                        <div class="border-l-4 border-purple-500 pl-4">
                            <h4 class="font-bold text-gray-800 mb-2">应用领域</h4>
                            <p class="text-gray-600 text-sm">医疗级可穿戴、诊断设备、高功率应用、运动设备</p>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                            <h4 class="font-bold text-gray-800 mb-3">典型指标</h4>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div><span class="text-gray-600">内阻:</span> <span class="font-bold text-purple-600">25-35 mΩ</span></div>
                                <div><span class="text-gray-600">循环寿命:</span> <span class="font-bold text-purple-600">>2000次</span></div>
                                <div class="col-span-2"><span class="text-gray-600">能量密度:</span> <span class="font-bold text-purple-600">230+ Wh/L</span></div>
                            </div>
                        </div>
                    </div>
                    <a href="/products" class="mt-8 block w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-center py-3 rounded-lg font-bold hover:shadow-lg transition-all duration-300 group-hover:scale-105">浏览叠片电池</a>
                </div>
            </div>
        </div>

        <!-- 异形电池定制 -->
        <div class="bg-white rounded-xl shadow-lg p-8 md:p-12" data-aos="fade-in-up">
            <h3 class="text-3xl font-bold text-gray-800 mb-2 text-center">异形电池定制能力</h3>
            <p class="text-center text-gray-600 mb-10">满足各种设备形状需求，充分利用可用空间</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="text-center group p-6 rounded-lg hover:bg-blue-50 transition-all duration-300 hover:shadow-md">
                    <i class="fas fa-pen text-blue-600 text-5xl mb-4 group-hover:scale-110 transition-transform duration-300"></i>
                    <h4 class="font-bold text-gray-800 mb-2 text-lg">自由设计</h4>
                    <p class="text-gray-600 text-sm leading-relaxed">L型、T型、弧形、圆形等任意形状，充分利用设备空间</p>
                </div>
                <div class="text-center group p-6 rounded-lg hover:bg-blue-50 transition-all duration-300 hover:shadow-md">
                    <i class="fas fa-tachometer-alt text-blue-600 text-5xl mb-4 group-hover:scale-110 transition-transform duration-300"></i>
                    <h4 class="font-bold text-gray-800 mb-2 text-lg">快速交样</h4>
                    <p class="text-gray-600 text-sm leading-relaxed">3-10天完成工程样品，加速您的产品开发周期</p>
                </div>
                <div class="text-center group p-6 rounded-lg hover:bg-blue-50 transition-all duration-300 hover:shadow-md">
                    <i class="fas fa-check-circle text-blue-600 text-5xl mb-4 group-hover:scale-110 transition-transform duration-300"></i>
                    <h4 class="font-bold text-gray-800 mb-2 text-lg">可行性评估</h4>
                    <p class="text-gray-600 text-sm leading-relaxed">专业团队评估，提供设计建议，确保最优方案</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- CTA Section -->
<section class="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white py-16 md:py-24 overflow-hidden">
    <!-- Animated background elements -->
    <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse" style="animation-duration: 4s;"></div>
        <div class="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-300 rounded-full blur-3xl animate-pulse" style="animation-duration: 5s; animation-delay: 1s;"></div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 class="text-4xl md:text-5xl font-bold mb-6 animate-slideInDown">准备与 ZUFEK 合作？</h2>
        <p class="text-lg md:text-xl text-blue-100 mb-10 leading-relaxed animate-slideInUp" style="animation-delay: 0.2s;">
            无论您需要卷绕工艺还是叠片工艺电池，是否需要异形定制，ZUFEK都有专业团队为您服务。<br>
            <span class="text-blue-200">快速交样、成本透明、品质保证。</span>
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center animate-slideInUp" style="animation-delay: 0.4s;">
            <a href="/contact" class="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-blue-50 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center">
                <i class="fas fa-envelope mr-2"></i>发送询盘
            </a>
            <a href="/products" class="inline-block border-3 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-500 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center">
                <i class="fas fa-list mr-2"></i>浏览全部产品
            </a>
        </div>
    </div>
</section>
@endsection
