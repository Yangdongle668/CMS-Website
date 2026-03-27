<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        Product::create([
            'name' => '3.7V 1000mAh Lithium Battery',
            'model' => 'BAT-1000-3.7V',
            'capacity' => 1000,
            'voltage' => 3.7,
            'size' => '18 x 30 x 5mm',
            'description' => 'High-performance lithium battery ideal for AR glasses and wearable devices. Features superior energy density and long cycle life.',
            'slug' => '3-7v-1000mah-lithium-battery',
            'meta_title' => '3.7V 1000mAh Lithium Battery for AR Glasses - Raven Battery',
            'meta_description' => 'Professional grade 3.7V 1000mAh lithium battery for AR glasses and electronic devices. High capacity, reliable performance.',
        ]);

        Product::create([
            'name' => '3.7V 2000mAh Lithium Battery',
            'model' => 'BAT-2000-3.7V',
            'capacity' => 2000,
            'voltage' => 3.7,
            'size' => '20 x 35 x 8mm',
            'description' => 'Extended capacity lithium battery for devices requiring longer runtime. Ideal for IoT and portable electronics.',
            'slug' => '3-7v-2000mah-lithium-battery',
            'meta_title' => '3.7V 2000mAh Lithium Battery - Extended Capacity - Raven Battery',
            'meta_description' => '2000mAh lithium battery delivering extended runtime for AR glasses, IoT devices, and portable electronics.',
        ]);

        Product::create([
            'name' => '3.7V 500mAh Ultra-Slim Battery',
            'model' => 'BAT-500-3.7V-SLIM',
            'capacity' => 500,
            'voltage' => 3.7,
            'size' => '15 x 25 x 3mm',
            'description' => 'Ultra-slim lithium battery optimized for thin-profile devices. Perfect for lightweight AR glasses and compact electronics.',
            'slug' => '3-7v-500mah-ultra-slim-battery',
            'meta_title' => '3.7V 500mAh Ultra-Slim Lithium Battery - Raven Battery',
            'meta_description' => 'Ultra-thin lithium battery for slim AR glasses and compact devices. Superior performance in minimal space.',
        ]);

        Product::create([
            'name' => '7.4V 2000mAh Dual Cell Battery',
            'model' => 'BAT-2000-7.4V-DC',
            'capacity' => 2000,
            'voltage' => 7.4,
            'size' => '20 x 35 x 15mm',
            'description' => 'Dual-cell lithium battery providing 7.4V output. Designed for high-power applications and demanding devices.',
            'slug' => '7-4v-2000mah-dual-cell-battery',
            'meta_title' => '7.4V 2000mAh Dual Cell Lithium Battery - High Power - Raven Battery',
            'meta_description' => '7.4V 2000mAh dual-cell lithium battery for high-power AR devices and demanding applications.',
        ]);

        Product::create([
            'name' => '3.7V 1500mAh Standard Battery',
            'model' => 'BAT-1500-3.7V-STD',
            'capacity' => 1500,
            'voltage' => 3.7,
            'size' => '19 x 32 x 6mm',
            'description' => 'Standard capacity lithium battery balancing performance and size. The most popular choice for AR glasses manufacturers.',
            'slug' => '3-7v-1500mah-standard-battery',
            'meta_title' => '3.7V 1500mAh Standard Lithium Battery - Popular Choice - Raven Battery',
            'meta_description' => 'Standard capacity 1500mAh lithium battery. The most popular choice for AR glasses and wearable devices.',
        ]);

        Product::create([
            'name' => '3.7V 3000mAh Extended Capacity',
            'model' => 'BAT-3000-3.7V-XL',
            'capacity' => 3000,
            'voltage' => 3.7,
            'size' => '22 x 40 x 10mm',
            'description' => 'Maximum capacity lithium battery for extended operation. Ideal for professional and industrial applications.',
            'slug' => '3-7v-3000mah-extended-capacity',
            'meta_title' => '3.7V 3000mAh Extended Capacity Lithium Battery - Raven Battery',
            'meta_description' => 'Maximum capacity 3000mAh lithium battery for extended runtime and professional applications.',
        ]);
    }
}
