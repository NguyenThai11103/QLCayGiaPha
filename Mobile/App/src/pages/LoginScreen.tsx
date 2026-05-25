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
  Linking,
  ActivityIndicator,
} from 'react-native';
import TreeLoadingAnimation from '../components/TreeLoadingAnimation';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import { colors, spacing, fontSize, borderRadius, shadows } from '../config/theme';
import { loginApi } from '../genaral/authService';
import { apiFetch, BASE_URL, STORAGE_TOKEN_KEY } from '../genaral/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Google Sign-In states
  const [googleStep,   setGoogleStep]   = useState<'idle' | 'otp'>('idle');
  const [googleLoading,setGoogleLoading] = useState(false);
  const [googleEmail,  setGoogleEmail]  = useState('');
  const [googleOtp,    setGoogleOtp]    = useState('');
  const [googleErr,    setGoogleErr]    = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const otpAnim = useRef(new Animated.Value(0)).current;

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

  // ─── Google OAuth flow ──────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleErr('');
    setGoogleLoading(true);
    try {
      // 1. Lấy Google Auth URL từ BE
      const urlRes = await apiFetch<{ success: boolean; url: string }>('/auth/google/url');
      const authUrl = urlRes.url;

      // 2. Parse code từ URL (mock mode trả về ?code=mock_authorization_code)
      const urlObj = new URL(authUrl);
      const code   = urlObj.searchParams.get('code');

      if (!code) {
        setGoogleErr('Chế độ production cần WebView. Hiện chỉ hỗ trợ mock mode.');
        return;
      }

      // 3. Gọi POST /auth/google/callback → BE xử lý + gửi OTP về email
      const cbRes = await apiFetch<{ success: boolean; need_otp: boolean; email: string }>(
        '/auth/google/callback',
        { method: 'POST', body: JSON.stringify({ code }) },
      );

      // 4. Pre-fill email từ response
      if (cbRes.email) setGoogleEmail(cbRes.email);

      // 5. Hiện modal nhập OTP
      setGoogleStep('otp');
      setShowGoogleModal(true);
      Animated.spring(otpAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }).start();
    } catch (e: any) {
      setGoogleErr(e?.message ?? 'Không thể kết nối Google. Thử lại sau.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleVerifyOtp = async () => {
    if (!googleEmail.trim()) { setGoogleErr('Vui lòng nhập email của bạn'); return; }
    if (googleOtp.length < 6) { setGoogleErr('Mã OTP phải có 6 chữ số'); return; }
    setGoogleLoading(true);
    setGoogleErr('');
    try {
      const res = await apiFetch<{ success: boolean; data: { user: any; token: string } }>(
        '/auth/google/verify-otp',
        { method: 'POST', body: JSON.stringify({ email: googleEmail.trim(), token: googleOtp }) },
      );
      // Lưu token + user
      await AsyncStorage.setItem(STORAGE_TOKEN_KEY, res.data.token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(res.data.user));
      setShowGoogleModal(false);
      navigation.replace('Home');
    } catch (e: any) {
      setGoogleErr(e?.message ?? 'Mã OTP không đúng hoặc đã hết hạn');
    } finally {
      setGoogleLoading(false);
    }
  };

  const closeGoogleModal = () => {
    setShowGoogleModal(false);
    setGoogleStep('idle');
    setGoogleEmail('');
    setGoogleOtp('');
    setGoogleErr('');
    otpAnim.setValue(0);
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
            <TouchableOpacity style={styles.forgotWrap} onPress={() => navigation.navigate('ForgotPassword')}>
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

              {/* Google Button */}
              <TouchableOpacity
                style={[styles.socialBtn, styles.googleBtn]}
                activeOpacity={0.75}
                onPress={handleGoogleLogin}
                disabled={googleLoading}>
                {googleLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                      <View style={styles.googleIconCircle}>
                        <Text style={styles.googleIconTxt}>G</Text>
                      </View>
                      <Text style={styles.googleLabel}>Google</Text>
                    </>}
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

      {/* ── Google OTP Modal ── */}
      <Modal visible={showGoogleModal} transparent animationType="none" statusBarTranslucent onRequestClose={closeGoogleModal}>
        <View style={styles.googleOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeGoogleModal} activeOpacity={1} />
          <Animated.View style={[styles.googleSheet, {
            opacity  : otpAnim,
            transform: [{ translateY: otpAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }],
          }]}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            {/* Google icon header */}
            <View style={styles.googleHeader}>
              <LinearGradient colors={['#EA4335', '#DB4437']} style={styles.gIconLg}>
                <Text style={styles.gIconTxt}>G</Text>
              </LinearGradient>
              <Text style={styles.googleSheetTitle}>Xác nhập đăng nhập Google</Text>
              <Text style={styles.googleSheetSub}>
                Mã OTP đã được gửi về email Google của bạn.
                Vui lòng kiểm tra hộp thư.
              </Text>
            </View>

            {/* Email input */}
            <View style={styles.otpFieldWrap}>
              <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.35)" />
              <TextInput
                style={styles.otpInput}
                placeholder="Email Google của bạn"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={googleEmail}
                onChangeText={t => { setGoogleEmail(t); setGoogleErr(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* OTP input */}
            <View style={[styles.otpFieldWrap, { marginTop: 12 }]}>
              <Ionicons name="keypad-outline" size={18} color="rgba(255,255,255,0.35)" />
              <TextInput
                style={[styles.otpInput, styles.otpCode]}
                placeholder="Mã OTP 6 chữ số"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={googleOtp}
                onChangeText={t => { setGoogleOtp(t.replace(/[^0-9]/g, '').slice(0, 6)); setGoogleErr(''); }}
                keyboardType="number-pad"
                maxLength={6}
              />
              {googleOtp.length > 0 && (
                <Text style={styles.otpCount}>{googleOtp.length}/6</Text>
              )}
            </View>

            {/* Error */}
            {googleErr ? (
              <View style={styles.googleErrRow}>
                <Ionicons name="alert-circle" size={14} color="#FCA5A5" />
                <Text style={styles.googleErrTxt}>{googleErr}</Text>
              </View>
            ) : null}

            {/* Confirm button */}
            <TouchableOpacity
              style={[styles.confirmBtn, googleLoading && { opacity: 0.7 }]}
              onPress={handleGoogleVerifyOtp}
              disabled={googleLoading}
              activeOpacity={0.85}>
              <LinearGradient colors={['#EA4335', '#C62828']} style={styles.confirmGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {googleLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                      <Text style={styles.confirmTxt}>Xác nhập OTP</Text>
                    </>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendRow} onPress={handleGoogleLogin} disabled={googleLoading}>
              <Text style={styles.resendTxt}>Chưa nhận mã? </Text>
              <Text style={styles.resendLink}>Mở lại Google</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

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

  // Google button
  googleBtn         : { borderColor: 'rgba(219,68,55,0.3)', backgroundColor: 'rgba(219,68,55,0.07)' },
  googleIconCircle  : { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  googleIconTxt     : { fontSize: 13, fontWeight: '900', color: '#EA4335' },
  googleLabel       : { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },

  // Google OTP Modal
  googleOverlay   : { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  googleSheet     : {
    backgroundColor: '#10082A', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    borderWidth: 1, borderColor: 'rgba(234,67,53,0.25)',
    padding: spacing.xl, paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },
  sheetHandle     : { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 24 },
  googleHeader    : { alignItems: 'center', marginBottom: 24 },
  gIconLg         : { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  gIconTxt        : { fontSize: 28, fontWeight: '900', color: '#fff' },
  googleSheetTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  googleSheetSub  : { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  otpFieldWrap    : {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 52, paddingHorizontal: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(234,67,53,0.3)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  otpInput        : { flex: 1, fontSize: 14, color: '#fff' },
  otpCode         : { fontSize: 22, fontWeight: '800', letterSpacing: 4, color: '#EA4335' },
  otpCount        : { fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },
  googleErrRow    : { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  googleErrTxt    : { fontSize: 12, color: '#FCA5A5', flex: 1 },
  confirmBtn      : { borderRadius: 16, overflow: 'hidden', marginTop: 20 },
  confirmGrad     : { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 16 },
  confirmTxt      : { fontSize: 15, fontWeight: '800', color: '#fff' },
  resendRow       : { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
  resendTxt       : { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  resendLink      : { fontSize: 13, color: '#EA4335', fontWeight: '700' },

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
