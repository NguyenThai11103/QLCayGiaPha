import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import { Nguoi, nguoiApi } from '../../services/gia-pha.api';

// ─── Kinship engine ──────────────────────────────────────────────────────────

function getPathToRoot(id: number, map: Map<number, Nguoi>): number[] {
    const path: number[] = [];
    let cur: number | null = id;
    const visited = new Set<number>();
    while (cur != null && map.has(cur) && !visited.has(cur)) {
        visited.add(cur);
        path.push(cur);
        cur = map.get(cur)!.id_cha ?? null;
    }
    return path;
}

function getAncestorDistances(id: number, map: Map<number, Nguoi>): Map<number, number> {
    const distances = new Map<number, number>();
    const queue: Array<{ id: number; distance: number }> = [{ id, distance: 0 }];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (distances.has(current.id) || !map.has(current.id)) continue;

        distances.set(current.id, current.distance);
        const person = map.get(current.id)!;
        const parents = [person.id_cha, person.id_me].filter((parentId): parentId is number => parentId != null);

        for (const parentId of parents) {
            queue.push({ id: parentId, distance: current.distance + 1 });
        }
    }

    return distances;
}

function getBloodDistance(aId: number, bId: number, map: Map<number, Nguoi>) {
    const ancestorsA = getAncestorDistances(aId, map);
    const ancestorsB = getAncestorDistances(bId, map);
    let best: { lcaId: number; dA: number; dB: number } | null = null;

    for (const [ancestorId, dA] of ancestorsA) {
        const dB = ancestorsB.get(ancestorId);
        if (dB == null) continue;

        if (!best || dA + dB < best.dA + best.dB) {
            best = { lcaId: ancestorId, dA, dB };
        }
    }

    return best;
}

interface KinshipResult {
    loai: string;           // e.g. "Huyết thống", "Hôn nhân", ...
    aTuongQuanB: string;    // A gọi B là ...
    bTuongQuanA: string;    // B gọi A là ...
    buoc: string[];         // path explanation
}

function parentLabel(person: Nguoi): string {
    return person.gioi_tinh === 'nam' ? 'Cha' : 'Mẹ';
}

function spouseLabel(person: Nguoi): string {
    return person.gioi_tinh === 'nam' ? 'chồng' : 'vợ';
}

function parentInLawLabel(parent: Nguoi, spouse: Nguoi): string {
    const side = spouse.gioi_tinh === 'nam' ? 'chồng' : 'vợ';
    return `${parentLabel(parent).toLowerCase()} ${side}`;
}

function childInLawLabel(spouse: Nguoi): string {
    return spouse.gioi_tinh === 'nam' ? 'con dâu' : 'con rể';
}

function directAncestorLabel(person: Nguoi, distance: number): string {
    if (distance === 1) return parentLabel(person);
    if (distance === 2) return person.gioi_tinh === 'nam' ? 'Ông' : 'Bà';
    if (distance === 3) return 'Cụ';
    if (distance === 4) return 'Kỵ';
    return `Tổ tiên đời ${distance}`;
}

function directDescendantLabel(distance: number): string {
    if (distance === 1) return 'Con';
    if (distance === 2) return 'Cháu';
    if (distance === 3) return 'Chắt';
    if (distance === 4) return 'Chút';
    if (distance === 5) return 'Chít';
    return `Hậu duệ đời ${distance}`;
}

function computeDirectInLaw(a: Nguoi, b: Nguoi, map: Map<number, Nguoi>): KinshipResult | null {
    for (const spouseId of b.vo_chong_ids || []) {
        const spouse = map.get(spouseId);
        if (!spouse) continue;

        const distance = getBloodDistance(a.id, spouse.id, map);
        if (distance?.dA === 0 && distance.dB === 1) {
            return {
                loai: 'Hôn nhân - Huyết thống',
                aTuongQuanB: `${childInLawLabel(spouse)} của ${a.ten_day_du}`,
                bTuongQuanA: `${parentInLawLabel(a, spouse)} của ${b.ten_day_du}`,
                buoc: [`${a.ten_day_du} là ${parentLabel(a).toLowerCase()} của ${spouse.ten_day_du} (${spouseLabel(spouse)} của ${b.ten_day_du}).`],
            };
        }

        if (distance?.dB === 0 && distance.dA >= 1) {
            return {
                loai: 'Hôn nhân - Huyết thống',
                aTuongQuanB: directAncestorLabel(b, distance.dA),
                bTuongQuanA: directDescendantLabel(distance.dA),
                buoc: [`${b.ten_day_du} là ${spouseLabel(b)} của ${spouse.ten_day_du}, tổ tiên đời ${distance.dA} của ${a.ten_day_du}.`],
            };
        }
    }

    for (const spouseId of a.vo_chong_ids || []) {
        const spouse = map.get(spouseId);
        if (!spouse) continue;

        const distance = getBloodDistance(b.id, spouse.id, map);
        if (distance?.dA === 0 && distance.dB === 1) {
            return {
                loai: 'Hôn nhân - Huyết thống',
                aTuongQuanB: `${parentInLawLabel(b, spouse)} của ${a.ten_day_du}`,
                bTuongQuanA: `${childInLawLabel(spouse)} của ${b.ten_day_du}`,
                buoc: [`${b.ten_day_du} là ${parentLabel(b).toLowerCase()} của ${spouse.ten_day_du} (${spouseLabel(spouse)} của ${a.ten_day_du}).`],
            };
        }

        if (distance?.dB === 0 && distance.dA >= 1) {
            return {
                loai: 'Hôn nhân - Huyết thống',
                aTuongQuanB: directDescendantLabel(distance.dA),
                bTuongQuanA: directAncestorLabel(a, distance.dA),
                buoc: [`${a.ten_day_du} là ${spouseLabel(a)} của ${spouse.ten_day_du}, tổ tiên đời ${distance.dA} của ${b.ten_day_du}.`],
            };
        }
    }

    return null;
}

function tinhDanhXung(a: Nguoi, b: Nguoi, allPeople: Nguoi[]): KinshipResult {
    const map = new Map(allPeople.map((p) => [p.id, p]));

    // ── Hôn nhân ──
    if ((a.vo_chong_ids || []).includes(b.id)) {
        return {
            loai: 'Hôn nhân',
            aTuongQuanB: a.gioi_tinh === 'nam' ? 'Vợ' : 'Chồng',
            bTuongQuanA: b.gioi_tinh === 'nam' ? 'Vợ' : 'Chồng',
            buoc: [`${a.ten_day_du} và ${b.ten_day_du} là vợ chồng.`],
        };
    }

    const bloodDistance = getBloodDistance(a.id, b.id, map);

    if (bloodDistance == null) {
        const inLawResult = computeDirectInLaw(a, b, map);
        if (inLawResult) return inLawResult;

        return {
            loai: 'Không xác định',
            aTuongQuanB: '—',
            bTuongQuanA: '—',
            buoc: ['Không tìm được quan hệ giữa hai người này trong cùng một dòng họ.'],
        };
    }

    const { lcaId, dA, dB } = bloodDistance;
    const result = computeBlood(a, b, dA, dB);
    const lcaName = map.get(lcaId)?.ten_day_du || '';
    const buoc: string[] = [];
    if (dA === 0 && dB === 0) buoc.push('Hai người là một.');
    else if (dA === 0) buoc.push(`${b.ten_day_du} là hậu duệ đời ${dB} của ${a.ten_day_du}.`);
    else if (dB === 0) buoc.push(`${a.ten_day_du} là hậu duệ đời ${dA} của ${b.ten_day_du}.`);
    else buoc.push(`Tổ tiên chung gần nhất: ${lcaName} (cách A ${dA} đời, cách B ${dB} đời).`);

    return { ...result, buoc };
}

function computeBlood(a: Nguoi, b: Nguoi, dA: number, dB: number): Pick<KinshipResult, 'loai' | 'aTuongQuanB' | 'bTuongQuanA'> {
    const gB = b.gioi_tinh;
    const gA = a.gioi_tinh;

    if (dA === 0 && dB === 0) return { loai: 'Bản thân', aTuongQuanB: 'Chính mình', bTuongQuanA: 'Chính mình' };

    // A là tổ tiên của B
    if (dA === 0) {
        if (dB === 1) return { loai: 'Trực hệ', aTuongQuanB: 'Con', bTuongQuanA: gA === 'nam' ? 'Cha' : 'Mẹ' };
        if (dB === 2) return { loai: 'Trực hệ', aTuongQuanB: 'Cháu', bTuongQuanA: gA === 'nam' ? 'Ông' : 'Bà' };
        if (dB === 3) return { loai: 'Trực hệ', aTuongQuanB: 'Chắt', bTuongQuanA: 'Cụ' };
        if (dB === 4) return { loai: 'Trực hệ', aTuongQuanB: 'Chút', bTuongQuanA: 'Kỵ' };
        return { loai: 'Trực hệ', aTuongQuanB: `Hậu duệ đời ${dB}`, bTuongQuanA: `Tổ tiên đời ${dB}` };
    }

    // B là tổ tiên của A
    if (dB === 0) {
        if (dA === 1) return { loai: 'Trực hệ', aTuongQuanB: gB === 'nam' ? 'Cha' : 'Mẹ', bTuongQuanA: 'Con' };
        if (dA === 2) return { loai: 'Trực hệ', aTuongQuanB: gB === 'nam' ? 'Ông' : 'Bà', bTuongQuanA: 'Cháu' };
        if (dA === 3) return { loai: 'Trực hệ', aTuongQuanB: 'Cụ', bTuongQuanA: 'Chắt' };
        if (dA === 4) return { loai: 'Trực hệ', aTuongQuanB: 'Kỵ', bTuongQuanA: 'Chút' };
        return { loai: 'Trực hệ', aTuongQuanB: `Tổ tiên đời ${dA}`, bTuongQuanA: `Hậu duệ đời ${dA}` };
    }

    // Anh chị em ruột
    if (dA === 1 && dB === 1) {
        const abLabel = gA === 'nam' ? 'Anh/Em trai' : 'Chị/Em gái';
        const baLabel = gB === 'nam' ? 'Anh/Em trai' : 'Chị/Em gái';
        return { loai: 'Anh chị em', aTuongQuanB: abLabel, bTuongQuanA: baLabel };
    }

    // Chú/Bác/Cô/Dì - Cháu
    if (dA === 1 && dB === 2) return { loai: 'Chú bác cô dì', aTuongQuanB: gA === 'nam' ? 'Chú/Bác' : 'Cô', bTuongQuanA: 'Cháu' };
    if (dA === 2 && dB === 1) return { loai: 'Chú bác cô dì', aTuongQuanB: 'Cháu', bTuongQuanA: gB === 'nam' ? 'Chú/Bác' : 'Cô' };

    // Anh em họ
    if (dA === dB) return { loai: 'Họ hàng', aTuongQuanB: 'Anh/Chị/Em họ', bTuongQuanA: 'Anh/Chị/Em họ' };

    const diff = Math.abs(dA - dB);
    if (dA > dB) return { loai: 'Họ hàng', aTuongQuanB: diff === 1 ? 'Cháu họ' : `Hậu duệ họ đời ${dA - dB}`, bTuongQuanA: diff === 1 ? 'Chú/Bác/Cô họ' : 'Ông/Bà họ' };
    return { loai: 'Họ hàng', aTuongQuanB: diff === 1 ? 'Chú/Bác/Cô họ' : 'Ông/Bà họ', bTuongQuanA: diff === 1 ? 'Cháu họ' : `Hậu duệ họ đời ${dB - dA}` };
}

// ─── UI ──────────────────────────────────────────────────────────────────────

const LOAI_COLOR: Record<string, string> = {
    'Hôn nhân'                   : '#10b981',
    'Trực hệ'                    : '#059669',
    'Anh chị em'                 : '#8b5cf6',
    'Chú bác cô dì'              : '#0ea5e9',
    'Họ hàng'                    : '#10b981',
    'Hôn nhân - Huyết thống'     : '#10b981',
    'Không xác định'             : '#9ca3af',
    'Bản thân'                   : '#9ca3af',
};

const MemberSelector = ({
    label, members, selectedId, onChange,
}: {
    label: string; members: Nguoi[]; selectedId: string; onChange: (id: string) => void;
}) => {
    const selected = members.find((m) => String(m.id) === selectedId);
    return (
        <div className="flex-1 min-w-0">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</div>
            <div className="relative rounded-xl border-2 border-emerald-200 bg-emerald-50/60 p-1">
                {selected && (
                    <div className="mb-1 flex items-center gap-2 px-2 pt-1">
                        <div
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow"
                            style={{ background: selected.gioi_tinh === 'nam' ? 'linear-gradient(135deg,#0ea5e9,#3b82f6)' : 'linear-gradient(135deg,#f43f5e,#ec4899)' }}
                        >
                            {selected.anh_dai_dien
                                ? <img src={selected.anh_dai_dien} className="h-full w-full rounded-full object-cover" alt="" />
                                : selected.ten_day_du.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="font-bold text-gray-800">{selected.ten_day_du}</div>
                            <div className="text-[11px] text-gray-400">{selected.ngay_sinh?.substring(0, 4) || '?'}</div>
                        </div>
                    </div>
                )}
                <select
                    value={selectedId}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full rounded-lg border-0 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                    <option value="">— Chọn thành viên —</option>
                    {members.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.ten_day_du}{m.ngay_sinh ? ` (${m.ngay_sinh.substring(0, 4)})` : ''}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

const BANG_DANH_XUNG = [
    { quan_he: 'Cha / Mẹ', a_goi_b: 'Cha / Mẹ', b_goi_a: 'Con' },
    { quan_he: 'Ông / Bà', a_goi_b: 'Ông / Bà', b_goi_a: 'Cháu' },
    { quan_he: 'Cụ (Cố)', a_goi_b: 'Cụ', b_goi_a: 'Chắt' },
    { quan_he: 'Kỵ (Sơ)', a_goi_b: 'Kỵ', b_goi_a: 'Chút' },
    { quan_he: 'Vợ chồng', a_goi_b: 'Chồng / Vợ', b_goi_a: 'Vợ / Chồng' },
    { quan_he: 'Anh chị em ruột', a_goi_b: 'Anh / Chị / Em', b_goi_a: 'Anh / Chị / Em' },
    { quan_he: 'Chú / Bác / Cô', a_goi_b: 'Chú / Bác / Cô', b_goi_a: 'Cháu' },
    { quan_he: 'Anh em họ', a_goi_b: 'Anh / Chị / Em họ', b_goi_a: 'Anh / Chị / Em họ' },
    { quan_he: 'Cháu họ', a_goi_b: 'Cháu họ', b_goi_a: 'Chú / Bác / Cô họ' },
];

export default function TraCuuDanhXung() {
    const [members, setMembers] = useState<Nguoi[]>([]);
    const [loading, setLoading] = useState(true);
    const [idA, setIdA] = useState('');
    const [idB, setIdB] = useState('');
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        nguoiApi.list().then((res) => {
            setMembers(res.data || []);
        }).finally(() => setLoading(false));
    }, []);

    const personA = useMemo(() => members.find((m) => String(m.id) === idA), [members, idA]);
    const personB = useMemo(() => members.find((m) => String(m.id) === idB), [members, idB]);

    const result = useMemo<KinshipResult | null>(() => {
        if (!personA || !personB || personA.id === personB.id) return null;
        return tinhDanhXung(personA, personB, members);
    }, [personA, personB, members]);

    const accentColor = result ? (LOAI_COLOR[result.loai] || '#9ca3af') : '#d1d5db';

    const swap = () => { setIdA(idB); setIdB(idA); };

    return (
        <AuthenticatedLayout>
            <Head title="Tra cứu danh xưng" />
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Tra cứu danh xưng</h2>
                    <p className="mt-1 text-sm text-gray-500">Chọn hai thành viên để tự động tính cách gọi theo quan hệ gia phả</p>
                </div>

                {/* Selector card */}
                <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-7 w-7 animate-spin rounded-full border-4 border-emerald-200" style={{ borderTopColor: '#059669' }} />
                        </div>
                    ) : (
                        <div className="flex items-end gap-3">
                            <MemberSelector label="Thành viên A" members={members} selectedId={idA} onChange={setIdA} />

                            <button
                                type="button"
                                onClick={swap}
                                title="Hoán đổi"
                                className="mb-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 shadow-sm transition hover:bg-emerald-50 hover:text-emerald-500"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </button>

                            <MemberSelector label="Thành viên B" members={members} selectedId={idB} onChange={setIdB} />
                        </div>
                    )}
                </div>

                {/* Result */}
                {result && personA && personB && (
                    <>
                        {/* Relationship type badge */}
                        <div
                            className="mb-4 flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-white shadow-sm"
                            style={{ background: `linear-gradient(135deg, ${accentColor}dd, ${accentColor}99)` }}
                        >
                            <svg className="h-5 w-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Quan hệ {result.loai}
                        </div>

                        {/* A↔B danh xưng */}
                        <div className="mb-4 grid grid-cols-2 gap-4">
                            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    {personA.ten_day_du} gọi {personB.ten_day_du} là
                                </div>
                                <div className="text-3xl font-extrabold" style={{ color: accentColor }}>
                                    {result.aTuongQuanB}
                                </div>
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    {personB.ten_day_du} gọi {personA.ten_day_du} là
                                </div>
                                <div className="text-3xl font-extrabold" style={{ color: accentColor }}>
                                    {result.bTuongQuanA}
                                </div>
                            </div>
                        </div>

                        {/* Path analysis */}
                        <div className="mb-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                Phân tích con đường quan hệ
                            </div>
                            <ol className="space-y-1.5">
                                {result.buoc.map((step, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                        <span
                                            className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                            style={{ background: accentColor }}
                                        >
                                            {i + 1}
                                        </span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </>
                )}

                {/* Empty prompt */}
                {!result && !loading && (
                    <div className="mb-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center text-sm text-gray-400">
                        {idA && idB && idA === idB
                            ? 'Vui lòng chọn hai người khác nhau.'
                            : 'Chọn hai thành viên để xem danh xưng.'}
                    </div>
                )}

                {/* Guide toggle */}
                <button
                    type="button"
                    onClick={() => setShowGuide((v) => !v)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-emerald-600"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Hướng dẫn sử dụng &amp; Bảng danh xưng
                </button>

                {showGuide && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-5 py-3 text-sm font-bold text-gray-700">Bảng danh xưng tham khảo</div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100 text-sm">
                                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3 text-left">Quan hệ</th>
                                        <th className="px-5 py-3 text-left">A gọi B</th>
                                        <th className="px-5 py-3 text-left">B gọi A</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {BANG_DANH_XUNG.map((row) => (
                                        <tr key={row.quan_he} className="hover:bg-emerald-50/40">
                                            <td className="px-5 py-2.5 font-semibold text-gray-700">{row.quan_he}</td>
                                            <td className="px-5 py-2.5 text-gray-600">{row.a_goi_b}</td>
                                            <td className="px-5 py-2.5 text-gray-600">{row.b_goi_a}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
