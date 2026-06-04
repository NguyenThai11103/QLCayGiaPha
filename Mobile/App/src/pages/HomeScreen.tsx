import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Platform, Animated, Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, fontSize, borderRadius, shadows, rs, rvs, rf, screen } from '../config/theme';
import { NguoiDung, STORAGE_USER_KEY } from '../genaral/authService';
import { useTheme } from '../context/ThemeContext';

const TREE_IMG = require('../assets/family_tree_hero.png');

interface HomeScreenProps { navigation: any; }

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [user, setUser] = useState<NguoiDung | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng ☀️';
    if (h < 18) return 'Chào buổi chiều 🌤️';
    return 'Chào buổi tối 🌙';
  };

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_USER_KEY)
      .then(v => { if (v) setUser(JSON.parse(v)); })
      .catch(() => {});
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const isDark = theme.dark;
  const bg = isDark ? ['#0C0C1E', '#151530'] : ['#F7F8FD', '#EEF0FC'];
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSub = isDark ? 'rgba(255,255,255,0.50)' : '#6B7280';
  const border = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)';

  const animStyle = { opacity: fadeAnim, transform: [{ translateY: slideAnim }] };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <LinearGradient colors={bg} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ─── HEADER ─── */}
        <Animated.View style={[styles.header, animStyle]}>
          <View>
            <Text style={[styles.greeting, { color: textSub }]}>{getGreeting()}</Text>
            <Text style={[styles.familyName, { color: textPrimary }]}>
              Gia tộc <Text style={{ color: '#D4A853', fontWeight: '900' }}>Nguyễn Bá</Text>
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: cardBg, borderColor: border }]}
              onPress={() => navigation.navigate('Notifications')} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={20} color={isDark ? '#D4A853' : '#6C63FF'} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: cardBg, borderColor: border }]}
              onPress={() => navigation.navigate('QRScan')} activeOpacity={0.7}>
              <Ionicons name="qr-code-outline" size={20} color={isDark ? '#D4A853' : '#6C63FF'} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ─── HERO CARD: Cây Gia Phả ─── */}
        <Animated.View style={animStyle}>
          <TouchableOpacity activeOpacity={0.88} onPress={() => navigation.navigate('Tree')} style={styles.heroCard}>
            <LinearGradient
              colors={['#312E81', '#4338CA', '#6D28D9']}
              style={styles.heroGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              {/* Decorative circle */}
              <View style={styles.heroCircle} />
              <View style={styles.heroCircle2} />

              <View style={styles.heroLeft}>
                <View style={styles.heroPill}>
                  <Ionicons name="sparkles" size={9} color="#FCD34D" />
                  <Text style={styles.heroPillText}>GIA PHẢ SỐ HÓA</Text>
                </View>
                <Text style={styles.heroTitle}>Sơ Đồ{'\n'}Gia Phả</Text>
                <Text style={styles.heroSub}>5 thế hệ · 48 thành viên</Text>
                <View style={styles.heroCta}>
                  <Text style={styles.heroCtaText}>Xem ngay</Text>
                  <Ionicons name="arrow-forward" size={13} color="#FCD34D" />
                </View>
              </View>

              <Image source={TREE_IMG} style={styles.heroImg} resizeMode="contain" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ─── STATS ROW ─── */}
        <Animated.View style={[styles.statsRow, animStyle]}>
          {[
            { label: 'Thế hệ', value: '5', icon: 'git-branch-outline', grad: ['#7C3AED','#A855F7'] },
            { label: 'Thành viên', value: '48', icon: 'people-outline', grad: ['#0D9488','#34D399'] },
            { label: 'Sự kiện', value: '12', icon: 'calendar-outline', grad: ['#B45309','#F59E0B'] },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <LinearGradient colors={s.grad as any} style={styles.statIconWrap}>
                <Ionicons name={s.icon as any} size={16} color="#fff" />
              </LinearGradient>
              <Text style={[styles.statVal, { color: textPrimary }]}>{s.value}</Text>
              <Text style={[styles.statLbl, { color: textSub }]}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ─── QUICK ACTIONS GRID ─── */}
        <Animated.View style={animStyle}>
          <Text style={[styles.sectionLabel, { color: textSub }]}>Tính Năng</Text>
          <View style={styles.gridWrap}>
            {[
              { label: 'Thành Viên', icon: 'people', route: 'Members', grad: ['#6C63FF','#818CF8'], emoji: '👨‍👩‍👧‍👦' },
              { label: 'Sự Kiện',   icon: 'calendar', route: 'Events', grad: ['#D97706','#F59E0B'], emoji: '📅' },
              { label: 'Mộ Phần',  icon: 'trail-sign', route: 'MoPhan', grad: ['#059669','#34D399'], emoji: '🗺️' },
              { label: 'Lịch Âm',  icon: 'moon', route: 'LichAm', grad: ['#2563EB','#60A5FA'], emoji: '🌙' },
            ].map((a) => (
              <TouchableOpacity
                key={a.route}
                style={[styles.gridItem, { backgroundColor: cardBg, borderColor: border }]}
                activeOpacity={0.75}
                onPress={() => navigation.navigate(a.route)}
              >
                <LinearGradient colors={a.grad as any} style={styles.gridIcon}>
                  <Ionicons name={a.icon as any} size={20} color="#fff" />
                </LinearGradient>
                <Text style={[styles.gridLabel, { color: textPrimary }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ─── RECENT ACTIVITY ─── */}
        <Animated.View style={animStyle}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: textSub }]}>Hoạt Động Gần Đây</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Events')}>
              <Text style={styles.seeAll}>Xem tất cả →</Text>
            </TouchableOpacity>
          </View>

          {[
            { icon: 'person-add-outline', color: '#6C63FF', bg: 'rgba(108,99,255,0.12)',
              title: 'Thêm mới thành viên', sub: 'Nguyễn Bá Hùng · Thế hệ 5', time: '5 phút trước' },
            { icon: 'ribbon-outline', color: '#D4A853', bg: 'rgba(212,168,83,0.12)',
              title: 'Cập nhật ngày Giỗ Tổ', sub: 'Nguyễn Bá An · 15/10 Âm lịch', time: '2 giờ trước' },
            { icon: 'images-outline', color: '#10B981', bg: 'rgba(16,185,129,0.12)',
              title: 'Album ảnh gia đình mới', sub: '5 hình ảnh được tải lên', time: '4 giờ trước' },
          ].map((a, i) => (
            <View key={i} style={[styles.feedCard, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={[styles.feedIcon, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon as any} size={17} color={a.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.feedTitle, { color: textPrimary }]}>{a.title}</Text>
                <Text style={[styles.feedSub, { color: textSub }]}>{a.sub}</Text>
              </View>
              <Text style={[styles.feedTime, { color: textSub }]}>{a.time}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const GRID_ITEM_W = (screen.width - spacing.md * 2 - 10 * 3) / 4;

const styles = StyleSheet.create({
  scroll: {
    paddingTop: Platform.OS === 'ios' ? rvs(54) : rvs(44),
    paddingHorizontal: spacing.md,
    paddingBottom: rvs(110),
  },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  greeting: { fontSize: rf(12), fontWeight: '500', letterSpacing: 0.3, marginBottom: 3 },
  familyName: { fontSize: rf(22), fontWeight: '700', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  notifDot: { position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },

  // Hero
  heroCard: { borderRadius: 24, overflow: 'hidden', marginBottom: spacing.md, ...shadows.lg },
  heroGrad: { flexDirection: 'row', alignItems: 'center', padding: 22, overflow: 'hidden', position: 'relative' },
  heroCircle: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -30,
  },
  heroCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: -50, left: 80,
  },
  heroLeft: { flex: 1, zIndex: 2 },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(252,211,77,0.15)', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, alignSelf: 'flex-start', marginBottom: 10,
  },
  heroPillText: { fontSize: rf(9), fontWeight: '800', color: '#FCD34D', letterSpacing: 0.8 },
  heroTitle: { fontSize: rf(24), fontWeight: '900', color: '#FFFFFF', lineHeight: rf(30), letterSpacing: -0.5, marginBottom: 6 },
  heroSub: { fontSize: rf(12), color: 'rgba(255,255,255,0.6)', marginBottom: 14 },
  heroCta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroCtaText: { fontSize: rf(13), fontWeight: '700', color: '#FCD34D' },
  heroImg: { width: rs(110), height: rs(110), zIndex: 2 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  statCard: {
    flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 5,
  },
  statIconWrap: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statVal: { fontSize: rf(17), fontWeight: '800', letterSpacing: -0.5 },
  statLbl: { fontSize: rf(9.5), fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },

  // Grid
  sectionLabel: { fontSize: rf(10), fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 },
  gridWrap: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  gridItem: {
    width: GRID_ITEM_W,
    paddingVertical: 16, paddingHorizontal: 6,
    borderRadius: 18, borderWidth: 1, alignItems: 'center', gap: 8,
  },
  gridIcon: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  gridLabel: { fontSize: rf(10.5), fontWeight: '700', textAlign: 'center' },

  // Feed
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { fontSize: rf(12), fontWeight: '600', color: '#6C63FF' },
  feedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 8,
  },
  feedIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  feedTitle: { fontSize: rf(13), fontWeight: '700', marginBottom: 2 },
  feedSub: { fontSize: rf(11), lineHeight: rf(14) },
  feedTime: { fontSize: rf(10), fontWeight: '500', flexShrink: 0 },
});

export default HomeScreen;
