/**
 * RegisterScreen – Tạo tài khoản thành viên mới
 * Fields BE: ho_ten, email, password, dong_ho_id (optional)
 * API: POST /nguoi-dung/create (requires auth token)
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  Animated, ActivityIndicator, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, STORAGE_TOKEN_KEY } from '../genaral/api';
import CustomAlert from '../components/CustomAlert';
import { borderRadius, fontSize, spacing } from '../config/theme';

const { width: SW } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────
//  Types & initial state
// ─────────────────────────────────────────────────────────
interface FormData {
  ho_ten        : string;
  email         : string;
  password      : string;
  password_cfm  : string;
}

interface DongHo { id: number; ten_dong_ho: string; }

const INIT: FormData = { ho_ten: '', email: '', password: '', password_cfm: '' };

// ─────────────────────────────────────────────────────────
//  Input component
// ─────────────────────────────────────────────────────────
interface InputProps {
  icon       : string;
  placeholder: string;
  value      : string;
  onChange   : (v: string) => void;
  error      ?: string;
  secure     ?: boolean;
  showToggle ?: boolean;
  onToggle   ?: () => void;
  keyboardType?: any;
  autoCapitalize?: any;
}

const Input: React.FC<InputProps> = ({
  icon, placeholder, value, onChange, error,
  secure = false, showToggle, onToggle, keyboardType, autoCapitalize,
}) => {
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.spring(focusAnim, { toValue: 1, tension: 120, friction: 8, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.spring(focusAnim, { toValue: 0, tension: 120, friction: 8, useNativeDriver: false }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange : [0, 1],
    outputRange: [error ? '#EF4444' : 'rgba(167,139,250,0.15)', error ? '#EF4444' : '#7C3AED'],
  });

  return (
    <View style={inp.wrap}>
      <Animated.View style={[inp.box, { borderColor }]}>
        <LinearGradient
          colors={focused ? ['rgba(124,58,237,0.12)', 'rgba(79,70,229,0.06)'] : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={inp.iconWrap}>
          <Ionicons name={icon as any} size={18} color={focused ? '#A78BFA' : (error ? '#EF4444' : 'rgba(255,255,255,0.3)')} />
        </View>
        <TextInput
          style={inp.field}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={value}
          onChangeText={onChange}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          onFocus={onFocus}
          onBlur={onBlur}
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
const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [form,       setForm]       = useState<FormData>(INIT);
  const [errors,     setErrors]     = useState<Partial<FormData>>({});
  const [showPwd,    setShowPwd]    = useState(false);
  const [showCfm,    setShowCfm]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [dongHoList, setDongHoList] = useState<DongHo[]>([]);
  const [selectedDH, setSelectedDH] = useState<DongHo | null>(null);
  const [showDHPick, setShowDHPick] = useState(false);
  const [alert, setAlert] = useState<{ visible: boolean; type: any; title: string; message: string }>({
    visible: false, type: 'info', title: '', message: '',
  });

  // Animations
  const cardAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }).start();
    loadDongHo();
  }, []);

  const loadDongHo = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
      if (!token) return;
      const res = await apiFetch<{ data: DongHo[] }>('/dong-ho/list', {}, token);
      setDongHoList(res.data ?? []);
    } catch {}
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const field = (key: keyof FormData) => (val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.ho_ten.trim())                        e.ho_ten = 'Vui lòng nhập họ tên';
    if (!form.email.trim())                          e.email  = 'Vui lòng nhập email';
    else if (!/\S+@\S+\.\S+/.test(form.email))       e.email  = 'Email không hợp lệ';
    if (!form.password)                              e.password = 'Vui lòng nhập mật khẩu';
    else if (form.password.length < 6)               e.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (form.password_cfm !== form.password)         e.password_cfm = 'Mật khẩu xác nhận không khớp';
    setErrors(e);
    if (Object.keys(e).length > 0) { shake(); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
      if (!token) {
        setAlert({ visible: true, type: 'warning', title: 'Chưa đăng nhập', message: 'Bạn cần đăng nhập với tư cách quản lý để tạo tài khoản mới.' });
        return;
      }

      const payload: Record<string, any> = {
        ho_ten   : form.ho_ten.trim(),
        email    : form.email.trim().toLowerCase(),
        password : form.password,
        quyen_han: 'thanh_vien',
      };
      if (selectedDH) payload.dong_ho_id = selectedDH.id;

      await apiFetch('/nguoi-dung/create', {
        method : 'POST',
        body   : JSON.stringify(payload),
      }, token);

      setAlert({
        visible: true, type: 'success',
        title  : 'Tạo tài khoản thành công!',
        message: `Tài khoản cho "${form.ho_ten.trim()}" đã được tạo.`,
      });
    } catch (e: any) {
      const msg = e?.message ?? e?.data?.message ?? 'Đã xảy ra lỗi, vui lòng thử lại.';
      setAlert({ visible: true, type: 'error', title: 'Tạo thất bại', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setAlert(a => ({ ...a, visible: false }));
    setForm(INIT);
    setSelectedDH(null);
    navigation.goBack();
  };

  const progress = [
    { done: form.ho_ten.length > 0 },
    { done: form.email.length > 4 && form.email.includes('@') },
    { done: form.password.length >= 6 },
    { done: form.password_cfm === form.password && form.password_cfm.length > 0 },
  ];
  const progressPct = progress.filter(p => p.done).length / progress.length;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#050010', '#0E0A26', '#080018']} style={StyleSheet.absoluteFill} />

      {/* Orbs */}
      <View style={[s.orb, { top: -100, left: -80, width: 300, height: 300, backgroundColor: '#7C3AED' }]} />
      <View style={[s.orb, { bottom: 100, right: -80, width: 220, height: 220, backgroundColor: '#1D4ED8' }]} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <View style={s.backCircle}>
              <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          </TouchableOpacity>

          {/* Header */}
          <View style={s.header}>
            <LinearGradient colors={['#7C3AED', '#4F46E5']} style={s.headerIcon}>
              <Ionicons name="person-add" size={26} color="#fff" />
            </LinearGradient>
            <Text style={s.title}>Tạo tài khoản</Text>
            <Text style={s.subtitle}>Thêm thành viên mới vào hệ thống</Text>
          </View>

          {/* Progress bar */}
          <View style={s.progressWrap}>
            <View style={s.progressTrack}>
              <Animated.View style={[s.progressFill, { width: `${progressPct * 100}%` }]}>
                <LinearGradient colors={['#7C3AED', '#4F46E5', '#2563EB']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              </Animated.View>
            </View>
            <Text style={s.progressTxt}>{Math.round(progressPct * 100)}% hoàn thành</Text>
          </View>

          {/* Card */}
          <Animated.View style={[s.card, { opacity: cardAnim, transform: [{ scale: cardAnim }, { translateX: shakeAnim }] }]}>

            {/* Section: Thông tin */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <LinearGradient colors={['#7C3AED', '#4F46E5']} style={s.sectionDot} />
                <Text style={s.sectionTitle}>Thông tin cá nhân</Text>
              </View>

              <Input
                icon="person-outline"
                placeholder="Họ và tên đầy đủ"
                value={form.ho_ten}
                onChange={field('ho_ten')}
                error={errors.ho_ten}
                autoCapitalize="words"
              />
              <Input
                icon="mail-outline"
                placeholder="Địa chỉ email"
                value={form.email}
                onChange={field('email')}
                error={errors.email}
                keyboardType="email-address"
              />
            </View>

            {/* Section: Mật khẩu */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <LinearGradient colors={['#4F46E5', '#2563EB']} style={s.sectionDot} />
                <Text style={s.sectionTitle}>Bảo mật</Text>
              </View>

              <Input
                icon="lock-closed-outline"
                placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                value={form.password}
                onChange={field('password')}
                error={errors.password}
                secure={!showPwd}
                showToggle
                onToggle={() => setShowPwd(!showPwd)}
              />
              <Input
                icon="shield-checkmark-outline"
                placeholder="Xác nhận mật khẩu"
                value={form.password_cfm}
                onChange={field('password_cfm')}
                error={errors.password_cfm}
                secure={!showCfm}
                showToggle
                onToggle={() => setShowCfm(!showCfm)}
              />
            </View>

            {/* Section: Dòng họ */}
            {dongHoList.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <LinearGradient colors={['#059669', '#047857']} style={s.sectionDot} />
                  <Text style={s.sectionTitle}>Dòng họ (tuỳ chọn)</Text>
                </View>

                <TouchableOpacity style={dh.picker} onPress={() => setShowDHPick(!showDHPick)}>
                  <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']} style={StyleSheet.absoluteFill} />
                  <Ionicons name="git-network-outline" size={18} color="rgba(255,255,255,0.3)" />
                  <Text style={[dh.pickerTxt, selectedDH && { color: '#fff' }]}>
                    {selectedDH?.ten_dong_ho ?? 'Chọn dòng họ...'}
                  </Text>
                  <Ionicons name={showDHPick ? 'chevron-up' : 'chevron-down'} size={16} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>

                {showDHPick && (
                  <View style={dh.dropdown}>
                    <TouchableOpacity style={dh.dhItem} onPress={() => { setSelectedDH(null); setShowDHPick(false); }}>
                      <Text style={[dh.dhTxt, { color: 'rgba(255,255,255,0.35)' }]}>— Không chọn —</Text>
                    </TouchableOpacity>
                    {dongHoList.map(d => (
                      <TouchableOpacity key={d.id} style={[dh.dhItem, selectedDH?.id === d.id && dh.dhItemActive]} onPress={() => { setSelectedDH(d); setShowDHPick(false); }}>
                        {selectedDH?.id === d.id && <LinearGradient colors={['rgba(124,58,237,0.2)', 'transparent']} style={StyleSheet.absoluteFill} />}
                        <Ionicons name="git-network-outline" size={14} color={selectedDH?.id === d.id ? '#A78BFA' : 'rgba(255,255,255,0.3)'} />
                        <Text style={[dh.dhTxt, selectedDH?.id === d.id && { color: '#A78BFA' }]}>{d.ten_dong_ho}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[s.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}>
              <LinearGradient colors={['#7C3AED', '#4F46E5', '#2563EB']} style={s.submitGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="person-add-outline" size={20} color="#fff" />
                    <Text style={s.submitTxt}>Tạo tài khoản</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Login link */}
            <TouchableOpacity style={s.loginRow} onPress={() => navigation.navigate('Login')}>
              <Text style={s.loginTxt}>Đã có tài khoản? </Text>
              <Text style={s.loginLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Alerts */}
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert(a => ({ ...a, visible: false }))}
        buttons={
          alert.type === 'success'
            ? [{ text: 'Xong', style: 'default', onPress: handleSuccess }]
            : [{ text: 'Đóng', style: 'cancel', onPress: () => setAlert(a => ({ ...a, visible: false })) }]
        }
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
  subtitle    : { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  progressWrap: { marginBottom: spacing.lg },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, overflow: 'hidden' },
  progressTxt : { fontSize: 10, color: 'rgba(167,139,250,0.6)', fontWeight: '700', marginTop: 6, textAlign: 'right' },
  card        : { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(167,139,250,0.15)', padding: spacing.lg, overflow: 'hidden' },
  section     : { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  sectionDot  : { width: 4, height: 16, borderRadius: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 },
  submitBtn   : { borderRadius: 18, overflow: 'hidden', marginTop: 4 },
  submitGrad  : { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 18 },
  submitTxt   : { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  loginRow    : { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md },
  loginTxt    : { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  loginLink   : { fontSize: 13, color: '#A78BFA', fontWeight: '700' },
});

const inp = StyleSheet.create({
  wrap    : { marginBottom: spacing.md },
  box     : { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, overflow: 'hidden', height: 54 },
  iconWrap: { width: 46, alignItems: 'center', justifyContent: 'center' },
  field   : { flex: 1, fontSize: 14, color: '#fff', paddingRight: 12 },
  toggle  : { paddingRight: 14, paddingLeft: 4 },
  errRow  : { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, marginLeft: 4 },
  errTxt  : { fontSize: 11, color: '#EF4444', fontWeight: '500' },
});

const dh = StyleSheet.create({
  picker      : { flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.15)', overflow: 'hidden' },
  pickerTxt   : { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.2)' },
  dropdown    : { marginTop: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(167,139,250,0.15)', overflow: 'hidden' },
  dhItem      : { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13, overflow: 'hidden' },
  dhItemActive: { borderLeftWidth: 2, borderLeftColor: '#A78BFA' },
  dhTxt       : { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
});

export default RegisterScreen;
