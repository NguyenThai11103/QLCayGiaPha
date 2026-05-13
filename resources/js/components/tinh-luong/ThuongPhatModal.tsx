import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import apiClient from '../../lib/api.client';
import { confirmAction, confirmDelete } from '../../lib/swal';

interface ThuongPhat {
    id           : number;
    id_nhan_vien : number;
    type         : number;
    type_text    : string;
    so_tien      : number;
    ly_do        : string;
    thoi_gian    : string;
    is_done      : number;
}

interface ThuongPhatModalProps {
    isOpen       : boolean;
    onClose      : () => void;
    nhanVienId   : number;
    nhanVienName : string;
    onSuccess    : () => void;
}

export default function ThuongPhatModal({ isOpen, onClose, nhanVienId, nhanVienName, onSuccess }: ThuongPhatModalProps) {
    const [thuongPhats, setThuongPhats] = useState<ThuongPhat[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFormVisible, setIsFormVisible] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // Form state (không có is_done vì chỉ admin mới duyệt được)
    const getCurrentMonth = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    };

    const [formData, setFormData] = useState({
        type      : 1,
        so_tien   : '',
        ly_do     : '',
        thoi_gian : getCurrentMonth(),
    });

    // Fetch danh sách thưởng phạt của nhân viên
    const fetchThuongPhats = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const response = await apiClient.get('/thuong-phat', {
                params: { id_nhan_vien: nhanVienId },
            });

            if (response.data.success) {
                setThuongPhats(response.data.data.data);
            }
        } catch (error: any) {
            console.error('Error fetching thuong phat:', error);
            toast.error('Không thể tải dữ liệu thưởng phạt');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    // Check quyền admin
    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const response = await apiClient.get('/auth/me');
                setIsAdmin(response.data.data.is_master === 1);
            } catch (error) {
                console.error('Error checking admin:', error);
            }
        };
        checkAdmin();
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchThuongPhats();
            setIsFormVisible(true);
            setEditingId(null);
            resetForm();
        }
    }, [isOpen, nhanVienId]);

    const resetForm = () => {
        setFormData({
            type      : 1,
            so_tien   : '',
            ly_do     : '',
            thoi_gian : getCurrentMonth(),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload = {
                id_nhan_vien : nhanVienId,
                type         : formData.type,
                so_tien      : parseInt(formData.so_tien),
                ly_do        : formData.ly_do,
                thoi_gian    : formData.thoi_gian,
            };

            if (editingId) {
                await apiClient.post(`/thuong-phat/update/${editingId}`, payload);
                toast.success('Cập nhật thành công');
            } else {
                await apiClient.post('/thuong-phat', payload);
                toast.success('Thêm thưởng/phạt thành công');
            }

            fetchThuongPhats(false);
            onSuccess();
            setEditingId(null);
            resetForm();
        } catch (error: any) {
            console.error('Error submitting:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleEdit = (item: ThuongPhat) => {
        // Chuyển về YYYY-MM nếu server trả về YYYY-MM-DD
        const monthValue = item.thoi_gian ? item.thoi_gian.substring(0, 7) : getCurrentMonth();
        setFormData({
            type      : item.type,
            so_tien   : item.so_tien.toString(),
            ly_do     : item.ly_do,
            thoi_gian : monthValue,
        });
        setEditingId(item.id);
        setIsFormVisible(true);
    };

    // Duyệt thưởng phạt (chỉ admin, không có hủy)
    const handleApprove = async (id: number) => {
        if (!isAdmin) {
            toast.error('Chỉ admin mới có quyền duyệt thưởng/phạt');
            return;
        }

        if (!(await confirmAction('Bạn có chắc chắn muốn duyệt thưởng/phạt này?', { title: 'Duyệt thưởng/phạt', confirmText: 'Duyệt' }))) return;

        try {
            await apiClient.post(`/thuong-phat/update-status/${id}`, {
                is_done: 1,
            });
            toast.success('Duyệt thành công');
            setThuongPhats(prev => prev.map(item => item.id === id ? { ...item, is_done: 1 } : item));
            onSuccess();
        } catch (error: any) {
            console.error('Error approving:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async (id: number) => {
        if (!(await confirmDelete())) return;

        try {
            await apiClient.post(`/thuong-phat/delete/${id}`);
            toast.success('Xóa thành công');
            setThuongPhats(prev => prev.filter(item => item.id !== id));
            onSuccess();
        } catch (error: any) {
            console.error('Error deleting:', error);
            toast.error('Xóa thất bại');
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style    : 'currency',
            currency : 'VND',
        }).format(value);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,10,40,0.75)', backdropFilter: 'blur(8px)' }}
        >
            <div
                className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-[0_32px_80px_-12px_rgba(238,49,39,0.3)]"
                style={{ animation: 'tpModalIn 0.28s cubic-bezier(0.22,1,0.36,1)' }}
            >
                <style>{`
                    @keyframes tpModalIn {
                        from { opacity:0; transform:translateY(24px) scale(0.97); }
                        to   { opacity:1; transform:translateY(0) scale(1); }
                    }
                `}</style>

                {/* HEADER */}
                <div className="relative overflow-hidden px-8 py-6"
                    style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
                >
                    <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full opacity-20"
                        style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
                    <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full opacity-15"
                        style={{ background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)' }} />

                    <div className="relative flex flex-wrap items-center justify-between gap-4">
                        {/* Title */}
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 shadow-inner">
                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold tracking-tight text-white">Thưởng / Phạt</h3>
                                <p className="mt-0.5 text-xs font-medium text-emerald-100">{nhanVienName}</p>
                            </div>
                        </div>

                        {/* Close */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="group flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/25 hover:scale-105"
                            >
                                <svg className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Inline Form */}
                    {isFormVisible && (
                        <form onSubmit={handleSubmit} className="relative mt-5 rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur-sm">
                            <p className="mb-3 text-sm font-bold text-white">{editingId ? 'Chỉnh sửa' : 'Thêm thưởng/phạt mới'}</p>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-emerald-100">Loại</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) })}
                                        className="w-full rounded-xl border-0 bg-white/90 px-3 py-2 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-white"
                                        required
                                    >
                                        <option value={1}>Thưởng</option>
                                        <option value={0}>Phạt</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-emerald-100">Số tiền</label>
                                    <input
                                        type="number" min="0"
                                        value={formData.so_tien}
                                        onChange={(e) => setFormData({ ...formData, so_tien: e.target.value })}
                                        placeholder="Nhập số tiền"
                                        required
                                        className="w-full rounded-xl border-0 bg-white/90 px-3 py-2 text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-emerald-100">Tháng</label>
                                    <div className="flex gap-1.5">
                                        <select
                                            value={formData.thoi_gian.split('-')[1] ?? ''}
                                            onChange={(e) => {
                                                const [year] = formData.thoi_gian.split('-');
                                                setFormData({ ...formData, thoi_gian: `${year}-${e.target.value}` });
                                            }}
                                            required
                                            className="flex-1 rounded-xl border-0 bg-white/90 px-2 py-2 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-white"
                                        >
                                            {['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'].map((label, i) => (
                                                <option key={i+1} value={String(i+1).padStart(2,'0')}>{label}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={formData.thoi_gian.split('-')[0] ?? ''}
                                            onChange={(e) => {
                                                const [, month] = formData.thoi_gian.split('-');
                                                setFormData({ ...formData, thoi_gian: `${e.target.value}-${month}` });
                                            }}
                                            required
                                            className="w-24 rounded-xl border-0 bg-white/90 px-2 py-2 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-white"
                                        >
                                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                            </div>
                            <div className="mt-3">
                                <label className="mb-1 block text-xs font-semibold text-emerald-100">Lý do</label>
                                <textarea
                                    value={formData.ly_do}
                                    onChange={(e) => setFormData({ ...formData, ly_do: e.target.value })}
                                    placeholder="Nhập lý do thưởng/phạt"
                                    rows={2} required
                                    className="w-full rounded-xl border-0 bg-white/90 px-3 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white resize-none"
                                />
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                                <button type="submit"
                                    className="rounded-xl bg-white px-5 py-2 text-sm font-bold text-[#059669] shadow-md transition hover:shadow-lg active:scale-95"
                                >
                                    {editingId ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                                <button type="button"
                                    onClick={() => { setEditingId(null); resetForm(); }}
                                    className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-95"
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* BODY */}
                <div className="max-h-[55vh] overflow-y-auto bg-slate-50/60 px-6 pt-5 pb-4">
                    {loading ? (
                        <div className="flex min-h-[200px] items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-100 border-t-[#059669]"></div>
                                <span className="text-sm font-semibold text-emerald-400 tracking-wide">Đang tải...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/80">
                                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">Loại</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">Số tiền</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">Tháng</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">Lý do</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 text-center">Trạng thái</th>
                                        {isAdmin && <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 text-center">Thao tác</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {thuongPhats.length === 0 ? (
                                        <tr>
                                            <td colSpan={isAdmin ? 6 : 5} className="px-6 py-14 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                                                        <svg className="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 1v1" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-600">Chưa có dữ liệu</p>
                                                    <p className="text-xs text-slate-400">Nhấn "+ Thêm mới" để bắt đầu</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        thuongPhats.map((item, idx) => (
                                            <tr
                                                key={item.id}
                                                className="group transition-colors duration-150 hover:bg-emerald-50/50"
                                                style={{ background: idx % 2 === 0 ? 'white' : 'rgba(248,248,255,0.6)' }}
                                            >
                                                <td className="px-4 py-3.5">
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${item.type === 1 ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200'}`}>
                                                        {item.type_text}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 font-semibold text-slate-700">
                                                    {formatCurrency(item.so_tien)}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                                                        {item.thoi_gian ? item.thoi_gian.substring(0, 7).split('-').reverse().join('/') : ''}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-sm text-slate-600 max-w-[180px] truncate" title={item.ly_do}>
                                                    {item.ly_do || <span className="italic text-slate-300 text-xs">—</span>}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${item.is_done === 1 ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-slate-100 text-slate-500'}`}>
                                                        {item.is_done === 1 ? '✓ Hoàn thành' : '○ Chờ duyệt'}
                                                    </span>
                                                </td>
                                                {isAdmin && (
                                                    <td className="px-4 py-3.5 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {item.is_done === 0 && (
                                                                <button onClick={() => handleApprove(item.id)}
                                                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-50 text-green-600 transition hover:bg-green-100 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                                                                    title="Duyệt">
                                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            {item.is_done === 0 && (
                                                                <button onClick={() => handleEdit(item)}
                                                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                                                                    title="Sửa">
                                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleDelete(item.id)}
                                                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                                                                title="Xóa">
                                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-between border-t border-slate-100 bg-white px-7 py-3.5">
                    <span className="text-xs font-medium text-slate-400">{thuongPhats.length} bản ghi</span>
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 hover:shadow active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}

