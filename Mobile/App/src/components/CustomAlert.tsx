/**
 * CustomAlert – Premium modal thay thế Alert.alert()
 * Hỗ trợ: confirm, info, success, error, warning
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated, Dimensions, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';

// Tránh 8-digit hex crash trên Android New Architecture
const hexRgba = (hex: string, a: number): string => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const { width: SW } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────
export type AlertType = 'confirm' | 'info' | 'success' | 'error' | 'warning';

export interface AlertButton {
  text    : string;
  style  ?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface CustomAlertProps {
  visible     : boolean;
  type       ?: AlertType;
  title       : string;
  message    ?: string;
  buttons    ?: AlertButton[];
  onClose    ?: () => void;
}

// ─────────────────────────────────────────────────────────
//  Config theo type
// ─────────────────────────────────────────────────────────
const TYPE_CFG: Record<AlertType, {
  icon   : string;
  grad   : [string, string];
  glow   : string;
}> = {
  confirm : { icon: 'help-circle',       grad: ['#7C3AED','#4F46E5'], glow: '#7C3AED' },
  info    : { icon: 'information-circle', grad: ['#2563EB','#1D4ED8'], glow: '#2563EB' },
  success : { icon: 'checkmark-circle',  grad: ['#059669','#047857'], glow: '#059669' },
  error   : { icon: 'close-circle',      grad: ['#DC2626','#B91C1C'], glow: '#DC2626' },
  warning : { icon: 'warning',           grad: ['#D97706','#B45309'], glow: '#D97706' },
};

// ─────────────────────────────────────────────────────────
//  Button color mapping
// ─────────────────────────────────────────────────────────
const getBtnStyle = (style?: AlertButton['style'], typeGlow?: string) => {
  switch (style) {
    case 'destructive': return { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' };
    case 'cancel'     : return { color: 'rgba(255,255,255,0.45)', bg: 'transparent', border: 'rgba(255,255,255,0.1)' };
    default           : return { color: typeGlow ?? '#A78BFA', bg: (typeGlow ?? '#A78BFA') + '18', border: (typeGlow ?? '#A78BFA') + '40' };
  }
};

// ─────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────
const CustomAlert: React.FC<CustomAlertProps> = ({
  visible, type = 'confirm', title, message, buttons = [], onClose,
}) => {
  const scaleAnim   = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconAnim    = useRef(new Animated.Value(0)).current;

  const cfg = TYPE_CFG[type];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1, tension: 120, friction: 8,  useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(iconAnim,    { toValue: 1, tension: 80,  friction: 6, delay: 100, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      iconAnim.setValue(0);
    }
  }, [visible]);

  const defaultButtons: AlertButton[] = buttons.length > 0 ? buttons : [
    { text: 'Đóng', style: 'cancel', onPress: onClose },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>

      {/* Backdrop */}
      <Animated.View style={[s.backdrop, { opacity: opacityAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        {/* Dialog */}
        <Animated.View style={[s.dialog, {
          transform: [
            { scale: scaleAnim },
            { translateY: scaleAnim.interpolate({ inputRange: [0.8, 1], outputRange: [20, 0] }) },
          ],
          opacity: opacityAnim,
        }]}>

          {/* Glow bg */}
          <View style={[s.glowBg, { backgroundColor: cfg.glow }]} />

          {/* Top border gradient */}
          <LinearGradient colors={cfg.grad} style={s.topBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

          {/* Icon */}
          <Animated.View style={[s.iconWrap, {
            transform: [
              { scale: iconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
              { rotate: iconAnim.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] }) },
            ],
            opacity: iconAnim,
          }]}>
            <LinearGradient colors={cfg.grad} style={s.iconGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name={cfg.icon as any} size={32} color="#fff" />
            </LinearGradient>
            {/* Glow ring */}
            <View style={[s.iconRing, { borderColor: cfg.glow + '40' }]} />
          </Animated.View>

          {/* Text */}
          <Text style={s.title}>{title}</Text>
          {message ? <Text style={s.message}>{message}</Text> : null}

          {/* Divider */}
          <View style={s.divider} />

          {/* Buttons */}
          <View style={[s.btnsRow, defaultButtons.length > 2 && s.btnsCol]}>
            {defaultButtons.map((btn, i) => {
              const bs = getBtnStyle(btn.style, cfg.glow);
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    s.btn,
                    { backgroundColor: bs.bg, borderColor: bs.border },
                    defaultButtons.length <= 2 && { flex: 1 },
                  ]}
                  onPress={() => {
                    btn.onPress?.();
                  }}
                  activeOpacity={0.75}>
                  <Text style={[s.btnTxt, { color: bs.color }]}>{btn.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  backdrop  : {
    flex             : 1,
    backgroundColor  : 'rgba(0,0,0,0.75)',
    justifyContent   : 'center',
    alignItems       : 'center',
    paddingHorizontal: 28,
  },
  dialog    : {
    width          : '100%',
    maxWidth       : SW - 56,
    backgroundColor: '#12092A',
    borderRadius   : 28,
    borderWidth    : 1,
    borderColor    : 'rgba(255,255,255,0.1)',
    overflow       : 'hidden',
    paddingBottom  : 20,
    alignItems     : 'center',
  },
  glowBg    : {
    position     : 'absolute',
    top          : -60,
    left         : '50%',
    marginLeft   : -80,
    width        : 160,
    height       : 160,
    borderRadius : 80,
    opacity      : 0.12,
  },
  topBorder : { height: 3, width: '100%' },
  iconWrap  : { marginTop: 28, marginBottom: 16, position: 'relative' },
  iconGrad  : {
    width        : 72,
    height       : 72,
    borderRadius : 36,
    justifyContent: 'center',
    alignItems   : 'center',
  },
  iconRing  : {
    position    : 'absolute',
    top         : -6,
    left        : -6,
    width       : 84,
    height      : 84,
    borderRadius: 42,
    borderWidth : 1.5,
  },
  title     : {
    fontSize     : 18,
    fontWeight   : '800',
    color        : '#fff',
    textAlign    : 'center',
    letterSpacing: -0.3,
    paddingHorizontal: 24,
  },
  message   : {
    fontSize     : 13,
    color        : 'rgba(255,255,255,0.5)',
    textAlign    : 'center',
    marginTop    : 8,
    lineHeight   : 20,
    paddingHorizontal: 24,
    fontWeight   : '400',
  },
  divider   : {
    height         : 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    width          : '100%',
    marginTop      : 20,
    marginBottom   : 16,
  },
  btnsRow   : {
    flexDirection   : 'row',
    gap             : 10,
    paddingHorizontal: 20,
    width           : '100%',
  },
  btnsCol   : { flexDirection: 'column' },
  btn       : {
    paddingVertical : 13,
    paddingHorizontal: 16,
    borderRadius    : 14,
    borderWidth     : 1,
    alignItems      : 'center',
    justifyContent  : 'center',
  },
  btnTxt    : { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
});

export default CustomAlert;
