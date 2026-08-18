<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doc_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doc_id')->constrained()->cascadeOnDelete();
            $table->foreignId('uploaded_by')->constrained('users');
            $table->string('disk', 50)->default('public');
            $table->string('file_name', 255);
            $table->string('file_path', 500);
            $table->string('mime_type', 150)->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['doc_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doc_attachments');
    }
};
