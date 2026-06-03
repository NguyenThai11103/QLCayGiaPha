import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/gia-pha/Icon';
import { useAuth } from '../../contexts/auth.context';
import toast from '../../lib/toast.util';
import { familyInvitationApi, FamilyInvitationPreview } from '../../services/gia-pha.api';
import AuthScaffold from './AuthScaffold';

type InvitationPageProps = {
    token: string;
};

export default function InvitationPage({ token }: InvitationPageProps) {
    const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
    const [invitation, setInvitation] = useState<FamilyInvitationPreview | null>(null);
    const [loadingInvite, setLoadingInvite] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let active = true;

        familyInvitationApi
            .detail(token)
            .then((result) => {
                if (!active) return;
                if (result.success && result.data) {
                    setInvitation(result.data);
                } else {
                    setNotFound(true);
                }
            })
            .catch(() => {
                if (active) setNotFound(true);
            })
            .finally(() => {
                if (active) setLoadingInvite(false);
            });

        return () => {
            active = false;
        };
    }, [token]);

    const redirectPath = useMemo(() => `/loi-moi/${token}`, [token]);
    const registerUrl = `/register?invitation=${encodeURIComponent(token)}`;
    const loginUrl = `/login?redirect=${encodeURIComponent(redirectPath)}`;

    const handleAccept = async () => {
        if (!isAuthenticated) {
            router.visit(loginUrl);
            return;
        }

        setAccepting(true);
        try {
            const result = await familyInvitationApi.accept(token);
            if (result.success) {
                await checkAuth();
                toast.success(result.message || 'Đã liên kết tài khoản với hồ sơ trong cây.');
                router.visit('/gia-pha/cay-gia-pha');
            }
        } finally {
            setAccepting(false);
        }
    };

    const statusText = invitation ? statusLabel(invitation.status) : '';
    const disabled = !invitation?.can_accept;

    return (
        <>
            <Head title="Lời mời tham gia dòng họ" />
            <AuthScaffold
                eyebrow="Lời mời"
                title="Tham gia dòng họ"
                subtitle="Xác nhận lời mời để tài khoản của bạn được liên kết với hồ sơ trong cây gia phả."
            >
                <div className="gp-card overflow-hidden">
                    {loadingInvite || isLoading ? (
                        <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-8 text-center text-[var(--ink-mute)]">
                            <Icon name="clock" size={24} />
                            <span className="text-[13.5px] font-semibold">Đang kiểm tra lời mời...</span>
                        </div>
                    ) : notFound || !invitation ? (
                        <div className="p-7 text-center">
                            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-red-200 bg-red-50 text-red-600">
                                <Icon name="x" size={22} />
                            </div>
                            <h2 className="mt-4 font-serif text-[23px] font-semibold">Lời mời không hợp lệ</h2>
                            <p className="mt-2 text-[13.5px] leading-6 text-[var(--ink-soft)]">
                                Link này có thể đã hết hạn, đã bị hủy hoặc không tồn tại.
                            </p>
                            <button type="button" onClick={() => router.visit('/login')} className="gp-btn gp-btn-primary mt-6 w-full justify-center">
                                Về trang đăng nhập
                                <Icon name="arrow-right" size={15} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="bg-[var(--gold-glow)] px-6 py-6 text-center">
                                <div className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-[var(--card)] text-[28px] font-bold text-[var(--gold)] shadow-sm ring-4 ring-white/70">
                                    {invitation.thanh_vien?.anh_dai_dien ? (
                                        <img src={invitation.thanh_vien.anh_dai_dien} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        invitation.thanh_vien?.ho_ten?.charAt(0) || 'G'
                                    )}
                                </div>
                                <h2 className="mt-4 font-serif text-[25px] font-semibold text-[var(--ink)]">
                                    {invitation.thanh_vien?.ho_ten || 'Hồ sơ thành viên'}
                                </h2>
                                <div className="mt-1 text-[13px] font-medium text-[var(--ink-soft)]">
                                    {invitation.dong_ho?.ten_dong_ho || 'Dòng họ'}
                                </div>
                            </div>

                            <div className="space-y-4 p-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <InfoBox label="Trạng thái" value={statusText} highlight={invitation.can_accept} />
                                    <InfoBox label="Đời thứ" value={invitation.thanh_vien?.doi_thu ? String(invitation.thanh_vien.doi_thu) : 'Chưa rõ'} />
                                </div>

                                {invitation.email && (
                                    <div className="rounded-[10px] border border-[var(--card-border)] bg-[var(--card-soft)] px-3 py-2 text-[12.5px] leading-5 text-[var(--ink-soft)]">
                                        Lời mời này dành cho email <strong className="text-[var(--ink)]">{invitation.email}</strong>.
                                    </div>
                                )}

                                {isAuthenticated && (
                                    <div className="rounded-[10px] border border-[var(--card-border)] bg-[var(--card-soft)] px-3 py-2 text-[12.5px] leading-5 text-[var(--ink-soft)]">
                                        Bạn đang đăng nhập bằng <strong className="text-[var(--ink)]">{user?.email}</strong>.
                                    </div>
                                )}

                                {disabled && (
                                    <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] leading-5 text-amber-800">
                                        Lời mời này hiện không còn khả dụng.
                                    </div>
                                )}

                                {isAuthenticated ? (
                                    <button type="button" onClick={handleAccept} disabled={disabled || accepting} className="gp-btn gp-btn-primary min-h-12 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60">
                                        <Icon name="check" size={16} />
                                        {accepting ? 'Đang liên kết...' : 'Liên kết tài khoản với hồ sơ'}
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <button type="button" onClick={() => router.visit(registerUrl)} disabled={disabled} className="gp-btn gp-btn-primary min-h-12 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60">
                                            <Icon name="add-user" size={16} />
                                            Đăng ký bằng lời mời
                                        </button>
                                        <button type="button" onClick={() => router.visit(loginUrl)} disabled={disabled} className="gp-btn gp-btn-ghost min-h-11 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60">
                                            Đã có tài khoản
                                            <Icon name="arrow-right" size={15} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </AuthScaffold>
        </>
    );
}

function InfoBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="rounded-[10px] border border-[var(--card-border)] bg-[var(--card-soft)] p-3">
            <div className="text-[10.5px] font-bold tracking-widest text-[var(--ink-mute)] uppercase">{label}</div>
            <div className={`mt-1 text-[14px] font-bold ${highlight ? 'text-[var(--jade)]' : 'text-[var(--ink)]'}`}>{value}</div>
        </div>
    );
}

function statusLabel(status: string) {
    switch (status) {
        case 'pending':
            return 'Đang chờ';
        case 'accepted':
            return 'Đã chấp nhận';
        case 'revoked':
            return 'Đã hủy';
        case 'expired':
            return 'Đã hết hạn';
        default:
            return status;
    }
}
