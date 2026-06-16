<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sla_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('task_type_id')->constrained()->cascadeOnDelete();
            $table->integer('response_hours');
            $table->integer('resolution_hours');
            $table->boolean('enabled')->default(true);
            $table->timestamps();
            $table->unique(['project_id', 'task_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sla_policies');
    }
};
