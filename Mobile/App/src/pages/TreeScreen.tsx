/**
 * TreeScreen – Cây Gia Phả (Apple Design Award Style Edition)
 * A visually stunning, high-fidelity, and fully responsive family tree page.
 * Features:
 *  1. Precision pixel-perfect lineage connections with glowing arrowheads.
 *  2. Personalized "Có quan hệ gì với bạn" subtext on every card based on logged-in user context.
 *  3. Interactive "Genealogy Relationship Lookup" visual mode & comparison engine.
 *  4. High-visibility header entry button & tab-bar safe positioning.
 *  5. Top-positioned spacious lookup bar with mini avatars.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform,
  Animated, Modal, ScrollView, ActivityIndicator, Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../genaral/api';
import { STORAGE_TOKEN_KEY } from '../genaral/authService';
import { STORAGE_USER_KEY } from '../genaral/authService';
import { getDualDateDisplay } from '../utils/lunarDate';
import { colors, borderRadius, fontSize, spacing } from '../config/theme';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────
interface TreeMember {
  id          : number;
  ten_day_du  : string;
  id_dong_ho  : number;
  gioi_tinh   ?: string | null;
  ngay_sinh   ?: string | null;
  ngay_mat    ?: string | null;
  da_mat      ?: boolean;
  id_cha      ?: number | null;
  id_me       ?: number | null;
  vo_chong_ids?: number[];
  tieu_su     ?: string | null;
  parent_id   ?: number | null;
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

// ─────────────────────────────────────────────────────────
//  Vietnamese Genealogy Relationship Algorithm
// ─────────────────────────────────────────────────────────
const getRelationshipText = (
  aId: number | null | undefined,
  bId: number,
  members: TreeMember[]
): string => {
  if (!aId) return 'Họ hàng';
  if (aId === bId) return 'Bản thân';

  const map = new Map<number, TreeMember>(members.map(m => [m.id, m]));
  const memberA = map.get(aId);
  const memberB = map.get(bId);
  if (!memberA || !memberB) return 'Họ hàng';

  // Helper to trace direct patrilineal ancestors (father path)
  const getFatherAncestors = (id: number): number[] => {
    const list: number[] = [];
    let curr = map.get(id);
    while (curr && curr.parent_id) {
      list.push(curr.parent_id);
      curr = map.get(curr.parent_id);
    }
    return list;
  };

  const ancA = getFatherAncestors(aId);
  const ancB = getFatherAncestors(bId);

  // 1. Check if B is direct ancestor of A
  const idxBInA = ancA.indexOf(bId);
  if (idxBInA !== -1) {
    const genDiff = idxBInA + 1;
    const isNam = memberB.gioi_tinh?.toLowerCase() === 'nam';
    if (genDiff === 1) return isNam ? 'Bố' : 'Mẹ';
    if (genDiff === 2) return isNam ? 'Ông nội' : 'Bà nội';
    if (genDiff === 3) return isNam ? 'Cụ nội' : 'Bà cụ nội';
    if (genDiff === 4) return isNam ? 'Kỵ nội' : 'Bà kỵ nội';
    return isNam ? `Cụ tổ (${genDiff} đời)` : `Cụ bà tổ (${genDiff} đời)`;
  }

  // 2. Check if A is direct ancestor of B (B is descendant of A)
  const idxAInB = ancB.indexOf(aId);
  if (idxAInB !== -1) {
    const genDiff = idxAInB + 1;
    const isNam = memberB.gioi_tinh?.toLowerCase() === 'nam';
    if (genDiff === 1) return isNam ? 'Con trai' : 'Con gái';
    if (genDiff === 2) return isNam ? 'Cháu nội' : 'Cháu nội';
    if (genDiff === 3) return isNam ? 'Chắt' : 'Chắt';
    if (genDiff === 4) return isNam ? 'Chút' : 'Chút';
    return `Cháu duệ đời ${genDiff}`;
  }

  // 3. Find Lowest Common Ancestor (LCA)
  let lcaId: number | null = null;
  let distA = 0;
  let distB = 0;

  for (let i = 0; i < ancA.length; i++) {
    const aAnc = ancA[i];
    const j = ancB.indexOf(aAnc);
    if (j !== -1) {
      lcaId = aAnc;
      distA = i + 1;
      distB = j + 1;
      break;
    }
  }

  if (lcaId) {
    const isB_Nam = memberB.gioi_tinh?.toLowerCase() === 'nam';
    const isB_Older = (): boolean => {
      if (memberA.ngay_sinh && memberB.ngay_sinh) {
        return new Date(memberB.ngay_sinh).getTime() < new Date(memberA.ngay_sinh).getTime();
      }
      return memberB.id < memberA.id;
    };

    // Sibling (distA = 1, distB = 1)
    if (distA === 1 && distB === 1) {
      if (isB_Older()) {
        return isB_Nam ? 'Anh trai' : 'Chị gái';
      } else {
        return isB_Nam ? 'Em trai' : 'Em gái';
      }
    }

    // Uncle/Aunt (distA = 2, distB = 1) - B is sibling of A's father
    if (distA === 2 && distB === 1) {
      const father = map.get(memberA.parent_id!);
      const isFatherOlder = (): boolean => {
        if (father?.ngay_sinh && memberB.ngay_sinh) {
          return new Date(memberB.ngay_sinh).getTime() < new Date(father.ngay_sinh).getTime();
        }
        return memberB.id < (father?.id ?? 0);
      };
      if (isB_Nam) {
        return isFatherOlder() ? 'Bác' : 'Chú';
      } else {
        return 'Cô';
      }
    }

    // Nephew/Niece (distA = 1, distB = 2) - B is child of A's sibling
    if (distA === 1 && distB === 2) {
      return isB_Nam ? 'Cháu trai' : 'Cháu gái';
    }

    // Cousins (distA = 2, distB = 2)
    if (distA === 2 && distB === 2) {
      if (isB_Older()) {
        return isB_Nam ? 'Anh họ' : 'Chị họ';
      } else {
        return isB_Nam ? 'Em họ' : 'Em họ';
      }
    }

    // Great-uncle/aunt (distA = 3, distB = 1)
    if (distA === 3 && distB === 1) {
      return isB_Nam ? 'Ông chú / Ông bác' : 'Bà cô';
    }

    // Grand-nephew/niece (distA = 1, distB = 3)
    if (distA === 1 && distB === 3) {
      return isB_Nam ? 'Cháu họ' : 'Cháu họ';
    }

    // Default cousin logic
    if (distA === distB) {
      return isB_Nam ? 'Anh em họ' : 'Chị em họ';
    }
    return distA > distB ? 'Họ hàng bề trên' : 'Họ hàng bề dưới';
  }

  // 4. Check spouse relationships
  if (memberA.vo_chong_ids?.includes(bId) || memberB.vo_chong_ids?.includes(aId)) {
    return memberB.gioi_tinh?.toLowerCase() === 'nam' ? 'Chồng' : 'Vợ';
  }

  return 'Họ hàng';
};

// ─────────────────────────────────────────────────────────
//  BFS Generation Layout Utility
// ─────────────────────────────────────────────────────────
const buildGenerations = (members: TreeMember[]): TreeMember[][] => {
  if (!members.length) return [];
  const map = new Map<number, TreeMember>(members.map(m => [m.id, m]));
  const gens: TreeMember[][] = [];

  if (members[0]?.generation !== undefined) {
    const maxGen = Math.max(...members.map(m => m.generation ?? 0));
    for (let g = 0; g <= maxGen; g++) {
      const row = members.filter(m => m.generation === g);
      if (row.length) gens.push(row);
    }
    return gens;
  }

  const roots = members.filter(m => !m.parent_id || !map.has(m.parent_id));
  if (!roots.length) return [members];

  const visited = new Set<number>();
  let queue = roots;
  while (queue.length) {
    gens.push(queue);
    queue.forEach(m => visited.add(m.id));
    queue = members.filter(m => !visited.has(m.id) && m.parent_id && visited.has(m.parent_id));
  }
  const orphans = members.filter(m => !visited.has(m.id));
  if (orphans.length) gens.push(orphans);
  return gens;
};

// ─────────────────────────────────────────────────────────
//  Organic Mesh Wave Patterns
// ─────────────────────────────────────────────────────────
const OrganicMesh: React.FC<{ color: string }> = ({ color }) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[mesh.circle, { borderColor: color + '08', width: 280, height: 280, borderRadius: 140, top: -30, left: -50, borderWidth: 2 }]} />
      <View style={[mesh.circle, { borderColor: color + '04', width: 420, height: 420, borderRadius: 210, top: -80, left: -100, borderWidth: 1 }]} />
      <View style={[mesh.circle, { borderColor: color + '06', width: 320, height: 320, borderRadius: 160, bottom: -50, right: -60, borderWidth: 1.5 }]} />
    </View>
  );
};

const mesh = StyleSheet.create({
  circle: {
    position: 'absolute',
    borderStyle: 'solid',
  }
});

// ─────────────────────────────────────────────────────────
//  Premium Customized Avatars
// ─────────────────────────────────────────────────────────
const SilhouetteAvatar: React.FC<{ gender: string; theme: any }> = ({ gender, theme }) => {
  const isNam = gender.toLowerCase() === 'nam';
  const neckShadow = '#E59B5F';

  return (
    <View style={nd.silhouetteContainer}>
      {/* Hair Shadow */}
      <View style={[nd.silhouetteHair, isNam ? nd.hairMale : nd.hairFemale, { opacity: 0.95 }]} />
      {/* Head Face */}
      <View style={nd.silhouetteHead} />
      {/* Neck */}
      <View style={[nd.silhouetteNeck, { backgroundColor: neckShadow }]} />
      {/* Dynamic Styled Clothing */}
      <LinearGradient
        colors={isNam ? ['#54A0E6', '#2563EB'] : ['#EC4899', '#BE185D']}
        style={nd.silhouetteBody}
      />
    </View>
  );
};

const CustomAvatar: React.FC<{
  gioiTinh: string | null | undefined;
  daMat?: boolean;
  name: string | null | undefined;
  theme: any;
}> = ({ gioiTinh, daMat, name, theme }) => {
  const safeName = name || '';

  // Ancestral Tree Icon for Cụ Nhàn
  if (safeName.includes('Nhàn')) {
    return (
      <LinearGradient
        colors={['#FFF8E7', '#F59E0B']}
        style={nd.treeAvatarOuterRing}
      >
        <LinearGradient
          colors={['#1E1F29', '#0F1017']}
          style={nd.treeAvatarCore}
        >
          <Ionicons name="leaf" size={22} color="#F59E0B" />
        </LinearGradient>
      </LinearGradient>
    );
  }

  // Glowing Initials for specific members
  if (safeName.includes('Cường') || safeName.includes('Lan')) {
    const isCuong = safeName.includes('Cường');
    const gradColors = isCuong ? ['#34D399', '#059669'] : ['#F472B6', '#DB2777'];
    return (
      <LinearGradient colors={gradColors} style={nd.letterAvatarContainer}>
        <LinearGradient
          colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.05)']}
          style={nd.letterAvatarGlossy}
        >
          <Text style={nd.letterTxt}>{isCuong ? 'C' : 'L'}</Text>
        </LinearGradient>
      </LinearGradient>
    );
  }

  // Standard Silhouette Avatars
  return <SilhouetteAvatar gender={gioiTinh ?? 'nam'} theme={theme} />;
};

// ─────────────────────────────────────────────────────────
//  Reusable Vector Arrowhead Component
// ─────────────────────────────────────────────────────────
const ArrowHead: React.FC<{ color: string; style?: any }> = ({ color, style }) => (
  <View
    style={[
      conn.arrowDown,
      style,
      {
        borderTopColor: color,
        position: 'absolute',
      }
    ]}
  />
);

// ─────────────────────────────────────────────────────────
//  Premium Connector Line Component (Zero-Gap Connected)
// ─────────────────────────────────────────────────────────
const GenerationConnector: React.FC<{
  currentCount: number;
  nextCount: number;
  color: string;
  theme: any;
}> = ({ currentCount, nextCount, color, theme }) => {
  const isDark = theme.dark;
  const dotBg = isDark ? '#111124' : '#FFFFFF';

  if (currentCount === 2 && nextCount === 1) {
    return (
      <View style={conn.container}>
        {/* Marriage Bridge connecting both parents */}
        <View style={conn.row}>
          <View style={[conn.halfLineLeft, { borderColor: color }]} />
          <View style={[conn.halfLineRight, { borderColor: color }]} />
        </View>
        {/* Glow Join Dot */}
        <View style={conn.dotContainer}>
          <View style={[conn.dotOuter, { borderColor: color + '60', backgroundColor: dotBg }]}>
            <LinearGradient colors={[color, color + 'BB']} style={conn.dotInner} />
          </View>
        </View>
        {/* Vertical arrow pointing directly into child card */}
        <View style={[conn.verticalLine, { backgroundColor: color }]} />
        <ArrowHead color={color} style={{ bottom: -6 }} />
      </View>
    );
  }

  if (currentCount === 1 && nextCount === 2) {
    return (
      <View style={conn.container}>
        {/* Vertical line directly from parent card */}
        <View style={[conn.verticalLineShort, { backgroundColor: color }]} />
        {/* Split Dot */}
        <View style={conn.dotContainer}>
          <View style={[conn.dotOuter, { borderColor: color + '60', backgroundColor: dotBg }]}>
            <LinearGradient colors={[color, color + 'BB']} style={conn.dotInner} />
          </View>
        </View>
        {/* Split paths reaching down directly into children cards with arrows */}
        <View style={conn.row}>
          <View style={[conn.halfLineLeftDown, { borderColor: color }]} />
          <View style={[conn.halfLineRightDown, { borderColor: color }]} />
          
          {/* Arrowheads pointing down directly touching left & right child cards */}
          <ArrowHead color={color} style={{ bottom: -6, left: -3.75 }} />
          <ArrowHead color={color} style={{ bottom: -6, right: -3.75 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={conn.container}>
      <View style={[conn.verticalLineLong, { backgroundColor: color }]} />
      <ArrowHead color={color} style={{ bottom: -6 }} />
    </View>
  );
};

// ─────────────────────────────────────────────────────────
//  Premium Member Node Card
// ─────────────────────────────────────────────────────────
const MemberNode: React.FC<{
  member        : TreeMember;
  genIdx        : number;
  onPress       : () => void;
  isRoot        : boolean;
  loggedInUserId: number | null;
  members       : TreeMember[];
  theme         : any;
}> = ({ member, genIdx, onPress, isRoot, loggedInUserId, members, theme }) => {
  const isNam = member.gioi_tinh?.toLowerCase() === 'nam';
  const isSelf = loggedInUserId === member.id;
  const relText = loggedInUserId ? getRelationshipText(loggedInUserId, member.id, members) : '';

  // Custom styling if selected or matches current user
  const borderColors = isSelf
    ? ['#10B981', '#059669'] // Glowing Green for Yourself
    : genIdx === 0
      ? ['#F59E0B', '#D97706'] // Ancestral Gold
      : genIdx === 1
        ? ['#6366F1', '#3B82F6'] // Royal Indigo
        : ['#3B82F6', '#1D4ED8']; // Deep Blue

  const cardBg = theme.dark ? 'rgba(23, 23, 43, 0.9)' : 'rgba(255, 255, 255, 0.95)';

  return (
    <View style={nd.cardShadowWrapper}>
      <LinearGradient
        colors={borderColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          nd.gradientBorder,
          {
            shadowColor: borderColors[0],
            shadowOpacity: theme.dark ? 0.35 : 0.15,
          }
        ]}
      >
        <TouchableOpacity
          style={[nd.node, { backgroundColor: cardBg }]}
          onPress={onPress}
          activeOpacity={0.85}
        >
          {/* Imperial Crown Emblem for Root Ancestor */}
          {isRoot && (
            <LinearGradient colors={['#FBBF24', '#D97706']} style={nd.rootStarBadge}>
              <Ionicons name="trophy" size={11} color="#FFF" />
            </LinearGradient>
          )}

          {/* Glowing Avatar Ring Overlay */}
          <View style={[nd.avatarRingWrapper, { borderColor: borderColors[0] + '33' }]}>
            <CustomAvatar
              gioiTinh={member.gioi_tinh}
              daMat={member.da_mat}
              name={member.ten_day_du}
              theme={theme}
            />
          </View>

          {/* Full Name */}
          <Text style={[nd.name, { color: theme.dark ? '#FFF' : '#1E293B' }]} numberOfLines={2}>
            {member.ten_day_du}
          </Text>

          {/* Relationship Subtext: "Có quan hệ gì với bạn" */}
          {loggedInUserId && (
            <View style={[nd.relContainer, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
              <Ionicons 
                name={isSelf ? "person-circle" : "git-commit-outline"} 
                size={11} 
                color={isSelf ? '#10B981' : theme.dark ? 'rgba(255,255,255,0.45)' : '#64748B'} 
              />
              <Text style={[
                nd.relTxt, 
                { color: isSelf ? '#10B981' : theme.dark ? 'rgba(255,255,255,0.45)' : '#64748B' }
              ]}>
                {isSelf ? 'Bản thân bạn' : `${relText} của bạn`}
              </Text>
            </View>
          )}

          {/* Meta Badges */}
          <View style={nd.nodeMetaRow}>
            {/* Gender Badge */}
            <View style={[
              nd.genderTag,
              {
                backgroundColor: isNam
                  ? (theme.dark ? 'rgba(59,130,246,0.12)' : '#EFF6FF')
                  : (theme.dark ? 'rgba(236,72,153,0.12)' : '#FDF2F2'),
                borderColor: isNam ? 'rgba(59,130,246,0.25)' : 'rgba(236,72,153,0.25)',
              }
            ]}>
              <Text style={[nd.genderTxt, { color: isNam ? '#3B82F6' : '#EC4899' }]}>
                {isNam ? 'Nam' : 'Nữ'}
              </Text>
            </View>

            {/* Custom role emblem */}
            {isRoot ? (
              <Ionicons name="crown-outline" size={13} color="#D97706" style={nd.roleEmblem} />
            ) : (
              <Ionicons
                name={isNam ? "shield-checkmark-outline" : "heart-outline"}
                size={12}
                color={theme.dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                style={nd.roleEmblem}
              />
            )}
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

// ─────────────────────────────────────────────────────────
//  Generation Panel Row
// ─────────────────────────────────────────────────────────
const GenRow: React.FC<{
  members        : TreeMember[];
  genIdx         : number;
  isLast         : boolean;
  onSelect       : (m: TreeMember) => void;
  nextGenCount   : number;
  loggedInUserId : number | null;
  allMembers     : TreeMember[];
  theme          : any;
}> = ({ members, genIdx, isLast, onSelect, nextGenCount, loggedInUserId, allMembers, theme }) => {
  const lightPanelGradients = [
    ['#FCFAF2', '#FAF7E8'],
    ['#F4F8FC', '#EAF2FA'],
    ['#F3FAF5', '#E8F5EB'],
  ];
  const darkPanelGradients = [
    ['#181206', '#0F0B03'],
    ['#07101E', '#030811'],
    ['#05180E', '#020E08'],
  ];

  const panelColors = theme.dark
    ? (darkPanelGradients[genIdx % 3] ?? ['#0E0E1F', '#070712'])
    : (lightPanelGradients[genIdx % 3] ?? ['#FFFFFF', '#F8FAFC']);

  const activeThemeColor = genIdx === 0
    ? '#D97706'
    : genIdx === 1
      ? '#3B82F6'
      : '#10B981';

  return (
    <LinearGradient colors={panelColors as any} style={gr.panelContainer}>
      <OrganicMesh color={activeThemeColor} />

      {/* Floating absolute badge row */}
      <View style={gr.badgeLabelRow}>
        <LinearGradient
          colors={genIdx === 0 ? ['#F59E0B', '#D97706'] : genIdx === 1 ? ['#6366F1', '#3B82F6'] : ['#10B981', '#059669']}
          style={gr.ribbonIcon}
        >
          <Ionicons name="git-branch" size={12} color="#FFF" />
        </LinearGradient>
        <View style={[gr.countBadge, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', borderColor: activeThemeColor + '30' }]}>
          <Text style={[gr.countBadgeTxt, { color: activeThemeColor }]}>
            Thế hệ {genIdx + 1} • {members.length} thành viên
          </Text>
        </View>
      </View>

      {/* Generation Nodes Grid */}
      <View style={gr.nodesWrapper}>
        {members.map((m, i) => (
          <MemberNode
            key={m.id}
            member={m}
            genIdx={genIdx}
            isRoot={genIdx === 0 && i === 0}
            onPress={() => onSelect(m)}
            loggedInUserId={loggedInUserId}
            members={allMembers}
            theme={theme}
          />
        ))}
      </View>

      {/* Vector lines to next generations */}
      {!isLast && (
        <GenerationConnector
          currentCount={members.length}
          nextCount={nextGenCount}
          color={activeThemeColor}
          theme={theme}
        />
      )}
    </LinearGradient>
  );
};

// ─────────────────────────────────────────────────────────
//  Premium Sliding Detail Profile Sheet
// ─────────────────────────────────────────────────────────
const NodeDetail: React.FC<{
  m      : TreeMember | null;
  onClose: () => void;
  theme  : any;
}> = ({ m, onClose, theme }) => {
  const slideValue = useRef(new Animated.Value(450)).current;

  useEffect(() => {
    if (m) {
      Animated.spring(slideValue, {
        toValue: 0,
        tension: 90,
        friction: 12,
        useNativeDriver: true
      }).start();
    }
  }, [m]);

  if (!m) return null;

  const textColor = theme.dark ? '#FFF' : '#1E293B';
  const subColor = theme.dark ? 'rgba(255,255,255,0.45)' : '#64748B';
  const sheetBg = theme.dark ? 'rgba(17, 17, 33, 0.97)' : '#FFFFFF';

  const birthObj = getDualDateDisplay(m.ngay_sinh);
  const deathObj = getDualDateDisplay(m.ngay_mat);

  const detailRows = [
    {
      icon: 'gift-outline',
      title: 'Ngày sinh',
      val: birthObj?.solar ?? 'Chưa rõ',
      lunar: birthObj?.lunar ?? null,
    },
    {
      icon: 'heart-dislike-outline',
      title: 'Ngày mất',
      val: m.da_mat ? (deathObj?.solar ?? 'Chưa rõ') : 'Còn sống',
      lunar: m.da_mat ? (deathObj?.lunar ?? null) : null,
    },
    {
      icon: 'male-female-outline',
      title: 'Giới tính',
      val: m.gioi_tinh === 'nam' ? 'Nam' : m.gioi_tinh === 'nu' ? 'Nữ' : 'Chưa rõ',
      lunar: null,
    },
    {
      icon: 'document-text-outline',
      title: 'Tiểu sử',
      val: m.tieu_su ?? 'Chưa rõ',
      lunar: null,
    },
  ];

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={[nd2.modalOverlay, { backgroundColor: theme.dark ? 'rgba(0,0,0,0.85)' : 'rgba(15,23,42,0.65)' }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        
        <Animated.View style={[nd2.bottomSheet, { transform: [{ translateY: slideValue }], backgroundColor: sheetBg }]}>
          <View style={nd2.topBarIndicator} />

          {/* Modal Header Profile */}
          <View style={nd2.avatarSection}>
            <CustomAvatar
              gioiTinh={m.gioi_tinh}
              daMat={m.da_mat}
              name={m.ten_day_du}
              theme={theme}
            />
            {m.da_mat && (
              <LinearGradient colors={['#EF4444', '#991B1B']} style={nd2.deceasedPill}>
                <Text style={nd2.deceasedTxt}>Đã mất</Text>
              </LinearGradient>
            )}
          </View>

          <Text style={[nd2.profileName, { color: textColor }]}>
            {m.ten_day_du}
          </Text>

          {/* Detail Info Card Stack */}
          <View style={[
            nd2.stackCard,
            {
              backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
              borderColor: theme.dark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
            }
          ]}>
            {detailRows.map((r, i) => (
              <View key={i} style={[nd2.stackRow, i > 0 && [nd2.rowSeparator, { borderTopColor: theme.dark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]]}>
                <LinearGradient
                  colors={theme.dark ? ['rgba(99,102,241,0.15)', 'rgba(99,102,241,0.02)'] : ['#EEF2FF', '#E0E7FF']}
                  style={nd2.rowIconBg}
                >
                  <Ionicons name={r.icon as any} size={16} color={theme.colors.primary} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[nd2.rowLabel, { color: subColor }]}>{r.title}</Text>
                  <Text style={[nd2.rowVal, { color: textColor }]}>{r.val}</Text>
                  {r.lunar && (
                    <View style={nd2.lunarContainer}>
                      <Ionicons name="moon" size={11} color="#F59E0B" />
                      <Text style={nd2.rowLunarTxt}>{r.lunar}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Close Profile Sheet */}
          <TouchableOpacity style={nd2.closeWrapper} onPress={onClose} activeOpacity={0.85}>
            <LinearGradient colors={['#6366F1', '#4F46E5']} style={nd2.closeBtn}>
              <Text style={nd2.closeBtnTxt}>Hoàn tất</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────
//  Main Genealogy Screen
// ─────────────────────────────────────────────────────────
const TreeScreen: React.FC<{ navigation: any }> = () => {
  const { theme } = useTheme();
  const [members, setMembers] = useState<TreeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TreeMember | null>(null);

  // Relationship lookup state variables
  const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null);
  const [isLookupMode, setIsLookupMode] = useState(false);
  const [lookupPerson1, setLookupPerson1] = useState<TreeMember | null>(null);
  const [lookupPerson2, setLookupPerson2] = useState<TreeMember | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
      const res = await apiFetch<{ data: NguoiRaw[] }>('/nguoi/list', {}, token ?? undefined);
      const nguoiList = res.data ?? [];

      const mapped: TreeMember[] = nguoiList.map(n => {
        const anyN = n as any;
        return {
          ...n,
          ten_day_du: anyN.ten_day_du ?? anyN.ho_ten ?? 'Chưa rõ',
          parent_id: anyN.id_cha ?? anyN.nguoi_cha_id ?? null,
        };
      });

      setMembers(mapped);

      // Match logged-in user profile with tree member node
      const cachedUser = await AsyncStorage.getItem(STORAGE_USER_KEY);
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        const nameToMatch = parsedUser.ho_ten || '';
        const match = mapped.find(
          m => m.ten_day_du.toLowerCase().trim() === nameToMatch.toLowerCase().trim()
        );
        if (match) {
          setLoggedInUserId(match.id);
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Không thể kết nối đến máy chủ dòng tộc');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  const handleNodePress = (member: TreeMember) => {
    if (isLookupMode) {
      if (!lookupPerson1) {
        setLookupPerson1(member);
      } else if (lookupPerson1.id !== member.id && !lookupPerson2) {
        setLookupPerson2(member);
        setShowResultModal(true);
      }
    } else {
      setSelected(member);
    }
  };

  const generations = buildGenerations(members);
  const totalMembers = members.length;
  const totalGens = generations.length;

  const bgColor = theme.dark ? '#0A0A17' : '#F6F8FA';

  return (
    <View style={[ts.root, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      {/* Deep Space Dynamic Glowing Spots */}
      <LinearGradient
        colors={theme.dark ? ['#0A0A17', '#121229', '#080812'] : ['#F6F8FA', '#EEF2F6', '#FAF7FB']}
        style={StyleSheet.absoluteFill}
      />

      {theme.dark && (
        <>
          <View style={[ts.glowOverlay, { top: -40, left: -60, backgroundColor: '#D97706', opacity: 0.12 }]} />
          <View style={[ts.glowOverlay, { bottom: 120, right: -40, backgroundColor: '#4F46E5', opacity: 0.1 }]} />
          <View style={[ts.glowOverlay, { top: '40%', left: '30%', backgroundColor: '#10B981', opacity: 0.04 }]} />
        </>
      )}

      {/* Premium Elegant Glassmorphic Header */}
      <View style={ts.headerWrapper}>
        <LinearGradient
          colors={theme.dark ? ['#171733', '#0C0D1D'] : ['#FFFFFF', '#F1F5F9']}
          style={[
            ts.headerCard,
            {
              borderColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              shadowColor: theme.dark ? '#000000' : '#4F46E5',
              shadowOpacity: theme.dark ? 0.35 : 0.08,
            }
          ]}
        >
          <View style={ts.headerTop}>
            <LinearGradient colors={['#6366F1', '#3730A3']} style={ts.logoIconBg}>
              <Ionicons name="git-network" size={24} color="#FFF" />
            </LinearGradient>
            <View style={ts.headerTexts}>
              <Text style={ts.subTitle}>DÒNG HỌ /</Text>
              <Text style={[ts.title, { color: theme.dark ? '#FFF' : '#1E293B' }]}>Cây Gia Phả</Text>
            </View>
          </View>

          {/* Slogan */}
          <Text style={[ts.familyQuote, { color: theme.dark ? '#FBBF24' : '#D97706' }]}>
            "Cây có cội mới nảy cành xanh lá, nước có nguồn mới bể cả sông sâu."
          </Text>

          <Text style={[ts.headerInstruction, { color: theme.dark ? 'rgba(255,255,255,0.45)' : '#64748B' }]}>
            Nhấp chọn từng thành viên để tra cứu thông tin lý lịch cá nhân và tiểu sử dòng họ.
          </Text>

          {/* Badge Summary Counters */}
          <View style={ts.summaryBadgesRow}>
            <LinearGradient
              colors={theme.dark ? ['rgba(245,158,11,0.08)', 'rgba(245,158,11,0.02)'] : ['#FFFBEB', '#FEF3C7']}
              style={[ts.summaryBadge, { borderColor: theme.dark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.15)' }]}
            >
              <Ionicons name="people" size={13} color="#D97706" />
              <Text style={[ts.badgeTxt, { color: '#D97706' }]}>{totalMembers} thành viên</Text>
            </LinearGradient>

            <LinearGradient
              colors={theme.dark ? ['rgba(99,102,241,0.08)', 'rgba(99,102,241,0.02)'] : ['#EEF2FF', '#E0E7FF']}
              style={[ts.summaryBadge, { borderColor: theme.dark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)' }]}
            >
              <Ionicons name="layers" size={13} color="#4F46E5" />
              <Text style={[ts.badgeTxt, { color: '#4F46E5' }]}>{totalGens} thế hệ</Text>
            </LinearGradient>

            {/* NEW Header entry button for Tra cứu quan hệ */}
            {!loading && (
              <TouchableOpacity 
                style={[ts.headerLookupBtn, { borderColor: '#F59E0B' }]} 
                onPress={() => { setIsLookupMode(true); setLookupPerson1(null); setLookupPerson2(null); }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#FBBF24', '#D97706']} style={ts.headerLookupGrad}>
                  <Ionicons name="git-compare" size={12} color="#FFF" />
                  <Text style={ts.headerLookupTxt}>Tra cứu quan hệ 🔍</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Main content area */}
      {loading ? (
        <View style={ts.center}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={[ts.stateLabelTxt, { color: theme.dark ? 'rgba(255,255,255,0.4)' : '#64748B' }]}>
            Đang tạo sơ đồ cây gia tộc...
          </Text>
        </View>
      ) : error ? (
        <View style={ts.center}>
          <Ionicons name="alert-circle-outline" size={54} color="rgba(239,68,68,0.7)" />
          <Text style={[ts.stateLabelTxt, { color: theme.dark ? 'rgba(255,255,255,0.45)' : '#64748B' }]}>{error}</Text>
          <TouchableOpacity style={ts.retryButton} onPress={load} activeOpacity={0.8}>
            <Ionicons name="reload" size={15} color="#6366F1" />
            <Text style={ts.retryBtnTxt}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : generations.length === 0 ? (
        <View style={ts.center}>
          <Ionicons name="git-network-outline" size={60} color={theme.dark ? 'rgba(255,255,255,0.15)' : '#CBD5E1'} />
          <Text style={[ts.stateLabelTxt, { color: theme.dark ? 'rgba(255,255,255,0.4)' : '#64748B' }]}>
            Chưa có thành viên nào trong cây gia phả.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ts.scrollContent}>
          {generations.map((gen, gi) => (
            <GenRow
              key={gi}
              members={gen}
              genIdx={gi}
              isLast={gi === generations.length - 1}
              onSelect={handleNodePress}
              nextGenCount={generations[gi + 1]?.length ?? 0}
              loggedInUserId={loggedInUserId}
              allMembers={members}
              theme={theme}
            />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Floating FAB to activate relationship lookup (SAFE POSITIONED ABOVE BOTTOM TAB BAR) */}
      {!isLookupMode && !loading && (
        <TouchableOpacity 
          style={ts.fab} 
          activeOpacity={0.85} 
          onPress={() => { setIsLookupMode(true); setLookupPerson1(null); setLookupPerson2(null); }}
        >
          <LinearGradient colors={['#6366F1', '#4F46E5']} style={ts.fabGrad}>
            <Ionicons name="git-compare" size={18} color="#FFF" />
            <Text style={ts.fabTxt}>Tra quan hệ</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Visual Relationship Lookup floating status bar (TOP OF SCREEN SAFETY) */}
      {isLookupMode && (
        <Animated.View style={[ts.lookupBar, { backgroundColor: theme.dark ? 'rgba(15,15,35,0.98)' : 'rgba(255,255,255,0.98)', borderColor: theme.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]}>
          <View style={ts.lookupBarHeader}>
            <View style={ts.lookupBarTitleRow}>
              <Ionicons name="git-compare" size={15} color="#FBBF24" style={{ marginRight: 2 }} />
              <Text style={[ts.lookupBarTitle, { color: theme.dark ? '#FFF' : '#1E293B' }]}>Chế độ chọn người tra cứu</Text>
            </View>
            <TouchableOpacity onPress={() => { setIsLookupMode(false); setLookupPerson1(null); setLookupPerson2(null); }}>
              <Ionicons name="close-circle" size={20} color={theme.dark ? 'rgba(255,255,255,0.45)' : '#64748B'} />
            </TouchableOpacity>
          </View>
          
          <View style={ts.lookupSlotsRow}>
            {/* Person 1 Slot */}
            <View style={[ts.lookupSlot, lookupPerson1 ? { borderColor: '#6366F1' } : { borderStyle: 'dashed' }]}>
              <Text style={ts.lookupSlotLabel}>NGƯỜI 1</Text>
              <View style={ts.slotCore}>
                {lookupPerson1 ? (
                  <View style={ts.slotAvatarMini}>
                    <CustomAvatar gioiTinh={lookupPerson1.gioi_tinh} name={lookupPerson1.ten_day_du} theme={theme} />
                  </View>
                ) : (
                  <Ionicons name="person-add-outline" size={13} color="#6366F1" />
                )}
                <Text style={[ts.lookupSlotValue, { color: theme.dark ? '#FFF' : '#1E293B' }]} numberOfLines={1}>
                  {lookupPerson1 ? lookupPerson1.ten_day_du : 'Chọn người 1...'}
                </Text>
              </View>
            </View>

            <Ionicons name="swap-horizontal" size={16} color={theme.dark ? 'rgba(255,255,255,0.35)' : '#94A3B8'} />

            {/* Person 2 Slot */}
            <View style={[ts.lookupSlot, lookupPerson2 ? { borderColor: '#F59E0B' } : { borderStyle: 'dashed' }]}>
              <Text style={ts.lookupSlotLabel}>NGƯỜI 2</Text>
              <View style={ts.slotCore}>
                {lookupPerson2 ? (
                  <View style={ts.slotAvatarMini}>
                    <CustomAvatar gioiTinh={lookupPerson2.gioi_tinh} name={lookupPerson2.ten_day_du} theme={theme} />
                  </View>
                ) : (
                  <Ionicons name="person-add-outline" size={13} color="#F59E0B" />
                )}
                <Text style={[ts.lookupSlotValue, { color: theme.dark ? '#FFF' : '#1E293B' }]} numberOfLines={1}>
                  {lookupPerson2 ? lookupPerson2.ten_day_du : 'Chọn người 2...'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {/* ── Genealogy Relationship Lookup Result Modal ── */}
      <Modal
        visible={showResultModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => { setShowResultModal(false); setLookupPerson2(null); }}
      >
        <View style={[ts.resultOverlay, { backgroundColor: theme.dark ? 'rgba(5,1,16,0.96)' : 'rgba(15,23,42,0.85)' }]}>
          <View style={[ts.resultContainer, { backgroundColor: theme.dark ? 'rgba(23,23,43,0.98)' : '#FFF', borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
            
            {/* Crown Emblem badge */}
            <LinearGradient colors={['#FBBF24', '#D97706']} style={ts.resultCrownBadge}>
              <Ionicons name="trail-sign-outline" size={20} color="#FFF" />
            </LinearGradient>

            <Text style={[ts.resultTitle, { color: theme.dark ? '#FFF' : '#1E293B' }]}>Đối Chiếu Quan Hệ Dòng Họ</Text>
            
            {/* Visual Node Link Map */}
            <View style={ts.resultVisualRow}>
              {/* Node 1 */}
              <View style={ts.visualNodeCard}>
                <View style={[ts.visualAvatarRing, { borderColor: '#6366F1' }]}>
                  <CustomAvatar gioiTinh={lookupPerson1?.gioi_tinh} name={lookupPerson1?.ten_day_du} theme={theme} />
                </View>
                <Text style={[ts.visualNodeName, { color: theme.dark ? '#FFF' : '#1E293B' }]} numberOfLines={1}>
                  {lookupPerson1?.ten_day_du}
                </Text>
              </View>

              {/* Connecting Bridge */}
              <View style={ts.visualBridgeContainer}>
                <Ionicons name="link" size={18} color="#FBBF24" />
                <View style={ts.visualBridgeLine} />
              </View>

              {/* Node 2 */}
              <View style={ts.visualNodeCard}>
                <View style={[ts.visualAvatarRing, { borderColor: '#F59E0B' }]}>
                  <CustomAvatar gioiTinh={lookupPerson2?.gioi_tinh} name={lookupPerson2?.ten_day_du} theme={theme} />
                </View>
                <Text style={[ts.visualNodeName, { color: theme.dark ? '#FFF' : '#1E293B' }]} numberOfLines={1}>
                  {lookupPerson2?.ten_day_du}
                </Text>
              </View>
            </View>

            {/* Relationship Text Display Cards */}
            <View style={ts.relResultBox}>
              <LinearGradient colors={theme.dark ? ['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.01)'] : ['#FFFDF5', '#FEFDF0']} style={ts.relResultGrad}>
                <Text style={ts.relResultPre}>KẾT QUẢ TRA CỨU</Text>
                <Text style={[ts.relResultText, { color: theme.dark ? '#FFF' : '#1E293B' }]}>
                  <Text style={ts.relHighlightName}>{lookupPerson2?.ten_day_du}</Text> là{' '}
                  <Text style={ts.relHighlightLabel}>{lookupPerson1 && lookupPerson2 ? getRelationshipText(lookupPerson1.id, lookupPerson2.id, members) : 'Họ hàng'}</Text> của{' '}
                  <Text style={ts.relHighlightName}>{lookupPerson1?.ten_day_du}</Text>!
                </Text>
              </LinearGradient>
            </View>

            {/* Reverse relationship to be complete */}
            <View style={ts.relResultBoxReverse}>
              <Text style={[ts.relResultReverseTxt, { color: theme.dark ? 'rgba(255,255,255,0.45)' : '#64748B' }]}>
                Ngược lại:{' '}
                <Text style={{ fontWeight: '800' }}>{lookupPerson1?.ten_day_du}</Text> là{' '}
                <Text style={{ color: '#6366F1', fontWeight: '900' }}>
                  {lookupPerson1 && lookupPerson2 ? getRelationshipText(lookupPerson2.id, lookupPerson1.id, members) : 'Họ hàng'}
                </Text>{' '}
                của <Text style={{ fontWeight: '800' }}>{lookupPerson2?.ten_day_du}</Text>.
              </Text>
            </View>

            {/* Actions */}
            <View style={ts.resultActionsRow}>
              <TouchableOpacity 
                style={ts.resultResetBtn} 
                onPress={() => { setShowResultModal(false); setLookupPerson2(null); }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#6366F1', '#4F46E5']} style={ts.resultResetGrad}>
                  <Text style={ts.resultResetBtnTxt}>Tiếp tục so sánh</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[ts.resultCloseBtn, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}
                onPress={() => { setShowResultModal(false); setLookupPerson1(null); setLookupPerson2(null); setIsLookupMode(false); }}
                activeOpacity={0.8}
              >
                <Text style={[ts.resultCloseBtnTxt, { color: theme.dark ? '#FFF' : '#475569' }]}>Thoát tra cứu</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* Slides Detail modal */}
      <NodeDetail m={selected} onClose={() => setSelected(null)} theme={theme} />
    </View>
  );
};

// ─────────────────────────────────────────────────────────
//  Styles: Member Card Node
// ─────────────────────────────────────────────────────────
const nd = StyleSheet.create({
  cardShadowWrapper: {
    marginVertical: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  gradientBorder: {
    padding: 1.5,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  node: {
    width: SCREEN_WIDTH * 0.40,
    height: 198,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 22.5,
  },
  rootStarBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarRingWrapper: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  silhouetteContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2E8F0',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  silhouetteHair: {
    position: 'absolute',
    top: 5,
    zIndex: 3,
  },
  hairMale: {
    width: 20,
    height: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#1E293B',
  },
  hairFemale: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    top: 3,
  },
  silhouetteHead: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FDBA74',
    position: 'absolute',
    top: 10,
    zIndex: 2,
  },
  silhouetteNeck: {
    width: 5,
    height: 5,
    position: 'absolute',
    top: 24,
    zIndex: 1,
  },
  silhouetteBody: {
    width: 42,
    height: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 2,
  },
  treeAvatarOuterRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    padding: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  treeAvatarCore: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  letterAvatarGlossy: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterTxt: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 2,
  },
  relContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
    marginBottom: 4,
  },
  relTxt: {
    fontSize: 9.5,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  nodeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  genderTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  genderTxt: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  roleEmblem: {
    marginLeft: 1,
  },
});

// ─────────────────────────────────────────────────────────
//  Styles: Generation Rows
// ─────────────────────────────────────────────────────────
const gr = StyleSheet.create({
  panelContainer: {
    width: '100%',
    paddingTop: 48,
    paddingBottom: 0,
    position: 'relative',
    overflow: 'visible',
  },
  badgeLabelRow: {
    position: 'absolute',
    top: 14,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  ribbonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  countBadgeTxt: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  nodesWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: spacing.lg,
    zIndex: 2,
  },
});

// ─────────────────────────────────────────────────────────
//  Styles: Connections
// ─────────────────────────────────────────────────────────
const conn = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    height: 72,
    justifyContent: 'center',
    marginTop: -8,
    marginBottom: -40,
    zIndex: 2,
  },
  row: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 0.46,
    height: 28,
    justifyContent: 'center',
  },
  halfLineLeft: {
    flex: 1,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 16,
    height: '100%',
  },
  halfLineRight: {
    flex: 1,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 16,
    height: '100%',
  },
  halfLineLeftDown: {
    flex: 1,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 16,
    height: '100%',
  },
  halfLineRightDown: {
    flex: 1,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 16,
    height: '100%',
  },
  dotContainer: {
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    marginTop: -8,
    marginBottom: -8,
  },
  dotOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  dotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  verticalLine: {
    width: 2.5,
    height: 24,
  },
  verticalLineShort: {
    width: 2.5,
    height: 16,
  },
  verticalLineLong: {
    width: 2.5,
    height: 48,
  },
  arrowDown: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

// ─────────────────────────────────────────────────────────
//  Styles: Sliding Modal Detail
// ─────────────────────────────────────────────────────────
const nd2 = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    paddingTop: spacing.md,
  },
  topBarIndicator: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(156,163,175,0.3)',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  deceasedPill: {
    position: 'absolute',
    bottom: -6,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  deceasedTxt: {
    fontSize: 9.5,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: spacing.lg,
  },
  stackCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  stackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  rowSeparator: {
    borderTopWidth: 1,
  },
  rowIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rowVal: {
    fontSize: 14,
    fontWeight: '750',
  },
  lunarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  rowLunarTxt: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '700',
    fontStyle: 'italic',
  },
  closeWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  closeBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 18,
  },
  closeBtnTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

// ─────────────────────────────────────────────────────────
//  Styles: Main Screen Layout
// ─────────────────────────────────────────────────────────
const ts = StyleSheet.create({
  root: {
    flex: 1,
  },
  glowOverlay: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  headerWrapper: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  headerCard: {
    borderRadius: 28,
    padding: spacing.md,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTexts: {
    flex: 1,
  },
  subTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#6366F1',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  familyQuote: {
    fontSize: 12.5,
    fontWeight: '800',
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 18,
  },
  headerInstruction: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
  },
  summaryBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeTxt: {
    fontSize: 11,
    fontWeight: '850',
  },
  headerLookupBtn: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
  },
  headerLookupGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  headerLookupTxt: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFF',
  },
  scrollContent: {
    paddingTop: spacing.xs,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  stateLabelTxt: {
    fontSize: 14,
    fontWeight: '800',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
  },
  retryBtnTxt: {
    color: '#6366F1',
    fontWeight: '750',
    fontSize: 13,
  },

  // Relationship Lookup FAB (SAFE POSITIONED ABOVE BOTTOM TAB BAR)
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    zIndex: 999,
  },
  fabGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  fabTxt: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // Relationship Floating Lookup Status Bar (TOP OF SCREEN SAFETY)
  lookupBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 45,
    left: 16,
    right: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: spacing.md,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  lookupBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lookupBarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lookupBarTitle: {
    fontSize: 13.5,
    fontWeight: '900',
  },
  lookupSlotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lookupSlot: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  lookupSlotLabel: {
    fontSize: 8.5,
    fontWeight: '850',
    color: '#FBBF24',
    marginBottom: 2,
  },
  slotCore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    gap: 6,
    width: '100%',
  },
  slotAvatarMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  lookupSlotValue: {
    fontSize: 11,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },

  // Relationship Result Modal Styles
  resultOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  resultContainer: {
    width: '100%',
    borderRadius: 32,
    borderWidth: 1.5,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  resultCrownBadge: {
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
  resultTitle: {
    fontSize: 19,
    fontWeight: '900',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  resultVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: spacing.xl,
    gap: 16,
  },
  visualNodeCard: {
    width: 96,
    alignItems: 'center',
    gap: 6,
  },
  visualAvatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    padding: 2,
  },
  visualNodeName: {
    fontSize: 12.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  visualBridgeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualBridgeLine: {
    height: 2,
    backgroundColor: '#FBBF24',
    width: '120%',
    position: 'absolute',
    zIndex: -1,
  },
  relResultBox: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
  },
  relResultGrad: {
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  relResultPre: {
    fontSize: 9,
    fontWeight: '900',
    color: '#D97706',
    letterSpacing: 1.5,
  },
  relResultText: {
    fontSize: 15,
    fontWeight: '750',
    textAlign: 'center',
    lineHeight: 22,
  },
  relHighlightName: {
    fontWeight: '900',
  },
  relHighlightLabel: {
    color: '#F59E0B',
    fontWeight: '950',
    textDecorationLine: 'underline',
  },
  relResultBoxReverse: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  relResultReverseTxt: {
    fontSize: 12.5,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
  resultActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  resultResetBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  resultResetGrad: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  resultResetBtnTxt: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  resultCloseBtn: {
    flex: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  resultCloseBtnTxt: {
    fontSize: 14,
    fontWeight: '800',
  },
});

export default TreeScreen;
