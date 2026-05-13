import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import apiClient from '../../lib/api.client';
import { confirmDelete } from '../../lib/swal';

interface ThuongPhat {
    id              : number;
    id_nhan_vien    : number;
    nhan_vien_name  : string;
    type            : number;
    type_text       : string;
    so_tien         : number;
    ly_do           : string;
    thoi_gian       : string;
    is_done         : number;
}

interface AllThuongPhatModalProps {
    isOpen    : boolean;
    onClose   : () => void;
    onSuccess : () => void;
}

export default function AllThuongPhatModal({ isOpen, onClose, onSuccess }: AllThuongPhatModalProps) {
    const [thuongPhats, setThuongPhats] = useState<ThuongPhat[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [filterType, setFilterType] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterMonth, setFilterMonth] = useState<string>('');

    // Generate last 12 months
    const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return {
            value : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label : `Tháng ${String(d.getMonth() + 1).padStart(2, '0')}`,
            year  : `${d.getFullYear()}`,
        };
    });

    const currentMonthValue = months[0]?.value ?? '';
    const [selectedMonthDisplay, setSelectedMonthDisplay] = useState(months[0]?.label ?? '');
    const [selectedYearDisplay, setSelectedYearDisplay] = useState(months[0]?.year ?? '');

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const response = await apiClient.get('/auth/me');
                setIsAdmin(response.data.data.is_master === 1);
            } catch {}
        };
        checkAdmin();
    }, []);

    const fetchAllThuongPhats = async (page = 1) => {
        try {
            setLoading(true);
            const params: any = { page, per_page: 15 };
            if (filterType !== '') params.type = filterType;
            if (filterStatus !== '') params.is_done = filterStatus;
            if (filterMonth) params.month = filterMonth;

            const response = await apiClient.get('/thuong-phat', { params });
            if (response.data.success) {
                setThuongPhats(response.data.data.data);
                setCurrentPage(response.data.data.current_page);
                setTotalPages(response.data.data.last_page);
                setTotalItems(response.data.data.total);
            }
        } catch (error: any) {
            toast.error('Không thể tải dữ liệu thưởng phạt');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchAllThuongPhats(1);
    }, [isOpen, filterType, filterStatus, filterMonth]);

    const handleApprove = async (id: number) => {
        if (!isAdmin) { toast.error('Chỉ admin mới có quyền duyệt'); return; }
        try {
            await apiClient.post(`/thuong-phat/update-status/${id}`, { is_done: 1 });
            toast.success('Duyệt thành công');
            setThuongPhats(prev => prev.map(item => item.id === id ? { ...item, is_done: 1 } : item));
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async (id: number) => {
        if (!isAdmin) { toast.error('Chỉ admin mới có quyền xóa'); return; }
        if (!(await confirmDelete())) return;
        try {
            await apiClient.post(`/thuong-phat/delete/${id}`);
            toast.success('Xóa thành công');
            setThuongPhats(prev => prev.filter(item => item.id !== id));
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Xóa thất bại');
        }
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* ── HEADER ── */}
                <div
                    className="relative flex items-center justify-between px-6 py-5"
                    style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 40%, #4f46e5 100%)' }}
                >
                    {/* Left: icon + title */}
                    <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Danh sách thưởng phạt</h3>
                            <p className="text-sm text-white/70">Quản lý toàn bộ thưởng &amp; phạt nhân viên</p>
                        </div>
                    </div>

                    {/* Right: filters + close */}
                    <div className="flex items-center gap-2">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="rounded-lg border border-white/30 bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm outline-none transition hover:bg-white/25 focus:ring-2 focus:ring-white/40"
                        >
                            <option value="" className="text-gray-800">Tất cả loại</option>
                            <option value="1" className="text-gray-800">Thưởng</option>
                            <option value="0" className="text-gray-800">Phạt</option>
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="rounded-lg border border-white/30 bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm outline-none transition hover:bg-white/25 focus:ring-2 focus:ring-white/40"
                        >
                            <option value="" className="text-gray-800">Tất cả trạng thái</option>
                            <option value="0" className="text-gray-800">Chưa duyệt</option>
                            <option value="1" className="text-gray-800">Đã duyệt</option>
                        </select>

                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="rounded-lg border border-white/30 bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm outline-none transition hover:bg-white/25 focus:ring-2 focus:ring-white/40"
                        >
                            <option value="" className="text-gray-800">Tất cả tháng</option>
                            {months.map(m => (
                                <option key={m.value} value={m.value} className="text-gray-800">
                                    {m.label} / {m.year}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={onClose}
                            className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white transition hover:bg-white/30 active:scale-95"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ── TABLE HEADER ── */}
                <div className="grid grid-cols-12 items-center border-b border-gray-100 bg-gray-50/80 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                    <div className="col-span-3">Nhân viên</div>
                    <div className="col-span-2">Loại</div>
                    <div className="col-span-3">Số tiền</div>
                    <div className="col-span-2">Ngày</div>
                    <div className="col-span-1 text-center">Trạng thái</div>
                    <div className="col-span-1 text-center">Thao tác</div>
                </div>

                {/* ── BODY ── */}
                <div className="max-h-[440px] overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-violet-600"></div>
                            <p className="mt-3 text-sm">Đang tải dữ liệu...</p>
                        </div>
                    ) : thuongPhats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <svg className="mb-3 h-12 w-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="font-medium">Không có dữ liệu</p>
                        </div>
                    ) : (
                        thuongPhats.map((item, idx) => (
                            <div
                                key={item.id}
                                className={`grid grid-cols-12 items-center px-6 py-3.5 text-sm transition hover:bg-violet-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                            >
                                {/* Nhân viên */}
                                <div className="col-span-3 flex items-center">
                                    <span className="truncate font-medium text-gray-800">{item.nhan_vien_name}</span>
                                </div>

                                {/* Loại */}
                                <div className="col-span-2">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                        item.type === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {item.type === 1 ? '🎁' : '⚠️'} {item.type_text}
                                    </span>
                                </div>

                                {/* Số tiền + lý do */}
                                <div className="col-span-3">
                                    <p className={`font-bold ${item.type === 1 ? 'text-green-600' : 'text-red-500'}`}>
                                        {item.type === 1 ? '+' : '-'}{formatCurrency(item.so_tien)}
                                    </p>
                                    <p className="truncate text-xs text-gray-400">{item.ly_do}</p>
                                </div>

                                {/* Ngày */}
                                <div className="col-span-2 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <svg className="h-3.5 w-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(item.thoi_gian).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>

                                {/* Trạng thái */}
                                <div className="col-span-1 flex justify-center">
                                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                        item.is_done === 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                        {item.is_done === 1 ? '✓' : '○'}
                                    </span>
                                </div>

                                {/* Thao tác */}
                                <div className="col-span-1 flex justify-center gap-1.5">
                                    {isAdmin && item.is_done === 0 && (
                                        <button
                                            onClick={() => handleApprove(item.id)}
                                            title="Duyệt"
                                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:bg-emerald-500 hover:text-white active:scale-95"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                    )}
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            title="Xóa"
                                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white active:scale-95"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ── FOOTER ── */}
                <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-6 py-3">
                    <span className="text-sm text-gray-500">
                        <span className="font-semibold text-gray-700">{totalItems}</span> kết quả
                    </span>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => fetchAllThuongPhats(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-violet-400 hover:text-violet-600 disabled:opacity-40"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                const page = totalPages <= 5 ? i + 1
                                    : currentPage <= 3 ? i + 1
                                    : currentPage >= totalPages - 2 ? totalPages - 4 + i
                                    : currentPage - 2 + i;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => fetchAllThuongPhats(page)}
                                        className={`h-7 w-7 rounded-lg text-xs font-semibold transition ${
                                            page === currentPage
                                                ? 'bg-violet-600 text-white shadow-sm'
                                                : 'border border-gray-200 text-gray-600 hover:border-violet-400 hover:text-violet-600'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => fetchAllThuongPhats(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-violet-400 hover:text-violet-600 disabled:opacity-40"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 bg-white px-5 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:shadow-md active:scale-95"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
