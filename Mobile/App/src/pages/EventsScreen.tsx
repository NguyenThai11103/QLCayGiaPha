/**
 * EventsScreen – Sự kiện gia tộc
 * Features: Sắp tới / Đã qua tabs, countdown, category filter, pull-to-refresh
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, Platform, Animated, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../genaral/api';
import { STORAGE_TOKEN_KEY } from '../genaral/authService';
import { colors, borderRadius, fontSize, spacing, rs, rvs, rf } from '../config/theme';
import { useTheme } from '../context/ThemeContext';

interface SuKien {
  id              : number;
  dong_ho_id      : number;
  ten_su_kien     : string;
  loai_su_kien    : string;
  ngay_duong      : string;
  ngay_am         ?: string | null;
  lap_lai_hang_nam: number;
  dia_diem        ?: string | null;
  mo_ta           ?: string | null;
  created_at      : string;
  tham_gia        ?: boolean;  // Trạng thái tham gia của user hiện tại
}

/* Loại sự kiện config */
const LOAI_CFG: Record<string, { label: string; icon: string; color: string; grad: string[] }> = {
  le_gio    : { label: 'Giỗ tổ',    icon: 'flame',    color: '#EF4444', grad: ['#EF4444','#DC2626'] },
  gio_to    : { label: 'Giỗ tổ',    icon: 'flame',    color: '#EF4444', grad: ['#EF4444','#DC2626'] },
  tet       : { label: 'Lễ tết',    icon: 'star',     color: '#F59E0B', grad: ['#F59E0B','#D97706'] },
  le_tet    : { label: 'Lễ tết',    icon: 'star',     color: '#F59E0B', grad: ['#F59E0B','#D97706'] },
  hop_mat   : { label: 'Họp mặt',   icon: 'people',   color: '#10B981', grad: ['#10B981','#059669'] },
  sinh_nhat : { label: 'Sinh nhật', icon: 'gift',     color: '#EC4899', grad: ['#EC4899','#DB2777'] },
  other     : { label: 'Khác',      icon: 'calendar', color: '#6C63FF', grad: ['#6C63FF','#4F46E5'] },
};
const getCfg = (loai: string) => LOAI_CFG[loai] ?? LOAI_CFG.other;

/* Countdown tính khoảng cách đến ngày sự kiện */
const countdown = (dateStr: string): string => {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) return 'Đã qua';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  if (d > 365) return `${Math.floor(d / 365)} năm nữa`;
  if (d > 0)   return `${d} ngày nữa`;
  if (h > 0)   return `${h} giờ nữa`;
  return 'Hôm nay!';
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });

const isPast = (dateStr: string) => new Date(dateStr) < new Date();

/* ─── Event Card ─── */
const EventCard: React.FC<{
  item           : SuKien;
  idx            : number;
  theme          : ReturnType<typeof useTheme>['theme'];
  onToggleAttend : (id: number, attending: boolean) => void;
  loadingId      : number | null;
}> = ({ item, idx, theme, onToggleAttend, loadingId }) => {
  const a   = useRef(new Animated.Value(0)).current;
  const cfg = getCfg(item.loai_su_kien);
  const past = isPast(item.ngay_duong);
  const cd   = countdown(item.ngay_duong);
  const isAttending = item.tham_gia ?? false;
  const isThisLoading = loadingId === item.id;

  const cardBg = theme.dark ? 'rgba(255,255,255,0.05)' : colors.white;
  const textColor = theme.dark ? '#fff' : colors.gray[800];
  const mutedColor = theme.dark ? 'rgba(255,255,255,0.35)' : colors.gray[500];
  const cardBorder = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    Animated.spring(a, { toValue: 1, tension: 60, friction: 12, delay: idx * 60, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0,1], outputRange: [24,0] }) }] }}>
      <TouchableOpacity style={[ec.card, past && ec.cardPast, { backgroundColor: cardBg, borderColor: cardBorder }]} activeOpacity={0.85}>
        {/* Left accent bar */}
        <LinearGradient colors={cfg.grad as any} style={ec.bar} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />

        {/* Icon */}
        <LinearGradient colors={past ? ['rgba(100,100,100,0.2)','rgba(100,100,100,0.1)'] : cfg.grad as any} style={ec.iconBox}>
          <Ionicons name={cfg.icon as any} size={22} color={past ? mutedColor : '#fff'} />
        </LinearGradient>

        {/* Info */}
        <View style={ec.info}>
          <View style={ec.headerRow}>
            <View style={[ec.typeBadge, { borderColor: cfg.color + '40', backgroundColor: cfg.color + '15' }]}>
              <Text style={[ec.typeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            <Text style={[ec.cdText, past ? ec.cdPast : cd === 'Hôm nay!' ? ec.cdToday : ec.cdFuture]}>{cd}</Text>
          </View>
          <Text style={[ec.title, past && ec.titlePast, { color: textColor }]} numberOfLines={2}>{item.ten_su_kien}</Text>
          <View style={ec.metaRow}>
            <Ionicons name="calendar-outline" size={12} color={mutedColor} />
            <Text style={[ec.metaText, { color: mutedColor }]}>{formatDate(item.ngay_duong)}</Text>
            {item.dia_diem ? (
              <>
                <Ionicons name="location-outline" size={12} color={mutedColor} />
                <Text style={[ec.metaText, { color: mutedColor }]} numberOfLines={1}>{item.dia_diem}</Text>
              </>
            ) : null}
          </View>
          {item.mo_ta ? <Text style={[ec.desc, { color: mutedColor }]} numberOfLines={2}>{item.mo_ta}</Text> : null}

          {/* Attend / Leave Button — chỉ hiện với sự kiện sắp tới */}
          {!past && (
            <TouchableOpacity
              style={[
                ec.attendBtn,
                isAttending
                  ? { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.35)' }
                  : { backgroundColor: cfg.color + '18', borderColor: cfg.color + '50' },
              ]}
              onPress={() => onToggleAttend(item.id, isAttending)}
              activeOpacity={0.8}
              disabled={isThisLoading}
            >
              {isThisLoading ? (
                <ActivityIndicator size="small" color={isAttending ? '#EF4444' : cfg.color} />
              ) : (
                <>
                  <Ionicons
                    name={isAttending ? 'exit-outline' : 'checkmark-circle-outline'}
                    size={14}
                    color={isAttending ? '#EF4444' : cfg.color}
                  />
                  <Text style={[ec.attendTxt, { color: isAttending ? '#EF4444' : cfg.color }]}>
                    {isAttending ? 'Rút lui' : 'Tham gia'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ─── Main Screen ─── */
const EventsScreen: React.FC<{ navigation: any }> = () => {
  const { theme } = useTheme();
  const [events,     setEvents]     = useState<SuKien[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [tab,        setTab]        = useState<'upcoming' | 'past'>('upcoming');
  const [loaiFilter, setLoaiFilter] = useState<string>('Tất cả');
  const [attendLoadingId, setAttendLoadingId] = useState<number | null>(null);
  const tabAnim = useRef(new Animated.Value(0)).current;

  // Dùng Set để deduplicate label (vd: le_gio và gio_to cùng label 'Giỗ tổ')
  const loaiOptions = ['Tất cả', ...Array.from(new Set(Object.values(LOAI_CFG).map(c => c.label)))];

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
      const res = await apiFetch<{ data: SuKien[] }>('/su-kien/list', {}, token ?? undefined);
      setEvents(res.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Lỗi kết nối');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  // Toggle tham gia / rút lui sự kiện
  const handleToggleAttend = useCallback(async (id: number, isAttending: boolean) => {
    setAttendLoadingId(id);
    try {
      const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
      const endpoint = isAttending ? '/su-kien/leave' : '/su-kien/attend';
      await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ su_kien_id: id }),
      }, token ?? undefined);
      // Cập nhật state optimistic
      setEvents(prev => prev.map(e =>
        e.id === id ? { ...e, tham_gia: !isAttending } : e
      ));
    } catch (e: any) {
      Alert.alert(
        'Không thể thực hiện',
        e?.message ?? 'Đã có lỗi xảy ra, vui lòng thử lại.',
        [{ text: 'Đóng' }]
      );
    } finally {
      setAttendLoadingId(null);
    }
  }, []);

  const switchTab = (t: 'upcoming' | 'past') => {
    setTab(t);
    Animated.spring(tabAnim, { toValue: t === 'upcoming' ? 0 : 1, tension: 200, friction: 20, useNativeDriver: false }).start();
  };

  const filtered = events.filter(e => {
    const matchTab  = tab === 'upcoming' ? !isPast(e.ngay_duong) : isPast(e.ngay_duong);
    const matchLoai = loaiFilter === 'Tất cả' || getCfg(e.loai_su_kien).label === loaiFilter;
    return matchTab && matchLoai;
  }).sort((a, b) => {
    const da = new Date(a.ngay_duong).getTime();
    const db = new Date(b.ngay_duong).getTime();
    return tab === 'upcoming' ? da - db : db - da;
  });

  const upcoming = events.filter(e => !isPast(e.ngay_duong)).length;
  const past     = events.filter(e =>  isPast(e.ngay_duong)).length;

  const slideX = tabAnim.interpolate({ inputRange: [0,1], outputRange: ['0%','50%'] });

  // Dynamic colors
  const bgColor = theme.dark ? '#070712' : '#F5F7FA';
  const cardBg = theme.dark ? 'rgba(255,255,255,0.05)' : colors.white;
  const textColor = theme.dark ? '#fff' : colors.gray[800];
  const mutedColor = theme.dark ? 'rgba(255,255,255,0.35)' : colors.gray[500];
  const cardBorder = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const tabBg = theme.dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)';
  const tabBorderColor = theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  return (
    <View style={[es.root, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={theme.dark ? ['#070712','#1A0018','#070712'] : ['#F5F7FA','#EEF2FF','#F5F7FA']}
        style={StyleSheet.absoluteFill}
      />
      {theme.dark && (
        <>
          <View style={[es.glow, { top: -60, right: -60, backgroundColor: '#EC4899' }]} />
          <View style={[es.glow, { bottom: 80, left: -80, backgroundColor: '#6C63FF', width: 200, height: 200 }]} />
        </>
      )}

      {/* Header */}
      <View style={es.header}>
        <View>
          <Text style={[es.sub, { color: mutedColor }]}>Gia tộc</Text>
          <Text style={[es.title, { color: textColor }]}>Sự Kiện</Text>
        </View>
        <View style={es.stats}>
          <View style={es.statItem}>
            <Text style={[es.statNum, { color: '#EC4899' }]}>{upcoming}</Text>
            <Text style={[es.statLabel, { color: mutedColor }]}>Sắp tới</Text>
          </View>
          <View style={[es.divider, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : colors.gray[300] }]} />
          <View style={es.statItem}>
            <Text style={[es.statNum, { color: mutedColor }]}>{past}</Text>
            <Text style={[es.statLabel, { color: mutedColor }]}>Đã qua</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={es.tabWrap}>
        <View style={[es.tabTrack, { backgroundColor: tabBg, borderColor: tabBorderColor }]}>
          <Animated.View style={[es.tabSlider, { left: slideX }]}>
            <LinearGradient colors={['#EC4899','#DB2777']} style={StyleSheet.absoluteFill} />
          </Animated.View>
          <TouchableOpacity style={es.tab} onPress={() => switchTab('upcoming')}>
            <Ionicons name="time" size={14} color={tab === 'upcoming' ? '#fff' : mutedColor} />
            <Text style={[es.tabTxt, tab === 'upcoming' && es.tabTxtOn, { color: tab === 'upcoming' ? '#fff' : mutedColor }]}>Sắp tới ({upcoming})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={es.tab} onPress={() => switchTab('past')}>
            <Ionicons name="checkmark-circle" size={14} color={tab === 'past' ? '#fff' : mutedColor} />
            <Text style={[es.tabTxt, tab === 'past' && es.tabTxtOn, { color: tab === 'past' ? '#fff' : mutedColor }]}>Đã qua ({past})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category filter */}
      <View style={es.filterScroll}>
        <FlatList
          data={loaiOptions} horizontal showsHorizontalScrollIndicator={false}
          keyExtractor={i => i} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8 }}
          renderItem={({ item }) => {
            const active = loaiFilter === item;
            const cfg = Object.values(LOAI_CFG).find(c => c.label === item);
            return (
              <TouchableOpacity
                style={[es.pill, active && { borderColor: cfg?.color ?? '#EC4899' }, { borderColor: active ? (cfg?.color ?? '#EC4899') : tabBorderColor }]}
                onPress={() => setLoaiFilter(item)}>
                {active && cfg && <LinearGradient colors={cfg.grad as any} style={StyleSheet.absoluteFill} />}
                <Text style={[es.pillTxt, active && { color: '#fff' }, { color: active ? '#fff' : mutedColor }]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Content */}
      {loading ? (
        <View style={es.center}><ActivityIndicator size="large" color="#EC4899" /><Text style={[es.stateTxt, { color: mutedColor }]}>Đang tải sự kiện...</Text></View>
      ) : error ? (
        <View style={es.center}>
          <Ionicons name="cloud-offline-outline" size={52} color="rgba(239,68,68,0.6)" />
          <Text style={[es.stateTxt, { color: mutedColor }]}>{error}</Text>
          <TouchableOpacity style={es.retryBtn} onPress={() => load()}>
            <Ionicons name="refresh" size={16} color="#EC4899" />
            <Text style={{ color: '#EC4899', fontWeight: '600', fontSize: fontSize.sm }}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered} keyExtractor={i => String(i.id)}
          contentContainerStyle={es.list} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#EC4899" colors={['#EC4899']} />}
          ListEmptyComponent={
            <View style={es.center}>
              <Ionicons name="calendar-outline" size={52} color={mutedColor} />
              <Text style={[es.stateTxt, { color: mutedColor }]}>{tab === 'upcoming' ? 'Không có sự kiện sắp tới' : 'Không có sự kiện đã qua'}</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <EventCard
              item={item}
              idx={index}
              theme={theme}
              onToggleAttend={handleToggleAttend}
              loadingId={attendLoadingId}
            />
          )}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}
    </View>
  );
};

const es = StyleSheet.create({
  root      : { flex: 1, backgroundColor: '#070712' },
  glow      : { position: 'absolute', width: 260, height: 260, borderRadius: 130, opacity: 0.09 },
  header    : { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sub       : { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.35)', fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
  title     : { fontSize: fontSize.xxxl, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  stats     : { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  statItem  : { alignItems: 'center' },
  statNum   : { fontSize: fontSize.xl, fontWeight: '800' },
  statLabel : { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
  divider   : { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' },
  tabWrap   : { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  tabTrack  : { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: borderRadius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', height: 44, position: 'relative' },
  tabSlider : { position: 'absolute', width: '50%', height: '100%', borderRadius: borderRadius.xl, overflow: 'hidden' },
  tab       : { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  tabTxt    : { fontSize: fontSize.xs, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  tabTxtOn  : { color: '#fff' },
  filterScroll: { marginBottom: spacing.md },
  pill      : { height: 32, paddingHorizontal: 14, borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  pillTxt   : { fontSize: fontSize.xs, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  list      : { paddingHorizontal: spacing.lg, gap: spacing.md },
  center    : { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, minHeight: 200 },
  stateTxt  : { fontSize: fontSize.md, color: 'rgba(255,255,255,0.35)' },
  retryBtn  : { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: 'rgba(236,72,153,0.12)', borderWidth: 1, borderColor: 'rgba(236,72,153,0.3)' },
});
const ec = StyleSheet.create({
  card      : { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', padding: spacing.md },
  cardPast  : { opacity: 0.55 },
  bar       : { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  iconBox   : { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  info      : { flex: 1 },
  headerRow : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  typeBadge : { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full, borderWidth: 1 },
  typeText  : { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  cdText    : { fontSize: fontSize.xs, fontWeight: '700' },
  cdFuture  : { color: '#10B981' },
  cdToday   : { color: '#F59E0B' },
  cdPast    : { color: 'rgba(255,255,255,0.25)' },
  title     : { fontSize: fontSize.md, fontWeight: '700', color: '#fff', marginBottom: 6, lineHeight: 22 },
  titlePast : { color: 'rgba(255,255,255,0.5)' },
  metaRow   : { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  metaText  : { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
  desc      : { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.35)', marginTop: 6, lineHeight: 18 },
  attendBtn : {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: rs(5), marginTop: rs(10), paddingVertical: rs(7), paddingHorizontal: rs(14),
    borderRadius: borderRadius.full, borderWidth: 1, alignSelf: 'flex-start',
  },
  attendTxt : { fontSize: rf(12), fontWeight: '700' },
});

export default EventsScreen;
