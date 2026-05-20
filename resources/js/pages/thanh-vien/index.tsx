import { Head, Link } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import toast from '../../lib/toast.util';
import { DongHo, dongHoApi, Nguoi, nguoiApi, NguoiPayload } from '../../services/gia-pha.api';

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

const buildPayload = (form: FormState): NguoiPayload => ({
    id_dong_ho: Number(form.id_dong_ho),
    ten_day_du: form.ten_day_du.trim(),
    gioi_tinh: form.gioi_tinh,
    ngay_sinh: toNullableString(form.ngay_sinh),
    da_mat: form.da_mat,
    ngay_mat: form.da_mat ? toNullableString(form.ngay_mat) : null,
    id_cha: toNullableNumber(form.id_cha),
    id_me: toNullableNumber(form.id_me),
    id_vo_chong_list: form.id_vo_chong_list.map(id => Number(id)).filter(id => !isNaN(id)),
    tieu_su: toNullableString(form.tieu_su),
    anh_dai_dien: toNullableString(form.anh_dai_dien),
    thu_tu_sinh: toNullableNumber(form.thu_tu_sinh),
});

export default function DanhSachThanhVien() {
    const [members, setMembers] = useState<Nguoi[]>([]);
    const [dongHos, setDongHos] = useState<DongHo[]>([]);
    const [selectedDongHo, setSelectedDongHo] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [isDauRe, setIsDauRe] = useState(false);
    const [quickAddMode, setQuickAddMode] = useState<'none' | 'child' | 'spouse'>('none');
    const [selectedParentId, setSelectedParentId] = useState<string>('');

    const filteredMembers = useMemo(() => {
        if (!selectedDongHo) {
            return members;
        }

        return members.filter((member) => String(member.id_dong_ho) === selectedDongHo);
    }, [members, selectedDongHo]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [dongHoResult, nguoiResult] = await Promise.all([dongHoApi.list(), nguoiApi.list(selectedDongHo)]);
            setDongHos(dongHoResult.data || []);
            setMembers(nguoiResult.data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [selectedDongHo]);

    useEffect(() => {
        if (loading || members.length === 0) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        const parentId = params.get('parent_id');
        const spouseId = params.get('spouse_id');

        if (action === 'add_child' && parentId) {
            const parent = members.find(m => m.id === Number(parentId));
            if (parent) {
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
                window.history.replaceState({}, '', window.location.pathname);
            }
        } else if (action === 'add_spouse' && spouseId) {
            const spouse = members.find(m => m.id === Number(spouseId));
            if (spouse) {
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
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    }, [loading, members]);

    const openCreateForm = () => {
        setIsDauRe(false);
        setQuickAddMode('none');
        setSelectedParentId('');
        setForm({
            ...emptyForm,
            id_dong_ho: selectedDongHo || (dongHos[0]?.id ? String(dongHos[0].id) : ''),
        });
        setFormOpen(true);
    };

    const openCreateSpouseForm = (member: Nguoi) => {
        setIsDauRe(true);
        setQuickAddMode('spouse');
        setSelectedParentId('');
        setForm({
            ...emptyForm,
            id_dong_ho: String(member.id_dong_ho),
            gioi_tinh: member.gioi_tinh === 'nam' ? 'nu' : 'nam',
            id_vo_chong_list: [String(member.id)],
        });
        setFormOpen(true);
    };

    const openCreateChildForm = (parent: Nguoi) => {
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

    const openEditForm = (member: Nguoi) => {
        setIsDauRe(!member.id_cha && !member.id_me && (member.vo_chong_ids || []).length > 0);
        setQuickAddMode('none');
        setSelectedParentId('');
        setForm({
            id: member.id,
            id_dong_ho: String(member.id_dong_ho),
            ten_day_du: member.ten_day_du,
            gioi_tinh: member.gioi_tinh,
            ngay_sinh: member.ngay_sinh || '',
            ngay_mat: member.ngay_mat || '',
            da_mat: Boolean(member.da_mat),
            id_cha: member.id_cha ? String(member.id_cha) : '',
            id_me: member.id_me ? String(member.id_me) : '',
            id_vo_chong_list: (member.vo_chong_ids || []).map(String),
            tieu_su: member.tieu_su || '',
            anh_dai_dien: member.anh_dai_dien || '',
            thu_tu_sinh: member.thu_tu_sinh ? String(member.thu_tu_sinh) : '',
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
                const autoMotherId = findSpouseIdFromChildren(members, value, 'id_me');
                const currentMotherId = canBeParentPair(members, value, currentForm.id_me) ? currentForm.id_me : '';

                return {
                    ...currentForm,
                    id_cha: value,
                    id_me: autoMotherId || currentMotherId,
                };
            }

            const autoFatherId = findSpouseIdFromChildren(members, value, 'id_cha');
            const currentFatherId = canBeParentPair(members, currentForm.id_cha, value) ? currentForm.id_cha : '';

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

        if (!canBeParentPair(members, form.id_cha, form.id_me)) {
            toast.error('Cha và mẹ không được là tổ tiên hoặc con cháu của nhau.');
            return;
        }

        if (form.id_vo_chong_list.length > 0) {
            const invalidSpouse = form.id_vo_chong_list.some(spouseId => {
                const spouse = getMemberById(members, spouseId);
                return spouse && !canSelectAsSpouse(members, spouse, form);
            });
            if (invalidSpouse) {
                toast.error('Có vợ/chồng không hợp lệ.');
                return;
            }
        }

        setSaving(true);
        try {
            const payload = buildPayload(form);
            const result = form.id
                ? await nguoiApi.update({ id: form.id, ...payload })
                : await nguoiApi.create(payload);

            if (result.success) {
                toast.success(result.message || 'Lưu thành công.');
                closeForm();
                await loadData();
            } else {
                toast.error(result.message || 'Không thể lưu dữ liệu.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (member: Nguoi) => {
        if (!window.confirm(`Xóa thành viên "${member.ten_day_du}"?`)) {
            return;
        }

        const result = await nguoiApi.delete(member.id);
        if (result.success) {
            toast.success(result.message || 'Xóa thành công.');
            await loadData();
        } else {
            toast.error(result.message || 'Không thể xóa thành viên.');
        }
    };

    const [searchTerm, setSearchTerm] = useState('');

    const displayedMembers = useMemo(() => {
        if (!searchTerm.trim()) return filteredMembers;
        const q = searchTerm.toLowerCase();
        return filteredMembers.filter((m) => m.ten_day_du.toLowerCase().includes(q));
    }, [filteredMembers, searchTerm]);

    const statsNam = filteredMembers.filter((m) => m.gioi_tinh === 'nam').length;
    const statsNu = filteredMembers.filter((m) => m.gioi_tinh === 'nu').length;
    const statsDaMat = filteredMembers.filter((m) => Boolean(m.da_mat)).length;

    return (
        <AuthenticatedLayout>
            <Head title="Danh sách thành viên" />
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Danh sách thành viên</h2>
                        <div className="mt-2 flex flex-wrap gap-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                👨 {statsNam} Nam
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">
                                👩 {statsNu} Nữ
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                ✝ {statsDaMat} Đã mất
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Tìm theo tên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                        </div>

                        <select
                            value={selectedDongHo}
                            onChange={(event) => setSelectedDongHo(event.target.value)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        >
                            <option value="">Tất cả dòng họ</option>
                            {dongHos.map((dongHo) => (
                                <option key={dongHo.id} value={dongHo.id}>{dongHo.ten_dong_ho}</option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={openCreateForm}
                            className="flex items-center gap-2 rounded-lg px-5 py-2 font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                            disabled={dongHos.length === 0}
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Thêm thành viên
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Họ và tên</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Dòng họ</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Giới tính</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Ngày sinh</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Trạng thái</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-sm font-medium text-gray-500">
                                            Đang tải dữ liệu...
                                        </td>
                                    </tr>
                                ) : filteredMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-sm font-medium text-gray-500">
                                            Chưa có thành viên nào.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMembers.map((member) => {
                                        const dongHo = dongHos.find((item) => item.id === member.id_dong_ho);
                                        const spouseNames = (member.vo_chong_ids || [])
                                            .map((spouseId) => getMemberById(members, spouseId)?.ten_day_du)
                                            .filter(Boolean)
                                            .join(', ');

                                        return (
                                            <tr key={member.id} className="transition hover:bg-emerald-50">
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 font-bold text-gray-600">
                                                            {member.ten_day_du.charAt(0)}
                                                        </div>
                                                        <div className="ml-4">
                                                            <Link href={`/gia-pha/thanh-vien/${member.id}`} className="text-sm font-semibold text-gray-900 hover:text-emerald-700">
                                                                {member.ten_day_du}
                                                            </Link>
                                                            <div className="text-xs text-gray-500">ID: #{member.id}</div>
                                                            {spouseNames && <div className="text-xs text-gray-500">Vợ/chồng: {spouseNames}</div>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{dongHo?.ten_dong_ho || `#${member.id_dong_ho}`}</td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${member.gioi_tinh === 'nam' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                                                        {member.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{member.ngay_sinh || '-'}</td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    {Boolean(member.da_mat) ? (
                                                        <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">Đã mất</span>
                                                    ) : (
                                                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Còn sống</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <button type="button" onClick={() => openCreateChildForm(member)} className="mr-4 font-semibold text-blue-600 hover:text-blue-900">
                                                        Thêm con
                                                    </button>
                                                    <button type="button" onClick={() => openCreateSpouseForm(member)} className="mr-4 font-semibold text-emerald-600 hover:text-emerald-900">
                                                        Thêm vợ/chồng
                                                    </button>
                                                    <button type="button" onClick={() => openEditForm(member)} className="mr-4 font-semibold text-indigo-600 hover:text-indigo-900">
                                                        Sửa
                                                    </button>
                                                    <button type="button" onClick={() => void handleDelete(member)} className="font-semibold text-red-600 hover:text-red-900">
                                                        Xóa
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {formOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
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
                                <div className="md:col-span-2 flex items-center gap-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                                    <span className="text-sm font-semibold text-gray-700">Vai trò dòng họ:</span>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!isDauRe}
                                            onChange={() => {
                                                setIsDauRe(false);
                                                // Reset vo chong if switching back to root member during creation
                                                if (!form.id) setForm(f => ({ ...f, id_vo_chong_list: [] }));
                                            }}
                                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-gray-700">Thành viên gốc (Có cha/mẹ)</span>
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
                                        <span className="text-sm text-gray-700">Dâu / Rể (Từ họ khác)</span>
                                    </label>
                                </div>
                            )}

                            <label className="md:col-span-2">
                                <span className="mb-1 block text-sm font-semibold text-gray-700">Họ và tên <span className="text-red-500">*</span></span>
                                <input
                                    type="text"
                                    required
                                    value={form.ten_day_du}
                                    onChange={(event) => setForm({ ...form, ten_day_du: event.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                />
                            </label>

                            <label>
                                <span className="mb-1 block text-sm font-semibold text-gray-700">Dòng họ <span className="text-red-500">*</span></span>
                                <select
                                    value={form.id_dong_ho}
                                    onChange={(event) => setForm({ ...form, id_dong_ho: event.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
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
                                <span className="mb-1 block text-sm font-semibold text-gray-700">Giới tính <span className="text-red-500">*</span></span>
                                <select
                                    value={form.gioi_tinh}
                                    onChange={(event) => setForm({ ...form, gioi_tinh: event.target.value as 'nam' | 'nu' })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    required
                                >
                                    <option value="nam">Nam</option>
                                    <option value="nu">Nữ</option>
                                </select>
                            </label>

                            <label>
                                <span className="mb-1 block text-sm font-semibold text-gray-700">Ngày sinh (Dương lịch)</span>
                                <input
                                    type="date"
                                    value={form.ngay_sinh}
                                    onChange={(event) => setForm({ ...form, ngay_sinh: event.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                />
                            </label>

                            <label>
                                <span className="mb-1 block text-sm font-semibold text-gray-700">Thứ tự sinh</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.thu_tu_sinh}
                                    onChange={(event) => setForm({ ...form, thu_tu_sinh: event.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    placeholder="Ví dụ: 1 (con trưởng)"
                                />
                            </label>

                            {quickAddMode !== 'child' && (
                                <label className="md:col-span-2">
                                    <span className="mb-1 block text-sm font-semibold text-gray-700">
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
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50 disabled:text-gray-500"
                                                disabled={quickAddMode === 'spouse'}
                                            >
                                                {members
                                                    .filter((member) => canSelectAsSpouse(members, member, form))
                                                    .map((member) => (
                                                        <option key={member.id} value={member.id}>
                                                            {member.ten_day_du}
                                                        </option>
                                                    ))}
                                            </select>
                                            <p className="mt-1 text-xs text-gray-500">Nhấn giữ Ctrl (Windows) hoặc Cmd (Mac) để chọn nhiều người.</p>
                                        </>
                                    ) : (
                                        <select
                                            value={form.id_vo_chong_list[0] || ''}
                                            onChange={(event) => {
                                                const val = event.target.value;
                                                setForm({ ...form, id_vo_chong_list: val ? [val] : [] });
                                            }}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50 disabled:text-gray-500"
                                            disabled={quickAddMode === 'spouse'}
                                        >
                                            <option value="">-- Chọn Vợ/chồng (tùy chọn) --</option>
                                            {members
                                                .filter((member) => canSelectAsSpouse(members, member, form))
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
                                        <span className="mb-1 block text-sm font-semibold text-gray-700">Cha</span>
                                        <select
                                            value={form.id_cha}
                                            onChange={(event) => handleParentChange('id_cha', event.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50 disabled:text-gray-500"
                                            disabled={quickAddMode === 'child' && String(form.id_cha) === selectedParentId}
                                        >
                                            <option value="">Không chọn</option>
                                            {members
                                                .filter((member) => member.gioi_tinh === 'nam' && canSelectAsParent(members, member, form, form.id_me))
                                                .map((member) => (
                                                    <option key={member.id} value={member.id}>
                                                        {member.ten_day_du}
                                                    </option>
                                                ))}
                                        </select>
                                    </label>

                                    <label>
                                        <span className="mb-1 block text-sm font-semibold text-gray-700">Mẹ</span>
                                        <select
                                            value={form.id_me}
                                            onChange={(event) => handleParentChange('id_me', event.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50 disabled:text-gray-500"
                                            disabled={quickAddMode === 'child' && String(form.id_me) === selectedParentId}
                                        >
                                            <option value="">Không chọn</option>
                                            {members
                                                .filter((member) => member.gioi_tinh === 'nu' && canSelectAsParent(members, member, form, form.id_cha))
                                                .map((member) => (
                                                    <option key={member.id} value={member.id}>
                                                        {member.ten_day_du}
                                                    </option>
                                                ))}
                                        </select>
                                    </label>
                                </>
                            )}

                            <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2">
                                <input
                                    type="checkbox"
                                    checked={form.da_mat}
                                    onChange={(event) => setForm({ ...form, da_mat: event.target.checked, ngay_mat: event.target.checked ? form.ngay_mat : '' })}
                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm font-semibold text-gray-700">Đã mất</span>
                            </label>

                            <label>
                                <span className="mb-1 block text-sm font-semibold text-gray-700">Ngày mất</span>
                                <input
                                    type="date"
                                    value={form.ngay_mat}
                                    onChange={(event) => setForm({ ...form, ngay_mat: event.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-100"
                                    disabled={!form.da_mat}
                                />
                            </label>

                            <label className="md:col-span-2">
                                <span className="mb-1 block text-sm font-semibold text-gray-700">Ảnh đại diện URL</span>
                                <input
                                    value={form.anh_dai_dien}
                                    onChange={(event) => setForm({ ...form, anh_dai_dien: event.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    placeholder="https://..."
                                />
                            </label>

                            <label className="md:col-span-2">
                                <span className="mb-1 block text-sm font-semibold text-gray-700">Tiểu sử</span>
                                <textarea
                                    value={form.tieu_su}
                                    onChange={(event) => setForm({ ...form, tieu_su: event.target.value })}
                                    className="min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                />
                            </label>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={closeForm} className="rounded-lg border border-gray-200 px-4 py-2 font-semibold text-gray-600 hover:bg-gray-50">
                                Hủy
                            </button>
                            <button type="submit" disabled={saving} className="rounded-lg px-5 py-2 font-semibold text-white shadow hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
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
