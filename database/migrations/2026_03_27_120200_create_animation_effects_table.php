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
        Schema::create('animation_effects', function (Blueprint $table) {
            $table->id();
            $table->string('target_element')->index();
            $table->enum('effect_type', [
                'fadeIn',
                'slideInUp',
                'slideInDown',
                'slideInLeft',
                'slideInRight',
                'scaleIn',
                'pulse',
                'bounce',
                'glow',
            ])->default('fadeIn');
            $table->integer('duration')->default(1000)->comment('Duration in milliseconds');
            $table->integer('delay')->default(0)->comment('Delay in milliseconds');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['target_element', 'effect_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('animation_effects');
    }
};
