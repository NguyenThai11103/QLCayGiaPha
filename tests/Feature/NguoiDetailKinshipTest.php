<?php

use App\Models\NguoiDung;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

function createTestDongHo(): int
{
    $dongHoId = DB::table('dong_hos')->insertGetId([
        'ten_dong_ho' => 'Test kinship',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    Sanctum::actingAs(NguoiDung::create([
        'dong_ho_id' => $dongHoId,
        'ho_ten' => 'Quan Ly Test',
        'email' => 'quanly@test.local',
        'password' => Hash::make('password'),
        'quyen_han' => 'quan_ly',
    ]));

    return $dongHoId;
}

function createTestThanhVien(int $dongHoId, string $name, string $gender): int
{
    return DB::table('thanh_viens')->insertGetId([
        'dong_ho_id' => $dongHoId,
        'ho_ten' => $name,
        'gioi_tinh' => $gender,
        'tinh_trang_song' => 1,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

function createTestQuanHe(int $node1, int $node2, string $type): void
{
    DB::table('quan_hes')->insert([
        'node_1_id' => $node1,
        'node_2_id' => $node2,
        'loai_quan_he' => $type,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

function detailRelationFor($testCase, int $subjectId, int $relativeId): string
{
    $response = $testCase->getJson("/api/nguoi/detail?id={$subjectId}");

    $response->assertOk()
        ->assertJsonPath('success', true);

    $relations = collect($response->json('data.danh_sach_quan_he'));
    $relation = $relations->firstWhere('nguoi.id', $relativeId);

    expect($relation)->not->toBeNull();

    return $relation['xung_ho'];
}

it('describes direct parent in law relations through husband and wife', function () {
    $dongHoId = createTestDongHo();

    $fatherOfHusband = createTestThanhVien($dongHoId, 'Cha Chồng', 'nam');
    $motherOfHusband = createTestThanhVien($dongHoId, 'Mẹ Chồng', 'nu');
    $husband = createTestThanhVien($dongHoId, 'Người Chồng', 'nam');
    $daughterInLaw = createTestThanhVien($dongHoId, 'Con Dâu', 'nu');

    $fatherOfWife = createTestThanhVien($dongHoId, 'Cha Vợ', 'nam');
    $motherOfWife = createTestThanhVien($dongHoId, 'Mẹ Vợ', 'nu');
    $wife = createTestThanhVien($dongHoId, 'Người Vợ', 'nu');
    $sonInLaw = createTestThanhVien($dongHoId, 'Con Rể', 'nam');

    createTestQuanHe($fatherOfHusband, $husband, 'cha_con');
    createTestQuanHe($motherOfHusband, $husband, 'me_con');
    createTestQuanHe($husband, $daughterInLaw, 'vo_chong');

    createTestQuanHe($fatherOfWife, $wife, 'cha_con');
    createTestQuanHe($motherOfWife, $wife, 'me_con');
    createTestQuanHe($wife, $sonInLaw, 'vo_chong');

    expect(detailRelationFor($this, $fatherOfHusband, $daughterInLaw))->toBe('con dâu của Cha Chồng');
    expect(detailRelationFor($this, $motherOfHusband, $daughterInLaw))->toBe('con dâu của Mẹ Chồng');
    expect(detailRelationFor($this, $daughterInLaw, $fatherOfHusband))->toBe('cha chồng của Con Dâu');
    expect(detailRelationFor($this, $daughterInLaw, $motherOfHusband))->toBe('mẹ chồng của Con Dâu');

    expect(detailRelationFor($this, $fatherOfWife, $sonInLaw))->toBe('con rể của Cha Vợ');
    expect(detailRelationFor($this, $motherOfWife, $sonInLaw))->toBe('con rể của Mẹ Vợ');
    expect(detailRelationFor($this, $sonInLaw, $fatherOfWife))->toBe('cha vợ của Con Rể');
    expect(detailRelationFor($this, $sonInLaw, $motherOfWife))->toBe('mẹ vợ của Con Rể');
});

it('keeps direct blood relation labels stable', function () {
    $dongHoId = createTestDongHo();

    $father = createTestThanhVien($dongHoId, 'Cha', 'nam');
    $mother = createTestThanhVien($dongHoId, 'Mẹ', 'nu');
    $child = createTestThanhVien($dongHoId, 'Con', 'nam');
    $grandchild = createTestThanhVien($dongHoId, 'Cháu', 'nu');

    createTestQuanHe($father, $child, 'cha_con');
    createTestQuanHe($mother, $child, 'me_con');
    createTestQuanHe($child, $grandchild, 'cha_con');

    expect(detailRelationFor($this, $child, $father))->toBe('Cha');
    expect(detailRelationFor($this, $child, $mother))->toBe('Me');
    expect(detailRelationFor($this, $father, $child))->toBe('Con');
    expect(detailRelationFor($this, $grandchild, $father))->toBe('Ong');
    expect(detailRelationFor($this, $father, $grandchild))->toBe('Chau');
});

it('describes grandparents through maternal links and spouses of direct ancestors', function () {
    $dongHoId = createTestDongHo();

    $grandfather = createTestThanhVien($dongHoId, 'Grandfather', 'nam');
    $grandmotherByMarriage = createTestThanhVien($dongHoId, 'Grandmother By Marriage', 'nu');
    $mother = createTestThanhVien($dongHoId, 'Mother', 'nu');
    $father = createTestThanhVien($dongHoId, 'Father', 'nam');
    $child = createTestThanhVien($dongHoId, 'Grandchild', 'nam');

    createTestQuanHe($grandfather, $grandmotherByMarriage, 'vo_chong');
    createTestQuanHe($grandfather, $father, 'cha_con');
    createTestQuanHe($mother, $father, 'vo_chong');
    createTestQuanHe($mother, $child, 'me_con');
    createTestQuanHe($father, $child, 'cha_con');

    expect(detailRelationFor($this, $child, $mother))->toBe('Me');
    expect(detailRelationFor($this, $child, $grandmotherByMarriage))->toBe('Ba');
    expect(detailRelationFor($this, $grandmotherByMarriage, $child))->toBe('Chau');
});

it('fails when child order age sequence is violated', function () {
    $dongHoId = createTestDongHo();
    $fatherId = createTestThanhVien($dongHoId, 'Cha Test', 'nam');

    // Tạo con thứ 1 sinh năm 2000
    $child1Id = DB::table('thanh_viens')->insertGetId([
        'dong_ho_id' => $dongHoId,
        'ho_ten' => 'Con Thu Nhat',
        'gioi_tinh' => 'nam',
        'tinh_trang_song' => 1,
        'ngay_sinh_duong' => '2000-01-01',
        'thu_tu_sinh' => 1,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    createTestQuanHe($fatherId, $child1Id, 'cha_con');

    // Thêm con thứ 2 nhưng sinh năm 1999 (vi phạm vì thu_tu_sinh lớn hơn nhưng sinh trước)
    $response = $this->postJson('/api/nguoi/create', [
        'id_dong_ho' => $dongHoId,
        'ten_day_du' => 'Con Thu Hai',
        'gioi_tinh' => 'nam',
        'da_mat' => false,
        'ngay_sinh' => '1999-01-01',
        'id_cha' => $fatherId,
        'thu_tu_sinh' => 2,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('ngay_sinh');
});

it('fails when child is born before or in the same year as parents', function () {
    $dongHoId = createTestDongHo();

    // Tạo cha sinh năm 1980
    $fatherId = DB::table('thanh_viens')->insertGetId([
        'dong_ho_id' => $dongHoId,
        'ho_ten' => 'Cha Test',
        'gioi_tinh' => 'nam',
        'tinh_trang_song' => 1,
        'ngay_sinh_duong' => '1980-05-15',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Thêm con sinh năm 1979 (sinh trước cha) -> Lỗi
    $response = $this->postJson('/api/nguoi/create', [
        'id_dong_ho' => $dongHoId,
        'ten_day_du' => 'Con Test',
        'gioi_tinh' => 'nam',
        'da_mat' => false,
        'ngay_sinh' => '1979-01-01',
        'id_cha' => $fatherId,
        'thu_tu_sinh' => 1,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('ngay_sinh');

    // Thêm con sinh năm 1980 (cùng năm với cha) -> Lỗi
    $responseSameYear = $this->postJson('/api/nguoi/create', [
        'id_dong_ho' => $dongHoId,
        'ten_day_du' => 'Con Test 2',
        'gioi_tinh' => 'nam',
        'da_mat' => false,
        'ngay_sinh' => '1980-12-31',
        'id_cha' => $fatherId,
        'thu_tu_sinh' => 2,
    ]);

    $responseSameYear->assertStatus(422);
    $responseSameYear->assertJsonValidationErrors('ngay_sinh');
});

it('fails when spouse is born before or in the same year as parents in law', function () {
    $dongHoId = createTestDongHo();

    // Tạo cha sinh năm 1980
    $fatherId = DB::table('thanh_viens')->insertGetId([
        'dong_ho_id' => $dongHoId,
        'ho_ten' => 'Cha Chồng',
        'gioi_tinh' => 'nam',
        'tinh_trang_song' => 1,
        'ngay_sinh_duong' => '1980-01-01',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Tạo con sinh năm 2005
    $childId = DB::table('thanh_viens')->insertGetId([
        'dong_ho_id' => $dongHoId,
        'ho_ten' => 'Người Con',
        'gioi_tinh' => 'nam',
        'tinh_trang_song' => 1,
        'ngay_sinh_duong' => '2005-01-01',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    createTestQuanHe($fatherId, $childId, 'cha_con');

    // Tạo một người sinh năm 1979 (dùng làm con dâu)
    $spouseId = DB::table('thanh_viens')->insertGetId([
        'dong_ho_id' => $dongHoId,
        'ho_ten' => 'Con Dâu Vi Phạm',
        'gioi_tinh' => 'nu',
        'tinh_trang_song' => 1,
        'ngay_sinh_duong' => '1979-12-31', // Sinh trước cha chồng (1980)
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Thêm quan hệ vợ chồng (khi cập nhật hoặc thêm con dâu là vợ của người con)
    // Thử cập nhật người con để kết hôn với người con dâu này
    $response = $this->postJson('/api/nguoi/update', [
        'id' => $childId,
        'id_vo_chong' => $spouseId,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('id_vo_chong_list');
});
