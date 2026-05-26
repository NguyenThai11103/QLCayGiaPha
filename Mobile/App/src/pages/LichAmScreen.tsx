/**
 * LichAmScreen – Lịch Âm Tự Động
 * Hiển thị lịch dương với ngày âm tương ứng tự động tính toán.
 * Dùng lunarDate utility, không cần API.
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Platform, Animated, ScrollView, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import { solarToLunar, lunarToSolar, formatLunarDate } from '../utils/lunarDate';
import { colors, spacing, borderRadius, fontSize } from '../config/theme';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

// ─── Constants ───────────────────────────────────────────────────────────────
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_VI = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS_VI = [
  'Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu',
  'Bảy', 'Tám', 'Chín', 'Mười', 'Mười Một', 'Mười Hai',
];

const HOLIDAY_COLORS: { [month: number]: string[] } = {
  1:  ['#EF4444','#DC2626'],  // Tết – đỏ
  2:  ['#F59E0B','#D97706'],  // Rằm – cam
  3:  ['#EF4444','#DC2626'],  // Giỗ Tổ – đỏ
  5:  ['#F59E0B','#D97706'],  // Đoan Ngọ – cam
  7:  ['#EC4899','#DB2777'],  // Vu Lan – hồng
  8:  ['#A78BFA','#8B5CF6'],  // Trung Thu – tím
  9:  ['#F59E0B','#D97706'],  // Ngày Sư Tổ – cam
  10: ['#A78BFA','#8B5CF6'],  // Rằm Mười – tím
  11: ['#EC4899','#DB2777'],  // Ngày Hiếu Nhơn – hồng
  12: ['#10B981','#059669'],  // Ông Táo – xanh
};

// Các ngày lễ âm lịch đặc biệt Việt Nam
const SPECIAL_DAYS: { [month: number]: { [day: number]: string } } = {
  1: { 1: 'Tết Nguyên Đán', 2: 'Mùng 2 Tết', 3: 'Mùng 3 Tết', 15: 'Rằm Tháng Giêng' },
  2: { 15: 'Rằm Tháng Hai' },
  3: { 10: 'Giỗ Tổ Hùng Vương' },
  5: { 5: 'Tết Đoan Ngọ' },
  7: { 15: 'Vu Lan Thanh Minh' },
  8: { 15: 'Trung Thu' },
  9: { 9: 'Ngày Sư Tổ', 10: 'Ngày Sư Tổ (Tiếp)' },
  10: { 15: 'Rằm Tháng Mười' },
  11: { 20: 'Ngày Hiếu Nhơn' },
  12: { 23: 'Ông Táo Về Trời' },
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const d = new Date(year, month - 1, 1);
  return (d.getDay() + 6) % 7; // 0=Mon .. 6=Sun
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────
type LunarHighlight = 'none' | 'mung1' | 'rang15' | 'le';

const LUNAR_HIGHLIGHT_COLORS: Record<LunarHighlight, string[]> = {
  none  : ['transparent', 'transparent'],
  mung1 : ['rgba(239,68,68,0.35)', 'rgba(220,38,38,0.2)'],
  rang15: ['rgba(245,158,11,0.4)', 'rgba(217,119,6,0.25)'],
  le    : ['rgba(236,72,153,0.35)', 'rgba(219,39,119,0.2)'],
};

const LUNAR_HIGHLIGHT_DOT: Record<LunarHighlight, string | null> = {
  none  : null,
  mung1 : '#EF4444',
  rang15: '#F59E0B',
  le    : '#EC4899',
};

const DayCell: React.FC<{
  day        : number;
  lunarDay   : number;
  lunarMonth : number;
  lunarType  : LunarHighlight;
  isToday    : boolean;
  isSelected : boolean;
  isCurrentMonth: boolean;
  specialText?: string;
  onPress    : () => void;
  theme      : ReturnType<typeof useTheme>['theme'];
}> = ({ day, lunarDay, lunarMonth, lunarType, isToday, isSelected, isCurrentMonth, specialText, onPress, theme }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, tension: 400, friction: 8 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 400, friction: 8 }),
    ]).start(onPress);
  };

  const textColor = !isCurrentMonth
    ? (theme.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)')
    : isToday
      ? '#fff'
      : (theme.dark ? '#fff' : colors.gray[800]);

  const lunarColor = specialText
    ? '#EC4899'
    : lunarType === 'mung1' ? '#EF4444'
    : lunarType === 'rang15' ? '#F59E0B'
    : lunarType === 'le' ? '#EC4899'
    : !isCurrentMonth
      ? (theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)')
      : '#F59E0B';

  const dotColor = LUNAR_HIGHLIGHT_DOT[lunarType];

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={dc.cell}>
      <Animated.View style={[dc.dayWrapper, { transform: [{ scale }] }]}>
        {/* Highlight bg */}
        {lunarType !== 'none' && !isSelected && (
          <View style={[dc.lunarBg, { backgroundColor: LUNAR_HIGHLIGHT_COLORS[lunarType][0] }]} />
        )}
        {/* Today / selected bg */}
        {(isToday || isSelected) && (
          <LinearGradient
            colors={isSelected ? ['#6C63FF','#8B5CF6'] : ['rgba(245,158,11,0.9)','rgba(217,119,6,0.9)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={dc.dayBg}
          />
        )}
        <Text style={[dc.dayNum, { color: textColor }]}>{day}</Text>
      </Animated.View>
      {isCurrentMonth && (
        <View style={dc.lunarRow}>
          <Text style={[dc.lunarNum, { color: lunarColor }]} numberOfLines={1}>
            {lunarDay === 1 ? 'M1' : lunarDay}
          </Text>
          {dotColor && (
            <View style={[dc.lunarDot, { backgroundColor: dotColor }]} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Month Grid ───────────────────────────────────────────────────────────────
const MonthGrid: React.FC<{
  year  : number;
  month : number;
  today : { year: number; month: number; day: number };
  selected: { year: number; month: number; day: number } | null;
  onSelect: (d: { year: number; month: number; day: number }) => void;
  theme  : ReturnType<typeof useTheme>['theme'];
}> = ({ year, month, today, selected, onSelect, theme }) => {
  const totalDays  = getDaysInMonth(year, month);
  const firstDay   = getFirstDayOfWeek(year, month);
  const cells: Array<{ year: number; month: number; day: number } | null> = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push({ year, month, day: d });

  return (
    <View style={mg.grid}>
      {DAYS_VI.map((d, i) => (
        <View key={i} style={mg.weekDay}>
          <Text style={[mg.weekDayTxt, { color: i === 6 ? '#EF4444' : (theme.dark ? 'rgba(255,255,255,0.35)' : colors.gray[400]) }]}>
            {d}
          </Text>
        </View>
      ))}
      {cells.map((cell, idx) => {
        if (!cell) return <View key={`empty-${idx}`} style={mg.cell} />;
        // cells chỉ chứa ngày thuộc viewMonth/viewYear nên luôn là "tháng hiện tại"
        // Nhưng do timezone offset, lunar.month có thể khác viewMonth → cần kiểm tra
        const lunar = solarToLunar(new Date(Date.UTC(cell.year, cell.month - 1, cell.day)));
        const isToday  = cell.year === today.year && cell.month === today.month && cell.day === today.day;
        const isSelected = selected
          ? cell.year === selected.year && cell.month === selected.month && cell.day === selected.day
          : false;

        let lunarType: LunarHighlight = 'none';
        const special = SPECIAL_DAYS[lunar.month]?.[lunar.day];
        if (special)       lunarType = 'le';
        else if (lunar.day === 1)  lunarType = 'mung1';
        else if (lunar.day === 15) lunarType = 'rang15';

        return (
          <DayCell
            key={cell.day}
            day={cell.day}
            lunarDay={lunar.day}
            lunarMonth={lunar.month}
            lunarType={lunarType}
            isToday={isToday}
            isSelected={isSelected}
            isCurrentMonth={true}
            specialText={special}
            onPress={() => onSelect(cell)}
            theme={theme}
          />
        );
      })}
    </View>
  );
};

// ─── Detail Card ──────────────────────────────────────────────────────────────
const DetailCard: React.FC<{
  date: { year: number; month: number; day: number };
  theme: ReturnType<typeof useTheme>['theme'];
}> = ({ date, theme }) => {
  const lunar = solarToLunar(new Date(Date.UTC(date.year, date.month - 1, date.day)));
  const special = SPECIAL_DAYS[lunar.month]?.[lunar.day];

  const solarDate = new Date(date.year, date.month - 1, date.day);
  const weekdayIdx = (solarDate.getDay() + 6) % 7;
  const weekdays = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
  const weekdayName = weekdays[weekdayIdx];

  return (
    <Animated.View style={[dcard.wrap, {
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.06)' : colors.white,
      borderColor: theme.dark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.15)',
    }]}>
      <View style={dcard.mainDate}>
        <Text style={[dcard.lunarFull, { color: '#F59E0B' }]}>
          {formatLunarDate(lunar, true)}
        </Text>
        <Text style={[dcard.solarDate, { color: theme.dark ? '#fff' : colors.gray[800] }]}>
          {weekdayName}, {String(date.day).padStart(2,'0')}/{String(date.month).padStart(2,'0')}/{date.year}
        </Text>
      </View>

      {special && (
        <View style={dcard.specialBadge}>
          <Ionicons name="star" size={12} color="#EC4899" />
          <Text style={dcard.specialTxt}>{special}</Text>
        </View>
      )}

      {lunar.day === 1 && (
        <View style={dcard.specialBadge}>
          <Ionicons name="moon" size={12} color="#A78BFA" />
          <Text style={dcard.specialTxt}>Mùng 1 — Đầu tháng âm lịch</Text>
        </View>
      )}
      {lunar.day === 15 && (
        <View style={dcard.specialBadge}>
          <Ionicons name="disc" size={12} color="#F59E0B" />
          <Text style={dcard.specialTxt}>Rằm — Trăng tròn</Text>
        </View>
      )}
    </Animated.View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const LichAmScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const headerAnim = useRef(new Animated.Value(0)).current;

  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [selected,  setSelected]  = useState<{ year: number; month: number; day: number } | null>(null);

  const currentDay = { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };

  React.useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, tension: 50, friction: 10, useNativeDriver: true }).start();
  }, []);

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
    setSelected(null);
  };

  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
    setSelected(null);
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth() + 1);
    setSelected(null);
  };

  const textColor  = theme.dark ? '#fff' : colors.gray[800];
  const mutedColor = theme.dark ? 'rgba(255,255,255,0.4)' : colors.gray[500];
  const bgColor    = theme.dark ? '#050010' : '#F5F7FA';

  const todayLunar = solarToLunar(today);

  return (
    <View style={[ls.root, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        translucent backgroundColor="transparent"
      />
      <LinearGradient
        colors={theme.dark ? ['#050010','#0E0A26','#080018'] : ['#F5F7FA','#EEF2FF','#F5F7FA']}
        style={StyleSheet.absoluteFill}
      />
      {theme.dark && (
        <>
          <View style={[ls.orb, { top: -60, right: -60, width: 220, height: 220, backgroundColor: '#F59E0B' }]} />
          <View style={[ls.orb, { bottom: 80, left: -80, width: 200, height: 200, backgroundColor: '#A78BFA' }]} />
        </>
      )}

      {/* ── Header ── */}
      <Animated.View style={[ls.header, {
        opacity  : headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-20, 0] }) }],
      }]}>
        <TouchableOpacity style={ls.backBtn} onPress={() => navigation.goBack()}>
          <LinearGradient
            colors={theme.dark ? ['rgba(245,158,11,0.15)','rgba(217,119,6,0.08)'] : ['rgba(245,158,11,0.1)','rgba(245,158,11,0.05)']}
            style={ls.backCircle}>
            <Ionicons name="arrow-back" size={20} color="#F59E0B" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={ls.headerCenter}>
          <Text style={[ls.headerSub, { color: theme.dark ? 'rgba(245,158,11,0.6)' : colors.gray[500] }]}>DỊCH VỤ</Text>
          <Text style={[ls.headerTitle, { color: textColor }]}>Lịch Âm</Text>
        </View>

        <TouchableOpacity style={ls.todayBtn} onPress={goToday}>
          <LinearGradient colors={['#F59E0B','#D97706']} style={ls.todayBtnInner}>
            <Ionicons name="today" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Today Banner ── */}
      <View style={ls.todayBanner}>
        <LinearGradient
          colors={theme.dark ? ['rgba(245,158,11,0.2)','rgba(217,119,6,0.08)'] : ['rgba(245,158,11,0.12)','rgba(245,158,11,0.04)']}
          style={[ls.todayBannerInner, { borderColor: 'rgba(245,158,11,0.25)' }]}>
          <View style={ls.todayLeft}>
            <Text style={ls.todayLunar}>{formatLunarDate(todayLunar, true)}</Text>
            <Text style={[ls.todaySolar, { color: mutedColor }]}>
              {weekdayName(today)} · {String(today.getDate()).padStart(2,'0')}/{String(today.getMonth()+1).padStart(2,'0')}/{today.getFullYear()}
            </Text>
          </View>
          <View style={ls.todayRight}>
            <Text style={ls.todayYear}>Năm {CAN_CHI_YEAR[today.getFullYear()] ?? today.getFullYear()}</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ls.scroll}>
        {/* ── Month Navigator ── */}
        <View style={ls.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={ls.navArrow}>
            <Ionicons name="chevron-back" size={22} color={textColor} />
          </TouchableOpacity>
          <Text style={[ls.monthTitle, { color: textColor }]}>
            {MONTHS_VI[viewMonth - 1]} {viewYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={ls.navArrow}>
            <Ionicons name="chevron-forward" size={22} color={textColor} />
          </TouchableOpacity>
        </View>

        {/* ── Calendar Grid ── */}
        <View style={[ls.calendarCard, {
          backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : colors.white,
          borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        }]}>
          <MonthGrid
            year={viewYear}
            month={viewMonth}
            today={currentDay}
            selected={selected}
            onSelect={setSelected}
            theme={theme}
          />
        </View>

        {/* ── Selected Day Detail ── */}
        {selected && (
          <DetailCard date={selected} theme={theme} />
        )}

        {/* ── Legend ── */}
        <View style={ls.legend}>
          <View style={ls.legendItem}>
            <View style={[ls.legendDot, { backgroundColor: 'rgba(245,158,11,0.7)' }]} />
            <Text style={[ls.legendTxt, { color: mutedColor }]}>Hôm nay</Text>
          </View>
          <View style={ls.legendItem}>
            <View style={[ls.legendDot, { backgroundColor: '#6C63FF' }]} />
            <Text style={[ls.legendTxt, { color: mutedColor }]}>Đang chọn</Text>
          </View>
          <View style={ls.legendItem}>
            <Text style={{ color: '#EC4899', fontSize: 10 }}>★</Text>
            <Text style={[ls.legendTxt, { color: mutedColor }]}>Ngày lễ âm</Text>
          </View>
        </View>

        {/* ── Lunar Holidays ── */}
        <View style={ls2.holidaysSection}>
          <View style={ls2.sectionHeader}>
            <View style={ls2.sectionTitleRow}>
              <Ionicons name="ribbon" size={16} color="#EC4899" />
              <Text style={[ls2.sectionTitle, { color: textColor }]}>Ngày Lễ Âm Lịch {viewYear}</Text>
            </View>
          </View>
          {Object.entries(SPECIAL_DAYS).map(([month, days]) => {
            return Object.entries(days).map(([day, label]) => {
              const lunarDate = lunarToSolar(parseInt(day), parseInt(month), viewYear);
              if (!lunarDate) return null;
              const lunarObj = solarToLunar(lunarDate);
              const isToday =
                lunarDate.getDate() === today.getDate() &&
                lunarDate.getMonth() === today.getMonth() &&
                lunarDate.getFullYear() === today.getFullYear();
              const solarStr = `${String(lunarDate.getDate()).padStart(2,'0')}/${String(lunarDate.getMonth()+1).padStart(2,'0')}`;
              return (
                <View key={`${month}-${day}`} style={[ls2.holidayRow, {
                  backgroundColor: isToday
                    ? (theme.dark ? 'rgba(236,72,153,0.15)' : 'rgba(236,72,153,0.08)')
                    : (theme.dark ? 'rgba(255,255,255,0.04)' : colors.white),
                  borderColor: isToday
                    ? 'rgba(236,72,153,0.3)'
                    : (theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                }]}>
                  <View style={ls2.holidayLeft}>
                    <LinearGradient colors={HOLIDAY_COLORS[parseInt(month)] ?? ['#6C63FF','#8B5CF6']} style={ls2.holidayBadge}>
                      <Text style={ls2.holidayBadgeTxt}>{formatLunarDate(lunarObj)}</Text>
                    </LinearGradient>
                  </View>
                  <View style={ls2.holidayCenter}>
                    <Text style={[ls2.holidayLabel, { color: isToday ? '#EC4899' : textColor }]}>{label}</Text>
                    <Text style={[ls2.holidaySolar, { color: mutedColor }]}>
                      {weekdayName(lunarDate)} · {solarStr}/{lunarDate.getFullYear()}
                    </Text>
                  </View>
                  {isToday && (
                    <View style={ls2.todayBadge}>
                      <Text style={ls2.todayBadgeTxt}>Hôm nay</Text>
                    </View>
                  )}
                </View>
              );
            });
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

function weekdayName(d: Date): string {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return days[d.getDay()];
}

// Năm âm lịch (can chi)
const CAN_CHI_YEAR: { [y: number]: string } = {
  2020: 'Kỷ Hợi', 2021: 'Canh Tý', 2022: 'Tân Sửu', 2023: 'Nhâm Dần',
  2024: 'Quý Mão', 2025: 'Giáp Thìn', 2026: 'Ất Tỵ', 2027: 'Bính Ngọ',
  2028: 'Đinh Mùi', 2029: 'Mậu Thân', 2030: 'Kỷ Dậu', 2031: 'Canh Tuất',
  2032: 'Tân Hợi', 2033: 'Nhâm Tý', 2034: 'Quý Sửu', 2035: 'Giáp Dần',
  2036: 'Ất Mão', 2037: 'Bính Thìn', 2038: 'Đinh Tỵ', 2039: 'Mậu Ngọ',
  2040: 'Kỷ Mùi', 2041: 'Canh Thân', 2042: 'Tân Dậu', 2043: 'Nhâm Tuất',
  2044: 'Quý Hợi', 2045: 'Giáp Tý', 2046: 'Ất Sửu', 2047: 'Bính Dần',
  2048: 'Đinh Mão', 2049: 'Mậu Thìn', 2050: 'Kỷ Tỵ',
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const ls = StyleSheet.create({
  root    : { flex: 1 },
  orb     : { position: 'absolute', borderRadius: 999, opacity: 0.08 },
  header  : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backBtn : { borderRadius: 12, overflow: 'hidden' },
  backCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' },
  headerCenter: { alignItems: 'center' },
  headerSub: { fontSize: 9, fontWeight: '800', letterSpacing: 2.5 },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  todayBtn : { borderRadius: 12, overflow: 'hidden' },
  todayBtnInner: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  todayBanner: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  todayBannerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 16, borderWidth: 1, padding: 14 },
  todayLeft  : { flex: 1 },
  todayLunar : { fontSize: 14, fontWeight: '800', color: '#F59E0B', marginBottom: 3 },
  todaySolar : { fontSize: 11, fontWeight: '500' },
  todayRight : {},
  todayYear  : { fontSize: 11, fontWeight: '700', color: 'rgba(245,158,11,0.6)', textAlign: 'right' },
  scroll     : { paddingHorizontal: spacing.lg },
  monthNav   : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.md },
  navArrow   : { padding: 8, borderRadius: 12 },
  monthTitle : { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  calendarCard: { borderRadius: 20, borderWidth: 1, padding: 14, marginBottom: spacing.md },
  legend     : { flexDirection: 'row', gap: 16, justifyContent: 'center', paddingVertical: spacing.sm },
  legendItem : { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot : { width: 8, height: 8, borderRadius: 4 },
  legendTxt : { fontSize: 11, fontWeight: '600' },
});

const mg = StyleSheet.create({
  grid   : { flexDirection: 'row', flexWrap: 'wrap' },
  weekDay: { width: `${100/7}%`, alignItems: 'center', marginBottom: 8 },
  weekDayTxt: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cell   : { width: `${100/7}%`, alignItems: 'center', marginBottom: 4 },
});

const dc = StyleSheet.create({
  cell     : { width: `${100/7}%`, alignItems: 'center', paddingVertical: 6 },
  dayWrapper: { alignItems: 'center', justifyContent: 'center', width: 36, height: 36, overflow: 'hidden' },
  dayBg    : { position: 'absolute', width: 36, height: 36, borderRadius: 18 },
  dayNum   : { fontSize: 14, fontWeight: '700' },
  lunarNum : { fontSize: 9, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  lunarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 },
  lunarDot: { width: 5, height: 5, borderRadius: 3 },
  lunarBg : { position: 'absolute', width: 34, height: 34, borderRadius: 17 },
});

const dcard = StyleSheet.create({
  wrap    : { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: spacing.md },
  mainDate: { marginBottom: 10 },
  lunarFull: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  solarDate: { fontSize: 13, fontWeight: '500' },
  specialBadge: { flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(236,72,153,0.1)', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginTop: 6 },
  specialTxt: { fontSize: 12, fontWeight: '700', color: '#EC4899' },
});

const ls2 = StyleSheet.create({
  holidaysSection  : { marginTop: spacing.lg },
  sectionHeader   : { marginBottom: spacing.md },
  sectionTitleRow  : { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle    : { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  holidayRow      : {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 10,
  },
  holidayLeft     : { flexShrink: 0 },
  holidayBadge    : {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  holidayBadgeTxt : { fontSize: 10, fontWeight: '800', color: '#fff' },
  holidayCenter   : { flex: 1 },
  holidayLabel    : { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  holidaySolar    : { fontSize: 11, fontWeight: '500' },
  todayBadge      : {
    backgroundColor: '#EC4899', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  todayBadgeTxt   : { fontSize: 9, fontWeight: '800', color: '#fff' },
});

export default LichAmScreen;
