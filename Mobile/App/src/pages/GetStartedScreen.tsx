import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import { colors, spacing, fontSize, borderRadius, shadows } from '../config/theme';

const { width, height } = Dimensions.get('window');

const FAMILY_TREE_IMG = require('../assets/family_tree_hero.png');
const FAMILY_BANNER_IMG = require('../assets/family_banner.png');
const LOGO_TREE_IMG = require('../assets/family_tree_hero.png');

interface GetStartedScreenProps {
  navigation: any;
}

const GET_STARTED_1 = require('../assets/getstarter1.jpg');
const GET_STARTED_2 = require('../assets/getstarter2.png');
const GET_STARTED_3 = require('../assets/getstarter3.png');

const features = [
  {
    image: GET_STARTED_1,
    title: 'Xây dựng gia phả',
    desc: 'Lưu giữ lịch sử dòng tộc qua bao thế hệ',
    color: '#6C63FF',
    bg: 'rgba(108, 99, 255, 0.12)',
  },
  {
    image: GET_STARTED_2,
    title: 'Kết nối thành viên',
    desc: 'Gắn kết mọi người trong gia đình',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
  },
  {
    image: GET_STARTED_3,
    title: 'Lưu giữ kỷ niệm',
    desc: 'Hình ảnh, câu chuyện đáng nhớ',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
  },
];

const stats = [
  { value: '5+', label: 'Thế hệ', icon: 'git-branch' as const, color: '#6C63FF' },
  { value: '100+', label: 'Thành viên', icon: 'people' as const, color: '#10B981' },
  { value: '∞', label: 'Kỷ niệm', icon: 'heart' as const, color: '#F59E0B' },
];

const GetStartedScreen: React.FC<GetStartedScreenProps> = ({ navigation }) => {
  const headerAnim = useRef(new Animated.Value(0)).current;
  const imageAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const btnsAnim = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(headerAnim, { toValue: 1, tension: 65, friction: 9, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(imageAnim, { toValue: 1, tension: 50, friction: 10, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 10, useNativeDriver: true }),
      ]),
      Animated.spring(contentAnim, { toValue: 1, tension: 65, friction: 9, useNativeDriver: true }),
      Animated.spring(btnsAnim, { toValue: 1, tension: 65, friction: 9, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const logoTranslate = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] });
  const imageTranslate = imageAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const contentTranslate = contentAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const btnsTranslate = btnsAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] });
  const glowOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });
  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#070712', '#0E0A26', '#070712']} style={styles.bgGradient} />

      {/* Ambient glows */}
      <Animated.View style={[styles.glowTop, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.glowBottom, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.glowMid, { opacity: glowOpacity }]} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero Header */}
        <Animated.View
          style={[styles.heroSection, { opacity: headerAnim, transform: [{ translateY: logoTranslate }] }]}>
          <Animated.View style={[styles.logoWrapper, { transform: [{ translateY: floatY }] }]}>
            <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
            <View style={styles.logoCircle}>
              <Image
                source={LOGO_TREE_IMG}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            {/* Orbiting dots */}
            <View style={styles.orbitRing}>
              <View style={[styles.orbitDot, { backgroundColor: '#F59E0B', top: -6, left: '50%' }]} />
              <View style={[styles.orbitDot, { backgroundColor: '#10B981', bottom: -6, left: '50%' }]} />
              <View style={[styles.orbitDot, { backgroundColor: '#A78BFA', top: '50%', right: -6 }]} />
            </View>
          </Animated.View>

          <Text style={styles.appName}>Cây Gia Phả</Text>
          <Text style={styles.appTagline}>Kết nối cội nguồn  •  Gắn kết tình thân</Text>

          <View style={styles.decorLine}>
            <LinearGradient
              colors={['transparent', '#6C63FF', '#A78BFA', 'transparent']}
              style={styles.decorLineGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </Animated.View>

        {/* ── Hero Image: Family Tree ── */}
        <Animated.View
          style={[
            styles.heroImageContainer,
            {
              opacity: imageAnim,
              transform: [{ translateY: imageTranslate }, { scale: scaleAnim }],
            },
          ]}>
          <LinearGradient
            colors={['rgba(108,99,255,0.15)', 'rgba(79,70,229,0.08)', 'rgba(16,185,129,0.1)']}
            style={styles.heroImageBorder}>
            <Image
              source={FAMILY_TREE_IMG}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {/* Overlay gradient to blend edges */}
            <LinearGradient
              colors={['rgba(7,7,18,0.7)', 'transparent', 'rgba(7,7,18,0.7)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
            {/* Floating badge */}
            <View style={styles.imageBadge}>
              <LinearGradient colors={['#6C63FF', '#4F46E5']} style={styles.imageBadgeGrad}>
                <Ionicons name="sparkles" size={12} color="#fff" />
                <Text style={styles.imageBadgeText}>Gia phả số hóa</Text>
              </LinearGradient>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Stats Row ── */}
        <Animated.View
          style={[styles.statsRow, { opacity: imageAnim, transform: [{ translateY: imageTranslate }] }]}>
          {stats.map((s, i) => (
            <View key={i} style={[styles.statCard, { borderColor: s.color + '30' }]}>
              <LinearGradient
                colors={[s.color + '20', s.color + '08']}
                style={styles.statCardBg}>
                <Ionicons name={s.icon} size={18} color={s.color} />
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </LinearGradient>
            </View>
          ))}
        </Animated.View>

        {/* ── Banner Image ── */}
        <Animated.View
          style={[
            styles.bannerContainer,
            { opacity: contentAnim, transform: [{ translateY: contentTranslate }] },
          ]}>
          <Image
            source={FAMILY_BANNER_IMG}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(7,7,18,0.85)', 'transparent', 'rgba(7,7,18,0.85)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerQuote}>"Uống nước nhớ nguồn"</Text>
            <Text style={styles.bannerSubQuote}>Lưu giữ ký ức — Truyền lại cho mai sau</Text>
          </View>
        </Animated.View>

        {/* Features */}
        <Animated.View
          style={[styles.featuresSection, { opacity: contentAnim, transform: [{ translateY: contentTranslate }] }]}>
          <Text style={styles.sectionLabel}>Tính năng nổi bật</Text>
          {features.map((f, i) => (
            <View key={i} style={[styles.featureCard, { borderColor: f.color + '25' }]}>
              <View style={[styles.featureIconWrap, { backgroundColor: f.bg, borderColor: f.color + '30' }]}>
                <Image
                  source={f.image}
                  style={styles.featureImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: f.color }]}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
              <View style={[styles.featureArrow, { backgroundColor: f.color + '20' }]}>
                <Ionicons name="chevron-forward" size={14} color={f.color} />
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          style={[styles.buttonsSection, { opacity: btnsAnim, transform: [{ translateY: btnsTranslate }] }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Register')}
            style={styles.primaryBtnWrapper}>
            <LinearGradient
              colors={['#8B7FFF', '#6C63FF', '#4F46E5']}
              style={styles.primaryBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <Ionicons name="rocket" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Bắt Đầu Miễn Phí</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.75}>
            <Ionicons name="log-in-outline" size={18} color="#A78BFA" style={{ marginRight: 6 }} />
            <Text style={styles.secondaryBtnText}>Đã có tài khoản? Đăng nhập</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            Tiếp tục có nghĩa là bạn đồng ý với{' '}
            <Text style={styles.termsLink}>Điều khoản sử dụng</Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070712' },
  bgGradient: { ...StyleSheet.absoluteFillObject },
  glowTop: {
    position: 'absolute', top: -height * 0.1, left: -width * 0.2,
    width: width * 0.9, height: width * 0.9, borderRadius: width * 0.45,
    backgroundColor: '#6C63FF', opacity: 0.1,
  },
  glowBottom: {
    position: 'absolute', bottom: height * 0.05, right: -width * 0.3,
    width: width * 0.7, height: width * 0.7, borderRadius: width * 0.35,
    backgroundColor: '#4F46E5', opacity: 0.07,
  },
  glowMid: {
    position: 'absolute', top: height * 0.35, left: width * 0.1,
    width: width * 0.5, height: width * 0.5, borderRadius: width * 0.25,
    backgroundColor: '#10B981', opacity: 0.04,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },

  /* ── Hero Header ── */
  heroSection: { alignItems: 'center', paddingTop: spacing.lg, marginBottom: spacing.lg },
  logoWrapper: { alignItems: 'center', marginBottom: spacing.lg, position: 'relative' },
  logoGlow: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
    backgroundColor: '#6C63FF', opacity: 0.25,
  },
  logoCircle: {
    width: 108, height: 108, borderRadius: 54,
    overflow: 'hidden',
    ...shadows.lg,
  },
  logoImage: {
    width: 108, height: 108,
  },
  orbitRing: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
    borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)', borderStyle: 'dashed',
    top: -21, left: -21,
  },
  orbitDot: {
    position: 'absolute', width: 10, height: 10, borderRadius: 5,
  },
  appName: {
    fontSize: Math.min(fontSize.hero, width * 0.11), fontWeight: '800',
    color: colors.white, letterSpacing: -1, marginBottom: spacing.xs,
  },
  appTagline: {
    fontSize: fontSize.sm, color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5, marginBottom: spacing.md,
  },
  decorLine: { width: '70%', height: 1 },
  decorLineGrad: { height: 1, width: '100%' },

  /* ── Hero Image ── */
  heroImageContainer: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  heroImageBorder: {
    padding: 2,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: height * 0.25,
    borderRadius: borderRadius.xl - 2,
  },
  imageBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  imageBadgeGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  imageBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* ── Stats Row ── */
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statCardBg: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* ── Banner Image ── */
  bannerContainer: {
    height: 90,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject as any,
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  bannerQuote: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bannerSubQuote: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  /* ── Features ── */
  featuresSection: { marginBottom: spacing.xl },
  sectionLabel: {
    fontSize: fontSize.xs, color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2, textTransform: 'uppercase',
    marginBottom: spacing.md, fontWeight: '600',
  },
  featureCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: borderRadius.lg, borderWidth: 1,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  // ✅ Chỉ còn 1 định nghĩa featureIconWrap duy nhất — đã merge đầy đủ
  featureIconWrap: {
    width: 54,
    height: 54,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden', // ✅ Bắt buộc để ảnh hiển thị đúng trong khung
  },
  featureImage: {
    width: '70%',
    height: '70%',
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: fontSize.md, fontWeight: '700', marginBottom: 3 },
  featureDesc: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.45)', lineHeight: 18 },
  featureArrow: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

  /* ── Buttons ── */
  buttonsSection: { gap: spacing.md },
  primaryBtnWrapper: { borderRadius: borderRadius.xl, ...shadows.lg },
  primaryBtn: {
    borderRadius: borderRadius.xl, paddingVertical: spacing.md + 4,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
  },
  primaryBtnText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '700', letterSpacing: 0.3 },
  secondaryBtn: {
    paddingVertical: spacing.md, alignItems: 'center',
    borderRadius: borderRadius.xl, borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)', backgroundColor: 'rgba(108, 99, 255, 0.06)',
    flexDirection: 'row', justifyContent: 'center',
  },
  secondaryBtnText: { color: '#A78BFA', fontSize: fontSize.md, fontWeight: '600' },
  termsText: { textAlign: 'center', fontSize: fontSize.xs, color: 'rgba(255,255,255,0.3)', lineHeight: 18 },
  termsLink: { color: '#6C63FF', fontWeight: '500' },
});

export default GetStartedScreen;