import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import TreeLoadingAnimation from '../components/TreeLoadingAnimation';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import { colors, spacing, fontSize, borderRadius, shadows } from '../config/theme';
import { loginApi } from '../genaral/authService';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; server?: string }>({});

  const cardAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!password) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) { shakeError(); return; }

    setIsLoading(true);
    setErrors({});

    try {
      await loginApi({ email: email.trim(), password });
      // ✅ Đăng nhập thành công
      navigation.replace('Home');
    } catch (err: any) {
      shakeError();

      // ── DEBUG LOG ──────────────────────────────────────
      console.log('═══════ LOGIN ERROR ═══════');
      console.log('Full error object :', JSON.stringify(err, null, 2));
      console.log('status            :', err?.status);
      console.log('message           :', err?.message);
      console.log('data              :', JSON.stringify(err?.data, null, 2));
      console.log('═══════════════════════════');
      // ───────────────────────────────────────────────────

      const status  = err?.status  as number | undefined;
      const message = (err?.message as string) ?? 'Không thể kết nối máy chủ';

      if (status === 401) {
        setErrors({ server: 'Email hoặc mật khẩu không chính xác' });
      } else if (status === 422) {
        const laravelErrors = (err?.data?.errors ?? {}) as Record<string, string[]>;
        setErrors({
          email    : laravelErrors?.email?.[0],
          password : laravelErrors?.password?.[0],
        });
      } else if (status === 408) {
        setErrors({ server: 'Kết nối quá thời gian, kiểm tra lại mạng' });
      } else {
        setErrors({ server: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const FIELD_HEIGHT = Math.max(52, height * 0.065);
  const cardTranslateY = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.55] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0A0A1A', '#110D2E', '#0A0A1A']} style={StyleSheet.absoluteFill} />

      <Animated.View style={[styles.glowTL, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.glowBR, { opacity: glowOpacity }]} />

      {/* Top header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(79,70,229,0.1)']} style={styles.backBtnGrad}>
            <Ionicons name="arrow-back" size={20} color="#A78BFA" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.headerBrand}>
          <Ionicons name="leaf" size={28} color="#6C63FF" />
        </View>

        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          <View style={styles.welcomeBlock}>
            <Text style={styles.welcomeGreeting}>Chào mừng trở lại</Text>
            <Text style={styles.welcomeTitle}>Đăng Nhập</Text>
            <Text style={styles.welcomeSub}>Tiếp tục xây dựng cây gia phả của bạn</Text>
          </View>

          {/* Form Card */}
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: cardAnim,
                transform: [{ translateY: cardTranslateY }, { translateX: shakeAnim }],
              },
            ]}>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={[
                styles.fieldWrap, { height: FIELD_HEIGHT },
                focusedField === 'email' && styles.fieldFocused,
                errors.email && styles.fieldError,
              ]}>
                <Ionicons name="mail" size={18} color={focusedField === 'email' ? '#6C63FF' : 'rgba(255,255,255,0.35)'} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.fieldInput, { height: FIELD_HEIGHT }]}
                  placeholder="nhập email của bạn"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={email}
                  onChangeText={t => { setEmail(t); if (errors.email) setErrors({ ...errors, email: undefined }); }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {email.length > 0 && (
                  <TouchableOpacity onPress={() => setEmail('')}>
                    <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                )}
              </View>
              {errors.email && (
                <View style={styles.errRow}>
                  <Ionicons name="alert-circle" size={13} color="#FCA5A5" />
                  <Text style={styles.errMsg}> {errors.email}</Text>
                </View>
              )}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Mật khẩu</Text>
              <View style={[
                styles.fieldWrap, { height: FIELD_HEIGHT },
                focusedField === 'password' && styles.fieldFocused,
                errors.password && styles.fieldError,
              ]}>
                <Ionicons name="lock-closed" size={18} color={focusedField === 'password' ? '#6C63FF' : 'rgba(255,255,255,0.35)'} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.fieldInput, { height: FIELD_HEIGHT }]}
                  placeholder="nhập mật khẩu"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={password}
                  onChangeText={t => { setPassword(t); if (errors.password || errors.server) setErrors({ ...errors, password: undefined, server: undefined }); }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={18} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <View style={styles.errRow}>
                  <Ionicons name="alert-circle" size={13} color="#FCA5A5" />
                  <Text style={styles.errMsg}> {errors.password}</Text>
                </View>
              )}
            </View>

            {/* Forgot */}
            <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            {/* Server error banner */}
            {errors.server && (
              <View style={styles.serverErrBanner}>
                <Ionicons name="warning" size={16} color="#FCA5A5" />
                <Text style={styles.serverErrText}>{errors.server}</Text>
              </View>
            )}

            {/* Login button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
              style={styles.loginBtnWrap}>
              <LinearGradient
                colors={isLoading ? ['#374151', '#4B5563'] : ['#6C63FF', '#4F46E5']}
                style={styles.loginBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                <Ionicons name="log-in" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.loginBtnText}>Đăng Nhập</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divRow}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>hoặc đăng nhập với</Text>
              <View style={styles.divLine} />
            </View>

            {/* Social */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.75}>
                <Ionicons name="logo-apple" size={20} color="#fff" />
                <Text style={styles.socialLabel}>Apple</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.75}>
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text style={styles.socialLabel}>Google</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Register link */}
          <View style={styles.regLinkRow}>
            <Text style={styles.regLinkText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.regLinkCta}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Loading overlay: cây mọc cành ── */}
      <Modal visible={isLoading} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <TreeLoadingAnimation />
            <Text style={styles.loadingTitle}>Đang đăng nhập...</Text>
            <Text style={styles.loadingSubtitle}>Cây gia phả đang mọc lên 🌳</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A' },
  glowTL: {
    position: 'absolute', top: -100, left: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: '#6C63FF', opacity: 0.12,
  },
  glowBR: {
    position: 'absolute', bottom: 80, right: -80,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#4F46E5', opacity: 0.1,
  },
  topHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  backBtn: { borderRadius: borderRadius.md, overflow: 'hidden' },
  backBtnGrad: {
    width: 44, height: 44, borderRadius: borderRadius.md,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)',
  },
  headerBrand: { alignItems: 'center' },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  welcomeBlock: { marginBottom: spacing.xl },
  welcomeGreeting: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.45)', marginBottom: spacing.xs, letterSpacing: 0.3 },
  welcomeTitle: {
    fontSize: Math.min(fontSize.hero, width * 0.1), fontWeight: '800',
    color: colors.white, letterSpacing: -1, marginBottom: spacing.xs,
  },
  welcomeSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.4)', lineHeight: 22 },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.xxl, borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)', padding: spacing.xl, marginBottom: spacing.lg,
  },
  fieldGroup: { marginBottom: spacing.lg },
  fieldLabel: {
    fontSize: fontSize.xs, fontWeight: '600', color: 'rgba(255,255,255,0.55)',
    marginBottom: spacing.xs + 2, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: borderRadius.lg, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: spacing.md,
  },
  fieldFocused: { borderColor: '#6C63FF', backgroundColor: 'rgba(108, 99, 255, 0.08)' },
  fieldError: { borderColor: colors.error, backgroundColor: 'rgba(239, 68, 68, 0.07)' },
  fieldIcon: { marginRight: spacing.sm },
  fieldInput: { flex: 1, fontSize: fontSize.md, color: colors.white },
  eyeBtn: { padding: spacing.xs },
  errRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  errMsg: { fontSize: fontSize.xs, color: '#FCA5A5', fontWeight: '500' },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -spacing.xs, marginBottom: spacing.lg },
  forgotText: { fontSize: fontSize.sm, color: '#A78BFA', fontWeight: '600' },
  serverErrBanner: {
    flexDirection      : 'row',
    alignItems         : 'center',
    backgroundColor    : 'rgba(239, 68, 68, 0.12)',
    borderWidth        : 1,
    borderColor        : 'rgba(239, 68, 68, 0.35)',
    borderRadius       : borderRadius.md,
    paddingHorizontal  : spacing.md,
    paddingVertical    : spacing.sm,
    marginBottom       : spacing.md,
    gap                : spacing.xs,
  },
  serverErrText: { flex: 1, fontSize: fontSize.sm, color: '#FCA5A5', fontWeight: '500', lineHeight: 20 },
  loginBtnWrap: { borderRadius: borderRadius.xl, marginBottom: spacing.lg, ...shadows.lg },
  loginBtn: {
    borderRadius: borderRadius.xl, paddingVertical: spacing.md + 2,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  loginBtnText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '700', letterSpacing: 0.3 },
  divRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, gap: spacing.sm },
  divLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  divText: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.3)', fontWeight: '500' },
  socialRow: { flexDirection: 'row', gap: spacing.md },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 48, borderRadius: borderRadius.lg, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)', gap: spacing.xs,
  },
  socialLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  regLinkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  regLinkText: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.4)' },
  regLinkCta: { fontSize: fontSize.md, color: '#A78BFA', fontWeight: '700' },

  // Loading overlay
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 26, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    width: 280,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 28,
    backgroundColor: 'rgba(15, 10, 40, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(240, 192, 96, 0.35)',
    alignItems: 'center',
  },

  loadingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F0C060',
    marginTop: 6,
    letterSpacing: 0.4,
  },
  loadingSubtitle: {
    fontSize: 12,
    color: 'rgba(220, 200, 255, 0.6)',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default LoginScreen;
