import { Head, router } from '@inertiajs/react';
import { FormEvent, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

    if (candidate.ngay_sinh && form.ngay_sinh) {
        if (new Date(candidate.ngay_sinh) >= new Date(form.ngay_sinh)) {
            return false;
        }
    }

    if (otherParentId) {
        const otherParent = members.find(m => String(m.id) === otherParentId);
        if (otherParent) {
            const spouseIds = otherParent.vo_chong_ids || [];
            if (!spouseIds.includes(candidate.id)) {
                return false;
            }
        }
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

const getAncestorPath = (person: Nguoi, people: Nguoi[]): Nguoi[] => {
    const path: Nguoi[] = [];
    let current: Nguoi | undefined = person;
    const visited = new Set<number>();
    while (current && !visited.has(current.id)) {
        visited.add(current.id);
        path.unshift(current);
        current = current.id_cha ? people.find(p => p.id === current!.id_cha) : undefined;
    }
    return path;
};

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
    const containerRef = useRef<HTMLDivElement | null>(null);
    const treeViewportRef = useRef<HTMLElement | null>(null);
    const treeScaleRef = useRef<HTMLDivElement | null>(null);
    const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
    const [isDraggingTree, setIsDraggingTree] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [genPositions, setGenPositions] = useState<{ level: number; top: number; left: number }[]>([]);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        dongHoApi.list().then((res) => setDongHos(res.data || []));
    }, []);

    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [isDauRe, setIsDauRe] = useState(false);
    const [quickAddMode, setQuickAddMode] = useState<'none' | 'child' | 'spouse' | 'parent'>('none');
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

    const handleAddParentQuick = (child: Nguoi) => {
        if ((child.doi_thu ?? 1) !== 1) {
            toast.error('Chỉ có thể thêm cha/mẹ cho thành viên đang ở đời 1.');
            return;
        }

        setSelectedPerson(child);
        setIsDauRe(false);
        setQuickAddMode('parent');
        setForm({
            ...emptyForm,
            id_dong_ho: String(child.id_dong_ho),
            ngay_sinh: '',
            ngay_mat: '',
        });
        setFormOpen(true);
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

    const handleEditQuick = (person: Nguoi) => {
        const isSpouse = !person.id_cha && !person.id_me && (person.vo_chong_ids && person.vo_chong_ids.length > 0);
        setIsDauRe(isSpouse);
        setQuickAddMode('none');
        setSelectedParentId('');
        setForm({
            id: person.id,
            id_dong_ho: String(person.id_dong_ho),
            ten_day_du: person.ten_day_du,
            gioi_tinh: person.gioi_tinh,
            ngay_sinh: person.ngay_sinh || '',
            ngay_mat: person.ngay_mat || '',
            da_mat: Boolean(person.da_mat),
            id_cha: person.id_cha ? String(person.id_cha) : '',
            id_me: person.id_me ? String(person.id_me) : '',
            id_vo_chong_list: (person.vo_chong_ids || []).map(String),
            tieu_su: person.tieu_su || '',
            anh_dai_dien: person.anh_dai_dien || '',
            thu_tu_sinh: person.thu_tu_sinh ? String(person.thu_tu_sinh) : '',
        });
        setFormOpen(true);
    };

    const handleDeleteQuick = async (person: Nguoi) => {
        const isConfirmed = window.confirm(`Bạn có chắc chắn muốn xóa thành viên "${person.ten_day_du}" khỏi gia phả không?\nLưu ý: Hành động này không thể hoàn tác!`);
        if (!isConfirmed) return;

        try {
            setLoading(true);
            const result = await nguoiApi.delete(person.id);
            if (result.success) {
                toast.success(result.message || 'Xóa thành viên thành công.');
                setSelectedPerson(null);
                loadData();
            } else {
                toast.error(result.message || 'Không thể xóa thành viên.');
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi khi xóa thành viên.');
        } finally {
            setLoading(false);
        }
    };

    const updateGenPositions = useCallback(() => {
        const scaleEl = treeScaleRef.current;
        if (!scaleEl) return;

        const cards = scaleEl.querySelectorAll('[data-generation-level]');
        const levelsMap = new Map<number, HTMLElement[]>();
        cards.forEach((card) => {
            const lvl = Number(card.getAttribute('data-generation-level'));
            if (!levelsMap.has(lvl)) levelsMap.set(lvl, []);
            levelsMap.get(lvl)!.push(card as HTMLElement);
        });

        const scaleRect = scaleEl.getBoundingClientRect();
        const positions: { level: number; top: number; left: number }[] = [];

        levelsMap.forEach((elements, lvl) => {
            let minLeft = Infinity;
            let sumTop = 0;
            let count = 0;

            elements.forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.left < minLeft) minLeft = rect.left;
                sumTop += rect.top + rect.height / 2;
                count++;
            });

            if (count > 0) {
                const avgTop = sumTop / count;
                const topOffset = (avgTop - scaleRect.top) / zoom;
                const leftOffset = Math.max(10, (minLeft - scaleRect.left) / zoom - 72);
                positions.push({ level: lvl, top: topOffset, left: leftOffset });
            }
        });

        setGenPositions(positions.sort((a, b) => a.level - b.level));
    }, [zoom]);

    useEffect(() => {
        const scaleEl = treeScaleRef.current;
        if (!scaleEl) return;

        const observer = new MutationObserver(() => {
            updateGenPositions();
        });

        observer.observe(scaleEl, {
            childList: true,
            subtree: true,
            attributes: true,
        });

        updateGenPositions();

        return () => observer.disconnect();
    }, [updateGenPositions, people, selectedDongHo, bloodlineOnly]);

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

            if (quickAddMode === 'child' && selectedPerson) {
                payload.id_cha = selectedPerson.gioi_tinh === 'nam' ? selectedPerson.id : undefined;
                payload.id_me = selectedPerson.gioi_tinh === 'nu' ? selectedPerson.id : undefined;
            } else if (quickAddMode === 'spouse' && selectedPerson) {
                payload.id_vo_chong = selectedPerson.id;
            } else if (quickAddMode === 'parent' && selectedPerson) {
                if ((selectedPerson.doi_thu ?? 1) !== 1) {
                    toast.error('Chỉ có thể thêm cha/mẹ cho thành viên đang ở đời 1.');
                    return;
                }
                payload.id_con = selectedPerson.id;
            }

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

    useEffect(() => {
        if (treeData.length > 0 && treeViewportRef.current) {
            setTimeout(() => {
                if (treeViewportRef.current) {
                    const viewport = treeViewportRef.current;
                    const rootNodeId = treeData[0].id;
                    const rootEl = document.getElementById(`family-node-${rootNodeId}`);
                    
                    if (rootEl) {
                        const viewportRect = viewport.getBoundingClientRect();
                        const rootRect = rootEl.getBoundingClientRect();
                        
                        // Tính toán khoảng cách từ thẻ root đến viền trái
                        const absoluteLeft = viewport.scrollLeft + (rootRect.left - viewportRect.left);
                        
                        // Đưa thẻ root vào chính giữa
                        viewport.scrollLeft = absoluteLeft - (viewportRect.width / 2) + (rootRect.width / 2);
                        viewport.scrollTop = 0;
                    } else {
                        const scrollWidth = viewport.scrollWidth;
                        const clientWidth = viewport.clientWidth;
                        if (scrollWidth > clientWidth) {
                            viewport.scrollLeft = (scrollWidth - clientWidth) / 2;
                        }
                    }
                }
            }, 100);
        }
    }, [treeData]);
    const selectedDongHoName = dongHos.find((d) => String(d.id) === selectedDongHo)?.ten_dong_ho;
    const depth = getDepth(treeData);
    const deceased = people.filter((person) => Boolean(person.da_mat)).length;

    const zoomOut = () => setZoom((value) => Math.max(value - 0.08, 0.4));
    const zoomIn = () => setZoom((value) => Math.min(value + 0.08, 1.6));
    const fit = () => setZoom(0.85);

    const toggleFullscreen = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        if (!document.fullscreenElement) {
            el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
        }
    }, []);

    const inlineComputedStyles = (source: Element, target: Element) => {
        const sourceElements = [source, ...Array.from(source.querySelectorAll('*'))] as HTMLElement[];
        const targetElements = [target, ...Array.from(target.querySelectorAll('*'))] as HTMLElement[];

        sourceElements.forEach((sourceElement, index) => {
            const targetElement = targetElements[index];
            if (!targetElement) return;

            const computed = window.getComputedStyle(sourceElement);
            let cssText = '';
            for (let i = 0; i < computed.length; i++) {
                const property = computed.item(i);
                cssText += `${property}:${computed.getPropertyValue(property)};`;
            }
            targetElement.setAttribute('style', `${targetElement.getAttribute('style') || ''};${cssText}`);
        });
    };

    const getExportClone = () => {
        const source = treeScaleRef.current;
        if (!source) return null;

        const clone = source.cloneNode(true) as HTMLElement;
        inlineComputedStyles(source, clone);
        clone.style.transform = 'none';
        clone.style.transformOrigin = 'top left';
        clone.style.width = `${source.scrollWidth}px`;
        clone.style.minWidth = `${source.scrollWidth}px`;
        clone.style.background = 'transparent';

        return {
            clone,
            width: Math.ceil(source.scrollWidth + 96),
            height: Math.ceil(source.scrollHeight + 96),
        };
    };

    const exportTreeImage = async () => {
        const exportData = getExportClone();
        if (!exportData) {
            toast.error('Chưa có cây gia phả để xuất.');
            return;
        }

        setExporting(true);
        try {
            const wrapper = document.createElement('div');
            wrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
            wrapper.style.boxSizing = 'border-box';
            wrapper.style.width = `${exportData.width}px`;
            wrapper.style.minHeight = `${exportData.height}px`;
            wrapper.style.padding = '48px';
            wrapper.style.background = '#fbf5e6';
            wrapper.style.fontFamily = 'Inter, Arial, sans-serif';
            wrapper.appendChild(exportData.clone);

            const svg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${exportData.width}" height="${exportData.height}">
                    <foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(wrapper)}</foreignObject>
                </svg>
            `;
            const clanName = (selectedDongHoName || 'cay-gia-pha')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .toLowerCase();

            const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${clanName || 'cay-gia-pha'}.svg`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Đã xuất ảnh cây gia phả.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Không thể xuất ảnh cây gia phả.');
        } finally {
            setExporting(false);
        }
    };

    const printTree = () => {
        const exportData = getExportClone();
        if (!exportData) {
            toast.error('Chưa có cây gia phả để in.');
            return;
        }

        const printWindow = window.open('', '_blank', 'width=1400,height=900');
        if (!printWindow) {
            toast.error('Trình duyệt đã chặn cửa sổ in.');
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.style.boxSizing = 'border-box';
        wrapper.style.width = `${exportData.width}px`;
        wrapper.style.minHeight = `${exportData.height}px`;
        wrapper.style.padding = '48px';
        wrapper.style.background = '#fbf5e6';
        wrapper.appendChild(exportData.clone);

        printWindow.document.write(`
            <!doctype html>
            <html>
                <head>
                    <title>${selectedDongHoName || 'Cây gia phả'}</title>
                    <style>
                        @page { size: A3 landscape; margin: 12mm; }
                        html, body { margin: 0; background: #fbf5e6; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    </style>
                </head>
                <body>${wrapper.outerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 300);
    };

    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
            const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select';

            if (e.key === 'Escape') {
                if (formOpen) { closeForm(); e.preventDefault(); return; }
                if (selectedPerson) { setSelectedPerson(null); e.preventDefault(); return; }
            }

            if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
                const searchInput = document.getElementById('search-member-input');
                if (searchInput) {
                    searchInput.focus();
                    (searchInput as HTMLInputElement).select();
                    e.preventDefault();
                    return;
                }
            }

            if (isTyping) return;

            if (e.key === '+' || e.key === '=') { zoomIn(); e.preventDefault(); }
            else if (e.key === '-') { zoomOut(); e.preventDefault(); }
            else if (e.key === '0') { fit(); e.preventDefault(); }
            else if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); e.preventDefault(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [formOpen, selectedPerson, toggleFullscreen]);

    useEffect(() => {
        if (!searchTerm) return;
        const delaySearch = setTimeout(() => {
            const matchedPerson = people.find(p => p.ten_day_du.toLowerCase().includes(searchTerm.toLowerCase()));
            if (matchedPerson && treeViewportRef.current) {
                const viewport = treeViewportRef.current;
                const el = document.getElementById(`person-card-${matchedPerson.id}`);
                if (el) {
                    const viewportRect = viewport.getBoundingClientRect();
                    const elRect = el.getBoundingClientRect();
                    
                    const absoluteLeft = viewport.scrollLeft + (elRect.left - viewportRect.left);
                    const absoluteTop = viewport.scrollTop + (elRect.top - viewportRect.top);
                    
                    viewport.scrollTo({
                        left: absoluteLeft - (viewportRect.width / 2) + (elRect.width / 2),
                        top: absoluteTop - (viewportRect.height / 2) + (elRect.height / 2),
                        behavior: 'smooth'
                    });
                }
            }
        }, 500);
        return () => clearTimeout(delaySearch);
    }, [searchTerm, people]);

    return (
        <AuthenticatedLayout fullBleed>
            <Head title="Cây Gia Phả" />
            <div ref={containerRef} className="flex min-h-[calc(100vh-64px)] flex-col bg-[var(--bg)]">
                <div className="flex min-h-16 flex-col gap-3 border-b border-[var(--line)] bg-[var(--bg-elev)] px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-7">
                    <div className="min-w-0">
                        <div className="gp-eyebrow">{selectedDongHoName || 'Toàn bộ dòng họ'}</div>
                        <h1 className="mt-1 font-serif text-[clamp(28px,4vw,36px)] font-semibold leading-tight text-[var(--ink)]">
                            Toàn cây · {depth || 1} đời · {people.length} thành viên
                        </h1>
                        <div className="mt-2.5 flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/50 px-3 py-1 text-[13px] font-medium text-emerald-700 shadow-sm">
                                <span className="relative flex h-2 w-2">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                </span>
                                <span className="whitespace-nowrap">Còn sống: <span className="font-bold">{people.length - deceased}</span></span>
                            </div>
                            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/50 px-3 py-1 text-[13px] font-medium text-slate-600 shadow-sm">
                                <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                                <span className="whitespace-nowrap">Đã mất: <span className="font-bold">{deceased}</span></span>
                            </div>
                            <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/50 px-3 py-1 text-[13px] font-medium text-blue-700 shadow-sm">
                                <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                                <span className="whitespace-nowrap">Nam: <span className="font-bold">{people.filter(p => p.gioi_tinh === 'nam').length}</span> · Nữ: <span className="font-bold">{people.filter(p => p.gioi_tinh !== 'nam').length}</span></span>
                            </div>
                            <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/50 px-3 py-1 text-[13px] font-medium text-amber-700 shadow-sm">
                                <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                                <span className="whitespace-nowrap">Thế hệ: <span className="font-bold">{depth}</span> đời</span>
                            </div>
                        </div>
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
                                id="search-member-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="gp-input w-[220px] py-2 pl-9 text-[13px]"
                                placeholder="Tìm thành viên... (Ctrl+F)"
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
                            <button type="button" onClick={fit} className="grid h-8 w-8 place-items-center rounded-md text-[var(--ink-soft)] hover:bg-[var(--card)]" title="Khớp màn hình">
                                <Icon name="fit" size={15} />
                            </button>
                            <button type="button" onClick={toggleFullscreen} className="grid h-8 w-8 place-items-center rounded-md text-[var(--ink-soft)] hover:bg-[var(--card)]" title="Toàn màn hình">
                                <Icon name={isFullscreen ? 'minus' : 'fit'} size={15} />
                            </button>
                        </div>

                        <button type="button" onClick={() => setBloodlineOnly((value) => !value)} className={`gp-btn ${bloodlineOnly ? 'gp-btn-jade' : 'gp-btn-ghost'}`}>
                            <Icon name="branch" size={16} />
                            Huyết thống
                        </button>
                        <button type="button" onClick={exportTreeImage} disabled={exporting || loading || treeData.length === 0} className="gp-btn gp-btn-ghost disabled:opacity-50" title="Tai anh SVG de in hoac chia se">
                            <Icon name="photo" size={16} />
                            {exporting ? 'Dang xuat...' : 'SVG'}
                        </button>
                        <button type="button" onClick={printTree} disabled={loading || treeData.length === 0} className="gp-btn gp-btn-ghost disabled:opacity-50" title="Mo man hinh in de luu PDF">
                            <Icon name="book" size={16} />
                            PDF
                        </button>
                        {user?.quyen_han === 'quan_ly' && (
                            <button type="button" onClick={() => router.visit('/gia-pha/thanh-vien')} className="gp-btn gp-btn-primary">
                                <Icon name="plus" size={16} />
                                Thêm
                            </button>
                        )}
                    </div>
                </div>

                <div className="relative flex min-h-0 flex-1 overflow-hidden bg-[var(--bg)]">
                    <section
                        ref={treeViewportRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className="dot-grid relative flex-1 min-h-[680px] overflow-auto"
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
                                <div ref={treeScaleRef} className="relative origin-top transition-transform duration-200" style={{ transform: `scale(${zoom})` }}>
                                    {/* Nhãn thế hệ dọc bên trái */}
                                    {genPositions.map(({ level, top, left }) => (
                                        <div
                                            key={level}
                                            className="absolute z-30 flex items-center gap-2 rounded-lg border border-[var(--gold-pale)] bg-[var(--card)] px-3 py-1.5 text-xs font-bold text-[var(--gold)] shadow-sm select-none transition-all duration-200"
                                            style={{ 
                                                top: `${top}px`, 
                                                left: `${left}px`,
                                                transform: 'translateY(-50%)'
                                            }}
                                        >
                                            <span className="h-2 w-2 rounded-full bg-[var(--gold)]"></span>
                                            Đời {level}
                                        </div>
                                    ))}

                                    <RootCard roots={treeData.length} />
                                    <div className="flex justify-center gap-12">
                                        {treeData.map((rootNode) => (
                                            <div key={rootNode.id} id={`family-node-${rootNode.id}`}>
                                                <FamilyCard
                                                    family={rootNode}
                                                    level={1}
                                                    searchTerm={searchTerm}
                                                    bloodlineOnly={bloodlineOnly}
                                                    selectedPerson={selectedPerson}
                                                    onSelect={setSelectedPerson}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                    
                    {treeData.length > 0 && <Minimap viewportRef={treeViewportRef} />}

                    {selectedPerson && (
                        <>
                            <div className="absolute inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedPerson(null)} />
                            <aside className="absolute bottom-0 right-0 top-0 z-50 w-[420px] max-w-[90vw] animate-in slide-in-from-right-8 duration-300 shadow-2xl border-l border-[var(--line)]">
                                <PersonPanel
                                    person={selectedPerson}
                                    people={people}
                                    isMaster={user?.quyen_han === 'quan_ly'}
                                    onClose={() => setSelectedPerson(null)}
                                    onAddChild={handleAddChildQuick}
                                    onAddSpouse={handleAddSpouseQuick}
                                    onAddParent={handleAddParentQuick}
                                    onEditQuick={handleEditQuick}
                                    onDeleteQuick={handleDeleteQuick}
                                />
                        </aside>
                        </>
                    )}
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
                                            {quickAddMode === 'child' ? 'Thành viên gốc (Thêm con đẻ)' : quickAddMode === 'spouse' ? 'Dâu / Rể (Thêm phối ngẫu)' : 'Thành viên gốc (Thêm cha/mẹ)'}
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

                                {!isDauRe && quickAddMode !== 'parent' && (
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
    parentLabel,
}: {
    family: FamilyNode;
    level: number;
    searchTerm: string;
    bloodlineOnly: boolean;
    selectedPerson: Nguoi | null;
    onSelect: (person: Nguoi) => void;
    parentLabel?: string;
}) {
    const hasChildren = family.children.length > 0;
    const [isExpanded, setIsExpanded] = useState(true);
    const [hoveredSpouseId, setHoveredSpouseId] = useState<number | null>(null);
    
    const isSelectedSpouse = family.spouses.some(s => s.id === selectedPerson?.id);
    const activeSpouseId = isSelectedSpouse ? selectedPerson?.id : hoveredSpouseId;

    const leftSpouses = family.spouses.slice(0, Math.floor(family.spouses.length / 2));
    const rightSpouses = family.spouses.slice(Math.floor(family.spouses.length / 2));

    return (
        <div className="flex flex-col items-center">
            <div
                className="relative z-10 flex items-center justify-center gap-5 rounded-[20px] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] p-5 shadow-[var(--shadow-md)] backdrop-blur"
                data-generation-level={level}
            >
                <div className="absolute -top-3.5 left-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[var(--card)] bg-[var(--gold)] text-xs font-bold text-white shadow">
                    {level}
                </div>

                {leftSpouses.map((spouse) => (
                    <div 
                        key={spouse.id} 
                        className="flex items-center gap-4 transition-transform hover:scale-105"
                        onMouseEnter={() => setHoveredSpouseId(spouse.id)}
                        onMouseLeave={() => setHoveredSpouseId(null)}
                    >
                        <PersonMiniCard person={spouse} searchTerm={searchTerm} selected={selectedPerson?.id === spouse.id} onSelect={onSelect} />
                        <div className="relative h-[2px] w-8 bg-gradient-to-r from-[var(--gold)] to-[var(--gold)] opacity-70">
                            <div className="absolute left-1/2 top-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-pink-200 bg-pink-50 text-pink-500 shadow-sm">
                                <Icon name="heart" size={11} />
                            </div>
                        </div>
                    </div>
                ))}

                <PersonMiniCard person={family.member} searchTerm={searchTerm} selected={selectedPerson?.id === family.member.id} onSelect={onSelect} parentLabel={parentLabel} isRoot={level === 1} />

                {rightSpouses.map((spouse) => (
                    <div 
                        key={spouse.id} 
                        className="flex items-center gap-4 transition-transform hover:scale-105"
                        onMouseEnter={() => setHoveredSpouseId(spouse.id)}
                        onMouseLeave={() => setHoveredSpouseId(null)}
                    >
                        <div className="relative h-[2px] w-8 bg-gradient-to-r from-[var(--gold)] to-[var(--gold)] opacity-70">
                            <div className="absolute left-1/2 top-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-pink-200 bg-pink-50 text-pink-500 shadow-sm">
                                <Icon name="heart" size={11} />
                            </div>
                        </div>
                        <PersonMiniCard person={spouse} searchTerm={searchTerm} selected={selectedPerson?.id === spouse.id} onSelect={onSelect} />
                    </div>
                ))}
            </div>

            {hasChildren ? (
                <>
                    <div className="relative flex h-10 w-px items-center justify-center">
                        <div className={`absolute inset-y-0 w-px ${bloodlineOnly ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`} />
                        <button
                            type="button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="z-20 grid h-6 w-6 cursor-pointer place-items-center rounded-full border border-[var(--gold)] bg-[#faf9f6] text-[var(--gold)] transition hover:bg-[var(--gold)] hover:text-white"
                            title={isExpanded ? "Thu gọn nhánh" : "Mở rộng nhánh"}
                        >
                            <Icon name={isExpanded ? "minus" : "plus"} size={14} />
                        </button>
                    </div>
                    
                    {isExpanded && (
                        <div className="flex justify-center">
                            {family.children.map((child, index) => {
                                const isOnly = family.children.length === 1;
                                const isFirst = index === 0;
                                const isLast = index === family.children.length - 1;
                                
                                const otherParentId = child.member.id_cha === family.member.id ? child.member.id_me : child.member.id_cha;
                                const otherParent = otherParentId ? family.spouses.find(s => s.id === otherParentId) : undefined;
                                const childParentLabel = otherParent 
                                    ? (family.member.gioi_tinh === 'nam' ? 'Mẹ: ' : 'Cha: ') + otherParent.ten_day_du.split(' ').pop() 
                                    : undefined;
                                const childIsDimmed = activeSpouseId !== null && activeSpouseId !== undefined && otherParentId !== activeSpouseId;

                                return (
                                    <div key={child.id} className={`relative flex flex-col items-center px-6 transition-all duration-300 ${childIsDimmed ? 'opacity-20 grayscale' : 'opacity-100 grayscale-0'}`}>
                                        {!isOnly && (
                                            <>
                                                {!isFirst && <div className={`absolute left-0 top-0 h-px w-1/2 ${bloodlineOnly ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`} />}
                                                {!isLast && <div className={`absolute right-0 top-0 h-px w-1/2 ${bloodlineOnly ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`} />}
                                            </>
                                        )}
                                        <div className={`h-10 w-px ${bloodlineOnly ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`} />
                                        <FamilyCard family={child} level={level + 1} searchTerm={searchTerm} bloodlineOnly={bloodlineOnly} selectedPerson={selectedPerson} onSelect={onSelect} parentLabel={childParentLabel} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : (
                <div className={`h-10 w-px ${bloodlineOnly ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`} />
            )}
        </div>
    );
}

const calculateAge = (ngay_sinh?: string | null, ngay_mat?: string | null, da_mat?: boolean) => {
    if (!ngay_sinh) return null;
    const birthYear = parseInt(ngay_sinh.substring(0, 4));
    if (isNaN(birthYear)) return null;
    
    if (da_mat) {
        if (!ngay_mat) return null;
        const deathYear = parseInt(ngay_mat.substring(0, 4));
        if (isNaN(deathYear)) return null;
        return deathYear - birthYear;
    } else {
        const currentYear = new Date().getFullYear();
        return currentYear - birthYear;
    }
};

function Minimap({ viewportRef }: { viewportRef: React.RefObject<HTMLElement> }) {
    const [viewportProps, setViewportProps] = useState({ scrollLeft: 0, scrollTop: 0, scrollWidth: 1, scrollHeight: 1, clientWidth: 1, clientHeight: 1 });
    
    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        
        const update = () => {
            setViewportProps({
                scrollLeft: viewport.scrollLeft,
                scrollTop: viewport.scrollTop,
                scrollWidth: Math.max(viewport.scrollWidth, 1),
                scrollHeight: Math.max(viewport.scrollHeight, 1),
                clientWidth: Math.max(viewport.clientWidth, 1),
                clientHeight: Math.max(viewport.clientHeight, 1)
            });
        };
        
        viewport.addEventListener('scroll', update);
        window.addEventListener('resize', update);
        const timeout = setTimeout(update, 500);
        
        const observer = new MutationObserver(update);
        observer.observe(viewport, { childList: true, subtree: true });
        
        return () => {
            viewport.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
            clearTimeout(timeout);
            observer.disconnect();
        };
    }, [viewportRef]);

    const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = viewportProps;

    // Ẩn minimap khi cây vừa khít viewport (không cần scroll)
    const canScrollH = scrollWidth > clientWidth * 1.1;
    const canScrollV = scrollHeight > clientHeight * 1.1;
    if (!canScrollH && !canScrollV) return null;
    
    const MAX_WIDTH = 240;
    const MAX_HEIGHT = 160;
    
    // Giữ nguyên tỷ lệ khung hình (Aspect Ratio) của sơ đồ cây gia phả
    const scale = Math.min(MAX_WIDTH / scrollWidth, MAX_HEIGHT / scrollHeight);
    
    const mapWidth = Math.max(scrollWidth * scale, 60);
    const mapHeight = Math.max(scrollHeight * scale, 40);
    
    const scaleX = mapWidth / scrollWidth;
    const scaleY = mapHeight / scrollHeight;
    
    const viewWidth = Math.max(clientWidth * scaleX, 4);
    const viewHeight = Math.max(clientHeight * scaleY, 4);
    
    // Clamp left/top to prevent the view box from going out of bounds
    // due to the Math.max clamping above
    const maxLeft = mapWidth - viewWidth;
    const maxTop = mapHeight - viewHeight;
    const viewLeft = Math.min(scrollLeft * scaleX, maxLeft);
    const viewTop = Math.min(scrollTop * scaleY, maxTop);

    const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.buttons !== 1) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, mapWidth));
        const y = Math.max(0, Math.min(e.clientY - rect.top, mapHeight));
        
        const targetScrollLeft = (x / scaleX) - (clientWidth / 2);
        const targetScrollTop = (y / scaleY) - (clientHeight / 2);
        
        if (viewportRef.current) {
            viewportRef.current.scrollTo({ left: targetScrollLeft, top: targetScrollTop });
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-30 overflow-hidden rounded-xl border border-white/20 bg-slate-900/60 shadow-xl backdrop-blur-md hover:bg-slate-900/80 hidden sm:block">
            <div className="px-2 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/50">Bản đồ</div>
            <div className="px-2 pb-2">
                <div 
                    className="relative cursor-crosshair bg-white/5 rounded-md border border-white/10"
                    style={{ width: mapWidth, height: mapHeight }}
                    onMouseMove={handleDrag}
                    onMouseDown={handleDrag}
                >
                    <div 
                        className="absolute rounded border border-[var(--gold)] bg-[var(--gold-glow)] pointer-events-none transition-all duration-75"
                        style={{
                            width: viewWidth,
                            height: viewHeight,
                            left: viewLeft,
                            top: viewTop,
                            boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)'
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

function PersonMiniCard({ person, searchTerm, selected, onSelect, parentLabel, isRoot }: { person: Nguoi; searchTerm: string; selected: boolean; onSelect: (person: Nguoi) => void; parentLabel?: string; isRoot?: boolean }) {
    const isMale = person.gioi_tinh === 'nam';
    const isDead = Boolean(person.da_mat);
    const birthYear = formatYear(person.ngay_sinh);
    const deathYear = formatYear(person.ngay_mat);
    const isHighlighted = Boolean(searchTerm && person.ten_day_du.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const age = calculateAge(person.ngay_sinh, person.ngay_mat, isDead);
    const lifespanPercent = age !== null ? Math.min(Math.max(age / 100, 0), 1) * 100 : 0;

    return (
        <button
            id={`person-card-${person.id}`}
            type="button"
            onClick={() => onSelect(person)}
            className="group relative flex w-40 flex-col items-center gap-2 rounded-xl px-2 py-3 text-center transition hover:bg-[var(--card-soft)]"
            style={selected || isHighlighted ? { outline: `2px solid ${selected ? 'var(--gold)' : 'var(--jade)'}`, outlineOffset: '2px' } : undefined}
        >
            {isRoot && (
                <span className="absolute -left-2 -top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-[var(--gold)] text-[14px] text-white shadow-md ring-2 ring-[var(--card)]" title="Thủy Tổ">
                    👑
                </span>
            )}
            <div className="relative">
                <span
                    className={`grid h-[72px] w-[72px] place-items-center overflow-hidden rounded-full text-2xl font-bold text-white shadow-md transition group-hover:scale-105 ${isDead ? 'border-2 border-dashed border-amber-500/70' : 'ring-2 ring-[var(--card)]'}`}
                    style={{
                        background: isMale ? 'linear-gradient(135deg,var(--jade),var(--jade-soft))' : 'linear-gradient(135deg,var(--terracotta),var(--crimson))',
                    }}
                >
                    {person.anh_dai_dien ? <img src={person.anh_dai_dien} alt={person.ten_day_du} className="h-full w-full object-cover" /> : person.ten_day_du.charAt(0).toUpperCase()}
                </span>
                {isDead && (
                    <span className="absolute -right-1 -top-1 z-10 grid h-[22px] w-[22px] place-items-center rounded-full bg-amber-50 text-amber-600 ring-2 ring-amber-200 shadow-sm" title="Đã khuất">
                        <Icon name="lotus" size={13} strokeWidth={1.5} />
                    </span>
                )}
                {person.thu_tu_sinh && (
                    <span className="absolute -left-1 -top-1 z-10 grid h-5 w-5 place-items-center rounded-full bg-[var(--gold)] text-[10px] font-bold text-white ring-2 ring-[var(--card)] shadow-sm">
                        {person.thu_tu_sinh}
                    </span>
                )}
            </div>
            <div className="flex w-full flex-col items-center">
                <span className="line-clamp-2 min-h-9 w-full text-sm font-bold leading-tight text-[var(--ink)] group-hover:text-[var(--gold)]">{person.ten_day_du}</span>
                {(birthYear || deathYear) && (
                    <span className="text-[11.5px] font-medium text-[var(--ink-mute)]">
                        {birthYear || '?'}{isDead ? ` – ${deathYear || '?'}` : ''} {age !== null ? `(${age}t)` : ''}
                    </span>
                )}
                {age !== null && (
                    <div className="mt-1.5 h-1 w-16 overflow-hidden rounded-full bg-[var(--line)]">
                        <div 
                            className={`h-full rounded-full ${isDead ? 'bg-amber-400/80' : 'bg-emerald-400'}`} 
                            style={{ width: `${lifespanPercent}%` }} 
                        />
                    </div>
                )}
            </div>
            {parentLabel && (
                <span className="mt-1 max-w-full truncate rounded-md bg-amber-50 px-2 py-0.5 text-[9.5px] font-bold text-amber-700 shadow-sm border border-amber-200">
                    {parentLabel}
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
    onAddParent,
    onEditQuick,
    onDeleteQuick,
}: {
    person: Nguoi;
    people: Nguoi[];
    isMaster: boolean;
    onClose: () => void;
    onAddChild: (parent: Nguoi) => void;
    onAddSpouse: (spouse: Nguoi) => void;
    onAddParent: (child: Nguoi) => void;
    onEditQuick: (person: Nguoi) => void;
    onDeleteQuick: (person: Nguoi) => void;
}) {
    const father = person.id_cha ? people.find((item) => item.id === person.id_cha) : undefined;
    const mother = person.id_me ? people.find((item) => item.id === person.id_me) : undefined;
    const spouses = (person.vo_chong_ids || []).map((id) => people.find((item) => item.id === id)).filter(Boolean) as Nguoi[];
    const children = people.filter((item) => item.id_cha === person.id || item.id_me === person.id);
    const canAddParent = (person.doi_thu ?? 1) === 1;

    // Build timeline events
    const events: { year: string; type: string; desc: string; icon: string; color: string }[] = [];
    if (person.ngay_sinh) events.push({ year: person.ngay_sinh.substring(0,4), type: 'Sinh ra', desc: `Năm ${person.ngay_sinh.substring(0,4)}`, icon: 'sun', color: 'text-emerald-500' });
    spouses.forEach(s => events.push({ year: 'N/A', type: 'Phối ngẫu', desc: `Kết hôn với ${s.ten_day_du}`, icon: 'heart', color: 'text-pink-500' }));
    children.forEach(c => {
        if (c.ngay_sinh) events.push({ year: c.ngay_sinh.substring(0,4), type: 'Sinh con', desc: `Sinh ${c.ten_day_du}`, icon: 'arrow-down', color: 'text-amber-500' });
    });
    if (person.da_mat) events.push({ year: person.ngay_mat ? person.ngay_mat.substring(0,4) : 'N/A', type: 'Qua đời', desc: `Hưởng thọ ${calculateAge(person.ngay_sinh, person.ngay_mat, true) || '?'} tuổi`, icon: 'moon', color: 'text-slate-500' });

    events.sort((a, b) => {
        if (a.year === 'N/A') return 0;
        if (b.year === 'N/A') return 0;
        return parseInt(a.year) - parseInt(b.year);
    });

    return (
        <div className="flex h-full flex-col bg-[var(--bg-elev)]">
            <div className="relative shrink-0 bg-pattern bg-[var(--gold-glow)] p-6 pt-8 shadow-sm">
                <button type="button" onClick={onClose} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg bg-white/40 text-[var(--ink-soft)] shadow-sm hover:bg-white transition">
                    <Icon name="x" size={17} />
                </button>
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] font-serif text-4xl font-semibold text-white shadow-[var(--shadow-gold)] ring-4 ring-white/50">
                        {person.anh_dai_dien ? <img src={person.anh_dai_dien} alt={person.ten_day_du} className="h-full w-full object-cover" /> : person.ten_day_du.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="gp-eyebrow justify-center">{person.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'} · {Boolean(person.da_mat) ? 'Đã mất' : 'Còn sống'}</div>
                        <h2 className="mt-1 font-serif text-[28px] font-semibold leading-tight text-[var(--ink)]">{person.ten_day_du}</h2>
                    </div>
                </div>
            </div>

            {(() => {
                const path = getAncestorPath(person, people);
                if (path.length <= 1) return null;
                return (
                    <div className="shrink-0 border-b border-[var(--line)] bg-[var(--card-soft)] px-6 py-2">
                        <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-medium text-[var(--ink-mute)]">
                            {path.map((p, i) => (
                                <span key={p.id} className="flex items-center gap-1 whitespace-nowrap">
                                    {i > 0 && <span className="text-[var(--ink-mute)]">→</span>}
                                    <span className={p.id === person.id ? 'font-bold text-[var(--gold)]' : ''}>
                                        {p.ten_day_du.split(' ').pop()}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>
                );
            })()}

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isMaster && (
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => canAddParent && onAddParent(person)}
                            disabled={!canAddParent}
                            title={canAddParent ? undefined : 'Chỉ thêm cha/mẹ cho thành viên đời 1'}
                            className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition ${
                                canAddParent
                                    ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                    : 'cursor-not-allowed bg-slate-50/60 border-slate-100 opacity-50'
                            }`}
                        >
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-200 text-slate-600"><Icon name="arrow-up" size={14} /></span>
                            <span className="text-[10px] font-bold text-slate-600">Thêm cha/mẹ</span>
                        </button>
                        <button type="button" onClick={() => onAddSpouse(person)} className="flex flex-col items-center gap-1 rounded-xl bg-pink-50 border border-pink-200 p-2 text-center transition hover:bg-pink-100 hover:border-pink-300">
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-pink-200 text-pink-600"><Icon name="heart" size={14} /></span>
                            <span className="text-[10px] font-bold text-pink-600">Thêm vợ/chồng</span>
                        </button>
                        <button type="button" onClick={() => onAddChild(person)} className="flex flex-col items-center gap-1 rounded-xl bg-amber-50 border border-amber-200 p-2 text-center transition hover:bg-amber-100 hover:border-amber-300">
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-200 text-amber-600"><Icon name="arrow-down" size={14} /></span>
                            <span className="text-[10px] font-bold text-amber-600">Thêm con</span>
                        </button>
                    </div>
                )}

                <div>
                    <h3 className="mb-3 text-[12px] font-bold uppercase tracking-wider text-[var(--ink-mute)]">Thông tin cơ bản</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <Info label="Cha" value={father?.ten_day_du || 'Không rõ'} />
                        <Info label="Mẹ" value={mother?.ten_day_du || 'Không rõ'} />
                        <Info label="Con cái" value={children.length ? `${children.length} người con` : 'Chưa có'} />
                        <Info label="Hôn nhân" value={spouses.length ? `${spouses.length} người` : 'Chưa có'} />
                    </div>
                </div>
                
                {events.length > 0 && (
                    <div>
                        <h3 className="mb-4 text-[12px] font-bold uppercase tracking-wider text-[var(--ink-mute)]">Dấu ấn thời gian</h3>
                        <div className="relative border-l-2 border-slate-200 ml-4 space-y-5">
                            {events.map((ev, idx) => (
                                <div key={idx} className="relative pl-6">
                                    <span className={`absolute -left-[13px] top-1 grid h-6 w-6 place-items-center rounded-full bg-white border-2 border-slate-200 ${ev.color} shadow-sm`}>
                                        <Icon name={ev.icon} size={11} />
                                    </span>
                                    <div className="font-bold text-[14px] text-[var(--ink)]">{ev.type} <span className="text-slate-400 font-normal ml-1">({ev.year})</span></div>
                                    <div className="text-[13px] text-[var(--ink-soft)] mt-0.5">{ev.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {person.tieu_su && (
                    <div>
                        <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[var(--ink-mute)]">Tiểu sử</h3>
                        <div className="rounded-xl bg-[var(--card-soft)] p-4 text-[13.5px] leading-relaxed text-[var(--ink)] shadow-inner">
                            {person.tieu_su}
                        </div>
                    </div>
                )}

                <button type="button" onClick={() => router.visit(`/gia-pha/thanh-vien/${person.id}`)} className="gp-btn gp-btn-primary w-full mt-4">
                    Quản lý hồ sơ
                    <Icon name="arrow-right" size={15} />
                </button>

                {isMaster && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <button
                            type="button"
                            onClick={() => onEditQuick(person)}
                            className="gp-btn border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center gap-1.5 py-2 px-3 text-[13px] font-semibold rounded-lg transition animate-in fade-in duration-200"
                        >
                            <Icon name="edit" size={14} />
                            Sửa nhanh
                        </button>
                        <button
                            type="button"
                            onClick={() => onDeleteQuick(person)}
                            className="gp-btn border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-center gap-1.5 py-2 px-3 text-[13px] font-semibold rounded-lg transition animate-in fade-in duration-200"
                        >
                            <Icon name="trash" size={14} />
                            Xóa thành viên
                        </button>
                    </div>
                )}
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
