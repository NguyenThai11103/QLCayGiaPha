/**
 * ForgotPasswordScreen – Quên mật khẩu
 * Bước 1: Nhập email → POST /auth/forgot-password → BE gửi OTP
 * Bước 2: Nhập OTP + mật khẩu mới → POST /auth/reset-password → thành công
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, Animated, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import { apiFetch } from '../genaral/api';
import CustomAlert from '../components/CustomAlert';
import { borderRadius, fontSize, spacing } from '../config/theme';

// ─────────────────────────────────────────────────────────
//  Step indicator
// ─────────────────────────────────────────────────────────
const StepBar: React.FC<{ step: 1 | 2 }> = ({ step }) => (
  <View style={sb.row}>
    {[1, 2].map(n => {
      const done   = step > n;
      const active = step === n;
      return (
        <View key={n} style={sb.item}>
          <LinearGradient
            colors={active ? ['#7C3AED', '#4F46E5'] : done ? ['#10B981', '#059669'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={[sb.circle, active && sb.circleActive]}>
            {done
              ? <Ionicons name="checkmark" size={14} color="#fff" />
              : <Text style={[sb.num, active && sb.numActive]}>{n}</Text>
            }
          </LinearGradient>
          <Text style={[sb.label, active && sb.labelActive]}>
            {n === 1 ? 'Xác minh Email' : 'Đặt lại mật khẩu'}
          </Text>
        </View>
      );
    })}
    {/* connector */}
    <View style={sb.line}>
      <Animated.View style={[sb.lineFill, { width: step >= 2 ? '100%' : '0%' }]}>
        <LinearGradient colors={['#10B981', '#059669']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      </Animated.View>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────
//  Input row
// ─────────────────────────────────────────────────────────
interface InputProps {
  icon        : string;
  placeholder : string;
  value       : string;
  onChange    : (v: string) => void;
  error      ?: string;
  secure     ?: boolean;
  showToggle ?: boolean;
  onToggle   ?: () => void;
  keyboardType?: any;
  maxLength  ?: number;
  color      ?: string;
}
const Input: React.FC<InputProps> = ({
  icon, placeholder, value, onChange, error, secure, showToggle, onToggle,
  keyboardType, maxLength, color = '#7C3AED',
}) => {
  const [focused, setFocused] = useState(false);
  const bAnim = useRef(new Animated.Value(0)).current;
  const focus = () => { setFocused(true);  Animated.spring(bAnim, { toValue: 1, tension: 120, friction: 8, useNativeDriver: false }).start(); };
  const blur  = () => { setFocused(false); Animated.spring(bAnim, { toValue: 0, tension: 120, friction: 8, useNativeDriver: false }).start(); };
  const bc    = bAnim.interpolate({ inputRange: [0, 1], outputRange: [error ? '#EF4444' : 'rgba(255,255,255,0.1)', error ? '#EF4444' : color] });
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Animated.View style={[inp.box, { borderColor: bc }]}>
        <LinearGradient colors={focused ? [color + '18', color + '08'] : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']} style={StyleSheet.absoluteFill} />
        <View style={inp.iconWrap}>
          <Ionicons name={icon as any} size={18} color={focused ? color : (error ? '#EF4444' : 'rgba(255,255,255,0.3)')} />
        </View>
        <TextInput
          style={inp.field}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={value} onChangeText={onChange}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize="none"
          maxLength={maxLength}
          onFocus={focus} onBlur={blur}
        />
        {showToggle && (
          <TouchableOpacity style={inp.toggle} onPress={onToggle}>
            <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        )}
      </Animated.View>
      {error ? (
        <View style={inp.errRow}>
          <Ionicons name="alert-circle" size={12} color="#EF4444" />
          <Text style={inp.errTxt}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

// ─────────────────────────────────────────────────────────
//  Main Screen
// ─────────────────────────────────────────────────────────
const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [step,       setStep]       = useState<1 | 2>(1);
  const [email,      setEmail]      = useState('');
  const [otp,        setOtp]        = useState('');
  const [pwd,        setPwd]        = useState('');
  const [pwdCfm,     setPwdCfm]     = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [showCfm,    setShowCfm]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [countdown,  setCountdown]  = useState(0);
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<{ visible: boolean; type: any; title: string; message: string }>({
    visible: false, type: 'info', title: '', message: '',
  });

  // Animations
  const cardAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }).start();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const slideToStep2 = () => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 30,  duration: 0,   useNativeDriver: true }),
    ]).start(() => {
      setStep(2);
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }).start();
    });
  };

  // ─── Step 1: Gửi OTP ─────────────────────────────────
  const handleSendOtp = async () => {
    if (!email.trim()) { setErrors({ email: 'Vui lòng nhập email' }); shake(); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setErrors({ email: 'Email không hợp lệ' }); shake(); return; }
    setErrors({});
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', {
        method : 'POST',
        body   : JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setCountdown(60);
      slideToStep2();
    } catch (e: any) {
      const msg = e?.message ?? e?.data?.message ?? 'Không thể gửi mã OTP. Vui lòng thử lại.';
      setErrors({ email: msg });
      shake();
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend OTP ───────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', {
        method : 'POST',
        body   : JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setCountdown(60);
    } catch (e: any) {
      setErrors({ otp: e?.message ?? 'Không thể gửi lại mã' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Đặt lại mật khẩu ────────────────────────
  const handleReset = async () => {
    const e: Record<string, string> = {};
    if (otp.length < 6)                      e.otp    = 'Mã OTP phải có 6 chữ số';
    if (!pwd)                                 e.pwd    = 'Vui lòng nhập mật khẩu mới';
    else if (pwd.length < 6)                  e.pwd    = 'Mật khẩu tối thiểu 6 ký tự';
    if (pwdCfm !== pwd)                       e.pwdCfm = 'Xác nhận mật khẩu không khớp';
    if (Object.keys(e).length > 0) { setErrors(e); shake(); return; }
    setErrors({});
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', {
        method : 'POST',
        body   : JSON.stringify({
          email            : email.trim().toLowerCase(),
          token            : otp,
          password         : pwd,
          password_confirmation: pwdCfm,
        }),
      });
      setAlert({
        visible: true, type: 'success',
        title  : 'Đặt lại thành công!',
        message: 'Mật khẩu đã được cập nhật. Vui lòng đăng nhập với mật khẩu mới.',
      });
    } catch (e: any) {
      const msg = e?.message ?? e?.data?.message ?? 'Mã OTP không đúng hoặc đã hết hạn.';
      setErrors({ otp: msg });
      shake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#050010', '#0E0A26', '#080018']} style={StyleSheet.absoluteFill} />

      {/* Orbs */}
      <View style={[s.orb, { top: -80, right: -60,   width: 240, height: 240, backgroundColor: '#7C3AED' }]} />
      <View style={[s.orb, { bottom: 120, left: -70, width: 200, height: 200, backgroundColor: '#2563EB' }]} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <View style={s.backCircle}>
              <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          </TouchableOpacity>

          {/* Header */}
          <View style={s.header}>
            <LinearGradient colors={['#7C3AED', '#4F46E5']} style={s.headerIcon}>
              <Ionicons name="lock-open" size={28} color="#fff" />
            </LinearGradient>
            <Text style={s.title}>Quên mật khẩu</Text>
            <Text style={s.subtitle}>
              {step === 1 ? 'Nhập email để nhận mã xác minh' : 'Nhập mã OTP và mật khẩu mới'}
            </Text>
          </View>

          {/* Step bar */}
          <View style={s.stepWrap}>
            <StepBar step={step} />
          </View>

          {/* Card */}
          <Animated.View style={[s.card, {
            opacity  : cardAnim,
            transform: [
              { scale: cardAnim },
              { translateX: shakeAnim },
              { translateX: slideAnim },
            ],
          }]}>

            {step === 1 ? (
              /* ── Bước 1: Email ── */
              <View>
                <View style={s.sectionHdr}>
                  <LinearGradient colors={['#7C3AED', '#4F46E5']} style={s.sectionDot} />
                  <Text style={s.sectionTxt}>Địa chỉ email</Text>
                </View>

                <Input
                  icon="mail-outline"
                  placeholder="Email đã đăng ký tài khoản"
                  value={email}
                  onChange={v => { setEmail(v); setErrors({}); }}
                  error={errors.email}
                  keyboardType="email-address"
                  color="#7C3AED"
                />

                <TouchableOpacity
                  style={[s.btn, loading && { opacity: 0.7 }]}
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.85}>
                  <LinearGradient colors={['#7C3AED', '#4F46E5']} style={s.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {loading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <>
                          <Ionicons name="send-outline" size={18} color="#fff" />
                          <Text style={s.btnTxt}>Gửi mã xác minh</Text>
                        </>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              /* ── Bước 2: OTP + Mật khẩu mới ── */
              <View>
                {/* Email badge */}
                <View style={s.emailBadge}>
                  <LinearGradient colors={['rgba(124,58,237,0.2)', 'rgba(79,70,229,0.1)']} style={s.emailBadgeGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="mail-open-outline" size={14} color="#A78BFA" />
                    <Text style={s.emailBadgeTxt} numberOfLines={1}>OTP gửi đến: <Text style={{ color: '#A78BFA', fontWeight: '700' }}>{email}</Text></Text>
                  </LinearGradient>
                </View>

                {/* OTP */}
                <View style={s.sectionHdr}>
                  <LinearGradient colors={['#7C3AED', '#4F46E5']} style={s.sectionDot} />
                  <Text style={s.sectionTxt}>Mã xác minh OTP</Text>
                </View>
                <Input
                  icon="keypad-outline"
                  placeholder="Nhập mã 6 chữ số"
                  value={otp}
                  onChange={v => { setOtp(v.replace(/[^0-9]/g, '').slice(0, 6)); setErrors(e => ({ ...e, otp: '' })); }}
                  error={errors.otp}
                  keyboardType="number-pad"
                  maxLength={6}
                  color="#7C3AED"
                />

                {/* Resend */}
                <TouchableOpacity style={s.resendRow} onPress={handleResend} disabled={countdown > 0 || loading}>
                  <Text style={s.resendTxt}>Không nhận được mã? </Text>
                  {countdown > 0
                    ? <Text style={s.resendCountdown}>Gửi lại sau {countdown}s</Text>
                    : <Text style={[s.resendLink, loading && { opacity: 0.4 }]}>Gửi lại ngay</Text>
                  }
                </TouchableOpacity>

                {/* New password */}
                <View style={[s.sectionHdr, { marginTop: spacing.md }]}>
                  <LinearGradient colors={['#4F46E5', '#2563EB']} style={s.sectionDot} />
                  <Text style={s.sectionTxt}>Mật khẩu mới</Text>
                </View>
                <Input
                  icon="lock-closed-outline"
                  placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                  value={pwd}
                  onChange={v => { setPwd(v); setErrors(e => ({ ...e, pwd: '' })); }}
                  error={errors.pwd}
                  secure={!showPwd}
                  showToggle onToggle={() => setShowPwd(!showPwd)}
                  color="#4F46E5"
                />
                <Input
                  icon="shield-checkmark-outline"
                  placeholder="Xác nhận mật khẩu mới"
                  value={pwdCfm}
                  onChange={v => { setPwdCfm(v); setErrors(e => ({ ...e, pwdCfm: '' })); }}
                  error={errors.pwdCfm}
                  secure={!showCfm}
                  showToggle onToggle={() => setShowCfm(!showCfm)}
                  color="#4F46E5"
                />

                {/* Submit */}
                <TouchableOpacity
                  style={[s.btn, loading && { opacity: 0.7 }]}
                  onPress={handleReset}
                  disabled={loading}
                  activeOpacity={0.85}>
                  <LinearGradient colors={['#4F46E5', '#2563EB']} style={s.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {loading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <>
                          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                          <Text style={s.btnTxt}>Đặt lại mật khẩu</Text>
                        </>}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Back to step 1 */}
                <TouchableOpacity style={s.backStep} onPress={() => { setStep(1); setOtp(''); setErrors({}); }}>
                  <Ionicons name="arrow-back-outline" size={14} color="rgba(167,139,250,0.6)" />
                  <Text style={s.backStepTxt}>Đổi email</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Alert */}
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert(a => ({ ...a, visible: false }))}
        buttons={[{
          text: 'Về đăng nhập', style: 'default',
          onPress: () => {
            setAlert(a => ({ ...a, visible: false }));
            navigation.navigate('Login');
          },
        }]}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root        : { flex: 1, backgroundColor: '#050010' },
  orb         : { position: 'absolute', borderRadius: 999, opacity: 0.1 },
  scroll      : { paddingHorizontal: spacing.lg },
  backBtn     : { paddingTop: Platform.OS === 'ios' ? 60 : 44, marginBottom: 8 },
  backCircle  : { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  header      : { alignItems: 'center', marginBottom: spacing.xl, marginTop: 8 },
  headerIcon  : { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  title       : { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  subtitle    : { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: 'center' },
  stepWrap    : { marginBottom: spacing.xl },
  card        : { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(167,139,250,0.15)', padding: spacing.lg, overflow: 'hidden' },
  sectionHdr  : { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionDot  : { width: 4, height: 16, borderRadius: 2 },
  sectionTxt  : { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1 },
  btn         : { borderRadius: 18, overflow: 'hidden', marginTop: 4 },
  btnGrad     : { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 18 },
  btnTxt      : { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  emailBadge  : { marginBottom: spacing.lg, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)' },
  emailBadgeGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  emailBadgeTxt : { fontSize: 12, color: 'rgba(255,255,255,0.5)', flex: 1 },
  resendRow   : { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm, marginTop: -4 },
  resendTxt   : { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  resendLink  : { fontSize: 12, color: '#A78BFA', fontWeight: '700' },
  resendCountdown: { fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: '600' },
  backStep    : { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: spacing.md },
  backStepTxt : { fontSize: 12, color: 'rgba(167,139,250,0.6)', fontWeight: '600' },
});

const sb = StyleSheet.create({
  row    : { flexDirection: 'row', alignItems: 'center', position: 'relative', paddingHorizontal: 20 },
  item   : { alignItems: 'center', gap: 6, flex: 1 },
  circle : { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  circleActive: { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
  num    : { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.3)' },
  numActive: { color: '#fff' },
  label  : { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  labelActive: { color: '#A78BFA' },
  line   : { position: 'absolute', top: 18, left: '25%', width: '50%', height: 2, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 1, zIndex: -1, overflow: 'hidden' },
  lineFill: { height: '100%', borderRadius: 1, overflow: 'hidden' },
});

const inp = StyleSheet.create({
  box    : { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, overflow: 'hidden', height: 54 },
  iconWrap: { width: 46, alignItems: 'center', justifyContent: 'center' },
  field  : { flex: 1, fontSize: 14, color: '#fff', paddingRight: 12 },
  toggle : { paddingRight: 14, paddingLeft: 4 },
  errRow : { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, marginLeft: 4 },
  errTxt : { fontSize: 11, color: '#EF4444', fontWeight: '500' },
});

export default ForgotPasswordScreen;
