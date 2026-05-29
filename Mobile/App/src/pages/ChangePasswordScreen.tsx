/**
 * ChangePasswordScreen – Đổi mật khẩu
 * Premium glassmorphism UI · Kết nối API POST /auth/change-password
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  Platform, Animated, TextInput, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../genaral/api';
import { STORAGE_TOKEN_KEY } from '../genaral/authService';
import { colors, spacing, fontSize, borderRadius, rs, rvs, rf } from '../config/theme';
import { useTheme } from '../context/ThemeContext';

const ChangePasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const [matKhauCu,    setMatKhauCu]    = useState('');
  const [matKhauMoi,   setMatKhauMoi]   = useState('');
  const [xacNhanMK,    setXacNhanMK]    = useState('');
  const [showCu,       setShowCu]       = useState(false);
  const [showMoi,      setShowMoi]      = useState(false);
  const [showXacNhan,  setShowXacNhan]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const headerAnim = useRef(new Animated.Value(0)).current;

  const bgColor    = theme.dark ? '#070712' : '#F5F7FA';
  const textColor  = theme.dark ? '#fff' : colors.gray[800];
  const mutedColor = theme.dark ? 'rgba(255,255,255,0.45)' : colors.gray[500];
  const inputBg    = theme.dark ? 'rgba(255,255,255,0.06)' : colors.white;
  const inputBorder= theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  React.useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1, tension: 50, friction: 10, useNativeDriver: true,
    }).start();
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!matKhauCu.trim())        e.cu  = 'Vui lòng nhập mật khẩu hiện tại';
    if (matKhauMoi.length < 8)    e.moi = 'Mật khẩu mới phải ít nhất 8 ký tự';
    if (matKhauMoi !== xacNhanMK) e.xn  = 'Mật khẩu xác nhận không khớp';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
      await apiFetch(
        '/auth/change-password',
        {
          method: 'POST',
          body: JSON.stringify({
            mat_khau_cu  : matKhauCu,
            mat_khau_moi : matKhauMoi,
            xac_nhan_mk  : xacNhanMK,
          }),
        },
        token ?? undefined,
      );
      Alert.alert(
        '✅ Thành công',
        'Mật khẩu của bạn đã được đổi thành công. Vui lòng đăng nhập lại nếu cần.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (e: any) {
      const msg = e?.message ?? 'Mật khẩu hiện tại không đúng hoặc đã xảy ra lỗi.';
      Alert.alert('Không thể đổi mật khẩu', msg);
    } finally {
      setLoading(false);
    }
  };

  const InputField: React.FC<{
    label      : string;
    icon       : string;
    color      : string;
    value      : string;
    onChangeText: (t: string) => void;
    show       : boolean;
    onToggle   : () => void;
    error      ?: string;
    placeholder: string;
  }> = ({ label, icon, color, value, onChangeText, show, onToggle, error, placeholder }) => (
    <View style={f.wrap}>
      <Text style={[f.label, { color: mutedColor }]}>{label}</Text>
      <View style={[f.row, { backgroundColor: inputBg, borderColor: error ? '#EF4444' : inputBorder }]}>
        <View style={[f.iconBox, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon as any} size={18} color={color} />
        </View>
        <TextInput
          style={[f.input, { color: textColor }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          placeholder={placeholder}
          placeholderTextColor={mutedColor}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={onToggle} style={f.eyeBtn}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={mutedColor} />
        </TouchableOpacity>
      </View>
      {error && (
        <View style={f.errorRow}>
          <Ionicons name="alert-circle-outline" size={12} color="#EF4444" />
          <Text style={f.errorTxt}>{error}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[s.root, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        translucent backgroundColor="transparent"
      />
      <LinearGradient
        colors={theme.dark ? ['#070712','#1A0030','#070712'] : ['#F5F7FA','#EEF2FF','#F5F7FA']}
        style={StyleSheet.absoluteFill}
      />
      {theme.dark && (
        <>
          <View style={[s.orb, { top: -60, right: -50, backgroundColor: '#7C3AED' }]} />
          <View style={[s.orb, { bottom: 100, left: -60, backgroundColor: '#2563EB', width: rs(180), height: rs(180) }]} />
        </>
      )}

      {/* Header */}
      <Animated.View style={[s.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-20,0] }) }],
      }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <LinearGradient
            colors={theme.dark ? ['rgba(124,58,237,0.15)','rgba(124,58,237,0.08)'] : ['rgba(108,99,255,0.1)','rgba(108,99,255,0.05)']}
            style={s.backCircle}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
          </LinearGradient>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerSub, { color: theme.dark ? 'rgba(167,139,250,0.6)' : colors.gray[500] }]}>BẢO MẬT</Text>
          <Text style={[s.headerTitle, { color: textColor }]}>Đổi Mật Khẩu</Text>
        </View>
        <View style={{ width: rs(40) }} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icon banner */}
        <View style={s.bannerWrap}>
          <LinearGradient colors={['#7C3AED','#4F46E5']} style={s.bannerIcon}>
            <Ionicons name="lock-closed" size={rs(32)} color="#fff" />
          </LinearGradient>
          <Text style={[s.bannerTitle, { color: textColor }]}>Cập nhật bảo mật tài khoản</Text>
          <Text style={[s.bannerSub, { color: mutedColor }]}>
            Sử dụng mật khẩu mạnh kết hợp chữ, số và ký tự đặc biệt để bảo vệ tài khoản tốt hơn.
          </Text>
        </View>

        {/* Form */}
        <View style={[s.card, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.04)' : colors.white, borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <InputField
            label="Mật khẩu hiện tại"
            icon="lock-closed-outline"
            color="#A78BFA"
            value={matKhauCu}
            onChangeText={t => { setMatKhauCu(t); setErrors(p => ({ ...p, cu: '' })); }}
            show={showCu}
            onToggle={() => setShowCu(v => !v)}
            error={errors.cu}
            placeholder="Nhập mật khẩu hiện tại"
          />

          <View style={[s.divider, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />

          <InputField
            label="Mật khẩu mới"
            icon="key-outline"
            color="#6C63FF"
            value={matKhauMoi}
            onChangeText={t => { setMatKhauMoi(t); setErrors(p => ({ ...p, moi: '' })); }}
            show={showMoi}
            onToggle={() => setShowMoi(v => !v)}
            error={errors.moi}
            placeholder="Tối thiểu 8 ký tự"
          />

          <InputField
            label="Xác nhận mật khẩu mới"
            icon="shield-checkmark-outline"
            color="#10B981"
            value={xacNhanMK}
            onChangeText={t => { setXacNhanMK(t); setErrors(p => ({ ...p, xn: '' })); }}
            show={showXacNhan}
            onToggle={() => setShowXacNhan(v => !v)}
            error={errors.xn}
            placeholder="Nhập lại mật khẩu mới"
          />
        </View>

        {/* Strength hints */}
        <View style={s.hintsWrap}>
          {[
            { ok: matKhauMoi.length >= 8,            txt: 'Ít nhất 8 ký tự' },
            { ok: /[A-Z]/.test(matKhauMoi),          txt: 'Có chữ hoa' },
            { ok: /[0-9]/.test(matKhauMoi),          txt: 'Có chữ số' },
            { ok: /[^A-Za-z0-9]/.test(matKhauMoi),  txt: 'Có ký tự đặc biệt' },
          ].map((h, i) => (
            <View key={i} style={s.hintRow}>
              <Ionicons
                name={h.ok ? 'checkmark-circle' : 'ellipse-outline'}
                size={14}
                color={h.ok ? '#10B981' : mutedColor}
              />
              <Text style={[s.hintTxt, { color: h.ok ? '#10B981' : mutedColor }]}>{h.txt}</Text>
            </View>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={loading}
        >
          <LinearGradient colors={['#7C3AED','#4F46E5']} style={s.submitGrad}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="lock-closed-outline" size={18} color="#fff" />
                <Text style={s.submitTxt}>Đổi mật khẩu</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: rvs(40) }} />
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root        : { flex: 1 },
  orb         : { position: 'absolute', width: rs(240), height: rs(240), borderRadius: rs(120), opacity: 0.09 },
  header      : {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? rvs(60) : rvs(48),
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  backBtn     : { borderRadius: rs(12), overflow: 'hidden' },
  backCircle  : {
    width: rs(40), height: rs(40), borderRadius: rs(12),
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
  },
  headerCenter: { alignItems: 'center' },
  headerSub   : { fontSize: rf(9), fontWeight: '800', letterSpacing: 2.5 },
  headerTitle : { fontSize: rf(20), fontWeight: '900', letterSpacing: -0.5 },
  scroll      : { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  bannerWrap  : { alignItems: 'center', marginBottom: spacing.xl },
  bannerIcon  : {
    width: rs(72), height: rs(72), borderRadius: rs(22),
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: rs(6) },
    shadowOpacity: 0.35, shadowRadius: rs(12), elevation: 8,
  },
  bannerTitle : { fontSize: rf(18), fontWeight: '800', textAlign: 'center', marginBottom: rs(6) },
  bannerSub   : { fontSize: rf(13), textAlign: 'center', lineHeight: rf(20), paddingHorizontal: rs(20) },
  card        : {
    borderRadius: rs(20), borderWidth: 1,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    marginBottom: spacing.md, gap: spacing.sm,
  },
  divider     : { height: 1, marginVertical: spacing.xs },
  hintsWrap   : { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10), marginBottom: spacing.xl },
  hintRow     : { flexDirection: 'row', alignItems: 'center', gap: rs(5), width: '48%' },
  hintTxt     : { fontSize: rf(11), fontWeight: '600' },
  submitBtn   : { borderRadius: rs(18), overflow: 'hidden', marginBottom: spacing.md },
  submitGrad  : {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: rs(8), paddingVertical: rvs(16),
  },
  submitTxt   : { fontSize: rf(16), fontWeight: '800', color: '#fff' },
});

const f = StyleSheet.create({
  wrap    : { gap: rs(6) },
  label   : { fontSize: rf(11), fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  row     : {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: rs(14), borderWidth: 1.5, overflow: 'hidden',
  },
  iconBox : {
    width: rs(46), height: rs(46),
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  input   : { flex: 1, fontSize: rf(14), fontWeight: '500', paddingVertical: rvs(12) },
  eyeBtn  : { paddingHorizontal: rs(12) },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: rs(4), marginTop: rs(2) },
  errorTxt: { fontSize: rf(11), color: '#EF4444', fontWeight: '600' },
});

export default ChangePasswordScreen;
