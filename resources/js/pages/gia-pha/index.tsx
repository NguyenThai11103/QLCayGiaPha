import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/gia-pha/Icon';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import { DongHo, dongHoApi, Nguoi, nguoiApi } from '../../services/gia-pha.api';

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
        if (a.gioi_tinh !== b.gioi_tinh) return a.gioi_tinh === 'nam' ? -1 : 1;
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

const formatYear = (date: string | null) => (date ? date.substring(0, 4) : null);

const getDepth = (nodes: FamilyNode[]): number => {
    if (!nodes.length) return 0;
    return Math.max(...nodes.map((node) => 1 + getDepth(node.children)));
};

export default function CayGiaPha() {
    const [people, setPeople] = useState<Nguoi[]>([]);
    const [dongHos, setDongHos] = useState<DongHo[]>([]);
    const [selectedDongHo, setSelectedDongHo] = useState('');
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(0.72);
    const [searchTerm, setSearchTerm] = useState('');
    const [bloodlineOnly, setBloodlineOnly] = useState(true);
    const [selectedPerson, setSelectedPerson] = useState<Nguoi | null>(null);

    useEffect(() => {
        dongHoApi.list().then((res) => setDongHos(res.data || []));
    }, []);

    useEffect(() => {
        setLoading(true);
        nguoiApi
            .list(selectedDongHo || undefined)
            .then((res) => {
                const nextPeople = res.data || [];
                setPeople(nextPeople);
                setSelectedPerson((current) => (current && nextPeople.some((item) => item.id === current.id) ? current : null));
            })
            .finally(() => setLoading(false));
    }, [selectedDongHo]);

    const treeData = useMemo(() => buildFamilyTree(people), [people]);
    const selectedDongHoName = dongHos.find((d) => String(d.id) === selectedDongHo)?.ten_dong_ho;
    const depth = getDepth(treeData);
    const deceased = people.filter((person) => Boolean(person.da_mat)).length;

    const zoomOut = () => setZoom((value) => Math.max(value - 0.08, 0.4));
    const zoomIn = () => setZoom((value) => Math.min(value + 0.08, 1.4));
    const fit = () => setZoom(0.72);

    return (
        <AuthenticatedLayout fullBleed>
            <Head title="Cây Gia Phả" />
            <div className="flex min-h-[calc(100vh-64px)] flex-col bg-[var(--bg)]">
                <div className="flex min-h-16 flex-col gap-3 border-b border-[var(--line)] bg-[var(--bg-elev)] px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-7">
                    <div className="min-w-0">
                        <div className="gp-eyebrow">{selectedDongHoName || 'Toàn bộ dòng họ'}</div>
                        <h1 className="font-serif text-[clamp(28px,4vw,36px)] font-semibold leading-tight">
                            Toàn cây · {depth || 1} đời · {people.length} thành viên
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={selectedDongHo}
                            onChange={(e) => {
                                setSelectedDongHo(e.target.value);
                                setSearchTerm('');
                            }}
                            className="gp-input min-h-[38px] min-w-[190px] py-2 text-[13px]"
                        >
                            <option value="">Tất cả gia tộc</option>
                            {dongHos.map((dongHo) => (
                                <option key={dongHo.id} value={dongHo.id}>
                                    {dongHo.ten_dong_ho}
                                </option>
                            ))}
                        </select>

                        <label className="relative">
                            <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-mute)]" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="gp-input w-[220px] py-2 pl-9 text-[13px]"
                                placeholder="Tìm thành viên..."
                            />
                        </label>

                        <div className="flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--card-soft)] p-1">
                            <button type="button" onClick={zoomOut} disabled={zoom <= 0.4} className="grid h-8 w-8 place-items-center rounded-md text-[var(--ink-soft)] hover:bg-[var(--card)] disabled:opacity-40">
                                <Icon name="minus" size={15} />
                            </button>
                            <button type="button" onClick={fit} className="min-w-14 rounded-md px-2 text-[12px] font-bold text-[var(--ink-soft)] hover:bg-[var(--card)]">
                                {Math.round(zoom * 100)}%
                            </button>
                            <button type="button" onClick={zoomIn} disabled={zoom >= 1.4} className="grid h-8 w-8 place-items-center rounded-md text-[var(--ink-soft)] hover:bg-[var(--card)] disabled:opacity-40">
                                <Icon name="plus" size={15} />
                            </button>
                            <span className="mx-1 h-5 w-px bg-[var(--line)]" />
                            <button type="button" onClick={fit} className="grid h-8 w-8 place-items-center rounded-md text-[var(--ink-soft)] hover:bg-[var(--card)]">
                                <Icon name="fit" size={15} />
                            </button>
                        </div>

                        <button type="button" onClick={() => setBloodlineOnly((value) => !value)} className={`gp-btn ${bloodlineOnly ? 'gp-btn-jade' : 'gp-btn-ghost'}`}>
                            <Icon name="branch" size={16} />
                            Huyết thống
                        </button>
                        <button type="button" onClick={() => router.visit('/gia-pha/thanh-vien')} className="gp-btn gp-btn-primary">
                            <Icon name="plus" size={16} />
                            Thêm
                        </button>
                    </div>
                </div>

                <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_360px]">
                    <section className="dot-grid relative min-h-[680px] overflow-auto bg-[var(--bg)]">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(250,241,212,0.8),transparent_48%)]" />
                        {loading ? (
                            <div className="absolute inset-0 grid place-items-center">
                                <div className="text-center">
                                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--gold-pale)] border-t-[var(--gold)]" />
                                    <div className="mt-3 text-sm font-semibold text-[var(--ink-mute)]">Đang tải dữ liệu cây gia phả...</div>
                                </div>
                            </div>
                        ) : treeData.length === 0 ? (
                            <div className="absolute inset-0 grid place-items-center p-6">
                                <div className="gp-card max-w-md p-8 text-center">
                                    <Icon name="tree" size={36} className="mx-auto text-[var(--gold)]" />
                                    <h2 className="mt-4 font-serif text-3xl font-semibold">Chưa có dữ liệu</h2>
                                    <p className="mt-2 text-sm leading-6 text-[var(--ink-mute)]">Hãy thêm thành viên đầu tiên để hiển thị sơ đồ gia phả.</p>
                                    <button type="button" onClick={() => router.visit('/gia-pha/thanh-vien')} className="gp-btn gp-btn-primary mt-5">Thêm thành viên</button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative flex w-max min-w-full justify-center p-10">
                                <div className="origin-top transition-transform duration-200" style={{ transform: `scale(${zoom})` }}>
                                    <RootCard roots={treeData.length} />
                                    <div className="flex justify-center gap-12">
                                        {treeData.map((rootNode) => (
                                            <FamilyCard
                                                key={rootNode.id}
                                                family={rootNode}
                                                level={1}
                                                searchTerm={searchTerm}
                                                bloodlineOnly={bloodlineOnly}
                                                selectedPerson={selectedPerson}
                                                onSelect={setSelectedPerson}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    <aside className="border-l border-[var(--line)] bg-[var(--bg-elev)] p-5">
                        <div className="mb-5 grid grid-cols-3 gap-2">
                            <Metric label="Thành viên" value={people.length} />
                            <Metric label="Còn sống" value={people.length - deceased} />
                            <Metric label="Đã mất" value={deceased} />
                        </div>

                        {selectedPerson ? (
                            <PersonPanel person={selectedPerson} people={people} onClose={() => setSelectedPerson(null)} />
                        ) : (
                            <div className="gp-card bg-[linear-gradient(145deg,var(--card),var(--gold-glow)_180%)] p-5">
                                <span className="gp-chip gp-chip-gold"><Icon name="tree" size={12} />Chi tiết</span>
                                <h2 className="mt-4 font-serif text-[28px] font-semibold leading-tight">Chọn một thành viên trên cây</h2>
                                <p className="mt-2 text-[13px] leading-6 text-[var(--ink-soft)]">
                                    Panel này hiển thị quan hệ cha mẹ, phối ngẫu, năm sinh mất và thao tác xem hồ sơ chi tiết.
                                </p>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function RootCard({ roots }: { roots: number }) {
    return (
        <div className="flex flex-col items-center">
            <div className="rounded-[14px] bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] px-6 py-3 text-center text-white shadow-[var(--shadow-gold)]">
                <div className="text-[10px] font-bold uppercase tracking-[1.8px] text-white/75">Gốc gia phả</div>
                <div className="mt-0.5 text-sm font-bold">{roots} nhánh đầu tiên</div>
            </div>
            <div className="h-9 w-px bg-gradient-to-b from-[var(--gold)] to-[var(--line)]" />
        </div>
    );
}

function FamilyCard({
    family,
    level,
    searchTerm,
    bloodlineOnly,
    selectedPerson,
    onSelect,
}: {
    family: FamilyNode;
    level: number;
    searchTerm: string;
    bloodlineOnly: boolean;
    selectedPerson: Nguoi | null;
    onSelect: (person: Nguoi) => void;
}) {
    const hasChildren = family.children.length > 0;
    const isCouple = family.members.length > 1;

    return (
        <div className="flex flex-col items-center">
            <div
                className="relative z-10 rounded-[14px] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-3 shadow-[var(--shadow-md)] backdrop-blur"
                style={{ minWidth: isCouple ? 236 : 132 }}
            >
                <div className="absolute -top-3 left-1/2 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full border-2 border-[var(--card)] bg-[var(--gold)] text-xs font-bold text-white shadow">
                    {level}
                </div>

                <div className="flex items-start justify-center gap-1">
                    {family.members.map((member, index) => (
                        <div key={member.id} className="flex items-center">
                            <PersonMiniCard person={member} searchTerm={searchTerm} selected={selectedPerson?.id === member.id} onSelect={onSelect} />
                            {index < family.members.length - 1 && (
                                <div className="mx-1 flex h-20 flex-col items-center justify-center">
                                    <div className="grid h-7 w-7 place-items-center rounded-full border border-[color-mix(in_srgb,var(--terracotta)_20%,transparent)] bg-[color-mix(in_srgb,var(--terracotta)_10%,transparent)] text-[var(--terracotta)]">
                                        <Icon name="heart" size={14} />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className={`h-8 w-px ${bloodlineOnly ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`} />

            {hasChildren && (
                <div className="flex justify-center">
                    {family.children.map((child, index) => {
                        const isOnly = family.children.length === 1;
                        const isFirst = index === 0;
                        const isLast = index === family.children.length - 1;
                        return (
                            <div key={child.id} className="relative flex flex-col items-center px-6">
                                {!isOnly && (
                                    <>
                                        {!isFirst && <div className={`absolute left-0 top-0 h-px w-1/2 ${bloodlineOnly ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`} />}
                                        {!isLast && <div className={`absolute right-0 top-0 h-px w-1/2 ${bloodlineOnly ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`} />}
                                    </>
                                )}
                                <div className={`h-8 w-px ${bloodlineOnly ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`} />
                                <FamilyCard family={child} level={level + 1} searchTerm={searchTerm} bloodlineOnly={bloodlineOnly} selectedPerson={selectedPerson} onSelect={onSelect} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function PersonMiniCard({ person, searchTerm, selected, onSelect }: { person: Nguoi; searchTerm: string; selected: boolean; onSelect: (person: Nguoi) => void }) {
    const isMale = person.gioi_tinh === 'nam';
    const isDead = Boolean(person.da_mat);
    const birthYear = formatYear(person.ngay_sinh);
    const deathYear = formatYear(person.ngay_mat);
    const isHighlighted = Boolean(searchTerm && person.ten_day_du.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <button
            type="button"
            onClick={() => onSelect(person)}
            className="group relative flex w-28 flex-col items-center gap-1.5 rounded-xl px-2 py-2 text-center transition hover:bg-[var(--card-soft)]"
            style={selected || isHighlighted ? { outline: `2px solid ${selected ? 'var(--gold)' : 'var(--jade)'}`, outlineOffset: '2px' } : undefined}
        >
            <span
                className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-full text-lg font-bold text-white shadow-md ring-2 ring-[var(--card)] transition group-hover:scale-105"
                style={{
                    background: isMale ? 'linear-gradient(135deg,var(--jade),var(--jade-soft))' : 'linear-gradient(135deg,var(--terracotta),var(--crimson))',
                    opacity: isDead ? 0.78 : 1,
                }}
            >
                {person.anh_dai_dien ? <img src={person.anh_dai_dien} alt={person.ten_day_du} className="h-full w-full object-cover" /> : person.ten_day_du.charAt(0).toUpperCase()}
                {isDead && <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-[var(--deceased)] text-[9px] ring-2 ring-[var(--card)]">†</span>}
            </span>
            <span className="line-clamp-2 min-h-8 w-full text-xs font-bold leading-tight text-[var(--ink)] group-hover:text-[var(--gold)]">{person.ten_day_du}</span>
            {(birthYear || deathYear) && (
                <span className="text-[10px] font-medium text-[var(--ink-mute)]">
                    {birthYear || '?'}{isDead ? ` - ${deathYear || '?'}` : ''}
                </span>
            )}
        </button>
    );
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div className="gp-card p-3 text-center">
            <div className="font-serif text-[26px] font-semibold leading-none">{value}</div>
            <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-[1px] text-[var(--ink-mute)]">{label}</div>
        </div>
    );
}

function PersonPanel({ person, people, onClose }: { person: Nguoi; people: Nguoi[]; onClose: () => void }) {
    const father = person.id_cha ? people.find((item) => item.id === person.id_cha) : undefined;
    const mother = person.id_me ? people.find((item) => item.id === person.id_me) : undefined;
    const spouses = (person.vo_chong_ids || []).map((id) => people.find((item) => item.id === id)).filter(Boolean) as Nguoi[];
    const children = people.filter((item) => item.id_cha === person.id || item.id_me === person.id);

    return (
        <div className="gp-card overflow-hidden">
            <div className="bg-pattern bg-[var(--gold-glow)] p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] font-serif text-2xl font-semibold text-white shadow-[var(--shadow-gold)]">
                            {person.anh_dai_dien ? <img src={person.anh_dai_dien} alt={person.ten_day_du} className="h-full w-full object-cover" /> : person.ten_day_du.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="gp-eyebrow">{person.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'} · {Boolean(person.da_mat) ? 'Đã mất' : 'Còn sống'}</div>
                            <h2 className="font-serif text-[27px] font-semibold leading-tight">{person.ten_day_du}</h2>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--ink-soft)] hover:bg-[var(--card)]">
                        <Icon name="x" size={17} />
                    </button>
                </div>
            </div>
            <div className="space-y-5 p-5">
                <div className="grid grid-cols-2 gap-3">
                    <Info label="Sinh" value={person.ngay_sinh || 'Chưa rõ'} />
                    <Info label="Mất" value={person.ngay_mat || (Boolean(person.da_mat) ? 'Chưa rõ' : 'Còn sống')} />
                </div>
                <Info label="Cha" value={father?.ten_day_du || 'Chưa liên kết'} />
                <Info label="Mẹ" value={mother?.ten_day_du || 'Chưa liên kết'} />
                <Info label="Phối ngẫu" value={spouses.length ? spouses.map((item) => item.ten_day_du).join(', ') : 'Chưa liên kết'} />
                <Info label="Con" value={children.length ? `${children.length} người con` : 'Chưa có dữ liệu'} />
                {person.tieu_su && (
                    <div>
                        <div className="mb-1 text-[10.5px] font-bold uppercase tracking-[1.3px] text-[var(--ink-mute)]">Tiểu sử</div>
                        <p className="text-[13px] leading-6 text-[var(--ink-soft)]">{person.tieu_su}</p>
                    </div>
                )}
                <button type="button" onClick={() => router.visit(`/gia-pha/thanh-vien/${person.id}`)} className="gp-btn gp-btn-primary w-full">
                    Xem hồ sơ chi tiết
                    <Icon name="arrow-right" size={15} />
                </button>
            </div>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="mb-1 text-[10.5px] font-bold uppercase tracking-[1.3px] text-[var(--ink-mute)]">{label}</div>
            <div className="text-[13px] font-semibold leading-5 text-[var(--ink)]">{value}</div>
        </div>
    );
}
