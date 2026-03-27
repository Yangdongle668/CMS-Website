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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // 产品名称
            $table->string('model')->nullable(); // 型号
            $table->integer('capacity')->nullable(); // mAh容量
            $table->float('voltage')->nullable(); // 电压
            $table->string('size')->nullable(); // 尺寸
            $table->text('description')->nullable(); // 产品描述
            $table->string('image')->nullable(); // 主图路径
            $table->string('slug')->unique(); // SEO友好URL
            $table->string('meta_title')->nullable(); // SEO标题
            $table->text('meta_description')->nullable(); // SEO描述
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
