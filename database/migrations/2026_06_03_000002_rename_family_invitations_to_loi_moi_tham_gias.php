<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('family_invitations') && !Schema::hasTable('loi_moi_tham_gias')) {
            Schema::rename('family_invitations', 'loi_moi_tham_gias');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('loi_moi_tham_gias') && !Schema::hasTable('family_invitations')) {
            Schema::rename('loi_moi_tham_gias', 'family_invitations');
        }
    }
};
