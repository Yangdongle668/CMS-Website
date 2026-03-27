<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // 工艺类型：卷绕(wound) / 叠片(stacked)
            $table->string('process_type')->nullable()->comment('工艺类型');

            // 容量范围
            $table->integer('capacity_min')->nullable()->comment('最小容量 mAh');
            $table->integer('capacity_max')->nullable()->comment('最大容量 mAh');

            // 电化学性能
            $table->float('internal_resistance')->nullable()->comment('内阻 mΩ');
            $table->string('cycle_life')->nullable()->comment('循环寿命');
            $table->string('energy_density')->nullable()->comment('能量密度');

            // 应用领域
            $table->text('applications')->nullable()->comment('应用领域');

            // 认证和合规
            $table->text('certifications')->nullable()->comment('认证信息');

            // 定制能力
            $table->text('customization_info')->nullable()->comment('定制说明');

            // 产品亮点
            $table->text('highlights')->nullable()->comment('核心亮点');

            // 工作条件
            $table->string('operating_temperature')->nullable()->comment('工作温度范围');
            $table->string('weight')->nullable()->comment('重量');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'process_type',
                'capacity_min',
                'capacity_max',
                'internal_resistance',
                'cycle_life',
                'energy_density',
                'applications',
                'certifications',
                'customization_info',
                'highlights',
                'operating_temperature',
                'weight',
            ]);
        });
    }
};
