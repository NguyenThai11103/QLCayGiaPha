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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from '@react-native-vector-icons/material-design-icons';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors, spacing, fontSize, borderRadius, shadows } from '../config/theme';

const { width, height } = Dimensions.get('window');

interface RegisterScreenProps {
  navigation: any;
}

type FormData = {
  hoTen: string;
  dongHo: string;
  email: string;
  soDienThoai: string;
  matKhau: string;
  xacNhanMatKhau: string;
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState(1); // 2-step form
  const [formData, setFormData] = useState<FormData>({
    hoTen: '',
    dongHo: '',
    email: '',
    soDienThoai: '',
    matKhau: '',
    xacNhanMatKhau: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const cardAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: step === 1 ? 0.5 : 1,
      tension: 70,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!formData.hoTen.trim()) e.hoTen = 'Họ tên không được để trống';
    if (!formData.email.trim()) {
      e.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      e.email = 'Email không hợp lệ';
    }
    if (!formData.soDienThoai.trim()) {
      e.soDienThoai = 'Số điện thoại không được để trống';
    } else if (!/^[0-9]{10,11}$/.test(formData.soDienThoai.replace(/\s/g, ''))) {
      e.soDienThoai = 'Số điện thoại không hợp lệ';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!formData.matKhau) {
      e.matKhau = 'Mật khẩu không được để trống';
    } else if (formData.matKhau.length < 8) {
      e.matKhau = 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    if (!formData.xacNhanMatKhau) {
      e.xacNhanMatKhau = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.matKhau !== formData.xacNhanMatKhau) {
      e.xacNhanMatKhau = 'Mật khẩu xác nhận không khớp';
    }
    if (!agreedToTerms) e.terms = 'Bạn cần đồng ý với điều khoản';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateStep1()) { shakeError(); return; }
      Animated.timing(stepAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
        setStep(2);
        stepAnim.setValue(0);
      });
    } else {
      if (!validateStep2()) { shakeError(); return; }
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 2000);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigation.goBack();
    }
  };

  const cardOpacity = cardAnim;
  const cardTranslateY = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.55] });
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const FIELD_HEIGHT = Math.max(52, height * 0.065);

  const renderField = (
    field: string,
    label: string,
    placeholder: string,
    iconName: string,
    options: {
      keyboardType?: any;
      autoCapitalize?: any;
      isPassword?: boolean;
      showPass?: boolean;
      onToggle?: () => void;
    } = {}
  ) => {
    const { keyboardType = 'default', autoCapitalize = 'none', isPassword = false, showPass, onToggle } = options;
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={[
          styles.fieldWrap,
          { height: FIELD_HEIGHT },
          focusedField === field && styles.fieldFocused,
          errors[field] && styles.fieldError,
        ]}>
          <MaterialIcons name={iconName} size={20} color="rgba(167,139,250,0.7)" style={styles.fieldIconPad} />
          <TextInput
            style={[styles.fieldInput, { height: FIELD_HEIGHT }]}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={(formData as any)[field]}
            onChangeText={t => updateField(field, t)}
            onFocus={() => setFocusedField(field)}
            onBlur={() => setFocusedField(null)}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            secureTextEntry={isPassword && !showPass}
          />
          {isPassword && onToggle && (
            <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
              <MaterialIcons
                name={showPass ? 'eye' : 'eye-off'}
                size={20}
                color="rgba(167,139,250,0.7)"
              />
            </TouchableOpacity>
          )}
        </View>
        {errors[field] ? (
          <View style={styles.errRow}>
            <MaterialIcons name="alert" size={13} color="#FCA5A5" style={{ marginRight: 4 }} />
            <Text style={styles.errMsg}>{errors[field]}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0A0A1A', '#110D2E', '#0A0A1A']} style={StyleSheet.absoluteFill} />

      {/* Decorative glows */}
      <Animated.View style={[styles.glowTL, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.glowBR, { opacity: glowOpacity }]} />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
          <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(79,70,229,0.1)']} style={styles.backBtnGrad}>
            <Text style={styles.backIcon}>←</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Ionicons name="leaf" size={28} color="#A78BFA" />
        </View>

        <View style={{ width: 44 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarWrap}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
            <LinearGradient
              colors={['#6C63FF', '#A78BFA']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
        <View style={styles.stepsRow}>
          {[1, 2].map(s => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepCircle, s <= step && styles.stepCircleActive]}>
                {s < step ? (
                  <Text style={styles.stepCheckText}>✓</Text>
                ) : (
                  <Text style={[styles.stepNumText, s === step && styles.stepNumActive]}>{s}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, s <= step && styles.stepLabelActive]}>
                {s === 1 ? 'Thông tin' : 'Bảo mật'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Welcome block */}
          <View style={styles.welcomeBlock}>
            <Text style={styles.welcomeTitle}>
              {step === 1 ? 'Tạo Tài Khoản' : 'Bảo Mật'}
            </Text>
            <Text style={styles.welcomeSub}>
              {step === 1
                ? 'Điền thông tin cá nhân của bạn'
                : 'Thiết lập mật khẩu an toàn cho tài khoản'}
            </Text>
          </View>

          {/* Form Card */}
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslateY }, { translateX: shakeAnim }],
              },
            ]}>

            {step === 1 ? (
              <>
                {renderField('hoTen', 'Họ và tên', 'Nguyễn Văn A', 'account', { autoCapitalize: 'words' })}
                {renderField('dongHo', 'Dòng họ', 'VD: Nguyễn, Trần, Lê...', 'account-group', { autoCapitalize: 'words' })}
                {renderField('email', 'Email', 'email@example.com', 'email', { keyboardType: 'email-address' })}
                {renderField('soDienThoai', 'Số điện thoại', '0901 234 567', 'cellphone', { keyboardType: 'phone-pad' })}
              </>
            ) : (
              <>
                {renderField('matKhau', 'Mật khẩu', 'Ít nhất 8 ký tự', 'lock', {
                  isPassword: true,
                  showPass: showPassword,
                  onToggle: () => setShowPassword(!showPassword),
                })}
                {renderField('xacNhanMatKhau', 'Xác nhận mật khẩu', 'Nhập lại mật khẩu', 'lock-outline', {
                  isPassword: true,
                  showPass: showConfirmPassword,
                  onToggle: () => setShowConfirmPassword(!showConfirmPassword),
                })}

                {/* Password strength */}
                {formData.matKhau.length > 0 && (
                  <View style={styles.strengthWrap}>
                    <Text style={styles.strengthLabel}>Độ mạnh mật khẩu:</Text>
                    <View style={styles.strengthBars}>
                      {[1, 2, 3, 4].map(i => {
                        const len = formData.matKhau.length;
                        const filled = len >= i * 3;
                        const col = len < 6 ? '#EF4444' : len < 10 ? '#F59E0B' : '#10B981';
                        return (
                          <View
                            key={i}
                            style={[styles.strengthBar, { backgroundColor: filled ? col : 'rgba(255,255,255,0.1)' }]}
                          />
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Terms */}
                <TouchableOpacity
                  style={styles.termsRow}
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                  activeOpacity={0.7}>
                  <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                    {agreedToTerms && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <Text style={styles.termsText}>
                    Tôi đồng ý với{' '}
                    <Text style={styles.termsLink}>Điều khoản sử dụng</Text>
                    {' '}và{' '}
                    <Text style={styles.termsLink}>Chính sách bảo mật</Text>
                  </Text>
                </TouchableOpacity>
                {errors.terms && (
                  <View style={styles.errRow}>
                    <MaterialIcons name="warning" size={13} color="#FCA5A5" style={{ marginRight: 4 }} />
                    <Text style={styles.errMsg}>{errors.terms}</Text>
                  </View>
                )}
              </>
            )}

            {/* Action button */}
            <TouchableOpacity
              onPress={handleNext}
              disabled={isLoading}
              activeOpacity={0.85}
              style={styles.actionBtnWrap}>
              <LinearGradient
                colors={isLoading ? ['#374151', '#4B5563'] : ['#6C63FF', '#4F46E5']}
                style={styles.actionBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                {isLoading ? (
                  <View style={styles.btnRow}>
                    <MaterialIcons name="timer-sand" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.actionBtnText}>Đang xử lý...</Text>
                  </View>
                ) : step === 1 ? (
                  <View style={styles.btnRow}>
                    <Text style={styles.actionBtnText}>Tiếp Tục</Text>
                    <MaterialIcons name="arrow-right" size={20} color="#fff" style={{ marginLeft: 8 }} />
                  </View>
                ) : (
                  <View style={styles.btnRow}>
                    <MaterialIcons name="check-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.actionBtnText}>Tạo Tài Khoản</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Login link */}
          <View style={styles.loginLinkRow}>
            <Text style={styles.loginLinkText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkCta}>Đăng nhập →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
  },
  glowTL: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#6C63FF',
    opacity: 0.1,
  },
  glowBR: {
    position: 'absolute',
    bottom: 60,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#4F46E5',
    opacity: 0.08,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  backBtnGrad: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
  },
  backIcon: {
    fontSize: 20,
    color: '#A78BFA',
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogo: {
    fontSize: 28,
  },
  headerCenter: {
    alignItems: 'center',
  },
  brandLogo: {
    fontSize: 28,
  },
  progressBarWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stepItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    borderColor: '#6C63FF',
    backgroundColor: 'rgba(108,99,255,0.2)',
  },
  stepCheckText: {
    fontSize: 14,
    color: '#A78BFA',
    fontWeight: '700',
  },
  stepNumText: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '600',
  },
  stepNumActive: {
    color: '#A78BFA',
  },
  stepLabel: {
    fontSize: fontSize.xxs,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#A78BFA',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  welcomeBlock: {
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    fontSize: Math.min(fontSize.xxxl, width * 0.09),
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  welcomeSub: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: fontSize.xxs,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: spacing.xs + 2,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: spacing.md,
  },
  fieldFocused: {
    borderColor: '#6C63FF',
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  fieldError: {
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.07)',
  },
  fieldIconPad: {
    marginRight: spacing.sm,
  },
  fieldInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.white,
  },
  eyeBtn: {
    padding: spacing.xs,
  },
  errRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  errMsg: {
    fontSize: fontSize.xs,
    color: '#FCA5A5',
    fontWeight: '500',
    flexShrink: 1,
  },
  strengthWrap: {
    marginBottom: spacing.lg,
  },
  strengthLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: spacing.xs,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.xs + 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  checkMark: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 22,
  },
  termsLink: {
    color: '#A78BFA',
    fontWeight: '600',
  },
  actionBtnWrap: {
    borderRadius: borderRadius.xl,
    marginTop: spacing.xs,
    ...shadows.lg,
  },
  actionBtn: {
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  actionBtnText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loginLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.4)',
  },
  loginLinkCta: {
    fontSize: fontSize.md,
    color: '#A78BFA',
    fontWeight: '700',
  },
});

export default RegisterScreen;
