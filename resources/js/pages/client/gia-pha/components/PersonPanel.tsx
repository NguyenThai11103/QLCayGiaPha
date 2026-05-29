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
    const events: TimelineEvent[] = [];

    if (person.ngay_sinh) {
        events.push({
            year: person.ngay_sinh.substring(0, 4),
            type: 'Sinh ra',
            desc: `Năm ${person.ngay_sinh.substring(0, 4)}`,
            icon: 'calendar',
            color: 'text-emerald-500',
        });
    }

    spouses.forEach((spouse) => {
        events.push({
            year: 'N/A',
            type: 'Phối ngẫu',
            desc: `Kết hôn với ${spouse.ten_day_du}`,
            icon: 'heart',
            color: 'text-pink-500',
        });
    });

    children.forEach((child) => {
        if (child.ngay_sinh) {
            events.push({
                year: child.ngay_sinh.substring(0, 4),
                type: 'Sinh con',
                desc: `Sinh ${child.ten_day_du}`,
                icon: 'chevron-down',
                color: 'text-amber-500',
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
        });
    }

    events.sort((a, b) => {
        if (a.year === 'N/A' || b.year === 'N/A') {
            return 0;
        }

        return Number.parseInt(a.year) - Number.parseInt(b.year);
    });

    return (
        <div className="flex h-full flex-col bg-[var(--bg-elev)]">
            <div className="bg-pattern relative shrink-0 bg-[var(--gold-glow)] p-6 pt-8 shadow-sm">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-lg bg-white/40 text-[var(--ink-soft)] shadow-sm transition hover:bg-white"
                >
                    <Icon name="x" size={17} />
                </button>
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] font-serif text-4xl font-semibold text-white shadow-[var(--shadow-gold)] ring-4 ring-white/50">
                        {person.anh_dai_dien ? (
                            <img src={person.anh_dai_dien} alt={person.ten_day_du} className="h-full w-full object-cover" />
                        ) : (
                            person.ten_day_du.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <div className="gp-eyebrow justify-center">
                            {person.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'} · {Boolean(person.da_mat) ? 'Đã mất' : 'Còn sống'}
                        </div>
                        <h2 className="mt-1 font-serif text-[28px] leading-tight font-semibold text-[var(--ink)]">{person.ten_day_du}</h2>
                    </div>
                </div>
            </div>

            <AncestorTrail person={person} people={people} />

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
                {isMaster && (
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => canAddParent && onAddParent(person)}
                            disabled={!canAddParent}
                            title={canAddParent ? undefined : 'Chỉ thêm cha/mẹ cho thành viên đời 1'}
                            className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition ${
                                canAddParent
                                    ? 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                                    : 'cursor-not-allowed border-slate-100 bg-slate-50/60 opacity-50'
                            }`}
                        >
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-200 text-slate-600">
                                <Icon name="branch" size={14} />
                            </span>
                            <span className="text-[10px] font-bold text-slate-600">Thêm cha/mẹ</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onAddSpouse(person)}
                            className="flex flex-col items-center gap-1 rounded-xl border border-pink-200 bg-pink-50 p-2 text-center transition hover:border-pink-300 hover:bg-pink-100"
                        >
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-pink-200 text-pink-600">
                                <Icon name="heart" size={14} />
                            </span>
                            <span className="text-[10px] font-bold text-pink-600">Thêm vợ/chồng</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onAddChild(person)}
                            className="flex flex-col items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 p-2 text-center transition hover:border-amber-300 hover:bg-amber-100"
                        >
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-200 text-amber-600">
                                <Icon name="chevron-down" size={14} />
                            </span>
                            <span className="text-[10px] font-bold text-amber-600">Thêm con</span>
                        </button>
                    </div>
                )}

                <div>
                    <h3 className="mb-3 text-[12px] font-bold tracking-wider text-[var(--ink-mute)] uppercase">Thông tin cơ bản</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <Info label="Cha" value={father?.ten_day_du || 'Không rõ'} />
                        <Info label="Mẹ" value={mother?.ten_day_du || 'Không rõ'} />
                        <Info label="Con cái" value={children.length ? `${children.length} người con` : 'Chưa có'} />
                        <Info label="Hôn nhân" value={spouses.length ? `${spouses.length} người` : 'Chưa có'} />
                    </div>
                </div>

                {events.length > 0 && (
                    <div>
                        <h3 className="mb-4 text-[12px] font-bold tracking-wider text-[var(--ink-mute)] uppercase">Dấu ấn thời gian</h3>
                        <div className="relative ml-4 space-y-5 border-l-2 border-slate-200">
                            {events.map((event, index) => (
                                <div key={`${event.type}-${index}`} className="relative pl-6">
                                    <span
                                        className={`absolute top-1 -left-[13px] grid h-6 w-6 place-items-center rounded-full border-2 border-slate-200 bg-white ${event.color} shadow-sm`}
                                    >
                                        <Icon name={event.icon} size={11} />
                                    </span>
                                    <div className="text-[14px] font-bold text-[var(--ink)]">
                                        {event.type} <span className="ml-1 font-normal text-slate-400">({event.year})</span>
                                    </div>
                                    <div className="mt-0.5 text-[13px] text-[var(--ink-soft)]">{event.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {person.tieu_su && (
                    <div>
                        <h3 className="mb-2 text-[12px] font-bold tracking-wider text-[var(--ink-mute)] uppercase">Tiểu sử</h3>
                        <div className="rounded-xl bg-[var(--card-soft)] p-4 text-[13.5px] leading-relaxed text-[var(--ink)] shadow-inner">
                            {person.tieu_su}
                        </div>
                    </div>
                )}

                <button type="button" onClick={() => router.visit(`/gia-pha/thanh-vien/${person.id}`)} className="gp-btn gp-btn-primary mt-4 w-full">
                    Quản lý hồ sơ
                    <Icon name="arrow-right" size={15} />
                </button>

                {isMaster && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => onEditQuick(person)}
                            className="gp-btn animate-in flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-semibold text-emerald-700 transition duration-200 hover:bg-emerald-100"
                        >
                            <Icon name="edit" size={14} />
                            Sửa nhanh
                        </button>
                        <button
                            type="button"
                            onClick={() => onDeleteQuick(person)}
                            className="gp-btn animate-in flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-700 transition duration-200 hover:bg-red-100"
                        >
                            <Icon name="trash" size={14} />
                            Xóa thành viên
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function AncestorTrail({ person, people }: { person: Nguoi; people: Nguoi[] }) {
    const path = getAncestorPath(person, people);

    if (path.length <= 1) {
        return null;
    }

    return (
        <div className="shrink-0 border-b border-[var(--line)] bg-[var(--card-soft)] px-6 py-2">
            <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-medium text-[var(--ink-mute)]">
                {path.map((item, index) => (
                    <span key={item.id} className="flex items-center gap-1 whitespace-nowrap">
                        {index > 0 && <span className="text-[var(--ink-mute)]">→</span>}
                        <span className={item.id === person.id ? 'font-bold text-[var(--gold)]' : ''}>{item.ten_day_du.split(' ').pop()}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="mb-1 text-[10.5px] font-bold tracking-[1.3px] text-[var(--ink-mute)] uppercase">{label}</div>
            <div className="text-[13px] leading-5 font-semibold text-[var(--ink)]">{value}</div>
        </div>
    );
}
