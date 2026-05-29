import { useState } from 'react';
import Icon from '../../../../components/gia-pha/Icon';
import type { Nguoi } from '../../../../services/gia-pha.api';
import { calculateAge, formatYear } from '../helpers/family-tree';
import type { FamilyNode } from '../types';

export function RootCard() {
    return (
        <div className="flex flex-col items-center">
            <div className="rounded-[14px] bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] px-6 py-3 text-center text-white shadow-[var(--shadow-gold)]">
                <div className="text-[10px] font-bold tracking-[1.8px] text-white/75 uppercase">Gốc gia phả</div>
                <div className="mt-0.5 text-sm font-bold">Khởi tổ dòng họ</div>
            </div>
            <div className="h-9 w-px bg-gradient-to-b from-[var(--gold)] to-[var(--line)]" />
        </div>
    );
}

type FamilyCardProps = {
    family: FamilyNode;
    level: number;
    searchTerm: string;
    bloodlineOnly: boolean;
    selectedPerson: Nguoi | null;
    onSelect: (person: Nguoi) => void;
    parentLabel?: string;
};

export default function FamilyCard({ family, level, searchTerm, bloodlineOnly, selectedPerson, onSelect, parentLabel }: FamilyCardProps) {
    const hasChildren = family.children.length > 0;
    const [isExpanded, setIsExpanded] = useState(true);
    const [hoveredSpouseId, setHoveredSpouseId] = useState<number | null>(null);

    const isSelectedSpouse = family.spouses.some((spouse) => spouse.id === selectedPerson?.id);
    const activeSpouseId = isSelectedSpouse ? selectedPerson?.id : hoveredSpouseId;
    const leftSpouses = family.spouses.slice(0, Math.floor(family.spouses.length / 2));
    const rightSpouses = family.spouses.slice(Math.floor(family.spouses.length / 2));

    return (
        <div className="flex flex-col items-center">
            <div
                className="relative z-10 flex items-center justify-center gap-5 rounded-[20px] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] p-5 shadow-[var(--shadow-md)] backdrop-blur"
                data-generation-level={level}
            >
                <div className="absolute -top-3.5 left-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[var(--card)] bg-[var(--gold)] text-xs font-bold text-white shadow">
                    {level}
                </div>

                {leftSpouses.map((spouse) => (
                    <div
                        key={spouse.id}
                        className="flex items-center gap-4 transition-transform hover:scale-105"
                        onMouseEnter={() => setHoveredSpouseId(spouse.id)}
                        onMouseLeave={() => setHoveredSpouseId(null)}
                    >
                        <PersonMiniCard person={spouse} searchTerm={searchTerm} selected={selectedPerson?.id === spouse.id} onSelect={onSelect} />
                        <SpouseConnector />
                    </div>
                ))}

                <PersonMiniCard
                    person={family.member}
                    searchTerm={searchTerm}
                    selected={selectedPerson?.id === family.member.id}
                    onSelect={onSelect}
                    parentLabel={parentLabel}
                    isRoot={level === 1}
                />

                {rightSpouses.map((spouse) => (
                    <div
                        key={spouse.id}
                        className="flex items-center gap-4 transition-transform hover:scale-105"
                        onMouseEnter={() => setHoveredSpouseId(spouse.id)}
                        onMouseLeave={() => setHoveredSpouseId(null)}
                    >
                        <SpouseConnector />
                        <PersonMiniCard person={spouse} searchTerm={searchTerm} selected={selectedPerson?.id === spouse.id} onSelect={onSelect} />
                    </div>
                ))}
            </div>

            {hasChildren ? (
                <>
                    <div className="relative flex h-10 w-px items-center justify-center">
                        <div className={`absolute inset-y-0 w-px ${bloodlineOnly ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`} />
                        <button
                            type="button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="z-20 grid h-6 w-6 cursor-pointer place-items-center rounded-full border border-[var(--gold)] bg-[#faf9f6] text-[var(--gold)] transition hover:bg-[var(--gold)] hover:text-white"
                            title={isExpanded ? 'Thu gọn nhánh' : 'Mở rộng nhánh'}
                        >
                            <Icon name={isExpanded ? 'minus' : 'plus'} size={14} />
                        </button>
                    </div>

                    {isExpanded && (
                        <div className="flex justify-center">
                            {family.children.map((child, index) => {
                                const isOnly = family.children.length === 1;
                                const isFirst = index === 0;
                                const isLast = index === family.children.length - 1;
                                const otherParentId = child.member.id_cha === family.member.id ? child.member.id_me : child.member.id_cha;
                                const otherParent = otherParentId ? family.spouses.find((spouse) => spouse.id === otherParentId) : undefined;
                                const childParentLabel = otherParent
                                    ? `${family.member.gioi_tinh === 'nam' ? 'Mẹ' : 'Cha'}: ${otherParent.ten_day_du.split(' ').pop()}`
                                    : undefined;
                                const childIsDimmed = activeSpouseId !== null && activeSpouseId !== undefined && otherParentId !== activeSpouseId;

                                return (
                                    <div
                                        key={child.id}
                                        className={`relative flex flex-col items-center px-6 transition-all duration-300 ${childIsDimmed ? 'opacity-20 grayscale' : 'opacity-100 grayscale-0'}`}
                                    >
                                        {!isOnly && (
                                            <>
                                                {!isFirst && (
                                                    <div
                                                        className={`absolute top-0 left-0 h-px w-1/2 ${bloodlineOnly ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`}
                                                    />
                                                )}
                                                {!isLast && (
                                                    <div
                                                        className={`absolute top-0 right-0 h-px w-1/2 ${bloodlineOnly ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`}
                                                    />
                                                )}
                                            </>
                                        )}
                                        <div className={`h-10 w-px ${bloodlineOnly ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`} />
                                        <FamilyCard
                                            family={child}
                                            level={level + 1}
                                            searchTerm={searchTerm}
                                            bloodlineOnly={bloodlineOnly}
                                            selectedPerson={selectedPerson}
                                            onSelect={onSelect}
                                            parentLabel={childParentLabel}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : (
                <div className={`h-10 w-px ${bloodlineOnly ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`} />
            )}
        </div>
    );
}

function SpouseConnector() {
    return (
        <div className="relative h-[2px] w-8 bg-gradient-to-r from-[var(--gold)] to-[var(--gold)] opacity-70">
            <div className="absolute top-1/2 left-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-pink-200 bg-pink-50 text-pink-500 shadow-sm">
                <Icon name="heart" size={11} />
            </div>
        </div>
    );
}

type PersonMiniCardProps = {
    person: Nguoi;
    searchTerm: string;
    selected: boolean;
    onSelect: (person: Nguoi) => void;
    parentLabel?: string;
    isRoot?: boolean;
};

function PersonMiniCard({ person, searchTerm, selected, onSelect, parentLabel, isRoot }: PersonMiniCardProps) {
    const isMale = person.gioi_tinh === 'nam';
    const isDead = Boolean(person.da_mat);
    const birthYear = formatYear(person.ngay_sinh);
    const deathYear = formatYear(person.ngay_mat);
    const isHighlighted = Boolean(searchTerm && person.ten_day_du.toLowerCase().includes(searchTerm.toLowerCase()));
    const age = calculateAge(person.ngay_sinh, person.ngay_mat, isDead);
    const lifespanPercent = age !== null ? Math.min(Math.max(age / 100, 0), 1) * 100 : 0;

    return (
        <button
            id={`person-card-${person.id}`}
            type="button"
            onClick={() => onSelect(person)}
            className="group relative flex w-40 flex-col items-center gap-2 rounded-xl px-2 py-3 text-center transition hover:bg-[var(--card-soft)]"
            style={selected || isHighlighted ? { outline: `2px solid ${selected ? 'var(--gold)' : 'var(--jade)'}`, outlineOffset: '2px' } : undefined}
        >
            {isRoot && (
                <span
                    className="absolute -top-2 -left-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-[var(--gold)] text-[14px] text-white shadow-md ring-2 ring-[var(--card)]"
                    title="Thủy tổ"
                >
                    Tổ
                </span>
            )}
            <div className="relative">
                <span
                    className={`grid h-[72px] w-[72px] place-items-center overflow-hidden rounded-full text-2xl font-bold text-white shadow-md transition group-hover:scale-105 ${isDead ? 'border-2 border-dashed border-amber-500/70' : 'ring-2 ring-[var(--card)]'}`}
                    style={{
                        background: isMale
                            ? 'linear-gradient(135deg,var(--jade),var(--jade-soft))'
                            : 'linear-gradient(135deg,var(--terracotta),var(--crimson))',
                    }}
                >
                    {person.anh_dai_dien ? (
                        <img src={person.anh_dai_dien} alt={person.ten_day_du} className="h-full w-full object-cover" />
                    ) : (
                        person.ten_day_du.charAt(0).toUpperCase()
                    )}
                </span>
                {isDead && (
                    <span
                        className="absolute -top-1 -right-1 z-10 grid h-[22px] w-[22px] place-items-center rounded-full bg-amber-50 text-amber-600 shadow-sm ring-2 ring-amber-200"
                        title="Đã khuất"
                    >
                        <Icon name="lotus" size={13} strokeWidth={1.5} />
                    </span>
                )}
                {person.thu_tu_sinh && (
                    <span className="absolute -top-1 -left-1 z-10 grid h-5 w-5 place-items-center rounded-full bg-[var(--gold)] text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--card)]">
                        {person.thu_tu_sinh}
                    </span>
                )}
            </div>
            <div className="flex w-full flex-col items-center">
                <span className="line-clamp-2 min-h-9 w-full text-sm leading-tight font-bold text-[var(--ink)] group-hover:text-[var(--gold)]">
                    {person.ten_day_du}
                </span>
                {(birthYear || deathYear) && (
                    <span className="text-[11.5px] font-medium text-[var(--ink-mute)]">
                        {birthYear || '?'}
                        {isDead ? ` - ${deathYear || '?'}` : ''} {age !== null ? `(${age}t)` : ''}
                    </span>
                )}
                {age !== null && (
                    <div className="mt-1.5 h-1 w-16 overflow-hidden rounded-full bg-[var(--line)]">
                        <div
                            className={`h-full rounded-full ${isDead ? 'bg-amber-400/80' : 'bg-emerald-400'}`}
                            style={{ width: `${lifespanPercent}%` }}
                        />
                    </div>
                )}
            </div>
            {parentLabel && (
                <span className="mt-1 max-w-full truncate rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9.5px] font-bold text-amber-700 shadow-sm">
                    {parentLabel}
                </span>
            )}
        </button>
    );
}
