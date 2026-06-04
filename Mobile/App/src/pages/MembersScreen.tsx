import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, StatusBar, Platform, Animated, RefreshControl,
  Modal, ScrollView, ActivityIndicator, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../genaral/api';
import { STORAGE_TOKEN_KEY } from '../genaral/authService';
import { colors, borderRadius, fontSize, spacing } from '../config/theme';
import { useTheme } from '../context/ThemeContext';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - spacing.lg * 2 - spacing.sm) / 2;

export interface ThanhVien {
  id           : number;
  ten_day_du   : string;
  id_dong_ho   : number;
  gioi_tinh    ?: string | null;
  ngay_sinh    ?: string | null;
  ngay_mat     ?: string | null;
  da_mat       ?: boolean;
  id_cha       ?: number | null;
  id_me        ?: number | null;
  vo_chong_ids ?: number[];
  tieu_su      ?: string | null;
}

// Palette gradient theo index
const PALETTES = [
  ['#667EEA','#764BA2'], ['#F093FB','#F5576C'], ['#4FACFE','#00F2FE'],
  ['#43E97B','#38F9D7'], ['#FA709A','#FEE140'], ['#A18CD1','#FBC2EB'],
  ['#FCC25E','#FC9700'], ['#89F7FE','#66A6FF'],
];
const pal = (id: number) => PALETTES[id % PALETTES.length] as [string, string];

const calcAge = (dob?: string | null): string => {
  if (!dob) return '—';
  const y = new Date().getFullYear() - new Date(dob).getFullYear();
  return `${y} tuổi`;
};

// ─── Detail Modal ─────────────────────────────────────────
const DetailModal: React.FC<{ m: ThanhVien | null; onClose: () => void }> = ({ m, onClose }) => {
  const slide = useRef(new Animated.Value(700)).current;
  useEffect(() => {
    if (m) Animated.spring(slide, { toValue: 0, tension: 70, friction: 11, useNativeDriver: true }).start();
    else slide.setValue(700);
  }, [m]);
  if (!m) return null;

  const initial = (m.ten_day_du ?? '').split(' ').pop()?.[0]?.toUpperCase() ?? '?';
  const [c1, c2] = pal(m.id);
  const isMale   = m.gioi_tinh === 'nam';
  const rows = [
    { icon: 'person-outline',         label: 'Giới tính', value: isMale ? '♂ Nam' : m.gioi_tinh === 'nu' ? '♀ Nữ' : 'Chưa rõ' },
    { icon: 'calendar-outline',       label: 'Năm sinh',  value: m.ngay_sinh ? new Date(m.ngay_sinh).getFullYear().toString() : '—' },
    { icon: 'hourglass-outline',      label: 'Tuổi',      value: m.da_mat ? 'Đã mất' : calcAge(m.ngay_sinh) },
    { icon: 'heart-dislike-outline',  label: 'Ngày mất',  value: m.ngay_mat ?? (m.da_mat ? 'Đã mất' : 'Còn sống') },
    { icon: 'reader-outline',         label: 'Tiểu sử',   value: m.tieu_su ?? 'Chưa có thông tin' },
  ];

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={dm.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[dm.sheet, { transform: [{ translateY: slide }] }]}>
          {/* Header banner */}
          <LinearGradient colors={[c1, c2]} style={dm.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={dm.handle} />
            <View style={dm.avatarCircle}>
              <Text style={dm.avatarTxt}>{initial}</Text>
            </View>
            {m.da_mat && (
              <View style={dm.deceasedBadge}>
                <Text style={dm.deceasedTxt}>✝ Đã mất</Text>
              </View>
            )}
          </LinearGradient>

          <View style={dm.body}>
            <Text style={dm.name}>{m.ten_day_du}</Text>
            <Text style={dm.genderLine}>{isMale ? '♂ Nam' : m.gioi_tinh === 'nu' ? '♀ Nữ' : ''} {calcAge(m.ngay_sinh)}</Text>

            <View style={dm.divider} />

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 260 }}>
              {rows.map((r, i) => (
                <View key={i} style={[dm.row, i > 0 && dm.rowTop]}>
                  <LinearGradient colors={[c1 + '40', c2 + '25']} style={dm.rowIcon}>
                    <Ionicons name={r.icon as any} size={15} color={c1} />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={dm.rowLabel}>{r.label}</Text>
                    <Text style={dm.rowValue} numberOfLines={3}>{r.value}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={[dm.closeBtn, { shadowColor: c1 }]} onPress={onClose}>
              <LinearGradient colors={[c1, c2]} style={dm.closeBtnGrad}>
                <Ionicons name="close-circle-outline" size={18} color="#fff" />
                <Text style={dm.closeBtnTxt}>Đóng</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─── Member Card (Grid) ───────────────────────────────────
const MemberCard: React.FC<{ item: ThanhVien; idx: number; onPress: () => void; theme: ReturnType<typeof useTheme>['theme'] }> = ({ item, idx, onPress, theme }) => {
  const anim  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [c1, c2] = pal(item.id);
  const initial = (item.ten_day_du ?? '').split(' ').pop()?.[0]?.toUpperCase() ?? '?';
  const firstName = item.ten_day_du.split(' ').pop() ?? item.ten_day_du;
  const isMale = item.gioi_tinh === 'nam';

  const cardBg = theme.dark ? 'rgba(255,255,255,0.05)' : colors.white;
  const textColor = theme.dark ? '#fff' : colors.gray[800];
  const mutedColor = theme.dark ? 'rgba(255,255,255,0.35)' : colors.gray[400];
  const cardBorder = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, tension: 60, friction: 12,
      delay: (idx % 6) * 70, useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, tension: 200, friction: 10 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 10 }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{
      opacity   : anim,
      transform : [
        { scale },
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
      ],
      width: CARD_W,
    }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={1}>
        <View style={[mc.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {/* Glow bg */}
          <View style={[mc.glowBg, { backgroundColor: c1 }]} />

          {/* Gender stripe */}
          <LinearGradient colors={[c1, c2]} style={mc.stripe} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

          {/* Avatar */}
          <View style={mc.avatarWrap}>
            <LinearGradient colors={[c1, c2]} style={mc.avatar}>
              <Text style={mc.avatarTxt}>{initial}</Text>
            </LinearGradient>
            {/* Gender dot */}
            <View style={[mc.genderDot, { backgroundColor: isMale ? '#60A5FA' : '#F472B6' }]}>
              <Text style={mc.genderDotTxt}>{isMale ? '♂' : '♀'}</Text>
            </View>
          </View>

          <Text style={[mc.firstName, { color: textColor }]} numberOfLines={1}>{firstName}</Text>
          <Text style={[mc.fullName, { color: mutedColor }]} numberOfLines={2}>{item.ten_day_du}</Text>
          <Text style={[mc.age, { color: mutedColor }]}>{item.da_mat ? '✝ Đã mất' : calcAge(item.ngay_sinh)}</Text>

          {/* Bottom bar */}
          <LinearGradient colors={[c1 + '20', c2 + '10']} style={mc.bottomBar}>
            <Ionicons name="eye-outline" size={12} color={c1} />
            <Text style={[mc.viewTxt, { color: c1 }]}>Xem chi tiết</Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────
const MembersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const [members,    setMembers]    = useState<ThanhVien[]>([]);
  const [filtered,   setFiltered]   = useState<ThanhVien[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [is401,      setIs401]      = useState(false);
  const [search,     setSearch]     = useState('');
  const [selected,   setSelected]   = useState<ThanhVien | null>(null);
  const [genderTab,  setGenderTab]  = useState<'all' | 'nam' | 'nu'>('all');
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, tension: 50, friction: 10, useNativeDriver: true }).start();
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null); setIs401(false);
    try {
      const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
      const res = await apiFetch<{ data: ThanhVien[] }>('/nguoi/list', {}, token ?? undefined);
      setMembers(res.data ?? []);
    } catch (e: any) {
      if (e?.status === 401 || e?.isUnauthorized) {
        setIs401(true);
        setError('Phiên đăng nhập đã hết hạn');
      } else {
        setError(e?.message ?? 'Lỗi kết nối');
      }
    }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let list = members;
    if (genderTab !== 'all') list = list.filter(m => m.gioi_tinh === genderTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m => (m.ten_day_du ?? '').toLowerCase().includes(q));
    }
    setFiltered(list);
  }, [members, genderTab, search]);

  const male   = members.filter(m => m.gioi_tinh === 'nam').length;
  const female = members.filter(m => m.gioi_tinh === 'nu').length;
  const dead   = members.filter(m => m.da_mat).length;

  // Render 2 items per row
  const renderRow = ({ item, index }: { item: ThanhVien[]; index: number }) => (
    <View style={s.row}>
      {item.map((m, i) => (
        <MemberCard key={m.id} item={m} idx={index * 2 + i} onPress={() => setSelected(m)} theme={theme} />
      ))}
      {item.length === 1 && <View style={{ width: CARD_W }} />}
    </View>
  );

  // Pair into rows of 2
  const rows: ThanhVien[][] = [];
  for (let i = 0; i < filtered.length; i += 2) {
    rows.push(filtered.slice(i, i + 2));
  }

  // Dynamic colors
  const bgColor = theme.dark ? '#0A0015' : '#F5F7FA';
  const cardBg = theme.dark ? 'rgba(255,255,255,0.05)' : colors.white;
  const cardBorder = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const searchBg = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
  const searchBorder = theme.dark ? 'rgba(167,139,250,0.2)' : 'rgba(0,0,0,0.1)';
  const searchText = theme.dark ? '#fff' : colors.gray[800];
  const searchPlaceholder = theme.dark ? 'rgba(255,255,255,0.22)' : colors.gray[400];
  const textColor = theme.dark ? '#fff' : colors.gray[800];
  const mutedColor = theme.dark ? 'rgba(255,255,255,0.4)' : colors.gray[500];
  const tabBorder = theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <View style={[s.root, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={theme.dark ? ['#0A0015', '#0E0A26', '#0A0A18'] : ['#F5F7FA', '#EEF2FF', '#F5F7FA']}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient orbs - only show in dark mode */}
      {theme.dark && (
        <>
          <View style={[s.orb, { top: -100, left: -60, backgroundColor: '#7C3AED', width: 280, height: 280 }]} />
          <View style={[s.orb, { bottom: 80, right: -80, backgroundColor: '#2563EB', width: 220, height: 220 }]} />
          <View style={[s.orb, { top: 300, right: -40, backgroundColor: '#DB2777', width: 160, height: 160 }]} />
        </>
      )}

      {/* ── Header ── */}
      <Animated.View style={[s.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
        <View>
          <Text style={[s.headerSub, { color: mutedColor }]}>GIA TỘC</Text>
          <Text style={[s.headerTitle, { color: textColor }]}>Thành Viên</Text>
        </View>
        <View style={s.statsRow}>
          <View style={[s.statChip, { backgroundColor: cardBg, borderColor: 'rgba(96,165,250,0.3)' }]}>
            <Text style={[s.statNum, { color: '#60A5FA' }]}>{male}</Text>
            <Text style={[s.statLbl, { color: mutedColor }]}>Nam</Text>
          </View>
          <View style={[s.statChip, { backgroundColor: cardBg, borderColor: 'rgba(244,114,182,0.3)' }]}>
            <Text style={[s.statNum, { color: '#F472B6' }]}>{female}</Text>
            <Text style={[s.statLbl, { color: mutedColor }]}>Nữ</Text>
          </View>
          <View style={[s.statChip, { backgroundColor: cardBg, borderColor: 'rgba(167,139,250,0.3)' }]}>
            <Text style={[s.statNum, { color: '#A78BFA' }]}>{members.length}</Text>
            <Text style={[s.statLbl, { color: mutedColor }]}>Tổng</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Search ── */}
      <View style={s.searchWrap}>
        <LinearGradient colors={[searchBg, searchBg.replace('0.08', '0.04')]} style={[s.searchGrad, { borderColor: searchBorder }]}>
          <Ionicons name="search-outline" size={18} color={searchPlaceholder} />
          <TextInput
            style={[s.searchInput, { color: searchText }]}
            placeholder="Tìm kiếm thành viên..."
            placeholderTextColor={searchPlaceholder}
            value={search} onChangeText={setSearch} autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color={searchPlaceholder} />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>

      {/* ── Gender tabs ── */}
      <View style={s.tabWrap}>
        {(['all', 'nam', 'nu'] as const).map(t => {
          const active = genderTab === t;
          const label  = t === 'all' ? 'Tất cả' : t === 'nam' ? '♂ Nam' : '♀ Nữ';
          const color  = t === 'nam' ? '#60A5FA' : t === 'nu' ? '#F472B6' : '#A78BFA';
          return (
            <TouchableOpacity key={t} style={[s.tab, active && { borderColor: color + '80' }, { borderColor: active ? color + '80' : tabBorder }]} onPress={() => setGenderTab(t)}>
              {active && <LinearGradient colors={[color + '30', color + '10']} style={StyleSheet.absoluteFill} />}
              <Text style={[s.tabTxt, active && { color }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#A78BFA" />
          <Text style={[s.stateTxt, { color: mutedColor }]}>Đang tải danh sách...</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <LinearGradient colors={is401 ? ['#F59E0B','#D97706'] : ['#EF4444','#DC2626']} style={s.errIcon}>
            <Ionicons name={is401 ? 'key-outline' : 'cloud-offline-outline'} size={28} color="#fff" />
          </LinearGradient>
          <Text style={[s.errTxt, { color: mutedColor }]}>{error}</Text>
          {is401 ? (
            <TouchableOpacity style={[s.retryBtn, { borderColor: 'rgba(245,158,11,0.4)', backgroundColor: 'rgba(245,158,11,0.12)' }]}
              onPress={() => { navigation.navigate('Login'); }}>
              <Ionicons name="log-in-outline" size={16} color="#F59E0B" />
              <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 14 }}>Đăng nhập lại</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.retryBtn} onPress={() => load()}>
              <Ionicons name="refresh" size={16} color="#A78BFA" />
              <Text style={{ color: '#A78BFA', fontWeight: '700', fontSize: 14 }}>Thử lại</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="people-outline" size={60} color={mutedColor} />
          <Text style={[s.stateTxt, { color: mutedColor }]}>{search ? 'Không tìm thấy' : 'Chưa có thành viên'}</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#A78BFA" colors={['#A78BFA']} />}
          renderItem={renderRow}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}

      <DetailModal m={selected} onClose={() => setSelected(null)} />
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  root       : { flex: 1, backgroundColor: '#0A0015' },
  orb        : { position: 'absolute', borderRadius: 999, opacity: 0.12 },
  header     : { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: spacing.lg, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  headerSub  : { fontSize: 10, color: 'rgba(167,139,250,0.7)', fontWeight: '800', letterSpacing: 2.5, textTransform: 'uppercase' },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1, marginTop: 2 },
  statsRow   : { flexDirection: 'row', gap: 8, marginBottom: 4 },
  statChip   : { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statNum    : { fontSize: 18, fontWeight: '800' },
  statLbl    : { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase' },
  searchWrap : { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  searchGrad : { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 48, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)', overflow: 'hidden' },
  searchInput: { flex: 1, fontSize: 14, color: '#fff' },
  tabWrap    : { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: 8, marginBottom: spacing.md },
  tab        : { flex: 1, height: 36, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tabTxt     : { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.35)' },
  list       : { paddingHorizontal: spacing.lg, gap: spacing.sm },
  row        : { flexDirection: 'row', gap: spacing.sm },
  center     : { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  stateTxt   : { color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: '500' },
  errIcon    : { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  errTxt     : { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' },
  retryBtn   : { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50, backgroundColor: 'rgba(167,139,250,0.12)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)' },
});

const mc = StyleSheet.create({
  card      : { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingBottom: 0 },
  glowBg    : { position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: 50, opacity: 0.06 },
  stripe    : { height: 3, width: '100%' },
  avatarWrap: { alignItems: 'center', marginTop: 16, marginBottom: 10 },
  avatar    : { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  avatarTxt : { fontSize: 26, fontWeight: '900', color: '#fff' },
  genderDot : { position: 'absolute', bottom: 0, right: '25%', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0E0A26' },
  genderDotTxt: { fontSize: 9, color: '#fff', fontWeight: '800' },
  firstName : { fontSize: 16, fontWeight: '800', color: '#fff', textAlign: 'center', paddingHorizontal: 8 },
  fullName  : { fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', paddingHorizontal: 8, marginTop: 2, lineHeight: 14 },
  age       : { fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 6, marginBottom: 10, fontWeight: '600' },
  bottomBar : { paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  viewTxt   : { fontSize: 10, fontWeight: '700' },
});

const dm = StyleSheet.create({
  overlay      : { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet        : { backgroundColor: '#100A22', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)', overflow: 'hidden', maxHeight: '85%' },
  banner       : { paddingTop: 14, paddingBottom: 28, alignItems: 'center' },
  handle       : { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 16 },
  avatarCircle : { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarTxt    : { fontSize: 32, fontWeight: '900', color: '#fff' },
  deceasedBadge: { position: 'absolute', bottom: 10, right: 16, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  deceasedTxt  : { fontSize: 11, color: '#fff', fontWeight: '700' },
  body         : { paddingHorizontal: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 20 },
  name         : { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -0.5 },
  genderLine   : { fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 4, fontWeight: '600' },
  divider      : { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 16 },
  row          : { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  rowTop       : { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  rowIcon      : { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  rowLabel     : { fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  rowValue     : { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginTop: 2, lineHeight: 20 },
  closeBtn     : { marginTop: 16, borderRadius: 16, overflow: 'hidden', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  closeBtnGrad : { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 16 },
  closeBtnTxt  : { fontSize: 15, fontWeight: '800', color: '#fff' },
});

export default MembersScreen;
