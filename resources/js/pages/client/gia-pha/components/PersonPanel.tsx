import { router } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import Icon from '../../../../components/gia-pha/Icon';
import type { Nguoi } from '../../../../services/gia-pha.api';
import { calculateAge, getAncestorPath } from '../helpers/family-tree';

type PersonPanelProps = {
    person: Nguoi;
    people: Nguoi[];
    isMaster: boolean;
    onClose: () => void;
    onAddChild: (parent: Nguoi) => void;
    onAddSpouse: (spouse: Nguoi) => void;
    onAddParent: (child: Nguoi) => void;
    onEditQuick: (person: Nguoi) => void;
    onDeleteQuick: (person: Nguoi) => void;
};

type IconName = ComponentProps<typeof Icon>['name'];

type TimelineEvent = {
    year: string;
    type: string;
    desc: string;
    icon: IconName;
    color: string;
    bg: string;
};

export default function PersonPanel({
    person,
    people,
    isMaster,
    onClose,
    onAddChild,
    onAddSpouse,
    onAddParent,
    onEditQuick,
    onDeleteQuick,
}: PersonPanelProps) {
    const father = person.id_cha ? people.find((item) => item.id === person.id_cha) : undefined;
    const mother = person.id_me ? people.find((item) => item.id === person.id_me) : undefined;
    const spouses = (person.vo_chong_ids || []).map((id) => people.find((item) => item.id === id)).filter(Boolean) as Nguoi[];
    const children = people.filter((item) => item.id_cha === person.id || item.id_me === person.id);
    const canAddParent = (person.doi_thu ?? 1) === 1;
    const isDead = Boolean(person.da_mat);
    const isMale = person.gioi_tinh === 'nam';
    const age = calculateAge(person.ngay_sinh, person.ngay_mat, isDead);

    const events: TimelineEvent[] = [];

    if (person.ngay_sinh) {
        events.push({
            year: person.ngay_sinh.substring(0, 4),
            type: 'Sinh ra',
            desc: `Năm ${person.ngay_sinh.substring(0, 4)}`,
            icon: 'calendar',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 border-emerald-200',
        });
    }

    spouses.forEach((spouse) => {
        events.push({
            year: 'N/A',
            type: 'Phối ngẫu',
            desc: `Kết hôn với ${spouse.ten_day_du}`,
            icon: 'heart',
            color: 'text-pink-500',
            bg: 'bg-pink-50 border-pink-200',
        });
    });

    children.forEach((child) => {
        if (child.ngay_sinh) {
            events.push({
                year: child.ngay_sinh.substring(0, 4),
                type: 'Sinh con',
                desc: `Sinh ${child.ten_day_du}`,
                icon: 'chevron-down',
                color: 'text-amber-600',
                bg: 'bg-amber-50 border-amber-200',
            });
        }
    });

    if (person.da_mat) {
        events.push({
            year: person.ngay_mat ? person.ngay_mat.substring(0, 4) : 'N/A',
            type: 'Qua đời',
            desc: `Hưởng thọ ${calculateAge(person.ngay_sinh, person.ngay_mat, true) || '?'} tuổi`,
            icon: 'lotus',
            color: 'text-slate-500',
            bg: 'bg-slate-50 border-slate-200',
        });
    }

    events.sort((a, b) => {
        if (a.year === 'N/A' || b.year === 'N/A') return 0;
        return Number.parseInt(a.year) - Number.parseInt(b.year);
    });

    const avatarGradient = isDead
        ? 'linear-gradient(135deg,#9b8a6a,#6b5232)'
        : isMale
            ? 'linear-gradient(135deg,var(--jade),var(--jade-soft))'
            : 'linear-gradient(135deg,var(--terracotta),var(--crimson))';

    return (
        <div className="gp-slide-in-right flex h-full flex-col bg-[var(--bg-elev)]">
            {/* ─── Header ─── */}
            <div className="relative shrink-0 overflow-hidden">
                {/* Background pattern */}
                <div className="bg-pattern absolute inset-0 bg-[var(--gold-glow)] opacity-60" />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-elev)]" />

                <div className="relative px-6 pb-5 pt-10">
                    {/* Close button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] bg-[var(--card)]/80 text-[var(--ink-soft)] shadow-sm transition-all duration-200 hover:bg-[var(--card)] hover:text-[var(--ink)] hover:shadow-md"
                    >
                        <Icon name="x" size={15} />
                    </button>

                    {/* Avatar + info */}
                    <div className="flex flex-col items-center gap-3 text-center">
                        <div className="relative">
                            {/* Glow ring */}
                            <div
                                className={`absolute -inset-1.5 rounded-full opacity-30 blur-md ${isDead ? 'bg-amber-400' : isMale ? 'bg-[var(--jade)]' : 'bg-[var(--terracotta)]'}`}
                            />
                            <div
                                className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full font-serif text-4xl font-semibold text-white shadow-lg ring-4 ring-[var(--card)]"
                                style={{ background: avatarGradient }}
                            >
                                {person.anh_dai_dien ? (
                                    <img src={person.anh_dai_dien} alt={person.ten_day_du} className="h-full w-full object-cover" />
                                ) : (
                                    person.ten_day_du.charAt(0).toUpperCase()
                                )}
                            </div>
                            {isDead && (
                                <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-amber-50 text-amber-500 shadow ring-2 ring-amber-200">
                                    <Icon name="lotus" size={14} strokeWidth={1.5} />
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col items-center gap-1.5">
                            {/* Gender + status badges */}
                            <div className="flex items-center gap-2">
                                <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${isMale ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'}`}>
                                    {isMale ? '♂ Nam' : '♀ Nữ'}
                                </span>
                                <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${isDead ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {isDead ? '✦ Đã mất' : '● Còn sống'}
                                </span>
                                {person.doi_thu && (
                                    <span className="flex items-center gap-1 rounded-full bg-[var(--gold-glow)] px-2.5 py-0.5 text-[10.5px] font-bold text-[var(--gold)]">
                                        Đời {person.doi_thu}
                                    </span>
                                )}
                            </div>

                            <h2 className="font-serif text-[26px] leading-tight font-semibold text-[var(--ink)]">
                                {person.ten_day_du}
                            </h2>

                            {age !== null && (
                                <div className="text-[12px] text-[var(--ink-mute)]">
                                    {isDead ? `Hưởng thọ ${age} tuổi` : `${age} tuổi`}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Ancestor breadcrumb ─── */}
            <AncestorTrail person={person} people={people} />

            {/* ─── Scrollable body ─── */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5">

                {/* Quick actions (admin only) */}
                {isMaster && (
                    <div className="grid grid-cols-3 gap-2">
                        <ActionButton
                            label="Thêm cha/mẹ"
                            icon="branch"
                            disabled={!canAddParent}
                            disabledTitle="Chỉ thêm cha/mẹ cho đời 1"
                            colorClass="border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                            iconBg="bg-slate-200"
                            onClick={() => canAddParent && onAddParent(person)}
                        />
                        <ActionButton
                            label="Thêm vợ/chồng"
                            icon="heart"
                            colorClass="border-pink-200 bg-pink-50 text-pink-600 hover:bg-pink-100"
                            iconBg="bg-pink-200"
                            onClick={() => onAddSpouse(person)}
                        />
                        <ActionButton
                            label="Thêm con"
                            icon="chevron-down"
                            colorClass="border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                            iconBg="bg-amber-200"
                            onClick={() => onAddChild(person)}
                        />
                    </div>
                )}

                {/* Basic info */}
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4">
                    <h3 className="mb-3 text-[10.5px] font-bold tracking-widest text-[var(--ink-mute)] uppercase">Thông tin</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <InfoCell label="Cha" value={father?.ten_day_du || 'Không rõ'} />
                        <InfoCell label="Mẹ" value={mother?.ten_day_du || 'Không rõ'} />
                        <InfoCell
                            label="Con cái"
                            value={children.length ? `${children.length} người` : 'Chưa có'}
                            highlight={children.length > 0}
                        />
                        <InfoCell
                            label="Hôn nhân"
                            value={spouses.length ? spouses.map((s) => s.ten_day_du.split(' ').pop()).join(', ') : 'Chưa có'}
                        />
                    </div>
                </div>

                {/* Timeline */}
                {events.length > 0 && (
                    <div>
                        <h3 className="mb-3 text-[10.5px] font-bold tracking-widest text-[var(--ink-mute)] uppercase">Dấu ấn thời gian</h3>
                        <div className="relative ml-3 space-y-4 border-l-2 border-[var(--line)]">
                            {events.map((event, index) => (
                                <div key={`${event.type}-${index}`} className="relative pl-6">
                                    <span
                                        className={`absolute top-0.5 -left-[17px] grid h-7 w-7 place-items-center rounded-full border-2 border-[var(--card)] bg-[var(--card)] shadow-sm ${event.bg} ${event.color}`}
                                    >
                                        <Icon name={event.icon} size={12} />
                                    </span>
                                    <div className="text-[13px] font-bold text-[var(--ink)]">
                                        {event.type}
                                        {event.year !== 'N/A' && (
                                            <span className="ml-1.5 text-[11px] font-normal text-[var(--ink-mute)]">({event.year})</span>
                                        )}
                                    </div>
                                    <div className="mt-0.5 text-[12px] text-[var(--ink-soft)]">{event.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Biography */}
                {person.tieu_su && (
                    <div>
                        <h3 className="mb-2 text-[10.5px] font-bold tracking-widest text-[var(--ink-mute)] uppercase">Tiểu sử</h3>
                        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-soft)] p-4 text-[13px] leading-relaxed text-[var(--ink)]">
                            {person.tieu_su}
                        </div>
                    </div>
                )}

                {/* Profile link */}
                <button
                    type="button"
                    onClick={() => router.visit(`/gia-pha/thanh-vien/${person.id}`)}
                    className="gp-btn gp-btn-primary w-full"
                >
                    Xem hồ sơ đầy đủ
                    <Icon name="arrow-right" size={15} />
                </button>

                {/* Edit / Delete */}
                {isMaster && (
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => onEditQuick(person)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-[13px] font-semibold text-emerald-700 transition-all duration-200 hover:bg-emerald-100 hover:shadow-sm"
                        >
                            <Icon name="edit" size={14} />
                            Sửa nhanh
                        </button>
                        <button
                            type="button"
                            onClick={() => onDeleteQuick(person)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2 text-[13px] font-semibold text-red-600 transition-all duration-200 hover:bg-red-100 hover:shadow-sm"
                        >
                            <Icon name="trash" size={14} />
                            Xóa
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Sub-components ───

function ActionButton({
    label,
    icon,
    disabled,
    disabledTitle,
    colorClass,
    iconBg,
    onClick,
}: {
    label: string;
    icon: ComponentProps<typeof Icon>['name'];
    disabled?: boolean;
    disabledTitle?: string;
    colorClass: string;
    iconBg: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={disabled ? disabledTitle : undefined}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all duration-200 ${disabled ? 'cursor-not-allowed opacity-40' : 'hover:shadow-sm active:scale-95'} ${colorClass}`}
        >
            <span className={`grid h-8 w-8 place-items-center rounded-full ${iconBg}`}>
                <Icon name={icon} size={15} />
            </span>
            <span className="text-[9.5px] font-bold leading-tight">{label}</span>
        </button>
    );
}

function AncestorTrail({ person, people }: { person: Nguoi; people: Nguoi[] }) {
    const path = getAncestorPath(person, people);

    if (path.length <= 1) return null;

    return (
        <div className="shrink-0 border-b border-[var(--line)] bg-[var(--card-soft)] px-5 py-2">
            <div className="flex items-center gap-1 overflow-x-auto text-[10.5px] font-medium text-[var(--ink-mute)] whitespace-nowrap">
                {path.map((item, index) => (
                    <span key={item.id} className="flex items-center gap-1">
                        {index > 0 && (
                            <span className="text-[var(--ink-faint)] opacity-60">›</span>
                        )}
                        <span className={item.id === person.id ? 'font-bold text-[var(--gold)]' : ''}>
                            {item.ten_day_du.split(' ').pop()}
                        </span>
                    </span>
                ))}
            </div>
        </div>
    );
}

function InfoCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex flex-col gap-0.5">
            <div className="text-[9.5px] font-bold tracking-[1.5px] text-[var(--ink-mute)] uppercase">{label}</div>
            <div className={`text-[12.5px] font-semibold leading-5 ${highlight ? 'text-[var(--gold)]' : 'text-[var(--ink)]'}`}>
                {value}
            </div>
        </div>
    );
}
