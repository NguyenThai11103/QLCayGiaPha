<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DongHo\CreateDongHoRequest;
use App\Http\Requests\DongHo\UpdateDongHoRequest;
use App\Http\Requests\DongHo\DeleteDongHoRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DongHoController extends Controller
{
    public function index()
    {
        $data = DB::table('dong_hos')->get();
        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    public function store(CreateDongHoRequest $request)
    {
        $data = $request->validated();
        $data['created_at'] = now();
        $data['updated_at'] = now();
        
        $id = DB::table('dong_hos')->insertGetId($data);
        return response()->json([
            'success' => true,
            'message' => 'Tạo thành công', 
            'id' => $id
        ]);
    }

    public function update(UpdateDongHoRequest $request)
    {
        $data = $request->validated();
        $id = $data['id'];
        unset($data['id']);
        $data['updated_at'] = now();

        DB::table('dong_hos')->where('id', $id)->update($data);
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thành công'
        ]);
    }

    public function destroy(DeleteDongHoRequest $request)
    {
        $data = $request->validated();
        DB::table('dong_hos')->where('id', $data['id'])->delete();
        return response()->json([
            'success' => true,
            'message' => 'Xóa thành công'
        ]);
    }
}
