import { Head, router } from '@inertiajs/react';
import { FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../../components/gia-pha/Icon';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import toast from '../../../lib/toast.util';
import { DongHo, dongHoApi, Nguoi, nguoiApi, NguoiPayload } from '../../../services/gia-pha.api';
import { useAuth } from '../../../contexts/auth.context';

type FormState = {
    id?: number;
    id_dong_ho: string;
    ten_day_du: string;
    gioi_tinh: 'nam' | 'nu';
    ngay_sinh: string;
    ngay_mat: string;
    da_mat: boolean;
    id_cha: string;
    id_me: string;
    id_vo_chong_list: string[];
    tieu_su: string;
    anh_dai_dien: string;
    thu_tu_sinh: string;
};

const emptyForm: FormState = {
    id_dong_ho: '',
    ten_day_du: '',
    gioi_tinh: 'nam',
    ngay_sinh: '',
    ngay_mat: '',
    da_mat: false,
    id_cha: '',
    id_me: '',
    id_vo_chong_list: [],
    tieu_su: '',
    anh_dai_dien: '',
    thu_tu_sinh: '',
};

const toNullableNumber = (value: string) => (value ? Number(value) : null);
const toNullableString = (value: string) => (value.trim() ? value.trim() : null);

const getMemberById = (members: Nguoi[], id: string | number | null) => {
    if (!id) {
        return undefined;
    }
    return members.find((member) => member.id === Number(id));
};

const isAncestorOf = (members: Nguoi[], possibleAncestorId: string | number | null, memberId: string | number | null) => {
    if (!possibleAncestorId || !memberId) {
        return false;
    }

    const ancestorId = Number(possibleAncestorId);
    const visited = new Set<number>();
    const queue = [Number(memberId)];

    while (queue.length > 0) {
        const currentId = queue.shift();
        const current = getMemberById(members, currentId || null);

        if (!current) {
            continue;
        }

        if (visited.has(current.id)) {
            continue;
        }

        visited.add(current.id);

        if (current.id_cha === ancestorId || current.id_me === ancestorId) {
            return true;
        }

        if (current.id_cha) {
            queue.push(current.id_cha);
        }

        if (current.id_me) {
            queue.push(current.id_me);
        }
    }

    return false;
};

const canBeParentPair = (members: Nguoi[], fatherId: string, motherId: string) => {
    if (!fatherId || !motherId) {
        return true;
    }
    return !isAncestorOf(members, fatherId, motherId) && !isAncestorOf(members, motherId, fatherId);
};

const canSelectAsParent = (members: Nguoi[], candidate: Nguoi, form: FormState, otherParentId: string) => {
    if (candidate.id === form.id) {
        return false;
    }

    if (form.id_dong_ho && String(candidate.id_dong_ho) !== form.id_dong_ho) {
        return false;
    }

    if (form.id && isAncestorOf(members, form.id, candidate.id)) {
        return false;
    }

    return canBeParentPair(members, String(candidate.id), otherParentId);
};

const canSelectAsSpouse = (members: Nguoi[], candidate: Nguoi, form: FormState) => {
    if (candidate.id === form.id) {
        return false;
    }

    if (candidate.gioi_tinh === form.gioi_tinh) {
        return false;
    }
    if (form.id && (isAncestorOf(members, form.id, candidate.id) || isAncestorOf(members, candidate.id, form.id))) {
        return false;
    }

    return true;
};

const findSpouseIdFromChildren = (members: Nguoi[], parentId: string, spouseKey: 'id_cha' | 'id_me') => {
    if (!parentId) {
        return '';
    }

    const parentIdNumber = Number(parentId);
    const child = members.find((member) => {
        const hasSelectedParent = member.id_cha === parentIdNumber || member.id_me === parentIdNumber;
        const spouseId = member[spouseKey];
        return hasSelectedParent && spouseId && spouseId !== parentIdNumber && canBeParentPair(members, parentId, String(spouseId));
    });

    return child?.[spouseKey] ? String(child[spouseKey]) : '';
};

const buildPayload = (form: FormState, isDauRe: boolean): NguoiPayload => ({
    id_dong_ho: Number(form.id_dong_ho),
    ten_day_du: form.ten_day_du.trim(),
    gioi_tinh: form.gioi_tinh,
    ngay_sinh: toNullableString(form.ngay_sinh),
    da_mat: form.da_mat,
    ngay_mat: form.da_mat ? toNullableString(form.ngay_mat) : null,
    id_cha: isDauRe ? null : toNullableNumber(form.id_cha),
    id_me: isDauRe ? null : toNullableNumber(form.id_me),
    id_vo_chong_list: isDauRe ? form.id_vo_chong_list.map(id => Number(id)).filter(id => !isNaN(id)) : [],
    tieu_su: toNullableString(form.tieu_su),
    anh_dai_dien: toNullableString(form.anh_dai_dien),
    thu_tu_sinh: isDauRe ? null : toNullableNumber(form.thu_tu_sinh),
});

interface FamilyNode {
    id: string;
    member: Nguoi;
    spouses: Nguoi[];
    children: FamilyNode[];
}

const buildFamilyTree = (people: Nguoi[], selectedDongHo: string) => {
    const peopleById = new Map(people.map((person) => [person.id, person]));
    
    // Lọc tất cả thành viên thuộc dòng họ được chọn (nếu có)
    const bloodlinePeople = people.filter(p => !selectedDongHo || String(p.id_dong_ho) === selectedDongHo);
    const bloodlineIds = new Set(bloodlinePeople.map(p => p.id));
    
    const getSpouses = (person: Nguoi): Nguoi[] => {
        const spouseIds = person.vo_chong_ids || [];
        return spouseIds
            .map(id => peopleById.get(id))
            .filter((p): p is Nguoi => !!p);
    };

    const buildNode = (member: Nguoi, visited = new Set<number>()): FamilyNode => {
        visited.add(member.id);
        
        // Tìm các con trực hệ
        const childrenMembers = bloodlinePeople.filter(p => 
            (p.id_cha === member.id || p.id_me === member.id) && !visited.has(p.id)
        );
        
        // Sắp xếp con theo thứ tự sinh
        childrenMembers.sort((a, b) => {
            const orderA = a.thu_tu_sinh ? Number(a.thu_tu_sinh) : 999;
            const orderB = b.thu_tu_sinh ? Number(b.thu_tu_sinh) : 999;
            return orderA - orderB;
        });

        return {
            id: `node-${member.id}`,
            member,
            spouses: getSpouses(member),
            children: childrenMembers.map(child => buildNode(child, new Set(visited))),
        };
    };

    // Tìm các cụ tổ (Root): Thành viên gốc không có cha/mẹ trong danh sách bloodline
    const rootMembers = bloodlinePeople.filter(p => {
        const hasFatherInBloodline = p.id_cha && bloodlineIds.has(p.id_cha);
        const hasMotherInBloodline = p.id_me && bloodlineIds.has(p.id_me);
        
        if (hasFatherInBloodline || hasMotherInBloodline) {
            return false;
        }
        
        // Không coi là Root nếu họ là phối ngẫu của một thành viên khác trong bloodline
        const isSpouseOfOtherBloodline = people.some(other => {
            if (!bloodlineIds.has(other.id) || other.id === p.id) {
                return false;
            }
            const isSpouse = (other.vo_chong_ids || []).includes(p.id);
            if (!isSpouse) return false;
            
            // Trường hợp 1: Nếu 'other' (vợ/chồng của p) có cha hoặc mẹ trong dòng họ chính,
            // điều này chứng tỏ 'other' mới là người thuộc huyết thống trực hệ của dòng họ này,
            // còn 'p' chỉ là dâu/rể cưới vào -> 'p' tuyệt đối không làm Root!
            const otherHasFather = other.id_cha && bloodlineIds.has(other.id_cha);
            const otherHasMother = other.id_me && bloodlineIds.has(other.id_me);
            if (otherHasFather || otherHasMother) {
                return true;
            }
            
            // Trường hợp 2: Nếu cả hai vợ chồng đều không có cha mẹ trong dòng họ chính (ví dụ cặp đôi cụ tổ khai sáng dòng họ),
            // ta chỉ giữ lại một người làm Root để đại diện cho cả gia tộc.
            // Ưu tiên chọn người Nam (Chồng) làm Root theo truyền thống tông tộc, người Nữ (Vợ) làm phối ngẫu đi kèm.
            if (other.gioi_tinh === 'nam' && p.gioi_tinh === 'nu') {
                return true;
            }
            // Nếu cùng giới tính hoặc không xác định, người có ID nhỏ hơn làm root
            if (other.gioi_tinh === p.gioi_tinh && other.id < p.id) {
                return true;
            }
            
            return false;
        });
        
        if (isSpouseOfOtherBloodline) {
            return false;
        }
        
        return true;
    });

    // Hàm đệ quy đếm số lượng con cháu của một thành viên
    const countDescendants = (memberId: number, visited = new Set<number>()): number => {
        if (visited.has(memberId)) return 0;
        visited.add(memberId);
        
        const children = bloodlinePeople.filter(p => p.id_cha === memberId || p.id_me === memberId);
        let count = children.length;
        for (const child of children) {
            count += countDescendants(child.id, visited);
        }
        return count;
    };

    // Sắp xếp các root theo số lượng con cháu giảm dần, nếu bằng nhau thì ID nhỏ hơn xếp trước
    rootMembers.sort((a, b) => {
        const countA = countDescendants(a.id);
        const countB = countDescendants(b.id);
        if (countB !== countA) {
            return countB - countA;
        }
        return a.id - b.id;
    });

    // Chỉ lấy 1 Root chính duy nhất có quy mô lớn nhất để hiển thị đúng 1 cây gia phả
    const primaryRoots = rootMembers.slice(0, 1);

    return primaryRoots.map(root => buildNode(root));
};

const formatYear = (date: string | null) => (date ? date.substring(0, 4) : null);

const getDepth = (nodes: FamilyNode[]): number => {
    if (!nodes.length) return 0;
    return Math.max(...nodes.map((node) => 1 + getDepth(node.children)));
};

export default function CayGiaPha() {
    const { user } = useAuth();
    const [people, setPeople] = useState<Nguoi[]>([]);
    const [dongHos, setDongHos] = useState<DongHo[]>([]);
    const [selectedDongHo, setSelectedDongHo] = useState('');
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(0.85);
    const [searchTerm, setSearchTerm] = useState('');
    const [bloodlineOnly, setBloodlineOnly] = useState(true);
    const [selectedPerson, setSelectedPerson] = useState<Nguoi | null>(null);
    const treeViewportRef = useRef<HTMLElement | null>(null);
    const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
    const [isDraggingTree, setIsDraggingTree] = useState(false);

    useEffect(() => {
        dongHoApi.list().then((res) => setDongHos(res.data || []));
    }, []);

    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [isDauRe, setIsDauRe] = useState(false);
    const [quickAddMode, setQuickAddMode] = useState<'none' | 'child' | 'spouse'>('none');
    const [selectedParentId, setSelectedParentId] = useState<string>('');
    const [saving, setSaving] = useState(false);

    const loadData = () => {
        setLoading(true);
        nguoiApi
            .list(selectedDongHo || undefined)
            .then((res) => {
                const nextPeople = res.data || [];
                setPeople(nextPeople);
                setSelectedPerson((current) => {
                    if (current && nextPeople.some((item) => item.id === current.id)) {
                        return nextPeople.find(item => item.id === current.id) || null;
                    }
                    return null;
                });
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, [selectedDongHo]);

    const handleMouseDown = (event: MouseEvent<HTMLElement>) => {
        if (event.button !== 0) {
            return;
        }

        const target = event.target as HTMLElement;
        if (target.closest('button, a, input, select, textarea')) {
            return;
        }

        const viewport = treeViewportRef.current;
        if (!viewport) {
            return;
        }

        setIsDraggingTree(true);
        dragStartRef.current = {
            x: event.clientX,
            y: event.clientY,
            scrollLeft: viewport.scrollLeft,
            scrollTop: viewport.scrollTop,
        };
    };

    const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
        if (!isDraggingTree) {
            return;
        }

        const viewport = treeViewportRef.current;
        if (!viewport) {
            return;
        }

        event.preventDefault();

        const deltaX = event.clientX - dragStartRef.current.x;
        const deltaY = event.clientY - dragStartRef.current.y;
        viewport.scrollLeft = dragStartRef.current.scrollLeft - deltaX;
        viewport.scrollTop = dragStartRef.current.scrollTop - deltaY;
    };

    const handleMouseUp = () => {
        setIsDraggingTree(false);
    };

    const handleAddChildQuick = (parent: Nguoi) => {
        setIsDauRe(false);
        setQuickAddMode('child');
        setSelectedParentId(String(parent.id));

        const isMaleParent = parent.gioi_tinh === 'nam';
        const firstSpouseId = parent.vo_chong_ids && parent.vo_chong_ids.length > 0
            ? String(parent.vo_chong_ids[0])
            : '';

        setForm({
            ...emptyForm,
            id_dong_ho: String(parent.id_dong_ho),
            id_cha: isMaleParent ? String(parent.id) : firstSpouseId,
            id_me: isMaleParent ? firstSpouseId : String(parent.id),
        });
        setFormOpen(true);
    };

    const handleAddSpouseQuick = (spouse: Nguoi) => {
        setIsDauRe(true);
        setQuickAddMode('spouse');
        setSelectedParentId('');
        setForm({
            ...emptyForm,
            id_dong_ho: String(spouse.id_dong_ho),
            gioi_tinh: spouse.gioi_tinh === 'nam' ? 'nu' : 'nam',
            id_vo_chong_list: [String(spouse.id)],
        });
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setForm(emptyForm);
        setIsDauRe(false);
        setQuickAddMode('none');
        setSelectedParentId('');
    };

    const handleParentChange = (field: 'id_cha' | 'id_me', value: string) => {
        setForm((currentForm) => {
            if (field === 'id_cha') {
                const autoMotherId = findSpouseIdFromChildren(people, value, 'id_me');
                const currentMotherId = canBeParentPair(people, value, currentForm.id_me) ? currentForm.id_me : '';

                return {
                    ...currentForm,
                    id_cha: value,
                    id_me: autoMotherId || currentMotherId,
                };
            }

            const autoFatherId = findSpouseIdFromChildren(people, value, 'id_cha');
            const currentFatherId = canBeParentPair(people, currentForm.id_cha, value) ? currentForm.id_cha : '';

            return {
                ...currentForm,
                id_me: value,
                id_cha: autoFatherId || currentFatherId,
            };
        });
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.id_dong_ho) {
            toast.error('Vui lòng chọn dòng họ.');
            return;
        }

        if (!canBeParentPair(people, form.id_cha, form.id_me)) {
            toast.error('Cha và mẹ không được là tổ tiên hoặc con cháu của nhau.');
            return;
        }

        if (form.id_vo_chong_list.length > 0) {
            const invalidSpouse = form.id_vo_chong_list.some(spouseId => {
                const spouse = getMemberById(people, spouseId);
                return spouse && !canSelectAsSpouse(people, spouse, form);
            });
            if (invalidSpouse) {
                toast.error('Có vợ/chồng không hợp lệ.');
                return;
            }
        }

        setSaving(true);
        try {
            const payload = buildPayload(form, isDauRe);
            const result = form.id
                ? await nguoiApi.update({ id: form.id, ...payload })
                : await nguoiApi.create(payload);

            if (result.success) {
                toast.success(result.message || 'Lưu thành công.');
                closeForm();
                loadData();
            } else {
                toast.error(result.message || 'Không thể lưu dữ liệu.');
            }
        } finally {
            setSaving(false);
        }
    };

    const treeData = useMemo(() => buildFamilyTree(people, selectedDongHo), [people, selectedDongHo]);
    const selectedDongHoName = dongHos.find((d) => String(d.id) === selectedDongHo)?.ten_dong_ho;
    const depth = getDepth(treeData);
    const deceased = people.filter((person) => Boolean(person.da_mat)).length;

    const zoomOut = () => setZoom((value) => Math.max(value - 0.08, 0.4));
    const zoomIn = () => setZoom((value) => Math.min(value + 0.08, 1.6));
    const fit = () => setZoom(0.85);

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
                        {user?.quyen_han === 'quan_ly' && (
                            <button type="button" onClick={() => router.visit('/gia-pha/thanh-vien')} className="gp-btn gp-btn-primary">
                                <Icon name="plus" size={16} />
                                Thêm
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_360px]">
                    <section
                        ref={treeViewportRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className="dot-grid relative min-h-[680px] overflow-auto bg-[var(--bg)]"
                        style={{ cursor: isDraggingTree ? 'grabbing' : 'grab', userSelect: isDraggingTree ? 'none' : undefined }}
                    >
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
                                    {user?.quyen_han === 'quan_ly' && (
                                        <button type="button" onClick={() => router.visit('/gia-pha/thanh-vien')} className="gp-btn gp-btn-primary mt-5">Thêm thành viên</button>
                                    )}
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
                            <PersonPanel
                                person={selectedPerson}
                                people={people}
                                isMaster={user?.quyen_han === 'quan_ly'}
                                onClose={() => setSelectedPerson(null)}
                                onAddChild={handleAddChildQuick}
                                onAddSpouse={handleAddSpouseQuick}
                            />
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

            {formOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[var(--bg-elev)] border border-[var(--line)] shadow-2xl text-[var(--ink)]">
                        <div className="sticky top-0 z-10 rounded-t-2xl px-6 py-4" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{form.id ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}</h3>
                                    <p className="mt-0.5 text-xs text-white/70">Nhập thông tin cơ bản của thành viên trong gia phả.</p>
                                </div>
                                <button type="button" onClick={closeForm} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            
                                {quickAddMode !== 'none' ? (
                                    <div className="md:col-span-2 flex items-center gap-6 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                                        <span className="text-sm font-semibold text-emerald-800">Chế độ thêm nhanh:</span>
                                        <span className="text-sm font-bold text-emerald-700">
                                            {quickAddMode === 'child' ? 'Thành viên gốc (Thêm con đẻ)' : 'Dâu / Rể (Thêm phối ngẫu)'}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="md:col-span-2 flex items-center gap-6 rounded-lg border border-[var(--line)] bg-[var(--card-soft)] px-4 py-3">
                                        <span className="text-sm font-semibold text-[var(--ink-soft)]">Vai trò dòng họ:</span>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={!isDauRe}
                                                onChange={() => {
                                                    setIsDauRe(false);
                                                    setForm(f => ({ ...f, id_vo_chong_list: [] }));
                                                }}
                                                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm text-[var(--ink-soft)]">Thành viên gốc (Có cha/mẹ)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={isDauRe}
                                                onChange={() => {
                                                    setIsDauRe(true);
                                                    setForm(f => ({ ...f, id_cha: '', id_me: '' }));
                                                }}
                                                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm text-[var(--ink-soft)]">Dâu / Rể (Từ họ khác)</span>
                                        </label>
                                    </div>
                                )}

                                <label className="md:col-span-2">
                                    <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Họ và tên <span className="text-red-500">*</span></span>
                                    <input
                                        type="text"
                                        required
                                        value={form.ten_day_du}
                                        onChange={(event) => setForm({ ...form, ten_day_du: event.target.value })}
                                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                        placeholder="Ví dụ: Nguyễn Văn A"
                                    />
                                </label>

                                <label>
                                    <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Dòng họ <span className="text-red-500">*</span></span>
                                    <select
                                        value={form.id_dong_ho}
                                        onChange={(event) => setForm({ ...form, id_dong_ho: event.target.value })}
                                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                        required
                                    >
                                        <option value="">-- Chọn Dòng họ --</option>
                                        {dongHos.map((dongHo) => (
                                            <option key={dongHo.id} value={dongHo.id}>
                                                {dongHo.ten_dong_ho}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Giới tính <span className="text-red-500">*</span></span>
                                    <select
                                        value={form.gioi_tinh}
                                        onChange={(event) => setForm({ ...form, gioi_tinh: event.target.value as 'nam' | 'nu' })}
                                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                        required
                                    >
                                        <option value="nam">Nam</option>
                                        <option value="nu">Nữ</option>
                                    </select>
                                </label>

                                <label>
                                    <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Ngày sinh (Dương lịch)</span>
                                    <input
                                        type="date"
                                        value={form.ngay_sinh}
                                        onChange={(event) => setForm({ ...form, ngay_sinh: event.target.value })}
                                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    />
                                </label>

                                <label>
                                    <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Thứ tự sinh</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.thu_tu_sinh}
                                        onChange={(event) => setForm({ ...form, thu_tu_sinh: event.target.value })}
                                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                        placeholder="Ví dụ: 1 (con trưởng)"
                                    />
                                </label>

                                {isDauRe && quickAddMode !== 'child' && (
                                    <label className="md:col-span-2">
                                        <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">
                                            Vợ/chồng {form.id ? '(Có thể chọn nhiều)' : ''}
                                        </span>
                                        {form.id ? (
                                            <>
                                                <select
                                                    multiple
                                                    size={3}
                                                    value={form.id_vo_chong_list}
                                                    onChange={(event) => {
                                                        const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
                                                        setForm({ ...form, id_vo_chong_list: selectedOptions });
                                                    }}
                                                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
                                                    disabled={quickAddMode === 'spouse'}
                                                >
                                                    {people
                                                        .filter((member) => canSelectAsSpouse(people, member, form))
                                                        .map((member) => (
                                                            <option key={member.id} value={member.id}>
                                                                {member.ten_day_du}
                                                            </option>
                                                        ))}
                                                </select>
                                                <p className="mt-1 text-xs text-[var(--ink-mute)]">Nhấn giữ Ctrl (Windows) hoặc Cmd (Mac) để chọn nhiều người.</p>
                                            </>
                                        ) : (
                                            <select
                                                value={form.id_vo_chong_list[0] || ''}
                                                onChange={(event) => {
                                                    const val = event.target.value;
                                                    setForm({ ...form, id_vo_chong_list: val ? [val] : [] });
                                                }}
                                                className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
                                                disabled={quickAddMode === 'spouse'}
                                            >
                                                <option value="">-- Chọn Vợ/chồng (tùy chọn) --</option>
                                                {people
                                                    .filter((member) => canSelectAsSpouse(people, member, form))
                                                    .map((member) => (
                                                        <option key={member.id} value={member.id}>
                                                            {member.ten_day_du}
                                                        </option>
                                                    ))}
                                            </select>
                                        )}
                                    </label>
                                )}

                                {!isDauRe && (
                                    <>
                                        <label>
                                            <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Cha</span>
                                            <select
                                                value={form.id_cha}
                                                onChange={(event) => handleParentChange('id_cha', event.target.value)}
                                                className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
                                                disabled={quickAddMode === 'child' && String(form.id_cha) === selectedParentId}
                                            >
                                                <option value="">Không chọn</option>
                                                {people
                                                    .filter((member) => member.gioi_tinh === 'nam' && canSelectAsParent(people, member, form, form.id_me))
                                                    .map((member) => (
                                                        <option key={member.id} value={member.id}>
                                                            {member.ten_day_du}
                                                        </option>
                                                    ))}
                                            </select>
                                        </label>

                                        <label>
                                            <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Mẹ</span>
                                            <select
                                                value={form.id_me}
                                                onChange={(event) => handleParentChange('id_me', event.target.value)}
                                                className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
                                                disabled={quickAddMode === 'child' && String(form.id_me) === selectedParentId}
                                            >
                                                <option value="">Không chọn</option>
                                                {people
                                                    .filter((member) => member.gioi_tinh === 'nu' && canSelectAsParent(people, member, form, form.id_cha))
                                                    .map((member) => (
                                                        <option key={member.id} value={member.id}>
                                                            {member.ten_day_du}
                                                        </option>
                                                    ))}
                                            </select>
                                        </label>
                                    </>
                                )}

                                <label className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--card-soft)] px-3 py-2">
                                    <input
                                        type="checkbox"
                                        checked={form.da_mat}
                                        onChange={(event) => setForm({ ...form, da_mat: event.target.checked, ngay_mat: event.target.checked ? form.ngay_mat : '' })}
                                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-semibold text-[var(--ink-soft)]">Đã mất</span>
                                </label>

                                <label>
                                    <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Ngày mất</span>
                                    <input
                                        type="date"
                                        value={form.ngay_mat}
                                        onChange={(event) => setForm({ ...form, ngay_mat: event.target.value })}
                                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:opacity-40"
                                        disabled={!form.da_mat}
                                    />
                                </label>

                                <label className="md:col-span-2">
                                    <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Ảnh đại diện URL</span>
                                    <input
                                        value={form.anh_dai_dien}
                                        onChange={(event) => setForm({ ...form, anh_dai_dien: event.target.value })}
                                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                        placeholder="https://..."
                                    />
                                </label>

                                <label className="md:col-span-2">
                                    <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Tiểu sử</span>
                                    <textarea
                                        value={form.tieu_su}
                                        onChange={(event) => setForm({ ...form, tieu_su: event.target.value })}
                                        className="min-h-24 w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    />
                                </label>
                            </div>

                            <div className="mt-6 flex justify-end gap-3 border-t border-[var(--line)] pt-4">
                                <button type="button" onClick={closeForm} className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-4 py-2 font-semibold text-[var(--ink-soft)] hover:bg-[var(--card-soft)] transition">
                                    Hủy
                                </button>
                                <button type="submit" disabled={saving} className="rounded-lg px-5 py-2 font-semibold text-white shadow hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 transition" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                                    {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                                </button>
                            </div>
                        </div>{/* end p-6 */}
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function RootCard({ roots }: { roots: number }) {
    return (
        <div className="flex flex-col items-center">
            <div className="rounded-[14px] bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] px-6 py-3 text-center text-white shadow-[var(--shadow-gold)]">
                <div className="text-[10px] font-bold uppercase tracking-[1.8px] text-white/75">Gốc gia phả</div>
                <div className="mt-0.5 text-sm font-bold">Khởi tổ dòng họ</div>
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

    return (
        <div className="flex flex-col items-center">
            <div
                className="relative z-10 flex items-center justify-center gap-5 rounded-[20px] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] p-5 shadow-[var(--shadow-md)] backdrop-blur"
            >
                <div className="absolute -top-3.5 left-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[var(--card)] bg-[var(--gold)] text-xs font-bold text-white shadow">
                    {level}
                </div>

                <PersonMiniCard person={family.member} searchTerm={searchTerm} selected={selectedPerson?.id === family.member.id} onSelect={onSelect} />

                {family.spouses.map((spouse) => (
                    <div key={spouse.id} className="flex items-center gap-4">
                        <div className="relative h-[2px] w-8 bg-gradient-to-r from-[var(--gold)] to-[var(--gold)] opacity-70">
                            <div className="absolute left-1/2 top-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-pink-200 bg-pink-50 text-pink-500 shadow-sm">
                                <Icon name="heart" size={11} />
                            </div>
                        </div>
                        <PersonMiniCard person={spouse} searchTerm={searchTerm} selected={selectedPerson?.id === spouse.id} onSelect={onSelect} />
                    </div>
                ))}
            </div>

            <div className={`h-10 w-px ${bloodlineOnly ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`} />

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
                                <div className={`h-10 w-px ${bloodlineOnly ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`} />
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
            className="group relative flex w-40 flex-col items-center gap-2 rounded-xl px-2 py-3 text-center transition hover:bg-[var(--card-soft)]"
            style={selected || isHighlighted ? { outline: `2px solid ${selected ? 'var(--gold)' : 'var(--jade)'}`, outlineOffset: '2px' } : undefined}
        >
            <span
                className="relative grid h-[72px] w-[72px] place-items-center overflow-hidden rounded-full text-2xl font-bold text-white shadow-md ring-2 ring-[var(--card)] transition group-hover:scale-105"
                style={{
                    background: isMale ? 'linear-gradient(135deg,var(--jade),var(--jade-soft))' : 'linear-gradient(135deg,var(--terracotta),var(--crimson))',
                    opacity: isDead ? 0.78 : 1,
                }}
            >
                {person.anh_dai_dien ? <img src={person.anh_dai_dien} alt={person.ten_day_du} className="h-full w-full object-cover" /> : person.ten_day_du.charAt(0).toUpperCase()}
                {isDead && <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--deceased)] text-[10px] ring-2 ring-[var(--card)]">†</span>}
                {person.thu_tu_sinh && (
                    <span className="absolute -left-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--gold)] text-[10px] font-bold text-white ring-2 ring-[var(--card)] shadow-sm">
                        {person.thu_tu_sinh}
                    </span>
                )}
            </span>
            <span className="line-clamp-2 min-h-9 w-full text-sm font-bold leading-tight text-[var(--ink)] group-hover:text-[var(--gold)]">{person.ten_day_du}</span>
            {(birthYear || deathYear) && (
                <span className="text-[11.5px] font-medium text-[var(--ink-mute)]">
                    {birthYear || '?'}{isDead ? ` – ${deathYear || '?'}` : ''}
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

function PersonPanel({
    person,
    people,
    isMaster,
    onClose,
    onAddChild,
    onAddSpouse,
}: {
    person: Nguoi;
    people: Nguoi[];
    isMaster: boolean;
    onClose: () => void;
    onAddChild: (parent: Nguoi) => void;
    onAddSpouse: (spouse: Nguoi) => void;
}) {
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
                
                {isMaster && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => onAddChild(person)}
                            className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--gold)] bg-[var(--gold-glow)] py-2 text-center text-xs font-bold text-[var(--gold)] hover:bg-[color-mix(in_srgb,var(--gold)_12%,transparent)] transition"
                        >
                            <Icon name="plus" size={13} />
                            Thêm con nhanh
                        </button>
                        <button
                            type="button"
                            onClick={() => onAddSpouse(person)}
                            className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--terracotta)] bg-[color-mix(in_srgb,var(--terracotta)_10%,transparent)] py-2 text-center text-xs font-bold text-[var(--terracotta)] hover:bg-[color-mix(in_srgb,var(--terracotta)_15%,transparent)] transition"
                        >
                            <Icon name="heart" size={13} />
                            Thêm vợ/chồng
                        </button>
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
