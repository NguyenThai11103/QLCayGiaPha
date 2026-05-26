import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Icon from '../../../components/gia-pha/Icon';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import { Nguoi, nguoiApi } from '../../../services/gia-pha.api';
import { useAuth } from '../../../contexts/auth.context';
import toast from '../../../lib/toast.util';

// ─── Interfaces ──────────────────────────────────────────────────────────────
type RelationshipKind =
    | 'self'
    | 'spouse'
    | 'ancestor'
    | 'descendant'
    | 'sibling'
    | 'pibling'
    | 'nibling'
    | 'cousin'
    | 'cousin-removed'
    | 'in-law'
    | 'unrelated';

interface RelationshipResult {
    kind        : RelationshipKind;
    aToB        : string;
    bToA        : string;
    desc       ?: string;
    path       ?: number[];
    common     ?: number | null;
    generations?: number;
    level      ?: number;
    side       ?: 'paternal' | 'maternal';
    via        ?: 'blood' | 'marriage';
}

type AncestorData = { dist: number; path: number[] };

// ─── Constant Mappings ───────────────────────────────────────────────────────
const DIRECT_UP: Record<number, Record<'nam' | 'nu', string>> = {
    1 : { nam: 'Cha', nu: 'Mẹ' },
    2 : { nam: 'Ông', nu: 'Bà' },
    3 : { nam: 'Cụ', nu: 'Cụ bà' },
    4 : { nam: 'Kỵ', nu: 'Kỵ bà' },
    5 : { nam: 'Cao tổ', nu: 'Cao tổ bà' },
    6 : { nam: 'Cao tằng tổ', nu: 'Cao tằng tổ bà' },
};

const DIRECT_DOWN: Record<number, Record<'nam' | 'nu', string>> = {
    1 : { nam: 'Con trai', nu: 'Con gái' },
    2 : { nam: 'Cháu trai', nu: 'Cháu gái' },
    3 : { nam: 'Chắt trai', nu: 'Chắt gái' },
    4 : { nam: 'Chút trai', nu: 'Chút gái' },
    5 : { nam: 'Chít trai', nu: 'Chít gái' },
    6 : { nam: 'Hậu duệ đời 7', nu: 'Hậu duệ đời 7' },
};

const KIND_META: Record<RelationshipKind, { label: string; color: string; icon: Parameters<typeof Icon>[0]['name'] }> = {
    self             : { label: 'Chính mình', color: 'ink-mute', icon: 'users' },
    spouse           : { label: 'Hôn phối', color: 'terracotta', icon: 'heart' },
    ancestor         : { label: 'Tổ tiên - Hậu duệ', color: 'gold', icon: 'tree' },
    descendant       : { label: 'Hậu duệ - Tổ tiên', color: 'gold', icon: 'tree' },
    sibling          : { label: 'Anh chị em ruột', color: 'jade', icon: 'users' },
    pibling          : { label: 'Trên thế hệ', color: 'brown', icon: 'branch' },
    nibling          : { label: 'Dưới thế hệ', color: 'brown', icon: 'branch' },
    cousin           : { label: 'Anh chị em họ', color: 'jade', icon: 'branch' },
    'cousin-removed' : { label: 'Họ xa', color: 'ink-mute', icon: 'branch' },
    'in-law'         : { label: 'Hôn phối thông gia', color: 'terracotta', icon: 'heart' },
    unrelated        : { label: 'Không có quan hệ', color: 'ink-mute', icon: 'link' },
};

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ScanResult({ id }: { id: string | number }) {
    const { user } = useAuth();
    const [members, setMembers] = useState<Nguoi[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAId, setSelectedAId] = useState<number | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    const targetBId = useMemo(() => parseInt(String(id), 10), [id]);

    useEffect(() => {
        nguoiApi
            .list()
            .then((res) => {
                const data = res.data || [];
                setMembers(data);

                // Xác định Người A (Người đang đăng nhập)
                const loggedInMemberId = user?.thanh_vien_id ? parseInt(String(user.thanh_vien_id), 10) : null;
                
                if (loggedInMemberId && data.some((m) => m.id === loggedInMemberId)) {
                    setSelectedAId(loggedInMemberId);
                } else if (data.length > 0) {
                    // Nếu tài khoản chưa liên kết thành viên, chọn thành viên đầu tiên (khác Người B) để làm giả lập
                    const fallbackA = data.find((m) => m.id !== targetBId)?.id ?? data[0].id;
                    setSelectedAId(fallbackA);
                    setIsSimulating(true);
                }
            })
            .catch(() => {
                toast.error('Không thể tải dữ liệu dòng họ.');
            })
            .finally(() => setLoading(false));
    }, [id, user?.thanh_vien_id, targetBId]);

    const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
    const generations = useMemo(() => buildGenerationMap(members), [members]);

    const memberA = selectedAId ? byId.get(selectedAId) || null : null;
    const memberB = targetBId ? byId.get(targetBId) || null : null;

    const relationship = useMemo(() => {
        if (memberA && memberB) {
            return computeRelationship(memberA, memberB, byId);
        }
        return null;
    }, [memberA, memberB, byId]);

    if (loading) {
        return (
            <AuthenticatedLayout>
                <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 48, height: 48, border: '4px solid var(--gold-pale)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-mute)' }}>Đang đối chiếu dữ liệu quét QR...</div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    if (!memberB) {
        return (
            <AuthenticatedLayout>
                <div className="mx-auto max-w-md py-12 text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-[var(--crimson)] mb-4">
                        <Icon name="x" size={28} />
                    </div>
                    <h2 className="font-serif text-[24px] font-bold text-[var(--ink)] mb-2">Thành viên không tồn tại</h2>
                    <p className="text-[14px] text-[var(--ink-mute)] mb-6 leading-relaxed">
                        Mã định danh quét được không trùng khớp với bất kỳ thành viên nào trên cây gia phả hiện tại của dòng họ.
                    </p>
                    <Link href="/gia-pha/dashboard" className="gp-btn gp-btn-primary w-full justify-center">
                        Về trang tổng quan
                    </Link>
                </div>
            </AuthenticatedLayout>
        );
    }

    const lastA = memberA ? shortName(memberA.ten_day_du) : 'Bạn';
    const lastB = shortName(memberB.ten_day_du);
    const meta = relationship ? KIND_META[relationship.kind] : null;

    return (
        <AuthenticatedLayout>
            <Head title={`Nhận diện: ${memberB.ten_day_du}`} />

            <div className="gp-fade-up mx-auto max-w-[800px] px-2 py-4">
                
                {/* ─── Breadcrumb ─── */}
                <div className="mb-6 flex items-center gap-2 text-[13px] text-[var(--ink-mute)]">
                    <Link href="/gia-pha/dashboard" className="hover:text-[var(--gold)]">Trang chủ</Link>
                    <span>/</span>
                    <Link href="/gia-pha/tra-cuu-danh-xung" className="hover:text-[var(--gold)]">Tra cứu xưng hô</Link>
                    <span>/</span>
                    <span className="font-semibold text-[var(--ink)]">Kết quả quét QR</span>
                </div>

                {/* ─── Cảnh báo xem giả lập ─── */}
                {isSimulating && (
                    <div className="mb-6 rounded-2xl border border-[var(--gold-soft)] bg-gradient-to-r from-[var(--gold-glow)] to-[var(--card)] p-4 flex gap-3.5 items-start">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--gold-pale)] text-[var(--gold)] shrink-0">
                            <Icon name="sparkle" size={16} />
                        </div>
                        <div className="text-[13px] leading-relaxed text-[var(--ink-soft)]">
                            <strong className="text-[var(--ink)] block mb-0.5">Chế độ hiển thị định danh giả lập</strong>
                            Tài khoản của bạn chưa được liên kết với một thành viên thực tế trong gia phả. Chúng tôi đang dùng thành viên **{memberA?.ten_day_du}** (ID: {memberA?.id}) làm mốc giả lập xưng hô với người được quét.
                            <div className="mt-3 flex items-center gap-2">
                                <span className="text-[11px] font-bold text-[var(--ink-mute)]">Đổi mốc xem:</span>
                                <select
                                    value={selectedAId || ''}
                                    onChange={(e) => setSelectedAId(Number(e.target.value))}
                                    className="px-2 py-1 text-[11px] font-semibold bg-[var(--bg)] border border-[var(--line-soft)] rounded-md focus:outline-none"
                                >
                                    {members.filter(m => m.id !== targetBId).map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.ten_day_du}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Khung lớn: Hồ sơ & Giao diện Vương giả ─── */}
                <div className="space-y-6">

                    {/* 1. Profile Người Được Quét */}
                    <div className="gp-card relative overflow-hidden p-6" style={{ borderRadius: 24 }}>
                        <div className="absolute inset-0 opacity-[0.05]" style={{ background: avatarGradient(memberB.id) }} />
                        <div className="relative flex flex-col items-center text-center md:flex-row md:text-left md:gap-6">
                            {/* Avatar lớn viền vàng cổ điển */}
                            {memberB.anh_dai_dien ? (
                                <img
                                    src={memberB.anh_dai_dien}
                                    alt={memberB.ten_day_du}
                                    className="h-20 w-20 rounded-full border-4 border-[var(--gold-soft)] object-cover shadow-[var(--shadow-md)] shrink-0"
                                />
                            ) : (
                                <div
                                    className="grid h-20 w-20 place-items-center rounded-full border-4 border-[var(--gold-soft)] text-[32px] font-bold text-white shadow-[var(--shadow-md)] shrink-0"
                                    style={{ background: avatarGradient(memberB.id) }}
                                >
                                    {initials(memberB.ten_day_du)}
                                </div>
                            )}

                            <div className="mt-4 md:mt-0 flex-1">
                                <div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--gold)] mb-1">
                                    Mã định danh: {memberB.ma_thanh_vien || `TV-${memberB.id}`}
                                </div>
                                <h1 className="font-serif text-[30px] font-bold leading-tight text-[var(--ink)]">
                                    {memberB.ten_day_du}
                                </h1>
                                <div className="mt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                                    <span className="gp-chip bg-[var(--card-soft)]">
                                        Đời thứ {generations.get(memberB.id) || '?'}
                                    </span>
                                    <span className={`gp-chip ${memberB.gioi_tinh === 'nam' ? 'text-[var(--gold)] bg-[var(--gold-glow)]' : 'text-[var(--terracotta)] bg-red-50'}`}>
                                        {memberB.gioi_tinh === 'nam' ? '♂ Nam giới' : '♀ Nữ giới'}
                                    </span>
                                    {memberB.da_mat ? (
                                        <span className="gp-chip text-[var(--ink-mute)] bg-[var(--card-soft)]">✝ Đã mất</span>
                                    ) : (
                                        <span className="gp-chip text-[var(--jade)] bg-emerald-50">● Còn sống</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Banner nổi bật: XƯNG HÔ HOÀNG GIA */}
                    {relationship && meta && (
                        <div
                            className="gp-card relative overflow-hidden border-[var(--gold-soft)] p-8 text-center"
                            style={{
                                background   : 'linear-gradient(135deg, var(--card) 0%, color-mix(in srgb, var(--gold) 6%, var(--card)) 100%)',
                                borderRadius : 24,
                            }}
                        >
                            {/* Logo hoa sen chìm vương giả */}
                            <Icon name="sparkle" size={64} className="absolute right-6 top-6 text-[var(--gold)] opacity-15" />
                            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,var(--gold-glow),transparent_70%)] opacity-60" />

                            <div className="relative">
                                {/* Tag thể loại quan hệ */}
                                <div className="mb-5 flex justify-center">
                                    <span
                                        className="gp-chip text-[12px] px-3.5 py-1"
                                        style={{
                                            background  : `color-mix(in srgb, var(--${meta.color}) 15%, transparent)`,
                                            borderColor : `color-mix(in srgb, var(--${meta.color}) 28%, transparent)`,
                                            color       : `var(--${meta.color})`,
                                        }}
                                    >
                                        <Icon name={meta.icon} size={12} />
                                        {meta.label}
                                    </span>
                                </div>

                                <div className="mb-2 text-[14px] text-[var(--ink-soft)] font-medium">
                                    Bạn gọi <span className="font-bold text-[var(--ink)]">{lastB}</span> là
                                </div>

                                {/* Đại tự xưng hô cực kỳ lớn và nổi bật */}
                                <div className="font-serif text-[clamp(44px,8vw,72px)] font-extrabold leading-none tracking-tight text-[var(--gold)] my-4">
                                    {relationship.aToB}
                                </div>

                                {/* Phản hồi xưng hô ngược lại */}
                                <div className="mt-8 mx-auto max-w-md flex items-center justify-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] px-5 py-4 shadow-[var(--shadow-sm)]">
                                    <Icon name="arrow-right" size={16} className="text-[var(--gold)] shrink-0" />
                                    <div className="text-[14px] text-[var(--ink-soft)] text-left">
                                        <span className="font-semibold text-[var(--ink)]">{lastB}</span> gọi lại bạn là{' '}
                                        <span className="font-serif text-[26px] font-bold text-[var(--brown)] block md:inline md:ml-1 leading-none">{relationship.bToA}</span>
                                    </div>
                                </div>

                                {/* Diễn giải quan hệ */}
                                {relationship.desc && (
                                    <p className="mt-5 text-[13px] leading-relaxed text-[var(--ink-mute)] italic">
                                        * {relationship.desc}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 3. Sơ đồ ngang đường dẫn liên kết huyết thống */}
                    {relationship?.path && relationship.path.length >= 2 && (
                        <div className="gp-card p-6" style={{ borderRadius: 24 }}>
                            <div className="mb-5 flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-[16px] font-bold text-[var(--ink)] font-serif">Sơ đồ liên kết gia hệ</h3>
                                    <p className="mt-1 text-[12px] text-[var(--ink-mute)]">Đường dẫn quan hệ huyết thống giữa hai người</p>
                                </div>
                                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--gold-glow)] text-[var(--gold)]">
                                    <Icon name="branch" size={16} />
                                </div>
                            </div>

                            {/* Dãy node nằm ngang chỉ dẫn liên kết */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-4 gap-x-2.5">
                                {relationship.path.map((memberId, index) => {
                                    const m = byId.get(memberId);
                                    if (!m) return null;
                                    const isFirst = index === 0;
                                    const isLast = index === (relationship.path?.length || 0) - 1;

                                    return (
                                        <div key={memberId} className="flex items-center gap-2">
                                            <div
                                                className="flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-[var(--shadow-sm)]"
                                                style={{
                                                    background  : isFirst ? 'var(--gold-glow)' : isLast ? 'var(--card-soft)' : 'var(--bg)',
                                                    borderColor : isFirst ? 'var(--gold-pale)' : isLast ? 'var(--gold-soft)' : 'var(--line)',
                                                }}
                                            >
                                                {/* Mini Avatar */}
                                                <div
                                                    className="grid h-6 w-6 place-items-center overflow-hidden rounded-full font-bold text-white text-[9.5px]"
                                                    style={{ background: avatarGradient(m.id) }}
                                                >
                                                    {m.anh_dai_dien ? (
                                                        <img src={m.anh_dai_dien} alt={m.ten_day_du} className="h-full w-full object-cover" />
                                                    ) : (
                                                        initials(m.ten_day_du)
                                                    )}
                                                </div>
                                                <span className="text-[12.5px] font-bold text-[var(--ink)]">
                                                    {isFirst ? 'Bạn' : shortName(m.ten_day_du)}
                                                </span>
                                            </div>
                                            {!isLast && (
                                                <Icon
                                                    name="chevron-right"
                                                    size={13}
                                                    className="text-[var(--ink-faint)]"
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 4. Phân tích sâu về Bậc Họ & Thế hệ */}
                    {relationship && relationship.kind !== 'self' && relationship.kind !== 'unrelated' && (
                        <div className="gp-card p-6" style={{ borderRadius: 24 }}>
                            <h3 className="mb-4 text-[16px] font-bold font-serif text-[var(--ink)]">Phân tích chuyên sâu</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <DetailField label="Nhóm quan hệ" value={KIND_META[relationship.kind].label} />
                                <DetailField label="Hình thức kết nối" value={relationship.via === 'marriage' ? 'Hôn nhân phối ngẫu' : 'Dòng máu huyết thống'} />
                                <DetailField label="Khoảng cách thế hệ" value={`${relationship.generations || 0} thế hệ (đời)`} />
                                {relationship.level && <DetailField label="Bậc gia tộc" value={`Đời F${relationship.level - 1}`} />}
                                {relationship.side && <DetailField label="Phân nhánh hệ" value={relationship.side === 'paternal' ? 'Phân nhánh bên Nội (Cha)' : 'Phân nhánh bên Ngoại (Mẹ)'} />}
                                {relationship.common && (
                                    <DetailField
                                        label="Tổ tiên chung gần nhất"
                                        value={byId.get(relationship.common)?.ten_day_du || 'Chưa xác định'}
                                        fullSpan
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* 5. Nút điều hướng hành động */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Link
                            href={`/gia-pha/thanh-vien/${memberB.id}`}
                            className="gp-btn gp-btn-ghost flex-1 justify-center py-3 text-[14px]"
                        >
                            <Icon name="book" size={16} />
                            Xem hồ sơ đầy đủ
                        </Link>
                        <Link
                            href="/gia-pha/cay-gia-pha"
                            className="gp-btn gp-btn-ghost flex-1 justify-center py-3 text-[14px]"
                        >
                            <Icon name="tree" size={16} />
                            Xem trên Cây Gia Phả
                        </Link>
                        <button
                            onClick={() => router.visit('/gia-pha/tra-cuu-danh-xung')}
                            className="gp-btn gp-btn-primary flex-1 justify-center py-3 text-[14px]"
                        >
                            <Icon name="camera" size={16} />
                            Quét mã tiếp tục
                        </button>
                    </div>

                </div>

            </div>
        </AuthenticatedLayout>
    );
}

// ─── Sub-components & Helpers ───────────────────────────────────────────────
function DetailField({ label, value, fullSpan = false }: { label: string; value: string; fullSpan?: boolean }) {
    return (
        <div className={fullSpan ? 'sm:col-span-2' : ''}>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[1.5px] text-[var(--ink-mute)]">{label}</div>
            <div className="font-serif text-[16px] font-bold text-[var(--ink-soft)]">{value}</div>
        </div>
    );
}

function initials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

function shortName(name: string): string {
    return name.trim().split(/\s+/).slice(-2).join(' ');
}

function lastWord(name: string): string {
    return name.trim().split(/\s+/).slice(-1)[0] || name;
}

function formatYear(date: string | null): string | null {
    return date ? date.substring(0, 4) : null;
}

function isOlder(a: Nguoi, b: Nguoi): boolean {
    const aYear = Number(formatYear(a.ngay_sinh));
    const bYear = Number(formatYear(b.ngay_sinh));
    if (Number.isFinite(aYear) && Number.isFinite(bYear) && aYear !== bYear) return aYear < bYear;
    return a.id < b.id;
}

function avatarGradient(seed: number): string {
    const palettes = [
        ['#B8902C', '#5C3A1E'],
        ['#2F5D3A', '#4A7A52'],
        ['#B4502E', '#8A3A1E'],
        ['#8A6F3F', '#5C4A2E'],
        ['#9B6B2E', '#D4AF55'],
        ['#4A7A52', '#2F5D3A'],
    ];
    const palette = palettes[Math.abs(seed) % palettes.length];
    return `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`;
}

// ─── RELATIONSHIP COMPUTATION CORE ──────────────────────────────────────────
function computeRelationship(a: Nguoi, b: Nguoi, byId: Map<number, Nguoi>): RelationshipResult {
    if (a.id === b.id) {
        return { kind: 'self', aToB: 'Chính mình', bToA: 'Chính mình', path: [a.id], common: a.id };
    }

    if ((a.vo_chong_ids || []).includes(b.id)) {
        return {
            kind        : 'spouse',
            aToB        : a.gioi_tinh === 'nam' ? 'Vợ' : 'Chồng',
            bToA        : b.gioi_tinh === 'nam' ? 'Vợ' : 'Chồng',
            desc        : 'Quan hệ hôn phối (Vợ chồng trực hệ)',
            path        : [a.id, b.id],
            common      : null,
            via         : 'marriage',
        };
    }

    const blood = computeBloodRelationship(a, b, byId);
    if (blood) return blood;

    const inLaw = computeInLawRelationship(a, b, byId);
    if (inLaw) return inLaw;

    return {
        kind : 'unrelated',
        aToB : 'Không rõ quan hệ',
        bToA : 'Không rõ quan hệ',
        desc : 'Không tìm thấy quan hệ huyết thống hoặc hôn nhân phối ngẫu trực hệ trên cây.',
    };
}

function computeBloodRelationship(a: Nguoi, b: Nguoi, byId: Map<number, Nguoi>): RelationshipResult | null {
    const aAnc = ancestorMap(a.id, byId);
    const bAnc = ancestorMap(b.id, byId);
    let best: { id: number; total: number; upA: number; upB: number; pathA: number[]; pathB: number[] } | null = null;

    for (const [id, data] of aAnc) {
        const bData = bAnc.get(id);
        if (!bData) continue;
        const total = data.dist + bData.dist;
        if (!best || total < best.total) {
            best = { id, total, upA: data.dist, upB: bData.dist, pathA: data.path, pathB: bData.path };
        }
    }

    if (!best) return null;
    return makeBloodResult(a, b, best, byId);
}

function ancestorMap(id: number, byId: Map<number, Nguoi>): Map<number, AncestorData> {
    const result = new Map<number, AncestorData>();
    result.set(id, { dist: 0, path: [id] });
    const queue = [id];

    while (queue.length) {
        const current = queue.shift()!;
        const currentData = result.get(current)!;
        const person = byId.get(current);
        if (!person) continue;

        for (const parentId of [person.id_cha, person.id_me]) {
            if (!parentId || result.has(parentId)) continue;
            result.set(parentId, { dist: currentData.dist + 1, path: [...currentData.path, parentId] });
            queue.push(parentId);
        }
    }

    return result;
}

function makeBloodResult(
    a: Nguoi,
    b: Nguoi,
    best: { id: number; upA: number; upB: number; pathA: number[]; pathB: number[] },
    byId: Map<number, Nguoi>,
): RelationshipResult {
    const { upA, upB, pathA, pathB, id: commonId } = best;
    const fullPath = [...pathA, ...pathB.slice(0, -1).reverse()];

    if (upA === 0) {
        const term = DIRECT_UP[upB]?.[a.gioi_tinh] || `Tổ tiên đời F${upB}`;
        const reverse = DIRECT_DOWN[upB]?.[b.gioi_tinh] || `Hậu duệ đời F${upB}`;
        return {
            kind        : 'ancestor',
            aToB        : reverse,
            bToA        : term,
            desc        : `Trực hệ huyết thống - Bạn là Hậu duệ trực tiếp cách ${upB} đời của ${lastWord(b.ten_day_du)}.`,
            path        : fullPath,
            common      : commonId,
            generations : upB,
            via         : 'blood',
        };
    }

    if (upB === 0) {
        const term = DIRECT_UP[upA]?.[b.gioi_tinh] || `Tổ tiên đời F${upA}`;
        const reverse = DIRECT_DOWN[upA]?.[a.gioi_tinh] || `Hậu duệ đời F${upA}`;
        return {
            kind        : 'descendant',
            aToB        : term,
            bToA        : reverse,
            desc        : `Trực hệ huyết thống - Bạn là Bậc bề trên cách ${upA} đời của ${lastWord(a.ten_day_du)}.`,
            path        : fullPath,
            common      : commonId,
            generations : upA,
            via         : 'blood',
        };
    }

    if (upA === 1 && upB === 1) {
        const olderA = isOlder(a, b);
        return {
            kind        : 'sibling',
            aToB        : siblingTerm(b, olderA ? 'younger' : 'older'),
            bToA        : siblingTerm(a, olderA ? 'older' : 'younger'),
            desc        : 'Anh chị em ruột thịt (Cùng cha hoặc mẹ).',
            path        : [a.id, commonId, b.id],
            common      : commonId,
            generations : 0,
            via         : 'blood',
        };
    }

    if (upA === 1 && upB >= 2) {
        const bParent = byId.get(pathB[upB - 1]);
        const isPaternal = bParent?.gioi_tinh === 'nam';
        const base = pibName(a, isPaternal, bParent ? isOlder(a, bParent) : false);
        const prefix = genPrefix(upB, a.gioi_tinh);
        const bToA = `${prefix}${base}`.trim();
        return {
            kind        : 'pibling',
            aToB        : upB === 2 ? DIRECT_DOWN[2][b.gioi_tinh] : DIRECT_DOWN[upB - 1]?.[b.gioi_tinh] || 'Hậu duệ',
            bToA,
            desc        : `Quan hệ bàng hệ - Người này là bậc con cháu nhánh ${isPaternal ? 'Nội' : 'Ngoại'} của bạn.`,
            path        : fullPath,
            common      : commonId,
            generations : upB - upA,
            side        : isPaternal ? 'paternal' : 'maternal',
            via         : 'blood',
        };
    }

    if (upB === 1 && upA >= 2) {
        const aParent = byId.get(pathA[upA - 1]);
        const isPaternal = aParent?.gioi_tinh === 'nam';
        const base = pibName(b, isPaternal, aParent ? isOlder(b, aParent) : false);
        const prefix = genPrefix(upA, b.gioi_tinh);
        const aToB = `${prefix}${base}`.trim();
        return {
            kind        : 'nibling',
            aToB,
            bToA        : upA === 2 ? DIRECT_DOWN[2][a.gioi_tinh] : DIRECT_DOWN[upA - 1]?.[a.gioi_tinh] || 'Hậu duệ',
            desc        : `Quan hệ bàng hệ - Bạn là bậc con cháu nhánh ${isPaternal ? 'Nội' : 'Ngoại'} của người này.`,
            path        : fullPath,
            common      : commonId,
            generations : upA - upB,
            side        : isPaternal ? 'paternal' : 'maternal',
            via         : 'blood',
        };
    }

    if (upA === upB) {
        const olderA = isOlder(a, b);
        const level = upA;
        return {
            kind        : 'cousin',
            aToB        : cousinTerm(b, olderA ? 'younger' : 'older'),
            bToA        : cousinTerm(a, olderA ? 'older' : 'younger'),
            desc        : `Quan hệ ngang hàng - Anh em họ đời thứ ${level - 1} (Cùng tổ tiên chung gần nhất).`,
            path        : fullPath,
            common      : commonId,
            generations : 0,
            level,
            via         : 'blood',
        };
    }

    const removed = Math.abs(upA - upB);
    const closer = Math.min(upA, upB);
    return {
        kind        : 'cousin-removed',
        aToB        : upA < upB ? `Cô/Chú họ (Cách ${removed} đời)` : `Cháu họ (Cách ${removed} đời)`,
        bToA        : upB < upA ? `Cô/Chú họ (Cách ${removed} đời)` : `Cháu họ (Cách ${removed} đời)`,
        desc        : `Họ hàng xa - Anh em họ đời F${closer - 1} cách nhau ${removed} thế hệ.`,
        path        : fullPath,
        common      : commonId,
        generations : removed,
        via         : 'blood',
    };
}

function computeInLawRelationship(a: Nguoi, b: Nguoi, byId: Map<number, Nguoi>): RelationshipResult | null {
    for (const spouseId of a.vo_chong_ids || []) {
        const spouse = byId.get(spouseId);
        if (!spouse) continue;
        const sub = computeBloodRelationship(spouse, b, byId);
        if (sub && sub.kind !== 'self') return makeInLawResult(a, b, sub, 'a');
    }

    for (const spouseId of b.vo_chong_ids || []) {
        const spouse = byId.get(spouseId);
        if (!spouse) continue;
        const sub = computeBloodRelationship(a, spouse, byId);
        if (sub && sub.kind !== 'self') return makeInLawResult(a, b, sub, 'b');
    }

    return null;
}

function makeInLawResult(a: Nguoi, b: Nguoi, sub: RelationshipResult, bridge: 'a' | 'b'): RelationshipResult {
    if (bridge === 'a') {
        return {
            kind        : 'in-law',
            aToB        : inLawLabel(sub.aToB, 'spouse-side'),
            bToA        : inLawLabel(sub.bToA, 'in-law-side'),
            desc        : `Quan hệ qua hôn phối của ${shortName(a.ten_day_du)} - ${sub.desc || ''}`,
            path        : sub.path,
            common      : sub.common,
            generations : sub.generations,
            via         : 'marriage',
        };
    }

    return {
        kind        : 'in-law',
        aToB        : inLawLabel(sub.aToB, 'in-law-side'),
        bToA        : inLawLabel(sub.bToA, 'spouse-side'),
        desc        : `Quan hệ qua hôn phối của ${shortName(b.ten_day_du)} - ${sub.desc || ''}`,
        path        : sub.path,
        common      : sub.common,
        generations : sub.generations,
        via         : 'marriage',
    };
}

function inLawLabel(baseTerm: string, mode: 'spouse-side' | 'in-law-side'): string {
    if (baseTerm.includes('Cha')) return 'Bố vợ/Bố chồng';
    if (baseTerm.includes('Mẹ')) return 'Mẹ vợ/Mẹ chồng';
    if (baseTerm.includes('Con trai')) return 'Con rể';
    if (baseTerm.includes('Con gái')) return 'Con dâu';
    if (baseTerm.includes('Anh')) return mode === 'spouse-side' ? 'Anh rể/Anh chồng' : 'Em rể/Em dâu';
    if (baseTerm.includes('Chị')) return 'Chị dâu/Chị chồng';
    if (baseTerm.includes('Em')) return 'Em dâu/Em rể';
    return `${baseTerm} (Thông gia)`;
}

function genPrefix(gap: number, gender: 'nam' | 'nu'): string {
    if (gap === 2) return '';
    if (gap === 3) return gender === 'nam' ? 'Ông ' : 'Bà ';
    if (gap === 4) return 'Cụ ';
    if (gap === 5) return 'Kỵ ';
    return '';
}

function pibName(person: Nguoi, isPaternal: boolean, older: boolean): string {
    if (isPaternal) {
        if (person.gioi_tinh === 'nam') return older ? 'Bác' : 'Chú';
        return 'Cô';
    }
    if (person.gioi_tinh === 'nam') return 'Cậu';
    return 'Dì';
}

function siblingTerm(person: Nguoi, rank: 'older' | 'younger'): string {
    if (person.gioi_tinh === 'nam') return rank === 'older' ? 'Anh trai' : 'Em trai';
    return rank === 'older' ? 'Chị gái' : 'Em gái';
}

function cousinTerm(person: Nguoi, rank: 'older' | 'younger'): string {
    if (person.gioi_tinh === 'nam') return rank === 'older' ? 'Anh họ' : 'Em họ';
    return rank === 'older' ? 'Chị họ' : 'Em họ';
}

function buildGenerationMap(members: Nguoi[]): Map<number, number> {
    const byId = new Map(members.map((m) => [m.id, m]));
    const result = new Map<number, number>();

    const resolve = (m: Nguoi): number => {
        const cached = result.get(m.id);
        if (cached) return cached;
        const parents = [m.id_cha, m.id_me].map((id) => (id ? byId.get(id) : undefined)).filter(Boolean) as Nguoi[];
        const generation = parents.length ? Math.max(...parents.map(resolve)) + 1 : 1;
        result.set(m.id, generation);
        return generation;
    };

    members.forEach(resolve);
    return result;
}
