import { Head } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import Icon from '../../../components/gia-pha/Icon';
import toast from '../../../lib/toast.util';
import { Nguoi, TaiLieu, nguoiApi, taiLieuApi } from '../../../services/gia-pha.api';
import { useAuth } from '../../../contexts/auth.context';

// Xác định loại file để hiển thị đúng icon & preview
type FileCategory = 'image' | 'video' | 'pdf' | 'document' | 'other';

function detectCategory(loaiFile: string, duongDan: string): FileCategory {
    const ext = duongDan.split('.').pop()?.toLowerCase() || '';
    const mime = loaiFile.toLowerCase();
    if (mime.startsWith('image') || ['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return 'image';
    if (mime.startsWith('video') || ['mp4','mov','avi','webm'].includes(ext)) return 'video';
    if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
    if (['doc','docx','xls','xlsx','ppt','pptx'].includes(ext)) return 'document';
    return 'other';
}

const CATEGORY_META: Record<FileCategory, { label: string; icon: React.ComponentProps<typeof Icon>['name']; color: string }> = {
    image    : { label: 'Hình ảnh',  icon: 'sparkle', color: 'gold'       },
    video    : { label: 'Video',     icon: 'calendar', color: 'terracotta' },
    pdf      : { label: 'PDF',       icon: 'scroll',   color: 'brown'      },
    document : { label: 'Văn bản',   icon: 'scroll',   color: 'jade'       },
    other    : { label: 'Khác',      icon: 'link',     color: 'gold'       },
};

type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | FileCategory;

interface TaiLieuFormState {
    ten_tai_lieu: string;
    mo_ta: string;
    thanh_vien_id: string;
    du_lieu_orc: string;
    file: File | null;
}

function getDocumentTitle(doc: TaiLieu): string {
    return doc.ten_tai_lieu || doc.ten_file_goc || doc.duong_dan_file.split('/').pop() || 'Tài liệu';
}

function formatBytes(value?: number | null): string {
    if (!value) return '';
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getErrorMessage(error: unknown, fallback: string): string {
    const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
    if (data?.message) return data.message;

    const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
    return firstError || fallback;
}

export default function TaiLieuPage() {
    const { user } = useAuth();
    const [docs,     setDocs]     = useState<TaiLieu[]>([]);
    const [members,  setMembers]  = useState<Nguoi[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [loadError, setLoadError] = useState('');
    const [filter,   setFilter]   = useState<FilterMode>('all');
    const [search,   setSearch]   = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [preview,  setPreview]  = useState<TaiLieu | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<TaiLieu | null>(null);

    const loadDocs = async () => {
        setLoading(true);
        setLoadError('');
        try {
            const dongHoId = user?.dong_ho_id || user?.dong_ho?.id;
            const [docRes, memberRes] = await Promise.all([
                taiLieuApi.list(dongHoId ? { dong_ho_id: dongHoId } : undefined),
                nguoiApi.list(dongHoId),
            ]);
            if (docRes.success && docRes.data) setDocs(docRes.data);
            if (memberRes.success && memberRes.data) setMembers(memberRes.data);
        } catch (error) {
            setLoadError(getErrorMessage(error, 'Không thể tải tài liệu.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void loadDocs(); }, [user?.dong_ho_id, user?.dong_ho?.id]);

    const enriched = useMemo(() =>
        docs.map(d => ({ ...d, _cat: detectCategory(d.loai_file, d.duong_dan_file) })),
    [docs]);

    const filtered = useMemo(() => {
        let list = filter === 'all' ? enriched : enriched.filter(d => d._cat === filter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(d =>
                getDocumentTitle(d).toLowerCase().includes(q)
                || (d.mo_ta || '').toLowerCase().includes(q)
                || d.duong_dan_file.toLowerCase().includes(q)
                || (d.du_lieu_orc || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [enriched, filter, search]);

    const counts = useMemo(() => {
        const c: Record<FilterMode, number> = { all: enriched.length, image: 0, video: 0, pdf: 0, document: 0, other: 0 };
        for (const d of enriched) c[d._cat]++;
        return c;
    }, [enriched]);

    const canManage = ['truong_toc', 'quan_ly'].includes(user?.quyen_han || '');

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (doc: TaiLieu) => {
        setEditing(doc);
        setPreview(null);
        setFormOpen(true);
    };

    const handleDelete = async (doc: TaiLieu) => {
        if (!window.confirm(`Xóa tài liệu "${getDocumentTitle(doc)}"?`)) return;

        try {
            const res = await taiLieuApi.delete(doc.id);
            if (res.success) {
                toast.success(res.message || 'Đã xóa tài liệu');
                setPreview(null);
                await loadDocs();
            }
        } catch {
            // apiClient interceptor displays the backend error.
        }
    };

    const FILTERS: { key: FilterMode; label: string }[] = [
        { key: 'all',      label: 'Tất cả'    },
        { key: 'image',    label: 'Hình ảnh'  },
        { key: 'video',    label: 'Video'     },
        { key: 'pdf',      label: 'PDF'       },
        { key: 'document', label: 'Văn bản'   },
        { key: 'other',    label: 'Khác'      },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Tài liệu dòng họ" />
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: 2, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>Gia phả · Lưu trữ</div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px', fontFamily: 'Cormorant Garamond, serif' }}>Tài liệu dòng họ</h1>
                    <p style={{ fontSize: 13.5, color: 'var(--ink-mute)', margin: 0 }}>Hình ảnh, video, văn bản và tài liệu lịch sử được lưu trữ của dòng họ.</p>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                    {FILTERS.filter(f => f.key !== 'all').map(f => {
                        const meta = CATEGORY_META[f.key as FileCategory];
                        const cnt  = counts[f.key];
                        if (cnt === 0) return null;
                        return (
                            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'var(--bg-elev)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                                <Icon name={meta.icon} size={14} color={`var(--${meta.color})`} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{cnt}</span>
                                <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{f.label}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Toolbar */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                        <Icon name="search" size={14} color="var(--ink-mute)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm kiếm tài liệu..."
                            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg-elev)', color: 'var(--ink)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    {/* Filter chips */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {FILTERS.map(f => {
                            const active = filter === f.key;
                            return (
                                <button
                                    key={f.key}
                                    onClick={() => setFilter(f.key)}
                                    style={{ padding: '7px 12px', borderRadius: 999, border: `1px solid ${active ? 'var(--gold-soft)' : 'var(--line)'}`, background: active ? 'var(--gold-glow)' : 'var(--bg-elev)', color: active ? 'var(--brown)' : 'var(--ink-soft)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                                >
                                    {f.label} <span style={{ opacity: 0.7 }}>({counts[f.key]})</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* View toggle */}
                    <div style={{ display: 'flex', gap: 2, background: 'var(--card-soft)', padding: 3, borderRadius: 9, border: '1px solid var(--line)', marginLeft: 'auto' }}>
                        {(['grid', 'list'] as const).map(m => (
                            <button key={m} onClick={() => setViewMode(m)} style={{ width: 32, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: viewMode === m ? 'var(--bg-elev)' : 'transparent', color: viewMode === m ? 'var(--gold)' : 'var(--ink-mute)', display: 'grid', placeItems: 'center', transition: 'all 0.15s' }} title={m === 'grid' ? 'Dạng lưới' : 'Dạng danh sách'}>
                                <Icon name={m === 'grid' ? 'lotus' : 'scroll'} size={13} />
                            </button>
                        ))}
                    </div>

                    {canManage && (
                        <button type="button" onClick={openCreate} className="gp-btn gp-btn-primary" style={{ gap: 6, display: 'flex', alignItems: 'center' }}>
                            <Icon name="plus" size={13} />
                            Thêm tài liệu
                        </button>
                    )}
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
                            <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>Đang tải tài liệu...</div>
                        </div>
                    </div>
                )}

                {/* Empty */}
                {!loading && filtered.length === 0 && (
                    <div style={{ background: 'var(--bg-elev)', borderRadius: 16, border: '1px solid var(--line)', padding: '56px 24px', textAlign: 'center' }}>
                        <Icon name="scroll" size={44} color="var(--ink-faint)" />
                        <div style={{ marginTop: 12, fontSize: 15, fontWeight: 600, color: 'var(--ink-mute)' }}>
                            {search ? `Không tìm thấy tài liệu nào cho "${search}"` : 'Chưa có tài liệu nào được lưu trữ.'}
                        </div>
                        {canManage && !search && (
                            <p style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 6 }}>Bắt đầu bằng cách thêm hình ảnh hoặc văn bản đầu tiên.</p>
                        )}
                    </div>
                )}

                {/* Grid View */}
                {!loading && filtered.length > 0 && viewMode === 'grid' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                        {filtered.map(doc => {
                            const meta = CATEGORY_META[doc._cat];
                            const isImg = doc._cat === 'image';
                            return (
                                <div
                                    key={doc.id}
                                    onClick={() => setPreview(doc)}
                                    style={{ background: 'var(--bg-elev)', borderRadius: 14, border: '1px solid var(--line)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gold-soft)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
                                >
                                    {/* Preview area */}
                                    <div style={{ height: 130, background: `color-mix(in srgb, var(--${meta.color}) 8%, var(--card-soft))`, display: 'grid', placeItems: 'center', overflow: 'hidden', position: 'relative' }}>
                                        {isImg ? (
                                            <img src={doc.duong_dan_file} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        ) : (
                                            <Icon name={meta.icon} size={40} color={`var(--${meta.color})`} />
                                        )}
                                        <div style={{ position: 'absolute', top: 8, right: 8, padding: '2px 8px', borderRadius: 999, background: 'rgba(0,0,0,0.4)', fontSize: 10, fontWeight: 700, color: 'white', letterSpacing: 0.5 }}>
                                            {meta.label}
                                        </div>
                                    </div>
                                    <div style={{ padding: '10px 12px' }}>
                                        <div style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {getDocumentTitle(doc)}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 3 }}>
                                            {new Date(doc.created_at).toLocaleDateString('vi-VN')}{doc.kich_thuoc ? ` · ${formatBytes(doc.kich_thuoc)}` : ''}
                                        </div>
                                        {canManage && (
                                            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                                                <button type="button" onClick={(event) => { event.stopPropagation(); openEdit(doc); }} className="gp-btn gp-btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '6px 8px', fontSize: 12 }}>
                                                    <Icon name="edit" size={12} />
                                                    Sửa
                                                </button>
                                                <button type="button" onClick={(event) => { event.stopPropagation(); void handleDelete(doc); }} className="gp-btn gp-btn-ghost" style={{ color: 'var(--crimson)', padding: '6px 8px' }} title="Xóa tài liệu">
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

                {/* List View */}
                {!loading && filtered.length > 0 && viewMode === 'list' && (
                    <div style={{ background: 'var(--bg-elev)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                        {filtered.map((doc, i) => {
                            const meta = CATEGORY_META[doc._cat];
                            return (
                                <div
                                    key={doc.id}
                                    onClick={() => setPreview(doc)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: i < filtered.length - 1 ? '1px solid var(--line-soft)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--gold-glow)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `color-mix(in srgb, var(--${meta.color}) 12%, transparent)`, border: `1px solid color-mix(in srgb, var(--${meta.color}) 20%, transparent)`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                        <Icon name={meta.icon} size={18} color={`var(--${meta.color})`} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getDocumentTitle(doc)}</div>
                                        <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2 }}>{meta.label} · {new Date(doc.created_at).toLocaleDateString('vi-VN')}{doc.kich_thuoc ? ` · ${formatBytes(doc.kich_thuoc)}` : ''}</div>
                                    </div>
                                    {canManage && (
                                        <button type="button" onClick={(event) => { event.stopPropagation(); openEdit(doc); }} className="gp-btn gp-btn-ghost" title="Sửa tài liệu">
                                            <Icon name="edit" size={13} />
                                        </button>
                                    )}
                                    <a href={doc.duong_dan_file} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                                        Xem →
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {formOpen && (
                <TaiLieuFormModal
                    doc={editing}
                    members={members}
                    defaultDongHoId={user?.dong_ho_id || user?.dong_ho?.id || null}
                    onClose={() => {
                        setFormOpen(false);
                        setEditing(null);
                    }}
                    onSaved={async () => {
                        setFormOpen(false);
                        setEditing(null);
                        await loadDocs();
                    }}
                />
            )}

            {preview && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} onClick={() => setPreview(null)}>
                    <div style={{ background: 'var(--bg-elev)', borderRadius: 20, border: '1px solid var(--line)', maxWidth: 800, width: '90%', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                                {getDocumentTitle(preview)}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {canManage && (
                                    <>
                                        <button type="button" onClick={() => openEdit(preview)} style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--card-soft)', border: '1px solid var(--line)', color: 'var(--ink-soft)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                                            Sửa
                                        </button>
                                        <button type="button" onClick={() => void handleDelete(preview)} style={{ padding: '6px 14px', borderRadius: 8, background: 'color-mix(in srgb, var(--crimson) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--crimson) 22%, transparent)', color: 'var(--crimson)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                                            Xóa
                                        </button>
                                    </>
                                )}
                                <a href={preview.duong_dan_file} target="_blank" rel="noreferrer" style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--gold-glow)', border: '1px solid var(--gold-pale)', color: 'var(--brown)', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>
                                    Mở tab mới ↗
                                </a>
                                <button onClick={() => setPreview(null)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card-soft)', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink-mute)' }}>
                                    <Icon name="x" size={14} />
                                </button>
                            </div>
                        </div>
                        <div style={{ maxHeight: '75vh', overflow: 'auto', display: 'grid', placeItems: 'center', padding: 20, background: 'var(--card-soft)' }}>
                            {detectCategory(preview.loai_file, preview.duong_dan_file) === 'image' ? (
                                <img src={preview.duong_dan_file} alt="preview" style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: 12, objectFit: 'contain' }} />
                            ) : detectCategory(preview.loai_file, preview.duong_dan_file) === 'video' ? (
                                <video src={preview.duong_dan_file} controls style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: 12 }} />
                            ) : detectCategory(preview.loai_file, preview.duong_dan_file) === 'pdf' ? (
                                <iframe src={preview.duong_dan_file} style={{ width: '100%', height: '65vh', borderRadius: 12, border: 'none' }} title="PDF" />
                            ) : (
                                <div style={{ textAlign: 'center', padding: 40 }}>
                                    <Icon name="scroll" size={48} color="var(--ink-faint)" />
                                    <p style={{ marginTop: 12, color: 'var(--ink-mute)', fontSize: 13 }}>Không thể xem trước tệp này. Nhấn "Mở tab mới" để tải về.</p>
                                </div>
                            )}
                        </div>
                        {preview.du_lieu_orc && (
                            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', background: 'var(--bg-elev)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>Nội dung nhận diện (OCR)</div>
                                <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6, margin: 0, maxHeight: 80, overflow: 'auto' }}>{preview.du_lieu_orc}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function TaiLieuFormModal({
    doc,
    members,
    defaultDongHoId,
    onClose,
    onSaved,
}: {
    doc: TaiLieu | null;
    members: Nguoi[];
    defaultDongHoId: number | string | null;
    onClose: () => void;
    onSaved: () => Promise<void>;
}) {
    const [form, setForm] = useState<TaiLieuFormState>({
        ten_tai_lieu: doc?.ten_tai_lieu || '',
        mo_ta: doc?.mo_ta || '',
        thanh_vien_id: doc?.thanh_vien_id ? String(doc.thanh_vien_id) : '',
        du_lieu_orc: doc?.du_lieu_orc || '',
        file: null,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const setField = (key: keyof TaiLieuFormState, value: string | File | null) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!doc && !form.file) {
            setError('Vui lòng chọn tệp cần tải lên.');
            return;
        }

        if (!defaultDongHoId && !form.thanh_vien_id) {
            setError('Tài liệu cần gắn với dòng họ hoặc một thành viên.');
            return;
        }

        const payload = new FormData();
        if (doc) payload.append('id', String(doc.id));
        if (defaultDongHoId) payload.append('dong_ho_id', String(defaultDongHoId));
        if (form.thanh_vien_id) payload.append('thanh_vien_id', form.thanh_vien_id);
        if (form.ten_tai_lieu.trim()) payload.append('ten_tai_lieu', form.ten_tai_lieu.trim());
        if (form.mo_ta.trim()) payload.append('mo_ta', form.mo_ta.trim());
        if (form.du_lieu_orc.trim()) payload.append('du_lieu_orc', form.du_lieu_orc.trim());
        if (form.file) payload.append('file', form.file);

        setSaving(true);
        setError('');

        try {
            const res = doc
                ? await taiLieuApi.update(payload)
                : await taiLieuApi.create(payload);

            if (res.success) {
                toast.success(res.message || 'Đã lưu tài liệu');
                await onSaved();
            } else {
                setError(res.message || 'Không thể lưu tài liệu.');
            }
        } catch (submitError) {
            setError(getErrorMessage(submitError, 'Không thể lưu tài liệu.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
            <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-elev)', borderRadius: 18, border: '1px solid var(--line)', boxShadow: '0 24px 60px rgba(0,0,0,0.28)' }}>
                <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, var(--gold), var(--brown-soft))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, opacity: 0.8 }}>Tài liệu</div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{doc ? 'Cập nhật tài liệu' : 'Thêm tài liệu mới'}</h2>
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
                        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Tệp tài liệu{doc ? ' mới' : ''}</span>
                        <input
                            type="file"
                            onChange={(event) => setField('file', event.target.files?.[0] || null)}
                            className="gp-input"
                            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        />
                        {doc ? (
                            <span style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>
                                Để trống nếu muốn giữ tệp hiện tại: {getDocumentTitle(doc)}
                            </span>
                        ) : null}
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Tên tài liệu</span>
                        <input value={form.ten_tai_lieu} onChange={(event) => setField('ten_tai_lieu', event.target.value)} className="gp-input" placeholder="Ví dụ: Gia phả họ Nguyễn bản scan 1990" />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Gắn với thành viên</span>
                        <select value={form.thanh_vien_id} onChange={(event) => setField('thanh_vien_id', event.target.value)} className="gp-input">
                            <option value="">Tài liệu chung của dòng họ</option>
                            {members.map((member) => (
                                <option key={member.id} value={member.id}>{member.ten_day_du}</option>
                            ))}
                        </select>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Mô tả</span>
                        <textarea value={form.mo_ta} onChange={(event) => setField('mo_ta', event.target.value)} className="gp-input" rows={3} placeholder="Nguồn gốc, bối cảnh, người cung cấp..." style={{ resize: 'vertical' }} />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Nội dung OCR / ghi chú tra cứu</span>
                        <textarea value={form.du_lieu_orc} onChange={(event) => setField('du_lieu_orc', event.target.value)} className="gp-input" rows={4} placeholder="Nhập nội dung nhận diện hoặc trích yếu để tìm kiếm sau này..." style={{ resize: 'vertical' }} />
                    </label>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
                        <button type="button" onClick={onClose} className="gp-btn gp-btn-ghost">Hủy</button>
                        <button type="submit" disabled={saving} className="gp-btn gp-btn-primary" style={{ opacity: saving ? 0.65 : 1 }}>
                            {saving ? 'Đang lưu...' : 'Lưu tài liệu'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
