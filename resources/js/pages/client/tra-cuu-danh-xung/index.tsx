import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Icon from '../../../components/gia-pha/Icon';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import { Nguoi, nguoiApi } from '../../../services/gia-pha.api';
import { useAuth } from '../../../contexts/auth.context';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from '../../../lib/toast.util';

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
    kind: RelationshipKind;
    aToB: string;
    bToA: string;
    desc?: string;
    path?: number[];
    common?: number | null;
    generations?: number;
    level?: number;
    side?: 'paternal' | 'maternal';
    via?: 'blood' | 'marriage';
}

type AncestorData = { dist: number; path: number[] };

const DIRECT_UP: Record<number, Record<'nam' | 'nu', string>> = {
    1: { nam: 'Cha', nu: 'Mẹ' },
    2: { nam: 'Ông', nu: 'Bà' },
    3: { nam: 'Cụ', nu: 'Cụ bà' },
    4: { nam: 'Kỵ', nu: 'Kỵ bà' },
    5: { nam: 'Cao tổ', nu: 'Cao tổ bà' },
    6: { nam: 'Cao tằng tổ', nu: 'Cao tằng tổ bà' },
};

const DIRECT_DOWN: Record<number, Record<'nam' | 'nu', string>> = {
    1: { nam: 'Con trai', nu: 'Con gái' },
    2: { nam: 'Cháu trai', nu: 'Cháu gái' },
    3: { nam: 'Chắt trai', nu: 'Chắt gái' },
    4: { nam: 'Chút trai', nu: 'Chút gái' },
    5: { nam: 'Chít trai', nu: 'Chít gái' },
    6: { nam: 'Hậu duệ đời 7', nu: 'Hậu duệ đời 7' },
};

const GLOSSARY = [
    {
        side: 'Bên nội',
        terms: [
            ['Bác', 'Anh trai của cha'],
            ['Chú', 'Em trai của cha'],
            ['Cô', 'Chị hoặc em gái của cha'],
        ],
    },
    {
        side: 'Bên ngoại',
        terms: [
            ['Cậu', 'Anh hoặc em trai của mẹ'],
            ['Dì', 'Chị hoặc em gái của mẹ'],
        ],
    },
    {
        side: 'Thế hệ trên',
        terms: [
            ['Ông / Bà', 'Trên hai bậc'],
            ['Cụ', 'Trên ba bậc'],
            ['Kỵ', 'Trên bốn bậc'],
            ['Cao tổ', 'Trên năm bậc'],
        ],
    },
    {
        side: 'Thế hệ dưới',
        terms: [
            ['Con', 'Dưới một bậc'],
            ['Cháu', 'Dưới hai bậc'],
            ['Chắt', 'Dưới ba bậc'],
            ['Chút', 'Dưới bốn bậc'],
            ['Chít', 'Dưới năm bậc'],
        ],
    },
];

const KIND_META: Record<RelationshipKind, { label: string; color: string; icon: Parameters<typeof Icon>[0]['name'] }> = {
    self: { label: 'Chính mình', color: 'ink-mute', icon: 'users' },
    spouse: { label: 'Hôn phối', color: 'terracotta', icon: 'heart' },
    ancestor: { label: 'Tổ tiên - hậu duệ', color: 'gold', icon: 'tree' },
    descendant: { label: 'Hậu duệ - tổ tiên', color: 'gold', icon: 'tree' },
    sibling: { label: 'Anh chị em ruột', color: 'jade', icon: 'users' },
    pibling: { label: 'Trên một thế hệ', color: 'brown', icon: 'branch' },
    nibling: { label: 'Dưới một thế hệ', color: 'brown', icon: 'branch' },
    cousin: { label: 'Anh chị em họ', color: 'jade', icon: 'branch' },
    'cousin-removed': { label: 'Họ xa', color: 'ink-mute', icon: 'branch' },
    'in-law': { label: 'Quan hệ thông gia', color: 'terracotta', icon: 'heart' },
    unrelated: { label: 'Không có quan hệ', color: 'ink-mute', icon: 'link' },
};

export default function TraCuuDanhXung() {
    const { user } = useAuth();
    const [members, setMembers] = useState<Nguoi[]>([]);
    const [loading, setLoading] = useState(true);
    const [aId, setAId] = useState<number | null>(null);
    const [bId, setBId] = useState<number | null>(null);
    const [picker, setPicker] = useState<'a' | 'b' | null>(null);
    const [isScanningQR, setIsScanningQR] = useState(false);
    const [recents, setRecents] = useState<Array<{ a: number; b: number; time: string }>>([]);

    useEffect(() => {
        nguoiApi
            .list()
            .then((res) => {
                const data = res.data || [];
                setMembers(data);

                // Đọc URL Search Params để kiểm tra xem có được chuyển hướng từ quét QR không
                const params = new URLSearchParams(window.location.search);
                const targetIdStr = params.get('target_id');
                const targetId = targetIdStr ? parseInt(targetIdStr, 10) : null;

                // Tự động chọn Người A là chính mình nếu đã đăng nhập và có liên kết thành viên gia phả
                const loggedInMemberId = user?.thanh_vien_id ? parseInt(String(user.thanh_vien_id), 10) : null;
                const defaultA = loggedInMemberId && data.some((m) => m.id === loggedInMemberId) 
                    ? loggedInMemberId 
                    : (data[0]?.id ?? null);

                let defaultB = data.find((member) => member.id !== defaultA)?.id ?? null;

                if (targetId && data.some((m) => m.id === targetId)) {
                    // Nếu quét QR hợp lệ, đặt A là chính mình, B là target_id và tự động hiển thị mối quan hệ
                    setAId(defaultA);
                    setBId(targetId);
                    setRecents([{ a: defaultA, b: targetId, time: 'Vừa xong' }]);
                } else {
                    setAId(defaultA);
                    setBId(defaultB);
                    setRecents(makeInitialRecents(data));
                }
            })
            .finally(() => setLoading(false));
    }, [user?.thanh_vien_id]);

    const byId = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
    const generations = useMemo(() => buildGenerationMap(members), [members]);
    const a = aId ? byId.get(aId) || null : null;
    const b = bId ? byId.get(bId) || null : null;
    const result = useMemo(() => (a && b ? computeRelationship(a, b, byId) : null), [a, b, byId]);
    const presets = useMemo(() => makePresets(members, byId), [members, byId]);

    const swap = () => {
        setAId(bId);
        setBId(aId);
    };

    const pickPair = (nextA: number, nextB: number) => {
        setAId(nextA);
        setBId(nextB);
        setRecents((prev) => [{ a: nextA, b: nextB, time: 'Vừa xong' }, ...prev.filter((item) => item.a !== nextA || item.b !== nextB)].slice(0, 5));
    };

    const handleQRResult = (targetCode: string) => {
        setIsScanningQR(false);
        const targetMember = members.find(m => m.ma_thanh_vien === targetCode || m.id.toString() === targetCode);
        if (targetMember) {
            const loggedInMemberId = user?.thanh_vien_id ? parseInt(String(user.thanh_vien_id), 10) : null;
            const defaultA = loggedInMemberId && members.some((m) => m.id === loggedInMemberId)
                ? loggedInMemberId
                : (members[0]?.id ?? null);
                
            if (defaultA) {
                setAId(defaultA);
                setBId(targetMember.id);
                setRecents((prev) => [{ a: defaultA, b: targetMember.id, time: 'Vừa xong' }, ...prev.filter((item) => item.a !== defaultA || item.b !== targetMember.id)].slice(0, 5));
                toast.success('Nhận diện thành công!');
            }
        } else {
            toast.error('Thành viên không tồn tại trong gia phả này!');
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Tra cứu danh xưng" />
            <div className="gp-fade-up mx-auto max-w-[1320px]">
                <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="gp-eyebrow">Tra cứu quan hệ</span>
                            <span className="text-[var(--ink-faint)]">·</span>
                            <span className="text-[12px] text-[var(--ink-mute)]">Máy tính xưng hô · Quy tắc họ Việt</span>
                        </div>
                        <h1 className="gp-page-title">Xưng hô trong dòng họ</h1>
                        <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[var(--ink-mute)]">
                            Chọn hai thành viên để tính khoảng cách thế hệ, hướng huyết thống và cách gọi phù hợp theo phong tục Việt.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" className="gp-btn border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] hover:bg-[var(--card-soft)]" onClick={() => setIsScanningQR(true)}>
                            <Icon name="camera" size={14} />
                            Quét QR
                        </button>
                        <button type="button" className="gp-btn gp-btn-ghost" onClick={() => router.visit('/gia-pha/cay-gia-pha')}>
                            <Icon name="tree" size={14} />
                            Xem trên cây
                        </button>
                    </div>
                </div>

                <div className="mb-6 flex flex-col items-stretch gap-3 lg:flex-row">
                    <SelectorCard label="Người A" member={a} generation={a ? generations.get(a.id) : undefined} onPick={() => setPicker('a')} accent="gold" />
                    <div className="grid place-items-center">
                        <button
                            type="button"
                            onClick={swap}
                            title="Tráo hai người"
                            className="grid h-11 w-11 place-items-center rounded-full border border-[var(--gold-soft)] bg-[var(--card)] text-[var(--gold)] shadow-[var(--shadow-md)] transition hover:rotate-180 hover:bg-[var(--gold)] hover:text-white"
                            disabled={!aId || !bId}
                        >
                            <SwapIcon />
                        </button>
                    </div>
                    <SelectorCard label="Người B" member={b} generation={b ? generations.get(b.id) : undefined} onPick={() => setPicker('b')} accent="terracotta" />
                </div>

                {loading ? (
                    <div className="gp-card grid min-h-72 place-items-center">
                        <div className="text-center">
                            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--gold-pale)] border-t-[var(--gold)]" />
                            <div className="mt-3 text-sm font-semibold text-[var(--ink-mute)]">Đang tải thành viên...</div>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                        <div className="space-y-4">
                            <ResultCard a={a} b={b} result={result} />
                            {result?.path && result.path.length >= 2 && <PathView result={result} byId={byId} />}
                            {result && result.kind !== 'self' && result.kind !== 'unrelated' && (
                                <AnalysisCard result={result} byId={byId} />
                            )}
                        </div>

                        <div className="space-y-4">
                            <Presets presets={presets} byId={byId} onPick={pickPair} />
                            <RecentLookups recents={recents} byId={byId} onPick={pickPair} />
                            <Glossary />
                        </div>
                    </div>
                )}

                <PickerModal
                    open={picker !== null}
                    members={members}
                    generations={generations}
                    excludeId={picker === 'a' ? bId : aId}
                    onClose={() => setPicker(null)}
                    onPick={(id) => {
                        if (picker === 'a') setAId(id);
                        if (picker === 'b') setBId(id);
                        setPicker(null);
                    }}
                />

                <QRScannerModal
                    open={isScanningQR}
                    onClose={() => setIsScanningQR(false)}
                    onResult={handleQRResult}
                />
            </div>
        </AuthenticatedLayout>
    );
}

function SelectorCard({ label, member, generation, onPick, accent }: { label: string; member: Nguoi | null; generation?: number; onPick: () => void; accent: string }) {
    if (!member) {
        return (
            <button type="button" onClick={onPick} className="flex flex-1 flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--card-border-strong)] bg-[var(--card)] p-7 text-center">
                <span className="grid h-[72px] w-[72px] place-items-center rounded-full border-2 border-dashed border-[var(--card-border-strong)] bg-[var(--card-soft)] text-[var(--ink-mute)]">
                    <Icon name="plus" size={28} />
                </span>
                <span className="gp-eyebrow">{label}</span>
                <span className="text-[13px] text-[var(--ink-mute)]">Chạm để chọn thành viên</span>
            </button>
        );
    }

    return (
        <article className="gp-card relative flex-1 overflow-hidden p-[22px]">
            <div className="absolute inset-0 opacity-[0.06]" style={{ background: avatarGradient(member.id) }} />
            <div className="relative mb-4 flex items-center justify-between">
                <span
                    className="gp-chip"
                    style={{
                        background: `color-mix(in srgb, var(--${accent}) 14%, transparent)`,
                        borderColor: `color-mix(in srgb, var(--${accent}) 22%, transparent)`,
                        color: `var(--${accent})`,
                    }}
                >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {label}
                </span>
                <button type="button" onClick={onPick} title="Đổi" className="grid h-8 w-8 place-items-center rounded-lg text-[var(--ink-mute)] hover:bg-[var(--card-soft)] hover:text-[var(--gold)]">
                    <Icon name="edit" size={14} />
                </button>
            </div>

            <div className="relative flex items-center gap-3">
                <Avatar member={member} size="lg" />
                <div className="min-w-0 flex-1">
                    <div className="mb-1 text-[10.5px] font-bold uppercase tracking-[1.5px] text-[var(--ink-mute)]">
                        Đời {generation || '?'} · {member.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'}
                    </div>
                    <h2 className="truncate font-serif text-[26px] font-semibold leading-tight">{member.ten_day_du}</h2>
                    <div className="mt-1 text-[12px] text-[var(--ink-mute)]">
                        {formatYear(member.ngay_sinh) || '?'} {member.da_mat ? `- ${formatYear(member.ngay_mat) || '?'}` : '- nay'}
                    </div>
                </div>
            </div>
        </article>
    );
}

function ResultCard({ a, b, result }: { a: Nguoi | null; b: Nguoi | null; result: RelationshipResult | null }) {
    if (!a || !b || !result) {
        return (
            <div className="gp-card p-12 text-center">
                <Icon name="link" size={38} className="mx-auto text-[var(--ink-faint)]" />
                <div className="mt-4 text-[14px] text-[var(--ink-mute)]">Chọn hai thành viên để xem xưng hô</div>
            </div>
        );
    }

    const meta = KIND_META[result.kind];
    const lastA = shortName(a.ten_day_du);
    const lastB = shortName(b.ten_day_du);

    return (
        <section className="gp-card relative overflow-hidden border-[var(--gold-soft)] bg-[linear-gradient(135deg,var(--card)_0%,color-mix(in_srgb,var(--gold)_5%,var(--card))_100%)] p-8">
            <Icon name="sparkle" size={48} className="absolute right-4 top-4 text-[var(--gold)] opacity-20" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-[radial-gradient(circle,var(--gold-glow),transparent_70%)] opacity-70" />

            <div className="relative mb-4 flex flex-wrap gap-2">
                <span
                    className="gp-chip"
                    style={{
                        background: `color-mix(in srgb, var(--${meta.color}) 14%, transparent)`,
                        borderColor: `color-mix(in srgb, var(--${meta.color}) 25%, transparent)`,
                        color: `var(--${meta.color})`,
                    }}
                >
                    <Icon name={meta.icon} size={11} />
                    {meta.label}
                </span>
                {result.via && <span className="gp-chip">{result.via === 'marriage' ? 'Qua hôn nhân' : 'Huyết thống'}</span>}
                {typeof result.generations === 'number' && result.generations > 0 && <span className="gp-chip">Cách {result.generations} đời</span>}
                {result.side && <span className="gp-chip">{result.side === 'paternal' ? 'Bên nội' : 'Bên ngoại'}</span>}
            </div>

            <div className="relative">
                <div className="mb-1 text-[13px] text-[var(--ink-soft)]">
                    <span className="font-semibold text-[var(--ink)]">{lastB}</span> gọi <span className="font-semibold text-[var(--ink)]">{lastA}</span> là
                </div>
                <div className="font-serif text-[clamp(42px,7vw,68px)] font-semibold leading-none tracking-[-0.5px] text-[var(--gold)]">
                    {result.bToA}
                </div>

                <div className="mt-6 flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--card-soft)] px-4 py-3">
                    <Icon name="arrow-right" size={15} className="shrink-0 text-[var(--ink-mute)]" />
                    <div className="min-w-0">
                        <span className="text-[13px] text-[var(--ink-soft)]">
                            <span className="font-semibold text-[var(--ink)]">{lastA}</span> gọi <span className="font-semibold text-[var(--ink)]">{lastB}</span> là{' '}
                        </span>
                        <span className="font-serif text-[24px] font-semibold text-[var(--brown)]">{result.aToB}</span>
                    </div>
                </div>

                {result.desc && <p className="mt-4 text-[13.5px] leading-6 text-[var(--ink-soft)]">{result.desc}</p>}
            </div>
        </section>
    );
}

function PathView({ result, byId }: { result: RelationshipResult; byId: Map<number, Nguoi> }) {
    const path = result.path || [];

    return (
        <section className="gp-card p-[22px]">
            <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-[16px] font-semibold">Con đường quan hệ</h2>
                    <p className="mt-1 text-[12.5px] text-[var(--ink-mute)]">Theo nhánh cha mẹ và tổ tiên chung gần nhất</p>
                </div>
                <Icon name="branch" size={18} className="text-[var(--gold)]" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
                {path.map((id, index) => {
                    const member = byId.get(id);
                    if (!member) return null;
                    return (
                        <div key={`${id}-${index}`} className="flex items-center gap-2">
                            <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--card-soft)] py-1 pl-1 pr-3">
                                <Avatar member={member} size="sm" />
                                <span className="max-w-[180px] truncate text-[12.5px] font-semibold">{shortName(member.ten_day_du)}</span>
                            </div>
                            {index < path.length - 1 && <Icon name="chevron-right" size={14} className="text-[var(--ink-faint)]" />}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function AnalysisCard({ result, byId }: { result: RelationshipResult; byId: Map<number, Nguoi> }) {
    return (
        <section className="gp-card p-[22px]">
            <h2 className="mb-4 text-[16px] font-semibold">Phân tích chi tiết</h2>
            <div className="grid gap-4 md:grid-cols-2">
                <DetailField label="Loại quan hệ" value={KIND_META[result.kind].label} />
                <DetailField label="Đường lối" value={result.via === 'marriage' ? 'Qua hôn nhân' : 'Huyết thống trực tiếp'} />
                <DetailField label="Khoảng cách thế hệ" value={`${result.generations || 0} đời`} />
                {result.level && <DetailField label="Bậc họ" value={`Đời ${result.level - 1}`} />}
                {result.side && <DetailField label="Nhánh" value={result.side === 'paternal' ? 'Bên nội (cha)' : 'Bên ngoại (mẹ)'} />}
                {result.common && <DetailField label="Tổ chung" value={byId.get(result.common)?.ten_day_du || 'Chưa rõ'} fullSpan />}
            </div>
        </section>
    );
}

function Presets({ presets, byId, onPick }: { presets: Array<{ a: number; b: number; note: string }>; byId: Map<number, Nguoi>; onPick: (a: number, b: number) => void }) {
    return (
        <section className="gp-card p-[22px]">
            <h2 className="text-[16px] font-semibold">Tra cứu mẫu</h2>
            <p className="mb-4 mt-1 text-[12.5px] text-[var(--ink-mute)]">Bấm để xem nhanh</p>
            <div className="space-y-1.5">
                {presets.length === 0 && <div className="text-sm text-[var(--ink-mute)]">Chưa đủ dữ liệu để tạo mẫu.</div>}
                {presets.map((preset, index) => {
                    const a = byId.get(preset.a);
                    const b = byId.get(preset.b);
                    if (!a || !b) return null;
                    return (
                        <button key={`${preset.a}-${preset.b}-${index}`} type="button" onClick={() => onPick(preset.a, preset.b)} className="flex w-full items-center gap-3 rounded-[10px] border border-transparent px-2.5 py-2 text-left transition hover:border-[var(--gold-soft)] hover:bg-[var(--card-soft)]">
                            <StackedAvatars a={a} b={b} />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[12.5px] font-semibold">{shortName(a.ten_day_du)} & {shortName(b.ten_day_du)}</span>
                                <span className="block text-[11px] text-[var(--ink-mute)]">{preset.note}</span>
                            </span>
                            <Icon name="chevron-right" size={13} className="text-[var(--ink-faint)]" />
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function RecentLookups({ recents, byId, onPick }: { recents: Array<{ a: number; b: number; time: string }>; byId: Map<number, Nguoi>; onPick: (a: number, b: number) => void }) {
    return (
        <section className="gp-card p-[22px]">
            <h2 className="text-[16px] font-semibold">Đã tra gần đây</h2>
            <p className="mb-3 mt-1 text-[12.5px] text-[var(--ink-mute)]">Lịch sử cá nhân trong phiên này</p>
            <div className="space-y-1">
                {recents.length === 0 && <div className="text-sm text-[var(--ink-mute)]">Chưa có lượt tra cứu.</div>}
                {recents.map((recent, index) => {
                    const a = byId.get(recent.a);
                    const b = byId.get(recent.b);
                    if (!a || !b) return null;
                    return (
                        <button key={`${recent.a}-${recent.b}-${index}`} type="button" onClick={() => onPick(recent.a, recent.b)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-[var(--card-soft)]">
                            <StackedAvatars a={a} b={b} small />
                            <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{lastWord(a.ten_day_du)} ↔ {lastWord(b.ten_day_du)}</span>
                            <span className="text-[10.5px] text-[var(--ink-mute)]">{recent.time}</span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function Glossary() {
    return (
        <section className="gp-card p-[22px]">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-[16px] font-semibold">Từ điển xưng hô</h2>
                    <p className="mt-1 text-[12.5px] text-[var(--ink-mute)]">Tra cứu nhanh</p>
                </div>
                <Icon name="book" size={17} className="text-[var(--gold)]" />
            </div>
            <div className="space-y-4">
                {GLOSSARY.map((group) => (
                    <div key={group.side}>
                        <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[1.5px] text-[var(--gold)]">{group.side}</div>
                        <div className="space-y-1">
                            {group.terms.map(([term, desc]) => (
                                <div key={term} className="flex items-center justify-between gap-3 rounded-md bg-[var(--card-soft)] px-2 py-1.5">
                                    <span className="font-serif text-[15px] font-semibold">{term}</span>
                                    <span className="text-right text-[11.5px] text-[var(--ink-mute)]">{desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function PickerModal({
    open,
    members,
    generations,
    excludeId,
    onClose,
    onPick,
}: {
    open: boolean;
    members: Nguoi[];
    generations: Map<number, number>;
    excludeId: number | null;
    onClose: () => void;
    onPick: (id: number) => void;
}) {
    const [query, setQuery] = useState('');
    const [filterGen, setFilterGen] = useState<number | null>(null);

    useEffect(() => {
        if (open) {
            setQuery('');
            setFilterGen(null);
        }
    }, [open]);

    if (!open) return null;

    const generationList = [...new Set([...generations.values()])].sort((a, b) => a - b);
    const filtered = members.filter((member) => {
        if (member.id === excludeId) return false;
        if (filterGen && generations.get(member.id) !== filterGen) return false;
        if (query && !member.ten_day_du.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="gp-card flex max-h-[82vh] w-full max-w-xl flex-col overflow-hidden shadow-[var(--shadow-lg)]" onClick={(e) => e.stopPropagation()}>
                <div className="border-b border-[var(--line)] p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="font-serif text-[24px] font-semibold">Chọn thành viên</h2>
                        <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--ink-mute)] hover:bg-[var(--card-soft)]">
                            <Icon name="x" size={17} />
                        </button>
                    </div>
                    <label className="relative block">
                        <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-mute)]" />
                        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} className="gp-input w-full py-2 pl-9 text-[13px]" placeholder="Tìm theo tên..." />
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => setFilterGen(null)} className={`gp-chip ${filterGen === null ? 'gp-chip-gold' : ''}`}>Tất cả · {members.length}</button>
                        {generationList.map((generation) => (
                            <button key={generation} type="button" onClick={() => setFilterGen(generation)} className={`gp-chip ${filterGen === generation ? 'gp-chip-gold' : ''}`}>
                                Đời {generation} · {members.filter((member) => generations.get(member.id) === generation).length}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-2">
                    {filtered.length === 0 && <div className="p-10 text-center text-sm text-[var(--ink-mute)]">Không tìm thấy thành viên nào</div>}
                    {filtered.map((member) => (
                        <button key={member.id} type="button" onClick={() => onPick(member.id)} className="flex w-full items-center gap-3 rounded-[10px] border border-transparent px-3 py-2.5 text-left transition hover:border-[var(--gold-soft)] hover:bg-[var(--card-soft)]">
                            <Avatar member={member} />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13.5px] font-semibold">{member.ten_day_du}</span>
                                <span className="block text-[11.5px] text-[var(--ink-mute)]">Đời {generations.get(member.id) || '?'} · {formatYear(member.ngay_sinh) || '?'}</span>
                            </span>
                            <Icon name="chevron-right" size={14} className="text-[var(--ink-faint)]" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function QRScannerModal({
    open,
    onClose,
    onResult,
}: {
    open: boolean;
    onClose: () => void;
    onResult: (targetCode: string) => void;
}) {
    const [manualId, setManualId] = useState('');

    useEffect(() => {
        if (!open) return;

        const scanner = new Html5QrcodeScanner(
            'qr-reader',
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        scanner.render(
            (decodedText) => {
                let targetCode: string | null = null;
                try {
                    const url = new URL(decodedText);
                    const param = url.searchParams.get('target_id');
                    if (param) targetCode = param;
                } catch (e) {
                    targetCode = decodedText;
                }

                if (targetCode) {
                    scanner.clear();
                    onResult(targetCode);
                }
            },
            (error) => {
                // ignore
            }
        );

        return () => {
            scanner.clear().catch(console.error);
        };
    }, [open, onResult]);

    if (!open) return null;

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const targetCode = manualId.trim();
        if (targetCode) {
            onResult(targetCode);
        } else {
            toast.error('Mã không hợp lệ!');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="gp-card flex w-full max-w-md flex-col overflow-hidden shadow-[var(--shadow-lg)]" onClick={(e) => e.stopPropagation()}>
                <div className="border-b border-[var(--line)] p-4 flex items-center justify-between">
                    <h2 className="font-serif text-[20px] font-semibold">Quét Mã QR Nhận Diện</h2>
                    <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--ink-mute)] hover:bg-[var(--card-soft)]">
                        <Icon name="x" size={17} />
                    </button>
                </div>
                <div className="p-4">
                    <div id="qr-reader" className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--card-soft)] min-h-[250px]"></div>
                    <div className="mt-3 text-center text-[11px] text-[var(--terracotta)] bg-red-50 p-2 rounded-lg">
                        * Lưu ý: Hãy đảm bảo đã cấp quyền Camera. Trên điện thoại, bạn cần truy cập qua HTTPS hoặc localhost để trình duyệt cho phép dùng Camera.
                    </div>
                    <div className="mt-4 text-center text-[13px] text-[var(--ink-mute)]">
                        Hoặc nhập tay mã ID thành viên:
                    </div>
                    <form onSubmit={handleManualSubmit} className="mt-2 flex gap-2">
                        <input
                            type="text"
                            value={manualId}
                            onChange={(e) => setManualId(e.target.value)}
                            placeholder="Nhập ID (vd: 123)"
                            className="gp-input flex-1 py-2 text-[13px]"
                        />
                        <button type="submit" className="gp-btn gp-btn-primary px-4">Kiểm tra</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function DetailField({ label, value, fullSpan = false }: { label: string; value: string; fullSpan?: boolean }) {
    return (
        <div className={fullSpan ? 'md:col-span-2' : ''}>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-[var(--ink-mute)]">{label}</div>
            <div className="font-serif text-[17px] font-semibold">{value}</div>
        </div>
    );
}

function Avatar({ member, size = 'md' }: { member: Nguoi; size?: 'sm' | 'md' | 'lg' }) {
    const dimensions = size === 'lg' ? 'h-[60px] w-[60px] text-[18px]' : size === 'sm' ? 'h-6 w-6 text-[9px]' : 'h-10 w-10 text-[13px]';
    return (
        <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full font-bold text-white shadow ${dimensions}`} style={{ background: avatarGradient(member.id) }}>
            {member.anh_dai_dien ? <img src={member.anh_dai_dien} alt={member.ten_day_du} className="h-full w-full object-cover" /> : initials(member.ten_day_du)}
        </span>
    );
}

function StackedAvatars({ a, b, small = false }: { a: Nguoi; b: Nguoi; small?: boolean }) {
    const size = small ? 'sm' : 'md';
    return (
        <span className="flex shrink-0">
            <Avatar member={a} size={size} />
            <span className={small ? '-ml-1.5' : '-ml-2'}>
                <Avatar member={b} size={size} />
            </span>
        </span>
    );
}

function computeRelationship(a: Nguoi, b: Nguoi, byId: Map<number, Nguoi>): RelationshipResult {
    if (a.id === b.id) {
        return { kind: 'self', aToB: 'Chính mình', bToA: 'Chính mình', path: [a.id], common: a.id };
    }

    if ((a.vo_chong_ids || []).includes(b.id)) {
        return {
            kind: 'spouse',
            aToB: a.gioi_tinh === 'nam' ? 'Vợ' : 'Chồng',
            bToA: b.gioi_tinh === 'nam' ? 'Vợ' : 'Chồng',
            desc: 'Vợ chồng - hôn phối trực tiếp',
            path: [a.id, b.id],
            common: null,
            via: 'marriage',
        };
    }

    const blood = computeBloodRelationship(a, b, byId);
    if (blood) return blood;

    const inLaw = computeInLawRelationship(a, b, byId);
    if (inLaw) return inLaw;

    return {
        kind: 'unrelated',
        aToB: 'Không quan hệ',
        bToA: 'Không quan hệ',
        desc: 'Không tìm thấy quan hệ huyết thống hoặc hôn nhân trong dữ liệu hiện có.',
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
        const term = DIRECT_UP[upB]?.[a.gioi_tinh] || `Tổ tiên đời ${upB}`;
        const reverse = DIRECT_DOWN[upB]?.[b.gioi_tinh] || `Hậu duệ đời ${upB}`;
        return {
            kind: 'ancestor',
            aToB: reverse,
            bToA: term,
            desc: `Trực hệ - ${term} của ${lastWord(b.ten_day_du)}, cách ${upB} đời.`,
            path: fullPath,
            common: commonId,
            generations: upB,
            via: 'blood',
        };
    }

    if (upB === 0) {
        const term = DIRECT_UP[upA]?.[b.gioi_tinh] || `Tổ tiên đời ${upA}`;
        const reverse = DIRECT_DOWN[upA]?.[a.gioi_tinh] || `Hậu duệ đời ${upA}`;
        return {
            kind: 'descendant',
            aToB: term,
            bToA: reverse,
            desc: `Trực hệ - ${term} của ${lastWord(a.ten_day_du)}, cách ${upA} đời.`,
            path: fullPath,
            common: commonId,
            generations: upA,
            via: 'blood',
        };
    }

    if (upA === 1 && upB === 1) {
        const olderA = isOlder(a, b);
        return {
            kind: 'sibling',
            aToB: siblingTerm(b, olderA ? 'younger' : 'older'),
            bToA: siblingTerm(a, olderA ? 'older' : 'younger'),
            desc: 'Anh chị em ruột - cùng cha hoặc mẹ trong dữ liệu gia phả.',
            path: [a.id, commonId, b.id],
            common: commonId,
            generations: 0,
            via: 'blood',
        };
    }

    if (upA === 1 && upB >= 2) {
        const bParent = byId.get(pathB[upB - 1]);
        const isPaternal = bParent?.gioi_tinh === 'nam';
        const base = pibName(a, isPaternal, bParent ? isOlder(a, bParent) : false);
        const prefix = genPrefix(upB, a.gioi_tinh);
        const bToA = `${prefix}${base}`.trim();
        return {
            kind: 'pibling',
            aToB: upB === 2 ? DIRECT_DOWN[2][b.gioi_tinh] : DIRECT_DOWN[upB - 1]?.[b.gioi_tinh] || 'Hậu duệ',
            bToA,
            desc: `${bToA} - ${isPaternal ? 'bên nội' : 'bên ngoại'}${bParent ? `, cùng nhánh với ${shortName(bParent.ten_day_du)}` : ''}.`,
            path: fullPath,
            common: commonId,
            generations: upB - upA,
            side: isPaternal ? 'paternal' : 'maternal',
            via: 'blood',
        };
    }

    if (upB === 1 && upA >= 2) {
        const aParent = byId.get(pathA[upA - 1]);
        const isPaternal = aParent?.gioi_tinh === 'nam';
        const base = pibName(b, isPaternal, aParent ? isOlder(b, aParent) : false);
        const prefix = genPrefix(upA, b.gioi_tinh);
        const aToB = `${prefix}${base}`.trim();
        return {
            kind: 'nibling',
            aToB,
            bToA: upA === 2 ? DIRECT_DOWN[2][a.gioi_tinh] : DIRECT_DOWN[upA - 1]?.[a.gioi_tinh] || 'Hậu duệ',
            desc: `${aToB} - ${isPaternal ? 'bên nội' : 'bên ngoại'}.`,
            path: fullPath,
            common: commonId,
            generations: upA - upB,
            side: isPaternal ? 'paternal' : 'maternal',
            via: 'blood',
        };
    }

    if (upA === upB) {
        const olderA = isOlder(a, b);
        const level = upA;
        return {
            kind: 'cousin',
            aToB: cousinTerm(b, olderA ? 'younger' : 'older'),
            bToA: cousinTerm(a, olderA ? 'older' : 'younger'),
            desc: `${level === 2 ? 'Anh em họ đời 1' : `Anh em họ đời ${level - 1}`} - cùng tổ tiên chung gần nhất.`,
            path: fullPath,
            common: commonId,
            generations: 0,
            level,
            via: 'blood',
        };
    }

    const removed = Math.abs(upA - upB);
    const closer = Math.min(upA, upB);
    return {
        kind: 'cousin-removed',
        aToB: upA < upB ? `Cô/Chú họ - cách ${removed} đời` : `Cháu họ - cách ${removed} đời`,
        bToA: upB < upA ? `Cô/Chú họ - cách ${removed} đời` : `Cháu họ - cách ${removed} đời`,
        desc: `Anh em họ ${closer === 2 ? 'đời 1' : `đời ${closer - 1}`} cách ${removed} đời.`,
        path: fullPath,
        common: commonId,
        generations: removed,
        via: 'blood',
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
            kind: 'in-law',
            aToB: inLawLabel(sub.aToB, 'spouse-side'),
            bToA: inLawLabel(sub.bToA, 'in-law-side'),
            desc: `Quan hệ qua hôn nhân của ${shortName(a.ten_day_du)} - ${sub.desc || ''}`,
            path: sub.path,
            common: sub.common,
            generations: sub.generations,
            via: 'marriage',
        };
    }

    return {
        kind: 'in-law',
        aToB: inLawLabel(sub.aToB, 'in-law-side'),
        bToA: inLawLabel(sub.bToA, 'spouse-side'),
        desc: `Quan hệ qua hôn nhân của ${shortName(b.ten_day_du)} - ${sub.desc || ''}`,
        path: sub.path,
        common: sub.common,
        generations: sub.generations,
        via: 'marriage',
    };
}

function inLawLabel(baseTerm: string, mode: 'spouse-side' | 'in-law-side') {
    if (baseTerm.includes('Cha')) return 'Bố vợ/Bố chồng';
    if (baseTerm.includes('Mẹ')) return 'Mẹ vợ/Mẹ chồng';
    if (baseTerm.includes('Con trai')) return 'Con rể';
    if (baseTerm.includes('Con gái')) return 'Con dâu';
    if (baseTerm.includes('Anh')) return mode === 'spouse-side' ? 'Anh chồng/Anh vợ' : 'Em rể/Em dâu';
    if (baseTerm.includes('Chị')) return 'Chị chồng/Chị vợ';
    if (baseTerm.includes('Em')) return 'Em chồng/Em vợ';
    return `${baseTerm} (qua hôn)`;
}

function genPrefix(gap: number, gender: 'nam' | 'nu') {
    if (gap === 2) return '';
    if (gap === 3) return gender === 'nam' ? 'Ông ' : 'Bà ';
    if (gap === 4) return 'Cụ ';
    if (gap === 5) return 'Kỵ ';
    return '';
}

function pibName(person: Nguoi, isPaternal: boolean, older: boolean) {
    if (isPaternal) {
        if (person.gioi_tinh === 'nam') return older ? 'Bác' : 'Chú';
        return 'Cô';
    }
    if (person.gioi_tinh === 'nam') return 'Cậu';
    return 'Dì';
}

// Helper functions for relationship computation
function siblingTerm(person: Nguoi, rank: 'older' | 'younger') {
    if (person.gioi_tinh === 'nam') return rank === 'older' ? 'Anh trai' : 'Em trai';
    return rank === 'older' ? 'Chị gái' : 'Em gái';
}

function cousinTerm(person: Nguoi, rank: 'older' | 'younger') {
    if (person.gioi_tinh === 'nam') return rank === 'older' ? 'Anh trai họ' : 'Em trai họ';
    return rank === 'older' ? 'Chị gái họ' : 'Em gái họ';
}

function buildGenerationMap(members: Nguoi[]) {
    const byId = new Map(members.map((member) => [member.id, member]));
    const result = new Map<number, number>();

    const resolve = (member: Nguoi): number => {
        const cached = result.get(member.id);
        if (cached) return cached;
        const parents = [member.id_cha, member.id_me].map((id) => (id ? byId.get(id) : undefined)).filter(Boolean) as Nguoi[];
        const generation = parents.length ? Math.max(...parents.map(resolve)) + 1 : 1;
        result.set(member.id, generation);
        return generation;
    };

    members.forEach(resolve);
    return result;
}

function makePresets(members: Nguoi[], byId: Map<number, Nguoi>) {
    const presets: Array<{ a: number; b: number; note: string }> = [];
    const add = (a?: number | null, b?: number | null, note?: string) => {
        if (!a || !b || a === b || !note) return;
        if (presets.some((item) => item.a === a && item.b === b)) return;
        presets.push({ a, b, note });
    };

    const childWithFather = members.find((member) => member.id_cha && byId.has(member.id_cha));
    add(childWithFather?.id, childWithFather?.id_cha, 'Con cháu → cha');

    const childWithGrandparent = members.find((member) => {
        const parent = member.id_cha ? byId.get(member.id_cha) : undefined;
        return Boolean(parent?.id_cha);
    });
    const parent = childWithGrandparent?.id_cha ? byId.get(childWithGrandparent.id_cha) : undefined;
    add(childWithGrandparent?.id, parent?.id_cha, 'Hậu duệ → ông tổ');

    const siblingPair = findSiblingPair(members);
    add(siblingPair?.[0], siblingPair?.[1], 'Anh em ruột');

    const spouse = members.find((member) => (member.vo_chong_ids || []).some((id) => byId.has(id)));
    add(spouse?.id, spouse?.vo_chong_ids?.find((id) => byId.has(id)), 'Vợ chồng');

    const cousinPair = findCousinPair(members, byId);
    add(cousinPair?.[0], cousinPair?.[1], 'Anh em họ');

    return presets.slice(0, 6);
}

function makeInitialRecents(members: Nguoi[]) {
    if (members.length < 2) return [];
    const recents: Array<{ a: number; b: number; time: string }> = [];
    for (let index = 0; index < members.length - 1 && recents.length < 3; index += 1) {
        recents.push({ a: members[index].id, b: members[index + 1].id, time: index === 0 ? 'Vừa xong' : index === 1 ? '5 phút' : 'Hôm qua' });
    }
    return recents;
}

function findSiblingPair(members: Nguoi[]) {
    for (const a of members) {
        const b = members.find((member) => member.id !== a.id && ((a.id_cha && member.id_cha === a.id_cha) || (a.id_me && member.id_me === a.id_me)));
        if (b) return [a.id, b.id] as const;
    }
    return null;
}

function findCousinPair(members: Nguoi[], byId: Map<number, Nguoi>) {
    for (const a of members) {
        const parentA = a.id_cha ? byId.get(a.id_cha) : a.id_me ? byId.get(a.id_me) : undefined;
        if (!parentA) continue;
        for (const b of members) {
            if (a.id === b.id) continue;
            const parentB = b.id_cha ? byId.get(b.id_cha) : b.id_me ? byId.get(b.id_me) : undefined;
            if (!parentB || parentA.id === parentB.id) continue;
            const shareGrandparent = Boolean(
                (parentA.id_cha && parentA.id_cha === parentB.id_cha) ||
                    (parentA.id_me && parentA.id_me === parentB.id_me) ||
                    (parentA.id_cha && parentA.id_cha === parentB.id_me) ||
                    (parentA.id_me && parentA.id_me === parentB.id_cha),
            );
            if (shareGrandparent) return [a.id, b.id] as const;
        }
    }
    return null;
}

function isOlder(a: Nguoi, b: Nguoi) {
    const aYear = Number(formatYear(a.ngay_sinh));
    const bYear = Number(formatYear(b.ngay_sinh));
    if (Number.isFinite(aYear) && Number.isFinite(bYear) && aYear !== bYear) return aYear < bYear;
    return a.id < b.id;
}

function formatYear(date: string | null) {
    return date ? date.substring(0, 4) : null;
}

function shortName(name: string) {
    return name.trim().split(/\s+/).slice(-2).join(' ');
}

function lastWord(name: string) {
    return name.trim().split(/\s+/).slice(-1)[0] || name;
}

function initials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

function avatarGradient(seed: number) {
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

function SwapIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3L4 7l4 4" />
            <path d="M4 7h12" />
            <path d="M16 21l4-4-4-4" />
            <path d="M20 17H8" />
        </svg>
    );
}
