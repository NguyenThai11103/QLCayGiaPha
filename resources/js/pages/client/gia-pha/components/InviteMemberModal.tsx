import { FormEvent, useState } from 'react';
import Icon from '../../../../components/gia-pha/Icon';
import toast from '../../../../lib/toast.util';
import { familyInvitationApi, Nguoi } from '../../../../services/gia-pha.api';

type InviteMemberModalProps = {
    person: Nguoi;
    onClose: () => void;
};

export default function InviteMemberModal({ person, onClose }: InviteMemberModalProps) {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [inviteUrl, setInviteUrl] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setEmailError(null);

        try {
            const result = await familyInvitationApi.create({
                thanh_vien_id: person.id,
                email: email.trim() || null,
            });

            if (result.success && result.data) {
                setInviteUrl(result.data.invite_url);
                setEmailSent(Boolean(result.data.email_sent));
                setEmailError(result.data.email_error || null);
                toast.success(result.message || 'Đã tạo lời mời tham gia.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const copyLink = async () => {
        if (!inviteUrl) return;

        try {
            await navigator.clipboard.writeText(inviteUrl);
            toast.success('Đã sao chép link lời mời.');
        } catch (error) {
            toast.error('Không thể sao chép link. Vui lòng sao chép thủ công.');
        }
    };

    const shareZalo = () => {
        if (!inviteUrl) return;

        window.open(`https://zalo.me/share?u=${encodeURIComponent(inviteUrl)}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-[520px] overflow-hidden rounded-lg border border-[var(--card-border)] bg-[var(--bg-elev)] shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
                    <div>
                        <div className="text-[10.5px] font-bold tracking-widest text-[var(--ink-mute)] uppercase">Mời tham gia dòng họ</div>
                        <h2 className="mt-1 font-serif text-[22px] font-semibold text-[var(--ink)]">{person.ten_day_du}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--card)] text-[var(--ink-soft)] transition hover:text-[var(--ink)]"
                    >
                        <Icon name="x" size={14} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
                    <label className="block">
                        <span className="mb-1.5 block text-[12.5px] font-semibold text-[var(--ink-soft)]">Email người nhận</span>
                        <div className="flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--card-border)] bg-[var(--card-soft)] px-3 focus-within:border-[var(--gold)]">
                            <Icon name="link" size={15} className="text-[var(--ink-mute)]" />
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="min-w-0 flex-1 bg-transparent text-[13.5px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
                                placeholder="email@example.com"
                            />
                        </div>
                        <span className="mt-1.5 block text-[11.5px] text-[var(--ink-mute)]">
                            Bỏ trống email nếu chỉ muốn tạo link để gửi qua Zalo.
                        </span>
                    </label>

                    <button type="submit" disabled={submitting} className="gp-btn gp-btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-70">
                        {submitting ? (
                            <>
                                <Icon name="clock" size={14} />
                                Đang tạo lời mời...
                            </>
                        ) : (
                            <>
                                <Icon name="add-user" size={15} />
                                {email.trim() ? 'Gửi email và tạo link' : 'Tạo link mời'}
                            </>
                        )}
                    </button>
                </form>

                {inviteUrl && (
                    <div className="border-t border-[var(--line)] bg-[var(--card-soft)] px-5 py-4">
                        <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[var(--ink)]">
                            <Icon name={emailSent ? 'check' : 'link'} size={14} />
                            {emailSent ? 'Email đã được gửi' : 'Link lời mời đã sẵn sàng'}
                        </div>

                        {emailError && (
                            <div className="mb-3 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-800">
                                {emailError}
                            </div>
                        )}

                        <div className="flex items-center gap-2 rounded-[10px] border border-[var(--card-border)] bg-[var(--card)] px-3 py-2">
                            <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--ink-soft)]">{inviteUrl}</span>
                            <button type="button" onClick={copyLink} className="grid h-8 w-8 place-items-center rounded-md text-[var(--ink-mute)] transition hover:bg-[var(--card-soft)] hover:text-[var(--ink)]" title="Sao chép">
                                <Icon name="copy" size={14} />
                            </button>
                        </div>

                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                            <button type="button" onClick={shareZalo} className="gp-btn gp-btn-ghost">
                                <Icon name="arrow-up-right" size={14} />
                                Mở Zalo
                            </button>
                            <button type="button" onClick={copyLink} className="gp-btn gp-btn-primary">
                                <Icon name="copy" size={14} />
                                Sao chép link
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
