import { Head, Link } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import Icon from '../../../components/gia-pha/Icon';
import toast from '../../../lib/toast.util';
import { Nguoi, NhanVatTieuBieu, NhanVatTieuBieuPayload, nguoiApi, nhanVatTieuBieuApi } from '../../../services/gia-pha.api';
import { useAuth } from '../../../contexts/auth.context';

interface FormState {
    thanh_vien_id: string;
    tieu_de: string;
    tom_tat: string;
    cau_chuyen: string;
    dong_gop: string;
    linh_vuc: string;
    giai_doan: string;
    nam_bat_dau: string;
    nam_ket_thuc: string;
    noi_bat: boolean;
    trang_thai: 'draft' | 'published';
    thu_tu_hien_thi: string;
    anh_bia: File | null;
}

const emptyForm: FormState = {
    thanh_vien_id: '',
    tieu_de: '',
    tom_tat: '',
    cau_chuyen: '',
    dong_gop: '',
    linh_vuc: '',
    giai_doan: '',
    nam_bat_dau: '',
    nam_ket_thuc: '',
    noi_bat: false,
    trang_thai: 'published',
    thu_tu_hien_thi: '0',
    anh_bia: null,
};

function initials(name?: string | null): string {
    if (!name) return 'N';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1]?.charAt(0)?.toUpperCase() || name.charAt(0).toUpperCase();
}

function avatarGrad(name?: string | null): string {
    const seed = (name || 'nhan vat').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const pairs = [
        ['#b8902c', '#5c3a1e'],
        ['#2f5d3a', '#4a7a52'],
        ['#8b2a1f', '#c44535'],
        ['#225b7a', '#3e84a8'],
        ['#8b5a2b', '#a06d3b'],
    ];
    const p = pairs[seed % pairs.length];
    return `linear-gradient(135deg, ${p[0]}, ${p[1]})`;
}

function yearRange(profile: NhanVatTieuBieu): string {
    if (profile.giai_doan) return profile.giai_doan;
    if (profile.nam_bat_dau && profile.nam_ket_thuc) return `${profile.nam_bat_dau} - ${profile.nam_ket_thuc}`;
    if (profile.nam_bat_dau) return `Từ ${profile.nam_bat_dau}`;
    if (profile.nam_ket_thuc) return `Đến ${profile.nam_ket_thuc}`;
    return 'Chưa ghi giai đoạn';
}

function getTitle(profile: NhanVatTieuBieu): string {
    return profile.tieu_de || profile.ten_thanh_vien || 'Nhân vật tiêu biểu';
}

function getErrorMessage(error: unknown, fallback: string): string {
    const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
    if (data?.message) return data.message;
    const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
    return firstError || fallback;
}

export default function NhanVatTieuBieuPage() {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<NhanVatTieuBieu[]>([]);
    const [members, setMembers] = useState<Nguoi[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [fieldFilter, setFieldFilter] = useState('all');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<NhanVatTieuBieu | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [saving, setSaving] = useState(false);
    const canManage = ['truong_toc', 'quan_ly'].includes(user?.quyen_han || '');

    const loadData = async () => {
        setLoading(true);
        try {
            const [profileRes, memberRes] = await Promise.all([
                nhanVatTieuBieuApi.list(),
                nguoiApi.list(),
            ]);
            if (profileRes.success && profileRes.data) setProfiles(profileRes.data);
            if (memberRes.success && memberRes.data) setMembers(memberRes.data);
        } catch (error) {
            toast.error(getErrorMessage(error, 'Không thể tải nhân vật tiêu biểu.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void loadData(); }, []);

    const fields = useMemo(() => Array.from(new Set(profiles.map(p => p.linh_vuc).filter((v): v is string => Boolean(v)))).sort(), [profiles]);
    const featuredCount = profiles.filter(p => Boolean(p.noi_bat)).length;

    const filtered = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return profiles.filter(profile => {
            if (fieldFilter !== 'all' && profile.linh_vuc !== fieldFilter) return false;
            if (!keyword) return true;
            return [
                profile.tieu_de,
                profile.ten_thanh_vien,
                profile.tom_tat,
                profile.cau_chuyen,
                profile.dong_gop,
                profile.linh_vuc,
            ].some(value => (value || '').toLowerCase().includes(keyword));
        });
    }, [profiles, search, fieldFilter]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setFormOpen(true);
    };

    const openEdit = (profile: NhanVatTieuBieu) => {
        setEditing(profile);
        setForm({
            thanh_vien_id: String(profile.thanh_vien_id),
            tieu_de: profile.tieu_de || '',
            tom_tat: profile.tom_tat || '',
            cau_chuyen: profile.cau_chuyen || '',
            dong_gop: profile.dong_gop || '',
            linh_vuc: profile.linh_vuc || '',
            giai_doan: profile.giai_doan || '',
            nam_bat_dau: profile.nam_bat_dau ? String(profile.nam_bat_dau) : '',
            nam_ket_thuc: profile.nam_ket_thuc ? String(profile.nam_ket_thuc) : '',
            noi_bat: Boolean(profile.noi_bat),
            trang_thai: profile.trang_thai === 'draft' ? 'draft' : 'published',
            thu_tu_hien_thi: String(profile.thu_tu_hien_thi || 0),
            anh_bia: null,
        });
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setEditing(null);
        setForm(emptyForm);
    };

    const setField = (key: keyof FormState, value: string | boolean | File | null) => {
        setForm(current => ({ ...current, [key]: value }));
    };

    const submitForm = async (event: FormEvent) => {
        event.preventDefault();
        if (!editing && !form.thanh_vien_id) {
            toast.error('Vui lòng chọn thành viên.');
            return;
        }

        const payload: NhanVatTieuBieuPayload = {
            thanh_vien_id: Number(form.thanh_vien_id),
            tieu_de: form.tieu_de.trim() || null,
            tom_tat: form.tom_tat.trim() || null,
            cau_chuyen: form.cau_chuyen.trim() || null,
            dong_gop: form.dong_gop.trim() || null,
            linh_vuc: form.linh_vuc.trim() || null,
            giai_doan: form.giai_doan.trim() || null,
            nam_bat_dau: form.nam_bat_dau ? Number(form.nam_bat_dau) : null,
            nam_ket_thuc: form.nam_ket_thuc ? Number(form.nam_ket_thuc) : null,
            noi_bat: form.noi_bat ? 1 : 0,
            trang_thai: form.trang_thai,
            thu_tu_hien_thi: form.thu_tu_hien_thi ? Number(form.thu_tu_hien_thi) : 0,
            anh_bia: form.anh_bia,
        };

        setSaving(true);
        try {
            const res = editing
                ? await nhanVatTieuBieuApi.update({ id: editing.id, ...payload })
                : await nhanVatTieuBieuApi.create(payload);

            if (res.success) {
                toast.success(res.message || 'Đã lưu hồ sơ.');
                closeForm();
                await loadData();
            } else {
                toast.error(res.message || 'Không thể lưu hồ sơ.');
            }
        } catch (error) {
            toast.error(getErrorMessage(error, 'Không thể lưu hồ sơ.'));
        } finally {
            setSaving(false);
        }
    };

    const deleteProfile = async (profile: NhanVatTieuBieu) => {
        if (!window.confirm(`Xóa hồ sơ "${getTitle(profile)}"?`)) return;
        try {
            const res = await nhanVatTieuBieuApi.delete(profile.id);
            if (res.success) {
                toast.success(res.message || 'Đã xóa hồ sơ.');
                await loadData();
            }
        } catch (error) {
            toast.error(getErrorMessage(error, 'Không thể xóa hồ sơ.'));
        }
    };

    const usedMemberIds = new Set(profiles.filter(p => !editing || p.id !== editing.id).map(p => p.thanh_vien_id));
    const selectableMembers = members.filter(member => !usedMemberIds.has(member.id));

    return (
        <AuthenticatedLayout>
            <Head title="Nhân vật tiêu biểu" />
            <div style={{ maxWidth: 1180, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontSize: 10.5, letterSpacing: 2, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>Gia phả · Vinh danh</div>
                        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px', fontFamily: 'Cormorant Garamond, serif' }}>Nhân vật tiêu biểu</h1>
                        <p style={{ fontSize: 13.5, color: 'var(--ink-mute)', margin: 0 }}>Hồ sơ tư liệu về những thành viên có câu chuyện và đóng góp nổi bật trong dòng họ.</p>
                    </div>
                    {canManage && (
                        <button type="button" onClick={openCreate} className="gp-btn gp-btn-primary">
                            <Icon name="plus" size={14} />
                            Tạo hồ sơ
                        </button>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 18 }}>
                    {[
                        { label: 'Hồ sơ', value: profiles.length, icon: 'scroll' as const, color: 'gold' },
                        { label: 'Nổi bật', value: featuredCount, icon: 'sparkle' as const, color: 'terracotta' },
                        { label: 'Lĩnh vực', value: fields.length, icon: 'layers' as const, color: 'jade' },
                    ].map(stat => (
                        <div key={stat.label} style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: `color-mix(in srgb, var(--${stat.color}) 12%, transparent)`, color: `var(--${stat.color})` }}>
                                <Icon name={stat.icon} size={16} />
                            </div>
                            <div>
                                <div style={{ fontSize: 22, color: 'var(--ink)', fontWeight: 800, lineHeight: 1 }}>{stat.value}</div>
                                <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                        <Icon name="search" size={14} color="var(--ink-mute)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                        <input value={search} onChange={event => setSearch(event.target.value)} className="gp-input" placeholder="Tìm theo tên, câu chuyện, đóng góp..." style={{ width: '100%', paddingLeft: 34 }} />
                    </div>
                    <select value={fieldFilter} onChange={event => setFieldFilter(event.target.value)} className="gp-input" style={{ width: 190 }}>
                        <option value="all">Tất cả lĩnh vực</option>
                        {fields.map(field => <option key={field} value={field}>{field}</option>)}
                    </select>
                </div>

                {loading ? (
                    <div style={{ display: 'grid', placeItems: 'center', height: 280 }}>
                        <div style={{ textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>Đang tải hồ sơ...</div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 16, padding: '54px 24px', textAlign: 'center' }}>
                        <Icon name="scroll" size={44} color="var(--ink-faint)" />
                        <div style={{ marginTop: 12, color: 'var(--ink-mute)', fontSize: 15, fontWeight: 700 }}>Chưa có hồ sơ nhân vật tiêu biểu.</div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, alignItems: 'stretch' }}>
                        {filtered.map(profile => (
                            <article key={profile.id} style={{ height: 440, background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
                                <Link href={`/gia-pha/nhan-vat-tieu-bieu/${profile.id}`} style={{ display: 'block', height: 156, flexShrink: 0, background: profile.anh_bia_url ? 'var(--card-soft)' : avatarGrad(profile.ten_thanh_vien), color: 'white', textDecoration: 'none', position: 'relative', overflow: 'hidden' }}>
                                    {profile.anh_bia_url ? (
                                        <img src={profile.anh_bia_url} alt={getTitle(profile)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    ) : (
                                        <div style={{ height: '100%', display: 'grid', placeItems: 'center', fontSize: 64, fontWeight: 800, fontFamily: 'Cormorant Garamond, serif' }}>{initials(profile.ten_thanh_vien)}</div>
                                    )}
                                    {Boolean(profile.noi_bat) && (
                                        <span style={{ position: 'absolute', top: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 999, background: 'rgba(255,255,255,0.92)', color: 'var(--brown)', padding: '5px 9px', fontSize: 11, fontWeight: 800 }}>
                                            <Icon name="sparkle" size={12} />
                                            Nổi bật
                                        </span>
                                    )}
                                </Link>
                                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                                        <div style={{ minWidth: 0 }}>
                                            <Link href={`/gia-pha/nhan-vat-tieu-bieu/${profile.id}`} style={{ color: 'var(--ink)', textDecoration: 'none', fontSize: 18, lineHeight: 1.22, fontWeight: 800, fontFamily: 'Cormorant Garamond, serif', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 44 }}>{getTitle(profile)}</Link>
                                            <div style={{ color: 'var(--ink-mute)', fontSize: 12.5, marginTop: 3 }}>
                                                {profile.ten_thanh_vien} · Đời {profile.doi_thu || '-'}
                                            </div>
                                        </div>
                                        {profile.trang_thai === 'draft' && <span style={{ fontSize: 11, color: 'var(--terracotta)', fontWeight: 800 }}>Nháp</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, minHeight: 26 }}>
                                        {profile.linh_vuc && <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--brown)', background: 'var(--gold-glow)', borderRadius: 999, padding: '4px 8px' }}>{profile.linh_vuc}</span>}
                                        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-soft)', background: 'var(--card-soft)', borderRadius: 999, padding: '4px 8px' }}>{yearRange(profile)}</span>
                                    </div>
                                    <p style={{ color: 'var(--ink-soft)', fontSize: 13, lineHeight: 1.55, margin: '12px 0 0', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {profile.tom_tat || profile.tieu_su || 'Chưa có tóm tắt hồ sơ.'}
                                    </p>
                                    {canManage && (
                                        <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--line-soft)', marginTop: 'auto', paddingTop: 12 }}>
                                            <button type="button" onClick={() => openEdit(profile)} className="gp-btn gp-btn-ghost"><Icon name="edit" size={13} /> Sửa</button>
                                            <button type="button" onClick={() => void deleteProfile(profile)} className="gp-btn gp-btn-ghost" style={{ color: 'var(--crimson)' }}><Icon name="trash" size={13} /> Xóa</button>
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {formOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', padding: 16 }}>
                    <form onSubmit={submitForm} style={{ width: '100%', maxWidth: 720, maxHeight: '92vh', overflow: 'auto', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: '0 24px 70px rgba(0,0,0,0.28)' }}>
                        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 800 }}>Hồ sơ vinh danh</div>
                                <h2 style={{ margin: '4px 0 0', fontSize: 20, color: 'var(--ink)', fontWeight: 800 }}>{editing ? 'Chỉnh hồ sơ' : 'Tạo hồ sơ mới'}</h2>
                            </div>
                            <button type="button" onClick={closeForm} className="gp-btn gp-btn-ghost"><Icon name="x" size={14} /></button>
                        </div>
                        <div style={{ padding: 22, display: 'grid', gap: 14 }}>
                            <label style={{ display: 'grid', gap: 6 }}>
                                <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 800 }}>Thành viên</span>
                                <select value={form.thanh_vien_id} onChange={event => setField('thanh_vien_id', event.target.value)} className="gp-input" disabled={!!editing}>
                                    <option value="">Chọn thành viên</option>
                                    {selectableMembers.map(member => <option key={member.id} value={member.id}>{member.ten_day_du}</option>)}
                                </select>
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <label style={{ display: 'grid', gap: 6 }}>
                                    <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 800 }}>Tiêu đề hồ sơ</span>
                                    <input value={form.tieu_de} onChange={event => setField('tieu_de', event.target.value)} className="gp-input" placeholder="Ví dụ: Người gìn giữ gia phả đời thứ 5" />
                                </label>
                                <label style={{ display: 'grid', gap: 6 }}>
                                    <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 800 }}>Lĩnh vực</span>
                                    <input value={form.linh_vuc} onChange={event => setField('linh_vuc', event.target.value)} className="gp-input" placeholder="Giáo dục, quân ngũ, khai khẩn..." />
                                </label>
                            </div>
                            <label style={{ display: 'grid', gap: 6 }}>
                                <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 800 }}>Tóm tắt</span>
                                <textarea value={form.tom_tat} onChange={event => setField('tom_tat', event.target.value)} className="gp-input" rows={3} />
                            </label>
                            <label style={{ display: 'grid', gap: 6 }}>
                                <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 800 }}>Câu chuyện</span>
                                <textarea value={form.cau_chuyen} onChange={event => setField('cau_chuyen', event.target.value)} className="gp-input" rows={5} />
                            </label>
                            <label style={{ display: 'grid', gap: 6 }}>
                                <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 800 }}>Đóng góp</span>
                                <textarea value={form.dong_gop} onChange={event => setField('dong_gop', event.target.value)} className="gp-input" rows={4} />
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <input value={form.giai_doan} onChange={event => setField('giai_doan', event.target.value)} className="gp-input" placeholder="Giai đoạn" />
                                <input value={form.nam_bat_dau} onChange={event => setField('nam_bat_dau', event.target.value)} className="gp-input" inputMode="numeric" placeholder="Năm bắt đầu" />
                                <input value={form.nam_ket_thuc} onChange={event => setField('nam_ket_thuc', event.target.value)} className="gp-input" inputMode="numeric" placeholder="Năm kết thúc" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <label style={{ display: 'grid', gap: 6 }}>
                                    <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 800 }}>Ảnh bìa</span>
                                    <input type="file" accept="image/*" onChange={event => setField('anh_bia', event.target.files?.[0] || null)} className="gp-input" />
                                </label>
                                <label style={{ display: 'grid', gap: 6 }}>
                                    <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 800 }}>Trạng thái</span>
                                    <select value={form.trang_thai} onChange={event => setField('trang_thai', event.target.value)} className="gp-input">
                                        <option value="published">Xuất bản</option>
                                        <option value="draft">Nháp</option>
                                    </select>
                                </label>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>
                                    <input type="checkbox" checked={form.noi_bat} onChange={event => setField('noi_bat', event.target.checked)} />
                                    Đánh dấu nổi bật
                                </label>
                                <input value={form.thu_tu_hien_thi} onChange={event => setField('thu_tu_hien_thi', event.target.value)} className="gp-input" inputMode="numeric" placeholder="Thứ tự" style={{ width: 120 }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
                                <button type="button" onClick={closeForm} className="gp-btn gp-btn-ghost">Hủy</button>
                                <button type="submit" disabled={saving} className="gp-btn gp-btn-primary" style={{ opacity: saving ? 0.65 : 1 }}>{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
