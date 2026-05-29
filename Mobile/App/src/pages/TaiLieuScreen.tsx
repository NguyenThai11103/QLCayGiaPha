/**
 * TaiLieuScreen – Tài liệu gia tộc
 * Glassmorphism premium UI · Kết nối API /tai-lieu/list
 * Hỗ trợ tìm kiếm, lọc, xem chi tiết tài liệu
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, Platform, Animated, ActivityIndicator,
  TextInput, RefreshControl, Linking, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../genaral/api';
import { STORAGE_TOKEN_KEY } from '../genaral/authService';
import { colors, spacing, fontSize, borderRadius, rs, rvs, rf } from '../config/theme';
import { useTheme } from '../context/ThemeContext';

// ─────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────
interface TaiLieu {
  id          : number;
  dong_ho_id  : number;
  tieu_de     : string;
  mo_ta       ?: string | null;
  loai        : string;   // 'van_ban', 'hinh_anh', 'video', 'khac'
  duong_dan   ?: string | null;
  created_at  : string;
}

type FilterType = 'tat_ca' | 'van_ban' | 'hinh_anh' | 'video' | 'khac';

// ─────────────────────────────────────────────────────────
//  Config loại tài liệu
// ─────────────────────────────────────────────────────────
const LOAI_CFG: Record<string, { label: string; icon: string; color: string; grad: string[] }> = {
  van_ban  : { label: 'Văn bản',   icon: 'document-text',  color: '#3B82F6', grad: ['#3B82F6','#2563EB'] },
  hinh_anh : { label: 'Hình ảnh',  icon: 'image',          color: '#10B981', grad: ['#10B981','#059669'] },
  video    : { label: 'Video',     icon: 'videocam',        color: '#F59E0B', grad: ['#F59E0B','#D97706'] },
  khac     : { label: 'Khác',      icon: 'folder',          color: '#A78BFA', grad: ['#A78BFA','#7C3AED'] },
};
const getCfg = (loai: string) => LOAI_CFG[loai] ?? LOAI_CFG.khac;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'tat_ca',   label: 'Tất cả'   },
  { key: 'van_ban',  label: 'Văn bản'  },
  { key: 'hinh_anh', label: 'Hình ảnh' },
  { key: 'video',    label: 'Video'    },
  { key: 'khac',     label: 'Khác'     },
];

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ─────────────────────────────────────────────────────────
//  Document Card
// ─────────────────────────────────────────────────────────
const DocCard: React.FC<{
  item  : TaiLieu;
  index : number;
  theme : ReturnType<typeof useTheme>['theme'];
}> = ({ item, index, theme }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const cfg  = getCfg(item.loai);

  const cardBg     = theme.dark ? 'rgba(255,255,255,0.05)' : colors.white;
  const textColor  = theme.dark ? '#fff' : colors.gray[800];
  const mutedColor = theme.dark ? 'rgba(255,255,255,0.4)' : colors.gray[500];
  const borderColor = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, tension: 60, friction: 12,
      delay: index * 60, useNativeDriver: true,
    }).start();
  }, []);

  const handleOpen = () => {
    if (item.duong_dan) {
      Linking.openURL(item.duong_dan).catch(() => {
        Alert.alert('Không thể mở', 'Đường dẫn tài liệu không hợp lệ hoặc không tồn tại.');
      });
    } else {
      Alert.alert('Chưa có đường dẫn', 'Tài liệu này chưa có file đính kèm.');
    }
  };

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    }}>
      <TouchableOpacity
        style={[dc.card, { backgroundColor: cardBg, borderColor }]}
        onPress={handleOpen}
        activeOpacity={0.85}
      >
        {/* Icon */}
        <LinearGradient colors={cfg.grad as any} style={dc.iconBox}>
          <Ionicons name={cfg.icon as any} size={24} color="#fff" />
        </LinearGradient>

        {/* Content */}
        <View style={dc.content}>
          <View style={dc.topRow}>
            <View style={[dc.badge, { backgroundColor: cfg.color + '18', borderColor: cfg.color + '40' }]}>
              <Text style={[dc.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            <Text style={[dc.date, { color: mutedColor }]}>{formatDate(item.created_at)}</Text>
          </View>
          <Text style={[dc.title, { color: textColor }]} numberOfLines={2}>{item.tieu_de}</Text>
          {item.mo_ta ? (
            <Text style={[dc.desc, { color: mutedColor }]} numberOfLines={2}>{item.mo_ta}</Text>
          ) : null}
        </View>

        {/* Arrow */}
        <Ionicons
          name={item.duong_dan ? 'open-outline' : 'lock-closed-outline'}
          size={18}
          color={item.duong_dan ? cfg.color : mutedColor}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────
//  Main Screen
// ─────────────────────────────────────────────────────────
const TaiLieuScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const [docs,       setDocs]       = useState<TaiLieu[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [filter,     setFilter]     = useState<FilterType>('tat_ca');
  const [search,     setSearch]     = useState('');
  const [searchFocus,setSearchFocus]= useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const bgColor     = theme.dark ? '#070712' : '#F5F7FA';
  const textColor   = theme.dark ? '#fff' : colors.gray[800];
  const mutedColor  = theme.dark ? 'rgba(255,255,255,0.4)' : colors.gray[500];
  const inputBg     = theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const inputBorder = theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const tabBorder   = theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1, tension: 50, friction: 10, useNativeDriver: true,
    }).start();
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
      const res = await apiFetch<{ data: TaiLieu[] }>('/tai-lieu/list', {}, token ?? undefined);
      setDocs(res.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Không thể tải tài liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = docs.filter(d => {
    const matchFilter = filter === 'tat_ca' || d.loai === filter;
    const matchSearch = !search || d.tieu_de.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <View style={[s.root, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        translucent backgroundColor="transparent"
      />
      <LinearGradient
        colors={theme.dark ? ['#070712','#110A26','#070712'] : ['#F5F7FA','#EEF2FF','#F5F7FA']}
        style={StyleSheet.absoluteFill}
      />
      {theme.dark && (
        <>
          <View style={[s.orb, { top: -80, right: -60, backgroundColor: '#3B82F6' }]} />
          <View style={[s.orb, { bottom: 80, left: -80, backgroundColor: '#7C3AED', width: rs(200), height: rs(200) }]} />
        </>
      )}

      {/* ── Header ── */}
      <Animated.View style={[s.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-20,0] }) }],
      }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <LinearGradient
            colors={theme.dark ? ['rgba(59,130,246,0.15)','rgba(37,99,235,0.08)'] : ['rgba(108,99,255,0.1)','rgba(108,99,255,0.05)']}
            style={s.backCircle}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={[s.headerSub, { color: theme.dark ? 'rgba(167,139,250,0.6)' : colors.gray[500] }]}>GIA TỘC</Text>
          <Text style={[s.headerTitle, { color: textColor }]}>Tài Liệu</Text>
        </View>

        <View style={{ width: rs(40) }} />
      </Animated.View>

      {/* ── Search Bar ── */}
      <View style={[s.searchWrap, {
        backgroundColor: inputBg,
        borderColor: searchFocus ? '#3B82F6' : inputBorder,
      }]}>
        <Ionicons name="search-outline" size={18} color={searchFocus ? '#3B82F6' : mutedColor} />
        <TextInput
          style={[s.searchInput, { color: textColor }]}
          placeholder="Tìm kiếm tài liệu..."
          placeholderTextColor={mutedColor}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={mutedColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter Tabs ── */}
      <View style={s.filterRow}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={f => f.key}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: rs(8) }}
          renderItem={({ item: f }) => {
            const active = filter === f.key;
            const cfg = LOAI_CFG[f.key];
            return (
              <TouchableOpacity
                style={[s.pill, {
                  borderColor: active ? (cfg?.color ?? '#A78BFA') + 'AA' : tabBorder,
                  overflow: 'hidden',
                }]}
                onPress={() => setFilter(f.key)}
              >
                {active && cfg && (
                  <LinearGradient colors={cfg.grad as any} style={StyleSheet.absoluteFill} />
                )}
                {active && !cfg && (
                  <LinearGradient colors={['#A78BFA','#7C3AED']} style={StyleSheet.absoluteFill} />
                )}
                <Text style={[s.pillTxt, { color: active ? '#fff' : mutedColor }]}>{f.label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Count */}
      {!loading && !error && (
        <Text style={[s.count, { color: mutedColor }]}>
          {filtered.length} tài liệu
        </Text>
      )}

      {/* ── Content ── */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={[s.stateTxt, { color: mutedColor }]}>Đang tải tài liệu...</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={52} color="rgba(239,68,68,0.5)" />
          <Text style={[s.stateTxt, { color: mutedColor }]}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load()}>
            <Ionicons name="refresh" size={16} color="#3B82F6" />
            <Text style={{ color: '#3B82F6', fontWeight: '700', fontSize: rf(14) }}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#3B82F6"
              colors={['#3B82F6']}
            />
          }
          ListEmptyComponent={
            <View style={s.center}>
              <LinearGradient
                colors={['rgba(59,130,246,0.15)','rgba(37,99,235,0.05)']}
                style={s.emptyIcon}>
                <Ionicons name="documents-outline" size={36} color="#3B82F6" />
              </LinearGradient>
              <Text style={[s.stateTxt, { color: textColor, fontWeight: '700' }]}>
                {search ? 'Không tìm thấy tài liệu' : 'Chưa có tài liệu nào'}
              </Text>
              <Text style={[s.stateSubTxt, { color: mutedColor }]}>
                {search ? 'Thử từ khóa khác nhé' : 'Tài liệu gia tộc sẽ được đăng tải tại đây'}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <DocCard item={item} index={index} theme={theme} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: rs(10) }} />}
          ListFooterComponent={<View style={{ height: rvs(100) }} />}
        />
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root       : { flex: 1 },
  orb        : { position: 'absolute', width: rs(260), height: rs(260), borderRadius: rs(130), opacity: 0.09 },
  header     : {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? rvs(60) : rvs(48),
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  backBtn    : { borderRadius: rs(12), overflow: 'hidden' },
  backCircle : {
    width: rs(40), height: rs(40), borderRadius: rs(12),
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
  },
  headerCenter: { alignItems: 'center' },
  headerSub   : { fontSize: rf(9), fontWeight: '800', letterSpacing: 2.5 },
  headerTitle : { fontSize: rf(20), fontWeight: '900', letterSpacing: -0.5 },
  searchWrap  : {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: rvs(10),
    borderRadius: borderRadius.xl, borderWidth: 1.5, gap: rs(8),
  },
  searchInput : {
    flex: 1, fontSize: rf(14), fontWeight: '500', padding: 0,
  },
  filterRow   : { marginBottom: spacing.sm },
  pill        : {
    height: rs(32), paddingHorizontal: rs(14),
    borderRadius: borderRadius.full, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center', alignItems: 'center',
  },
  pillTxt     : { fontSize: rf(12), fontWeight: '700' },
  count       : {
    fontSize: rf(11), fontWeight: '600',
    paddingHorizontal: spacing.lg, marginBottom: spacing.sm,
  },
  list        : { paddingHorizontal: spacing.lg },
  center      : { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, minHeight: rvs(200) },
  stateTxt    : { fontSize: rf(15), fontWeight: '600', textAlign: 'center' },
  stateSubTxt : { fontSize: rf(13), textAlign: 'center', paddingHorizontal: rs(40) },
  emptyIcon   : {
    width: rs(80), height: rs(80), borderRadius: rs(24),
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
  },
  retryBtn    : {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
  },
});

const dc = StyleSheet.create({
  card    : {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: borderRadius.xl, borderWidth: 1,
    padding: spacing.md, gap: spacing.md,
  },
  iconBox : {
    width: rs(48), height: rs(48), borderRadius: rs(14),
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  content : { flex: 1 },
  topRow  : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(4) },
  badge   : {
    paddingHorizontal: rs(8), paddingVertical: rs(2),
    borderRadius: borderRadius.full, borderWidth: 1,
  },
  badgeTxt: { fontSize: rf(9), fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  date    : { fontSize: rf(10), fontWeight: '500' },
  title   : { fontSize: rf(14), fontWeight: '700', marginBottom: rs(2) },
  desc    : { fontSize: rf(12), lineHeight: rf(17) },
});

export default TaiLieuScreen;
