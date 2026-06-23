<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('event_type', 100);
            $table->json('conditions')->nullable();
            $table->json('channels')->nullable();
            $table->boolean('enabled')->default(true);
            $table->timestamps();

            $table->index(['user_id', 'event_type', 'enabled']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_rules');
    }
};
