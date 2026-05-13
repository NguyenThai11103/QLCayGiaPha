import { router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { useAuth } from '../../contexts/auth.context';
import toast from '../../lib/toast.util';

export default function Login() {
    const { login, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await login({ email, password });
            toast.success('Đăng nhập thành công!');
            // Only redirect if login successful (though login function might throw)
            router.visit('/dashboard');
        } catch (err: any) {
            // Error handling is now done globally in api.client.ts
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-2xl">
                {/* Logo/Header */}
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
                        <img src="/logo-img.png" alt="DZ FullStack Logo" className="h-full w-full object-contain" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Đăng Nhập</h2>
                    <p className="mt-2 text-sm text-gray-600">Hệ thống quản lý nhân viên DZ</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full appearance-none rounded-lg border border-gray-300 px-4 py-3 placeholder-gray-400 shadow-sm transition focus:border-[#059669] focus:ring-2 focus:ring-[#059669] focus:outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Mật khẩu
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full appearance-none rounded-lg border border-gray-300 px-4 py-3 placeholder-gray-400 shadow-sm transition focus:border-[#059669] focus:ring-2 focus:ring-[#059669] focus:outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting || isLoading}
                            className="group relative flex w-full justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg transition focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            style={{
                                background: 'linear-gradient(135deg, #059669, #10b981)',
                            }}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center">
                                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Đang đăng nhập...
                                </span>
                            ) : (
                                'Đăng nhập'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
