import { router } from '@inertiajs/react';
import { ReactNode, useEffect, useState } from 'react';
import Icon from '../components/gia-pha/Icon';
import QRHubModal from '../components/gia-pha/QRHubModal';
import { useAuth } from '../contexts/auth.context';

const themePresets: Record<string, Record<string, string>> = {
    gold: {
        '--gold': '#b8902c',
        '--gold-soft': '#d4af55',
        '--gold-glow': '#faf1d4',
        '--gold-pale': '#f0e2bb',
        '--brown': '#5c3a1e',
        '--brown-soft': '#8a5a2e',
    },
    crimson: {
        '--gold': '#9b2b1f',
        '--gold-soft': '#c44535',
        '--gold-glow': '#fdeeed',
        '--gold-pale': '#fcdcd9',
        '--brown': '#5a1911',
        '--brown-soft': '#80261b',
    },
    jade: {
        '--gold': '#2f5d3a',
        '--gold-soft': '#4a7a52',
        '--gold-glow': '#edf7ee',
        '--gold-pale': '#dbeedc',
        '--brown': '#193a20',
        '--brown-soft': '#24522d',
    },
    indigo: {
        '--gold': '#225b7a',
        '--gold-soft': '#3e84a8',
        '--gold-glow': '#edf6fa',
        '--gold-pale': '#dcecf5',
        '--brown': '#123447',
        '--brown-soft': '#1a4963',
    },
    bronze: {
        '--gold': '#8b5a2b',
        '--gold-soft': '#a06d3b',
        '--gold-glow': '#f7f2ed',
        '--gold-pale': '#eeded1',
        '--brown': '#4a2f14',
        '--brown-soft': '#69431c',
    }
};

interface AuthenticatedLayoutProps {
    children: ReactNode;
    fullBleed?: boolean;
}

interface NavigationItem {
    name: string;
    href: string;
    icon: ReactNode;
}

const navigation: NavigationItem[] = [
    {
        name: 'Tổng quan',
        href: '/gia-pha/dashboard',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11l9-8 9 8" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
            </svg>
        ),
    },
    {
        name: 'Cây Gia Phả',
        href: '/gia-pha/cay-gia-pha',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="4" r="2" strokeWidth={2} />
                <circle cx="6" cy="12" r="2" strokeWidth={2} />
                <circle cx="18" cy="12" r="2" strokeWidth={2} />
                <circle cx="4" cy="20" r="1.5" strokeWidth={2} />
                <circle cx="9" cy="20" r="1.5" strokeWidth={2} />
                <circle cx="15" cy="20" r="1.5" strokeWidth={2} />
                <circle cx="20" cy="20" r="1.5" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v3M6 14v3M18 14v3M12 9H6m6 0h6M4 18.5V17h16v1.5" />
            </svg>
        ),
    },
    {
        name: 'Thành viên',
        href: '/gia-pha/thanh-vien',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11a4 4 0 10-8 0 4 4 0 008 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 21a8 8 0 0116 0" />
            </svg>
        ),
    },
    {
        name: 'Mộ phần',
        href: '/gia-pha/mo-phan',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s6-5.2 6-11a6 6 0 10-12 0c0 5.8 6 11 6 11z" />
                <circle cx="12" cy="10" r="2" strokeWidth={2} />
            </svg>
        ),
    },
    {
        name: 'Tra cứu danh xưng',
        href: '/gia-pha/tra-cuu-danh-xung',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14a4 4 0 010-6l3-3a4 4 0 116 6l-1.5 1.5" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10a4 4 0 010 6l-3 3a4 4 0 11-6-6l1.5-1.5" />
            </svg>
        ),
    },
    {
        name: 'Sự kiện',
        href: '/gia-pha/events',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="16" rx="2" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M8 3v4M16 3v4" />
            </svg>
        ),
    },
    {
        name: 'Tài liệu',
        href: '/gia-pha/tai-lieu',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
];

const adminNavigation: NavigationItem[] = [
    {
        name: 'Tổng quan hệ thống',
        href: '/admin/dashboard',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        name: 'Quản lý Dòng họ',
        href: '/admin/dong-ho',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
    },
    {
        name: 'Quản lý Người dùng',
        href: '/admin/nguoi-dung',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
];

export default function AuthenticatedLayout({ children, fullBleed = false }: AuthenticatedLayoutProps) {
    const { user, logout, isAuthenticated, isLoading } = useAuth();
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.localStorage.getItem('gp-sidebar-collapsed') === 'true';
    });
    const [pathname, setPathname] = useState('');

    useEffect(() => {
        setPathname(window.location.pathname);
    }, []);

    useEffect(() => {
        window.localStorage.setItem('gp-sidebar-collapsed', String(sidebarCollapsed));
    }, [sidebarCollapsed]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            window.location.href = '/login';
        } else if (!isLoading && isAuthenticated) {
            const isAdminPath = pathname.startsWith('/admin');
            const isOnboarding = pathname.startsWith('/onboarding');
            const needsOnboarding = user?.quyen_han !== 'admin' && (!user?.dong_ho_id || user?.trang_thai_gia_nhap === 'cho_duyet');
            
            if (!isAdminPath && !isOnboarding && needsOnboarding) {
                window.location.href = '/onboarding';
            }
        }
    }, [isLoading, isAuthenticated, pathname, user]);

    if (isLoading || !isAuthenticated) {
        return null;
    }

    let currentNavigation = user?.quyen_han === 'admin' ? adminNavigation : [...navigation];
    if (user?.quyen_han === 'quan_ly') {
        currentNavigation.splice(3, 0, {
            name: 'Duyệt thành viên',
            href: '/gia-pha/cho-duyet',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        });
    }
    const activeItem = currentNavigation.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    const displayName = user?.ho_va_ten || 'Minh Anh';
    
    let role = 'Thành viên';
    if (user?.quyen_han === 'admin') role = 'Quản trị viên Hệ thống';
    else if (user?.quyen_han === 'quan_ly') role = 'Quản trị dòng họ';
    else if (user?.ten_chuc_vu) role = user.ten_chuc_vu;

    const initials = user?.ten_goi_nho?.charAt(0).toUpperCase() || displayName.trim().charAt(0).toUpperCase() || 'G';

    const visit = (href: string) => {
        setSidebarOpen(false);
        router.visit(href);
    };

    const themeColor = user?.dong_ho?.theme_color || 'gold';
    const themeStyles = themePresets[themeColor] || themePresets.gold;

    return (
        <div style={themeStyles as React.CSSProperties} className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Đóng menu"
                    className="fixed inset-0 z-30 bg-black/35 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[var(--line)] bg-[var(--bg-elev)] px-4 py-5 transition-[transform,width,padding] duration-200 md:translate-x-0 ${
                    sidebarCollapsed ? 'md:w-[76px] md:px-3' : 'md:w-[248px] md:px-4'
                } ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <button
                    type="button"
                    className={`flex items-center gap-3 border-b border-[var(--line-soft)] px-2 pb-5 text-left ${sidebarCollapsed ? 'md:justify-center md:px-0' : ''}`}
                    onClick={() => visit('/')}
                    title={user?.dong_ho?.ten_dong_ho || 'Gia Phả'}
                >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] text-[#fffef9] shadow-[var(--shadow-gold)] overflow-hidden">
                        {user?.dong_ho?.logo_path ? (
                            <img src={user.dong_ho.logo_path} alt="Logo" className="h-full w-full object-cover" />
                        ) : (
                            <Icon name="lotus" size={20} />
                        )}
                    </span>
                    <span className={`leading-none ${sidebarCollapsed ? 'md:hidden' : ''}`}>
                        <span className="font-serif text-[18px] font-semibold tracking-[0.4px] text-[var(--ink)] block truncate max-w-[150px]">
                            {user?.dong_ho?.ten_dong_ho || 'Gia Phả'}
                        </span>
                        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[1.8px] text-[var(--ink-mute)]">Nguồn cội số</span>
                    </span>
                </button>

                <button
                    type="button"
                    aria-label={sidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
                    className="mt-3 hidden h-9 w-full place-items-center rounded-lg text-[var(--ink-soft)] transition hover:bg-[var(--card-soft)] hover:text-[var(--ink)] md:grid"
                    onClick={() => setSidebarCollapsed((value) => !value)}
                >
                    <Icon name="chevron-right" size={17} className={`transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
                </button>

                <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto">
                    <div className={`px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[1.6px] text-[var(--ink-mute)] ${sidebarCollapsed ? 'md:hidden' : ''}`}>
                        Điều hướng
                    </div>

                    {currentNavigation.map((item) => {
                        const active = activeItem?.href === item.href;

                        return (
                            <button
                                key={item.href}
                                type="button"
                                onClick={() => visit(item.href)}
                                title={item.name}
                                className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium transition ${
                                    sidebarCollapsed ? 'md:justify-center md:px-0' : ''
                                } ${
                                    active
                                        ? 'bg-[linear-gradient(90deg,var(--gold-glow),transparent)] text-[var(--ink)]'
                                        : 'text-[var(--ink-soft)] hover:bg-[var(--card-soft)] hover:text-[var(--ink)]'
                                }`}
                            >
                                {active && <span className="absolute -left-4 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[var(--gold)]" />}
                                <span className={active ? 'text-[var(--gold)]' : 'text-[var(--ink-mute)]'}>{item.icon}</span>
                                <span className={sidebarCollapsed ? 'md:hidden' : ''}>{item.name}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="border-t border-[var(--line-soft)] pt-4">
                    <button
                        type="button"
                        className={`mb-3 flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-[var(--card-soft)] ${
                            sidebarCollapsed ? 'md:justify-center md:px-0' : ''
                        }`}
                        onClick={() => visit('/profile')}
                        title={displayName}
                    >
                        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[linear-gradient(135deg,var(--gold-soft),var(--terracotta))] text-sm font-bold text-white">
                            {user?.anh_dai_dien ? <img src={user.anh_dai_dien} alt={displayName} className="h-full w-full object-cover" /> : initials}
                        </span>
                        <span className={`min-w-0 flex-1 ${sidebarCollapsed ? 'md:hidden' : ''}`}>
                            <span className="block truncate text-[13px] font-semibold text-[var(--ink)]">{displayName}</span>
                            <span className="block truncate text-[11px] text-[var(--ink-mute)]">{role}</span>
                        </span>
                    </button>
                    <button type="button" onClick={() => void logout()} className={`gp-btn gp-btn-ghost w-full ${sidebarCollapsed ? 'md:px-0 md:text-[0px]' : ''}`} title="Đăng xuất">
                        <Icon name="logout" size={16} />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            <div className={`min-h-screen transition-[padding] duration-200 ${sidebarCollapsed ? 'md:pl-[76px]' : 'md:pl-[248px]'}`}>
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg-elev)_92%,transparent)] px-4 backdrop-blur md:px-7">
                    <div className="flex min-w-0 items-center gap-4">
                        <button type="button" aria-label="Mở menu" className="grid h-9 w-9 place-items-center rounded-lg text-[var(--ink-soft)] hover:bg-[var(--card-soft)] md:hidden" onClick={() => setSidebarOpen(true)}>
                            <Icon name="menu" size={20} />
                        </button>
                        <button
                            type="button"
                            aria-label={sidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
                            className="hidden h-9 w-9 place-items-center rounded-lg text-[var(--ink-soft)] hover:bg-[var(--card-soft)] md:grid"
                            onClick={() => setSidebarCollapsed((value) => !value)}
                        >
                            <Icon name="menu" size={18} />
                        </button>
                        <div className="hidden min-w-0 items-center gap-2 text-[13px] text-[var(--ink-mute)] sm:flex">
                            <button type="button" onClick={() => visit('/')} className="hover:text-[var(--ink)]">Gia Phả</button>
                            <span className="opacity-40">/</span>
                            <span className="truncate font-medium text-[var(--ink)]">{activeItem?.name || 'Không gian dòng họ'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <label className="relative hidden w-[min(360px,32vw)] lg:block">
                            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-mute)]" />
                            <input className="gp-input w-full bg-[var(--card-soft)] py-2 pl-9 pr-16 text-[13px]" placeholder="Tìm thành viên, chi phái, tư liệu..." />
                            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-[var(--line)] bg-[var(--bg)] px-1.5 py-0.5 text-[10px] text-[var(--ink-mute)]">⌘K</kbd>
                        </label>
                        <button type="button" aria-label="Thông báo" className="relative grid h-9 w-9 place-items-center rounded-lg text-[var(--ink-soft)] hover:bg-[var(--card-soft)]">
                            <Icon name="bell" size={18} />
                            <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full border-2 border-[var(--bg-elev)] bg-[var(--crimson)]" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsQRModalOpen(true)}
                            aria-label="Định danh QR"
                            className="relative grid h-9 w-9 place-items-center rounded-lg text-[var(--ink-soft)] hover:bg-[var(--card-soft)]"
                            title="Định danh QR dòng họ"
                        >
                            <svg className="h-5 w-5 text-[var(--ink-soft)] hover:text-[var(--gold)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                <path d="M14 14h3v3h-3zM17 17h4v4h-4zM14 17h3v4h-3zM17 14h4v3h-4z" />
                            </svg>
                        </button>

                    </div>
                </header>

                <main className={fullBleed ? 'min-h-[calc(100vh-64px)]' : 'min-h-[calc(100vh-64px)] p-4 md:p-8'}>
                    {children}
                </main>
            </div>

            <QRHubModal
                isOpen={isQRModalOpen}
                onClose={() => setIsQRModalOpen(false)}
                initialTab="my-qr"
            />
        </div>
    );
}
