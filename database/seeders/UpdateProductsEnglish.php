<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class UpdateProductsEnglish extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Smartwatch Battery (Wound Cell)
        Product::updateOrCreate(
            ['slug' => 'smart-watch-polymer-battery-wound'],
            [
                'name' => 'Smart Watch Polymer Battery (Wound Cell)',
                'model' => 'ZFK-SW-W-300',
                'description' => 'High energy density polymer lithium battery designed specifically for smartwatches. Uses wound cell technology for cost-effective production and fast delivery. Ideal for compact wearable devices.',
                'capacity' => 300,
                'voltage' => 3.7,
                'size' => '22×30×5 mm',
                'weight' => 8,
                'applications' => 'wearable,smartwatch',
                'process_type' => 'wound',
                'internal_resistance' => 120,
                'cycle_life' => 400,
                'energy_density' => 180,
                'certifications' => 'UL, CE/RoHS',
                'highlights' => 'Perfect for smartwatch applications, reliable performance',
                'operating_temperature' => '-10°C to +60°C'
            ]
        );

        // Sports Band Battery (Stacked Cell)
        Product::updateOrCreate(
            ['slug' => 'sports-band-polymer-battery-stacked'],
            [
                'name' => 'Sports Band High-Rate Battery (Stacked Cell)',
                'model' => 'ZFK-SB-S-400',
                'description' => 'High-rate polymer lithium battery using stacked cell technology. Features low internal resistance and strong cycle performance. Designed for fitness trackers and sports wearables requiring extended battery life.',
                'capacity' => 400,
                'voltage' => 3.7,
                'size' => '25×35×4 mm',
                'weight' => 10,
                'applications' => 'wearable,sports,fitness',
                'process_type' => 'stacked',
                'internal_resistance' => 45,
                'cycle_life' => 600,
                'energy_density' => 190,
                'certifications' => 'UL, CE/RoHS, FDA',
                'highlights' => 'Low resistance, excellent cycle performance, perfect for sports applications',
                'operating_temperature' => '-10°C to +60°C'
            ]
        );

        // Medical Device Battery (Wound Cell)
        Product::updateOrCreate(
            ['slug' => 'medical-device-polymer-battery-wound'],
            [
                'name' => 'Medical Device Polymer Battery (Wound Cell)',
                'model' => 'ZFK-MD-W-500',
                'description' => 'Compliant with medical device standards. Polymer lithium battery using wound cell technology offers cost-effective solutions. Certified for use in diagnostic and monitoring devices.',
                'capacity' => 500,
                'voltage' => 3.7,
                'size' => '30×40×6 mm',
                'weight' => 14,
                'applications' => 'medical,device',
                'process_type' => 'wound',
                'internal_resistance' => 100,
                'cycle_life' => 350,
                'energy_density' => 185,
                'certifications' => 'UL2054, FDA, CE/RoHS, ISO 9001',
                'highlights' => 'Medical grade, certified and reliable',
                'operating_temperature' => '-10°C to +60°C'
            ]
        );

        // Implantable Device Battery (Stacked Cell)
        Product::updateOrCreate(
            ['slug' => 'implantable-device-battery-stacked'],
            [
                'name' => 'Implantable Device Ultra-High Performance Battery',
                'model' => 'ZFK-ID-S-200',
                'description' => 'Ultra-low internal resistance stacked cell battery for implantable medical devices. Meets biocompatibility and regulatory requirements. Designed for long-term reliability in critical medical applications.',
                'capacity' => 200,
                'voltage' => 3.7,
                'size' => '20×25×4 mm',
                'weight' => 6,
                'applications' => 'medical,implantable',
                'process_type' => 'stacked',
                'internal_resistance' => 35,
                'cycle_life' => 800,
                'energy_density' => 200,
                'certifications' => 'UL2054, FDA, ISO 14971, ISO 13485',
                'highlights' => 'Highest reliability, implantable grade, FDA certified',
                'operating_temperature' => '-10°C to +60°C'
            ]
        );

        // IoT Sensor Battery (Wound Cell)
        Product::updateOrCreate(
            ['slug' => 'iot-sensor-battery-wound'],
            [
                'name' => 'IoT Sensor Long-Life Battery (Wound Cell)',
                'model' => 'ZFK-IoT-W-600',
                'description' => 'Optimized for IoT sensors and smart home devices. Extended battery life with stable discharge curve. Wound cell technology ensures reliable performance in connected device applications.',
                'capacity' => 600,
                'voltage' => 3.7,
                'size' => '30×45×7 mm',
                'weight' => 16,
                'applications' => 'iot,smart-home,sensor',
                'process_type' => 'wound',
                'internal_resistance' => 85,
                'cycle_life' => 450,
                'energy_density' => 188,
                'certifications' => 'UL, CE/RoHS, FCC',
                'highlights' => 'Extended runtime, reliable connectivity support',
                'operating_temperature' => '-10°C to +60°C'
            ]
        );

        // Power Tool Battery (Stacked Cell)
        Product::updateOrCreate(
            ['slug' => 'power-tool-battery-stacked'],
            [
                'name' => 'Power Tool High-Performance Battery',
                'model' => 'ZFK-PT-S-1500',
                'description' => 'Industrial-grade high-rate battery for professional power tools and equipment. Stacked cell technology delivers maximum power output with minimal resistance.',
                'capacity' => 1500,
                'voltage' => 7.4,
                'size' => '60×80×15 mm',
                'weight' => 45,
                'applications' => 'power-tools,industrial',
                'process_type' => 'stacked',
                'internal_resistance' => 25,
                'cycle_life' => 700,
                'energy_density' => 210,
                'certifications' => 'UL, CE/RoHS, FCC',
                'highlights' => 'Professional grade, maximum power output',
                'operating_temperature' => '-10°C to +60°C'
            ]
        );

        $this->command->info('✅ Products updated to English successfully!');
    }
}
