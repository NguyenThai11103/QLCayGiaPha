import { Head, router } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import toast from '../../lib/toast.util';
import { DongHo, dongHoApi, Nguoi, nguoiApi } from '../../services/gia-pha.api';

interface DongHoWithStats extends DongHo {
    soThanhVien: number;
}

const CLAN_GRADIENTS = [
    'linear-gradient(135deg, #059669, #10b981)',
    'linear-gradient(135deg,#6366f1,#8b5cf6)',
    'linear-gradient(135deg,#0ea5e9,#06b6d4)',
    'linear-gradient(135deg,#10b981,#059669)',
    'linear-gradient(135deg,#f43f5e,#ec4899)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
];

type FormState = { id?: number; ten_dong_ho: string; mo_ta: string };
const emptyForm: FormState = { ten_dong_ho: '', mo_ta: '' };

export default function DanhSachGiaToc() {
    const [dongHos, setDongHos] = useState<DongHo[]>([]);
    const [members, setMembers] = useState<Nguoi[]>([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [saving, setSaving] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [dh, ng] = await Promise.all([dongHoApi.list(), nguoiApi.list()]);
            setDongHos(dh.data || []);
            setMembers(ng.data || []);
        } finally { setLoading(false); }
    };

    useEffect(() => { void loadData(); }, []);

    const withStats: DongHoWithStats[] = dongHos.map((dh) => ({
        ...dh,
        soThanhVien: members.filter((m) => m.id_dong_ho === dh.id).length,
    }));

    const openCreate = () => { setForm(emptyForm); setFormOpen(true); };
    const openEdit = (dh: DongHo) => { setForm({ id: dh.id, ten_dong_ho: dh.ten_dong_ho, mo_ta: dh.mo_ta || '' }); setFormOpen(true); };
    const closeForm = () => { setFormOpen(false); setForm(emptyForm); };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!form.ten_dong_ho.trim()) { toast.error('Vui lòng nhập tên dòng họ.'); return; }
        setSaving(true);
        try {
            const payload = { ten_dong_ho: form.ten_dong_ho.trim(), mo_ta: form.mo_ta.trim() || null };
            const res = form.id
                ? await fetch('/api/dong-ho/update', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrf() }, body: JSON.stringify({ id: form.id, ...payload }) }).then((r) => r.json())
                : await fetch('/api/dong-ho/create', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrf() }, body: JSON.stringify(payload) }).then((r) => r.json());
            if (res.success) { toast.success(res.message || 'Lưu thành công.'); closeForm(); await loadData(); }
            else toast.error(res.message || 'Không thể lưu.');
        } finally { setSaving(false); }
    };

    const handleDelete = async (dh: DongHo, count: number) => {
        if (count > 0) { toast.error(`Dòng họ "${dh.ten_dong_ho}" còn ${count} thành viên, không thể xóa.`); return; }
        if (!window.confirm(`Xóa dòng họ "${dh.ten_dong_ho}"?`)) return;
        const res = await fetch('/api/dong-ho/delete', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrf() }, body: JSON.stringify({ id: dh.id }) }).then((r) => r.json());
        if (res.success) { toast.success('Đã xóa.'); await loadData(); }
        else toast.error(res.message || 'Không thể xóa.');
    };

    return (
        <AuthenticatedLayout>
            <Head title="Danh sách gia tộc" />
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Danh sách gia tộc</h2>
                        <p className="mt-1 text-sm text-gray-500">Chọn một gia tộc để quản lý thành viên, cây gia phả và tra cứu danh xưng.</p>
                    </div>
                    <button
                        type="button" onClick={openCreate}
                        className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-white shadow-md transition hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Thêm gia tộc
                    </button>
                </div>

                {/* Stats */}
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Tổng gia tộc</div>
                        <div className="mt-1 text-3xl font-extrabold text-gray-800">{dongHos.length}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Tổng thành viên</div>
                        <div className="mt-1 text-3xl font-extrabold text-gray-800">{members.length}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Đã mất</div>
                        <div className="mt-1 text-3xl font-extrabold text-gray-800">{members.filter((m) => Boolean(m.da_mat)).length}</div>
                    </div>
                </div>

                {/* Clan grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200" style={{ borderTopColor: '#059669' }} />
                    </div>
                ) : withStats.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
                        <div className="text-4xl">🏯</div>
                        <p className="mt-3 font-semibold text-gray-500">Chưa có gia tộc nào. Hãy thêm gia tộc đầu tiên!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {withStats.map((dh, idx) => (
                            <div key={dh.id} className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                                {/* Top bar */}
                                <div className="h-2 w-full" style={{ background: CLAN_GRADIENTS[idx % CLAN_GRADIENTS.length] }} />
                                <div className="p-5">
                                    {/* Avatar + name */}
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-md"
                                            style={{ background: CLAN_GRADIENTS[idx % CLAN_GRADIENTS.length] }}
                                        >
                                            {dh.ten_dong_ho.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="truncate text-lg font-bold text-gray-900">{dh.ten_dong_ho}</h3>
                                            {dh.mo_ta && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{dh.mo_ta}</p>}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="mt-4 flex items-center gap-4 text-sm">
                                        <span className="font-semibold text-gray-700">{dh.soThanhVien} thành viên</span>
                                        <span className="text-gray-300">·</span>
                                        <span className="text-gray-500">{members.filter((m) => m.id_dong_ho === dh.id && Boolean(m.da_mat)).length} đã mất</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-4 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => router.visit(`/gia-pha/dong-ho/${dh.id}`)}
                                            className="flex-1 rounded-xl py-2 text-center text-sm font-bold text-white shadow transition hover:opacity-90"
                                            style={{ background: CLAN_GRADIENTS[idx % CLAN_GRADIENTS.length] }}
                                        >
                                            Vào quản lý →
                                        </button>
                                        <button type="button" onClick={() => openEdit(dh)} title="Sửa" className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button type="button" onClick={() => void handleDelete(dh, dh.soThanhVien)} title="Xóa" className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-red-50 hover:text-red-600">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit modal */}
            {formOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="rounded-t-2xl px-6 py-4" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">{form.id ? 'Sửa gia tộc' : 'Thêm gia tộc mới'}</h3>
                                <button type="button" onClick={closeForm} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <label className="block">
                                <span className="mb-1 block text-sm font-semibold text-gray-700">Tên dòng họ <span className="text-red-500">*</span></span>
                                <input value={form.ten_dong_ho} onChange={(e) => setForm({ ...form, ten_dong_ho: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" required maxLength={255} placeholder="Ví dụ: Họ Nguyễn Bá" />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-sm font-semibold text-gray-700">Mô tả</span>
                                <textarea value={form.mo_ta} onChange={(e) => setForm({ ...form, mo_ta: e.target.value })} rows={3} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" placeholder="Nguồn gốc, quê quán..." />
                            </label>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeForm} className="rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-600 hover:bg-gray-50">Hủy</button>
                                <button type="submit" disabled={saving} className="rounded-xl px-5 py-2 font-semibold text-white shadow hover:opacity-90 disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                                    {saving ? 'Đang lưu...' : 'Lưu'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function getCsrf(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}
