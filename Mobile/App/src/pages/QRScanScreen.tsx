/**
 * QRScanScreen – Quét QR để xem thông tin thành viên gia tộc
 *
 * Hỗ trợ quét QR dạng chuỗi JSON hoặc mã thành viên để truy xuất thông tin lý lịch đầy đủ.
 * Tích hợp chế độ "Tưởng Niệm & Vinh Danh" đặc biệt tôn kính dành cho Cố Hương Linh đã khuất.
 * Bổ sung tính năng chọn ảnh QR từ Thư Viện ảnh và tự động giải mã thông minh.
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
  Dimensions,
} from 'react-native';
import { Camera } from 'react-native-camera-kit';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { apiFetch } from '../genaral/api';
import { STORAGE_TOKEN_KEY } from '../genaral/authService';
import { borderRadius, fontSize, rs, rvs, rf, screen, spacing } from '../config/theme';
import { getDualDateDisplay } from '../utils/lunarDate';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────
interface MappedMember {
  id          : number;
  id_dong_ho  : number;
  ten_day_du  : string;
  gioi_tinh   : string | null;
  ngay_sinh   : string | null;
  ngay_mat    : string | null;
  da_mat      : boolean;
  id_cha      : number | null;
  id_me       : number | null;
  vo_chong_ids: number[];
  tieu_su     : string | null;
  anh_dai_dien: string | null;
  dong_ho     ?: string | null;
}

interface QRScanScreenProps {
  navigation: any;
}

// ─────────────────────────────────────────────────────────
//  Silhouette Avatar Component
// ─────────────────────────────────────────────────────────
const SilhouetteAvatar: React.FC<{ gender: string }> = ({ gender }) => {
  const isNam = gender.toLowerCase() === 'nam';
  return (
    <View style={styles.silhouetteContainer}>
      <View style={[styles.silhouetteHair, isNam ? styles.hairMale : styles.hairFemale]} />
      <View style={styles.silhouetteHead} />
      <View style={styles.silhouetteNeck} />
      <LinearGradient
        colors={isNam ? ['#54A0E6', '#2563EB'] : ['#EC4899', '#BE185D']}
        style={styles.silhouetteBody}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────
//  Animated scanner line
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

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, rs(220)] });

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
//  Member Info Bottom Sheet (With Memorial Display Option)
// ─────────────────────────────────────────────────────────
const MemberCard: React.FC<{
  member     : MappedMember | null;
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

  const birthObj = member ? getDualDateDisplay(member.ngay_sinh) : null;
  const deathObj = member ? getDualDateDisplay(member.ngay_mat) : null;

  return (
    <View style={styles.sheetOverlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sheetHandle} />

        {loading ? (
          <View style={styles.sheetCenter}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.sheetLoadingText}>Đang kết nối máy chủ dòng tộc...</Text>
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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Avatar & Memorial Badge */}
            <View style={styles.sheetAvatarRow}>
              <View style={[styles.avatarRing, member.da_mat ? { borderColor: '#F59E0B' } : { borderColor: '#6C63FF' }]}>
                <SilhouetteAvatar gender={member.gioi_tinh ?? 'nam'} />
              </View>
              {member.da_mat && (
                <LinearGradient colors={['#FBBF24', '#D97706']} style={styles.deceasedBadge}>
                  <Ionicons name="ribbon" size={11} color="#FFF" />
                  <Text style={styles.deceasedBadgeTxt}>Cố Hương Linh</Text>
                </LinearGradient>
              )}
            </View>

            {/* Custom memorial style for deceased members */}
            {member.da_mat ? (
              <View style={styles.memorialHeader}>
                <Text style={styles.memorialPre}>TẤM BIA TƯỞNG NIỆM</Text>
                <Text style={styles.memorialName}>{member.ten_day_du}</Text>
                <Text style={styles.memorialSub}>"Sinh vi hoạt, tử vi thần - Công đức ngàn năm lưu hậu thế"</Text>
              </View>
            ) : (
              <View style={styles.normalHeader}>
                <Text style={styles.sheetName}>{member.ten_day_du}</Text>
                {member.dong_ho && (
                  <View style={styles.dongHoBadge}>
                    <Ionicons name="git-network-outline" size={12} color="#A78BFA" />
                    <Text style={styles.dongHoText}>Dòng họ {member.dong_ho}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Detailed Info Card Stack */}
            <View style={styles.infoCard}>
              {/* Giới tính */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="male-female-outline" size={16} color="#A78BFA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Giới tính</Text>
                  <Text style={styles.infoValue}>
                    {member.gioi_tinh === 'nam' ? 'Nam' : member.gioi_tinh === 'nu' ? 'Nữ' : 'Chưa rõ'}
                  </Text>
                </View>
              </View>

              {/* Ngày sinh (Dương & Âm) */}
              <View style={[styles.infoRow, styles.infoRowBorder]}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="gift-outline" size={16} color="#A78BFA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Ngày sinh (Dương lịch)</Text>
                  <Text style={styles.infoValue}>{birthObj?.solar ?? 'Chưa rõ'}</Text>
                  {birthObj?.lunar && (
                    <View style={styles.lunarContainer}>
                      <Ionicons name="moon" size={10} color="#F59E0B" />
                      <Text style={styles.lunarText}>Âm lịch: {birthObj.lunar}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Ngày giỗ / Ngày mất (Nếu đã khuất) */}
              {member.da_mat ? (
                <View style={[styles.infoRow, styles.infoRowBorder, { backgroundColor: 'rgba(217,119,6,0.05)' }]}>
                  <View style={[styles.infoIconWrap, { backgroundColor: 'rgba(217,119,6,0.15)' }]}>
                    <Ionicons name="heart-dislike-outline" size={16} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoLabel, { color: '#FBBF24' }]}>NGÀY MẤT / NGÀY GIỖ (Dương lịch)</Text>
                    <Text style={[styles.infoValue, { color: '#F59E0B', fontWeight: 'bold' }]}>
                      {deathObj?.solar ?? 'Chưa rõ'}
                    </Text>
                    {deathObj?.lunar && (
                      <View style={styles.lunarContainer}>
                        <Ionicons name="star" size={10} color="#F59E0B" />
                        <Text style={[styles.lunarText, { color: '#FBBF24', fontWeight: 'bold' }]}>
                          Kỵ Nhật (Âm lịch): {deathObj.lunar}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                <View style={[styles.infoRow, styles.infoRowBorder]}>
                  <View style={styles.infoIconWrap}>
                    <Ionicons name="heart-outline" size={16} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>Tình trạng</Text>
                    <Text style={[styles.infoValue, { color: '#10B981', fontWeight: '800' }]}>Còn sống</Text>
                  </View>
                </View>
              )}

              {/* Tiểu sử dòng đời & Công đức */}
              <View style={[styles.infoRow, styles.infoRowBorder]}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="document-text-outline" size={16} color="#A78BFA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Tiểu sử & Sự nghiệp</Text>
                  <Text style={[styles.infoValue, styles.biographyText]}>
                    {member.tieu_su && member.tieu_su.trim() !== ''
                      ? member.tieu_su
                      : 'Chưa cập nhật tiểu sử cuộc đời.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.scanAgainBtn} onPress={onScanAgain}>
                <Ionicons name="qr-code-outline" size={18} color="#6C63FF" />
                <Text style={styles.scanAgainText}>Quét tiếp</Text>
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
  const [memberData,    setMemberData]    = useState<MappedMember | null>(null);
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

  // Xin quyền camera
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title  : 'Cần quyền Camera',
            message: 'Ứng dụng cần camera để quét QR của thành viên dòng họ',
            buttonPositive: 'Đồng ý',
            buttonNegative: 'Từ chối',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
        } else {
          Alert.alert('Không có quyền camera', 'Vui lòng cấp quyền trong Cài đặt để tiếp tục', [
            { text: 'Đóng', onPress: () => navigation.goBack() },
          ]);
        }
      } else {
        setHasPermission(true);
      }
    })();
  }, []);

  // Gọi API lấy thông tin chi tiết thành viên
  const fetchMember = useCallback(async (memberId: string) => {
    setIsLoading(true);
    setFetchError(null);
    setMemberData(null);
    try {
      const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
      const res   = await apiFetch<{ success: boolean; data: { thong_tin: any } }>(
        `/nguoi/qr-detail?id=${memberId}`,
        { method: 'GET' },
        token ?? undefined,
      );
      if (res.data && res.data.thong_tin) {
        setMemberData(res.data.thong_tin);
      } else {
        setFetchError('Không tìm thấy thông tin chi tiết thành viên.');
      }
    } catch (err: any) {
      const msg = err?.status === 404
        ? 'Thành viên không tồn tại trong hệ thống dòng tộc'
        : (err?.message ?? 'Không thể kết nối máy chủ dòng tộc');
      setFetchError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Khi quét được QR code
  const handleQRRead = useCallback((event: { nativeEvent: { codeStringValue: string } }) => {
    if (!scanning || showSheet) return;
    const value = event.nativeEvent.codeStringValue?.trim();
    if (!value || value === lastScannedRef.current) return;
    lastScannedRef.current = value;

    let memberId = '';

    // Phân tích định dạng JSON đặc biệt của thẻ QR
    if (value.startsWith('{') && value.endsWith('}')) {
      try {
        const parsed = JSON.parse(value);
        if (parsed.app === 'QLCayGiaPha' && parsed.id) {
          memberId = String(parsed.id);
        } else if (parsed.id) {
          memberId = String(parsed.id);
        }
      } catch (e) {
        // Fallback
      }
    }

    if (!memberId) {
      if (value.startsWith('cgp_member:')) {
        memberId = value.replace('cgp_member:', '');
      } else {
        memberId = value;
      }
    }

    if (!/^\d+$/.test(memberId)) {
      setFetchError('Mã QR không đúng định dạng. Vui lòng quét QR của thành viên trong dòng họ.');
      setShowSheet(true);
      setScanning(false);
      return;
    }

    triggerPulse();
    setScanning(false);
    setShowSheet(true);
    fetchMember(memberId);
  }, [scanning, showSheet, fetchMember]);

  // Chọn ảnh QR từ Thư viện và giải mã thông minh
  const handleSelectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri) return;

      // Hiển thị trạng thái tải thông tin ngay
      setIsLoading(true);
      setFetchError(null);
      setMemberData(null);
      setShowSheet(true);
      setScanning(false);

      // Tạo FormData tải lên máy chủ API giải mã QR miễn phí cực kỳ nhanh
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'qr_code.jpg',
      } as any);

      const qrRes = await fetch('https://api.qrserver.com/v1/read-qr-code/', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      const qrJson = await qrRes.json();
      const qrData = qrJson[0]?.symbol[0]?.data;

      if (!qrData) {
        setFetchError('Không thể nhận dạng mã QR trong bức ảnh này. Bạn vui lòng chọn bức ảnh chụp trực diện và rõ nét hơn nhé.');
        return;
      }

      const value = qrData.trim();
      let memberId = '';

      if (value.startsWith('{') && value.endsWith('}')) {
        try {
          const parsed = JSON.parse(value);
          if (parsed.app === 'QLCayGiaPha' && parsed.id) {
            memberId = String(parsed.id);
          } else if (parsed.id) {
            memberId = String(parsed.id);
          }
        } catch (e) {
          // Fallback
        }
      }

      if (!memberId) {
        if (value.startsWith('cgp_member:')) {
          memberId = value.replace('cgp_member:', '');
        } else {
          memberId = value;
        }
      }

      if (!/^\d+$/.test(memberId)) {
        setFetchError('Nội dung QR nhận diện không hợp lệ. Vui lòng quét ảnh QR của thành viên gia tộc.');
        return;
      }

      // Lấy chi tiết thông tin
      fetchMember(memberId);
    } catch (err: any) {
      setIsLoading(false);
      setShowSheet(false);
      setScanning(true);
      Alert.alert(
        'Yêu cầu khởi động lại ứng dụng ⚙️',
        'Thư viện ảnh mới được thêm cần được biên dịch lại vào mã nguồn. Bạn vui lòng tắt app đang mở, mở terminal chạy lại lệnh "npm run android" để kích hoạt tính năng này nhé!'
      );
    }
  };

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

      {/* Camera */}
      <Camera
        style={StyleSheet.absoluteFill}
        scanBarcode
        onReadCode={handleQRRead}
        showFrame={false}
        laserColor="transparent"
        frameColor="transparent"
        torchMode={flashOn ? 'on' : 'off'}
        cameraType="back"
      />

      {/* Viewfinder Overlay */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddleRow}>
          <View style={styles.overlaySide} />
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

      {/* Top bar */}
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

      {/* Hint */}
      <View style={styles.hintWrap} pointerEvents="none">
        <View style={styles.hintBox}>
          <Ionicons name="scan-outline" size={13} color="rgba(255,255,255,0.65)" />
          <Text style={styles.hintText}>Đưa mã QR của thành viên vào khung để quét</Text>
        </View>
      </View>

      {/* Gallery Image Picker Button */}
      <View style={styles.galleryButtonWrap}>
        <TouchableOpacity style={styles.galleryBtn} onPress={handleSelectImage} activeOpacity={0.85}>
          <LinearGradient colors={['rgba(108,99,255,0.9)', 'rgba(79,70,229,0.7)']} style={styles.galleryBtnGrad}>
            <Ionicons name="images-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.galleryBtnTxt}>Tải ảnh QR từ Thư viện</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Bottom sheet */}
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
const VF_SIZE    = rs(260);
const CORNER_LEN = rs(28);
const CORNER_W   = rs(3);

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
  overlayTop       : { flex: 1, backgroundColor: 'rgba(7,7,18,0.72)', minHeight: rvs(Platform.OS === 'ios' ? 174 : 186) },
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
    top            : Platform.OS === 'ios' ? rvs(56) : rvs(44),
    left           : spacing.lg,
    right          : spacing.lg,
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'space-between',
  },
  topBtn     : { borderRadius: borderRadius.full, overflow: 'hidden' },
  topBtnGrad : {
    width: rs(44), height: rs(44), borderRadius: rs(22),
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  topTitleBox  : {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    backgroundColor: 'rgba(12,10,30,0.82)',
    paddingHorizontal: spacing.md, paddingVertical: rvs(8),
    borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)',
  },
  topTitleText : { fontSize: fontSize.sm, fontWeight: '700', color: '#fff' },

  // Hint
  hintWrap: { position: 'absolute', bottom: rvs(120), left: 0, right: 0, alignItems: 'center' },
  hintBox : {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    backgroundColor: 'rgba(12,10,30,0.78)',
    borderWidth: 1, borderColor: 'rgba(108,99,255,0.25)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, paddingVertical: rvs(8),
  },
  hintText: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },

  // Gallery Picker Button
  galleryButtonWrap: {
    position: 'absolute',
    bottom: rvs(50),
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  galleryBtn: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: rs(4) },
    shadowOpacity: 0.3,
    shadowRadius: rs(8),
    elevation: 5,
  },
  galleryBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(22),
    paddingVertical: rvs(12),
    borderRadius: borderRadius.full,
  },
  galleryBtnTxt: {
    color: '#FFF',
    fontSize: rf(14),
    fontWeight: '800',
  },

  // Bottom sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor    : '#0E0A26',
    borderTopLeftRadius : rs(28),
    borderTopRightRadius: rs(28),
    borderWidth        : 1,
    borderColor        : 'rgba(108,99,255,0.25)',
    paddingHorizontal  : spacing.lg,
    paddingBottom      : Platform.OS === 'ios' ? rvs(40) : rvs(28),
    paddingTop         : spacing.md,
    maxHeight          : '85%',
  },
  sheetHandle      : { width: rs(40), height: rs(4), borderRadius: rs(2), backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: spacing.lg },
  sheetCenter      : { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  sheetLoadingText : { fontSize: fontSize.md, color: 'rgba(255,255,255,0.55)' },
  sheetErrTitle    : { fontSize: fontSize.xl, fontWeight: '800', color: '#EF4444' },
  sheetErrSub      : { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  retryBtn         : {
    flexDirection: 'row', alignItems: 'center', gap: rs(6), marginTop: spacing.sm,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(108,99,255,0.2)', borderWidth: 1, borderColor: 'rgba(108,99,255,0.4)',
  },
  retryBtnText     : { fontSize: fontSize.md, color: '#A78BFA', fontWeight: '600' },

  // Member Avatar Ring
  sheetAvatarRow : { alignItems: 'center', marginBottom: spacing.sm },
  avatarRing: {
    width: rs(86),
    height: rs(86),
    borderRadius: rs(43),
    borderWidth: rs(3),
    justifyContent: 'center',
    alignItems: 'center',
    padding: rs(3),
  },
  deceasedBadge: {
    position: 'absolute',
    bottom: rs(-6),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    paddingHorizontal: rs(10),
    paddingVertical: rs(3),
    borderRadius: rs(12),
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.35,
    shadowRadius: rs(4),
    elevation: 2,
  },
  deceasedBadgeTxt: {
    fontSize: rf(9.5),
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // Memorial design styles
  memorialHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  memorialPre: {
    fontSize: rf(9.5),
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 2,
    marginBottom: rs(4),
  },
  memorialName: {
    fontSize: rf(24),
    fontWeight: '900',
    color: '#FBBF24',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  memorialSub: {
    fontSize: rf(12),
    fontWeight: '700',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: rvs(6),
    lineHeight: rf(18),
    paddingHorizontal: rs(12),
  },

  // Normal header
  normalHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetName        : { fontSize: fontSize.xxl, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5, marginBottom: spacing.xs },
  dongHoBadge      : {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(108,99,255,0.15)', borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)',
  },
  dongHoText       : { fontSize: fontSize.xs, color: '#A78BFA', fontWeight: '600' },

  // Info card
  infoCard    : {
    backgroundColor : 'rgba(255,255,255,0.04)',
    borderRadius    : borderRadius.xl,
    borderWidth     : 1, borderColor: 'rgba(108,99,255,0.15)',
    overflow        : 'hidden', marginBottom: spacing.lg,
  },
  infoRow      : { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  infoIconWrap : { width: rs(34), height: rs(34), borderRadius: rs(10), backgroundColor: 'rgba(108,99,255,0.15)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  infoLabel    : { fontSize: fontSize.xxs, color: 'rgba(255,255,255,0.35)', fontWeight: '650', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue    : { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.85)', fontWeight: '700', marginTop: rs(2) },
  
  lunarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    marginTop: rs(4),
  },
  lunarText: {
    fontSize: rf(11.5),
    color: '#F59E0B',
    fontWeight: '700',
    fontStyle: 'italic',
  },
  biographyText: {
    fontWeight: '500',
    lineHeight: rf(20),
    color: 'rgba(255,255,255,0.75)',
  },

  // Silhouette graphics
  silhouetteContainer: {
    width: rs(68),
    height: rs(68),
    borderRadius: rs(34),
    backgroundColor: '#E2E8F0',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  silhouetteHair: {
    position: 'absolute',
    top: rs(6),
    zIndex: 3,
  },
  hairMale: {
    width: rs(26),
    height: rs(14),
    borderTopLeftRadius: rs(14),
    borderTopRightRadius: rs(14),
    backgroundColor: '#1E293B',
  },
  hairFemale: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    backgroundColor: '#1E293B',
    top: rs(5),
  },
  silhouetteHead: {
    width: rs(24),
    height: rs(24),
    borderRadius: rs(12),
    backgroundColor: '#FDBA74',
    position: 'absolute',
    top: rs(14),
    zIndex: 2,
  },
  silhouetteNeck: {
    width: rs(8),
    height: rs(8),
    backgroundColor: '#E59B5F',
    position: 'absolute',
    top: rs(32),
    zIndex: 1,
  },
  silhouetteBody: {
    width: rs(58),
    height: rs(22),
    borderTopLeftRadius: rs(22),
    borderTopRightRadius: rs(22),
    zIndex: 2,
  },

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
