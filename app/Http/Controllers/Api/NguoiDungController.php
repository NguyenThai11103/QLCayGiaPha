<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\NguoiDung\CreateNguoiDungRequest;
use App\Http\Requests\NguoiDung\UpdateNguoiDungRequest;
use App\Http\Requests\NguoiDung\DeleteNguoiDungRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class NguoiDungController extends Controller
{
    public function index(Request $request)
    {
        $idDongHo = $request->query('dong_ho_id');
        $query = DB::table('nguoi_dungs');

        if ($idDongHo) {
            $query->where('dong_ho_id', $idDongHo);
        }

        $data = $query->get();

        // Xoá password khỏi response
        $data = $data->map(function ($item) {
            unset($item->password);
            return $item;
        });

        return response()->json([
            'success'   => true,
            'data'      => $data
        ]);
    }

    public function store(CreateNguoiDungRequest $request)
    {
        $data = $request->validated();
        
        $data['password']   = Hash::make($data['password']);
        $data['quyen_han']  = $data['quyen_han'] ?? 'thanh_vien';
        $data['created_at'] = now();
        $data['updated_at'] = now();

        $id = DB::table('nguoi_dungs')->insertGetId($data);

        return response()->json([
            'success'   => true,
            'message'   => 'Tạo người dùng thành công',
            'id'        => $id
        ]);
    }

    public function update(UpdateNguoiDungRequest $request)
    {
        $data = $request->validated();
        $id = $data['id'];
        unset($data['id']);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $data['updated_at'] = now();

        DB::table('nguoi_dungs')->where('id', $id)->update($data);

        return response()->json([
            'success'   => true,
            'message'   => 'Cập nhật người dùng thành công'
        ]);
    }

    public function destroy(DeleteNguoiDungRequest $request)
    {
        $data = $request->validated();
        
        DB::table('nguoi_dungs')->where('id', $data['id'])->delete();

        return response()->json([
            'success'   => true,
            'message'   => 'Xóa người dùng thành công'
        ]);
    }
}
