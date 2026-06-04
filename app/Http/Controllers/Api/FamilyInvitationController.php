<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\FamilyInvitationMail;
use App\Models\DongHo;
use App\Models\FamilyInvitation;
use App\Models\NguoiDung;
use App\Models\ThanhVien;
use App\Support\AccessControl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class FamilyInvitationController extends Controller
{
    public function show(string $token)
    {
        $invitation = $this->findInvitationByToken($token);

        if (!$invitation) {
            return response()->json([
                'success' => false,
                'message' => 'Loi moi khong ton tai hoac khong hop le.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->invitationPayload($invitation, $token),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'thanh_vien_id' => ['required', 'integer', 'exists:thanh_viens,id'],
            'email' => ['nullable', 'email', 'max:255'],
        ]);

        $user = $request->user();
        $member = ThanhVien::with('dongHo')->find($data['thanh_vien_id']);

        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'Khong tim thay thanh vien.',
            ], 404);
        }

        if (!AccessControl::canManageFamily($user, $member->dong_ho_id)) {
            return AccessControl::forbidden();
        }

        if (NguoiDung::where('thanh_vien_id', $member->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Thanh vien nay da co tai khoan lien ket.',
            ], 422);
        }

        $email = isset($data['email']) && trim((string) $data['email']) !== ''
            ? Str::lower(trim((string) $data['email']))
            : null;

        if ($email) {
            $existingUser = NguoiDung::where('email', $email)->first();
            if ($existingUser && $existingUser->thanh_vien_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email nay da duoc lien ket voi mot ho so thanh vien khac.',
                ], 422);
            }

            if ($existingUser && $existingUser->dong_ho_id && (int) $existingUser->dong_ho_id !== (int) $member->dong_ho_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email nay dang thuoc mot dong ho khac.',
                ], 422);
            }
        }

        $rawToken = Str::random(64);
        $expiresAt = now()->addDays(14);

        $invitation = DB::transaction(function () use ($member, $user, $email, $rawToken, $expiresAt) {
            FamilyInvitation::where('thanh_vien_id', $member->id)
                ->whereNull('accepted_at')
                ->whereNull('revoked_at')
                ->update([
                    'revoked_at' => now(),
                    'updated_at' => now(),
                ]);

            return FamilyInvitation::create([
                'dong_ho_id' => $member->dong_ho_id,
                'thanh_vien_id' => $member->id,
                'invited_by' => $user instanceof NguoiDung ? $user->id : null,
                'email' => $email,
                'token_hash' => $this->hashToken($rawToken),
                'expires_at' => $expiresAt,
                'last_sent_at' => $email ? now() : null,
            ]);
        });

        $invitation->load(['dongHo', 'thanhVien', 'inviter']);
        $inviteUrl = url('/loi-moi/' . $rawToken);
        $emailSent = false;
        $emailError = null;

        if ($email) {
            try {
                Mail::to($email)->send(new FamilyInvitationMail(
                    memberName: $member->ho_ten,
                    familyName: $member->dongHo?->ten_dong_ho ?? 'Gia pha',
                    inviteUrl: $inviteUrl,
                    inviterName: $user->ho_ten ?? 'Quan tri vien',
                    expiresAtText: $expiresAt->format('d/m/Y H:i'),
                ));
                $emailSent = true;
            } catch (\Throwable $e) {
                $emailError = 'Khong gui duoc email, ban van co the sao chep link moi.';
                logger()->error('Family invitation mail error: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => $email && $emailSent
                ? 'Da gui loi moi qua email.'
                : 'Da tao link moi tham gia.',
            'data' => [
                'invitation' => $this->invitationPayload($invitation, $rawToken),
                'invite_url' => $inviteUrl,
                'email_sent' => $emailSent,
                'email_error' => $emailError,
            ],
        ], 201);
    }

    public function accept(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:128'],
        ]);

        $user = $request->user();
        if (!$user instanceof NguoiDung) {
            return AccessControl::forbidden();
        }

        return DB::transaction(function () use ($data, $user) {
        $invitation = $this->findInvitationByToken($data['token'], lockForUpdate: true);
        if (!$invitation) {
            return response()->json([
                'success' => false,
                'message' => 'Loi moi khong ton tai hoac khong hop le.',
            ], 404);
        }

        if (!$invitation->isUsable()) {
            return response()->json([
                'success' => false,
                'message' => $this->unusableMessage($invitation),
            ], 422);
        }

        if ($invitation->email && Str::lower($invitation->email) !== Str::lower($user->email)) {
            return response()->json([
                'success' => false,
                'message' => 'Loi moi nay duoc gui cho mot email khac.',
            ], 422);
        }

        $member = ThanhVien::find($invitation->thanh_vien_id);
        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'Ho so thanh vien trong loi moi khong con ton tai.',
            ], 404);
        }

        $family = DongHo::find($member->dong_ho_id);
        if (!$family || !$family->trang_thai) {
            return response()->json([
                'success' => false,
                'message' => 'Dong ho trong loi moi hien khong kha dung.',
            ], 422);
        }

        $linkedUser = NguoiDung::where('thanh_vien_id', $member->id)
            ->where('id', '!=', $user->id)
            ->first();

        if ($linkedUser) {
            return response()->json([
                'success' => false,
                'message' => 'Ho so nay da duoc lien ket voi tai khoan khac.',
            ], 422);
        }

        if ($user->thanh_vien_id && (int) $user->thanh_vien_id !== (int) $member->id) {
            return response()->json([
                'success' => false,
                'message' => 'Tai khoan cua ban da lien ket voi mot ho so thanh vien khac.',
            ], 422);
        }

        if ($user->dong_ho_id && (int) $user->dong_ho_id !== (int) $member->dong_ho_id) {
            return response()->json([
                'success' => false,
                'message' => 'Tai khoan cua ban dang thuoc mot dong ho khac.',
            ], 422);
        }

        DB::transaction(function () use ($invitation, $member, $user) {
            $user->update([
                'dong_ho_id' => $member->dong_ho_id,
                'thanh_vien_id' => $member->id,
                'ho_ten' => $member->ho_ten,
                'avatar' => $user->avatar ?: $member->anh_dai_dien,
                'tieu_su' => $user->tieu_su ?: $member->tieu_su,
                'quyen_han' => $user->quyen_han ?: 'thanh_vien',
                'trang_thai_gia_nhap' => 'da_duyet',
                'trang_thai' => true,
            ]);

            $invitation->update([
                'accepted_at' => now(),
                'accepted_by' => $user->id,
            ]);
        });

        $user->refresh()->load('dongHo');

        return response()->json([
            'success' => true,
            'message' => 'Da lien ket tai khoan voi ho so trong cay gia pha.',
            'data' => [
                'user' => $user,
            ],
        ]);
        });
    }

    private function findInvitationByToken(string $token, bool $lockForUpdate = false): ?FamilyInvitation
    {
        $query = FamilyInvitation::with([
            'dongHo:id,ten_dong_ho,dia_chi_tu_duong,trang_thai',
            'thanhVien:id,dong_ho_id,ho_ten,gioi_tinh,ngay_sinh_duong,anh_dai_dien,doi_thu',
            'inviter:id,ho_ten,email',
        ])->where('token_hash', $this->hashToken($token));

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        return $query->first();
    }

    private function invitationPayload(FamilyInvitation $invitation, string $token): array
    {
        return [
            'id' => $invitation->id,
            'email' => $invitation->email,
            'token' => $token,
            'invite_url' => url('/loi-moi/' . $token),
            'status' => $this->status($invitation),
            'can_accept' => $invitation->isUsable(),
            'expires_at' => $invitation->expires_at?->toIso8601String(),
            'accepted_at' => $invitation->accepted_at?->toIso8601String(),
            'dong_ho' => $invitation->dongHo ? [
                'id' => $invitation->dongHo->id,
                'ten_dong_ho' => $invitation->dongHo->ten_dong_ho,
                'dia_chi_tu_duong' => $invitation->dongHo->dia_chi_tu_duong,
            ] : null,
            'thanh_vien' => $invitation->thanhVien ? [
                'id' => $invitation->thanhVien->id,
                'ho_ten' => $invitation->thanhVien->ho_ten,
                'gioi_tinh' => $invitation->thanhVien->gioi_tinh,
                'ngay_sinh_duong' => $invitation->thanhVien->ngay_sinh_duong,
                'anh_dai_dien' => $invitation->thanhVien->anh_dai_dien,
                'doi_thu' => $invitation->thanhVien->doi_thu,
            ] : null,
            'nguoi_moi' => $invitation->inviter ? [
                'id' => $invitation->inviter->id,
                'ho_ten' => $invitation->inviter->ho_ten,
                'email' => $invitation->inviter->email,
            ] : null,
        ];
    }

    private function status(FamilyInvitation $invitation): string
    {
        if ($invitation->isAccepted()) {
            return 'accepted';
        }

        if ($invitation->isRevoked()) {
            return 'revoked';
        }

        if ($invitation->isExpired()) {
            return 'expired';
        }

        return 'pending';
    }

    private function unusableMessage(FamilyInvitation $invitation): string
    {
        return match ($this->status($invitation)) {
            'accepted' => 'Loi moi nay da duoc chap nhan.',
            'revoked' => 'Loi moi nay da bi huy.',
            'expired' => 'Loi moi nay da het han.',
            default => 'Loi moi nay khong con kha dung.',
        };
    }

    private function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }
}
