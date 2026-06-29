<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_preferences_v2', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 50);
            $table->string('channel', 30);
            $table->boolean('enabled')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'type', 'channel']);
            $table->index(['user_id', 'channel']);
        });

        if (Schema::hasTable('notification_preferences')) {
            $oldPreferences = DB::table('notification_preferences')->get();

            foreach ($oldPreferences as $old) {
                if ($old->in_app_enabled) {
                    DB::table('notification_preferences_v2')->insert([
                        'user_id' => $old->user_id,
                        'type' => $old->type,
                        'channel' => 'in_app',
                        'enabled' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
                if ($old->email_enabled) {
                    DB::table('notification_preferences_v2')->insert([
                        'user_id' => $old->user_id,
                        'type' => $old->type,
                        'channel' => 'email',
                        'enabled' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
                if ($old->whatsapp_enabled) {
                    DB::table('notification_preferences_v2')->insert([
                        'user_id' => $old->user_id,
                        'type' => $old->type,
                        'channel' => 'whatsapp',
                        'enabled' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            Schema::dropIfExists('notification_preferences');
        }

        Schema::rename('notification_preferences_v2', 'notification_preferences');
    }

    public function down(): void {}
};
