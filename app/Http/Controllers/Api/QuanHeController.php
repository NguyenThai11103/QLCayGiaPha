<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuanHe\CreateQuanHeRequest;
use App\Http\Requests\QuanHe\UpdateQuanHeRequest;
use App\Http\Requests\QuanHe\DeleteQuanHeRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuanHeController extends Controller
{
    public function index(Request $request)
    {
        $nodeId = $request->query('thanh_vien_id');
        $query = DB::table('quan_hes');

        if ($nodeId) {
            $query->where('node_1_id', $nodeId)->orWhere('node_2_id', $nodeId);
        }

        $data = $query->get();

        return response()->json([
            'success'   => true,
            'data'      => $data
        ]);
    }

    public function store(CreateQuanHeRequest $request)
    {
        $data = $request->validated();
        
        $data['created_at'] = now();
        $data['updated_at'] = now();

        $id = DB::table('quan_hes')->insertGetId($data);

        return response()->json([
            'success'   => true,
            'message'   => 'Tạo quan hệ thành công',
            'id'        => $id
        ]);
    }

    public function update(UpdateQuanHeRequest $request)
    {
        $data = $request->validated();
        $id = $data['id'];
        unset($data['id']);

        $data['updated_at'] = now();

        DB::table('quan_hes')->where('id', $id)->update($data);

        return response()->json([
            'success'   => true,
            'message'   => 'Cập nhật quan hệ thành công'
        ]);
    }

    public function destroy(DeleteQuanHeRequest $request)
    {
        $data = $request->validated();
        
        DB::table('quan_hes')->where('id', $data['id'])->delete();

        return response()->json([
            'success'   => true,
            'message'   => 'Xóa quan hệ thành công'
        ]);
    }
}
