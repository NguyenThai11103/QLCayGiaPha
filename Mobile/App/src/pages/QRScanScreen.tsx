/**
 * QRScanScreen – Quét QR để xem thông tin thành viên gia tộc
 *
 * Dùng react-native-camera-kit (không cần NitroModules)
 * Flow:
 *   1. Xin quyền camera khi mount
 *   2. Camera stream với viewfinder đẹp (overlay)
 *   3. Quét được QR → gọi API lấy thông tin thành viên
 *   4. Hiện bottom sheet với thông tin chi tiết
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  Easing,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { Camera } from 'react-native-camera-kit';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../genaral/api';
import { STORAGE_TOKEN_KEY } from '../genaral/authService';
import { borderRadius, fontSize, spacing } from '../config/theme';

// ─────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────
interface ThanhVien {
  id         : number;
  ho_ten     : string;
  email      : string;
  dong_ho    : string | null;
  ngay_sinh  ?: string;
  que_quan   ?: string;
  chuc_danh  ?: string;
  created_at : string;
}

interface QRScanScreenProps { navigation: any; }

// ─────────────────────────────────────────────────────────
//  Animated scanner line (di chuyển lên xuống)
// ─────────────────────────────────────────────────────────
const ScanLine: React.FC = () => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 220] });

  return (
    <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]}>
      <LinearGradient
        colors={['transparent', '#6C63FF', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────
//  Corner decorations cho viewfinder
// ─────────────────────────────────────────────────────────
const CornerDeco: React.FC<{ pos: 'tl' | 'tr' | 'bl' | 'br' }> = ({ pos }) => {
  const isTop  = pos === 'tl' || pos === 'tr';
  const isLeft = pos === 'tl' || pos === 'bl';
  return (
    <View style={[
      styles.corner,
      isTop  ? styles.cornerTop    : styles.cornerBottom,
      isLeft ? styles.cornerLeft   : styles.cornerRight,
    ]}>
      <View style={[styles.cornerH, isLeft ? { left: 0 } : { right: 0 }]} />
      <View style={[styles.cornerV, isTop  ? { top: 0  } : { bottom: 0 }]} />
    </View>
  );
};

// ─────────────────────────────────────────────────────────
//  Member Info Bottom Sheet
// ─────────────────────────────────────────────────────────
const MemberCard: React.FC<{
  member     : ThanhVien | null;
  loading    : boolean;
  error      : string | null;
  onClose    : () => void;
  onScanAgain: () => void;
}> = ({ member, loading, error, onClose, onScanAgain }) => {

  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0, tension: 80, friction: 12, useNativeDriver: true,
    }).start();
  }, []);

  const initial = member?.ho_ten?.split(' ').pop()?.[0]?.toUpperCase() ?? '?';

  return (
    <View style={styles.sheetOverlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sheetHandle} />

        {loading ? (
          <View style={styles.sheetCenter}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.sheetLoadingText}>Đang tải thông tin thành viên...</Text>
          </View>

        ) : error ? (
          <View style={styles.sheetCenter}>
            <Ionicons name="alert-circle-outline" size={52} color="#EF4444" />
            <Text style={styles.sheetErrTitle}>Không tìm thấy</Text>
            <Text style={styles.sheetErrSub}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onScanAgain}>
              <Ionicons name="qr-code-outline" size={16} color="#A78BFA" />
              <Text style={styles.retryBtnText}>Quét lại</Text>
            </TouchableOpacity>
          </View>

        ) : member ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Avatar */}
            <View style={styles.sheetAvatarRow}>
              <LinearGradient colors={['#6C63FF', '#4F46E5']} style={styles.sheetAvatar}>
                <Text style={styles.sheetAvatarText}>{initial}</Text>
              </LinearGradient>
              <View style={styles.sheetBadge}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>
            </View>

            <Text style={styles.sheetName}>{member.ho_ten}</Text>

            {member.dong_ho ? (
              <View style={styles.dongHoBadge}>
                <Ionicons name="git-network-outline" size={12} color="#A78BFA" />
                <Text style={styles.dongHoText}>Dòng họ {member.dong_ho}</Text>
              </View>
            ) : null}

            {/* Info rows */}
            <View style={styles.infoCard}>
              {[
                { icon: 'mail-outline',     label: 'Email',     value: member.email                                            },
                { icon: 'calendar-outline', label: 'Ngày sinh', value: member.ngay_sinh  ?? 'Chưa cập nhật'                   },
                { icon: 'location-outline', label: 'Quê quán',  value: member.que_quan   ?? 'Chưa cập nhật'                   },
                { icon: 'ribbon-outline',   label: 'Chức danh', value: member.chuc_danh  ?? 'Thành viên'                      },
                { icon: 'time-outline',     label: 'Tham gia',  value: new Date(member.created_at).toLocaleDateString('vi-VN') },
              ].map((row, i) => (
                <View key={i} style={[styles.infoRow, i > 0 && styles.infoRowBorder]}>
                  <View style={styles.infoIconWrap}>
                    <Ionicons name={row.icon as any} size={16} color="#A78BFA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>{row.label}</Text>
                    <Text style={styles.infoValue}>{row.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.scanAgainBtn} onPress={onScanAgain}>
                <Ionicons name="qr-code-outline" size={18} color="#6C63FF" />
                <Text style={styles.scanAgainText}>Quét thêm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : null}
      </Animated.View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────
//  Main Screen
// ─────────────────────────────────────────────────────────
const QRScanScreen: React.FC<QRScanScreenProps> = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [scanning,      setScanning]      = useState(true);
  const [showSheet,     setShowSheet]     = useState(false);
  const [memberData,    setMemberData]    = useState<ThanhVien | null>(null);
  const [isLoading,     setIsLoading]     = useState(false);
  const [fetchError,    setFetchError]    = useState<string | null>(null);
  const [flashOn,       setFlashOn]       = useState(false);
  const lastScannedRef = useRef<string>('');
  const pulseAnim      = useRef(new Animated.Value(1)).current;

  const triggerPulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.06, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 100, useNativeDriver: true }),
    ]).start();
  };

  // ── Xin quyền camera (Android)
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title  : 'Cần quyền Camera',
            message: 'App cần camera để quét QR của thành viên gia tộc',
            buttonPositive: 'Đồng ý',
            buttonNegative: 'Từ chối',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
        } else {
          Alert.alert('Không có quyền camera', 'Vui lòng cấp quyền trong Cài đặt', [
            { text: 'Đóng', onPress: () => navigation.goBack() },
          ]);
        }
      } else {
        setHasPermission(true);
      }
    })();
  }, []);

  // ── Gọi API lấy thông tin thành viên
  const fetchMember = useCallback(async (memberId: string) => {
    setIsLoading(true);
    setFetchError(null);
    setMemberData(null);
    try {
      const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
      const res   = await apiFetch<{ success: boolean; data: ThanhVien }>(
        `/nguoi/detail?id=${memberId}`,
        { method: 'GET' },
        token ?? undefined,
      );
      setMemberData(res.data);
    } catch (err: any) {
      const msg = err?.status === 404
        ? 'Thành viên không tồn tại trong hệ thống'
        : (err?.message ?? 'Không thể kết nối máy chủ');
      setFetchError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Khi quét được QR code
  const handleQRRead = useCallback((event: { nativeEvent: { codeStringValue: string } }) => {
    if (!scanning || showSheet) return;
    const value = event.nativeEvent.codeStringValue?.trim();
    if (!value || value === lastScannedRef.current) return;
    lastScannedRef.current = value;

    // QR format: "cgp_member:<id>" hoặc số id thuần
    const memberId = value.startsWith('cgp_member:')
      ? value.replace('cgp_member:', '')
      : value;

    if (!/^\d+$/.test(memberId)) {
      setFetchError('QR code không hợp lệ. Vui lòng quét QR của thành viên gia tộc.');
      setShowSheet(true);
      setScanning(false);
      return;
    }

    triggerPulse();
    setScanning(false);
    setShowSheet(true);
    fetchMember(memberId);
  }, [scanning, showSheet, fetchMember]);

  const handleClose = () => {
    setShowSheet(false);
    setMemberData(null);
    setFetchError(null);
    setTimeout(() => {
      lastScannedRef.current = '';
      setScanning(true);
    }, 600);
  };

  const handleScanAgain = () => {
    setShowSheet(false);
    setMemberData(null);
    setFetchError(null);
    lastScannedRef.current = '';
    setScanning(true);
  };

  // ── No permission
  if (!hasPermission) {
    return (
      <View style={styles.permissionWrap}>
        <StatusBar barStyle="light-content" backgroundColor="#070712" />
        <LinearGradient colors={['#070712', '#0E0A26', '#070712']} style={StyleSheet.absoluteFill} />
        <Ionicons name="camera-off-outline" size={64} color="rgba(108,99,255,0.5)" />
        <Text style={styles.permTitle}>Đang xin quyền...</Text>
        <Text style={styles.permSub}>Vui lòng cho phép truy cập camera</Text>
        <TouchableOpacity style={styles.permBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.permBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Camera ── */}
      <Camera
        style={StyleSheet.absoluteFill}
        scanBarcode
        onReadCode={handleQRRead}
        showFrame={false}          // Tắt frame mặc định, dùng frame tự vẽ
        laserColor="transparent"   // Tắt laser mặc định
        frameColor="transparent"
        torchMode={flashOn ? 'on' : 'off'}
        cameraType="back"
      />

      {/* ── Overlay tối (top / sides / bottom) ── */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddleRow}>
          <View style={styles.overlaySide} />
          {/* Viewfinder cutout */}
          <Animated.View style={[styles.viewfinder, { transform: [{ scale: pulseAnim }] }]}>
            <CornerDeco pos="tl" />
            <CornerDeco pos="tr" />
            <CornerDeco pos="bl" />
            <CornerDeco pos="br" />
            <ScanLine />
          </Animated.View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <LinearGradient colors={['rgba(12,10,30,0.88)', 'rgba(12,10,30,0.65)']} style={styles.topBtnGrad}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.topTitleBox}>
          <Ionicons name="qr-code" size={16} color="#A78BFA" />
          <Text style={styles.topTitleText}>Quét QR Thành Viên</Text>
        </View>

        <TouchableOpacity style={styles.topBtn} onPress={() => setFlashOn(f => !f)} activeOpacity={0.8}>
          <LinearGradient
            colors={flashOn
              ? ['rgba(108,99,255,0.9)', 'rgba(79,70,229,0.7)']
              : ['rgba(12,10,30,0.88)', 'rgba(12,10,30,0.65)']}
            style={styles.topBtnGrad}>
            <Ionicons name={flashOn ? 'flash' : 'flash-outline'} size={22} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Hint ── */}
      <View style={styles.hintWrap} pointerEvents="none">
        <View style={styles.hintBox}>
          <Ionicons name="scan-outline" size={13} color="rgba(255,255,255,0.65)" />
          <Text style={styles.hintText}>Đưa QR của thành viên vào khung để quét</Text>
        </View>
      </View>

      {/* ── Bottom sheet ── */}
      <Modal visible={showSheet} transparent animationType="none" statusBarTranslucent>
        <MemberCard
          member={memberData}
          loading={isLoading}
          error={fetchError}
          onClose={handleClose}
          onScanAgain={handleScanAgain}
        />
      </Modal>
    </View>
  );
};

// ─────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────
const VF_SIZE    = 260;
const CORNER_LEN = 28;
const CORNER_W   = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Permission screen
  permissionWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: spacing.xl, gap: spacing.md,
  },
  permTitle   : { fontSize: fontSize.xxl, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  permSub     : { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  permBtn     : {
    marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.full, borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.4)', backgroundColor: 'rgba(108,99,255,0.15)',
  },
  permBtnText : { fontSize: fontSize.md, color: '#A78BFA', fontWeight: '600' },

  // Overlay
  overlay          : { ...StyleSheet.absoluteFillObject },
  overlayTop       : { flex: 1, backgroundColor: 'rgba(7,7,18,0.72)', minHeight: (Platform.OS === 'ios' ? 44 : 56) + 70 + 60 },
  overlayMiddleRow : { flexDirection: 'row', height: VF_SIZE },
  overlaySide      : { flex: 1, backgroundColor: 'rgba(7,7,18,0.72)' },
  overlayBottom    : { flex: 1, backgroundColor: 'rgba(7,7,18,0.72)' },

  // Viewfinder
  viewfinder: { width: VF_SIZE, height: VF_SIZE },

  // Corners
  corner       : { position: 'absolute', width: CORNER_LEN, height: CORNER_LEN },
  cornerTop    : { top: 0    },
  cornerBottom : { bottom: 0 },
  cornerLeft   : { left: 0   },
  cornerRight  : { right: 0  },
  cornerH: { position: 'absolute', height: CORNER_W, width: CORNER_LEN, backgroundColor: '#6C63FF', borderRadius: 2, top: 0 },
  cornerV: { position: 'absolute', width: CORNER_W, height: CORNER_LEN, backgroundColor: '#6C63FF', borderRadius: 2, left: 0 },

  // Scan line
  scanLine: {
    position: 'absolute', left: 8, right: 8, height: 2, top: 20,
    overflow: 'hidden', borderRadius: 1,
  },

  // Top bar
  topBar: {
    position       : 'absolute',
    top            : Platform.OS === 'ios' ? 56 : 44,
    left           : spacing.lg,
    right          : spacing.lg,
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'space-between',
  },
  topBtn     : { borderRadius: borderRadius.full, overflow: 'hidden' },
  topBtnGrad : {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  topTitleBox  : {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(12,10,30,0.82)',
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)',
  },
  topTitleText : { fontSize: fontSize.sm, fontWeight: '700', color: '#fff' },

  // Hint
  hintWrap: { position: 'absolute', bottom: 120, left: 0, right: 0, alignItems: 'center' },
  hintBox : {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(12,10,30,0.78)',
    borderWidth: 1, borderColor: 'rgba(108,99,255,0.25)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  hintText: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },

  // Bottom sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor    : '#0E0A26',
    borderTopLeftRadius : 28,
    borderTopRightRadius: 28,
    borderWidth        : 1,
    borderColor        : 'rgba(108,99,255,0.25)',
    paddingHorizontal  : spacing.lg,
    paddingBottom      : Platform.OS === 'ios' ? 40 : 28,
    paddingTop         : spacing.md,
    maxHeight          : '80%',
  },
  sheetHandle      : { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: spacing.lg },
  sheetCenter      : { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  sheetLoadingText : { fontSize: fontSize.md, color: 'rgba(255,255,255,0.55)' },
  sheetErrTitle    : { fontSize: fontSize.xl, fontWeight: '800', color: '#EF4444' },
  sheetErrSub      : { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  retryBtn         : {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(108,99,255,0.2)', borderWidth: 1, borderColor: 'rgba(108,99,255,0.4)',
  },
  retryBtnText     : { fontSize: fontSize.md, color: '#A78BFA', fontWeight: '600' },

  // Member info
  sheetAvatarRow   : { alignItems: 'center', marginBottom: spacing.md },
  sheetAvatar      : { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  sheetAvatarText  : { fontSize: 32, fontWeight: '800', color: '#fff' },
  sheetBadge       : {
    position: 'absolute', bottom: 0, right: '38%',
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#10B981', borderWidth: 2, borderColor: '#0E0A26',
    justifyContent: 'center', alignItems: 'center',
  },
  sheetName        : { fontSize: fontSize.xxl, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5, marginBottom: spacing.xs },
  dongHoBadge      : {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(108,99,255,0.15)', borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)',
    marginBottom: spacing.lg,
  },
  dongHoText       : { fontSize: fontSize.xs, color: '#A78BFA', fontWeight: '600' },

  // Info card
  infoCard    : {
    backgroundColor : 'rgba(255,255,255,0.05)',
    borderRadius    : borderRadius.xl,
    borderWidth     : 1, borderColor: 'rgba(108,99,255,0.15)',
    overflow        : 'hidden', marginBottom: spacing.lg,
  },
  infoRow      : { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  infoIconWrap : { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(108,99,255,0.15)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  infoLabel    : { fontSize: fontSize.xxs, color: 'rgba(255,255,255,0.35)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue    : { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginTop: 2 },

  // Actions
  sheetActions  : { flexDirection: 'row', gap: spacing.sm },
  scanAgainBtn  : {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: spacing.md, borderRadius: borderRadius.xl,
    borderWidth: 1.5, borderColor: 'rgba(108,99,255,0.4)', backgroundColor: 'rgba(108,99,255,0.1)',
  },
  scanAgainText : { fontSize: fontSize.md, fontWeight: '700', color: '#6C63FF' },
  closeBtn      : { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.xl, backgroundColor: '#6C63FF' },
  closeBtnText  : { fontSize: fontSize.md, fontWeight: '700', color: '#fff' },
});

export default QRScanScreen;
