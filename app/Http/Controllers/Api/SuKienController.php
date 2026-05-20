<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuKien\CreateSuKienRequest;
use App\Http\Requests\SuKien\UpdateSuKienRequest;
use App\Http\Requests\SuKien\DeleteSuKienRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SuKienController extends Controller
{
    public function index(Request $request)
    {
        $idDongHo = $request->query('dong_ho_id');
        $query = DB::table('su_kiens');

        if ($idDongHo) {
            $query->where('dong_ho_id', $idDongHo);
        }

        $data = $query->get();

        return response()->json([
            'success'   => true,
            'data'      => $data
        ]);
    }

    public function store(CreateSuKienRequest $request)
    {
        $data = $request->validated();
        
        $data['lap_lai_hang_nam'] = $data['lap_lai_hang_nam'] ?? false;
        $data['created_at']       = now();
        $data['updated_at']       = now();

        $id = DB::table('su_kiens')->insertGetId($data);

        return response()->json([
            'success'   => true,
            'message'   => 'Tạo sự kiện thành công',
            'id'        => $id
        ]);
    }

    public function update(UpdateSuKienRequest $request)
    {
        $data = $request->validated();
        $id = $data['id'];
        unset($data['id']);

        $data['updated_at'] = now();

        DB::table('su_kiens')->where('id', $id)->update($data);

        return response()->json([
            'success'   => true,
            'message'   => 'Cập nhật sự kiện thành công'
        ]);
    }

    public function destroy(DeleteSuKienRequest $request)
    {
        $data = $request->validated();
        
        DB::table('su_kiens')->where('id', $data['id'])->delete();

        return response()->json([
            'success'   => true,
            'message'   => 'Xóa sự kiện thành công'
        ]);
    }
}
