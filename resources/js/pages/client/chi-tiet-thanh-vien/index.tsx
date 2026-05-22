import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import { useEffect, useState } from 'react';
import apiClient from '../../../lib/api.client';

interface ThongTinNguoi {
    id: number;
    id_dong_ho: number;
    ten_day_du: string;
    gioi_tinh: string;
    ngay_sinh: string | null;
    ngay_mat: string | null;
    da_mat: boolean;
    id_cha: number | null;
    id_me: number | null;
    tieu_su: string | null;
    anh_dai_dien: string | null;
}

interface QuanHeItem {
    nguoi: ThongTinNguoi;
    xung_ho: string;
}

interface DetailData {
    thong_tin: ThongTinNguoi;
    danh_sach_quan_he: QuanHeItem[];
}

export default function ChiTietThanhVien({ id }: { id: number | string }) {
    const [data, setData] = useState<DetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        apiClient.get(`/nguoi/detail?id=${id}`)
            .then(res => {
                if (res.data.success) {
                    setData(res.data.data);
                } else {
                    setError(res.data.message || 'Lỗi tải dữ liệu');
                }
            })
            .catch(err => {
                console.error(err);
                setError('Lỗi kết nối máy chủ');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    return (
        <AuthenticatedLayout>
            <Head title="Chi tiết thành viên" />
            
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
                {/* Header Actions */}
                <div className="mb-6 flex justify-between items-center">
                    <Link href="/gia-pha/cay-gia-pha" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Quay lại cây gia phả
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 text-center font-semibold">
                        {error}
                    </div>
                ) : data ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Profile Card */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                                <div className={`w-32 h-32 mx-auto rounded-full mb-4 flex items-center justify-center text-5xl font-bold border-4 shadow-sm ${data.thong_tin.gioi_tinh === 'nam' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-pink-50 text-pink-600 border-pink-100'}`}>
                                    {data.thong_tin.ten_day_du.charAt(0)}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">{data.thong_tin.ten_day_du}</h2>
                                <p className="text-gray-500 font-medium capitalize">{data.thong_tin.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'}</p>
                                
                                {data.thong_tin.da_mat && (
                                    <span className="inline-block mt-3 bg-gray-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                                        Đã mất
                                    </span>
                                )}

                                <div className="mt-6 space-y-3 text-left">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-500">Ngày sinh</span>
                                        <span className="font-semibold text-gray-700">{data.thong_tin.ngay_sinh || 'Không rõ'}</span>
                                    </div>
                                    {data.thong_tin.da_mat && (
                                        <div className="flex justify-between border-b pb-2">
                                            <span className="text-gray-500">Ngày mất</span>
                                            <span className="font-semibold text-gray-700">{data.thong_tin.ngay_mat || 'Không rõ'}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {data.thong_tin.tieu_su && (
                                    <div className="mt-6 text-left">
                                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Tiểu sử</h4>
                                        <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border">
                                            {data.thong_tin.tieu_su}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Relationships List */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-800">
                                        Các mối quan hệ trong dòng họ
                                    </h3>
                                    <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-xs font-bold">
                                        {data.danh_sach_quan_he.length} người
                                    </span>
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                                                <th className="px-6 py-4 font-semibold">Tên thành viên</th>
                                                <th className="px-6 py-4 font-semibold">Xưng hô</th>
                                                <th className="px-6 py-4 font-semibold text-right">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {data.danh_sach_quan_he.length > 0 ? (
                                                data.danh_sach_quan_he.map((qh, idx) => (
                                                    <tr key={idx} className="hover:bg-blue-50/50 transition">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${qh.nguoi.gioi_tinh === 'nam' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                                                                    {qh.nguoi.ten_day_du.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-gray-800">{qh.nguoi.ten_day_du}</p>
                                                                    {qh.nguoi.da_mat && <p className="text-xs text-gray-400">Đã mất</p>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                                                                {qh.xung_ho}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <Link href={`/gia-pha/thanh-vien/${qh.nguoi.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-semibold hover:underline">
                                                                Xem chi tiết
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                                        Chưa có thành viên nào khác trong dòng họ.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </AuthenticatedLayout>
    );
}
