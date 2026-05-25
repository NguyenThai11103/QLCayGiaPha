import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, fontSize, borderRadius, shadows } from '../config/theme';

const ONBOARDING_KEY = 'onboarding_completed';

const { width, height } = Dimensions.get('window');

const slideImages = [
  require('../assets/getstarter1.jpg'),
  require('../assets/getstarter2.png'),
  require('../assets/getstarter3.png'),
];

interface OnboardingScreenProps {
  navigation: any;
}

const slides = [
  {
    id          : 1,
    title       : 'Xây Dựng\nGia Phả',
    description : 'Lưu giữ và phát huy truyền thống tốt đẹp của dòng tộc Việt Nam qua bao thế hệ',
    gradient    : ['#1A0A4A', '#2D1B69', '#0A0A1A'] as string[],
    accentColor : '#6C63FF',
    dotColor    : '#A78BFA',
  },
  {
    id          : 2,
    title       : 'Kết Nối\nGia Đình',
    description : 'Gắn kết các thành viên trong gia đình qua không gian số hiện đại và thân thiện',
    gradient    : ['#0A2A1A', '#0D4A2A', '#0A1A0A'] as string[],
    accentColor : '#10B981',
    dotColor    : '#34D399',
  },
  {
    id          : 3,
    title       : 'Lưu Giữ\nKỷ Niệm',
    description : 'Chia sẻ hình ảnh, câu chuyện và những kỷ niệm quý giá theo năm tháng',
    gradient    : ['#2A1A0A', '#4A2D0D', '#1A0A00'] as string[],
    accentColor : '#F59E0B',
    dotColor    : '#FBBF24',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const imageScale = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(imageScale, { toValue: 1.04, duration: 3000, useNativeDriver: true }),
        Animated.timing(imageScale, { toValue: 1, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const transitionToSlide = (nextIndex: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setCurrentSlide(nextIndex);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    });
  };

  const markAndNavigate = (routeName: string) => {
    AsyncStorage.setItem(ONBOARDING_KEY, 'true').finally(() => {
      navigation.replace(routeName as any);
    });
  };

  const scrollToNext = () => {
    if (currentSlide < slides.length - 1) {
      transitionToSlide(currentSlide + 1);
    } else {
      markAndNavigate('GetStarted');
    }
  };

  const slide = slides[currentSlide];
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={slide.gradient} style={styles.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>

        {/* Ambient Glow */}
        <Animated.View style={[styles.ambientGlow, { opacity: glowOpacity, backgroundColor: slide.accentColor }]} />

        {/* Skip button */}
        {currentSlide < slides.length - 1 && (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => markAndNavigate('GetStarted')}
            activeOpacity={0.7}>
            <View style={[styles.skipBtnInner, { borderColor: slide.accentColor + '60' }]}>
              <Text style={[styles.skipText, { color: slide.accentColor }]}>Bỏ qua</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Slide Illustration Image */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: Animated.multiply(imageScale, scaleAnim) }],
              opacity: fadeAnim,
            },
          ]}>
          <Animated.View style={[styles.iconGlow, { backgroundColor: slide.accentColor, opacity: glowOpacity }]} />
          <View style={[styles.imageWrapper, { borderColor: slide.accentColor + '50', shadowColor: slide.accentColor }]}>
            <Image
              source={slideImages[currentSlide]}
              style={styles.slideImage}
              resizeMode="cover"
            />
            {/* Subtle bottom fade overlay */}
            <Animated.View style={[styles.imageOverlay, { opacity: glowOpacity }]} />
          </View>
        </Animated.View>

        {/* Content Card */}
        <Animated.View
          style={[
            styles.contentCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}>
          <View style={[styles.glassCard, { borderColor: slide.accentColor + '25' }]}>
            <View style={styles.slideIndicator}>
              <Text style={[styles.slideNum, { color: slide.accentColor }]}>0{currentSlide + 1}</Text>
              <Text style={styles.slideTotal}>/ 0{slides.length}</Text>
            </View>

            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideDesc}>{slide.description}</Text>

            {/* Dots */}
            <View style={styles.dotsRow}>
              {slides.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => transitionToSlide(i)}>
                  <View
                    style={[
                      styles.dot,
                      i === currentSlide
                        ? [styles.dotActive, { backgroundColor: slide.dotColor }]
                        : styles.dotInactive,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Button */}
            <TouchableOpacity onPress={scrollToNext} activeOpacity={0.85} style={styles.btnWrapper}>
              <LinearGradient
                colors={[slide.accentColor, slide.accentColor + 'CC']}
                style={styles.nextBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                <Text style={styles.nextBtnText}>
                  {currentSlide < slides.length - 1 ? 'Tiếp Tục' : 'Bắt Đầu'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const CARD_PADDING = width * 0.05;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A' },
  bg: { flex: 1 },
  ambientGlow: {
    position: 'absolute',
    top: -height * 0.1,
    left: -width * 0.3,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    opacity: 0.12,
  },
  skipBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 48,
    right: spacing.lg,
    zIndex: 10,
  },
  skipBtnInner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skipText: { fontSize: fontSize.sm, fontWeight: '500' },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 80 : 60,
  },
  iconGlow: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    opacity: 0.15,
  },
  imageWrapper: {
    width       : width * 0.78,
    height      : width * 0.78,
    borderRadius: borderRadius.xxl + 8,
    borderWidth : 2,
    overflow    : 'hidden',
    ...shadows.lg,
  },
  slideImage: {
    width : '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  contentCard: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    padding: spacing.xl,
  },
  slideIndicator: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  slideNum: { fontSize: fontSize.xxl, fontWeight: '700', letterSpacing: 1 },
  slideTotal: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.35)', marginLeft: 4, fontWeight: '500' },
  slideTitle: {
    fontSize: Math.min(fontSize.display, width * 0.09),
    fontWeight: '800',
    color: colors.white,
    lineHeight: Math.min(fontSize.display, width * 0.09) * 1.15,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  slideDesc: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.65)', lineHeight: 26, marginBottom: spacing.xl },
  dotsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl, gap: spacing.xs },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 28 },
  dotInactive: { width: 6, backgroundColor: 'rgba(255,255,255,0.25)' },
  btnWrapper: { borderRadius: borderRadius.xl, ...shadows.lg },
  nextBtn: {
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  nextBtnText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '700', letterSpacing: 0.5 },
});

export default OnboardingScreen;
