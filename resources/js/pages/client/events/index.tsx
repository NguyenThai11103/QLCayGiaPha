/**
 * ============================================================
 * Sự kiện & Lễ giỗ — Family Events & Death Anniversaries
 * Production-ready React + TypeScript component
 * ============================================================
 *
 * Drop-in for a React 18+ / TypeScript project. Designed against
 * the Gia Phả design system tokens (--gold, --brown, --jade, etc.)
 * defined in styles.css. No external dependencies beyond React.
 *
 * Usage:
 *   <EventsPage onNav={(page) => navigate(page)} />
 *
 * Replace the local EVENTS_2026 array with a real data source
 * (REST / GraphQL / Inertia prop) before shipping. For correct
 * lunar dates, integrate a Vietnamese lunar calendar library
 * (e.g. vn-lunar-calendar) and populate `lunarDate` server-side.
 */

import { Head, router } from '@inertiajs/react';
import React, { useMemo, useState, useEffect } from 'react';
import IconBase from '../../../components/gia-pha/Icon';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import { useAuth } from '../../../contexts/auth.context';

// ============================================================
// External shared modules — adjust import paths to your codebase
// ============================================================
// import { Icon } from "./Icon";
// import { BY_ID, avatarGrad, type Member } from "./data";

// For self-contained delivery the type and external symbol
// signatures are declared inline:
const Icon: React.FC<{
    name: string;
    size?: number;
    color?: string;
    strokeWidth?: number;
}> = ({ name, ...props }) => <IconBase name={name as React.ComponentProps<typeof IconBase>['name']} {...props} />;

// ============================================================
// Types
// ============================================================
export type EventType =
    | 'anniversary' // Lễ giỗ
    | 'wedding' // Lễ cưới
    | 'ceremony' // Lễ truyền thống
    | 'longevity' // Mừng thọ
    | 'birthday'; // Đầy tháng / Sinh nhật

export type RsvpStatus = 'going' | 'maybe' | 'declined' | 'pending';

export interface FamilyEvent {
    id: string;
    /** Solar date, ISO yyyy-mm-dd */
    date: string;
    /** Display-friendly lunar date, e.g. "15 tháng 3 ÂL" */
    lunarDate?: string;
    title: string;
    type: EventType;
    /** Honoree member id (the person the event is for) */
    honoreeId?: string;
    /** Host / organizer member id */
    hostId?: string;
    location: string;
    attendees: number;
    rsvpStatus?: RsvpStatus;
    description?: string;
    /** Mark high-importance events (Giỗ Tổ, Vu Lan) */
    pinned?: boolean;
}

export interface Member {
    id: string;
    name: string;
    short: string;
    gender: 'M' | 'F';
    birth: number;
    death: number | null;
    gen: number;
    parents: string[];
    spouse: string | null;
    title?: string;
    role?: string;
    honor?: string;
    me?: boolean;
}

export interface EventsPageProps {
    onNav?: (page: string) => void;
    /** Override the default sample data — pass your real events */
    events?: FamilyEvent[];
    /** Override "today" for testing. Defaults to current date. */
    today?: string;
}

const MEMBERS: Member[] = [
    { id: 'm1', name: 'Nguyễn Văn Trường', short: 'NVT', gender: 'M', birth: 1850, death: 1920, gen: 1, parents: [], spouse: 'm2', title: 'Cụ Tổ' },
    { id: 'm2', name: 'Trần Thị Lan', short: 'TTL', gender: 'F', birth: 1855, death: 1925, gen: 1, parents: [], spouse: 'm1', title: 'Cụ Bà' },
    { id: 'm13', name: 'Nguyễn Văn Tùng', short: 'NVT', gender: 'M', birth: 1942, death: 2018, gen: 4, parents: [], spouse: null, title: 'Ông' },
    { id: 'm15', name: 'Nguyễn Văn Quang', short: 'NVQ', gender: 'M', birth: 1945, death: null, gen: 4, parents: [], spouse: null, title: 'Ông' },
    { id: 'm23', name: 'Nguyễn Minh Anh', short: 'NMA', gender: 'F', birth: 1995, death: null, gen: 6, parents: [], spouse: null, me: true },
    { id: 'm24', name: 'Nguyễn Đức Long', short: 'NĐL', gender: 'M', birth: 1998, death: null, gen: 6, parents: [], spouse: null },
];

const BY_ID: Record<string, Member> = Object.fromEntries(MEMBERS.map((member) => [member.id, member]));

function avatarGrad(seed: number): string {
    const palettes = [
        ['#B8902C', '#5C3A1E'],
        ['#2F5D3A', '#4A7A52'],
        ['#B4502E', '#8A3A1E'],
        ['#8A6F3F', '#5C4A2E'],
        ['#9B6B2E', '#D4AF55'],
        ['#4A7A52', '#2F5D3A'],
    ];
    const palette = palettes[Math.abs(seed) % palettes.length];
    return `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`;
}

// ============================================================
// Event type metadata — maps EventType to display tokens
// ============================================================
interface EventTypeMeta {
    label: string;
    icon: string;
    /** CSS custom-property suffix (e.g. "brown" → var(--brown)) */
    color: 'brown' | 'terracotta' | 'jade' | 'gold' | 'crimson';
}

const EVENT_META: Record<EventType, EventTypeMeta> = {
    anniversary: { label: 'Lễ giỗ', icon: 'scroll', color: 'brown' },
    wedding: { label: 'Lễ cưới', icon: 'heart', color: 'terracotta' },
    ceremony: { label: 'Lễ truyền thống', icon: 'lotus', color: 'jade' },
    longevity: { label: 'Mừng thọ', icon: 'sparkle', color: 'gold' },
    birthday: { label: 'Đầy tháng / Sinh nhật', icon: 'users', color: 'crimson' },
};

// ============================================================
// Sample event data — replace in production
// ============================================================
const EVENTS_2026: FamilyEvent[] = [
    {
        id: 'e1',
        date: '2026-03-27',
        lunarDate: '15 tháng 3 ÂL',
        title: 'Giỗ Tổ — Cụ Nguyễn Văn Trường (176 năm)',
        type: 'anniversary',
        honoreeId: 'm1',
        location: 'Từ đường Tiên Điền, Hà Tĩnh',
        attendees: 47,
        rsvpStatus: 'going',
        pinned: true,
        description: 'Lễ giỗ Tổ năm thứ 176 — toàn họ tụ hội. Trưởng họ Ông Nguyễn Văn Quang chủ tế. Cỗ chay 12 mâm, cỗ mặn 8 mâm.',
    },
    {
        id: 'e2',
        date: '2026-04-20',
        title: 'Lễ cưới — Nguyễn Đức Long & Phạm Thúy Quỳnh',
        type: 'wedding',
        honoreeId: 'm24',
        location: 'Trung tâm Tiệc cưới Bến Thành, Hà Nội',
        attendees: 120,
        rsvpStatus: 'going',
        description: 'Đại diện họ Nguyễn: Ông Bác Nguyễn Văn Hải. Lễ rước dâu lúc 9:30.',
    },
    {
        id: 'e3',
        date: '2026-05-15',
        lunarDate: '29 tháng 3 ÂL',
        title: 'Mừng thọ Ông Nguyễn Văn Quang — 81 tuổi',
        type: 'longevity',
        honoreeId: 'm15',
        location: 'Nhà thờ tổ, Tiên Điền',
        attendees: 38,
        rsvpStatus: 'going',
        description: 'Mừng thọ bát tuần. Mời cụ ngồi ghế thất phẩm, con cháu mừng tuổi đỏ.',
    },
    {
        id: 'e4',
        date: '2026-05-25',
        lunarDate: '10 tháng 4 ÂL',
        title: 'Giỗ Cụ Bà Trần Thị Lan',
        type: 'anniversary',
        honoreeId: 'm2',
        location: 'Từ đường Tiên Điền',
        attendees: 35,
        rsvpStatus: 'going',
    },
    {
        id: 'e5',
        date: '2026-06-19',
        lunarDate: '5 tháng 5 ÂL',
        title: 'Lễ Đoan Ngọ — Diệt sâu bọ',
        type: 'ceremony',
        location: 'Từ đường Tiên Điền',
        attendees: 22,
        rsvpStatus: 'maybe',
    },
    {
        id: 'e6',
        date: '2026-08-26',
        lunarDate: '14 tháng 7 ÂL',
        title: 'Lễ Vu Lan — Báo hiếu cha mẹ',
        type: 'ceremony',
        location: 'Chùa Hương Tích',
        attendees: 80,
        rsvpStatus: 'going',
        pinned: true,
    },
    {
        id: 'e7',
        date: '2026-09-25',
        lunarDate: '15 tháng 8 ÂL',
        title: 'Tết Trung Thu — Họp mặt trẻ em họ Nguyễn',
        type: 'ceremony',
        location: 'Sân nhà thờ tổ',
        attendees: 65,
        rsvpStatus: 'going',
    },
    {
        id: 'e8',
        date: '2026-10-12',
        title: 'Đầy tháng cháu Nguyễn Bảo Nhi',
        type: 'birthday',
        hostId: 'm23',
        location: 'Hà Nội',
        attendees: 25,
        rsvpStatus: 'going',
        description: 'Con đầu lòng của vợ chồng Minh Anh và Bảo Khang.',
    },
    {
        id: 'e9',
        date: '2026-11-24',
        lunarDate: '15 tháng 10 ÂL',
        title: 'Giỗ Ông Nguyễn Văn Tùng (8 năm)',
        type: 'anniversary',
        honoreeId: 'm13',
        location: 'Từ đường Tiên Điền',
        attendees: 28,
        rsvpStatus: 'going',
    },
    {
        id: 'e10',
        date: '2026-12-25',
        title: 'Họp mặt cuối năm — Toàn Phái Cả',
        type: 'ceremony',
        location: 'Tiên Điền + livestream',
        attendees: 95,
        rsvpStatus: 'pending',
    },
];

// ============================================================
// Date utilities
// ============================================================
const VI_MONTHS: readonly string[] = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
];
const VI_WEEKDAYS: readonly string[] = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

interface ParsedDate {
    y: number;
    /** 1-12 */
    m: number;
    d: number;
}

function parseISO(iso: string): ParsedDate {
    const [y, m, d] = iso.split('-').map(Number);
    return { y, m, d };
}

function daysBetween(aISO: string, bISO: string): number {
    return Math.round((new Date(bISO).getTime() - new Date(aISO).getTime()) / 86400000);
}

function daysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

/** 0 = Sunday, 6 = Saturday */
function firstWeekdayOf(year: number, month: number): number {
    return new Date(year, month - 1, 1).getDay();
}

/**
 * Placeholder lunar conversion. Replace with a real Vietnamese
 * lunar calendar library for production accuracy.
 */
function approximateLunar(year: number, month: number, day: number): string {
    const lunarMonth = ((month + 10) % 12) + 1;
    const lunarDay = ((day + 17) % 30) + 1;
    return `${lunarDay}/${lunarMonth} ÂL`;
}

// ============================================================
// Sub-components
// ============================================================

interface CountdownProps {
    targetISO: string;
    today: string;
}

const Countdown: React.FC<CountdownProps> = ({ targetISO, today }) => {
    const days = daysBetween(today, targetISO);
    const isPast = days < 0;
    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                background: isPast ? 'var(--card-soft)' : 'var(--gold-glow)',
                border: `1px solid ${isPast ? 'var(--line)' : 'var(--gold-pale)'}`,
                color: isPast ? 'var(--ink-mute)' : 'var(--brown)',
            }}
        >
            <span className="font-serif" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>
                {Math.abs(days)}
            </span>
            <span style={{ fontSize: 11, letterSpacing: 0.5 }}>{isPast ? 'ngày trước' : days === 0 ? 'hôm nay' : 'ngày nữa'}</span>
        </div>
    );
};

interface NextEventHeroProps {
    event: FamilyEvent;
    honoree: Member | null;
    today: string;
}

const NextEventHero: React.FC<NextEventHeroProps> = ({ event, honoree, today }) => {
    const meta = EVENT_META[event.type];
    const { d, m } = parseISO(event.date);

    return (
        <div
            className="card"
            style={{
                padding: 28,
                marginBottom: 24,
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, var(--card) 0%, color-mix(in srgb, var(--gold) 6%, var(--card)) 100%)',
                borderColor: 'var(--gold-soft)',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: -40,
                    right: -40,
                    width: 200,
                    height: 200,
                    background: 'radial-gradient(circle, var(--gold-glow), transparent 70%)',
                    opacity: 0.7,
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    top: 24,
                    right: 28,
                    opacity: 0.12,
                    color: 'var(--gold)',
                }}
            >
                <Icon name={meta.icon} size={96} />
            </div>

            <div
                style={{
                    position: 'relative',
                    display: 'flex',
                    gap: 28,
                    alignItems: 'flex-start',
                }}
            >
                <div
                    style={{
                        flexShrink: 0,
                        padding: '14px 18px',
                        background: 'var(--card)',
                        border: '1.5px solid var(--gold-soft)',
                        borderRadius: 16,
                        textAlign: 'center',
                        minWidth: 110,
                        boxShadow: 'var(--shadow-md)',
                    }}
                >
                    <div
                        style={{
                            fontSize: 10,
                            letterSpacing: 2,
                            color: 'var(--brown)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                        }}
                    >
                        {VI_MONTHS[m - 1]}
                    </div>
                    <div
                        className="font-serif"
                        style={{
                            fontSize: 56,
                            fontWeight: 600,
                            color: 'var(--gold)',
                            lineHeight: 1,
                            margin: '4px 0',
                        }}
                    >
                        {d}
                    </div>
                    {event.lunarDate && (
                        <div
                            style={{
                                fontSize: 11,
                                color: 'var(--ink-mute)',
                                borderTop: '1px solid var(--line)',
                                paddingTop: 4,
                            }}
                        >
                            {event.lunarDate}
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 8,
                            flexWrap: 'wrap',
                        }}
                    >
                        <span
                            style={{
                                fontSize: 10.5,
                                letterSpacing: 2,
                                color: 'var(--gold)',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                            }}
                        >
                            Sự kiện tiếp theo
                        </span>
                        <Countdown targetISO={event.date} today={today} />
                        {event.pinned && (
                            <span className="chip chip-gold">
                                <Icon name="pin" size={10} />
                                Quan trọng
                            </span>
                        )}
                    </div>
                    <h2
                        className="font-serif"
                        style={{
                            fontSize: 32,
                            fontWeight: 600,
                            color: 'var(--ink)',
                            lineHeight: 1.15,
                            marginBottom: 10,
                            letterSpacing: '-0.3px',
                        }}
                    >
                        {event.title}
                    </h2>
                    {event.description && (
                        <p
                            style={{
                                fontSize: 14,
                                color: 'var(--ink-soft)',
                                lineHeight: 1.5,
                                marginBottom: 14,
                                maxWidth: 640,
                            }}
                        >
                            {event.description}
                        </p>
                    )}
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 12,
                            fontSize: 13,
                            color: 'var(--ink-soft)',
                            marginBottom: 18,
                        }}
                    >
                        <Stat icon="home" label={event.location} />
                        <Stat icon="users" label={`${event.attendees} người dự`} />
                        {honoree && <Stat icon="heart" label={`Người được tưởng nhớ: ${honoree.name}`} />}
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="btn btn-primary">
                            <Icon name="plus" size={14} />
                            Xác nhận tham dự
                        </button>
                        <button className="btn btn-ghost">
                            <Icon name="calendar" size={14} />
                            Thêm vào lịch
                        </button>
                        <button className="btn btn-ghost">
                            <Icon name="link" size={14} />
                            Chia sẻ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Stat: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <Icon name={icon} size={14} color="var(--ink-mute)" />
        {label}
    </span>
);

// ============================================================
interface CalendarViewProps {
    year: number;
    /** 1-12 */
    month: number;
    events: FamilyEvent[];
    selected: string | null;
    today: string;
    onSelect: (iso: string) => void;
    onMonthChange: (direction: -1 | 1) => void;
}

interface DayCell {
    day: number;
    iso: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({ year, month, events, selected, today, onSelect, onMonthChange }) => {
    const totalDays = daysInMonth(year, month);
    const startWeekday = firstWeekdayOf(year, month);
    const cells: (DayCell | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) {
        const iso = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ day: d, iso });
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const eventsByDate = useMemo<Map<string, FamilyEvent[]>>(() => {
        const map = new Map<string, FamilyEvent[]>();
        for (const e of events) {
            const arr = map.get(e.date) ?? [];
            arr.push(e);
            map.set(e.date, arr);
        }
        return map;
    }, [events]);

    return (
        <div className="card" style={{ padding: 20 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                    <div
                        style={{
                            fontSize: 11,
                            letterSpacing: 2,
                            color: 'var(--gold)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            marginBottom: 2,
                        }}
                    >
                        Lịch tháng
                    </div>
                    <h2 className="font-serif" style={{ fontSize: 26, fontWeight: 600, color: 'var(--ink)' }}>
                        {VI_MONTHS[month - 1]} {year}
                    </h2>
                </div>
                <div className="row gap-2">
                    <button className="icon-btn" onClick={() => onMonthChange(-1)} title="Tháng trước" aria-label="Tháng trước">
                        <Icon name="chevron-down" size={16} />
                    </button>
                    <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>
                        Hôm nay
                    </button>
                    <button className="icon-btn" onClick={() => onMonthChange(1)} title="Tháng sau" aria-label="Tháng sau">
                        <Icon name="chevron-right" size={16} />
                    </button>
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 4,
                    marginBottom: 6,
                }}
            >
                {VI_WEEKDAYS.map((w, i) => (
                    <div
                        key={i}
                        style={{
                            textAlign: 'center',
                            fontSize: 10.5,
                            letterSpacing: 1.5,
                            color: i === 0 ? 'var(--crimson)' : 'var(--ink-mute)',
                            fontWeight: 700,
                            padding: '6px 0',
                        }}
                    >
                        {w}
                    </div>
                ))}
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 4,
                }}
            >
                {cells.map((cell, i) => {
                    if (!cell) return <div key={i} />;
                    const isToday = cell.iso === today;
                    const isSelected = cell.iso === selected;
                    const dayEvents = eventsByDate.get(cell.iso) ?? [];
                    const isSunday = i % 7 === 0;
                    return (
                        <button
                            key={i}
                            onClick={() => onSelect(cell.iso)}
                            style={{
                                aspectRatio: '1 / 1',
                                background: isSelected
                                    ? 'var(--gold-glow)'
                                    : isToday
                                        ? 'color-mix(in srgb, var(--gold) 6%, transparent)'
                                        : 'transparent',
                                border: isSelected ? '1.5px solid var(--gold)' : isToday ? '1.5px solid var(--gold-soft)' : '1px solid transparent',
                                borderRadius: 10,
                                padding: 6,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'stretch',
                                justifyContent: 'space-between',
                                position: 'relative',
                                transition: 'all 0.15s',
                            }}
                        >
                            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span
                                    className="font-serif"
                                    style={{
                                        fontSize: 16,
                                        fontWeight: 600,
                                        color: isSelected ? 'var(--gold)' : isSunday ? 'var(--crimson)' : 'var(--ink)',
                                        lineHeight: 1,
                                    }}
                                >
                                    {cell.day}
                                </span>
                                <span style={{ fontSize: 9, color: 'var(--ink-faint)', fontWeight: 500 }}>
                                    {approximateLunar(year, month, cell.day)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {dayEvents.slice(0, 2).map((e) => {
                                    const evMeta = EVENT_META[e.type];
                                    return (
                                        <div
                                            key={e.id}
                                            style={{
                                                fontSize: 9.5,
                                                padding: '1px 5px',
                                                background: `color-mix(in srgb, var(--${evMeta.color}) 14%, transparent)`,
                                                color: `var(--${evMeta.color})`,
                                                borderRadius: 4,
                                                fontWeight: 600,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                textAlign: 'left',
                                            }}
                                        >
                                            {e.title.split(' — ')[0].split(' ').slice(0, 3).join(' ')}
                                        </div>
                                    );
                                })}
                                {dayEvents.length > 2 && (
                                    <div
                                        style={{
                                            fontSize: 9,
                                            color: 'var(--ink-mute)',
                                            textAlign: 'left',
                                            paddingLeft: 5,
                                        }}
                                    >
                                        +{dayEvents.length - 2} nữa
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ============================================================
interface UpcomingItemProps {
    event: FamilyEvent;
    honoree: Member | null;
    isLast: boolean;
    today: string;
}

const UpcomingItem: React.FC<UpcomingItemProps> = ({ event, honoree, isLast, today }) => {
    const meta = EVENT_META[event.type];
    const { d, m } = parseISO(event.date);
    return (
        <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flexShrink: 0,
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: `color-mix(in srgb, var(--${meta.color}) 14%, transparent)`,
                        border: `1px solid color-mix(in srgb, var(--${meta.color}) 25%, transparent)`,
                        color: `var(--${meta.color})`,
                        display: 'grid',
                        placeItems: 'center',
                        zIndex: 1,
                    }}
                >
                    <Icon name={meta.icon} size={16} />
                </div>
                {!isLast && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 36,
                            bottom: -20,
                            left: '50%',
                            width: 1,
                            background: 'var(--line)',
                            transform: 'translateX(-50%)',
                        }}
                    />
                )}
            </div>

            <div style={{ flex: 1, paddingBottom: 20, minWidth: 0 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 8,
                        marginBottom: 4,
                        flexWrap: 'wrap',
                    }}
                >
                    <span className="font-serif" style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>
                        {d}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: 0.5 }}>{VI_MONTHS[m - 1]}</span>
                    {event.lunarDate && <span style={{ fontSize: 10.5, color: 'var(--gold)' }}>· {event.lunarDate}</span>}
                    <span style={{ marginLeft: 'auto' }}>
                        <Countdown targetISO={event.date} today={today} />
                    </span>
                </div>
                <div
                    style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: 'var(--ink)',
                        lineHeight: 1.3,
                        marginBottom: 4,
                    }}
                >
                    {event.title}
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        fontSize: 11.5,
                        color: 'var(--ink-mute)',
                        flexWrap: 'wrap',
                    }}
                >
                    <span
                        className="chip"
                        style={{
                            background: `color-mix(in srgb, var(--${meta.color}) 10%, transparent)`,
                            color: `var(--${meta.color})`,
                            borderColor: `color-mix(in srgb, var(--${meta.color}) 20%, transparent)`,
                            fontSize: 10,
                        }}
                    >
                        {meta.label}
                    </span>
                    <span>· {event.location}</span>
                    <span>· {event.attendees} người</span>
                </div>
            </div>
        </div>
    );
};

// ============================================================
type FilterValue = EventType | 'all';

interface FilterBarProps {
    active: FilterValue;
    onChange: (value: FilterValue) => void;
    counts: Record<FilterValue, number>;
}

const FILTER_LABELS: Record<FilterValue, string> = {
    all: 'Tất cả',
    anniversary: 'Lễ giỗ',
    wedding: 'Lễ cưới',
    ceremony: 'Lễ truyền thống',
    longevity: 'Mừng thọ',
    birthday: 'Sinh nhật',
};

const FilterBar: React.FC<FilterBarProps> = ({ active, onChange, counts }) => {
    const types: FilterValue[] = ['all', 'anniversary', 'wedding', 'ceremony', 'longevity', 'birthday'];
    return (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {types.map((t) => {
                const isActive = active === t;
                const meta = t === 'all' ? null : EVENT_META[t];
                return (
                    <button
                        key={t}
                        onClick={() => onChange(t)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '7px 14px',
                            borderRadius: 999,
                            background: isActive
                                ? meta
                                    ? `color-mix(in srgb, var(--${meta.color}) 14%, transparent)`
                                    : 'var(--gold-glow)'
                                : 'var(--card)',
                            color: isActive ? (meta ? `var(--${meta.color})` : 'var(--brown)') : 'var(--ink-soft)',
                            border: `1px solid ${isActive ? (meta ? `color-mix(in srgb, var(--${meta.color}) 30%, transparent)` : 'var(--gold-soft)') : 'var(--line)'
                                }`,
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.15s',
                        }}
                    >
                        {meta && <Icon name={meta.icon} size={12} />}
                        {FILTER_LABELS[t]}
                        <span
                            style={{
                                fontSize: 10.5,
                                padding: '1px 6px',
                                borderRadius: 999,
                                background: isActive ? 'rgba(255,255,255,0.4)' : 'var(--card-soft)',
                                fontWeight: 700,
                            }}
                        >
                            {counts[t]}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

// ============================================================
interface YearHeatmapProps {
    events: FamilyEvent[];
    currentMonth: number;
    onMonthClick: (month: number) => void;
}

const YearHeatmap: React.FC<YearHeatmapProps> = ({ events, currentMonth, onMonthClick }) => {
    const counts = Array<number>(12).fill(0);
    for (const e of events) counts[parseISO(e.date).m - 1]++;
    const max = Math.max(...counts, 1);
    return (
        <div className="card card-pad">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                    <div className="section-title">Tổng quan năm 2026</div>
                    <div className="section-meta">{events.length} sự kiện · phân bố theo tháng</div>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8 }}>
                {counts.map((c, i) => {
                    const intensity = c / max;
                    const isCurrent = i + 1 === currentMonth;
                    return (
                        <button
                            key={i}
                            onClick={() => onMonthClick(i + 1)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'stretch',
                                gap: 6,
                                padding: 8,
                                borderRadius: 10,
                                background: isCurrent ? 'var(--gold-glow)' : 'transparent',
                                border: `1px solid ${isCurrent ? 'var(--gold-soft)' : 'transparent'}`,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            <div
                                style={{
                                    height: 32,
                                    borderRadius: 4,
                                    background:
                                        c === 0
                                            ? 'var(--card-soft)'
                                            : `color-mix(in srgb, var(--gold) ${Math.round(intensity * 80 + 20)}%, var(--card-soft))`,
                                    border: c === 0 ? '1px dashed var(--line)' : '1px solid var(--gold-soft)',
                                    display: 'grid',
                                    placeItems: 'center',
                                    color: c === 0 ? 'var(--ink-faint)' : 'var(--brown)',
                                    fontSize: 14,
                                    fontWeight: 700,
                                }}
                            >
                                {c || '—'}
                            </div>
                            <div
                                style={{
                                    fontSize: 10,
                                    color: isCurrent ? 'var(--brown)' : 'var(--ink-mute)',
                                    textAlign: 'center',
                                    fontWeight: isCurrent ? 700 : 500,
                                    letterSpacing: 0.5,
                                }}
                            >
                                T{i + 1}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ============================================================
interface EventDetailProps {
    event: FamilyEvent | null;
    honoree: Member | null;
}

const EventDetail: React.FC<EventDetailProps> = ({ event, honoree }) => {
    if (!event) {
        return (
            <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--ink-mute)', padding: 32 }}>
                <Icon name="calendar" size={28} color="var(--ink-faint)" />
                <div style={{ marginTop: 10, fontSize: 13 }}>Chọn một ngày để xem chi tiết</div>
            </div>
        );
    }
    const meta = EVENT_META[event.type];
    const { d, m, y } = parseISO(event.date);
    const seed = honoree ? parseInt(honoree.id.replace('m', ''), 10) : 0;

    return (
        <div className="card" style={{ padding: 20 }}>
            <div className="row gap-2" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
                <span
                    className="chip"
                    style={{
                        background: `color-mix(in srgb, var(--${meta.color}) 14%, transparent)`,
                        color: `var(--${meta.color})`,
                        borderColor: `color-mix(in srgb, var(--${meta.color}) 25%, transparent)`,
                    }}
                >
                    <Icon name={meta.icon} size={11} />
                    {meta.label}
                </span>
                {event.pinned && (
                    <span className="chip chip-gold">
                        <Icon name="pin" size={10} />
                        Quan trọng
                    </span>
                )}
            </div>

            <div
                className="font-serif"
                style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    lineHeight: 1.2,
                    marginBottom: 6,
                }}
            >
                {event.title}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', marginBottom: 16 }}>
                {d} {VI_MONTHS[m - 1]} {y}
                {event.lunarDate && <> · {event.lunarDate}</>}
            </div>

            {honoree && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        background: 'var(--card-soft)',
                        borderRadius: 10,
                        marginBottom: 14,
                        border: '1px solid var(--line)',
                    }}
                >
                    <div
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: avatarGrad(seed),
                            display: 'grid',
                            placeItems: 'center',
                            color: 'white',
                            fontSize: 12,
                            fontWeight: 700,
                        }}
                    >
                        {honoree.short}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: 10,
                                letterSpacing: 1.5,
                                color: 'var(--ink-mute)',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                            }}
                        >
                            Tưởng nhớ / Vinh danh
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{honoree.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                            Đời {honoree.gen} · {honoree.birth}
                            {honoree.death ? `–${honoree.death}` : ''}
                        </div>
                    </div>
                </div>
            )}

            {event.description && (
                <p
                    style={{
                        fontSize: 13,
                        color: 'var(--ink-soft)',
                        lineHeight: 1.55,
                        marginBottom: 14,
                    }}
                >
                    {event.description}
                </p>
            )}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                    marginBottom: 16,
                }}
            >
                <DetailItem label="Địa điểm" value={event.location} />
                <DetailItem label="Người dự" value={`${event.attendees} người`} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    <Icon name="plus" size={13} />
                    Tham dự
                </button>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                    <Icon name="edit" size={13} />
                    Chỉnh sửa
                </button>
            </div>
        </div>
    );
};

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div style={{ padding: '8px 10px', background: 'var(--card-soft)', borderRadius: 8 }}>
        <div
            style={{
                fontSize: 10,
                letterSpacing: 1,
                color: 'var(--ink-mute)',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 2,
            }}
        >
            {label}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 500 }}>{value}</div>
    </div>
);

// ============================================================
// Map SuKien DB → FamilyEvent UI
// ============================================================
const LOAI_MAP: Record<string, EventType> = {
    gio_to: 'anniversary',
    le_cuoi: 'wedding',
    le_truyen_thong: 'ceremony',
    mung_tho: 'longevity',
    sinh_nhat: 'birthday',
    anniversary: 'anniversary',
    wedding: 'wedding',
    ceremony: 'ceremony',
    longevity: 'longevity',
    birthday: 'birthday',
};

function mapSuKienToFamilyEvent(sk: import('../../../services/gia-pha.api').SuKien): FamilyEvent {
    return {
        id: String(sk.id),
        date: sk.ngay_duong || sk.ngay_am || new Date().toISOString().slice(0, 10),
        lunarDate: sk.ngay_am ? sk.ngay_am.split('-').reverse().join('/') + ' ÂL' : undefined,
        title: sk.ten_su_kien,
        type: LOAI_MAP[sk.loai_su_kien || ''] ?? 'ceremony',
        location: sk.dia_diem || 'Chưa cập nhật địa điểm',
        attendees: 0,
        description: sk.mo_ta ?? undefined,
        pinned: false,
    };
}

// ============================================================
// Màn hình thêm sự kiện (admin)
// ============================================================
interface AddEventModalProps {
    dongHoId: number;
    onClose: () => void;
    onSuccess: () => void;
}

const LOAI_OPTIONS: { value: string; label: string }[] = [
    { value: 'gio_to', label: 'Lễ giỗ' },
    { value: 'le_cuoi', label: 'Lễ cưới' },
    { value: 'le_truyen_thong', label: 'Lễ truyền thống' },
    { value: 'mung_tho', label: 'Mừng thọ' },
    { value: 'sinh_nhat', label: 'Sinh nhật / Đầy tháng' },
];

const AddEventModal: React.FC<AddEventModalProps> = ({ dongHoId, onClose, onSuccess }) => {
    const [form, setForm] = React.useState({
        ten_su_kien: '',
        loai_su_kien: 'gio_to',
        ngay_duong: '',
        ngay_am: '',
        lap_lai_hang_nam: false,
        dia_diem: '',
        mo_ta: '',
    });
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.ten_su_kien.trim()) { setError('Tên sự kiện không được để trống.'); return; }
        if (!form.ngay_duong && !form.ngay_am) { setError('Vui lòng nhập ít nhất ngày dương hoặc ngày âm.'); return; }

        setSaving(true);
        setError('');
        try {
            const { suKienApi } = await import('../../../services/gia-pha.api');
            const res = await suKienApi.create({
                dong_ho_id: dongHoId,
                ten_su_kien: form.ten_su_kien.trim(),
                loai_su_kien: form.loai_su_kien,
                ngay_duong: form.ngay_duong || null,
                ngay_am: form.ngay_am || null,
                lap_lai_hang_nam: form.lap_lai_hang_nam,
                dia_diem: form.dia_diem.trim() || null,
                mo_ta: form.mo_ta.trim() || null,
            });
            if (res.success) { onSuccess(); onClose(); }
            else setError(res.message || 'Không thể tạo sự kiện.');
        } catch {
            setError('Lỗi kết nối máy chủ.');
        } finally {
            setSaving(false);
        }
    };

    const f = (k: string, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }));

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
            <form onSubmit={handleSubmit} style={{ background: 'var(--bg-elev)', borderRadius: 20, border: '1px solid var(--line)', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, var(--gold), var(--brown-soft))', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Quản lý sự kiện</div>
                        <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>Thêm sự kiện mới</h3>
                    </div>
                    <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                        <Icon name="x" size={15} />
                    </button>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {error && <div style={{ padding: '10px 14px', background: 'color-mix(in srgb, var(--crimson) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--crimson) 25%, transparent)', borderRadius: 10, color: 'var(--crimson)', fontSize: 13 }}>{error}</div>}

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>Tên sự kiện <span style={{ color: 'var(--crimson)' }}>*</span></span>
                        <input value={form.ten_su_kien} onChange={e => f('ten_su_kien', e.target.value)} className="gp-input" placeholder="Vd: Giỗ Tổ Cụ Nguyễn Văn A" required />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>Loại sự kiện</span>
                        <select value={form.loai_su_kien} onChange={e => f('loai_su_kien', e.target.value)} className="gp-input">
                            {LOAI_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>Ngày dương lịch</span>
                            <input type="date" value={form.ngay_duong} onChange={e => f('ngay_duong', e.target.value)} className="gp-input" />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>Ngày âm lịch</span>
                            <input type="date" value={form.ngay_am} onChange={e => f('ngay_am', e.target.value)} className="gp-input" placeholder="yyyy-mm-dd" />
                        </label>
                    </div>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>Địa điểm</span>
                        <input value={form.dia_diem} onChange={e => f('dia_diem', e.target.value)} className="gp-input" placeholder="Vd: Từ đường dòng họ, Hà Tĩnh" />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.lap_lai_hang_nam} onChange={e => f('lap_lai_hang_nam', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--gold)', cursor: 'pointer' }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)' }}>Lặp lại hàng năm (lễ giỗ, ngày kỷ niệm…)</span>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>Mô tả</span>
                        <textarea value={form.mo_ta} onChange={e => f('mo_ta', e.target.value)} className="gp-input" rows={3} placeholder="Thông tin chi tiết về sự kiện…" style={{ resize: 'none' }} />
                    </label>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                        <button type="button" onClick={onClose} className="gp-btn gp-btn-ghost">Hủy</button>
                        <button type="submit" disabled={saving} className="gp-btn gp-btn-primary" style={{ opacity: saving ? 0.6 : 1 }}>
                            {saving ? 'Đang lưu…' : 'Tạo sự kiện'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

// ============================================================
// Main page — kết nối API thực
// ============================================================
export const EventsPage: React.FC<EventsPageProps> = ({ onNav, events: initialEvents, today = new Date().toISOString().slice(0, 10) }) => {
    const { user } = useAuth();
    const [rawEvents,    setRawEvents]    = React.useState<FamilyEvent[]>(initialEvents || []);
    const [loading,      setLoading]      = React.useState(!initialEvents);
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [filter, setFilter] = useState<FilterValue>('all');
    const [viewMonth, setViewMonth] = useState<{ y: number; m: number }>({
        y: parseISO(today).y,
        m: parseISO(today).m,
    });
    const [selectedDate, setSelectedDate] = useState<string | null>(today);


            const loadEvents = React.useCallback(async () => {
                setLoading(true);
                try {
                    const { suKienApi } = await import('../../../services/gia-pha.api');
                    const dongHoId = user?.dong_ho?.id;
                    const res = await suKienApi.list(dongHoId);
                    if (res.success && res.data) {
                        setRawEvents(res.data.map(mapSuKienToFamilyEvent));
                    }
                } catch {
                    // network error — giữ mảng rỗng
                } finally {
                    setLoading(false);
                }
            }, [user?.dong_ho?.id]);

            React.useEffect(() => { void loadEvents(); }, [loadEvents]);

            // Nếu API chưa có dữ liệu, dùng fallback mẫu để không blank hoàn toàn
            const events = rawEvents.length > 0 ? rawEvents : (loading ? [] : EVENTS_2026);

            const filtered = useMemo<FamilyEvent[]>(() => events.filter((e) => filter === 'all' || e.type === filter), [events, filter]);

            const counts = useMemo<Record<FilterValue, number>>(() => {
                const c: Record<FilterValue, number> = { all: events.length, anniversary: 0, wedding: 0, ceremony: 0, longevity: 0, birthday: 0 };
                for (const e of events) c[e.type]++;
                return c;
            }, [events]);

            const nextEvent = useMemo<FamilyEvent | null>(() => {
                const upcoming = filtered.filter((e) => daysBetween(today, e.date) >= 0).sort((a, b) => daysBetween(today, a.date) - daysBetween(today, b.date));
                return upcoming[0] ?? null;
            }, [filtered, today]);

            const upcoming = useMemo<FamilyEvent[]>(
                () => filtered.filter((e) => daysBetween(today, e.date) >= 0).sort((a, b) => daysBetween(today, a.date) - daysBetween(today, b.date)).slice(0, 8),
                [filtered, today],
            );

            const selectedEvent = useMemo<FamilyEvent | null>(() => {
                if (!selectedDate) return null;
                return events.find((e) => e.date === selectedDate) ?? null;
            }, [events, selectedDate]);

            const monthEvents = useMemo<FamilyEvent[]>(
                () => filtered.filter((e) => { const { y, m } = parseISO(e.date); return y === viewMonth.y && m === viewMonth.m; }),
                [filtered, viewMonth],
            );

            function changeMonth(direction: -1 | 1): void {
                setViewMonth((prev) => {
                    let m = prev.m + direction;
                    let y = prev.y;
                    if (m < 1) { m = 12; y--; }
                    if (m > 12) { m = 1; y++; }
                    return { y, m };
                });
            }

            const navigate = onNav ?? ((page: string) => {
                const href = page === 'dashboard' ? '/gia-pha/dashboard' : page === 'tree' ? '/gia-pha/cay-gia-pha' : '/';
                router.visit(href);
            });

            const isMaster = user?.is_master === 1;

            return (
                <AuthenticatedLayout>
                    <Head title="Sự kiện & Lễ giỗ" />
                    <div className="fade-in" style={{ maxWidth: 1320, margin: '0 auto' }}>
                        <header className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                            <div>
                                <div className="row gap-2" style={{ marginBottom: 6 }}>
                                    <span style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase' }}>Sự kiện & Lễ giỗ</span>
                                    <span style={{ color: 'var(--ink-faint)' }}>·</span>
                                    <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Lịch âm tự động · {events.length} sự kiện</span>
                                </div>
                                <h1 className="page-title">Lịch dòng họ</h1>
                                <div className="page-sub">Lễ giỗ, lễ cưới, lễ truyền thống và mọi cột mốc quan trọng của dòng họ — được tính toán theo cả dương lịch và âm lịch.</div>
                            </div>
                            <div className="row gap-2">
                                <button className="btn btn-ghost" onClick={() => navigate('dashboard')}>
                                    <Icon name="dashboard" size={14} />
                                    Bảng điều khiển
                                </button>
                                {isMaster && (
                                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                                        <Icon name="plus" size={14} />
                                        Tạo sự kiện
                                    </button>
                                )}
                            </div>
                        </header>

                        {loading ? (
                            <div style={{ display: 'grid', placeItems: 'center', height: 300 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: 40, height: 40, border: '4px solid var(--gold-pale)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                                    <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>Đang tải lịch sự kiện...</div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {nextEvent && (
                                    <NextEventHero event={nextEvent} honoree={nextEvent.honoreeId ? (BY_ID[nextEvent.honoreeId] ?? null) : null} today={today} />
                                )}

                                <FilterBar active={filter} onChange={setFilter} counts={counts} />

                                <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 24, marginBottom: 24 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        <CalendarView
                                            year={viewMonth.y}
                                            month={viewMonth.m}
                                            events={monthEvents}
                                            selected={selectedDate}
                                            today={today}
                                            onSelect={setSelectedDate}
                                            onMonthChange={changeMonth}
                                        />
                                        <YearHeatmap events={events} currentMonth={viewMonth.m} onMonthClick={(m) => setViewMonth((v) => ({ ...v, m }))} />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        <EventDetail event={selectedEvent} honoree={selectedEvent?.honoreeId ? (BY_ID[selectedEvent.honoreeId] ?? null) : null} />

                                        <div className="card card-pad">
                                            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
                                                <div>
                                                    <div className="section-title">Sắp diễn ra</div>
                                                    <div className="section-meta">{upcoming.length} sự kiện gần nhất</div>
                                                </div>
                                            </div>
                                            {upcoming.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink-mute)', fontSize: 13 }}>
                                                    <Icon name="calendar" size={28} color="var(--ink-faint)" />
                                                    <div style={{ marginTop: 8 }}>Không có sự kiện sắp tới</div>
                                                    {isMaster && (
                                                        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setShowAddModal(true)}>
                                                            <Icon name="plus" size={13} /> Thêm sự kiện
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    {upcoming.map((e, i) => (
                                                        <UpcomingItem
                                                            key={e.id}
                                                            event={e}
                                                            honoree={e.honoreeId ? (BY_ID[e.honoreeId] ?? null) : null}
                                                            isLast={i === upcoming.length - 1}
                                                            today={today}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {showAddModal && user?.dong_ho?.id && (
                        <AddEventModal
                            dongHoId={user.dong_ho.id}
                            onClose={() => setShowAddModal(false)}
                            onSuccess={() => void loadEvents()}
                        />
                    )}
                </AuthenticatedLayout>
            );
        };

        export default EventsPage;
