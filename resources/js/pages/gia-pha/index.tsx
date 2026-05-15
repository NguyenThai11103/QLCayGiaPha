import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import axios from 'axios';
import { DongHo, dongHoApi } from '../../services/gia-pha.api';

interface Nguoi {
    id: number;
    id_dong_ho: number;
    ten_day_du: string;
    gioi_tinh: 'nam' | 'nu';
    ngay_sinh: string | null;
    da_mat: boolean | number;
    ngay_mat: string | null;
    id_cha: number | null;
    id_me: number | null;
    tieu_su: string | null;
    anh_dai_dien: string | null;
    vo_chong_ids?: number[];
}

interface FamilyNode {
    id: string;
    members: Nguoi[];
    children: FamilyNode[];
    childIds: Set<number>;
}

const getSpouseId = (person: Nguoi, peopleById: Map<number, Nguoi>) => {
    return (person.vo_chong_ids || []).find((id) => peopleById.has(id)) || null;
};

const sortMembers = (members: Nguoi[]) => {
    return [...members].sort((a, b) => {
        if (a.gioi_tinh !== b.gioi_tinh) {
            return a.gioi_tinh === 'nam' ? -1 : 1;
        }
        return a.id - b.id;
    });
};

const buildFamilyTree = (people: Nguoi[]) => {
    const peopleById = new Map(people.map((person) => [person.id, person]));
    const familyByKey = new Map<string, FamilyNode>();
    const personFamilyKey = new Map<number, string>();

    const ensureFamily = (key: string, members: Nguoi[]) => {
        const existing = familyByKey.get(key);
        if (existing) return existing;

        const family: FamilyNode = {
            id: key,
            members: sortMembers(members),
            children: [],
            childIds: new Set<number>(),
        };

        familyByKey.set(key, family);
        family.members.forEach((member) => personFamilyKey.set(member.id, key));
        return family;
    };

    people.forEach((person) => {
        if (personFamilyKey.has(person.id)) return;
        const spouseId = getSpouseId(person, peopleById);
        const spouse = spouseId ? peopleById.get(spouseId) : null;

        if (spouse && !personFamilyKey.has(spouse.id)) {
            const ids = [person.id, spouse.id].sort((a, b) => a - b);
            ensureFamily(`couple-${ids[0]}-${ids[1]}`, [person, spouse]);
            return;
        }

        ensureFamily(`single-${person.id}`, [person]);
    });

    const getFamilyForPerson = (person: Nguoi) => {
        const key = personFamilyKey.get(person.id);
        if (key) return familyByKey.get(key)!;
        return ensureFamily(`single-${person.id}`, [person]);
    };

    const childFamilyKeys = new Set<string>();

    people.forEach((person) => {
        const father = person.id_cha ? peopleById.get(person.id_cha) : null;
        const mother = person.id_me ? peopleById.get(person.id_me) : null;

        if (!father && !mother) return;

        const childFamily = getFamilyForPerson(person);
        const fatherFamilyKey = father ? personFamilyKey.get(father.id) : null;
        const motherFamilyKey = mother ? personFamilyKey.get(mother.id) : null;
        const parentMembers = [father, mother].filter(Boolean) as Nguoi[];
        const parentFamily =
            fatherFamilyKey && fatherFamilyKey === motherFamilyKey
                ? familyByKey.get(fatherFamilyKey)!
                : parentMembers.length === 1
                  ? getFamilyForPerson(parentMembers[0])
                  : ensureFamily(
                        `parents-${parentMembers
                            .map((item) => item.id)
                            .sort((a, b) => a - b)
                            .join('-')}`,
                        parentMembers,
                    );

        if (parentFamily.id !== childFamily.id && !parentFamily.childIds.has(childFamily.members[0].id)) {
            parentFamily.children.push(childFamily);
            parentFamily.childIds.add(childFamily.members[0].id);
            childFamilyKeys.add(childFamily.id);
        }
    });

    return [...familyByKey.values()]
        .filter((family) => !childFamilyKeys.has(family.id))
        .sort((a, b) => a.members[0].id - b.members[0].id);
};

const formatYear = (date: string | null) => {
    if (!date) return null;
    return date.substring(0, 4);
};

const PersonMiniCard = ({ person, searchTerm }: { person: Nguoi; searchTerm: string }) => {
    const isMale = person.gioi_tinh === 'nam';
    const isDead = Boolean(person.da_mat);
    const isHighlighted = searchTerm && person.ten_day_du.toLowerCase().includes(searchTerm.toLowerCase());

    const birthYear = formatYear(person.ngay_sinh);
    const deathYear = formatYear(person.ngay_mat);

    return (
        <div
            onClick={() => router.visit(`/gia-pha/thanh-vien/${person.id}`)}
            className="group relative flex w-28 cursor-pointer flex-col items-center gap-1.5 rounded-xl px-2 py-2 text-center transition-all duration-200 hover:bg-white/60"
            style={
                isHighlighted
                    ? { outline: '2px solid #10b981', outlineOffset: '2px', borderRadius: '12px', background: 'rgba(245,147,33,0.08)' }
                    : {}
            }
        >
            {/* Avatar */}
            <div
                className="relative flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white shadow-md ring-2 ring-white transition-transform duration-200 group-hover:scale-105"
                style={{
                    background: isMale
                        ? 'linear-gradient(135deg, #0ea5e9, #3b82f6)'
                        : 'linear-gradient(135deg, #f43f5e, #ec4899)',
                    opacity: isDead ? 0.75 : 1,
                }}
            >
                {person.anh_dai_dien ? (
                    <img
                        src={person.anh_dai_dien}
                        alt={person.ten_day_du}
                        className="h-full w-full rounded-full object-cover"
                        style={{ opacity: isDead ? 0.75 : 1 }}
                    />
                ) : (
                    person.ten_day_du.charAt(0).toUpperCase()
                )}
                {isDead && (
                    <div className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-500 text-white ring-2 ring-white">
                        <span className="text-[8px] font-bold">✝</span>
                    </div>
                )}
            </div>

            {/* Name */}
            <div
                className="line-clamp-2 min-h-8 w-full text-xs font-bold leading-tight text-gray-800 transition-colors group-hover:text-emerald-700"
                title={person.ten_day_du}
            >
                {person.ten_day_du}
            </div>

            {/* Years */}
            {(birthYear || deathYear) && (
                <div className="text-[10px] font-medium text-gray-400">
                    {birthYear || '?'}{isDead ? ` – ${deathYear || '?'}` : ''}
                </div>
            )}
        </div>
    );
};

const FamilyCard = ({ family, level, searchTerm }: { family: FamilyNode; level: number; searchTerm: string }) => {
    const hasChildren = family.children.length > 0;
    const isCouple = family.members.length > 1;

    return (
        <div className="flex flex-col items-center">
            {/* Card */}
            <div
                className="relative z-10 rounded-2xl border border-white/80 bg-white/70 px-3 py-3 shadow-lg backdrop-blur-sm transition-shadow hover:shadow-xl"
                style={{ minWidth: isCouple ? '220px' : '120px' }}
            >
                {/* Generation badge */}
                <div
                    className="absolute -top-3.5 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-md"
                    style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                >
                    {level}
                </div>

                <div className="flex items-start justify-center gap-1">
                    {family.members.map((member, index) => (
                        <div key={member.id} className="flex items-center">
                            <PersonMiniCard person={member} searchTerm={searchTerm} />
                            {index < family.members.length - 1 && (
                                <div className="mx-1 flex h-20 flex-col items-center justify-center">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-center text-sm font-bold text-rose-500 shadow-sm ring-1 ring-rose-100">
                                        ♥
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Connector line */}
            <div className="h-8 w-0.5 bg-gradient-to-b from-gray-300 to-gray-200" />

            {hasChildren && (
                <>
                    <div className="flex justify-center">
                        {family.children.map((child, index) => {
                            const isOnly = family.children.length === 1;
                            const isFirst = index === 0;
                            const isLast = index === family.children.length - 1;

                            return (
                                <div key={child.id} className="relative flex flex-col items-center px-6">
                                    {!isOnly && (
                                        <>
                                            {!isFirst && <div className="absolute left-0 top-0 h-0.5 w-1/2 bg-gray-300" />}
                                            {!isLast && <div className="absolute right-0 top-0 h-0.5 w-1/2 bg-gray-300" />}
                                        </>
                                    )}
                                    <div className="h-8 w-0.5 bg-gray-300" />
                                    <FamilyCard family={child} level={level + 1} searchTerm={searchTerm} />
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

const RootCard = ({ count }: { count: number }) => (
    <div className="flex flex-col items-center">
        <div
            className="rounded-2xl px-6 py-3 text-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
        >
            <div className="text-xs font-bold uppercase tracking-widest text-white/80">Gốc gia phả</div>
            <div className="mt-0.5 text-sm font-bold text-white">{count} nhánh đầu tiên</div>
        </div>
        <div className="h-9 w-0.5 bg-gradient-to-b from-emerald-300 to-gray-300" />
    </div>
);

export default function CayGiaPha() {
    const [people, setPeople] = useState<Nguoi[]>([]);
    const [dongHos, setDongHos] = useState<DongHo[]>([]);
    const [selectedDongHo, setSelectedDongHo] = useState('');
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(0.9);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const treeData = useMemo(() => buildFamilyTree(people), [people]);
    const selectedDongHoName = dongHos.find((d) => String(d.id) === selectedDongHo)?.ten_dong_ho;

    // Fetch dong ho list once
    useEffect(() => {
        dongHoApi.list().then((res) => setDongHos(res.data || []));
    }, []);

    // Fetch members when dong ho filter changes
    useEffect(() => {
        setLoading(true);
        axios
            .get('/api/nguoi/list', { params: selectedDongHo ? { id_dong_ho: selectedDongHo } : undefined })
            .then((res) => {
                if (res.data.success) setPeople(res.data.data || []);
            })
            .catch((err) => console.error('Lỗi khi tải dữ liệu cây gia phả:', err))
            .finally(() => setLoading(false));
    }, [selectedDongHo]);

    const handleZoomIn = () => setZoom((v) => Math.min(v + 0.1, 2.0));
    const handleZoomOut = () => setZoom((v) => Math.max(v - 0.1, 0.3));
    const handleZoomReset = () => setZoom(0.9);

    return (
        <AuthenticatedLayout>
            <Head title="Sơ đồ cây gia phả" />
            <div className="mx-auto flex h-full max-w-full flex-col gap-5">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Sơ đồ cây gia phả</h2>
                        {selectedDongHoName && (
                            <div className="mt-1 flex items-center gap-2">
                                <button type="button" onClick={() => router.visit('/gia-pha/dashboard')} className="text-xs text-gray-400 hover:text-emerald-600">← Danh sách gia tộc</button>
                                <span className="text-xs text-gray-300">/</span>
                                <span className="text-xs font-semibold text-emerald-600">{selectedDongHoName}</span>
                            </div>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-full" style={{ background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)' }} />
                                Nam
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-full" style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)' }} />
                                Nữ
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="font-bold text-rose-400">♥</span>
                                Vợ chồng
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gray-400 text-[8px] text-white">✝</span>
                                Đã mất
                            </span>
                            <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                                {people.length} thành viên
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Clan selector */}
                        <select
                            value={selectedDongHo}
                            onChange={(e) => { setSelectedDongHo(e.target.value); setSearchTerm(''); }}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        >
                            <option value="">Tất cả gia tộc</option>
                            {dongHos.map((d) => (
                                <option key={d.id} value={d.id}>{d.ten_dong_ho}</option>
                            ))}
                        </select>

                        {/* Search */}
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Tìm thành viên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                        </div>

                        {/* Zoom controls */}
                        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                            <button
                                type="button"
                                onClick={handleZoomOut}
                                title="Thu nhỏ"
                                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                                disabled={zoom <= 0.3}
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                            </button>

                            <button
                                type="button"
                                onClick={handleZoomReset}
                                className="min-w-[52px] rounded-md px-2 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100"
                            >
                                {Math.round(zoom * 100)}%
                            </button>

                            <button
                                type="button"
                                onClick={handleZoomIn}
                                title="Phóng to"
                                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                                disabled={zoom >= 2.0}
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tree Canvas */}
                <div
                    ref={containerRef}
                    className="relative min-h-[680px] flex-1 overflow-auto rounded-2xl border border-gray-200 shadow-inner"
                    style={{
                        background: 'radial-gradient(circle at 50% 0%, #ecfdf5 0%, #f8fafc 60%, #f1f5f9 100%)',
                    }}
                >
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                            <div
                                className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200"
                                style={{ borderTopColor: '#059669' }}
                            />
                            <span className="text-sm font-semibold text-gray-500">Đang tải dữ liệu...</span>
                        </div>
                    ) : treeData.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="rounded-2xl bg-white px-10 py-8 text-center shadow-lg">
                                <div className="mb-3 text-4xl">🌳</div>
                                <h3 className="text-lg font-bold text-gray-700">Chưa có dữ liệu</h3>
                                <p className="mt-1 text-sm text-gray-500">Hãy thêm thành viên để hiển thị sơ đồ.</p>
                                <button
                                    type="button"
                                    onClick={() => router.visit('/gia-pha/dashboard')}
                                    className="mt-4 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow"
                                    style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                                >
                                    Chọn gia tộc
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex w-max min-w-full justify-center p-10">
                            <div
                                className="origin-top transition-transform duration-200"
                                style={{ transform: `scale(${zoom})` }}
                            >
                                <RootCard count={treeData.length} />
                                <div className="flex justify-center gap-12">
                                    {treeData.map((rootNode) => (
                                        <FamilyCard key={rootNode.id} family={rootNode} level={1} searchTerm={searchTerm} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
