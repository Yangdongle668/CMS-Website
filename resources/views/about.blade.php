@extends('layouts.app')

@section('title', '关于我们 - DONGGUAN ZUFEK 聚合物锂电池供应商')
@section('description', 'DONGGUAN ZUFEK是聚合物锂电池专业供应商，拥有卷绕和叠片工艺技术，为可穿戴和医疗设备提供高质量电池解决方案。')

@section('content')
<section class="py-12">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-8">关于 DONGGUAN ZUFEK</h1>

        <div class="space-y-8">
            <!-- 公司概况 -->
            <div class="bg-blue-50 p-8 rounded-lg">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">公司概况</h2>
                <p class="text-gray-600 mb-4">
                    <strong>DONGGUAN ZUFEK TECHNOLOGY CO.,LTD</strong> 成立于2018年，是一家专注于聚合物锂电池研发和生产的高新技术企业。公司位于广东东莞，拥有现代化的生产设施和专业的研发团队。
                </p>
                <p class="text-gray-600">
                    多年的行业经验使我们深刻理解可穿戴设备和医疗设备市场的需求。我们提供两种核心工艺（卷绕和叠片）的聚合物锂电池，并具有强大的异形定制能力。
                </p>
            </div>

            <!-- 工艺技术 -->
            <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">工艺技术能力</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="border-l-4 border-green-500 pl-6">
                        <h3 class="text-xl font-bold text-green-600 mb-3">卷绕工艺 (Wound Cell)</h3>
                        <p class="text-gray-600 mb-3">
                            采用圆形卷绕技术，能够实现大容量、高可靠性的聚合物电池。
                        </p>
                        <ul class="text-gray-600 space-y-2 text-sm">
                            <li>✓ <strong>成本优势：</strong>高效生产流程，成本低廉</li>
                            <li>✓ <strong>交期快：</strong>3-5天可交样，批量交期短</li>
                            <li>✓ <strong>容量范围：</strong>300-2000+ mAh灵活选择</li>
                            <li>✓ <strong>可靠性：</strong>成熟工艺，一致性好</li>
                        </ul>
                    </div>
                    <div class="border-l-4 border-purple-500 pl-6">
                        <h3 class="text-xl font-bold text-purple-600 mb-3">叠片工艺 (Stacked Cell)</h3>
                        <p class="text-gray-600 mb-3">
                            采用多层叠片技术，实现极低内阻和强大的高倍率性能。
                        </p>
                        <ul class="text-gray-600 space-y-2 text-sm">
                            <li>✓ <strong>内阻极低：</strong>25-35 mΩ，支持高倍率</li>
                            <li>✓ <strong>循环寿命：</strong>>2000次，使用寿命长</li>
                            <li>✓ <strong>能量密度：</strong>230+ Wh/L，空间利用最优</li>
                            <li>✓ <strong>安全可靠：</strong>多层隔膜，防爆裂</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- 异形定制能力 -->
            <div class="bg-gray-50 p-8 rounded-lg">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">异形电池定制能力</h2>
                <p class="text-gray-600 mb-4">
                    ZUFEK的核心竞争力之一是提供专业的异形电池定制服务。我们可以根据您的设备形状设计专属的电池方案，最大化可用空间，提升产品竞争力。
                </p>
                <ul class="text-gray-600 space-y-2">
                    <li>✓ <strong>自由设计：</strong>L型、T型、弧形、圆形等任意形状</li>
                    <li>✓ <strong>快速交样：</strong>3-10天完成工程样品</li>
                    <li>✓ <strong>可行性评估：</strong>专业团队评估并提供优化建议</li>
                    <li>✓ <strong>充分沟通：</strong>与客户深入协作，确保最优方案</li>
                </ul>
                <p class="text-gray-600 mt-4 text-sm">
                    <em>注：复杂定制电池需要根据实际设计评估可行性。欢迎联系我们讨论您的应用需求。</em>
                </p>
            </div>

            <!-- 目标市场 -->
            <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">主要应用领域</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 class="text-lg font-bold text-gray-800 mb-3">可穿戴设备</h3>
                        <ul class="text-gray-600 space-y-2 text-sm">
                            <li>• 智能手表、手环</li>
                            <li>• 运动追踪设备</li>
                            <li>• 健康监测设备</li>
                            <li>• AR/VR眼镜</li>
                        </ul>
                    </div>
                    <div class="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 class="text-lg font-bold text-gray-800 mb-3">医疗设备</h3>
                        <ul class="text-gray-600 space-y-2 text-sm">
                            <li>• 便携式诊断设备</li>
                            <li>• 病人监护仪</li>
                            <li>• 医用传感器</li>
                            <li>• 无创检测设备</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- 核心价值观 -->
            <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">我们的承诺</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="text-center">
                        <i class="fas fa-check-circle text-green-600 text-4xl mb-3"></i>
                        <h3 class="font-bold text-gray-800 mb-2">质量保证</h3>
                        <p class="text-gray-600 text-sm">每块电池都经过严格测试和认证（UL、CE等）</p>
                    </div>
                    <div class="text-center">
                        <i class="fas fa-tachometer-alt text-blue-600 text-4xl mb-3"></i>
                        <h3 class="font-bold text-gray-800 mb-2">快速响应</h3>
                        <p class="text-gray-600 text-sm">3-5天交样，专业团队快速处理您的需求</p>
                    </div>
                    <div class="text-center">
                        <i class="fas fa-handshake text-purple-600 text-4xl mb-3"></i>
                        <h3 class="font-bold text-gray-800 mb-2">客户优先</h3>
                        <p class="text-gray-600 text-sm">提供OEM配套服务，与客户长期合作</p>
                    </div>
                </div>
            </div>

            <!-- 联系 -->
            <div class="bg-blue-600 text-white p-8 rounded-lg text-center">
                <h2 class="text-2xl font-bold mb-4">与我们合作</h2>
                <p class="mb-6">
                    如果您对聚合物锂电池感兴趣，或有任何定制需求，欢迎联系我们的销售团队。
                </p>
                <a href="/contact" class="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100">发送询盘</a>
            </div>
        </div>
    </div>
</section>
@endsection
