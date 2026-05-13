import { FormEvent, useState } from 'react';
import Modal from '../ui/Modal';
import toast from '../../lib/toast.util';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (password: string) => Promise<void>;
    employeeName: string;
}

export default function ChangePasswordModal({ isOpen, onClose, onSubmit, employeeName }: ChangePasswordModalProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        setLoading(true);
        try {
            await onSubmit(password);
            toast.success('Đổi mật khẩu thành công');
            setPassword('');
            setConfirmPassword('');
            onClose();
        } catch (err: any) {
            // Error handling is now done globally in api.client.ts
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Đổi mật khẩu" size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-600">
                    Đổi mật khẩu cho: <strong>{employeeName}</strong>
                </p>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#059669] focus:ring-2 focus:ring-[#059669] focus:outline-none"
                        placeholder="••••••••"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#059669] focus:ring-2 focus:ring-[#059669] focus:outline-none"
                        placeholder="••••••••"
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow transition disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                    >
                        {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
