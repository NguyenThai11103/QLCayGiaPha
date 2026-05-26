/**
 * MoPhanScreen – Mộ Phần
 * List view các mộ trong dòng họ · kết nối API · CRUD
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, Platform, Animated, Modal, ScrollView,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Alert, Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../genaral/api';
import { STORAGE_TOKEN_KEY } from '../genaral/authService';
import { colors, spacing } from '../config/theme';
import { useTheme } from '../context/ThemeContext';

// ─────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────
interface MoPhan {
  id              : number;
  dong_ho_id      : number;
  thanh_vien_id   : number;
  vi_do           : string | null;
  kinh_do         : string | null;
  ghi_chu         : string | null;
  nguoi_cap_nhat_id: number | null;
  created_at      : string;
  updated_at      : string;
  ten_thanh_vien  : string;
  tinh_trang_song : string;
  ten_nguoi_cap_nhat: string | null;
}

interface MoPhanRaw {
  id              : number;
  dong_ho_id      : number;
  thanh_vien_id   : number;
  vi_do           : string | null;
  kinh_do         : string | null;
  ghi_chu         : string | null;
  nguoi_cap_nhat_id: number | null;
  created_at      : string;
  updated_at      : string;
  ten_thanh_vien  : string;
  tinh_trang_song : string;
  ten_nguoi_cap_nhat: string | null;
}

// ─────────────────────────────────────────────────────────
//  MoPhanCard
// ─────────────────────────────────────────────────────────
const MoPhanCard: React.FC<{
  item   : MoPhan;
  index  : number;
  onPress: () => void;
  theme  : ReturnType<typeof useTheme>['theme'];
}> = ({ item, index, onPress, theme }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const isDeceased = item.tinh_trang_song === 'da_mat';

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, tension: 60, friction: 12,
      delay: index * 80, useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 10 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start(onPress);
  };

  const hasCoords = item.vi_do && item.kinh_do;
  const initial = (item.ten_thanh_vien.split(' ').pop() ?? '?')[0]?.toUpperCase() ?? '?';

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [
        { scale },
        { translateY: anim.interpolate({ inputRange: [0,1], outputRange: [20, 0] }) },
      ],
    }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={1} style={[
        mc.card,
        { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : colors.white },
        { borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
      ]}>
        {/* Avatar */}
        <LinearGradient
          colors={isDeceased ? ['#94A3B8','#64748B'] : ['#D97706','#B45309']}
          style={mc.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <Text style={mc.avatarTxt}>{initial}</Text>
        </LinearGradient>

        {/* Content */}
        <View style={mc.content}>
          <View style={mc.nameRow}>
            <Text
              style={[mc.name, { color: theme.dark ? '#fff' : colors.gray[800] }]}
              numberOfLines={1}>
              {item.ten_thanh_vien}
            </Text>
            {isDeceased && (
              <View style={mc.deceasedBadge}>
                <Text style={mc.deceasedTxt}>Đã mất</Text>
              </View>
            )}
          </View>

          {/* Coordinates */}
          {hasCoords ? (
            <View style={mc.coordRow}>
              <Ionicons name="location" size={12} color="#D97706" />
              <Text style={[mc.coordText, { color: theme.dark ? 'rgba(255,255,255,0.4)' : colors.gray[500] }]}>
                {parseFloat(item.vi_do!).toFixed(4)}, {parseFloat(item.kinh_do!).toFixed(4)}
              </Text>
            </View>
          ) : (
            <View style={mc.coordRow}>
              <Ionicons name="location-outline" size={12} color={theme.dark ? 'rgba(255,255,255,0.25)' : colors.gray[400]} />
              <Text style={[mc.coordText, { color: theme.dark ? 'rgba(255,255,255,0.25)' : colors.gray[400] }]}>
                Chưa cập nhật vị trí
              </Text>
            </View>
          )}

          {/* Note */}
          {item.ghi_chu && (
            <Text
              style={[mc.note, { color: theme.dark ? 'rgba(255,255,255,0.4)' : colors.gray[500] }]}
              numberOfLines={1}>
              {item.ghi_chu}
            </Text>
          )}
        </View>

        {/* Arrow */}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.dark ? 'rgba(255,255,255,0.2)' : colors.gray[300]}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────
//  Detail Modal
// ─────────────────────────────────────────────────────────
const openMaps = (lat: string, lng: string, label: string) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  Linking.openURL(url).catch(() => {
    const fallback = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`;
    Linking.openURL(fallback).catch(() => {
      Alert.alert('Lỗi', 'Không thể mở bản đồ trên thiết bị này.');
    });
  });
};

const DetailModal: React.FC<{
  item  : MoPhan | null;
  onClose: () => void;
  onEdit : () => void;
  theme : ReturnType<typeof useTheme>['theme'];
}> = ({ item, onClose, onEdit, theme }) => {
  const slide = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (item) {
      Animated.spring(slide, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }).start();
    } else {
      Animated.timing(slide, { toValue: 500, duration: 200, useNativeDriver: true }).start();
    }
  }, [item, slide]);

  if (!item) return null;

  const initial = (item.ten_thanh_vien.split(' ').pop() ?? '?')[0]?.toUpperCase() ?? '?';
  const hasCoords = item.vi_do && item.kinh_do;
  const isDeceased = item.tinh_trang_song === 'da_mat';

  return (
    <Modal visible={!!item} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={dm.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
          <Animated.View style={[dm.sheet, { transform: [{ translateY: slide }] }]}>
            <View style={dm.handle} />

            {/* Header */}
            <View style={dm.headerRow}>
              <LinearGradient
                colors={isDeceased ? ['#94A3B8','#64748B'] : ['#D97706','#B45309']}
                style={dm.avatar}>
                <Text style={dm.avatarTxt}>{initial}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={dm.name}>{item.ten_thanh_vien}</Text>
                {isDeceased && <Text style={dm.deceasedLabel}>Đã mất</Text>}
              </View>
            </View>

            <ScrollView style={dm.body} showsVerticalScrollIndicator={false}>
              {/* Coordinates */}
              <View style={dm.row}>
                <View style={dm.rowIcon}>
                  <Ionicons name="location" size={16} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={dm.rowLabel}>Vĩ độ</Text>
                  <Text style={dm.rowValue}>{item.vi_do ?? '—'}</Text>
                </View>
              </View>
              <View style={[dm.row, dm.rowBorder]}>
                <View style={dm.rowIcon}>
                  <Ionicons name="navigate" size={16} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={dm.rowLabel}>Kinh độ</Text>
                  <Text style={dm.rowValue}>{item.kinh_do ?? '—'}</Text>
                </View>
              </View>

              {/* Note */}
              <View style={[dm.row, dm.rowBorder]}>
                <View style={dm.rowIcon}>
                  <Ionicons name="document-text-outline" size={16} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={dm.rowLabel}>Ghi chú</Text>
                  <Text style={dm.rowValue}>{item.ghi_chu ?? 'Không có ghi chú'}</Text>
                </View>
              </View>

              {/* Updated by */}
              {item.ten_nguoi_cap_nhat && (
                <View style={[dm.row, dm.rowBorder]}>
                  <View style={dm.rowIcon}>
                    <Ionicons name="person-outline" size={16} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={dm.rowLabel}>Người cập nhật</Text>
                    <Text style={dm.rowValue}>{item.ten_nguoi_cap_nhat}</Text>
                  </View>
                </View>
              )}

              {/* Date */}
              <View style={[dm.row, dm.rowBorder]}>
                <View style={dm.rowIcon}>
                  <Ionicons name="time-outline" size={16} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={dm.rowLabel}>Cập nhật lần cuối</Text>
                  <Text style={dm.rowValue}>
                    {new Date(item.updated_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={dm.actions}>
              {hasCoords && (
                <TouchableOpacity style={dm.navigateBtn} onPress={() => openMaps(item.vi_do!, item.kinh_do!, item.ten_thanh_vien)}>
                  <LinearGradient colors={['#10B981','#059669']} style={dm.navigateBtnInner}>
                    <Ionicons name="navigate" size={18} color="#fff" />
                    <Text style={dm.navigateBtnTxt}>Chỉ đường</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={dm.editBtn} onPress={onEdit}>
                <LinearGradient colors={['#D97706','#B45309']} style={dm.editBtnInner}>
                  <Ionicons name="create-outline" size={18} color="#fff" />
                  <Text style={dm.editBtnTxt}>Chỉnh sửa</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={dm.closeBtn} onPress={onClose}>
                <Text style={dm.closeBtnTxt}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────
//  Add / Edit Modal
// ─────────────────────────────────────────────────────────
const FormModal: React.FC<{
  visible : boolean;
  item    : MoPhan | null;
  onClose : () => void;
  onSaved : () => void;
}> = ({ visible, item, onClose, onSaved }) => {
  const slide = useRef(new Animated.Value(500)).current;
  const [saving, setSaving] = useState(false);
  const [viDo,   setViDo]   = useState('');
  const [kinhDo, setKinhDo] = useState('');
  const [ghiChu, setGhiChu] = useState('');

  useEffect(() => {
    if (visible) {
      Animated.spring(slide, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }).start();
      if (item) {
        setViDo(item.vi_do ?? '');
        setKinhDo(item.kinh_do ?? '');
        setGhiChu(item.ghi_chu ?? '');
      } else {
        setViDo(''); setKinhDo(''); setGhiChu('');
      }
    } else {
      Animated.timing(slide, { toValue: 500, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible, item, slide]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
      const body = {
        thanh_vien_id: item?.thanh_vien_id,
        vi_do        : viDo || null,
        kinh_do      : kinhDo || null,
        ghi_chu      : ghiChu || null,
      };
      if (item) {
        await apiFetch(`/mo-phan/update`, {
          method: 'POST',
          body: JSON.stringify({ ...body, id: item.id }),
        }, token ?? undefined);
      } else {
        await apiFetch('/mo-phan/create', {
          method: 'POST',
          body: JSON.stringify(body),
        }, token ?? undefined);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message ?? 'Không thể lưu mộ phần');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={fm.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
          <Animated.View style={[fm.sheet, { transform: [{ translateY: slide }] }]}>
            <View style={fm.handle} />
            <Text style={fm.title}>{item ? 'Chỉnh sửa mộ phần' : 'Thêm mộ phần'}</Text>
            {item && (
              <Text style={fm.subtitle}>{item.ten_thanh_vien}</Text>
            )}

            <ScrollView style={fm.form} showsVerticalScrollIndicator={false}>
              <Text style={fm.label}>Vĩ độ</Text>
              <TextInput
                style={fm.input}
                value={viDo}
                onChangeText={setViDo}
                placeholder="Ví dụ: 21.0285"
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="decimal-pad"
              />

              <Text style={fm.label}>Kinh độ</Text>
              <TextInput
                style={fm.input}
                value={kinhDo}
                onChangeText={setKinhDo}
                placeholder="Ví dụ: 105.8542"
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="decimal-pad"
              />

              <Text style={fm.label}>Ghi chú</Text>
              <TextInput
                style={[fm.input, fm.textArea]}
                value={ghiChu}
                onChangeText={setGhiChu}
                placeholder="Mô tả vị trí mộ, địa chỉ..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={fm.actions}>
              <TouchableOpacity style={fm.cancelBtn} onPress={onClose} disabled={saving}>
                <Text style={fm.cancelBtnTxt}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={fm.saveBtn} onPress={handleSave} disabled={saving}>
                <LinearGradient colors={['#D97706','#B45309']} style={fm.saveBtnInner}>
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={fm.saveBtnTxt}>{item ? 'Cập nhật' : 'Thêm mới'}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────
//  Main Screen
// ─────────────────────────────────────────────────────────
const MoPhanScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const [list,      setList]      = useState<MoPhan[]>([]);
  const [loading,   setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [selected,  setSelected]  = useState<MoPhan | null>(null);
  const [formModal, setFormModal]  = useState(false);
  const [editItem,  setEditItem]  = useState<MoPhan | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const bgColor = theme.dark ? '#0A0015' : '#F5F7FA';

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, tension: 50, friction: 10, useNativeDriver: true }).start();
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
      const res = await apiFetch<{ data: MoPhanRaw[] }>(
        '/mo-phan/list',
        {},
        token ?? undefined,
      );
      const mapped: MoPhan[] = (res.data ?? []).map(n => ({
        id                : n.id,
        dong_ho_id        : n.dong_ho_id,
        thanh_vien_id     : n.thanh_vien_id,
        vi_do             : n.vi_do,
        kinh_do           : n.kinh_do,
        ghi_chu           : n.ghi_chu,
        nguoi_cap_nhat_id : n.nguoi_cap_nhat_id,
        created_at        : n.created_at,
        updated_at        : n.updated_at,
        ten_thanh_vien    : n.ten_thanh_vien,
        tinh_trang_song   : n.tinh_trang_song ?? 'con_song',
        ten_nguoi_cap_nhat: n.ten_nguoi_cap_nhat,
      }));
      setList(mapped);
    } catch (e: any) {
      setError(e?.message ?? 'Không thể tải danh sách mộ phần');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const textColor  = theme.dark ? '#fff' : colors.gray[800];
  const mutedColor = theme.dark ? 'rgba(255,255,255,0.4)' : colors.gray[500];

  return (
    <View style={[ms.root, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={theme.dark ? ['#050010','#0E0A26','#080018'] : ['#F5F7FA','#F5F7FA','#F5F7FA']}
        style={StyleSheet.absoluteFill}
      />
      {theme.dark && (
        <>
          <View style={[ms.orb, { top: -80, left: -60,  width: 260, height: 260, backgroundColor: '#7C3AED' }]} />
          <View style={[ms.orb, { bottom: 80, right: -70, width: 200, height: 200, backgroundColor: '#D97706' }]} />
        </>
      )}

      {/* ── Header ── */}
      <Animated.View style={[ms.header, {
        opacity  : headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-20, 0] }) }],
      }]}>
        <TouchableOpacity style={ms.backBtn} onPress={() => navigation.goBack()}>
          <LinearGradient
            colors={theme.dark ? ['rgba(167,139,250,0.15)','rgba(124,58,237,0.08)'] : ['rgba(108,99,255,0.1)','rgba(108,99,255,0.05)']}
            style={ms.backCircle}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={ms.headerCenter}>
          <Text style={[ms.headerSub, { color: theme.dark ? 'rgba(167,139,250,0.6)' : colors.gray[500] }]}>GIA ĐÌNH</Text>
          <Text style={[ms.headerTitle, { color: textColor }]}>Mộ Phần</Text>
        </View>

        <TouchableOpacity
          style={ms.addBtn}
          onPress={() => { setEditItem(null); setFormModal(true); }}>
          <LinearGradient
            colors={['#D97706','#B45309']}
            style={ms.addBtnInner}>
            <Ionicons name="add" size={22} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Stats */}
      {!loading && !error && (
        <View style={ms.statsRow}>
          <View style={[ms.statChip, { borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
            <Ionicons name="location" size={14} color="#D97706" />
            <Text style={[ms.statTxt, { color: mutedColor }]}>{list.length} mộ phần</Text>
          </View>
          <View style={[ms.statChip, { borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
            <Text style={[ms.statTxt, { color: mutedColor }]}>
              {list.filter(l => l.vi_do && l.kinh_do).length} có tọa độ
            </Text>
          </View>
        </View>
      )}

      {/* ── List ── */}
      {loading ? (
        <View style={ms.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[ms.loadingTxt, { color: mutedColor }]}>Đang tải mộ phần...</Text>
        </View>
      ) : error ? (
        <View style={ms.center}>
          <Ionicons name="cloud-offline-outline" size={52} color={theme.dark ? 'rgba(255,255,255,0.15)' : colors.gray[300]} />
          <Text style={[ms.emptyTitle, { color: textColor }]}>{error}</Text>
          <TouchableOpacity style={ms.retryBtn} onPress={() => load()}>
            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : list.length === 0 ? (
        <View style={ms.center}>
          <LinearGradient
            colors={theme.dark ? ['rgba(167,139,250,0.15)','rgba(124,58,237,0.05)'] : ['rgba(108,99,255,0.1)','rgba(108,99,255,0.05)']}
            style={ms.emptyIcon}>
            <Ionicons name="location-outline" size={40} color={theme.colors.primary} />
          </LinearGradient>
          <Text style={[ms.emptyTitle, { color: textColor }]}>Chưa có mộ phần</Text>
          <Text style={[ms.emptyBody, { color: mutedColor }]}>
            Nhấn nút + để thêm vị trí mộ phần{'\n'}của các thành viên đã mất
          </Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={ms.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => load(true)}
          renderItem={({ item, index }) => (
            <MoPhanCard item={item} index={index} onPress={() => setSelected(item)} theme={theme} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}

      {/* Detail Modal */}
      <DetailModal
        item={selected}
        onClose={() => setSelected(null)}
        onEdit={() => { setEditItem(selected); setFormModal(true); setSelected(null); }}
        theme={theme}
      />

      {/* Add / Edit Modal */}
      <FormModal
        visible={formModal}
        item={editItem}
        onClose={() => setFormModal(false)}
        onSaved={load}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  root      : { flex: 1 },
  orb       : { position: 'absolute', borderRadius: 999, opacity: 0.1 },
  header    : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backBtn   : { borderRadius: 12, overflow: 'hidden' },
  backCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  headerCenter: { alignItems: 'center' },
  headerSub : { fontSize: 9, fontWeight: '800', letterSpacing: 2.5 },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  addBtn    : { borderRadius: 14, overflow: 'hidden' },
  addBtnInner: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statsRow  : { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  statChip  : { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  statTxt   : { fontSize: 12, fontWeight: '600' },
  list      : { paddingHorizontal: spacing.lg, paddingBottom: 20 },
  center    : { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { fontSize: 13, fontWeight: '600' },
  emptyIcon : { width: 88, height: 88, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyBody : { fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
  retryBtn  : { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.1)', borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)' },
});

const mc = StyleSheet.create({
  card   : { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 14, borderWidth: 1, gap: 14 },
  avatar : { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarTxt: { fontSize: 20, fontWeight: '800', color: '#fff' },
  content: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name  : { fontSize: 14, fontWeight: '700', flex: 1 },
  deceasedBadge: { backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
  deceasedTxt : { fontSize: 9, fontWeight: '700', color: '#EF4444' },
  coordRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  coordText: { fontSize: 11, fontWeight: '500' },
  note   : { fontSize: 11, fontStyle: 'italic' },
});

const dm = StyleSheet.create({
  overlay : { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet   : { backgroundColor: '#1A1A2E', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: spacing.md },
  handle  : { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: spacing.lg },
  avatar  : { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontSize: 26, fontWeight: '800', color: '#fff' },
  name   : { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  deceasedLabel: { fontSize: 11, fontWeight: '600', color: '#EF4444', marginTop: 2 },
  body   : { maxHeight: 300 },
  row    : { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  rowIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(201,162,39,0.15)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  rowLabel: { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  rowValue: { fontSize: 14, color: '#fff', fontWeight: '500', marginTop: 3 },
  actions: { flexDirection: 'row', gap: 12, marginTop: spacing.md, flexWrap: 'wrap' },
  navigateBtn: { borderRadius: 14, overflow: 'hidden' },
  navigateBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 12 },
  navigateBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  editBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  editBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  editBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  closeBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  closeBtnTxt: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
});

const fm = StyleSheet.create({
  overlay : { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet   : { backgroundColor: '#1A1A2E', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: spacing.md, maxHeight: '85%' },
  handle  : { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: spacing.md },
  title   : { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: spacing.lg },
  form    : { maxHeight: 400 },
  label   : { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 14 },
  input   : {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  textArea: { minHeight: 100, paddingTop: 14 },
  actions : { flexDirection: 'row', gap: 12, marginTop: spacing.lg },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingVertical: 14 },
  cancelBtnTxt: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  saveBtn : { flex: 1, borderRadius: 14, overflow: 'hidden' },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  saveBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

export default MoPhanScreen;
