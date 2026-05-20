<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TaiLieu\CreateTaiLieuRequest;
use App\Http\Requests\TaiLieu\UpdateTaiLieuRequest;
use App\Http\Requests\TaiLieu\DeleteTaiLieuRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaiLieuController extends Controller
{
    public function index(Request $request)
    {
        $idDongHo = $request->query('dong_ho_id');
        $idThanhVien = $request->query('thanh_vien_id');
        
        $query = DB::table('tai_lieus');

        if ($idDongHo) {
            $query->where('dong_ho_id', $idDongHo);
        }
        
        if ($idThanhVien) {
            $query->where('thanh_vien_id', $idThanhVien);
        }

        $data = $query->get();

        return response()->json([
            'success'   => true,
            'data'      => $data
        ]);
    }

    public function store(CreateTaiLieuRequest $request)
    {
        $data = $request->validated();
        
        $data['created_at'] = now();
        $data['updated_at'] = now();

        $id = DB::table('tai_lieus')->insertGetId($data);

        return response()->json([
            'success'   => true,
            'message'   => 'Tạo tài liệu thành công',
            'id'        => $id
        ]);
    }

    public function update(UpdateTaiLieuRequest $request)
    {
        $data = $request->validated();
        $id = $data['id'];
        unset($data['id']);

        $data['updated_at'] = now();

        DB::table('tai_lieus')->where('id', $id)->update($data);

        return response()->json([
            'success'   => true,
            'message'   => 'Cập nhật tài liệu thành công'
        ]);
    }

    public function destroy(DeleteTaiLieuRequest $request)
    {
        $data = $request->validated();
        
        DB::table('tai_lieus')->where('id', $data['id'])->delete();

        return response()->json([
            'success'   => true,
            'message'   => 'Xóa tài liệu thành công'
        ]);
    }
}
