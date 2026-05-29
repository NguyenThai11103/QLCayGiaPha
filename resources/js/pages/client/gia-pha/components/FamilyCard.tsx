import { useState } from 'react';
import Icon from '../../../../components/gia-pha/Icon';
import type { Nguoi } from '../../../../services/gia-pha.api';
import { calculateAge, formatYear } from '../helpers/family-tree';
import type { FamilyNode } from '../types';

export function RootCard() {
    return (
        <div className="flex flex-col items-center">
            <div className="relative rounded-2xl bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] px-8 py-3.5 text-center text-white shadow-[var(--shadow-gold)]">
                <div className="absolute -inset-0.5 rounded-2xl bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] opacity-30 blur-sm" />
                <div className="relative">
                    <div className="text-[9px] font-bold tracking-[2.5px] text-white/70 uppercase">✦ Gia phả ✦</div>
                    <div className="mt-0.5 text-sm font-bold tracking-wide">Khởi tổ dòng họ</div>
                </div>
            </div>
            <div className="h-9 w-px bg-gradient-to-b from-[var(--gold)] via-[var(--gold-pale)] to-transparent" />
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
    // Track which person (main member OR spouse) is currently hovered
    const [hoveredPersonId, setHoveredPersonId] = useState<number | null>(null);

    const isSelectedSpouse = family.spouses.some((spouse) => spouse.id === selectedPerson?.id);
    const activeSpouseId = isSelectedSpouse ? selectedPerson?.id : hoveredSpouseId;
    const leftSpouses = family.spouses.slice(0, Math.floor(family.spouses.length / 2));
    const rightSpouses = family.spouses.slice(Math.floor(family.spouses.length / 2));

    const lineClass = bloodlineOnly
        ? 'bg-gradient-to-b from-[var(--gold)] via-[color-mix(in_srgb,var(--gold)_60%,transparent)] to-transparent'
        : 'bg-gradient-to-b from-[var(--line)] to-transparent';

    const hLineClass = bloodlineOnly
        ? 'bg-[var(--gold)] opacity-50'
        : 'bg-[var(--line)]';

    return (
        <div className="flex flex-col items-center">
            {/* Family group card */}
            <div
                className="relative z-10 flex items-center justify-center gap-4 rounded-[22px] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card)_92%,transparent)] p-4 shadow-[var(--shadow-md)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[var(--shadow-lg)]"
                data-generation-level={level}
            >
                {/* Generation badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-[var(--gold-pale)] bg-[var(--card)] px-3 py-1 text-[10px] font-bold text-[var(--gold)] shadow-sm select-none">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    Đời {level}
                </div>

                {leftSpouses.map((spouse) => (
                    <div
                        key={spouse.id}
                        className="flex items-center gap-3"
                        onMouseEnter={() => { setHoveredSpouseId(spouse.id); setHoveredPersonId(spouse.id); }}
                        onMouseLeave={() => { setHoveredSpouseId(null); setHoveredPersonId(null); }}
                    >
                        <PersonMiniCard person={spouse} searchTerm={searchTerm} selected={selectedPerson?.id === spouse.id} onSelect={onSelect} />
                        <SpouseConnector />
                    </div>
                ))}

                <div
                    onMouseEnter={() => setHoveredPersonId(family.member.id)}
                    onMouseLeave={() => setHoveredPersonId(null)}
                >
                    <PersonMiniCard
                        person={family.member}
                        searchTerm={searchTerm}
                        selected={selectedPerson?.id === family.member.id}
                        onSelect={onSelect}
                        parentLabel={parentLabel}
                        isRoot={level === 1}
                    />
                </div>

                {rightSpouses.map((spouse) => (
                    <div
                        key={spouse.id}
                        className="flex items-center gap-3"
                        onMouseEnter={() => { setHoveredSpouseId(spouse.id); setHoveredPersonId(spouse.id); }}
                        onMouseLeave={() => { setHoveredSpouseId(null); setHoveredPersonId(null); }}
                    >
                        <SpouseConnector />
                        <PersonMiniCard person={spouse} searchTerm={searchTerm} selected={selectedPerson?.id === spouse.id} onSelect={onSelect} />
                    </div>
                ))}
            </div>

            {hasChildren ? (
                <>
                    {/* Vertical connector + toggle button */}
                    <div className="relative flex h-12 w-px items-center justify-center">
                        <div className={`absolute inset-y-0 w-px ${lineClass}`} />
                        <button
                            type="button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="relative z-20 grid h-6 w-6 cursor-pointer place-items-center rounded-full border border-[var(--gold-pale)] bg-[var(--card)] text-[var(--gold)] shadow-sm transition-all duration-200 hover:border-[var(--gold)] hover:bg-[var(--gold)] hover:text-white hover:shadow-md active:scale-90"
                            title={isExpanded ? 'Thu gọn nhánh' : 'Mở rộng nhánh'}
                        >
                            <span
                                className="transition-transform duration-300"
                                style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                            >
                                <Icon name={isExpanded ? 'minus' : 'plus'} size={12} />
                            </span>
                        </button>
                    </div>

                    {/* Children row */}
                    {isExpanded && (
                        <div className="flex justify-center">
                            {family.children.map((child, index) => {
                                const isOnly = family.children.length === 1;
                                const isFirst = index === 0;
                                const isLast = index === family.children.length - 1;
                                const otherParentId = child.member.id_cha === family.member.id ? child.member.id_me : child.member.id_cha;
                                const otherParent = otherParentId ? family.spouses.find((s) => s.id === otherParentId) : undefined;
                                const childParentLabel = otherParent
                                    ? `${family.member.gioi_tinh === 'nam' ? 'Mẹ' : 'Cha'}: ${otherParent.ten_day_du.split(' ').pop()}`
                                    : undefined;

                                // Spouse-based dimming (existing)
                                const childIsDimmedBySpouse =
                                    activeSpouseId !== null &&
                                    activeSpouseId !== undefined &&
                                    otherParentId !== activeSpouseId;

                                // Parent hover: does this child belong to the hovered person?
                                const childBelongsToHovered =
                                    hoveredPersonId !== null &&
                                    (child.member.id_cha === hoveredPersonId || child.member.id_me === hoveredPersonId);

                                const childIsHighlighted = hoveredPersonId !== null && childBelongsToHovered;
                                const childIsDimmed = !childIsHighlighted && (childIsDimmedBySpouse || (hoveredPersonId !== null && !childBelongsToHovered));

                                return (
                                    <div
                                        key={child.id}
                                        className={`relative flex flex-col items-center px-5 transition-all duration-250 ${
                                            childIsHighlighted
                                                ? 'scale-[1.03] opacity-100 drop-shadow-[0_0_12px_rgba(184,144,44,0.35)]'
                                                : childIsDimmed
                                                    ? 'opacity-20 grayscale'
                                                    : 'opacity-100 grayscale-0'
                                        }`}
                                    >
                                        {/* Horizontal connectors */}
                                        {!isOnly && (
                                            <>
                                                {!isFirst && (
                                                    <div className={`absolute top-0 left-0 h-px w-1/2 ${childIsHighlighted ? 'bg-[var(--gold)] opacity-80' : hLineClass}`} />
                                                )}
                                                {!isLast && (
                                                    <div className={`absolute top-0 right-0 h-px w-1/2 ${childIsHighlighted ? 'bg-[var(--gold)] opacity-80' : hLineClass}`} />
                                                )}
                                            </>
                                        )}
                                        <div className={`h-10 w-px ${childIsHighlighted ? 'bg-[var(--gold)]' : lineClass}`} />
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
                <div className={`h-10 w-px ${lineClass}`} />
            )}
        </div>
    );
}

function SpouseConnector() {
    return (
        <div className="relative flex h-[2px] w-10 items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-200 via-pink-300 to-pink-200 opacity-80 rounded-full" />
            <div className="relative z-10 grid h-7 w-7 place-items-center rounded-full border border-pink-200 bg-white text-pink-400 shadow-sm transition-transform duration-300 hover:scale-110 hover:text-pink-500">
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

    const avatarGradient = isDead
        ? 'linear-gradient(135deg,#9b8a6a,#6b5232)'
        : isMale
            ? 'linear-gradient(135deg,var(--jade),var(--jade-soft))'
            : 'linear-gradient(135deg,var(--terracotta),var(--crimson))';

    const ringStyle = selected
        ? { outline: '2.5px solid var(--gold)', outlineOffset: '3px' }
        : isHighlighted
            ? { outline: '2px solid var(--jade)', outlineOffset: '3px' }
            : undefined;

    return (
        <button
            id={`person-card-${person.id}`}
            data-person-id={person.id}
            type="button"
            onClick={() => onSelect(person)}
            className={`group relative flex w-[9.5rem] flex-col items-center gap-2 rounded-2xl px-2.5 py-3.5 text-center transition-all duration-200 hover:bg-[var(--card-soft)] hover:shadow-sm ${isHighlighted ? 'gp-search-highlight' : ''}`}
            style={ringStyle}
        >
            {/* Ancestor badge */}
            {isRoot && (
                <span
                    className="absolute -top-2 -left-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--brown-soft)] text-[11px] font-bold text-white shadow-md ring-2 ring-[var(--card)]"
                    title="Thủy tổ"
                >
                    Tổ
                </span>
            )}

            {/* Avatar */}
            <div className="relative">
                <span
                    className={`grid h-[80px] w-[80px] place-items-center overflow-hidden rounded-full font-bold text-white shadow-md transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg ${isDead ? 'ring-2 ring-dashed ring-amber-400/60' : 'ring-2 ring-[var(--card)]'}`}
                    style={{ background: avatarGradient }}
                >
                    {person.anh_dai_dien ? (
                        <img src={person.anh_dai_dien} alt={person.ten_day_du} className="h-full w-full object-cover" />
                    ) : (
                        <span className="font-serif text-2xl font-semibold">
                            {person.ten_day_du.charAt(0).toUpperCase()}
                        </span>
                    )}
                </span>

                {/* Dead badge */}
                {isDead && (
                    <span
                        className="absolute -top-1 -right-1 z-10 grid h-6 w-6 place-items-center rounded-full bg-amber-50 text-amber-600 shadow-sm ring-2 ring-amber-200"
                        title="Đã khuất"
                    >
                        <Icon name="lotus" size={12} strokeWidth={1.5} />
                    </span>
                )}

                {/* Birth order badge */}
                {person.thu_tu_sinh && (
                    <span className="absolute -top-1 -left-1 z-10 grid h-5 w-5 place-items-center rounded-full bg-[var(--gold)] text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--card)]">
                        {person.thu_tu_sinh}
                    </span>
                )}
            </div>

            {/* Name + info */}
            <div className="flex w-full flex-col items-center gap-0.5">
                <span className={`line-clamp-2 min-h-9 w-full text-[13.5px] leading-tight font-bold transition-colors duration-200 group-hover:text-[var(--gold)] ${isDead ? 'text-[var(--ink-soft)]' : 'text-[var(--ink)]'}`}>
                    {person.ten_day_du}
                </span>

                {(birthYear || deathYear) && (
                    <span className="text-[11px] font-medium text-[var(--ink-mute)]">
                        {birthYear || '?'}
                        {isDead ? ` – ${deathYear || '?'}` : ''}{age !== null ? ` (${age}t)` : ''}
                    </span>
                )}

                {/* Lifespan bar */}
                {age !== null && (
                    <div className="mt-1 h-1 w-14 overflow-hidden rounded-full bg-[var(--line)]">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isDead ? 'bg-amber-400/70' : 'bg-emerald-400'}`}
                            style={{ width: `${lifespanPercent}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Parent label */}
            {parentLabel && (
                <span className="max-w-full truncate rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                    {parentLabel}
                </span>
            )}
        </button>
    );
}
