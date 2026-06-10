<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                $table->string('name', 150)->change();
            }

            $table->string('avatar')->nullable()->after('password');
            $table->string('timezone', 100)->default('Asia/Jakarta')->after('avatar');
            $table->string('locale', 20)->default('id')->after('timezone');
            $table->string('status', 30)->default('active')->after('locale');
            $table->timestamp('last_login_at')->nullable()->after('status');
            $table->softDeletes()->after('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['last_login_at', 'status', 'locale', 'timezone', 'avatar']);

            if (DB::getDriverName() !== 'sqlite') {
                $table->string('name', 255)->change();
            }
        });
    }
};
