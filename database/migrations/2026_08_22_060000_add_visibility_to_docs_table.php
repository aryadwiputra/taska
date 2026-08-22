<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('docs', function (Blueprint $table) {
            $table->string('visibility', 20)->default('project')->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('docs', function (Blueprint $table) {
            $table->dropColumn('visibility');
        });
    }
};
