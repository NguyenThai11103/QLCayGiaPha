import { Head, router } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import Icon from '../../../components/gia-pha/Icon';
import toast from '../../../lib/toast.util';
import { AlbumAnh, albumAnhApi } from '../../../services/gia-pha.api';
import { useAuth } from '../../../contexts/auth.context';

type AlbumCategory = 'tu_duong' | 'hop_ho' | 'gioi_to' | 'mo_phan' | 'tu_lieu';

const CATEGORY_META: Record<AlbumCategory, { label: string; icon: React.ComponentProps<typeof Icon>['name']; color: string }> = {
    tu_duong : { label: 'Từ đường',  icon: 'lotus',  color: 'gold'       },
    hop_ho   : { label: 'Họp họ',    icon: 'users',  color: 'jade'       },
    gioi_to  : { label: 'Giỗ tổ',    icon: 'scroll', color: 'brown'      },
    mo_phan  : { label: 'Mộ phần',   icon: 'pin',    color: 'terracotta' },
    tu_lieu  : { label: 'Tư liệu',   icon: 'book',   color: 'indigo'     },
};

type FilterCategory = 'all' | AlbumCategory;

interface AlbumFormState {
    ten_album: string;
    loai_album: AlbumCategory;
    nam: number;
    mo_ta: string;
}

export default function AlbumAnhListPage() {
    const { user } = useAuth();
    const [albums, setAlbums] = useState<AlbumAnh[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    
    // Filters
    const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
    const [filterYear, setFilterYear] = useState<string>('all');
    const [search, setSearch] = useState('');

    // Modal state
    const [formOpen, setFormOpen] = useState(false);
    const [editingAlbum, setEditingAlbum] = useState<AlbumAnh | null>(null);

    const loadAlbums = async () => {
        setLoading(true);
        setLoadError('');
        try {
            const dongHoId = user?.dong_ho_id || user?.dong_ho?.id;
            if (!dongHoId) return;

            const res = await albumAnhApi.list({ dong_ho_id: dongHoId });
            if (res.success && res.data) {
                setAlbums(res.data);
            } else {
                setLoadError(res.message || 'Không thể tải danh sách album.');
            }
        } catch (error) {
            setLoadError('Không thể kết nối đến máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadAlbums();
    }, [user?.dong_ho_id, user?.dong_ho?.id]);

    const years = useMemo(() => {
        const uniqueYears = Array.from(new Set(albums.map(a => a.nam)));
        return uniqueYears.sort((a, b) => b - a); // Sắp xếp năm giảm dần
    }, [albums]);

    const filteredAlbums = useMemo(() => {
        return albums.filter(album => {
            const matchCategory = filterCategory === 'all' || album.loai_album === filterCategory;
            const matchYear = filterYear === 'all' || String(album.nam) === filterYear;
            
            let matchSearch = true;
            if (search.trim()) {
                const q = search.toLowerCase();
                matchSearch = album.ten_album.toLowerCase().includes(q) || 
                              (album.mo_ta || '').toLowerCase().includes(q);
            }

            return matchCategory && matchYear && matchSearch;
        });
    }, [albums, filterCategory, filterYear, search]);

    const canManage = ['truong_toc', 'quan_ly'].includes(user?.quyen_han || '');

    const openCreate = () => {
        setEditingAlbum(null);
        setFormOpen(true);
    };

    const openEdit = (album: AlbumAnh, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingAlbum(album);
        setFormOpen(true);
    };

    const handleDelete = async (album: AlbumAnh, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm(`Xóa album "${album.ten_album}"? Hành động này sẽ xóa toàn bộ ảnh trong album và không thể khôi phục.`)) return;

        try {
            const res = await albumAnhApi.delete(album.id);
            if (res.success) {
                toast.success(res.message || 'Đã xóa album thành công');
                await loadAlbums();
            }
        } catch (error) {
            toast.error('Không thể xóa album.');
        }
    };

    const categories: { key: FilterCategory; label: string }[] = [
        { key: 'all', label: 'Tất cả' },
        { key: 'tu_duong', label: 'Từ đường' },
        { key: 'hop_ho', label: 'Họp họ' },
        { key: 'gioi_to', label: 'Giỗ tổ' },
        { key: 'mo_phan', label: 'Mộ phần' },
        { key: 'tu_lieu', label: 'Tư liệu' },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Album ảnh dòng họ" />
            <div style={{ width: '100%' }}>

                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: 2, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>Gia phả · Kỷ niệm</div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px', fontFamily: 'Cormorant Garamond, serif' }}>Album ảnh dòng họ</h1>
                    <p style={{ fontSize: 13.5, color: 'var(--ink-mute)', margin: 0 }}>Nơi lưu giữ những hình ảnh ấm cúng về các hoạt động, từ đường, giỗ chạp và tư liệu lịch sử dòng tộc.</p>
                </div>

                {/* Toolbar */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
                    {/* Search bar */}
                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                        <Icon name="search" size={14} color="var(--ink-mute)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm kiếm album..."
                            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg-elev)', color: 'var(--ink)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    {/* Year filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>Năm:</span>
                        <select 
                            value={filterYear} 
                            onChange={e => setFilterYear(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg-elev)', color: 'var(--ink)', fontSize: 13, outline: 'none' }}
                        >
                            <option value="all">Tất cả các năm</option>
                            {years.map(y => (
                                <option key={y} value={String(y)}>{y}</option>
                            ))}
                        </select>
                    </div>

                    {/* Add Album button */}
                    {canManage && (
                        <button type="button" onClick={openCreate} className="gp-btn gp-btn-primary" style={{ gap: 6, display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                            <Icon name="plus" size={13} />
                            Tạo Album mới
                        </button>
                    )}
                </div>

                {/* Category tabs */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 24, borderBottom: '1px solid var(--line-soft)', paddingBottom: 10 }}>
                    {categories.map(c => {
                        const active = filterCategory === c.key;
                        const count = c.key === 'all' 
                            ? albums.length 
                            : albums.filter(a => a.loai_album === c.key).length;

                        return (
                            <button
                                key={c.key}
                                onClick={() => setFilterCategory(c.key)}
                                style={{ 
                                    padding: '8px 16px', 
                                    borderRadius: 8, 
                                    border: 'none',
                                    background: active ? 'var(--gold-glow)' : 'transparent', 
                                    color: active ? 'var(--brown)' : 'var(--ink-soft)', 
                                    fontSize: 13.5, 
                                    fontWeight: active ? 700 : 500, 
                                    cursor: 'pointer', 
                                    fontFamily: 'inherit', 
                                    transition: 'all 0.15s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6
                                }}
                            >
                                {c.key !== 'all' && <Icon name={CATEGORY_META[c.key as AlbumCategory].icon} size={14} color={active ? 'var(--brown)' : 'var(--ink-mute)'} />}
                                {c.label}
                                <span style={{ opacity: 0.6, fontSize: 11.5 }}>({count})</span>
                            </button>
                        );
                    })}
                </div>

                {loadError && !loading ? (
                    <div style={{ background: 'color-mix(in srgb, var(--crimson) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--crimson) 22%, transparent)', borderRadius: 12, color: 'var(--crimson)', fontSize: 13, marginBottom: 16, padding: '12px 14px' }}>
                        {loadError}
                    </div>
                ) : null}

                {/* Loading */}
                {loading && (
                    <div style={{ display: 'grid', placeItems: 'center', height: 260 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 36, height: 36, border: '4px solid var(--gold-pale)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                            <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>Đang tải danh sách album...</div>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!loading && filteredAlbums.length === 0 && (
                    <div style={{ background: 'var(--bg-elev)', borderRadius: 16, border: '1px solid var(--line)', padding: '56px 24px', textAlign: 'center' }}>
                        <Icon name="photo" size={44} color="var(--ink-faint)" />
                        <div style={{ marginTop: 12, fontSize: 15, fontWeight: 600, color: 'var(--ink-mute)' }}>
                            {search ? `Không tìm thấy album nào cho "${search}"` : 'Chưa có album ảnh nào.'}
                        </div>
                        {canManage && !search && (
                            <p style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 6 }}>Bắt đầu bằng cách tạo một album ảnh đầu tiên để chia sẻ kỷ niệm.</p>
                        )}
                    </div>
                )}

                {/* Album grid list */}
                {!loading && filteredAlbums.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                        {filteredAlbums.map(album => {
                            const meta = CATEGORY_META[album.loai_album];
                            const hasCover = album.photos && album.photos.length > 0;
                            const coverUrl = hasCover ? album.photos![0].duong_dan_file : null;
                            const totalPhotos = album.photos_count ?? (album.photos?.length || 0);

                            return (
                                <div
                                    key={album.id}
                                    onClick={() => router.visit(`/gia-pha/album-anh/${album.id}`)}
                                    style={{ 
                                        background: 'var(--bg-elev)', 
                                        borderRadius: 16, 
                                        border: '1px solid var(--line)', 
                                        overflow: 'hidden', 
                                        cursor: 'pointer', 
                                        transition: 'all 0.2s ease-in-out', 
                                        boxShadow: 'var(--shadow-sm)',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                    onMouseEnter={e => { 
                                        e.currentTarget.style.borderColor = 'var(--gold-soft)'; 
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                    }}
                                    onMouseLeave={e => { 
                                        e.currentTarget.style.borderColor = 'var(--line)'; 
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                    }}
                                >
                                    {/* Cover photo */}
                                    <div style={{ height: 160, background: 'var(--card-soft)', position: 'relative', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
                                        {hasCover ? (
                                            <img src={coverUrl!} alt={album.ten_album} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />
                                        ) : (
                                            <div style={{ textAlign: 'center', opacity: 0.4 }}>
                                                <Icon name="photo" size={48} color="var(--ink-mute)" />
                                                <div style={{ fontSize: 12, marginTop: 4, color: 'var(--ink-mute)' }}>Chưa có hình ảnh</div>
                                            </div>
                                        )}

                                        {/* Year Badge */}
                                        <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '3px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 700 }}>
                                            Năm {album.nam}
                                        </div>

                                        {/* Category Badge */}
                                        <div style={{ position: 'absolute', top: 12, right: 12, background: `var(--bg-elev)`, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: 'var(--ink)' }}>
                                            <Icon name={meta.icon} size={11} color={`var(--${meta.color})`} />
                                            {meta.label}
                                        </div>

                                        {/* Photo count badge */}
                                        <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Icon name="camera" size={11} />
                                            {totalPhotos} ảnh
                                        </div>
                                    </div>

                                    {/* Album details */}
                                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <div>
                                            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--ink)', fontFamily: 'Cormorant Garamond, serif' }}>
                                                {album.ten_album}
                                            </h3>
                                            <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 38 }}>
                                                {album.mo_ta || 'Không có mô tả cho album này.'}
                                            </p>
                                        </div>

                                        {canManage && (
                                            <div style={{ display: 'flex', gap: 8, marginTop: 14, borderTop: '1px solid var(--line-soft)', paddingTop: 12 }}>
                                                <button type="button" onClick={(e) => openEdit(album, e)} className="gp-btn gp-btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '6px 8px', fontSize: 12.5 }}>
                                                    <Icon name="edit" size={12} />
                                                    Sửa
                                                </button>
                                                <button type="button" onClick={(e) => void handleDelete(album, e)} className="gp-btn gp-btn-ghost" style={{ color: 'var(--crimson)', padding: '6px 8px' }} title="Xóa Album">
                                                    <Icon name="trash" size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Album Form Modal */}
            {formOpen && (
                <AlbumFormModal
                    album={editingAlbum}
                    defaultDongHoId={user?.dong_ho_id || user?.dong_ho?.id || null}
                    onClose={() => setFormOpen(false)}
                    onSaved={async () => {
                        setFormOpen(false);
                        await loadAlbums();
                    }}
                />
            )}
        </AuthenticatedLayout>
    );
}

interface AlbumFormModalProps {
    album: AlbumAnh | null;
    defaultDongHoId: number | string | null;
    onClose: () => void;
    onSaved: () => Promise<void>;
}

function AlbumFormModal({ album, defaultDongHoId, onClose, onSaved }: AlbumFormModalProps) {
    const [form, setForm] = useState<AlbumFormState>({
        ten_album: album?.ten_album || '',
        loai_album: album?.loai_album || 'tu_duong',
        nam: album?.nam || new Date().getFullYear(),
        mo_ta: album?.mo_ta || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const setField = (key: keyof AlbumFormState, value: any) => {
        setForm(current => ({ ...current, [key]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!form.ten_album.trim()) {
            setError('Vui lòng nhập tên album.');
            return;
        }

        if (!defaultDongHoId) {
            setError('Lỗi: Không tìm thấy ID dòng họ.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const payload = {
                dong_ho_id: Number(defaultDongHoId),
                ten_album: form.ten_album.trim(),
                loai_album: form.loai_album,
                nam: Number(form.nam),
                mo_ta: form.mo_ta.trim(),
            };

            const res = album
                ? await albumAnhApi.update({ id: album.id, ...payload })
                : await albumAnhApi.create(payload);

            if (res.success) {
                toast.success(res.message || 'Đã lưu album thành công');
                await onSaved();
            } else {
                setError(res.message || 'Không thể lưu album.');
            }
        } catch (submitError) {
            setError('Không thể kết nối đến máy chủ.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
            <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-elev)', borderRadius: 18, border: '1px solid var(--line)', boxShadow: '0 24px 60px rgba(0,0,0,0.28)' }}>
                <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, var(--gold), var(--brown-soft))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, opacity: 0.8 }}>Album ảnh</div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{album ? 'Cập nhật Album' : 'Tạo Album mới'}</h2>
                    </div>
                    <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.18)', color: 'white', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                        <Icon name="x" size={15} />
                    </button>
                </div>

                <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {error && (
                        <div style={{ padding: '10px 12px', borderRadius: 10, background: 'color-mix(in srgb, var(--crimson) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--crimson) 25%, transparent)', color: 'var(--crimson)', fontSize: 13 }}>
                            {error}
                        </div>
                    )}

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Tên album <span style={{ color: 'var(--crimson)' }}>*</span></span>
                        <input 
                            value={form.ten_album} 
                            onChange={e => setField('ten_album', e.target.value)} 
                            className="gp-input" 
                            placeholder="Ví dụ: Giỗ tổ dòng họ năm 2026" 
                            required 
                        />
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Phân loại</span>
                            <select 
                                value={form.loai_album} 
                                onChange={e => setField('loai_album', e.target.value)} 
                                className="gp-input"
                            >
                                <option value="tu_duong">Từ đường</option>
                                <option value="hop_ho">Họp họ</option>
                                <option value="gioi_to">Giỗ tổ</option>
                                <option value="mo_phan">Mộ phần</option>
                                <option value="tu_lieu">Tư liệu</option>
                            </select>
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Năm diễn ra</span>
                            <input 
                                type="number" 
                                value={form.nam} 
                                onChange={e => setField('nam', Number(e.target.value))} 
                                className="gp-input" 
                                min={1000} 
                                max={2100} 
                                required 
                            />
                        </label>
                    </div>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Mô tả ngắn</span>
                        <textarea 
                            value={form.mo_ta} 
                            onChange={e => setField('mo_ta', e.target.value)} 
                            className="gp-input" 
                            rows={3} 
                            placeholder="Ghi lại đôi dòng mô tả về sự kiện hoặc album ảnh này..." 
                            style={{ resize: 'vertical' }} 
                        />
                    </label>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
                        <button type="button" onClick={onClose} className="gp-btn gp-btn-ghost">Hủy</button>
                        <button type="submit" disabled={saving} className="gp-btn gp-btn-primary" style={{ opacity: saving ? 0.65 : 1 }}>
                            {saving ? 'Đang lưu...' : 'Lưu album'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
