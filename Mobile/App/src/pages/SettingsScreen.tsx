/**
 * SettingsScreen – Màn hình Cài đặt ứng dụng
 * Giao diện hiện đại, dark/light mode, animation mượt
 * Chỉ chứa tùy chọn ứng dụng (không có quản lý tài khoản)
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  ScrollView,
  Animated,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import FeatherIcon from '@react-native-vector-icons/feather/static';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import CustomAlert from '../components/CustomAlert';

// ─────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────
interface SettingItemType {
  id: string;
  icon: string;
  iconType: 'ionicons' | 'feather';
  label: string;
  description?: string;
  color: string;
  type: 'navigation' | 'toggle';
  value?: string | boolean;
  onPress?: () => void;
}

// ─────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────
const hexRgba = (hex: string, a: number): string => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────
//  Animated Setting Item Component
// ─────────────────────────────────────────────────────────
interface SettingItemProps {
  item: SettingItemType;
  index: number;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
}

const SettingItem: React.FC<SettingItemProps> = ({
  item,
  index,
  onPress,
  theme,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(20)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 60;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateXAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
    
    rippleAnim.setValue(0);
    Animated.timing(rippleAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const IconComponent = item.iconType === 'feather' ? FeatherIcon : Ionicons;
  const isToggle = item.type === 'toggle';

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.1, 0],
  });

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1, 1.5],
  });

  return (
    <Animated.View
      style={[
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { translateX: translateXAnim },
          ],
        },
      ]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.settingItemContainer,
          {
            backgroundColor: pressed
              ? theme.colors.overlayLight
              : theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}>
        {/* Ripple Effect */}
        <Animated.View
          style={[
            styles.ripple,
            {
              backgroundColor: theme.colors.primary,
              opacity: rippleOpacity,
              transform: [{ scale: rippleScale }],
            },
          ]}
        />

        {/* Icon Box */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: hexRgba(item.color, theme.dark ? 0.2 : 0.12),
            },
          ]}>
          <IconComponent name={item.icon as any} size={22} color={item.color} />
        </View>

        {/* Content */}
        <View style={styles.itemContent}>
          <Text style={[styles.itemLabel, { color: theme.colors.text }]}>
            {item.label}
          </Text>
          {item.description && (
            <Text
              style={[
                styles.itemDescription,
                { color: theme.colors.textSecondary },
              ]}>
              {item.description}
            </Text>
          )}
          {item.value && typeof item.value === 'string' && !isToggle && (
            <Text
              style={[
                styles.itemValue,
                { color: theme.colors.textMuted },
              ]}>
              {item.value}
            </Text>
          )}
        </View>

        {/* Right Side */}
        {isToggle ? (
          <View style={styles.toggleSwitch}>
            <TouchableOpacity
              onPress={onPress}
              style={[
                styles.toggleTrack,
                {
                  backgroundColor: (item.value as boolean)
                    ? hexRgba(item.color, 0.5)
                    : theme.dark
                    ? 'rgba(255,255,255,0.15)'
                    : '#E5E7EB',
                },
              ]}>
              <Animated.View
                style={[
                  styles.toggleThumb,
                  {
                    backgroundColor: '#FFFFFF',
                    transform: [
                      {
                        translateX: (item.value as boolean) ? 22 : 2,
                      },
                    ],
                  },
                ]}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.chevronContainer}>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.textMuted}
            />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────
//  Theme Toggle with Sun/Moon Animation
// ─────────────────────────────────────────────────────────
interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isDark,
  onToggle,
  theme,
}) => {
  const toggleAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(toggleAnim, {
      toValue: isDark ? 1 : 0,
      tension: 80,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [isDark]);

  const translateX = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 26],
  });

  const sunOpacity = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const moonOpacity = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Pressable onPress={onToggle} style={styles.themeToggleContainer}>
      <Animated.View
        style={[
          styles.themeToggleTrack,
          {
            backgroundColor: toggleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['#F59E0B', theme.colors.primary],
            }),
          },
        ]}>
        <Animated.View style={[styles.iconSun, { opacity: sunOpacity }]}>
          <Ionicons name="sunny" size={14} color="#FFFFFF" />
        </Animated.View>
        <Animated.View style={[styles.iconMoon, { opacity: moonOpacity }]}>
          <Ionicons name="moon" size={14} color="#FFFFFF" />
        </Animated.View>
        <Animated.View
          style={[
            styles.themeToggleThumb,
            {
              backgroundColor: '#FFFFFF',
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────
//  Main Settings Screen
// ─────────────────────────────────────────────────────────
const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  // Animation refs
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Settings items
  const appearanceItems: SettingItemType[] = [
    {
      id: 'darkmode',
      icon: isDarkMode ? 'moon' : 'sunny',
      iconType: 'ionicons',
      label: 'Chế độ tối',
      description: isDarkMode ? 'Đang bật' : 'Đang tắt',
      color: isDarkMode ? '#8B5CF6' : '#F59E0B',
      type: 'toggle',
      value: isDarkMode,
      onPress: toggleTheme,
    },
  ];

  const notificationItems: SettingItemType[] = [
    {
      id: 'notifications',
      icon: 'notifications-outline',
      iconType: 'ionicons',
      label: 'Thông báo',
      description: 'Nhận thông báo từ ứng dụng',
      color: theme.colors.success,
      type: 'toggle',
      value: notificationsEnabled,
      onPress: () => setNotificationsEnabled(!notificationsEnabled),
    },
    {
      id: 'language',
      icon: 'language',
      iconType: 'ionicons',
      label: 'Ngôn ngữ',
      description: 'Tiếng Việt',
      color: theme.colors.info,
      type: 'navigation',
      value: 'Tiếng Việt',
      onPress: () => {
        // Navigate to language selection
      },
    },
  ];

  const supportItems: SettingItemType[] = [
    {
      id: 'privacy',
      icon: 'shield-checkmark-outline',
      iconType: 'ionicons',
      label: 'Chính sách bảo mật',
      description: 'Xem chính sách bảo mật',
      color: theme.colors.primary,
      type: 'navigation',
      onPress: () => {
        // Navigate to privacy policy
      },
    },
    {
      id: 'support',
      icon: 'help-circle-outline',
      iconType: 'ionicons',
      label: 'Trợ giúp',
      description: 'FAQ và thông tin liên hệ',
      color: '#F59E0B',
      type: 'navigation',
      onPress: () => {
        navigation.navigate('Help');
      },
    },
    {
      id: 'about',
      icon: 'information-circle-outline',
      iconType: 'ionicons',
      label: 'Về ứng dụng',
      description: 'Phiên bản 1.0.0',
      color: theme.colors.textSecondary,
      type: 'navigation',
      value: 'v1.0.0',
      onPress: () => {
        setShowAlert(true);
      },
    },
  ];

  // Background gradient colors based on theme
  const bgColors = theme.dark
    ? ['#0A0A1A', '#0E0E24', '#12122A']
    : ['#F5F7FA', '#FFFFFF', '#F0F2F5'];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
        translucent={false}
      />

      {/* Background Gradient */}
      <LinearGradient
        colors={bgColors as string[]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Ambient Glows for Dark Mode */}
      {theme.dark && (
        <>
          <View
            style={[
              styles.ambientGlow,
              { top: -100, left: -80, backgroundColor: '#7C3AED' },
            ]}
          />
          <View
            style={[
              styles.ambientGlow,
              { bottom: 100, right: -60, backgroundColor: '#2563EB' },
            ]}
          />
        </>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}>
        {/* ── Header ── */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}>
          {/* Back Button */}
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.card }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Cài đặt
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              Tùy chỉnh trải nghiệm của bạn
            </Text>
          </View>
        </Animated.View>

        {/* ── Appearance Section ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            GIAO DIỆN
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}>
            {appearanceItems.map((item, index) => (
              <View key={item.id}>
                {index > 0 && (
                  <View
                    style={[
                      styles.separator,
                      { backgroundColor: theme.colors.border },
                    ]}
                  />
                )}
                <SettingItem
                  item={item}
                  index={index}
                  onPress={item.onPress || (() => {})}
                  theme={theme}
                />
              </View>
            ))}
          </View>
        </View>

        {/* ── Notifications Section ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            THÔNG BÁO
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}>
            {notificationItems.map((item, index) => (
              <View key={item.id}>
                {index > 0 && (
                  <View
                    style={[
                      styles.separator,
                      { backgroundColor: theme.colors.border },
                    ]}
                  />
                )}
                <SettingItem
                  item={item}
                  index={index + 1}
                  onPress={item.onPress || (() => {})}
                  theme={theme}
                />
              </View>
            ))}
          </View>
        </View>

        {/* ── Support Section ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            HỖ TRỢ
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}>
            {supportItems.map((item, index) => (
              <View key={item.id}>
                {index > 0 && (
                  <View
                    style={[
                      styles.separator,
                      { backgroundColor: theme.colors.border },
                    ]}
                  />
                )}
                <SettingItem
                  item={item}
                  index={index + 3}
                  onPress={item.onPress || (() => {})}
                  theme={theme}
                />
              </View>
            ))}
          </View>
        </View>

        {/* ── App Version ── */}
        <Text style={[styles.versionText, { color: theme.colors.textMuted }]}>
          Cây Gia Phả v1.0.0
        </Text>
      </ScrollView>

      {/* About App Alert */}
      <CustomAlert
        visible={showAlert}
        type="info"
        title="Cây Gia Phả"
        message="Phiên bản 1.0.0\n\nỨng dụng quản lý cây gia phả giúp bạn lưu giữ và truyền tải lịch sử gia đình qua các thế hệ.\n\n© 2024 Cây Gia Phả"
        onClose={() => setShowAlert(false)}
        buttons={[
          {
            text: 'Đóng',
            style: 'default',
            onPress: () => setShowAlert(false),
          },
        ]}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  // Ambient Glows
  ambientGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.06,
  },

  // Header
  header: {
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },

  // Card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },

  // Setting Item
  settingItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    overflow: 'hidden',
  },
  ripple: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    left: -50,
    top: -50,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  itemValue: {
    fontSize: 13,
    marginTop: 2,
  },
  chevronContainer: {
    marginLeft: 8,
  },
  toggleSwitch: {
    marginLeft: 8,
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  // Theme Toggle
  themeToggleContainer: {
    padding: 4,
  },
  themeToggleTrack: {
    width: 56,
    height: 30,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  iconSun: {
    position: 'absolute',
    left: 8,
  },
  iconMoon: {
    position: 'absolute',
    right: 8,
  },
  themeToggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  // Version
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 20,
  },
});

export default SettingsScreen;
