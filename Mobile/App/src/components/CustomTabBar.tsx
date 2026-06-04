/**
 * CustomTabBar v2 – Vertical layout + slide-up label animation
 *
 *  Layout mỗi tab:
 *    ┌─────────────┐
 *    │  [icon bg]  │  ← gradient pill bao icon
 *    │    icon     │
 *    └─────────────┘
 *      label ↑       ← slide up + fade in khi active
 *
 *  Center FAB vẫn nổi cao hơn.
 */
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type TabConfig = {
  name        : string;
  icon        : string;
  iconFocused : string;
  label       : string;
  color       : string;
  gradient    : string[];
};

export const TABS: TabConfig[] = [
  { name: 'Home',    icon: 'home-outline',        iconFocused: 'home',        label: 'Trang Chủ',  color: '#A78BFA', gradient: ['#6C63FF', '#4F46E5'] },
  { name: 'Members', icon: 'people-outline',       iconFocused: 'people',      label: 'Thành Viên', color: '#34D399', gradient: ['#10B981', '#059669'] },
  { name: 'Tree',    icon: 'git-network-outline',  iconFocused: 'git-network', label: 'Cây',        color: '#F0C060', gradient: ['#F59E0B', '#D97706'] },
  { name: 'Events',  icon: 'calendar-outline',     iconFocused: 'calendar',    label: 'Sự Kiện',    color: '#F9A8D4', gradient: ['#EC4899', '#DB2777'] },
  { name: 'Profile', icon: 'person-outline',       iconFocused: 'person',      label: 'Hồ Sơ',     color: '#7DD3FC', gradient: ['#3B82F6', '#2563EB'] },
];

// ─────────────────────────────────────────────────────
//  Regular Tab Item (vertical: icon → label slide up)
// ─────────────────────────────────────────────────────
const TabItem: React.FC<{
  tab      : TabConfig;
  isFocused: boolean;
  onPress  : () => void;
}> = ({ tab, isFocused, onPress }) => {

  // Animation values
  const iconScale   = useRef(new Animated.Value(isFocused ? 1 : 0.88)).current;
  const iconBgScale = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const labelY      = useRef(new Animated.Value(isFocused ? 0 : 8)).current;
  const labelOpac   = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const glowOpac    = useRef(new Animated.Value(isFocused ? 0.35 : 0)).current;

  useEffect(() => {
    if (isFocused) {
      Animated.parallel([
        Animated.spring(iconScale,   { toValue: 1,    tension: 160, friction: 7, useNativeDriver: true }),
        Animated.spring(iconBgScale, { toValue: 1,    tension: 160, friction: 7, useNativeDriver: true }),
        Animated.timing(glowOpac,    { toValue: 0.35, duration: 100, useNativeDriver: true }),
        Animated.spring(labelY,      { toValue: 0,    tension: 200, friction: 10, useNativeDriver: true }),
        Animated.timing(labelOpac,   { toValue: 1,    duration: 130, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(labelOpac,   { toValue: 0,    duration: 80,  useNativeDriver: true }),
        Animated.spring(labelY,      { toValue: 8,    tension: 160, friction: 8, useNativeDriver: true }),
        Animated.spring(iconScale,   { toValue: 0.88, tension: 160, friction: 7, useNativeDriver: true }),
        Animated.spring(iconBgScale, { toValue: 0,    tension: 160, friction: 7, useNativeDriver: true }),
        Animated.timing(glowOpac,    { toValue: 0,    duration: 80,  useNativeDriver: true }),
      ]).start();
    }
  }, [isFocused]);

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.8}>

      {/* Icon area */}
      <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }] }]}>
        {/* Glow behind icon */}
        <Animated.View style={[
          styles.iconGlow,
          { backgroundColor: tab.color, opacity: glowOpac },
        ]} />
        {/* Gradient pill bg */}
        <Animated.View style={[
          StyleSheet.absoluteFill,
          { borderRadius: 16, transform: [{ scale: iconBgScale }], overflow: 'hidden' },
        ]}>
          <LinearGradient
            colors={tab.gradient as any}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        {/* Icon */}
        <Ionicons
          name={(isFocused ? tab.iconFocused : tab.icon) as any}
          size={22}
          color={isFocused ? '#fff' : 'rgba(255,255,255,0.35)'}
        />
      </Animated.View>

      {/* Label – slides up from below */}
      <Animated.Text
        style={[
          styles.tabLabel,
          {
            color    : tab.color,
            opacity  : labelOpac,
            transform: [{ translateY: labelY }],
          },
        ]}
        numberOfLines={1}>
        {tab.label}
      </Animated.Text>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────
//  Center FAB Tab (Tree)
// ─────────────────────────────────────────────────────
const CenterFab: React.FC<{
  tab      : TabConfig;
  isFocused: boolean;
  onPress  : () => void;
}> = ({ tab, isFocused, onPress }) => {

  const fabScale  = useRef(new Animated.Value(1)).current;
  const glowOpac  = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const labelY    = useRef(new Animated.Value(isFocused ? 0 : 8)).current;
  const labelOpac = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    if (isFocused) {
      Animated.parallel([
        Animated.spring(fabScale,  { toValue: 1.1,  tension: 180, friction: 6, useNativeDriver: true }),
        Animated.timing(glowOpac,  { toValue: 0.55, duration: 120, useNativeDriver: true }),
        Animated.spring(labelY,    { toValue: 0,    tension: 200, friction: 10, useNativeDriver: true }),
        Animated.timing(labelOpac, { toValue: 1,    duration: 130, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(fabScale,  { toValue: 1,   tension: 180, friction: 6,  useNativeDriver: true }),
        Animated.timing(glowOpac,  { toValue: 0,   duration: 80,  useNativeDriver: true }),
        Animated.timing(labelOpac, { toValue: 0,   duration: 80,  useNativeDriver: true }),
        Animated.spring(labelY,    { toValue: 8,   tension: 200, friction: 8,  useNativeDriver: true }),
      ]).start();
    }
  }, [isFocused]);

  return (
    <TouchableOpacity
      style={styles.fabWrap}
      onPress={onPress}
      activeOpacity={0.85}>
      {/* Glow ring */}
      <Animated.View style={[styles.fabGlow, { opacity: glowOpac }]} />
      {/* FAB */}
      <Animated.View style={{ transform: [{ scale: fabScale }] }}>
        <LinearGradient
          colors={tab.gradient as any}
          style={styles.fabBtn}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <Ionicons
            name={(isFocused ? tab.iconFocused : tab.icon) as any}
            size={26}
            color="#fff"
          />
        </LinearGradient>
      </Animated.View>
      {/* Label */}
      <Animated.Text style={[
        styles.fabLabel,
        { color: tab.color, opacity: labelOpac, transform: [{ translateY: labelY }] },
      ]}>
        {tab.label}
      </Animated.Text>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────
//  Main CustomTabBar
// ─────────────────────────────────────────────────────
const CustomTabBar: React.FC<{ state: any; navigation: any }> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const slideUp = useRef(new Animated.Value(120)).current;

  useEffect(() => {
    Animated.spring(slideUp, {
      toValue        : 0,
      tension        : 100,
      friction       : 10,
      delay          : 150,
      useNativeDriver: true,
    }).start();
  }, []);

  // Compute safe bottom margin dynamically based on safe area insets to prevent cutout overlap
  const safeBottom = insets.bottom > 0 ? insets.bottom : 12;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideUp }], bottom: safeBottom }]}>
      <View style={styles.bar}>
        {TABS.map((tab, index) => {
          const isFocused = state.index === index;
          const isCenter  = index === 2;

          const onPress = () => {
            const event = navigation.emit({
              type             : 'tabPress',
              target           : state.routes[index]?.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(tab.name);
            }
          };

          if (isCenter) {
            return (
              <CenterFab
                key={tab.name}
                tab={tab}
                isFocused={isFocused}
                onPress={onPress}
              />
            );
          }

          return (
            <TabItem
              key={tab.name}
              tab={tab}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────
const BAR_HEIGHT = 72;

const styles = StyleSheet.create({
  container: {
    position : 'absolute',
    left     : 16,
    right    : 16,
  },
  bar: {
    flexDirection   : 'row',
    alignItems      : 'center',
    minHeight       : BAR_HEIGHT,
    borderRadius    : 28,
    backgroundColor : 'rgba(12, 10, 30, 0.92)',
    borderWidth     : 1,
    borderColor     : 'rgba(108, 99, 255, 0.22)',
    paddingHorizontal: 6,
    paddingVertical  : 8,
    // Shadow
    shadowColor     : '#4F46E5',
    shadowOffset    : { width: 0, height: 8 },
    shadowOpacity   : 0.4,
    shadowRadius    : 20,
    elevation       : 20,
  },

  // Regular tab
  tabItem: {
    flex           : 1,
    alignItems     : 'center',
    justifyContent : 'center',
    paddingVertical: 2,
    gap            : 4,        // space between icon and label
  },
  iconWrap: {
    width          : 46,
    height         : 36,
    borderRadius   : 14,
    justifyContent : 'center',
    alignItems     : 'center',
    overflow       : 'visible',
  },
  iconGlow: {
    position     : 'absolute',
    width        : 40,
    height       : 40,
    borderRadius : 20,
    top          : -2,
  },
  tabLabel: {
    fontSize     : 10,
    fontWeight   : '700',
    letterSpacing: 0.2,
    textAlign    : 'center',
  },

  // Center FAB
  fabWrap: {
    flex           : 1,
    alignItems     : 'center',
    justifyContent : 'center',
    marginTop      : -24,    // pop above bar
    gap            : 4,
  },
  fabGlow: {
    position       : 'absolute',
    top            : -10,
    width          : 68,
    height         : 68,
    borderRadius   : 34,
    backgroundColor: '#F59E0B',
  },
  fabBtn: {
    width          : 58,
    height         : 58,
    borderRadius   : 29,
    justifyContent : 'center',
    alignItems     : 'center',
    borderWidth    : 3,
    borderColor    : 'rgba(12, 10, 30, 0.92)',
    shadowColor    : '#F59E0B',
    shadowOffset   : { width: 0, height: 4 },
    shadowOpacity  : 0.55,
    shadowRadius   : 14,
    elevation      : 12,
  },
  fabLabel: {
    fontSize     : 10,
    fontWeight   : '700',
    letterSpacing: 0.2,
    marginTop    : 2,
    textAlign    : 'center',
  },
});

export default CustomTabBar;
