import { router } from '@inertiajs/react';
import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth.context';

interface AuthenticatedLayoutProps {
    children: ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Handle screen resize to auto-close/open sidebar logic
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            // Optional: Auto-collapse on mobile if resizing from desktop?
            // For now, let's just update the isMobile state for rendering logic if needed,
            // though CSS classes handle most of it.
            if (mobile && sidebarOpen) {
                // We might not want to force close if user intentionally opened it,
                // but typically transitioning to mobile implies smaller screen.
                setSidebarOpen(false);
            } else if (!mobile && !sidebarOpen) {
                // Determine if we want to auto-open on desktop?
                // Let's keep previous state or default to open.
                setSidebarOpen(true);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navigation = [
        {
            name: 'Tổng quan Gia Phả',
            href: '/gia-pha/dashboard',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            name: 'Thành viên',
            href: '/gia-pha/thanh-vien',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
        {
            name: 'Cây Gia Phả',
            href: '/gia-pha/cay-gia-pha',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            ),
        },
        {
            name: 'Tra cứu danh xưng',
            href: '/gia-pha/tra-cuu-danh-xung',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
        },
    ];

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 transition-opacity md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-30 flex flex-col border-r border-gray-200 bg-white transition-all duration-300 md:static
                    ${sidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full w-64 md:w-20 md:translate-x-0'}
                `}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-center border-b border-gray-200 px-4">
                    {/* On Desktop: Show Full Logo if Open, Icon if Closed. On Mobile: Always Show Full Logo if Drawer Open */}
                    {(sidebarOpen || !isMobile) ? (
                        sidebarOpen ? (
                            <div className="flex items-center space-x-3">
                                <img src="/logo-img.png" alt="DZ Logo" className="h-10 w-10" />
                                <span className="text-xl font-bold" style={{ background: 'linear-gradient(135deg, #059669, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    DZ FullStack
                                </span>
                            </div>
                        ) : (
                            <img src="/logo-img.png" alt="DZ Logo" className="h-10 w-10" />
                        )
                    ) : null}
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    {navigation.map((item) => {
                        const isActive = window.location.pathname === item.href;
                        return (
                            <button
                                key={item.name}
                                onClick={() => router.visit(item.href)}
                                className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive
                                    ? 'text-white'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                style={isActive ? { background: 'linear-gradient(135deg, #059669, #10b981)' } : {}}
                            >
                                <span className={sidebarOpen ? 'mr-3' : ''}>{item.icon}</span>
                                {sidebarOpen && <span>{item.name}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* Toggle Button */}
                <div className="border-t border-gray-200 p-3">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-gray-600 transition hover:bg-gray-100"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'} />
                        </svg>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Header */}
                <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
                    <div className="flex items-center gap-4">
                        {/* Mobile Hamburger Button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-500 hover:text-gray-700 focus:outline-none md:hidden"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-semibold text-gray-900">
                            {navigation.find(item => window.location.pathname.startsWith(item.href))?.name || 'Dashboard'}
                        </h1>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        {/* Notifications */}
                        <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>

                        {/* User Profile */}
                        <div
                            className="flex cursor-pointer items-center space-x-3 transition hover:opacity-80"
                            onClick={() => router.visit('/profile')}
                        >
                            <div className="hidden text-right md:block">
                                <p className="text-sm font-medium text-gray-900">{user?.ho_va_ten}</p>
                                <p className="text-xs text-gray-500">{user?.ten_chuc_vu || (user?.is_master === 1 ? 'Master Admin' : 'Nhân viên')}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                                {user?.anh_dai_dien ? (
                                    <img src={user.anh_dai_dien} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-sm font-semibold text-white">{user?.ten_goi_nho?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button onClick={handleLogout} className="hidden rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 md:block">
                            Đăng xuất
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
        </div>
    );
}
