import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import Icon from '../../../components/gia-pha/Icon';
import { TaiLieu, taiLieuApi } from '../../../services/gia-pha.api';
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

export default function TaiLieuPage() {
    const { user } = useAuth();
    const [docs,     setDocs]     = useState<TaiLieu[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [filter,   setFilter]   = useState<FilterMode>('all');
    const [search,   setSearch]   = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [preview,  setPreview]  = useState<TaiLieu | null>(null);

    const loadDocs = async () => {
        setLoading(true);
        try {
            const dongHoId = user?.dong_ho?.id;
            const res = await taiLieuApi.list(dongHoId ? { dong_ho_id: dongHoId } : undefined);
            if (res.success && res.data) setDocs(res.data);
        } catch {
            // noop
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void loadDocs(); }, [user?.dong_ho?.id]);

    const enriched = useMemo(() =>
        docs.map(d => ({ ...d, _cat: detectCategory(d.loai_file, d.duong_dan_file) })),
    [docs]);

    const filtered = useMemo(() => {
        let list = filter === 'all' ? enriched : enriched.filter(d => d._cat === filter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(d => d.duong_dan_file.toLowerCase().includes(q));
        }
        return list;
    }, [enriched, filter, search]);

    const counts = useMemo(() => {
        const c: Record<FilterMode, number> = { all: enriched.length, image: 0, video: 0, pdf: 0, document: 0, other: 0 };
        for (const d of enriched) c[d._cat]++;
        return c;
    }, [enriched]);

    const isMaster = user?.is_master === 1;

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

                    {isMaster && (
                        <button className="gp-btn gp-btn-primary" style={{ gap: 6, display: 'flex', alignItems: 'center' }}>
                            <Icon name="plus" size={13} />
                            Thêm tài liệu
                        </button>
                    )}
                </div>

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
                        {isMaster && !search && (
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
                                            {doc.duong_dan_file.split('/').pop()}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 3 }}>
                                            {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                                        </div>
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
                                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.duong_dan_file.split('/').pop()}</div>
                                        <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2 }}>{meta.label} · {new Date(doc.created_at).toLocaleDateString('vi-VN')}</div>
                                    </div>
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
            {preview && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} onClick={() => setPreview(null)}>
                    <div style={{ background: 'var(--bg-elev)', borderRadius: 20, border: '1px solid var(--line)', maxWidth: 800, width: '90%', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                                {preview.duong_dan_file.split('/').pop()}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
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
