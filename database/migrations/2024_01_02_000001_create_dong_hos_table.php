        <?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dong_hos', function (Blueprint $table) {
            $table->id();
            $table->string('ten_dong_ho');
            $table->string('logo_path')->nullable();
            $table->text('mo_ta')->nullable();
            $table->text('gia_huan')->nullable();
            $table->text('loi_gioi_thieu')->nullable();
            $table->string('dia_chi_tu_duong')->nullable();
            $table->string('anh_tu_duong_path')->nullable();
            $table->boolean('trang_thai')->default(true)->comment('true: hoạt động, false: bị khóa');
            $table->unsignedBigInteger('thuy_to_id')->nullable();
            $table->unsignedBigInteger('nguoi_tao')->nullable();
            $table->string('theme_color', 50)->default('gold');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dong_hos');
    }
};
