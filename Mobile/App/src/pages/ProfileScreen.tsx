/**
 * ProfileScreen – Thông tin cá nhân
 * Premium glassmorphism UI với /auth/me API
 * Features a gorgeous Imperial QR Passport Card & Modal with zero external library dependencies.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
  StatusBar, ScrollView, Animated, ActivityIndicator, Image, Share, Modal
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, STORAGE_TOKEN_KEY } from '../genaral/api';
import { logoutApi, STORAGE_USER_KEY } from '../genaral/authService';
import { spacing, fontSize, borderRadius, colors } from '../config/theme';
import CustomAlert from '../components/CustomAlert';
import { useTheme } from '../context/ThemeContext';

// Helper: hex 6 ký tự + alpha → rgba()
const hexRgba = (hex: string, a: number): string => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

// ─────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────
interface UserProfile {
  id: number;
  ho_ten: string;
  email: string;
  quyen_han: string;   // 'system_admin' | 'quan_ly' | 'thanh_vien'
  avatar?: string | null;
  google_id?: string | null;
  created_at: string;
  updated_at: string;
}

const QUYEN_LABEL: Record<string, { label: string; color: string; icon: string }> = {
  system_admin: { label: 'Quản trị viên', color: '#F59E0B', icon: 'shield-checkmark' },
  quan_ly: { label: 'Quản lý', color: '#10B981', icon: 'key' },
  thanh_vien: { label: 'Thành viên', color: '#A78BFA', icon: 'person' },
};

// ─────────────────────────────────────────────────────────
//  Menu item component
// ─────────────────────────────────────────────────────────
const MenuItem: React.FC<{
  icon: string;
  label: string;
  color: string;
  value?: string;
  onPress?: () => void;
  delay: number;
  theme: ReturnType<typeof useTheme>['theme'];
}> = ({ icon, label, color, value, onPress, delay, theme }) => {
  const anim = useRef(new Animated.Value(0)).current;

  const cardBg = theme.dark ? 'rgba(255,255,255,0.05)' : colors.white;
  const textColor = theme.dark ? '#fff' : colors.gray[800];
  const mutedColor = theme.dark ? 'rgba(255,255,255,0.5)' : colors.gray[500];
  const borderColor = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, tension: 60, friction: 12, delay, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
      <TouchableOpacity style={[mi.row, { backgroundColor: cardBg, borderColor: borderColor }]} onPress={onPress} activeOpacity={0.75}>
        <LinearGradient colors={[hexRgba(color, 0.18), hexRgba(color, 0.07)]} style={mi.iconBox}>
          <Ionicons name={icon as any} size={18} color={color} />
        </LinearGradient>
        <View style={mi.content}>
          <Text style={[mi.label, { color: textColor }]}>{label}</Text>
          {value && <Text style={[mi.value, { color: mutedColor }]} numberOfLines={1}>{value}</Text>}
        </View>
        {onPress && <Ionicons name="chevron-forward" size={16} color={mutedColor} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────
//  Main Screen
// ─────────────────────────────────────────────────────────
const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Dynamic colors
  const bgColor = theme.dark ? '#050010' : '#F5F7FA';
  const textColor = theme.dark ? '#fff' : colors.gray[800];
  const mutedColor = theme.dark ? 'rgba(255,255,255,0.5)' : colors.gray[500];
  const cardBg = theme.dark ? 'rgba(255,255,255,0.05)' : colors.white;
  const borderColor = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // Animations
  const heroAnim = useRef(new Animated.Value(0)).current;
  const avatarAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(heroAnim, { toValue: 1, tension: 50, friction: 10, useNativeDriver: true }),
      Animated.spring(avatarAnim, { toValue: 1, tension: 60, friction: 8, delay: 150, useNativeDriver: true }),
    ]).start();

    // Pulse animation for QR Card scanner neon ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 1500, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const cached = await AsyncStorage.getItem(STORAGE_USER_KEY);
      if (cached) setUser(JSON.parse(cached));

      const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
      if (token) {
        const res = await apiFetch<{ data: UserProfile }>('/auth/me', {}, token);
        setUser(res.data);
        await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.data));
      }
    } catch (e: any) {
      // offline support
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, []);

  const handleLogout = () => {
    setShowAlert(true);
  };

  const doLogout = async () => {
    setShowAlert(false);
    setIsLoggingOut(true);
    try {
      const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
      if (token) {
        await apiFetch('/auth/logout', { method: 'POST' }, token).catch(() => { });
      }
    } finally {
      await logoutApi();
      navigation.getParent()?.replace('GetStarted');
    }
  };

  const quyenCfg = QUYEN_LABEL[user?.quyen_han ?? 'thanh_vien'] ?? QUYEN_LABEL.thanh_vien;
  const initial = (user?.ho_ten ?? 'U').split(' ').pop()?.[0]?.toUpperCase() ?? 'U';
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

  // Format QR Code value as a clean JSON representation of this user
  const qrDataObj = {
    app: 'QLCayGiaPha',
    id: user?.id ?? 0,
    ho_ten: user?.ho_ten ?? 'Chưa cập nhật',
    email: user?.email ?? '',
    vai_tro: quyenCfg.label,
    ngay_tham_gia: joinDate
  };
  const qrString = JSON.stringify(qrDataObj);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrString)}&color=0f172a&bgcolor=ffffff`;

  const handleShareQR = async () => {
    try {
      await Share.share({
        title: `Mã thông hành gia tộc của ${user?.ho_ten}`,
        message: `Họ tên: ${user?.ho_ten}\nEmail: ${user?.email}\nVai trò: ${quyenCfg.label}\nNgày tham gia: ${joinDate}\n\nQuét mã QR trong ứng dụng Cây Gia Phả để nhận dạng thành viên!`,
      });
    } catch (e) {
      // error sharing
    }
  };

  const INFO_ITEMS = [
    { icon: 'mail-outline', label: 'Email', color: '#60A5FA', value: user?.email ?? '—' },
    { icon: 'calendar-outline', label: 'Ngày tham gia', color: '#34D399', value: joinDate },
    { icon: 'logo-google', label: 'Google', color: '#EA4335', value: user?.google_id ? 'Đã liên kết' : 'Chưa liên kết' },
  ];

  const ACTIONS = [
    { icon: 'notifications-outline', label: 'Thông báo', color: '#F59E0B', onPress: () => navigation.getParent()?.navigate('Notifications') },
    { icon: 'lock-closed-outline', label: 'Đổi mật khẩu', color: '#A78BFA', onPress: () => { } },
    { icon: 'settings-outline', label: 'Cài đặt', color: '#09a878ff', onPress: () => navigation.getParent()?.navigate('Settings') },
    { icon: 'help-circle-outline', label: 'Trợ giúp', color: '#3B82F6', onPress: () => navigation.getParent()?.navigate('Help') },
  ];

  return (
    <View style={[s.root, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={theme.dark ? ['#050010', '#0E0A26', '#080018'] : ['#F5F7FA', '#EEF2FF', '#F5F7FA']}
        style={StyleSheet.absoluteFill}
      />

      {theme.dark && (
        <>
          <View style={[s.orb, { top: -80, left: -60, width: 260, height: 260, backgroundColor: '#7C3AED' }]} />
          <View style={[s.orb, { bottom: 120, right: -80, width: 200, height: 200, backgroundColor: '#2563EB' }]} />
        </>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}>

        {/* ── Hero Section ── */}
        <Animated.View style={[s.hero, {
          opacity: heroAnim,
          transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
        }]}>
          <Text style={[s.screenLabel, { color: theme.dark ? 'rgba(167,139,250,0.6)' : colors.gray[500] }]}>TRANG CÁ NHÂN</Text>

          {/* Avatar */}
          <Animated.View style={[s.avatarContainer, {
            opacity: avatarAnim,
            transform: [{ scale: avatarAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
          }]}>
            <LinearGradient colors={theme.dark ? ['#7C3AED', '#4F46E5', '#2563EB'] : ['#6C63FF', '#8B5CF6', '#A78BFA']} style={s.avatarRing} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={[s.avatarInner, { backgroundColor: theme.dark ? '#110F23' : 'rgba(255,255,255,0.9)' }]}>
                {loading && !user ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Text style={[s.avatarTxt, { color: theme.dark ? '#fff' : theme.colors.primary }]}>{initial}</Text>
                )}
              </View>
            </LinearGradient>

            {/* Online dot */}
            <View style={[s.onlineDot, { borderColor: bgColor }]}>
              <View style={s.onlineDotInner} />
            </View>

            {/* Role badge */}
            <View style={[s.roleBadge, { borderColor: quyenCfg.color + '60', backgroundColor: quyenCfg.color + '18' }]}>
              <Ionicons name={quyenCfg.icon as any} size={11} color={quyenCfg.color} />
              <Text style={[s.roleText, { color: quyenCfg.color }]}>{quyenCfg.label}</Text>
            </View>
          </Animated.View>

          {/* Name & email */}
          <Text style={[s.name, { color: textColor }]}>{user?.ho_ten ?? (loading ? '...' : 'Người dùng')}</Text>
          <Text style={[s.email, { color: mutedColor }]}>{user?.email ?? ''}</Text>
        </Animated.View>

        {/* ── NEW: Imperial QR Passport Card (Thẻ Thông Hành Gia Tộc) ── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: mutedColor }]}>MÃ QR THÔNG HÀNH</Text>
          
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => setShowQRModal(true)}
            style={qr.cardContainer}
          >
            <LinearGradient 
              colors={theme.dark ? ['#1B1340', '#0A081B'] : ['#6366F1', '#4F46E5']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 1 }}
              style={[
                qr.cardGradient,
                { 
                  borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  shadowColor: theme.dark ? '#7C3AED' : '#4F46E5'
                }
              ]}
            >
              {/* Luxury Background Graphics */}
              <View style={qr.cardMeshOverlay} />

              <View style={qr.cardLeft}>
                <Text style={qr.cardSub}>THẺ THÔNG HÀNH /</Text>
                <Text style={qr.cardTitle}>Gia Tộc Kỷ Kỷ</Text>
                
                <View style={qr.cardUserDetail}>
                  <Text style={qr.cardUserLabel}>SỞ HỮU</Text>
                  <Text style={qr.cardUserName}>{user?.ho_ten ?? '...'}</Text>
                </View>

                <View style={qr.cardBadge}>
                  <Ionicons name="ribbon-outline" size={13} color="#FFF" />
                  <Text style={qr.cardBadgeTxt}>{quyenCfg.label}</Text>
                </View>
              </View>

              <View style={qr.cardRight}>
                <View style={[qr.qrBorderFrame, { borderColor: theme.dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.3)' }]}>
                  {loading && !user ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Image 
                      source={{ uri: qrCodeUrl }}
                      style={qr.cardQRImage}
                    />
                  )}
                  {/* Glowing Scanner Line overlay inside tiny QR */}
                  <Animated.View style={[qr.cardLaserLine, { transform: [{ scale: pulseAnim }] }]} />
                </View>
                <View style={qr.cardTapPill}>
                  <Ionicons name="expand-outline" size={11} color="#FFF" />
                  <Text style={qr.cardTapTxt}>Phóng to</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Info Card ── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: mutedColor }]}>THÔNG TIN TÀI KHOẢN</Text>
          <View style={[s.card, { backgroundColor: cardBg, borderColor: borderColor }]}>
            {INFO_ITEMS.map((item, i) => (
              <View key={i}>
                {i > 0 && <View style={[s.separator, { backgroundColor: borderColor }]} />}
                <MenuItem
                  icon={item.icon} label={item.label}
                  color={item.color} value={item.value}
                  delay={i * 80}
                  theme={theme}
                />
              </View>
            ))}
          </View>
        </View>

        {/* ── Actions Card ── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: mutedColor }]}>CÀI ĐẶT</Text>
          <View style={[s.card, { backgroundColor: cardBg, borderColor: borderColor }]}>
            {ACTIONS.map((item, i) => (
              <View key={i}>
                {i > 0 && <View style={[s.separator, { backgroundColor: borderColor }]} />}
                <MenuItem
                  icon={item.icon} label={item.label}
                  color={item.color} onPress={item.onPress}
                  delay={300 + i * 80}
                  theme={theme}
                />
              </View>
            ))}
          </View>
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={[s.logoutBtn, { borderColor: 'rgba(239,68,68,0.3)' }]} onPress={handleLogout} activeOpacity={0.8} disabled={isLoggingOut}>
          <LinearGradient
            colors={['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.06)']}
            style={s.logoutGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text style={s.logoutText}>Đăng xuất</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Version */}
        <Text style={[s.version, { color: mutedColor }]}>Cây Gia Phả v1.0.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── NEW: Grand Glassmorphic QR Modal (Cửa Sổ Trình Diễn QR) ── */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={[qr2.overlay, { backgroundColor: theme.dark ? 'rgba(5,1,16,0.96)' : 'rgba(15,23,42,0.85)' }]}>
          {/* Background Ambient Glows */}
          <View style={[qr2.glow, { top: '25%', left: '15%', backgroundColor: '#6366F1' }]} />
          <View style={[qr2.glow, { bottom: '25%', right: '15%', backgroundColor: '#7C3AED' }]} />

          <View style={qr2.container}>
            {/* Header Close button */}
            <TouchableOpacity 
              style={qr2.closeCircle} 
              onPress={() => setShowQRModal(false)}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={20} color="#FFF" />
            </TouchableOpacity>

            {/* Passport Emblem */}
            <LinearGradient colors={['#FBBF24', '#D97706']} style={qr2.crownBadge}>
              <Ionicons name="qr-code-outline" size={20} color="#FFF" />
            </LinearGradient>

            <Text style={qr2.modalTitle}>Mã Thông Hành Cá Nhân</Text>
            <Text style={qr2.modalDesc}>
              Đưa cho thành viên gia đình quét bằng Camera để nhanh chóng đối soát lý lịch cá nhân.
            </Text>

            {/* Full-size QR Scanning Frame */}
            <View style={qr2.qrOuterFrame}>
              <LinearGradient 
                colors={['#6366F1', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={qr2.qrFrameBorder}
              >
                <View style={qr2.qrCoreWhiteBg}>
                  {loading && !user ? (
                    <ActivityIndicator size="large" color="#6366F1" />
                  ) : (
                    <Image source={{ uri: qrCodeUrl }} style={qr2.fullQRImage} />
                  )}
                </View>
              </LinearGradient>
              
              {/* Corner lasers styling */}
              <View style={[qr2.cornerLaser, { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#D97706' }]} />
              <View style={[qr2.cornerLaser, { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#D97706' }]} />
              <View style={[qr2.cornerLaser, { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#6366F1' }]} />
              <View style={[qr2.cornerLaser, { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#6366F1' }]} />
            </View>

            {/* Member Details list inside modal */}
            <View style={[qr2.detailsBox, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
              <View style={qr2.detailRow}>
                <Text style={qr2.detailLabel}>HỌ VÀ TÊN</Text>
                <Text style={qr2.detailVal}>{user?.ho_ten ?? '...'}</Text>
              </View>
              <View style={[qr2.detailRow, qr2.rowSep, { borderTopColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={qr2.detailLabel}>EMAIL ĐĂNG KÝ</Text>
                <Text style={qr2.detailVal}>{user?.email ?? '...'}</Text>
              </View>
              <View style={[qr2.detailRow, qr2.rowSep, { borderTopColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={qr2.detailLabel}>VAI TRÒ THÀNH VIÊN</Text>
                <Text style={[qr2.detailVal, { color: quyenCfg.color, fontWeight: '900' }]}>{quyenCfg.label}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={qr2.modalActionsRow}>
              <TouchableOpacity 
                style={qr2.shareBtn} 
                onPress={handleShareQR}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#6366F1', '#4F46E5']} style={qr2.shareBtnGrad}>
                  <Ionicons name="share-social-outline" size={16} color="#FFF" />
                  <Text style={qr2.shareBtnTxt}>Chia sẻ mã</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[qr2.closeBtn, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]} 
                onPress={() => setShowQRModal(false)}
                activeOpacity={0.85}
              >
                <Text style={[qr2.closeBtnTxt, { color: theme.dark ? '#FFF' : '#334155' }]}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Logout Alert */}
      <CustomAlert
        visible={showAlert}
        type="warning"
        title="Đăng xuất"
        message="Bạn có chắc muốn đăng xuất không? Bạn sẽ cần đăng nhập lại để sử dụng ứng dụng."
        onClose={() => setShowAlert(false)}
        buttons={[
          { text: 'Huỷ bỏ', style: 'cancel', onPress: () => setShowAlert(false) },
          { text: 'Đăng xuất', style: 'destructive', onPress: doLogout },
        ]}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────
//  Styles: NEW QR Card Graphics
// ─────────────────────────────────────────────────────────
const qr = StyleSheet.create({
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: spacing.lg,
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
    alignItems: 'center',
    position: 'relative',
  },
  cardMeshOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.01)',
    opacity: 0.08,
  },
  cardLeft: {
    flex: 1,
    gap: 4,
  },
  cardSub: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FBBF24',
    letterSpacing: 1.5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  cardUserDetail: {
    marginBottom: 8,
  },
  cardUserLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  cardUserName: {
    fontSize: 15,
    fontWeight: '850',
    color: '#FFF',
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cardBadgeTxt: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFF',
  },
  cardRight: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  qrBorderFrame: {
    width: 92,
    height: 92,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 6,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cardQRImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  cardLaserLine: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#F59E0B',
    opacity: 0.15,
  },
  cardTapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardTapTxt: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
  },
});

// ─────────────────────────────────────────────────────────
//  Styles: NEW QR Modal Trình diễn
// ─────────────────────────────────────────────────────────
const qr2 = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  glow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.12,
  },
  container: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  closeCircle: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crownBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  qrOuterFrame: {
    position: 'relative',
    marginBottom: spacing.xl,
  },
  qrFrameBorder: {
    padding: 3,
    borderRadius: 24,
  },
  qrCoreWhiteBg: {
    width: 220,
    height: 220,
    backgroundColor: '#FFF',
    borderRadius: 21,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  fullQRImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  cornerLaser: {
    position: 'absolute',
    width: 22,
    height: 22,
  },
  detailsBox: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rowSep: {
    borderTopWidth: 1,
  },
  detailLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.8,
  },
  detailVal: {
    fontSize: 13.5,
    fontWeight: '850',
    color: '#FFF',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  shareBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  shareBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  shareBtnTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  closeBtn: {
    flex: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  closeBtnTxt: {
    fontSize: 14,
    fontWeight: '800',
  },
});

// ─────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.1 },
  scroll: { paddingBottom: 20 },
  screenLabel: {
    textAlign: 'center', fontSize: 10, fontWeight: '800',
    letterSpacing: 2.5,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    marginBottom: 24,
  },
  hero: { alignItems: 'center', paddingHorizontal: spacing.lg },
  avatarContainer: { alignItems: 'center', marginBottom: spacing.lg },
  avatarRing: { width: 110, height: 110, borderRadius: 55, padding: 3, justifyContent: 'center', alignItems: 'center' },
  avatarInner: { width: 104, height: 104, borderRadius: 52, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontSize: 42, fontWeight: '900' },
  onlineDot: { position: 'absolute', bottom: 30, right: 0, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  onlineDotInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50, borderWidth: 1, marginTop: 10 },
  roleText: { fontSize: 11, fontWeight: '700' },
  name: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center' },
  email: { fontSize: 13, marginTop: 4, marginBottom: 4 },

  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  sectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: spacing.sm },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  separator: { height: 1, marginLeft: 66 },

  logoutBtn: { marginHorizontal: spacing.lg, marginTop: spacing.xl, borderRadius: 18, overflow: 'hidden', borderWidth: 1 },
  logoutGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 18 },
  logoutText: { fontSize: 16, fontWeight: '800', color: '#EF4444', letterSpacing: 0.3 },
  version: { textAlign: 'center', fontSize: 11, marginTop: spacing.xl, fontWeight: '500' },
});

const mi = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  content: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600' },
  value: { fontSize: 12, marginTop: 2, fontWeight: '500' },
});

export default ProfileScreen;
