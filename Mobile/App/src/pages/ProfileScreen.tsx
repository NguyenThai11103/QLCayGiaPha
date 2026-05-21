import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NguoiDung, STORAGE_USER_KEY, logoutApi } from '../genaral/authService';
import { spacing, fontSize, borderRadius } from '../config/theme';

interface ProfileScreenProps { navigation: any; }

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<NguoiDung | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_USER_KEY)
      .then(val => { if (val) setUser(JSON.parse(val)); });
  }, []);

  const handleLogout = async () => {
    // logoutApi() xóa auth_token + auth_user, GIỮ onboarding_completed
    await logoutApi();
    navigation.getParent()?.replace('GetStarted');
  };

  const MENU = [
    { icon: 'person-outline' as const,         label: 'Thông tin cá nhân', color: '#A78BFA' },
    { icon: 'notifications-outline' as const,  label: 'Thông báo',         color: '#F59E0B' },
    { icon: 'shield-checkmark-outline' as const,label: 'Bảo mật',          color: '#10B981' },
    { icon: 'help-circle-outline' as const,    label: 'Trợ giúp',          color: '#3B82F6' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#070712', '#0E0A26', '#070712']} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <LinearGradient colors={['#6C63FF', '#4F46E5']} style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0] ?? 'U'}</Text>
          </LinearGradient>
          <View style={styles.avatarBadge}>
            <Ionicons name="checkmark" size={10} color="#fff" />
          </View>
        </View>
        <Text style={styles.userName}>{user?.name ?? 'Người dùng'}</Text>
        <Text style={styles.userEmail}>{user?.email ?? ''}</Text>

        {/* Role badge */}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.dong_ho ?? 'Cây Gia Phả'}</Text>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU.map((m, i) => (
            <TouchableOpacity key={i} style={styles.menuRow} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: m.color + '20' }]}>
                <Ionicons name={m.icon} size={18} color={m.color} />
              </View>
              <Text style={styles.menuLabel}>{m.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container : { flex: 1 },
  content   : {
    flex             : 1,
    alignItems       : 'center',
    paddingTop       : Platform.OS === 'ios' ? 80 : 60,
    paddingHorizontal: spacing.lg,
    paddingBottom    : 100,
  },
  avatarWrap  : { position: 'relative', marginBottom: spacing.md },
  avatar      : { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  avatarText  : { fontSize: 36, fontWeight: '800', color: '#fff' },
  avatarBadge : {
    position: 'absolute', bottom: 2, right: 2,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#10B981',
    borderWidth: 2, borderColor: '#070712',
    justifyContent: 'center', alignItems: 'center',
  },
  userName   : { fontSize: fontSize.xxl, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  userEmail  : { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.4)', marginTop: 4, marginBottom: spacing.md },
  roleBadge  : {
    paddingHorizontal: spacing.md, paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(108,99,255,0.2)',
    borderWidth: 1, borderColor: 'rgba(108,99,255,0.35)',
    marginBottom: spacing.xl,
  },
  roleText   : { fontSize: fontSize.xs, color: '#A78BFA', fontWeight: '600' },
  menuCard   : {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.15)',
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  menuRow    : {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, gap: spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  menuIcon   : { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel  : { flex: 1, fontSize: fontSize.md, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  logoutBtn  : {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  logoutText : { fontSize: fontSize.md, color: '#EF4444', fontWeight: '600' },
});

export default ProfileScreen;
