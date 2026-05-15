<?php

use Illuminate\Support\Facades\DB;

function createTestDongHo(): int
{
    return DB::table('dong_hos')->insertGetId([
        'ten_dong_ho' => 'Test kinship',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

function createTestThanhVien(int $dongHoId, string $name, string $gender): int
{
    return DB::table('thanh_viens')->insertGetId([
        'dong_ho_id' => $dongHoId,
        'ho_ten' => $name,
        'gioi_tinh' => $gender,
        'tinh_trang_song' => 'song',
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
