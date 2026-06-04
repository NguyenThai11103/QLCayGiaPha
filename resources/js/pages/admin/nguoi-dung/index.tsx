import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import { adminNguoiDungApi, AdminNguoiDung } from '../../../services/admin.api';
import toast from '../../../lib/toast.util';

export default function AdminNguoiDungManagement() {
    const [nguoiDungs, setNguoiDungs] = useState<AdminNguoiDung[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [roleFilter, setRoleFilter] = useState('');

    const loadData = async (currentPage = 1, searchQuery = search, role = roleFilter) => {
        setLoading(true);
        try {
            const result = await adminNguoiDungApi.list({ page: currentPage, search: searchQuery, quyen_han: role });
            if (result.success && result.data) {
                setNguoiDungs(result.data.data);
                setTotalPages(result.data.last_page);
                setPage(currentPage);
            }
        } catch (error) {
            toast.error('Lỗi khi tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [roleFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void loadData(1, search, roleFilter);
    };

    const handleToggleStatus = async (user: AdminNguoiDung) => {
        const isActive = !!user.trang_thai;
        const confirmMsg = isActive 
            ? `KHÓA tài khoản "${user.email}"? Họ sẽ bị văng ra khỏi hệ thống và không thể đăng nhập.` 
            : `MỞ KHÓA tài khoản "${user.email}"?`;
            
        if (!window.confirm(confirmMsg)) return;

        try {
            const result = await adminNguoiDungApi.updateStatus(user.id, !isActive);
            if (result.success) {
                toast.success(result.message || 'Cập nhật trạng thái thành công');
                setNguoiDungs(prev => prev.map(item => item.id === user.id ? { ...item, trang_thai: !isActive ? 1 : 0 } : item));
            } else {
                toast.error(result.message || 'Không thể cập nhật trạng thái');
            }
        } catch (error) {
            toast.error('Lỗi khi kết nối đến máy chủ');
        }
    };

    const handleDelete = async (user: AdminNguoiDung) => {
        if (!window.confirm(`Hành động này sẽ XÓA VĨNH VIỄN tài khoản "${user.email}". Bạn có chắc chắn không?`)) {
            return;
        }

        try {
            const result = await adminNguoiDungApi.delete(user.id);
            if (result.success) {
                toast.success('Đã xóa người dùng thành công');
                void loadData(page, search, roleFilter);
            } else {
                toast.error(result.message || 'Không thể xóa người dùng');
            }
        } catch (error) {
            toast.error('Lỗi khi kết nối đến máy chủ');
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Quản lý Người dùng - Admin Hệ Thống" />
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Quản lý Người dùng</h2>
                        <p className="mt-1 text-sm text-gray-500">Giám sát tài khoản và hoạt động đăng nhập trên hệ thống.</p>
                    </div>

                    <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                            <option value="">Tất cả quyền</option>
                            <option value="quan_ly">Quản lý (Trưởng tộc)</option>
                            <option value="thanh_vien">Thành viên</option>
                        </select>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Tên hoặc email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-64 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                        >
                            Tìm
                        </button>
                    </form>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Họ và tên / Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Dòng họ</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Vai trò</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Trạng thái</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-sm font-medium text-gray-500">
                                            Đang tải dữ liệu...
                                        </td>
                                    </tr>
                                ) : nguoiDungs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-sm font-medium text-gray-500">
                                            Không tìm thấy người dùng nào.
                                        </td>
                                    </tr>
                                ) : (
                                    nguoiDungs.map((user) => (
                                        <tr key={user.id} className="transition hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 flex justify-center items-center font-bold text-gray-400">
                                                        {user.avatar ? (
                                                            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            user.ho_ten.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-semibold text-gray-900">{user.ho_ten}</div>
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {user.dong_ho ? (
                                                    <span className="font-medium text-gray-900">{user.dong_ho.ten_dong_ho}</span>
                                                ) : (
                                                    <span className="italic text-gray-400">Chưa tham gia</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                {user.quyen_han === 'quan_ly' ? (
                                                    <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                                                        Quản lý
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                        Thành viên
                                                    </span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                {!!user.trang_thai ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                                                        Locked
                                                    </span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(user)}
                                                    className={`mr-4 font-semibold ${!!user.trang_thai ? 'text-amber-600 hover:text-amber-900' : 'text-green-600 hover:text-green-900'}`}
                                                >
                                                    {!!user.trang_thai ? 'Khóa' : 'Mở khóa'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(user)}
                                                    className="font-semibold text-red-600 hover:text-red-900"
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Phân trang */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                            <div className="flex flex-1 justify-between sm:hidden">
                                <button onClick={() => loadData(Math.max(1, page - 1))} disabled={page === 1} className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Trước</button>
                                <button onClick={() => loadData(Math.max(totalPages, page + 1))} disabled={page === totalPages} className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Sau</button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">Trang <span className="font-medium">{page}</span> / <span className="font-medium">{totalPages}</span></p>
                                </div>
                                <div>
                                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                        <button onClick={() => loadData(Math.max(1, page - 1))} disabled={page === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50">
                                            <span className="sr-only">Trước</span>
                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
                                        </button>
                                        <button onClick={() => loadData(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50">
                                            <span className="sr-only">Sau</span>
                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
