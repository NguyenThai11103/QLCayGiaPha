/**
 * NotificationsScreen – Trang thông báo
 * Premium glassmorphism UI với filter, swipe-to-read, stagger animation
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, Animated, Platform, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import { colors, spacing } from '../config/theme';
import { useTheme } from '../context/ThemeContext';

const { width: SW } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────
type NotifType = 'birthday' | 'member' | 'event' | 'tree' | 'system';

interface Notif {
  id       : string;
  type     : NotifType;
  title    : string;
  body     : string;
  time     : Date;
  read     : boolean;
}

// ─────────────────────────────────────────────────────────
//  Config per type
// ─────────────────────────────────────────────────────────
const TYPE_CFG: Record<NotifType, { icon: string; grad: [string, string]; label: string }> = {
  birthday : { icon: 'gift',             grad: ['#EC4899', '#BE185D'], label: 'Sinh nhật'   },
  member   : { icon: 'person-add',       grad: ['#7C3AED', '#4F46E5'], label: 'Thành viên'  },
  event    : { icon: 'calendar',         grad: ['#D97706', '#B45309'], label: 'Sự kiện'     },
  tree     : { icon: 'git-network',      grad: ['#059669', '#047857'], label: 'Cây gia phả' },
  system   : { icon: 'settings',         grad: ['#2563EB', '#1D4ED8'], label: 'Hệ thống'   },
};

// ─────────────────────────────────────────────────────────
//  Mock data
// ─────────────────────────────────────────────────────────
const MOCK_NOTIFS: Notif[] = [
  {
    id: '1', type: 'birthday', read: false,
    title: '🎂 Sinh nhật Nguyễn Văn An',
    body : 'Hôm nay là sinh nhật lần thứ 60 của ông Nguyễn Văn An. Chúc mừng sinh nhật!',
    time : new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: '2', type: 'member', read: false,
    title: 'Thành viên mới được thêm',
    body : 'Trần Thị Lan (đời thứ 4) vừa được thêm vào cây gia phả bởi quản lý.',
    time : new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: '3', type: 'event', read: false,
    title: '📅 Nhắc nhở: Giỗ tổ sắp đến',
    body : 'Lễ giỗ tổ họ Nguyễn sẽ diễn ra vào ngày 15/06/2026. Còn 24 ngày nữa.',
    time : new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: '4', type: 'tree', read: true,
    title: 'Cây gia phả được cập nhật',
    body : 'Quản lý đã cập nhật thông tin tiểu sử của 3 thành viên trong cây gia phả.',
    time : new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: '5', type: 'event', read: true,
    title: '🎉 Họp mặt gia tộc thành công',
    body : 'Cuộc họp mặt gia tộc ngày 20/05/2026 đã diễn ra thành công với 45 thành viên tham dự.',
    time : new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
  {
    id: '6', type: 'member', read: true,
    title: 'Thông tin thành viên được xác minh',
    body : 'Thông tin của Nguyễn Thị Bình đã được xác minh và cập nhật vào hệ thống.',
    time : new Date(Date.now() - 1000 * 60 * 60 * 72),
  },
  {
    id: '7', type: 'system', read: true,
    title: 'Cập nhật hệ thống v1.0.1',
    body : 'Ứng dụng đã được cập nhật với nhiều cải tiến về hiệu năng và tính năng mới.',
    time : new Date(Date.now() - 1000 * 60 * 60 * 96),
  },
  {
    id: '8', type: 'birthday', read: true,
    title: '🎂 Sinh nhật Trần Văn Bình',
    body : 'Đừng quên gửi lời chúc mừng sinh nhật đến ông Trần Văn Bình hôm nay!',
    time : new Date(Date.now() - 1000 * 60 * 60 * 120),
  },
];

// ─────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────
const timeAgo = (d: Date): string => {
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'Vừa xong';
  if (m < 60)  return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} giờ trước`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day} ngày trước`;
  return d.toLocaleDateString('vi-VN');
};

// ─────────────────────────────────────────────────────────
//  Notification Card
// ─────────────────────────────────────────────────────────
const NotifCard: React.FC<{
  item   : Notif;
  index  : number;
  onRead : (id: string) => void;
  theme: ReturnType<typeof useTheme>['theme'];
}> = ({ item, index, onRead, theme }) => {
  const anim  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const cfg   = TYPE_CFG[item.type];

  const cardBg = theme.dark ? 'rgba(255,255,255,0.05)' : colors.white;
  const cardReadBg = theme.dark ? 'rgba(255,255,255,0.02)' : colors.gray[50];
  const textColor = theme.dark ? '#fff' : colors.gray[800];
  const mutedColor = theme.dark ? 'rgba(255,255,255,0.5)' : colors.gray[500];
  const borderColor = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, tension: 60, friction: 12,
      delay: index * 60, useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 10 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start(() => onRead(item.id));
  };

  return (
    <Animated.View style={{
      opacity  : anim,
      transform: [
        { scale },
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
      ],
    }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={1} style={[nc.card, item.read ? { backgroundColor: cardReadBg } : { backgroundColor: cardBg }, { borderColor: borderColor }]}>
        {/* Unread indicator */}
        {!item.read && <View style={[nc.unreadBar, { backgroundColor: cfg.grad[0] }]} />}

        {/* Icon */}
        <LinearGradient colors={cfg.grad} style={nc.iconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name={cfg.icon as any} size={20} color="#fff" />
        </LinearGradient>

        {/* Content */}
        <View style={nc.content}>
          <View style={nc.topRow}>
            <View style={[nc.badge, { backgroundColor: cfg.grad[0] + '20', borderColor: cfg.grad[0] + '40' }]}>
              <Text style={[nc.badgeTxt, { color: cfg.grad[0] }]}>{cfg.label}</Text>
            </View>
            <Text style={[nc.time, !item.read && nc.timeUnread, { color: mutedColor }]}>{timeAgo(item.time)}</Text>
          </View>
          <Text style={[nc.title, !item.read && nc.titleUnread, { color: textColor }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[nc.body, { color: mutedColor }]} numberOfLines={2}>{item.body}</Text>
        </View>

        {/* Unread dot */}
        {!item.read && (
          <View style={[nc.dot, { backgroundColor: cfg.grad[0] }]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────
//  Main Screen
// ─────────────────────────────────────────────────────────
type Filter = 'all' | 'unread' | 'event' | 'member';

const FILTERS: { key: Filter; label: string; color: string }[] = [
  { key: 'all',    label: 'Tất cả',    color: '#A78BFA' },
  { key: 'unread', label: 'Chưa đọc',  color: '#F472B6' },
  { key: 'event',  label: 'Sự kiện',   color: '#F59E0B' },
  { key: 'member', label: 'Thành viên',color: '#34D399' },
];

const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const [notifs,  setNotifs]  = useState<Notif[]>(MOCK_NOTIFS);
  const [filter,  setFilter]  = useState<Filter>('all');
  const headerAnim = useRef(new Animated.Value(0)).current;

  // Dynamic colors
  const bgColor = theme.dark ? '#0A0015' : '#F5F7FA';
  const cardBg = theme.dark ? 'rgba(255,255,255,0.05)' : colors.white;
  const textColor = theme.dark ? '#fff' : colors.gray[800];
  const mutedColor = theme.dark ? 'rgba(255,255,255,0.4)' : colors.gray[500];
  const tabBorder = theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, tension: 50, friction: 10, useNativeDriver: true }).start();
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filtered = notifs.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'event')  return n.type === 'event' || n.type === 'birthday';
    if (filter === 'member') return n.type === 'member';
    return true;
  });

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <View style={[s.root, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={theme.dark ? ['#050010', '#0E0A26', '#080018'] : ['#F5F7FA', '#EEF2FF', '#F5F7FA']}
        style={StyleSheet.absoluteFill}
      />

      {/* Orbs - only show in dark mode */}
      {theme.dark && (
        <>
          <View style={[s.orb, { top: -80, left: -60,  width: 260, height: 260, backgroundColor: '#7C3AED' }]} />
          <View style={[s.orb, { bottom: 80, right: -70, width: 200, height: 200, backgroundColor: '#DB2777' }]} />
        </>
      )}

      {/* ── Header ── */}
      <Animated.View style={[s.header, {
        opacity  : headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
      }]}>
        {/* Back */}
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <LinearGradient colors={theme.dark ? ['rgba(167,139,250,0.15)', 'rgba(124,58,237,0.08)'] : ['rgba(108,99,255,0.1)', 'rgba(108,99,255,0.05)']} style={s.backCircle}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={[s.headerSub, { color: theme.dark ? 'rgba(167,139,250,0.6)' : colors.gray[500] }]}>HỆ THỐNG</Text>
          <Text style={[s.headerTitle, { color: textColor }]}>Thông báo</Text>
        </View>

        {/* Mark all read */}
        {unreadCount > 0 ? (
          <TouchableOpacity style={s.markAllBtn} onPress={markAllRead}>
            <LinearGradient colors={theme.dark ? ['rgba(167,139,250,0.15)', 'rgba(124,58,237,0.08)'] : ['rgba(108,99,255,0.1)', 'rgba(108,99,255,0.05)']} style={s.markAllGrad}>
              <Ionicons name="checkmark-done" size={16} color={theme.colors.primary} />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </Animated.View>

      {/* ── Unread count ── */}
      {unreadCount > 0 && (
        <View style={s.unreadBanner}>
          <LinearGradient colors={theme.dark ? ['rgba(124,58,237,0.2)', 'rgba(79,70,229,0.1)'] : ['rgba(108,99,255,0.15)', 'rgba(108,99,255,0.08)']} style={s.bannerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={[s.bannerDot, { backgroundColor: theme.colors.primary }]} />
            <Text style={[s.bannerTxt, { color: theme.dark ? 'rgba(255,255,255,0.7)' : colors.gray[700] }]}>{unreadCount} thông báo chưa đọc</Text>
            <TouchableOpacity onPress={markAllRead}>
              <Text style={[s.bannerAction, { color: theme.colors.primary }]}>Đánh dấu tất cả</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* ── Filter tabs ── */}
      <View style={s.filters}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <TouchableOpacity key={f.key} style={[s.filterTab, { borderColor: active ? f.color + '80' : tabBorder }]} onPress={() => setFilter(f.key)}>
              {active && <LinearGradient colors={[f.color + '30', f.color + '10']} style={StyleSheet.absoluteFill} />}
              <Text style={[s.filterTxt, active && { color: f.color }]}>{f.label}</Text>
              {f.key === 'unread' && unreadCount > 0 && (
                <View style={[s.countBadge, { backgroundColor: f.color }]}>
                  <Text style={s.countTxt}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <View style={s.empty}>
          <LinearGradient colors={theme.dark ? ['rgba(167,139,250,0.15)', 'rgba(124,58,237,0.05)'] : ['rgba(108,99,255,0.1)', 'rgba(108,99,255,0.05)']} style={s.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={36} color={theme.colors.primary} />
          </LinearGradient>
          <Text style={[s.emptyTitle, { color: textColor }]}>Không có thông báo</Text>
          <Text style={[s.emptyBody, { color: mutedColor }]}>
            {filter === 'unread' ? 'Bạn đã đọc tất cả thông báo' : 'Chưa có thông báo nào trong mục này'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <NotifCard item={item} index={index} onRead={markRead} theme={theme} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root         : { flex: 1, backgroundColor: '#050010' },
  orb          : { position: 'absolute', borderRadius: 999, opacity: 0.1 },
  header       : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backBtn      : { borderRadius: 12, overflow: 'hidden' },
  backCircle   : { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  headerCenter : { alignItems: 'center' },
  headerSub    : { fontSize: 9, color: 'rgba(167,139,250,0.6)', fontWeight: '800', letterSpacing: 2.5 },
  headerTitle  : { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  markAllBtn   : { borderRadius: 12, overflow: 'hidden' },
  markAllGrad  : { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  unreadBanner : { marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)' },
  bannerGrad   : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  bannerDot    : { width: 8, height: 8, borderRadius: 4, backgroundColor: '#A78BFA' },
  bannerTxt    : { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  bannerAction : { fontSize: 11, color: '#A78BFA', fontWeight: '700' },
  filters      : { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: 8, marginBottom: spacing.md },
  filterTab    : { flex: 1, height: 34, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexDirection: 'row', gap: 4 },
  filterTxt    : { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.3)' },
  countBadge   : { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  countTxt     : { fontSize: 9, fontWeight: '900', color: '#fff' },
  list         : { paddingHorizontal: spacing.lg },
  empty        : { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon    : { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  emptyTitle   : { fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.6)' },
  emptyBody    : { fontSize: 13, color: 'rgba(255,255,255,0.25)', textAlign: 'center', paddingHorizontal: 40 },
});

const nc = StyleSheet.create({
  card     : { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', overflow: 'hidden', gap: 12 },
  cardRead : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' },
  unreadBar: { position: 'absolute', top: 0, left: 0, width: 3, height: '100%', borderRadius: 3 },
  iconBox  : { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  content  : { flex: 1 },
  topRow   : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 },
  badge    : { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, borderWidth: 1 },
  badgeTxt : { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  time     : { fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: '500' },
  timeUnread: { color: 'rgba(255,255,255,0.5)' },
  title    : { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.55)', marginBottom: 3 },
  titleUnread: { color: '#fff', fontWeight: '800' },
  body     : { fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 17 },
  dot      : { width: 9, height: 9, borderRadius: 5, flexShrink: 0, marginTop: 6 },
});

export default NotificationsScreen;
