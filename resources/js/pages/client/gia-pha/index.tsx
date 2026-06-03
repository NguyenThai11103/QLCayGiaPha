import { Head, router } from '@inertiajs/react';
import { FormEvent, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../../components/gia-pha/Icon';
import { useAuth } from '../../../contexts/auth.context';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import toast from '../../../lib/toast.util';
import { DongHo, dongHoApi, Nguoi, nguoiApi } from '../../../services/gia-pha.api';
import FamilyTree from './components/FamilyTree';
import InviteMemberModal from './components/InviteMemberModal';
import MemberFormModal from './components/MemberFormModal';
import PersonPanel from './components/PersonPanel';
import {
    buildFamilyTree,
    buildPayload,
    canBeParentPair,
    canSelectAsSpouse,
    findSpouseIdFromChildren,
    getDepth,
    getMemberById,
} from './helpers/family-tree';
import { emptyForm, FormState, QuickAddMode } from './types';

export default function CayGiaPha() {
    const { user } = useAuth();
    const [people, setPeople] = useState<Nguoi[]>([]);
    const [dongHos, setDongHos] = useState<DongHo[]>([]);
    const [selectedDongHo, setSelectedDongHo] = useState('');
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(0.85);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [bloodlineOnly, setBloodlineOnly] = useState(true);
    const [selectedPerson, setSelectedPerson] = useState<Nguoi | null>(null);
    const [invitePerson, setInvitePerson] = useState<Nguoi | null>(null);
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
    const [quickAddMode, setQuickAddMode] = useState<QuickAddMode>('none');
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
                        return nextPeople.find((item) => item.id === current.id) || null;
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
        const firstSpouseId = parent.vo_chong_ids && parent.vo_chong_ids.length > 0 ? String(parent.vo_chong_ids[0]) : '';

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
        const isSpouse = !person.id_cha && !person.id_me && Boolean(person.vo_chong_ids && person.vo_chong_ids.length > 0);
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
        const isConfirmed = window.confirm(
            `Bạn có chắc chắn muốn xóa thành viên "${person.ten_day_du}" khỏi gia phả không?\nLưu ý: Hành động này không thể hoàn tác!`,
        );
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
            const invalidSpouse = form.id_vo_chong_list.some((spouseId) => {
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
                if (selectedPerson.gioi_tinh === 'nam') {
                    payload.id_cha = selectedPerson.id;
                } else {
                    payload.id_me = selectedPerson.id;
                }
            } else if (quickAddMode === 'spouse' && selectedPerson) {
                payload.id_vo_chong = selectedPerson.id;
            } else if (quickAddMode === 'parent' && selectedPerson) {
                if ((selectedPerson.doi_thu ?? 1) !== 1) {
                    toast.error('Chỉ có thể thêm cha/mẹ cho thành viên đang ở đời 1.');
                    return;
                }
                payload.id_con = selectedPerson.id;
            }

            const result = form.id ? await nguoiApi.update({ id: form.id, ...payload }) : await nguoiApi.create(payload);

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
                        viewport.scrollLeft = absoluteLeft - viewportRect.width / 2 + rootRect.width / 2;
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
            el.requestFullscreen()
                .then(() => setIsFullscreen(true))
                .catch(() => {});
        } else {
            document
                .exitFullscreen()
                .then(() => setIsFullscreen(false))
                .catch(() => {});
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
                if (formOpen) {
                    closeForm();
                    e.preventDefault();
                    return;
                }
                if (selectedPerson) {
                    setSelectedPerson(null);
                    e.preventDefault();
                    return;
                }
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

            if (e.key === '+' || e.key === '=') {
                zoomIn();
                e.preventDefault();
            } else if (e.key === '-') {
                zoomOut();
                e.preventDefault();
            } else if (e.key === '0') {
                fit();
                e.preventDefault();
            } else if (e.key === 'f' || e.key === 'F') {
                toggleFullscreen();
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [formOpen, selectedPerson, toggleFullscreen]);

    useEffect(() => {
        if (!searchTerm) return;
        const delaySearch = setTimeout(() => {
            const matchedPerson = people.find((p) => p.ten_day_du.toLowerCase().includes(searchTerm.toLowerCase()));
            if (matchedPerson && treeViewportRef.current) {
                const viewport = treeViewportRef.current;
                const el = document.getElementById(`person-card-${matchedPerson.id}`);
                if (el) {
                    const viewportRect = viewport.getBoundingClientRect();
                    const elRect = el.getBoundingClientRect();

                    const absoluteLeft = viewport.scrollLeft + (elRect.left - viewportRect.left);
                    const absoluteTop = viewport.scrollTop + (elRect.top - viewportRect.top);

                    viewport.scrollTo({
                        left: absoluteLeft - viewportRect.width / 2 + elRect.width / 2,
                        top: absoluteTop - viewportRect.height / 2 + elRect.height / 2,
                        behavior: 'smooth',
                    });
                }
            }
        }, 500);
        return () => clearTimeout(delaySearch);
    }, [searchTerm, people]);

    // Search suggestions: filter people matching searchTerm
    const searchSuggestions = searchTerm.trim().length >= 1
        ? people
            .filter((p) => p.ten_day_du.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 7)
        : [];

    const handleSelectSuggestion = (person: Nguoi) => {
        setSearchTerm(person.ten_day_du);
        setSearchFocused(false);
        setSelectedPerson(person);
        if (treeViewportRef.current) {
            const viewport = treeViewportRef.current;
            const el = document.getElementById(`person-card-${person.id}`);
            if (el) {
                const viewportRect = viewport.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();
                const absoluteLeft = viewport.scrollLeft + (elRect.left - viewportRect.left);
                const absoluteTop = viewport.scrollTop + (elRect.top - viewportRect.top);
                viewport.scrollTo({
                    left: absoluteLeft - viewportRect.width / 2 + elRect.width / 2,
                    top: absoluteTop - viewportRect.height / 2 + elRect.height / 2,
                    behavior: 'smooth',
                });
            }
        }
    };

    return (
        <AuthenticatedLayout fullBleed>
            <Head title="Cây Gia Phả" />
            <div ref={containerRef} className="flex min-h-[calc(100vh-64px)] flex-col bg-[var(--bg)]">

                {/* ═══════════════════════════════════════════
                    TOOLBAR
                ═══════════════════════════════════════════ */}
                <div className="border-b border-[var(--line)] bg-[var(--bg-elev)] shadow-sm">

                    {/* Row 1 – Title + primary action */}
                    <div className="flex items-center justify-between gap-4 px-5 pt-3 pb-2">
                        <div className="min-w-0">
                            <div className="gp-eyebrow">{selectedDongHoName || 'Toàn bộ gia tộc'}</div>
                            <h1 className="mt-0.5 font-serif text-[clamp(22px,3vw,28px)] leading-tight font-semibold text-[var(--ink)]">
                                Cây Gia Phả
                            </h1>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            {/* Stats chips */}
                            <div className="hidden items-center gap-2 lg:flex">
                                <StatChip
                                    color="emerald"
                                    label="Còn sống"
                                    value={people.length - deceased}
                                    pulse
                                />
                                <StatChip color="amber" label="Đời" value={depth || 1} />
                                <StatChip color="blue" label="Thành viên" value={people.length} />
                            </div>

                            {['truong_toc', 'quan_ly'].includes(user?.quyen_han || '') && (
                                <button
                                    type="button"
                                    onClick={() => router.visit('/gia-pha/thanh-vien')}
                                    className="gp-btn gp-btn-primary"
                                >
                                    <Icon name="plus" size={15} />
                                    Thêm thành viên
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Row 2 – Controls */}
                    <div className="flex flex-wrap items-center gap-2 px-5 pb-3">

                        {/* Clan selector */}
                        <select
                            value={selectedDongHo}
                            onChange={(e) => {
                                setSelectedDongHo(e.target.value);
                                setSearchTerm('');
                            }}
                            className="gp-input h-9 min-w-[180px] py-0 text-[13px]"
                        >
                            <option value="">Tất cả gia tộc</option>
                            {dongHos.map((dongHo) => (
                                <option key={dongHo.id} value={dongHo.id}>
                                    {dongHo.ten_dong_ho}
                                </option>
                            ))}
                        </select>

                        {/* ── Search with dropdown ── */}
                        <div className="relative">
                            <div className={`flex items-center gap-2 rounded-xl border bg-[var(--card)] px-3 py-0 transition-all duration-200 ${searchFocused ? 'border-[var(--gold)] shadow-[0_0_0_3px_var(--gold-glow)]' : 'border-[var(--card-border)]'}`}>
                                <Icon
                                    name="search"
                                    size={14}
                                    className={`shrink-0 transition-colors ${searchFocused ? 'text-[var(--gold)]' : 'text-[var(--ink-mute)]'}`}
                                />
                                <input
                                    id="search-member-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                                    className="h-9 w-[220px] bg-transparent text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
                                    placeholder="Tìm thành viên... (Ctrl+F)"
                                    autoComplete="off"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--card-border)] text-[var(--ink-mute)] transition hover:bg-[var(--ink-mute)] hover:text-white"
                                    >
                                        <Icon name="x" size={10} />
                                    </button>
                                )}
                            </div>

                            {/* Suggestions dropdown */}
                            {searchFocused && searchSuggestions.length > 0 && (
                                <div className="gp-pop-in absolute top-[calc(100%+6px)] left-0 z-[100] w-[320px] overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-[var(--shadow-lg)]">
                                    <div className="border-b border-[var(--line)] px-3 py-2">
                                        <span className="text-[10.5px] font-bold tracking-widest text-[var(--ink-mute)] uppercase">
                                            {searchSuggestions.length} kết quả
                                        </span>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {searchSuggestions.map((person, idx) => {
                                            const isMale = person.gioi_tinh === 'nam';
                                            const isDead = Boolean(person.da_mat);
                                            const birthYear = person.ngay_sinh?.substring(0, 4);
                                            return (
                                                <button
                                                    key={person.id}
                                                    type="button"
                                                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--card-soft)]"
                                                    style={{ animationDelay: `${idx * 30}ms` }}
                                                    onMouseDown={() => handleSelectSuggestion(person)}
                                                >
                                                    {/* Avatar */}
                                                    <span
                                                        className={`grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-bold text-white ${isDead ? 'opacity-70' : ''}`}
                                                        style={{
                                                            background: isDead
                                                                ? 'linear-gradient(135deg,#9b8a6a,#6b5232)'
                                                                : isMale
                                                                    ? 'linear-gradient(135deg,var(--jade),var(--jade-soft))'
                                                                    : 'linear-gradient(135deg,var(--terracotta),var(--crimson))',
                                                        }}
                                                    >
                                                        {person.anh_dai_dien ? (
                                                            <img src={person.anh_dai_dien} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            person.ten_day_du.charAt(0)
                                                        )}
                                                    </span>
                                                    {/* Info */}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="truncate text-[13px] font-semibold text-[var(--ink)]">
                                                            {person.ten_day_du}
                                                        </div>
                                                        <div className="text-[11px] text-[var(--ink-mute)]">
                                                            {isMale ? '♂ Nam' : '♀ Nữ'}
                                                            {person.doi_thu ? ` · Đời ${person.doi_thu}` : ''}
                                                            {birthYear ? ` · ${birthYear}` : ''}
                                                            {isDead ? ' · Đã mất' : ''}
                                                        </div>
                                                    </div>
                                                    <Icon name="arrow-right" size={13} className="shrink-0 text-[var(--ink-mute)]" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <span className="hidden h-6 w-px bg-[var(--line)] lg:block" />

                        {/* ── Zoom controls ── */}
                        <div className="flex items-center rounded-xl border border-[var(--card-border)] bg-[var(--card-soft)] p-1 shadow-sm">
                            <button
                                type="button"
                                onClick={zoomOut}
                                disabled={zoom <= 0.4}
                                className="grid h-7 w-7 place-items-center rounded-lg text-[var(--ink-soft)] transition hover:bg-[var(--card)] hover:text-[var(--ink)] disabled:opacity-30"
                                title="Thu nhỏ (-)"
                            >
                                <Icon name="minus" size={13} />
                            </button>
                            <button
                                type="button"
                                onClick={fit}
                                className="min-w-12 rounded-lg px-1 text-[11.5px] font-bold text-[var(--ink-soft)] transition hover:bg-[var(--card)] hover:text-[var(--ink)]"
                                title="Đặt lại zoom (0)"
                            >
                                {Math.round(zoom * 100)}%
                            </button>
                            <button
                                type="button"
                                onClick={zoomIn}
                                disabled={zoom >= 1.4}
                                className="grid h-7 w-7 place-items-center rounded-lg text-[var(--ink-soft)] transition hover:bg-[var(--card)] hover:text-[var(--ink)] disabled:opacity-30"
                                title="Phóng to (+)"
                            >
                                <Icon name="plus" size={13} />
                            </button>
                        </div>

                        {/* ── View toggles ── */}
                        <div className="flex items-center rounded-xl border border-[var(--card-border)] bg-[var(--card-soft)] p-1 shadow-sm">
                            <button
                                type="button"
                                onClick={fit}
                                className="grid h-7 w-7 place-items-center rounded-lg text-[var(--ink-soft)] transition hover:bg-[var(--card)] hover:text-[var(--ink)]"
                                title="Khớp màn hình (0)"
                            >
                                <Icon name="fit" size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                className="grid h-7 w-7 place-items-center rounded-lg text-[var(--ink-soft)] transition hover:bg-[var(--card)] hover:text-[var(--ink)]"
                                title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình (F)'}
                            >
                                <Icon name={isFullscreen ? 'minus' : 'fit'} size={14} />
                            </button>
                            <span className="mx-1 h-4 w-px bg-[var(--line)]" />
                            <button
                                type="button"
                                onClick={() => setBloodlineOnly((v) => !v)}
                                className={`flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11.5px] font-bold transition ${
                                    bloodlineOnly
                                        ? 'bg-[var(--jade)] text-white shadow-sm'
                                        : 'text-[var(--ink-soft)] hover:bg-[var(--card)] hover:text-[var(--ink)]'
                                }`}
                                title="Chế độ huyết thống"
                            >
                                <Icon name="branch" size={13} />
                                <span className="hidden sm:inline">Huyết thống</span>
                            </button>
                        </div>

                        {/* ── Export group ── */}
                        <div className="flex items-center rounded-xl border border-[var(--card-border)] bg-[var(--card-soft)] p-1 shadow-sm">
                            <button
                                type="button"
                                onClick={exportTreeImage}
                                disabled={exporting || loading || treeData.length === 0}
                                className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11.5px] font-semibold text-[var(--ink-soft)] transition hover:bg-[var(--card)] hover:text-[var(--ink)] disabled:opacity-30"
                                title="Xuất ảnh SVG"
                            >
                                <Icon name="photo" size={13} />
                                {exporting ? '...' : 'SVG'}
                            </button>
                            <span className="mx-0.5 h-4 w-px bg-[var(--line)]" />
                            <button
                                type="button"
                                onClick={printTree}
                                disabled={loading || treeData.length === 0}
                                className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11.5px] font-semibold text-[var(--ink-soft)] transition hover:bg-[var(--card)] hover:text-[var(--ink)] disabled:opacity-30"
                                title="In / Lưu PDF"
                            >
                                <Icon name="book" size={13} />
                                PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════
                    TREE CANVAS
                ═══════════════════════════════════════════ */}
                <div className="relative flex min-h-0 flex-1 overflow-hidden bg-[var(--bg)]">
                    <FamilyTree
                        loading={loading}
                        treeData={treeData}
                        zoom={zoom}
                        genPositions={genPositions}
                        searchTerm={searchTerm}
                        bloodlineOnly={bloodlineOnly}
                        selectedPerson={selectedPerson}
                        isDraggingTree={isDraggingTree}
                        canManage={['truong_toc', 'quan_ly'].includes(user?.quyen_han || '')}
                        treeViewportRef={treeViewportRef}
                        treeScaleRef={treeScaleRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onSelectPerson={setSelectedPerson}
                        onAddFirstMember={() => router.visit('/gia-pha/thanh-vien')}
                    />

                    {selectedPerson && (
                        <>
                            <div
                                className="absolute inset-0 z-40 bg-black/25 backdrop-blur-[2px] transition-opacity"
                                onClick={() => setSelectedPerson(null)}
                            />
                            <aside className="absolute top-0 right-0 bottom-0 z-50 w-[420px] max-w-[92vw] border-l border-[var(--line)] shadow-2xl">
                                <PersonPanel
                                    person={selectedPerson}
                                    people={people}
                                    isMaster={['truong_toc', 'quan_ly'].includes(user?.quyen_han || '')}
                                    onClose={() => setSelectedPerson(null)}
                                    onAddChild={handleAddChildQuick}
                                    onAddSpouse={handleAddSpouseQuick}
                                    onAddParent={handleAddParentQuick}
                                    onInvite={setInvitePerson}
                                    onEditQuick={handleEditQuick}
                                    onDeleteQuick={handleDeleteQuick}
                                />
                            </aside>
                        </>
                    )}
                </div>
            </div>

            {formOpen && (
                <MemberFormModal
                    form={form}
                    setForm={setForm}
                    dongHos={dongHos}
                    people={people}
                    isDauRe={isDauRe}
                    setIsDauRe={setIsDauRe}
                    quickAddMode={quickAddMode}
                    selectedParentId={selectedParentId}
                    saving={saving}
                    onClose={closeForm}
                    onSubmit={handleSubmit}
                    onParentChange={handleParentChange}
                />
            )}

            {invitePerson && (
                <InviteMemberModal
                    person={invitePerson}
                    onClose={() => setInvitePerson(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}

// ─── StatChip helper ───
function StatChip({
    color,
    label,
    value,
    pulse,
}: {
    color: 'emerald' | 'amber' | 'blue';
    label: string;
    value: number;
    pulse?: boolean;
}) {
    const colorMap = {
        emerald : { border: 'border-emerald-200', bg: 'bg-emerald-50/60', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        amber   : { border: 'border-amber-200',   bg: 'bg-amber-50/60',   text: 'text-amber-700',   dot: 'bg-amber-400'  },
        blue    : { border: 'border-sky-200',      bg: 'bg-sky-50/60',     text: 'text-sky-700',     dot: 'bg-sky-400'    },
    };
    const c = colorMap[color];
    return (
        <div className={`flex items-center gap-1.5 rounded-full border ${c.border} ${c.bg} px-3 py-1 text-[12px] font-medium ${c.text}`}>
            {pulse ? (
                <span className="relative flex h-2 w-2">
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${c.dot} opacity-70`} />
                    <span className={`relative inline-flex h-2 w-2 rounded-full ${c.dot}`} />
                </span>
            ) : (
                <span className={`h-2 w-2 rounded-full ${c.dot}`} />
            )}
            <span className="whitespace-nowrap">{label}: <span className="font-bold">{value}</span></span>
        </div>
    );
}
