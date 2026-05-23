/**
 * TreeScreen – Cây Gia Phả
 * Features: BFS generation layout, node connections, tap for detail modal, zoom scroll
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform,
  Animated, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../genaral/api';
import { STORAGE_TOKEN_KEY } from '../genaral/authService';
import { colors, borderRadius, fontSize, spacing } from '../config/theme';
import { useTheme } from '../context/ThemeContext';

// ─────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────
interface TreeMember {
  id          : number;
  ten_day_du  : string;         // field thực tế từ API
  id_dong_ho  : number;
  gioi_tinh   ?: string | null;
  ngay_sinh   ?: string | null;
  ngay_mat    ?: string | null;
  da_mat      ?: boolean;
  id_cha      ?: number | null; // dùng để BFS
  id_me       ?: number | null;
  vo_chong_ids?: number[];
  tieu_su     ?: string | null;
  parent_id   ?: number | null; // được ghép từ id_cha sau khi load
  generation  ?: number;
}

interface NguoiRaw {
  id          : number;
  ho_ten      : string;
  dong_ho     ?: string | null;
  ngay_sinh   ?: string | null;
  ngay_mat    ?: string | null;
  chuc_danh   ?: string | null;
  que_quan    ?: string | null;
}

interface QuanHeRaw {
  id           : number;
  nguoi_id     : number;   // con
  nguoi_cha_id : number;   // cha / mẹ
  loai_quan_he : string;   // 'cha', 'me', 'vo', 'chong', ...
}

// ─────────────────────────────────────────────────────────
//  Utility: BFS phân thế hệ
// ─────────────────────────────────────────────────────────
const buildGenerations = (members: TreeMember[]): TreeMember[][] => {
  if (!members.length) return [];
  const map   = new Map<number, TreeMember>(members.map(m => [m.id, m]));
  const gens: TreeMember[][] = [];

  // Nếu backend đã có generation field
  if (members[0]?.generation !== undefined) {
    const maxGen = Math.max(...members.map(m => m.generation ?? 0));
    for (let g = 0; g <= maxGen; g++) {
      const row = members.filter(m => m.generation === g);
      if (row.length) gens.push(row);
    }
    return gens;
  }

  // Tự tính bằng BFS từ gốc (parent_id = null)
  const roots = members.filter(m => !m.parent_id || !map.has(m.parent_id));
  if (!roots.length) return [members]; // fallback: 1 thế hệ

  const visited = new Set<number>();
  let queue = roots;
  while (queue.length) {
    gens.push(queue);
    queue.forEach(m => visited.add(m.id));
    queue = members.filter(m => !visited.has(m.id) && m.parent_id && visited.has(m.parent_id));
  }
  // Thêm orphans chưa visit
  const orphans = members.filter(m => !visited.has(m.id));
  if (orphans.length) gens.push(orphans);
  return gens;
};

// ─────────────────────────────────────────────────────────
//  Gradient pool cho thế hệ
// ─────────────────────────────────────────────────────────
const GEN_COLORS = [
  ['#F59E0B','#D97706'], ['#6C63FF','#4F46E5'], ['#10B981','#059669'],
  ['#EC4899','#DB2777'], ['#3B82F6','#2563EB'], ['#8B5CF6','#7C3AED'],
];

// ─────────────────────────────────────────────────────────
//  Member Node
// ─────────────────────────────────────────────────────────
const NODE_W = 100;
const NODE_H = 112;

const MemberNode: React.FC<{
  member  : TreeMember;
  genIdx  : number;
  onPress : () => void;
  isRoot  : boolean;
  theme: ReturnType<typeof useTheme>['theme'];
}> = ({ member, genIdx, onPress, isRoot, theme }) => {
  const a    = useRef(new Animated.Value(0)).current;
  const grad = GEN_COLORS[genIdx % GEN_COLORS.length];
  const initial = (member.ten_day_du ?? '').split(' ').pop()?.[0]?.toUpperCase() ?? '?';
  const alive = !member.da_mat;

  const cardBg = theme.dark ? 'rgba(255,255,255,0.05)' : colors.white;
  const textColor = theme.dark ? '#fff' : colors.gray[800];
  const mutedColor = theme.dark ? 'rgba(255,255,255,0.4)' : colors.gray[500];

  useEffect(() => {
    Animated.spring(a, { toValue: 1, tension: 60, friction: 14, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: a, transform: [{ scale: a }], alignItems: 'center' }}>
      <TouchableOpacity style={[nd.node, isRoot && nd.nodeRoot, { backgroundColor: cardBg }]} onPress={onPress} activeOpacity={0.8}>
        {/* Ring for root */}
        {isRoot && (
          <LinearGradient colors={grad as any} style={nd.rootRing} />
        )}
        {/* Avatar */}
        <LinearGradient
          colors={alive ? grad as any : ['#374151','#1F2937']}
          style={[nd.avatar, isRoot && nd.avatarRoot]}>
          <Text style={nd.avatarTxt}>{initial}</Text>
        </LinearGradient>

        <Text style={[nd.name, { color: textColor }]} numberOfLines={2}>{member.ten_day_du}</Text>
        {member.gioi_tinh && (
          <Text style={[nd.role, { color: (grad[0] as string) }]} numberOfLines={1}>
            {member.gioi_tinh === 'nam' ? '♂' : '♀'}
          </Text>
        )}
        {member.da_mat && <Text style={nd.deceased}>†</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────
//  Generation Row
// ─────────────────────────────────────────────────────────
const GenRow: React.FC<{
  members  : TreeMember[];
  genIdx   : number;
  isLast   : boolean;
  onSelect : (m: TreeMember) => void;
  theme: ReturnType<typeof useTheme>['theme'];
}> = ({ members, genIdx, isLast, onSelect, theme }) => {
  const grad = GEN_COLORS[genIdx % GEN_COLORS.length];
  const mutedColor = theme.dark ? 'rgba(255,255,255,0.4)' : colors.gray[500];
  const textColor = theme.dark ? '#fff' : colors.gray[800];

  return (
    <View style={gr.wrap}>
      {/* Generation label */}
      <View style={gr.labelRow}>
        <LinearGradient colors={grad as any} style={gr.labelDot} />
        <Text style={[gr.labelText, { color: textColor }]}>
          {genIdx === 0 ? 'Thuỷ tổ' : `Thế hệ ${genIdx + 1}`}
        </Text>
        <View style={[gr.labelLine, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : colors.gray[300] }]} />
        <View style={[gr.memberCount, { borderColor: (grad[0] as string) + '50' }]}>
          <Text style={[gr.memberCountTxt, { color: grad[0] as string }]}>{members.length} người</Text>
        </View>
      </View>

      {/* Nodes row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={gr.nodesRow}>
        {members.map((m, i) => (
          <View key={m.id} style={{ alignItems: 'center' }}>
            {/* Connector dot at top (except root row) */}
            {genIdx > 0 && (
              <View style={[gr.connDot, { backgroundColor: mutedColor }]} />
            )}
            <MemberNode
              member={m} genIdx={genIdx}
              isRoot={genIdx === 0 && i === 0}
              onPress={() => onSelect(m)}
              theme={theme}
            />
          </View>
        ))}
      </ScrollView>

      {/* Vertical connector line to next gen */}
      {!isLast && (
        <View style={gr.connLine}>
          <LinearGradient
            colors={[grad[0] as string + '80', (GEN_COLORS[(genIdx + 1) % GEN_COLORS.length][0] as string) + '80']}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────
//  Member Detail Modal (compact)
// ─────────────────────────────────────────────────────────
const NodeDetail: React.FC<{ m: TreeMember | null; onClose: () => void; theme: ReturnType<typeof useTheme>['theme'] }> = ({ m, onClose, theme }) => {
  const slide = useRef(new Animated.Value(400)).current;
  useEffect(() => {
    if (m) Animated.spring(slide, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }).start();
  }, [m]);
  if (!m) return null;

  const initial = (m.ten_day_du ?? '').split(' ').pop()?.[0]?.toUpperCase() ?? '?';
  const grad = GEN_COLORS[0];
  const textColor = theme.dark ? '#fff' : colors.gray[800];
  const mutedColor = theme.dark ? 'rgba(255,255,255,0.4)' : colors.gray[500];
  const cardBg = theme.dark ? 'rgba(20,20,40,0.95)' : colors.white;

  const rows = [
    { icon: 'calendar-outline',     label: 'Ngày sinh', value: m.ngay_sinh ?? 'Chưa rõ' },
    { icon: 'heart-dislike-outline', label: 'Ngày mất', value: m.ngay_mat  ?? (m.da_mat ? 'Đã mất' : 'Còn sống') },
    { icon: 'person-outline',       label: 'Giới tính', value: m.gioi_tinh === 'nam' ? 'Nam' : m.gioi_tinh === 'nu' ? 'Nữ' : 'Chưa rõ' },
    { icon: 'reader-outline',       label: 'Tiểu sử',   value: m.tieu_su  ?? 'Chưa rõ' },
  ];
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={[nd2.overlay, { backgroundColor: theme.dark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[nd2.sheet, { transform: [{ translateY: slide }], backgroundColor: cardBg }]}>
          <View style={nd2.handle} />
          <View style={nd2.avatarRow}>
            <LinearGradient colors={grad as any} style={nd2.avatar}>
              <Text style={nd2.avatarTxt}>{initial}</Text>
            </LinearGradient>
          </View>
          <Text style={[nd2.name, { color: textColor }]}>{m.ten_day_du}</Text>
          {m.da_mat && (
            <View style={nd2.badge}>
              <Text style={nd2.badgeTxt}>Đã mất</Text>
            </View>
          )}
          <View style={[nd2.card, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : colors.gray[100] }]}>
            {rows.map((r, i) => (
              <View key={i} style={[nd2.row, i > 0 && [nd2.rowBorder, { borderTopColor: theme.dark ? 'rgba(255,255,255,0.1)' : colors.gray[200] }]]}>
                <View style={[nd2.rowIcon, { backgroundColor: theme.dark ? 'rgba(167,139,250,0.2)' : 'rgba(167,139,250,0.1)' }]}>
                  <Ionicons name={r.icon as any} size={15} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[nd2.rowLabel, { color: mutedColor }]}>{r.label}</Text>
                  <Text style={[nd2.rowValue, { color: textColor }]}>{r.value}</Text>
                </View>
              </View>
            ))}
          </View>
          <TouchableOpacity style={{ borderRadius: borderRadius.xl, overflow: 'hidden' }} onPress={onClose}>
            <LinearGradient colors={theme.dark ? ['#6C63FF','#4F46E5'] : ['#6C63FF','#8B5CF6']} style={nd2.closeBtn}>
              <Text style={nd2.closeTxt}>Đóng</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────
//  Main Screen
// ─────────────────────────────────────────────────────────
const TreeScreen: React.FC<{ navigation: any }> = () => {
  const { theme } = useTheme();
  const [members,   setMembers]   = useState<TreeMember[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [selected,  setSelected]  = useState<TreeMember | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);

      // /nguoi/list đã bao gồm id_cha, id_me sẵn
      const res = await apiFetch<{ data: NguoiRaw[] }>('/nguoi/list', {}, token ?? undefined);
      const nguoiList = res.data ?? [];

      // Ánh xạ parent_id = id_cha để BFS layout phân thế hệ
      const merged: TreeMember[] = nguoiList.map(n => ({
        ...n,
        parent_id: n.id_cha ?? null,
      }));

      setMembers(merged);
    } catch (e: any) {
      setError(e?.message ?? 'Không thể tải cây gia phả');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const generations = buildGenerations(members);
  const totalMembers = members.length;
  const totalGens    = generations.length;

  // Dynamic colors
  const bgColor = theme.dark ? '#070712' : '#F5F7FA';
  const textColor = theme.dark ? '#fff' : colors.gray[800];
  const mutedColor = theme.dark ? 'rgba(255,255,255,0.35)' : colors.gray[500];

  return (
    <View style={[ts.root, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={theme.dark ? ['#070712','#1A0A00','#070712'] : ['#F5F7FA','#FFF7ED','#F5F7FA']}
        style={StyleSheet.absoluteFill}
      />
      {theme.dark && (
        <>
          <View style={[ts.glow, { top: -60, left: -40, backgroundColor: '#F59E0B' }]} />
          <View style={[ts.glow, { bottom: 60, right: -60, backgroundColor: '#6C63FF' }]} />
        </>
      )}

      {/* Header */}
      <View style={ts.header}>
        <View>
          <Text style={[ts.sub, { color: mutedColor }]}>Gia tộc</Text>
          <Text style={[ts.title, { color: textColor }]}>Cây Gia Phả</Text>
        </View>
        <View style={ts.statsBadges}>
          <View style={[ts.statBadge, { backgroundColor: theme.dark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.1)' }]}>
            <Ionicons name="people" size={13} color="#F59E0B" />
            <Text style={[ts.statTxt, { color: '#F59E0B' }]}>{totalMembers} thành viên</Text>
          </View>
          <View style={[ts.statBadge, { borderColor: 'rgba(108,99,255,0.3)', backgroundColor: 'rgba(108,99,255,0.1)' }]}>
            <Ionicons name="git-branch" size={13} color="#A78BFA" />
            <Text style={[ts.statTxt, { color: '#A78BFA' }]}>{totalGens} thế hệ</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={ts.center}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={[ts.stateTxt, { color: mutedColor }]}>Đang tải cây gia phả...</Text>
        </View>
      ) : error ? (
        <View style={ts.center}>
          <Ionicons name="cloud-offline-outline" size={52} color="rgba(239,68,68,0.6)" />
          <Text style={[ts.stateTxt, { color: mutedColor }]}>{error}</Text>
          <TouchableOpacity style={ts.retryBtn} onPress={load}>
            <Ionicons name="refresh" size={16} color="#F59E0B" />
            <Text style={{ color: '#F59E0B', fontWeight: '600', fontSize: fontSize.sm }}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : generations.length === 0 ? (
        <View style={ts.center}>
          <Ionicons name="git-network-outline" size={64} color={mutedColor} />
          <Text style={[ts.stateTxt, { color: mutedColor }]}>Cây gia phả chưa có dữ liệu</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ts.scroll}>
          {generations.map((gen, gi) => (
            <GenRow
              key={gi} members={gen} genIdx={gi}
              isLast={gi === generations.length - 1}
              onSelect={setSelected}
              theme={theme}
            />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <NodeDetail m={selected} onClose={() => setSelected(null)} theme={theme} />
    </View>
  );
};

// ─────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────
const nd = StyleSheet.create({
  node      : { width: NODE_W, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  nodeRoot  : { borderColor: 'rgba(245,158,11,0.5)', backgroundColor: 'rgba(245,158,11,0.08)' },
  rootRing  : { position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: 21, opacity: 0.3 },
  avatar    : { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  avatarRoot: { width: 56, height: 56, borderRadius: 28 },
  avatarTxt : { fontSize: 20, fontWeight: '800', color: '#fff' },
  name      : { fontSize: 10, fontWeight: '700', color: '#fff', textAlign: 'center', lineHeight: 14 },
  role      : { fontSize: 9, fontWeight: '600', textAlign: 'center', marginTop: 3 },
  deceased  : { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
});

const gr = StyleSheet.create({
  wrap        : { alignItems: 'center', paddingBottom: 8 },
  labelRow    : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.sm, gap: 8, width: '100%' },
  labelDot    : { width: 8, height: 8, borderRadius: 4 },
  labelText   : { fontSize: fontSize.xs, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 },
  labelLine   : { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  memberCount : { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  memberCountTxt: { fontSize: 10, fontWeight: '700' },
  nodesRow    : { paddingHorizontal: spacing.lg, gap: 10, paddingVertical: 8 },
  connDot     : { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', marginBottom: 4 },
  connLine    : { width: 2, height: 32, overflow: 'hidden', marginVertical: 4 },
});

const nd2 = StyleSheet.create({
  overlay  : { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet    : { backgroundColor: '#0E0A26', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)', paddingHorizontal: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: spacing.md },
  handle   : { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: spacing.lg },
  avatarRow: { alignItems: 'center', marginBottom: spacing.md },
  avatar   : { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontSize: 28, fontWeight: '800', color: '#fff' },
  name     : { fontSize: fontSize.xxl, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5, marginBottom: spacing.xs },
  badge    : { alignSelf: 'center', paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: borderRadius.full, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', marginBottom: spacing.lg },
  badgeTxt : { fontSize: fontSize.xs, color: '#F59E0B', fontWeight: '600' },
  card     : { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: borderRadius.xl, borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)', overflow: 'hidden', marginBottom: spacing.lg },
  row      : { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  rowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  rowIcon  : { width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(245,158,11,0.12)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  rowLabel : { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  rowValue : { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginTop: 2 },
  closeBtn : { paddingVertical: spacing.md, alignItems: 'center', borderRadius: borderRadius.xl },
  closeTxt : { fontSize: fontSize.md, fontWeight: '700', color: '#fff' },
});

const ts = StyleSheet.create({
  root       : { flex: 1, backgroundColor: '#070712' },
  glow       : { position: 'absolute', width: 220, height: 220, borderRadius: 110, opacity: 0.09 },
  header     : { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sub        : { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.35)', fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
  title      : { fontSize: fontSize.xxxl, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: spacing.sm },
  statsBadges: { flexDirection: 'row', gap: 8 },
  statBadge  : { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.1)' },
  statTxt    : { fontSize: fontSize.xs, fontWeight: '700' },
  scroll     : { paddingTop: spacing.sm },
  center     : { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  stateTxt   : { fontSize: fontSize.md, color: 'rgba(255,255,255,0.35)' },
  retryBtn   : { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
});

export default TreeScreen;
