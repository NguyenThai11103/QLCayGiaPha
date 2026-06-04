import { router } from '@inertiajs/react';
import { ReactNode } from 'react';
import { useAuth } from '../contexts/auth.context';

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
                    <p className="text-lg font-medium text-gray-700">Đang xác thực...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        router.visit('/login');
        return null;
    }

    return <>{children}</>;
}
