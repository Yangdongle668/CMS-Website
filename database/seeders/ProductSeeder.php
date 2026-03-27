<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // 数据列表
        $products = [
            // 可穿戴设备 - 卷绕工艺
            [
                'name' => '智能手表聚合物锂电池 (卷绕)',
                'model' => 'ZFK-WND-400-3.7',
                'capacity' => 400,
                'voltage' => 3.7,
                'size' => '32 x 18 x 5mm',
                'description' => '专为智能手表设计的高能量密度聚合物锂电池。采用卷绕工艺，成本低、交期快，是可穿戴设备的首选方案。支持快速定制交样。',
                'slug' => 'smartwatch-polymer-battery-wound-400mah',
                'meta_title' => '智能手表400mAh聚合物锂电池-卷绕工艺-ZUFEK',
                'meta_description' => '专业聚合物锂电池供应商ZUFEK，为智能手表提供400mAh卷绕工艺电池，成本低、交期快、可定制。',
                'process_type' => 'wound',
                'capacity_min' => 300,
                'capacity_max' => 500,
                'internal_resistance' => 80,
                'cycle_life' => '>1000',
                'energy_density' => '200+ Wh/L',
                'applications' => '智能手表、智能手环、穿戴式健康监测设备',
                'certifications' => 'UL、CE',
                'customization_info' => '支持异形定制，可根据设备形状设计。标准交样周期3-5天。',
                'highlights' => '卷绕工艺成本优势、快速交期、稳定可靠的循环性能',
                'operating_temperature' => '-20°C ~ 60°C',
                'weight' => '8g',
            ],
            // 可穿戴设备 - 叠片工艺（高功率）
            [
                'name' => '运动手环高倍率聚合物电池 (叠片)',
                'model' => 'ZFK-STK-600-3.7-HR',
                'capacity' => 600,
                'voltage' => 3.7,
                'size' => '35 x 22 x 6mm',
                'description' => '采用叠片工艺的高倍率聚合物锂电池，内阻低、循环性能强，为运动手环提供强劲续航。能量密度高，充分利用可用空间，支持快速充放电。',
                'slug' => 'sports-bracelet-polymer-battery-stacked-600mah',
                'meta_title' => '运动手环600mAh聚合物锂电池-叠片工艺-ZUFEK',
                'meta_description' => '运动手环专用聚合物锂电池，600mAh叠片工艺，低内阻、强循环、高倍率放电。',
                'process_type' => 'stacked',
                'capacity_min' => 500,
                'capacity_max' => 800,
                'internal_resistance' => 30,
                'cycle_life' => '>2000',
                'energy_density' => '230+ Wh/L',
                'applications' => '运动手环、健身追踪器、医疗级可穿戴设备',
                'certifications' => 'UL、CE、FCC',
                'customization_info' => '可定制形状尺寸，满足各类运动设备需求。提供OEM配套服务。',
                'highlights' => '叠片工艺低内阻、高倍率放电、卓越循环寿命、异形定制灵活',
                'operating_temperature' => '-10°C ~ 55°C',
                'weight' => '11g',
            ],
            // 医疗设备 - 卷绕工艺
            [
                'name' => '医疗设备用聚合物电池 (卷绕)',
                'model' => 'ZFK-WND-1500-3.7-MD',
                'capacity' => 1500,
                'voltage' => 3.7,
                'size' => '42 x 30 x 8mm',
                'description' => '符合医疗设备标准的聚合物锂电池，采用卷绕工艺，成本可控、交期稳定。适用于便携式医疗仪器、监护设备等。产品品质稳定，具有优异的循环性能。',
                'slug' => 'medical-device-polymer-battery-wound-1500mah',
                'meta_title' => '医疗设备1500mAh聚合物锂电池-卷绕工艺-ZUFEK',
                'meta_description' => '医疗级聚合物锂电池供应，1500mAh卷绕工艺，符合UL/CE标准，可靠耐用。',
                'process_type' => 'wound',
                'capacity_min' => 1000,
                'capacity_max' => 2000,
                'internal_resistance' => 70,
                'cycle_life' => '>1500',
                'energy_density' => '210+ Wh/L',
                'applications' => '便携式医疗设备、病人监护仪、诊断设备、医用传感器',
                'certifications' => 'UL2054、CE、医疗器械注册',
                'customization_info' => '异形电池可定制，满足特定医疗设备外形。提供医疗级测试报告。',
                'highlights' => '医疗级可靠性、成本可控、支持异形定制、完整的认证和测试',
                'operating_temperature' => '-20°C ~ 60°C',
                'weight' => '28g',
            ],
            // 医疗设备 - 叠片工艺（高功率）
            [
                'name' => '便携诊断仪聚合物电池 (叠片)',
                'model' => 'ZFK-STK-2000-3.7-MH',
                'capacity' => 2000,
                'voltage' => 3.7,
                'size' => '48 x 35 x 10mm',
                'description' => '为便携诊断设备设计的高性能聚合物锂电池，叠片工艺内阻极低，支持高倍率放电。能量密度高、循环寿命长，满足医疗设备的严苛要求。',
                'slug' => 'portable-diagnostic-polymer-battery-stacked-2000mah',
                'meta_title' => '诊断仪2000mAh聚合物锂电池-叠片工艺-ZUFEK',
                'meta_description' => '便携诊断设备用聚合物锂电池，2000mAh叠片工艺，低内阻、高倍率、长寿命。',
                'process_type' => 'stacked',
                'capacity_min' => 1500,
                'capacity_max' => 2500,
                'internal_resistance' => 25,
                'cycle_life' => '>2500',
                'energy_density' => '240+ Wh/L',
                'applications' => '便携式诊断设备、血糖仪、心电图仪、超声设备',
                'certifications' => 'UL2054、CE、FDA注册',
                'customization_info' => '支持异形电池定制，可根据设备结构优化设计。提供完整医疗认证。',
                'highlights' => '叠片工艺极低内阻、高倍率快速充放电、超长循环寿命、医疗级认证',
                'operating_temperature' => '-10°C ~ 55°C',
                'weight' => '38g',
            ],
            // 异形电池示例 1
            [
                'name' => '异形聚合物电池 - L型设计',
                'model' => 'ZFK-CUSTOM-L-800-3.7',
                'capacity' => 800,
                'voltage' => 3.7,
                'size' => '40 x 30 (L-shape)',
                'description' => 'ZUFEK的异形定制优势展示：L型设计充分利用设备空间，容量更大但占用空间更优化。可根据实际设备形状进行任意定制，需评估可行性后确认。',
                'slug' => 'custom-l-shaped-polymer-battery-800mah',
                'meta_title' => '异形L型800mAh聚合物锂电池-ZUFEK定制',
                'meta_description' => 'ZUFEK异形电池定制，L型设计800mAh，充分利用可用空间，支持自定义形状。',
                'process_type' => 'wound',
                'capacity_min' => 600,
                'capacity_max' => 1000,
                'internal_resistance' => 85,
                'cycle_life' => '>1000',
                'energy_density' => '200+ Wh/L',
                'applications' => '可穿戴设备、医疗设备、IoT设备等需要异形电池的应用',
                'certifications' => 'UL、CE',
                'customization_info' => '该产品为异形定制示例。ZUFEK支持任意形状的聚合物电池定制，包括圆形、矩形、L型、T型等。定制周期通常7-10天，具体需根据复杂度评估。起订量: 1000套。',
                'highlights' => '完全自定义形状、充分利用空间、快速交样、成本透明',
                'operating_temperature' => '-20°C ~ 60°C',
                'weight' => '12g',
            ],
            // 异形电池示例 2
            [
                'name' => '异形聚合物电池 - 弧形设计',
                'model' => 'ZFK-CUSTOM-ARC-1200-3.7',
                'capacity' => 1200,
                'voltage' => 3.7,
                'size' => '50 x 35 (Curved)',
                'description' => '为弧形设备专门设计的聚合物锂电池，采用叠片工艺以实现最优的内阻和能量密度。完美适配人体工程学外形设计，提供业界最佳的形状灵活性。',
                'slug' => 'custom-curved-polymer-battery-1200mah',
                'meta_title' => '异形弧形1200mAh聚合物锂电池-ZUFEK',
                'meta_description' => '弧形聚合物锂电池1200mAh，叠片工艺，完美适配人体工程学设计。',
                'process_type' => 'stacked',
                'capacity_min' => 1000,
                'capacity_max' => 1500,
                'internal_resistance' => 35,
                'cycle_life' => '>2000',
                'energy_density' => '225+ Wh/L',
                'applications' => '可穿戴医疗设备、人体监测设备、弧形屏幕设备',
                'certifications' => 'UL2054、CE',
                'customization_info' => '弧形/曲面电池是ZUFEK的特色定制方向。支持各种曲率半径和弧度设计。可提供结构优化建议，帮助客户实现最优的产品设计。',
                'highlights' => '弧形设计灵活、叠片工艺高性能、人体工程学、完全异形定制',
                'operating_temperature' => '-10°C ~ 55°C',
                'weight' => '18g',
            ],
        ];

        // 使用 upsert 更新或插入，避免重复错误
        // 以 slug 为唯一键，防止重复
        foreach ($products as $product) {
            Product::updateOrCreate(
                ['slug' => $product['slug']], // 检查条件
                $product // 更新/创建数据
            );
        }
    }
}
