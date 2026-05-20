import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, fontSize, borderRadius, shadows } from '../config/theme';
import { NguoiDung, STORAGE_USER_KEY } from '../genaral/authService';

const { width } = Dimensions.get('window');
const TREE_IMG  = require('../assets/family_tree_hero.png');

interface HomeScreenProps { navigation: any; }

// ── Quick action buttons
const QUICK_ACTIONS = [
  { id: 'tree',    icon: 'git-network'    as const, label: 'Cây Gia Phả', color: '#6C63FF', bg: 'rgba(108,99,255,0.15)'  },
  { id: 'members', icon: 'people'         as const, label: 'Thành Viên',  color: '#10B981', bg: 'rgba(16,185,129,0.15)'  },
  { id: 'events',  icon: 'calendar'       as const, label: 'Sự Kiện',     color: '#F59E0B', bg: 'rgba(245,158,11,0.15)'  },
  { id: 'media',   icon: 'images'         as const, label: 'Hình Ảnh',    color: '#EC4899', bg: 'rgba(236,72,153,0.15)'  },
  { id: 'docs',    icon: 'document-text'  as const, label: 'Tài Liệu',    color: '#3B82F6', bg: 'rgba(59,130,246,0.15)'  },
  { id: 'search',  icon: 'search'         as const, label: 'Tìm Kiếm',    color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
];

// ── Stats
const STATS = [
  { label: 'Thế hệ',   value: '5',   icon: 'git-branch' as const, color: '#6C63FF' },
  { label: 'Thành viên', value: '48', icon: 'people'     as const, color: '#10B981' },
  { label: 'Sự kiện',   value: '12', icon: 'calendar'   as const, color: '#F59E0B' },
];

// ── Recent activity
const RECENT = [
  { id: 1, text: 'Nguyễn Văn A vừa được thêm vào', time: '2 phút trước',  icon: 'person-add'     as const, color: '#10B981' },
  { id: 2, text: 'Sự kiện Giỗ tổ đã được tạo',      time: '1 giờ trước',  icon: 'calendar'       as const, color: '#F59E0B' },
  { id: 3, text: '3 ảnh mới được tải lên',           time: '3 giờ trước',  icon: 'images'         as const, color: '#EC4899' },
  { id: 4, text: 'Cập nhật thông tin dòng họ',       time: 'Hôm qua',      icon: 'create'         as const, color: '#A78BFA' },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<NguoiDung | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const cardAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Load user from storage
    AsyncStorage.getItem(STORAGE_USER_KEY)
      .then(val => { if (val) setUser(JSON.parse(val)); })
      .catch(() => {});

    // Entrance animations
    Animated.stagger(100, [
      Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.spring(cardAnim,   { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleLogout = async () => {
    // Chỉ xóa token/user, GIỮ onboarding_completed để không hiện lại onboarding
    await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
    // Dùng getParent() vì HomeScreen nằm trong Tab Navigator
    navigation.getParent()?.replace('GetStarted');
  };

  const headerY  = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] });
  const cardY    = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const glowOp   = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.55] });
  const firstName = user?.name?.split(' ').pop() ?? 'bạn';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#070712', '#0E0A26', '#070712']} style={StyleSheet.absoluteFill} />

      {/* Ambient glows */}
      <Animated.View style={[styles.glowTL, { opacity: glowOp }]} />
      <Animated.View style={[styles.glowBR, { opacity: glowOp }]} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* ── Top Header ── */}
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerY }] }]}>
          <View>
            <Text style={styles.greetSmall}>Chào mừng trở lại 👋</Text>
            <Text style={styles.greetName}>Xin chào, {user?.ho_ten}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={22} color="#A78BFA" />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={handleLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={22} color="#A78BFA" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Hero Banner ── */}
        <Animated.View style={[styles.heroBanner, {
          opacity   : cardAnim,
          transform : [{ translateY: cardY }],
        }]}>
          <LinearGradient
            colors={['rgba(108,99,255,0.4)', 'rgba(79,70,229,0.2)', 'rgba(16,185,129,0.15)']}
            style={styles.heroBannerGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.heroBannerContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroLabel}>Dòng họ của bạn</Text>
                <Text style={styles.heroTitle}>Cây Gia Phả{'\n'}Nguyễn Bá</Text>
                <TouchableOpacity style={styles.heroBtn} activeOpacity={0.85}>
                  <LinearGradient colors={['#6C63FF', '#4F46E5']} style={styles.heroBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.heroBtnText}>Xem cây</Text>
                    <Ionicons name="arrow-forward" size={14} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              <Image source={TREE_IMG} style={styles.heroImage} resizeMode="contain" />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Stats Row ── */}
        <Animated.View style={[styles.statsRow, { opacity: cardAnim, transform: [{ translateY: cardY }] }]}>
          {STATS.map((s, i) => (
            <View key={i} style={[styles.statCard, { borderColor: s.color + '30' }]}>
              <LinearGradient colors={[s.color + '25', s.color + '08']} style={styles.statCardGrad}>
                <Ionicons name={s.icon} size={18} color={s.color} />
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </LinearGradient>
            </View>
          ))}
        </Animated.View>

        {/* ── Quick Actions ── */}
        <Animated.View style={[styles.section, { opacity: cardAnim, transform: [{ translateY: cardY }] }]}>
          <Text style={styles.sectionTitle}>Tính năng</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map(a => (
              <TouchableOpacity key={a.id} style={styles.actionItem} activeOpacity={0.75}>
                <View style={[styles.actionIcon, { backgroundColor: a.bg, borderColor: a.color + '40' }]}>
                  <Ionicons name={a.icon} size={24} color={a.color} />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ── Recent Activity ── */}
        <Animated.View style={[styles.section, { opacity: cardAnim, transform: [{ translateY: cardY }] }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityCard}>
            {RECENT.map((r, i) => (
              <View key={r.id}>
                <View style={styles.activityRow}>
                  <View style={[styles.activityDot, { backgroundColor: r.color + '25', borderColor: r.color + '50' }]}>
                    <Ionicons name={r.icon} size={15} color={r.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityText}>{r.text}</Text>
                    <Text style={styles.activityTime}>{r.time}</Text>
                  </View>
                </View>
                {i < RECENT.length - 1 && <View style={styles.activityDivider} />}
              </View>
            ))}
          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container : { flex: 1, backgroundColor: '#070712' },
  scroll    : {
    paddingTop        : Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal : spacing.lg,
    paddingBottom     : spacing.xxxl,
  },

  // Glows
  glowTL : {
    position: 'absolute', top: -80, left: -60,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: '#6C63FF', opacity: 0.12,
  },
  glowBR : {
    position: 'absolute', bottom: 100, right: -80,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#10B981', opacity: 0.08,
  },

  // Header
  header : {
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'space-between',
    marginBottom   : spacing.lg,
  },
  greetSmall  : { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.45)', marginBottom: 2 },
  greetName   : { fontSize: fontSize.xl, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  headerRight : { flexDirection: 'row', gap: spacing.sm },
  headerBtn   : {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(108,99,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(108,99,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  notifBadge : {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5, borderColor: '#070712',
  },

  // Hero banner
  heroBanner     : { marginBottom: spacing.lg, borderRadius: borderRadius.xl, overflow: 'hidden', ...shadows.lg },
  heroBannerGrad : { borderRadius: borderRadius.xl, borderWidth: 1, borderColor: 'rgba(108,99,255,0.25)' },
  heroBannerContent : { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  heroLabel  : { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  heroTitle  : { fontSize: fontSize.xxl, fontWeight: '800', color: colors.white, lineHeight: 32, marginBottom: spacing.md, letterSpacing: -0.5 },
  heroBtn    : { alignSelf: 'flex-start', borderRadius: borderRadius.full },
  heroBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  heroBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: '#fff' },
  heroImage  : { width: 110, height: 110, opacity: 0.9 },

  // Stats
  statsRow : { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard : { flex: 1, borderRadius: borderRadius.lg, borderWidth: 1, overflow: 'hidden' },
  statCardGrad : { alignItems: 'center', paddingVertical: spacing.md, gap: 4 },
  statValue    : { fontSize: fontSize.xl, fontWeight: '800', letterSpacing: -0.5 },
  statLabel    : { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Section
  section      : { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle : { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  seeAll       : { fontSize: fontSize.xs, color: '#A78BFA', fontWeight: '600' },

  // Quick actions
  actionsGrid  : { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionItem   : { width: (width - spacing.lg * 2 - spacing.sm * 2) / 3, alignItems: 'center', gap: spacing.xs },
  actionIcon   : {
    width: 56, height: 56, borderRadius: borderRadius.lg,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  actionLabel : { fontSize: fontSize.xxs, color: 'rgba(255,255,255,0.55)', fontWeight: '600', textAlign: 'center' },

  // Activity
  activityCard    : {
    backgroundColor : 'rgba(255,255,255,0.04)',
    borderRadius    : borderRadius.xl,
    borderWidth     : 1,
    borderColor     : 'rgba(108,99,255,0.15)',
    overflow        : 'hidden',
  },
  activityRow     : { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  activityDot     : {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  activityText    : { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 2 },
  activityTime    : { fontSize: fontSize.xxs, color: 'rgba(255,255,255,0.35)', fontWeight: '400' },
  activityDivider : { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: spacing.md + 36 + spacing.md },
});

export default HomeScreen;
