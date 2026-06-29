<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_channels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('driver', 30);
            $table->string('name', 100);
            $table->json('config')->nullable();
            $table->boolean('enabled')->default(true);
            $table->timestamps();

            $table->index(['workspace_id', 'driver']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_channels');
    }
};
