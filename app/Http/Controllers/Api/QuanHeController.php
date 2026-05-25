<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuanHe\CreateQuanHeRequest;
use App\Http\Requests\QuanHe\DeleteQuanHeRequest;
use App\Http\Requests\QuanHe\UpdateQuanHeRequest;
use App\Support\AccessControl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuanHeController extends Controller
{
    public function index(Request $request)
    {
        $nodeId = $request->query('thanh_vien_id');

        if ($nodeId && !AccessControl::canAccessFamily($request->user(), AccessControl::memberFamilyId($nodeId))) {
            return AccessControl::forbidden();
        }

        $query = DB::table('quan_hes')
            ->join('thanh_viens as node_1', 'quan_hes.node_1_id', '=', 'node_1.id')
            ->join('thanh_viens as node_2', 'quan_hes.node_2_id', '=', 'node_2.id')
            ->select('quan_hes.*');

        if (!AccessControl::isSystemAdmin($request->user())) {
            $familyId = AccessControl::familyId($request->user());
            $query->where('node_1.dong_ho_id', $familyId)
                ->where('node_2.dong_ho_id', $familyId);
        }

        if ($nodeId) {
            $query->where(function ($query) use ($nodeId) {
                $query->where('quan_hes.node_1_id', $nodeId)
                    ->orWhere('quan_hes.node_2_id', $nodeId);
            });
        }

        $data = $query->get();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function store(CreateQuanHeRequest $request)
    {
        $data = $request->validated();
        $familyId = AccessControl::sharedMembersFamilyId([$data['node_1_id'], $data['node_2_id']]);

        if (!$familyId) {
            return AccessControl::invalidScope('Hai thanh vien trong quan he phai thuoc cung mot dong ho.');
        }

        if (!AccessControl::canManageFamily($request->user(), $familyId)) {
            return AccessControl::forbidden();
        }

        $data['created_at'] = now();
        $data['updated_at'] = now();

        $id = DB::table('quan_hes')->insertGetId($data);

        return response()->json([
            'success' => true,
            'message' => 'Tao quan he thanh cong',
            'id' => $id,
        ]);
    }

    public function update(UpdateQuanHeRequest $request)
    {
        $data = $request->validated();
        $id = $data['id'];
        unset($data['id']);

        $quanHe = DB::table('quan_hes')->where('id', $id)->first();

        if (!$quanHe) {
            return response()->json(['success' => false, 'message' => 'Khong tim thay'], 404);
        }

        if (!AccessControl::canManageFamily($request->user(), AccessControl::relationFamilyId($id))) {
            return AccessControl::forbidden();
        }

        $node1Id = $data['node_1_id'] ?? $quanHe->node_1_id;
        $node2Id = $data['node_2_id'] ?? $quanHe->node_2_id;
        $familyId = AccessControl::sharedMembersFamilyId([$node1Id, $node2Id]);

        if (!$familyId) {
            return AccessControl::invalidScope('Hai thanh vien trong quan he phai thuoc cung mot dong ho.');
        }

        if (!AccessControl::canManageFamily($request->user(), $familyId)) {
            return AccessControl::forbidden();
        }

        $data['updated_at'] = now();

        DB::table('quan_hes')->where('id', $id)->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Cap nhat quan he thanh cong',
        ]);
    }

    public function destroy(DeleteQuanHeRequest $request)
    {
        $data = $request->validated();

        if (!AccessControl::canManageFamily($request->user(), AccessControl::relationFamilyId($data['id']))) {
            return AccessControl::forbidden();
        }

        DB::table('quan_hes')->where('id', $data['id'])->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xoa quan he thanh cong',
        ]);
    }
}
