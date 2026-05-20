<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CacheXungHo\CreateCacheXungHoRequest;
use App\Http\Requests\CacheXungHo\UpdateCacheXungHoRequest;
use App\Http\Requests\CacheXungHo\DeleteCacheXungHoRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CacheXungHoController extends Controller
{
    public function index(Request $request)
    {
        $idDongHo = $request->query('dong_ho_id');
        $query = DB::table('cache_xung_ho');

        if ($idDongHo) {
            $query->where('dong_ho_id', $idDongHo);
        }

        $data = $query->get();

        return response()->json([
            'success'   => true,
            'data'      => $data
        ]);
    }

    public function store(CreateCacheXungHoRequest $request)
    {
        $data = $request->validated();
        
        $data['created_at'] = now();
        $data['updated_at'] = now();

        $id = DB::table('cache_xung_ho')->insertGetId($data);

        return response()->json([
            'success'   => true,
            'message'   => 'Tạo cache xưng hô thành công',
            'id'        => $id
        ]);
    }

    public function update(UpdateCacheXungHoRequest $request)
    {
        $data = $request->validated();
        $id = $data['id'];
        unset($data['id']);

        $data['updated_at'] = now();

        DB::table('cache_xung_ho')->where('id', $id)->update($data);

        return response()->json([
            'success'   => true,
            'message'   => 'Cập nhật cache xưng hô thành công'
        ]);
    }

    public function destroy(DeleteCacheXungHoRequest $request)
    {
        $data = $request->validated();
        
        DB::table('cache_xung_ho')->where('id', $data['id'])->delete();

        return response()->json([
            'success'   => true,
            'message'   => 'Xóa cache xưng hô thành công'
        ]);
    }
}
