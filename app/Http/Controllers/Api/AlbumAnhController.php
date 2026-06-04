<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlbumAnh;
use App\Models\AnhAlbum;
use App\Support\AccessControl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class AlbumAnhController extends Controller
{
    public function index(Request $request)
    {
        $idDongHo = $request->query('dong_ho_id');
        if (!$idDongHo) {
            return response()->json(['success' => false, 'message' => 'Missing dong_ho_id'], 422);
        }

        if (!AccessControl::canAccessFamily($request->user(), $idDongHo)) {
            return AccessControl::forbidden();
        }

        $query = AlbumAnh::where('dong_ho_id', $idDongHo);

        if ($request->query('loai_album')) {
            $query->where('loai_album', $request->query('loai_album'));
        }

        if ($request->query('nam')) {
            $query->where('nam', $request->query('nam'));
        }

        // Fetch albums with photo count and first photo as cover
        $albums = $query->withCount('photos')
            ->with(['photos' => function ($q) {
                $q->limit(1); // load at most 1 photo for cover
            }])
            ->orderBy('nam', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $albums,
        ]);
    }

    public function show(Request $request, $id)
    {
        $album = AlbumAnh::with('photos')->find($id);

        if (!$album) {
            return response()->json(['success' => false, 'message' => 'Album not found'], 404);
        }

        if (!AccessControl::canAccessFamily($request->user(), $album->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        return response()->json([
            'success' => true,
            'data' => $album,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'dong_ho_id' => 'required|exists:dong_hos,id',
            'ten_album' => 'required|string|max:255',
            'loai_album' => 'required|string|in:tu_duong,hop_ho,gioi_to,mo_phan,tu_lieu',
            'nam' => 'required|integer|min:1000|max:2100',
            'mo_ta' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $dongHoId = $request->input('dong_ho_id');

        if (!AccessControl::canManageFamily($request->user(), $dongHoId)) {
            return AccessControl::forbidden();
        }

        $album = AlbumAnh::create([
            'dong_ho_id' => $dongHoId,
            'ten_album' => $request->input('ten_album'),
            'loai_album' => $request->input('loai_album'),
            'nam' => $request->input('nam'),
            'mo_ta' => $request->input('mo_ta'),
            'nguoi_tao_id' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Album created successfully',
            'data' => $album,
        ]);
    }

    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:album_anhs,id',
            'ten_album' => 'required|string|max:255',
            'loai_album' => 'required|string|in:tu_duong,hop_ho,gioi_to,mo_phan,tu_lieu',
            'nam' => 'required|integer|min:1000|max:2100',
            'mo_ta' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $album = AlbumAnh::find($request->input('id'));

        if (!AccessControl::canManageFamily($request->user(), $album->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        $album->update([
            'ten_album' => $request->input('ten_album'),
            'loai_album' => $request->input('loai_album'),
            'nam' => $request->input('nam'),
            'mo_ta' => $request->input('mo_ta'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Album updated successfully',
            'data' => $album,
        ]);
    }

    public function destroy(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:album_anhs,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $album = AlbumAnh::with('photos')->find($request->input('id'));

        if (!AccessControl::canManageFamily($request->user(), $album->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        DB::transaction(function () use ($album) {
            foreach ($album->photos as $photo) {
                Storage::disk($photo->disk)->delete($photo->path);
            }
            $album->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Album deleted successfully',
        ]);
    }

    public function uploadPhoto(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'album_id' => 'required|exists:album_anhs,id',
            'files' => 'required|array',
            'files.*' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:10240', // max 10MB per image
            'captions' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $albumId = $request->input('album_id');
        $album = AlbumAnh::find($albumId);

        if (!AccessControl::canManageFamily($request->user(), $album->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        $uploadedPhotos = [];
        $files = $request->file('files');
        $captions = $request->input('captions', []);

        DB::transaction(function () use ($albumId, $files, $captions, $album, $request, &$uploadedPhotos) {
            $disk = 'public';
            $directory = 'albums/' . $album->dong_ho_id . '/' . $albumId;

            foreach ($files as $index => $file) {
                $path = $file->store($directory, $disk);
                $caption = $captions[$index] ?? null;

                $photo = AnhAlbum::create([
                    'album_id' => $albumId,
                    'duong_dan_file' => '/storage/' . $path,
                    'path' => $path,
                    'disk' => $disk,
                    'caption' => $caption,
                    'nguoi_tai_len_id' => $request->user()->id,
                ]);

                $uploadedPhotos[] = $photo;
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Photos uploaded successfully',
            'data' => $uploadedPhotos,
        ]);
    }

    public function deletePhoto(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:anh_albums,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $photo = AnhAlbum::find($request->input('id'));
        $album = AlbumAnh::find($photo->album_id);

        if (!AccessControl::canManageFamily($request->user(), $album->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        Storage::disk($photo->disk)->delete($photo->path);
        $photo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Photo deleted successfully',
        ]);
    }
}
