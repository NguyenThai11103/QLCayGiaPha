import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState, useRef } from 'react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import Icon from '../../../components/gia-pha/Icon';
import toast from '../../../lib/toast.util';
import { AlbumAnh, AnhAlbum, albumAnhApi } from '../../../services/gia-pha.api';
import { useAuth } from '../../../contexts/auth.context';

interface AlbumAnhDetailPageProps {
    id: string | number;
}

type AlbumCategory = 'tu_duong' | 'hop_ho' | 'gioi_to' | 'mo_phan' | 'tu_lieu';

const CATEGORY_META: Record<AlbumCategory, { label: string; icon: React.ComponentProps<typeof Icon>['name']; color: string }> = {
    tu_duong : { label: 'Từ đường',  icon: 'lotus',  color: 'gold'       },
    hop_ho   : { label: 'Họp họ',    icon: 'users',  color: 'jade'       },
    gioi_to  : { label: 'Giỗ tổ',    icon: 'scroll', color: 'brown'      },
    mo_phan  : { label: 'Mộ phần',   icon: 'pin',    color: 'terracotta' },
    tu_lieu  : { label: 'Tư liệu',   icon: 'book',   color: 'indigo'     },
};

export default function AlbumAnhDetailPage({ id }: AlbumAnhDetailPageProps) {
    const { user } = useAuth();
    const [album, setAlbum] = useState<AlbumAnh | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    
    // Lightbox state
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [captions, setCaptions] = useState<string[]>([]);
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadAlbum = async () => {
        setLoading(true);
        setLoadError('');
        try {
            const res = await albumAnhApi.detail(id);
            if (res.success && res.data) {
                setAlbum(res.data);
            } else {
                setLoadError(res.message || 'Không thể tải chi tiết album.');
            }
        } catch (error) {
            setLoadError('Không thể kết nối đến máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            void loadAlbum();
        }
    }, [id]);

    const canManage = ['truong_toc', 'quan_ly'].includes(user?.quyen_han || '');

    const handleDeletePhoto = async (photoId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi album?')) return;

        try {
            const res = await albumAnhApi.deletePhoto(photoId);
            if (res.success) {
                toast.success(res.message || 'Đã xóa ảnh thành công');
                await loadAlbum();
            }
        } catch (error) {
            toast.error('Không thể xóa ảnh.');
        }
    };

    // Drag-and-drop events
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            if (files.length > 0) {
                setSelectedFiles(prev => [...prev, ...files]);
                setCaptions(prev => [...prev, ...Array(files.length).fill('')]);
            } else {
                toast.error('Chỉ hỗ trợ tải lên file hình ảnh.');
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
            setSelectedFiles(prev => [...prev, ...files]);
            setCaptions(prev => [...prev, ...Array(files.length).fill('')]);
        }
    };

    const removeSelectedFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setCaptions(prev => prev.filter((_, i) => i !== index));
    };

    const handleCaptionChange = (index: number, val: string) => {
        setCaptions(prev => {
            const newCaptions = [...prev];
            newCaptions[index] = val;
            return newCaptions;
        });
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        try {
            const res = await albumAnhApi.uploadPhotos(Number(id), selectedFiles, captions);
            if (res.success) {
                toast.success(res.message || 'Đã tải lên hình ảnh thành công');
                setSelectedFiles([]);
                setCaptions([]);
                await loadAlbum();
            } else {
                toast.error(res.message || 'Không thể tải ảnh lên.');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi tải ảnh lên.');
        } finally {
            setUploading(false);
        }
    };

    // Lightbox navigation
    const photos = album?.photos || [];
    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (lightboxIndex !== null && photos.length > 0) {
            setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
        }
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (lightboxIndex !== null && photos.length > 0) {
            setLightboxIndex((lightboxIndex + 1) % photos.length);
        }
    };

    // Keyboard controls for Lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxIndex === null) return;
            if (e.key === 'Escape') setLightboxIndex(null);
            if (e.key === 'ArrowLeft') setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
            if (e.key === 'ArrowRight') setLightboxIndex((lightboxIndex + 1) % photos.length);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, photos]);

    return (
        <AuthenticatedLayout>
            <Head title={album ? `${album.ten_album} - Album ảnh` : 'Chi tiết album'} />
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                
                {/* Back button */}
                <button 
                    onClick={() => router.visit('/gia-pha/album-anh')}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6, 
                        border: 'none', 
                        background: 'transparent', 
                        color: 'var(--ink-soft)', 
                        fontSize: 13, 
                        fontWeight: 600, 
                        cursor: 'pointer', 
                        marginBottom: 16,
                        padding: 0
                    }}
                >
                    <Icon name="x" size={13} style={{ transform: 'rotate(90deg)' }} />
                    Quay lại danh sách album
                </button>

                {loadError && !loading && (
                    <div style={{ background: 'color-mix(in srgb, var(--crimson) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--crimson) 22%, transparent)', borderRadius: 12, color: 'var(--crimson)', fontSize: 13, marginBottom: 16, padding: '12px 14px' }}>
                        {loadError}
                    </div>
                )}

                {/* Loading State */}
                {loading && !album && (
                    <div style={{ display: 'grid', placeItems: 'center', height: 260 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 36, height: 36, border: '4px solid var(--gold-pale)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                            <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>Đang tải album ảnh...</div>
                        </div>
                    </div>
                )}

                {/* Album detail */}
                {album && (
                    <div>
                        {/* Header Details */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--line-soft)', paddingBottom: 20 }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <span style={{ background: 'rgba(0,0,0,0.06)', padding: '3px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--ink-mute)' }}>
                                        Năm {album.nam}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-elev)', border: '1px solid var(--line)', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: 'var(--ink)' }}>
                                        <Icon name={CATEGORY_META[album.loai_album].icon} size={11} color={`var(--${CATEGORY_META[album.loai_album].color})`} />
                                        {CATEGORY_META[album.loai_album].label}
                                    </span>
                                </div>
                                <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px', fontFamily: 'Cormorant Garamond, serif' }}>
                                    {album.ten_album}
                                </h1>
                                <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0, maxWidth: 800 }}>
                                    {album.mo_ta || 'Không có mô tả cho album này.'}
                                </p>
                            </div>
                        </div>

                        {/* Image grid & upload space */}
                        <div style={{ display: 'grid', gridTemplateColumns: canManage ? '1fr 320px' : '1fr', gap: 24, alignItems: 'start' }}>
                            
                            {/* Left: Photos grid */}
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 14, borderBottom: '1px solid var(--line-soft)', paddingBottom: 6 }}>
                                    Hình ảnh ({photos.length})
                                </h3>

                                {photos.length === 0 ? (
                                    <div style={{ background: 'var(--bg-elev)', borderRadius: 16, border: '1px solid var(--line)', padding: '48px 24px', textAlign: 'center' }}>
                                        <Icon name="photo" size={40} color="var(--ink-faint)" />
                                        <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: 'var(--ink-mute)' }}>Album chưa có hình ảnh nào.</div>
                                        {canManage && <p style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 4 }}>Hãy kéo thả hoặc chọn hình ảnh bên cạnh để tải lên.</p>}
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                                        {photos.map((photo, index) => (
                                            <div 
                                                key={photo.id}
                                                onClick={() => setLightboxIndex(index)}
                                                style={{ 
                                                    position: 'relative', 
                                                    borderRadius: 12, 
                                                    overflow: 'hidden', 
                                                    border: '1px solid var(--line)', 
                                                    aspectRatio: '1', 
                                                    cursor: 'pointer',
                                                    background: 'var(--card-soft)'
                                                }}
                                                onMouseEnter={e => {
                                                    const img = e.currentTarget.querySelector('img');
                                                    if (img) img.style.transform = 'scale(1.05)';
                                                    const delBtn = e.currentTarget.querySelector('.del-btn') as HTMLElement;
                                                    if (delBtn) delBtn.style.opacity = '1';
                                                }}
                                                onMouseLeave={e => {
                                                    const img = e.currentTarget.querySelector('img');
                                                    if (img) img.style.transform = 'none';
                                                    const delBtn = e.currentTarget.querySelector('.del-btn') as HTMLElement;
                                                    if (delBtn) delBtn.style.opacity = '0';
                                                }}
                                            >
                                                <img 
                                                    src={photo.duong_dan_file} 
                                                    alt={photo.caption || ''} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.25s' }} 
                                                />
                                                {photo.caption && (
                                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', color: 'white', fontSize: 11.5, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                        {photo.caption}
                                                    </div>
                                                )}

                                                {/* Delete photo button */}
                                                {canManage && (
                                                    <button
                                                        type="button"
                                                        className="del-btn"
                                                        onClick={(e) => void handleDeletePhoto(photo.id, e)}
                                                        style={{ 
                                                            position: 'absolute', 
                                                            top: 8, 
                                                            right: 8, 
                                                            width: 26, 
                                                            height: 26, 
                                                            borderRadius: 6, 
                                                            background: 'rgba(239, 68, 68, 0.9)', 
                                                            color: 'white', 
                                                            border: 'none', 
                                                            cursor: 'pointer',
                                                            display: 'grid',
                                                            placeItems: 'center',
                                                            opacity: 0,
                                                            transition: 'opacity 0.15s'
                                                        }}
                                                        title="Xóa ảnh này"
                                                    >
                                                        <Icon name="trash" size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right: Upload Panel for managers */}
                            {canManage && (
                                <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 16, padding: 18, boxShadow: 'var(--shadow-sm)' }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Icon name="camera" size={14} color="var(--gold)" />
                                        Tải ảnh lên Album
                                    </h3>

                                    {/* Drag & Drop zone */}
                                    <div
                                        onDragEnter={handleDrag}
                                        onDragOver={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{ 
                                            border: `2px dashed ${isDragActive ? 'var(--gold)' : 'var(--line)'}`, 
                                            background: isDragActive ? 'var(--gold-glow)' : 'var(--card-soft)', 
                                            borderRadius: 12, 
                                            padding: '24px 16px', 
                                            textAlign: 'center', 
                                            cursor: 'pointer',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        <input 
                                            ref={fileInputRef}
                                            type="file" 
                                            multiple 
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }} 
                                        />
                                        <Icon name="plus" size={28} color="var(--ink-mute)" style={{ margin: '0 auto 8px', opacity: 0.7 }} />
                                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'block' }}>Kéo thả ảnh vào đây</span>
                                        <span style={{ fontSize: 11.5, color: 'var(--ink-mute)', display: 'block', marginTop: 4 }}>hoặc click để chọn file</span>
                                    </div>

                                    {/* Preview & Captions Form for selected files */}
                                    {selectedFiles.length > 0 && (
                                        <div style={{ marginTop: 18 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)' }}>Đã chọn ({selectedFiles.length})</span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => { setSelectedFiles([]); setCaptions([]); }} 
                                                    style={{ border: 'none', background: 'transparent', color: 'var(--crimson)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                                                >
                                                    Xóa tất cả
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 240, overflowY: 'auto', paddingRight: 4, marginBottom: 14 }}>
                                                {selectedFiles.map((file, idx) => (
                                                    <div key={idx} style={{ display: 'flex', gap: 10, background: 'var(--card-soft)', border: '1px solid var(--line-soft)', padding: 8, borderRadius: 8, alignItems: 'center' }}>
                                                        <img 
                                                            src={URL.createObjectURL(file)} 
                                                            alt="preview" 
                                                            style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} 
                                                        />
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Chú thích ảnh..." 
                                                                value={captions[idx] || ''}
                                                                onChange={e => handleCaptionChange(idx, e.target.value)}
                                                                style={{ 
                                                                    width: '100%', 
                                                                    padding: '4px 8px', 
                                                                    borderRadius: 6, 
                                                                    border: '1px solid var(--line)', 
                                                                    fontSize: 12,
                                                                    boxSizing: 'border-box'
                                                                }} 
                                                            />
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeSelectedFile(idx)} 
                                                            style={{ width: 22, height: 22, borderRadius: 999, border: 'none', background: 'transparent', color: 'var(--ink-mute)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                                                        >
                                                            <Icon name="x" size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleUpload}
                                                disabled={uploading}
                                                className="gp-btn gp-btn-primary"
                                                style={{ width: '100%', gap: 6, display: 'flex', justifyContent: 'center', opacity: uploading ? 0.65 : 1 }}
                                            >
                                                {uploading ? 'Đang tải lên...' : 'Bắt đầu tải lên'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            {lightboxIndex !== null && photos.length > 0 && (
                <div 
                    style={{ 
                        position: 'fixed', 
                        inset: 0, 
                        zIndex: 100, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        background: 'rgba(0,0,0,0.92)', 
                        backdropFilter: 'blur(8px)' 
                    }}
                    onClick={() => setLightboxIndex(null)}
                >
                    {/* Header bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', color: 'white' }} onClick={e => e.stopPropagation()}>
                        <span style={{ fontSize: 13, color: '#aaa' }}>
                            Ảnh {lightboxIndex + 1} / {photos.length}
                        </span>
                        <button 
                            onClick={() => setLightboxIndex(null)} 
                            style={{ 
                                width: 36, 
                                height: 36, 
                                borderRadius: 999, 
                                border: 'none', 
                                background: 'rgba(255,255,255,0.1)', 
                                color: 'white', 
                                cursor: 'pointer', 
                                display: 'grid', 
                                placeItems: 'center' 
                            }}
                        >
                            <Icon name="x" size={16} />
                        </button>
                    </div>

                    {/* Image space with Prev/Next buttons */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                        <button 
                            onClick={handlePrev} 
                            style={{ 
                                width: 44, 
                                height: 44, 
                                borderRadius: 999, 
                                border: 'none', 
                                background: 'rgba(255,255,255,0.1)', 
                                color: 'white', 
                                cursor: 'pointer', 
                                display: 'grid', 
                                placeItems: 'center' 
                            }}
                        >
                            <Icon name="x" size={18} style={{ transform: 'rotate(-90deg)' }} />
                        </button>

                        <div 
                            style={{ 
                                flex: 1, 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                maxHeight: '75vh',
                                padding: '0 20px'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <img 
                                src={photos[lightboxIndex].duong_dan_file} 
                                alt="" 
                                style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} 
                            />
                            {photos[lightboxIndex].caption && (
                                <p style={{ color: 'white', fontSize: 14.5, marginTop: 16, background: 'rgba(0,0,0,0.6)', padding: '6px 16px', borderRadius: 8, textAlign: 'center', maxWidth: '80%' }}>
                                    {photos[lightboxIndex].caption}
                                </p>
                            )}
                        </div>

                        <button 
                            onClick={handleNext} 
                            style={{ 
                                width: 44, 
                                height: 44, 
                                borderRadius: 999, 
                                border: 'none', 
                                background: 'rgba(255,255,255,0.1)', 
                                color: 'white', 
                                cursor: 'pointer', 
                                display: 'grid', 
                                placeItems: 'center' 
                            }}
                        >
                            <Icon name="x" size={18} style={{ transform: 'rotate(90deg)' }} />
                        </button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
