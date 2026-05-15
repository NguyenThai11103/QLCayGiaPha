import { router } from '@inertiajs/react';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import Icon from '../components/gia-pha/Icon';
import { useAuth } from '../contexts/auth.context';

interface AuthenticatedLayoutProps {
    children: ReactNode;
    fullBleed?: boolean;
}

const navigation = [
    { section: 'Gia phả', name: 'Bảng điều khiển', href: '/gia-pha/dashboard', icon: 'dashboard' as const },
    { section: 'Gia phả', name: 'Cây Gia Phả', href: '/gia-pha/cay-gia-pha', icon: 'tree' as const },
    { section: 'Quản lý', name: 'Thành viên', href: '/gia-pha/thanh-vien', icon: 'users' as const },
    { section: 'Quản lý', name: 'Tra cứu danh xưng', href: '/gia-pha/tra-cuu-danh-xung', icon: 'link' as const },
    { section: 'Quản lý', name: 'Sự kiện', href: '/gia-pha/events', icon: 'calendar' as const },
];

export default function AuthenticatedLayout({ children, fullBleed = false }: AuthenticatedLayoutProps) {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [pathname, setPathname] = useState('');

    useEffect(() => {
        setPathname(window.location.pathname);
    }, []);

    const groupedNavigation = useMemo(() => {
        return navigation.reduce<Record<string, typeof navigation>>((groups, item) => {
            groups[item.section] = [...(groups[item.section] || []), item];
            return groups;
        }, {});
    }, []);

    const activeItem = navigation.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    const displayName = user?.ho_va_ten || 'Minh Anh';
    const role = user?.ten_chuc_vu || (user?.is_master === 1 ? 'Quản trị dòng họ' : 'Thành viên');
    const initials = user?.ten_goi_nho?.charAt(0).toUpperCase() || displayName.trim().charAt(0).toUpperCase() || 'G';

    const visit = (href: string) => {
        setSidebarOpen(false);
        router.visit(href);
    };

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Đóng menu"
                    className="fixed inset-0 z-30 bg-black/35 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[var(--line)] bg-[var(--bg-elev)] px-4 py-5 transition-transform duration-200 md:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <button type="button" className="flex items-center gap-3 border-b border-[var(--line-soft)] px-2 pb-5 text-left" onClick={() => visit('/')}>
                    <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] text-[#fffef9] shadow-[var(--shadow-gold)]">
                        <Icon name="lotus" size={20} />
                    </span>
                    <span className="leading-none">
                        <span className="font-serif text-[24px] font-semibold tracking-[0.4px] text-[var(--ink)]">Gia Phả</span>
                        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[1.8px] text-[var(--ink-mute)]">Nguồn cội số</span>
                    </span>
                </button>

                <nav className="mt-3 flex flex-1 flex-col gap-1 overflow-y-auto">
                    {Object.entries(groupedNavigation).map(([section, items]) => (
                        <div key={section}>
                            <div className="px-3 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[1.6px] text-[var(--ink-mute)]">
                                {section}
                            </div>
                            {items.map((item) => {
                                const active = activeItem?.href === item.href;
                                return (
                                    <button
                                        key={item.href}
                                        type="button"
                                        onClick={() => visit(item.href)}
                                        className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium transition ${
                                            active
                                                ? 'bg-[linear-gradient(90deg,var(--gold-glow),transparent)] text-[var(--ink)]'
                                                : 'text-[var(--ink-soft)] hover:bg-[var(--card-soft)] hover:text-[var(--ink)]'
                                        }`}
                                    >
                                        {active && <span className="absolute -left-4 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[var(--gold)]" />}
                                        <Icon name={item.icon} size={18} className={active ? 'text-[var(--gold)]' : 'text-[var(--ink-mute)]'} />
                                        <span>{item.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className="border-t border-[var(--line-soft)] pt-4">
                    <button type="button" className="mb-3 flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-[var(--card-soft)]" onClick={() => visit('/profile')}>
                        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[linear-gradient(135deg,var(--gold-soft),var(--terracotta))] text-sm font-bold text-white">
                            {user?.anh_dai_dien ? <img src={user.anh_dai_dien} alt={displayName} className="h-full w-full object-cover" /> : initials}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-[var(--ink)]">{displayName}</span>
                            <span className="block truncate text-[11px] text-[var(--ink-mute)]">{role}</span>
                        </span>
                    </button>
                    <button type="button" onClick={() => void logout()} className="gp-btn gp-btn-ghost w-full">
                        <Icon name="logout" size={16} />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            <div className="min-h-screen md:pl-[248px]">
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg-elev)_92%,transparent)] px-4 backdrop-blur md:px-7">
                    <div className="flex min-w-0 items-center gap-4">
                        <button type="button" aria-label="Mở menu" className="grid h-9 w-9 place-items-center rounded-lg text-[var(--ink-soft)] hover:bg-[var(--card-soft)] md:hidden" onClick={() => setSidebarOpen(true)}>
                            <Icon name="menu" size={20} />
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
                        <button type="button" onClick={() => visit('/gia-pha/thanh-vien')} className="gp-btn gp-btn-primary hidden sm:inline-flex">
                            <Icon name="plus" size={16} />
                            Thêm thành viên
                        </button>
                    </div>
                </header>

                <main className={fullBleed ? 'min-h-[calc(100vh-64px)]' : 'min-h-[calc(100vh-64px)] p-4 md:p-8'}>
                    {children}
                </main>
            </div>
        </div>
    );
}
