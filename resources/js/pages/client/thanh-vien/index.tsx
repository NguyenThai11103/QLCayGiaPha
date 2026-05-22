import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import { DongHo, dongHoApi, Nguoi, nguoiApi } from '../../../services/gia-pha.api';
import { useAuth } from '../../../contexts/auth.context';
import AdminDanhSachThanhVien from '../../admin/thanh-vien';

export default function ClientDanhSachThanhVien() {
    const { user } = useAuth();

    if (user?.quyen_han === 'quan_ly') {
        return <AdminDanhSachThanhVien />;
    }
    const [members, setMembers] = useState<Nguoi[]>([]);
    const [dongHos, setDongHos] = useState<DongHo[]>([]);
    const [selectedDongHo, setSelectedDongHo] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    const displayedMembers = useMemo(() => {
        if (!searchTerm.trim()) return filteredMembers;
        const q = searchTerm.toLowerCase();
        return filteredMembers.filter((m) => m.ten_day_du.toLowerCase().includes(q));
    }, [filteredMembers, searchTerm]);

    const statsNam = filteredMembers.filter((m) => m.gioi_tinh === 'nam').length;
    const statsNu = filteredMembers.filter((m) => m.gioi_tinh === 'nu').length;
    const statsDaMat = filteredMembers.filter((m) => Boolean(m.da_mat)).length;

    const getMemberById = (id: number) => {
        return members.find((member) => member.id === id);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Danh sách thành viên dòng họ" />
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
                                ) : displayedMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-sm font-medium text-gray-500">
                                            Chưa có thành viên nào.
                                        </td>
                                    </tr>
                                ) : (
                                    displayedMembers.map((member) => {
                                        const dongHo = dongHos.find((item) => item.id === member.id_dong_ho);
                                        const spouseNames = (member.vo_chong_ids || [])
                                            .map((spouseId) => getMemberById(spouseId)?.ten_day_du)
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
                                                    <Link href={`/gia-pha/thanh-vien/${member.id}`} className="font-semibold text-emerald-600 hover:text-emerald-900">
                                                        Xem chi tiết →
                                                    </Link>
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
        </AuthenticatedLayout>
    );
}
