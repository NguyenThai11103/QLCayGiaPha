<?php

namespace App\Console\Commands;

use App\Mail\AnniversaryReminderMail;
use App\Models\ThongBao;
use App\Support\LunarSolarConverter;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class RemindDeathAnniversary extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'giapha:remind-death-anniversary {--date= : Ngày dương lịch để test (định dạng YYYY-MM-DD)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Tự động quét các thành viên đã mất có ngày Giỗ âm lịch sắp tới trong 3 ngày để thông báo cho con cháu trong nhánh.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // 1. Xác định ngày Dương lịch để làm mốc tính toán (mặc định là hôm nay)
        $dateInput = $this->option('date') ?: Carbon::today()->format('Y-m-d');
        
        try {
            $baseDate = Carbon::parse($dateInput);
        } catch (\Exception $e) {
            $this->error('Định dạng ngày --date không hợp lệ. Vui lòng sử dụng YYYY-MM-DD.');
            return 1;
        }

        $this->info("Đang quét ngày Giỗ xuất phát từ ngày Dương lịch: " . $baseDate->format('d/m/Y'));

        // 2. Tính toán ngày 3 ngày sau (Gregorian)
        $targetDate = $baseDate->copy()->addDays(3);
        $this->info("Ngày cần kiểm tra (Dương lịch 3 ngày sau): " . $targetDate->format('d/m/Y'));

        // 3. Chuyển đổi ngày này sang Âm lịch Việt Nam
        $lunar = LunarSolarConverter::solarToLunar($targetDate);
        $lunarDay = $lunar['day'];
        $lunarMonth = $lunar['month'];
        $lunarYear = $lunar['year'];

        $lunarDateStr = LunarSolarConverter::formatLunarDate($lunarDay, $lunarMonth, $lunarYear, $lunar['is_leap']);
        $this->info("Ngày âm lịch tương ứng: " . $lunarDateStr);

        // 4. Truy vấn các thành viên đã mất có ngày/tháng âm lịch trùng với ngày/tháng âm lịch này
        $deceasedMembers = DB::table('thanh_viens')
            ->where('tinh_trang_song', 0)
            ->whereNotNull('ngay_mat_am')
            ->get()
            ->filter(function ($member) use ($lunarMonth, $lunarDay) {
                try {
                    $carbon = Carbon::parse($member->ngay_mat_am);
                    return $carbon->month === $lunarMonth && $carbon->day === $lunarDay;
                } catch (\Exception $e) {
                    return false;
                }
            });

        if ($deceasedMembers->isEmpty()) {
            $this->info('Không có thành viên nào có ngày Giỗ vào ngày này.');
            return 0;
        }

        $this->info('Tìm thấy ' . $deceasedMembers->count() . ' thành viên đã mất có ngày Giỗ sắp tới:');

        foreach ($deceasedMembers as $deceased) {
            $relationshipLabel = $deceased->gioi_tinh === 'nam' ? 'ông' : 'bà';
            $this->line(" - [ID: {$deceased->id}] {$deceased->ho_ten} (Ngày mất âm lịch: {$deceased->ngay_mat_am})");

            // 5. Lấy toàn bộ danh sách con cháu đệ quy trong nhánh của người đã mất
            $descendants = $this->getDescendants($deceased->id);
            $this->info("   -> Tìm thấy " . count($descendants) . " con cháu trong nhánh huyết thống.");

            if (empty($descendants)) {
                $this->comment("   -> Không có con cháu nào trong nhánh.");
                continue;
            }

            // 6. Tìm kiếm các tài khoản người dùng tương ứng với các con cháu này
            $users = DB::table('nguoi_dungs')
                ->whereIn('thanh_vien_id', $descendants)
                ->where('trang_thai', 1) // Chỉ gửi cho tài khoản hoạt động
                ->get();

            if ($users->isEmpty()) {
                $this->comment("   -> Không có con cháu nào đăng ký tài khoản trên hệ thống.");
                continue;
            }

            $this->info("   -> Gửi thông báo đến " . $users->count() . " tài khoản con cháu có email:");

            $dongHoName = DB::table('dong_hos')->where('id', $deceased->dong_ho_id)->value('ten_dong_ho') ?: 'Dòng Họ';

            foreach ($users as $user) {
                // Tiêu đề và nội dung thông báo
                $title = "Sắp tới ngày Giỗ của " . $relationshipLabel . " " . $deceased->ho_ten;
                $body = "Nhắc nhở: Lễ giỗ lần thứ " . ($lunarYear - Carbon::parse($deceased->ngay_mat_am)->year) . " của " . $relationshipLabel . " " . $deceased->ho_ten . " sẽ diễn ra vào ngày " . LunarSolarConverter::formatLunarDate($lunarDay, $lunarMonth, $lunarYear) . " Âm lịch (tức ngày " . $targetDate->format('d/m/Y') . " Dương lịch), còn đúng 3 ngày nữa.";

                // Gửi thông báo UI (lưu DB)
                // Đảm bảo không tạo trùng lặp thông báo cho cùng một người mất trong ngày quét hôm nay
                $exists = ThongBao::where('nguoi_dung_id', $user->id)
                    ->where('loai', 'event')
                    ->where('tieu_de', $title)
                    ->whereDate('created_at', Carbon::today())
                    ->exists();

                if (!$exists) {
                    ThongBao::create([
                        'nguoi_dung_id' => $user->id,
                        'loai'          => 'event',
                        'tieu_de'       => $title,
                        'noi_dung'      => $body,
                        'da_doc'        => false,
                    ]);
                    $this->line("      + Đã tạo thông báo UI cho: {$user->ho_ten} ({$user->email})");
                } else {
                    $this->line("      + Thông báo UI cho {$user->ho_ten} đã tồn tại trong ngày hôm nay.");
                }

                // Gửi Email nhắc nhở
                try {
                    Mail::to($user->email)->send(new AnniversaryReminderMail(
                        $user->ho_ten,
                        $deceased->ho_ten,
                        $deceased->doi_thu ?: 1,
                        $deceased->gioi_tinh === 'nam' ? 'Ông tổ / Cụ tổ' : 'Bà tổ / Cụ tổ',
                        LunarSolarConverter::formatLunarDate($lunarDay, $lunarMonth, Carbon::parse($deceased->ngay_mat_am)->year),
                        $targetDate->format('d/m/Y'),
                        $dongHoName
                    ));
                    $this->info("      + Đã gửi Email nhắc nhở thành công tới: {$user->email}");
                } catch (\Exception $mailEx) {
                    $this->error("      x Lỗi gửi email tới {$user->email}: " . $mailEx->getMessage());
                    Log::error("Lỗi gửi email ngày giỗ tới {$user->email}: " . $mailEx->getMessage());
                }
            }
        }

        $this->info('--- Hoàn tất tiến trình quét ngày Giỗ ---');
        return 0;
    }

    /**
     * Thuật toán BFS tìm toàn bộ con cháu đệ quy trong chi/nhánh dựa trên cha mẹ
     */
    private function getDescendants(int $parentId): array
    {
        $descendants = [];
        $queue = [$parentId];

        while (!empty($queue)) {
            $currId = array_shift($queue);

            // Tìm con đẻ qua quan hệ cha_con hoặc me_con
            $childrenIds = DB::table('quan_hes')
                ->where('node_1_id', $currId)
                ->whereIn('loai_quan_he', ['cha_con', 'me_con'])
                ->pluck('node_2_id')
                ->toArray();

            foreach ($childrenIds as $childId) {
                if (!in_array($childId, $descendants, true)) {
                    $descendants[] = $childId;
                    $queue[] = $childId;
                }
            }
        }

        return $descendants;
    }
}
