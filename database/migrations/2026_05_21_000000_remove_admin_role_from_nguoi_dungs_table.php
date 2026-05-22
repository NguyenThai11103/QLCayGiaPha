<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('nguoi_dungs')->where('quyen_han', 'admin')->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No down migration since we don't know the exact details of the deleted accounts
    }
};
