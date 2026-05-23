/**
 * HelpScreen – Màn hình Trợ giúp
 * FAQ và thông tin liên hệ hỗ trợ
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
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

// ─────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────
interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface ContactItem {
  id: string;
  icon: string;
  label: string;
  value: string;
  color: string;
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

// ─────────────────────────────────────────────────────────
//  FAQ Item Component (Expandable)
// ─────────────────────────────────────────────────────────
interface FAQItemComponentProps {
  item: FAQItem;
  index: number;
  theme: ReturnType<typeof useTheme>['theme'];
}

const FAQItemComponent: React.FC<FAQItemComponentProps> = ({ item, index, theme }) => {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial animation
    Animated.stagger(50, [
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(heightAnim, {
        toValue: expanded ? 1 : 0,
        tension: 80,
        friction: 10,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const toggleExpand = () => {
    Animated.parallel([
      Animated.spring(rotateAnim, {
        toValue: expanded ? 0 : 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(heightAnim, {
        toValue: expanded ? 0 : 1,
        tension: 80,
        friction: 10,
        useNativeDriver: false,
      }),
    ]).start();
    setExpanded(!expanded);
  };

  const rotateIcon = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const contentHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  return (
    <Animated.View
      style={[
        styles.faqItem,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          opacity: opacityAnim,
        },
      ]}>
      <TouchableOpacity
        style={styles.faqQuestion}
        onPress={toggleExpand}
        activeOpacity={0.7}>
        <View style={styles.faqQuestionContent}>
          <View
            style={[
              styles.faqIconContainer,
              { backgroundColor: hexRgba(theme.colors.primary, theme.dark ? 0.2 : 0.1) },
            ]}>
            <Ionicons name="help-circle" size={18} color={theme.colors.primary} />
          </View>
          <Text style={[styles.faqQuestionText, { color: theme.colors.text }]}>
            {item.question}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
          <Ionicons
            name="chevron-down"
            size={20}
            color={theme.colors.textSecondary}
          />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.faqAnswerContainer,
          {
            maxHeight: contentHeight,
            opacity: heightAnim,
          },
        ]}>
        <View style={styles.faqAnswer}>
          <Text style={[styles.faqAnswerText, { color: theme.colors.textSecondary }]}>
            {item.answer}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────
//  Contact Item Component
// ─────────────────────────────────────────────────────────
interface ContactItemComponentProps {
  item: ContactItem;
  index: number;
  theme: ReturnType<typeof useTheme>['theme'];
}

const ContactItemComponent: React.FC<ContactItemComponentProps> = ({
  item,
  index,
  theme,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = 400 + index * 60;
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
      Animated.spring(translateYAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    if (item.onPress) {
      item.onPress();
    } else if (item.id === 'email') {
      Linking.openURL('mailto:caygiapha@example.com');
    } else if (item.id === 'phone') {
      Linking.openURL('tel:0901234567');
    } else if (item.id === 'website') {
      Linking.openURL('https://caygiapha.com');
    }
  };

  return (
    <Animated.View
      style={[
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
        },
      ]}>
      <TouchableOpacity
        style={[
          styles.contactItem,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}>
        <View
          style={[
            styles.contactIconContainer,
            { backgroundColor: hexRgba(item.color, theme.dark ? 0.2 : 0.12) },
          ]}>
          <Ionicons name={item.icon as any} size={22} color={item.color} />
        </View>
        <View style={styles.contactContent}>
          <Text style={[styles.contactLabel, { color: theme.colors.text }]}>
            {item.label}
          </Text>
          <Text style={[styles.contactValue, { color: theme.colors.textSecondary }]}>
            {item.value}
          </Text>
        </View>
        <Ionicons name="open-outline" size={18} color={theme.colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────
//  Main Help Screen
// ─────────────────────────────────────────────────────────
const HelpScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

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

  // FAQ Data
  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'Làm sao để thêm thành viên vào cây gia phả?',
      answer:
        'Để thêm thành viên, bạn vào màn hình "Cây", nhấn nút "+" ở giữa màn hình, sau đó điền thông tin thành viên mới bao gồm họ tên, ngày sinh, giới tính và mối quan hệ với các thành viên khác.',
    },
    {
      id: '2',
      question: 'Tôi có thể chia sẻ cây gia phả với người khác không?',
      answer:
        'Có, bạn có thể chia sẻ cây gia phả bằng cách tạo liên kết mời hoặc quét mã QR. Vào phần "Chia sẻ" trong màn hình cây gia phả để tạo liên kết hoặc mã QR cho người khác tham gia.',
    },
    {
      id: '3',
      question: 'Làm sao để khôi phục mật khẩu?',
      answer:
        'Bạn có thể khôi phục mật khẩu bằng cách nhấn "Quên mật khẩu" ở màn hình đăng nhập. Hệ thống sẽ gửi email hướng dẫn đặt lại mật khẩu cho bạn.',
    },
    {
      id: '4',
      question: 'Dữ liệu của tôi có được bảo mật không?',
      answer:
        'Chúng tôi cam kết bảo mật dữ liệu của bạn. Tất cả thông tin được mã hóa và lưu trữ an toàn. Chúng tôi không chia sẻ dữ liệu cá nhân với bên thứ ba.',
    },
    {
      id: '5',
      question: 'Tôi có thể xem cây gia phả offline không?',
      answer:
        'Ứng dụng hỗ trợ xem cây gia phả khi offline. Tuy nhiên, để thêm hoặc chỉnh sửa thông tin, bạn cần kết nối internet.',
    },
  ];

  // Contact Data
  const contactItems: ContactItem[] = [
    {
      id: 'email',
      icon: 'mail-outline',
      label: 'Email',
      value: 'caygiapha@example.com',
      color: theme.colors.info,
    },
    {
      id: 'phone',
      icon: 'call-outline',
      label: 'Điện thoại',
      value: '0901 234 567',
      color: theme.colors.success,
    },
    {
      id: 'website',
      icon: 'globe-outline',
      label: 'Website',
      value: 'caygiapha.com',
      color: theme.colors.primary,
    },
    {
      id: 'facebook',
      icon: 'logo-facebook',
      label: 'Facebook',
      value: 'Cây Gia Phả',
      color: '#1877F2',
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
              { top: -100, left: -80, backgroundColor: '#10B981' },
            ]}
          />
          <View
            style={[
              styles.ambientGlow,
              { bottom: 100, right: -60, backgroundColor: '#6C63FF' },
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
              Trợ giúp
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              Câu hỏi thường gặp và hỗ trợ
            </Text>
          </View>
        </Animated.View>

        {/* ── FAQ Section ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            CÂU HỎI THƯỜNG GẶP
          </Text>
          <View style={styles.faqContainer}>
            {faqItems.map((item, index) => (
              <FAQItemComponent
                key={item.id}
                item={item}
                index={index}
                theme={theme}
              />
            ))}
          </View>
        </View>

        {/* ── Contact Section ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            LIÊN HỆ HỖ TRỢ
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textMuted }]}>
            Bạn có thể liên hệ với chúng tôi qua các kênh sau
          </Text>
          <View style={styles.contactContainer}>
            {contactItems.map((item, index) => (
              <ContactItemComponent
                key={item.id}
                item={item}
                index={index}
                theme={theme}
              />
            ))}
          </View>
        </View>

        {/* ── Working Hours ── */}
        <Animated.View
          style={[
            styles.workingHoursCard,
            {
              backgroundColor: hexRgba(theme.colors.primary, theme.dark ? 0.15 : 0.08),
              borderColor: hexRgba(theme.colors.primary, 0.2),
              opacity: contentAnim,
            },
          ]}>
          <View style={styles.workingHoursHeader}>
            <View
              style={[
                styles.workingHoursIcon,
                { backgroundColor: hexRgba(theme.colors.primary, 0.2) },
              ]}>
              <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.workingHoursTitle, { color: theme.colors.text }]}>
              Giờ làm việc
            </Text>
          </View>
          <View style={styles.workingHoursContent}>
            <View style={styles.workingHoursRow}>
              <Text style={[styles.workingHoursDay, { color: theme.colors.textSecondary }]}>
                Thứ 2 - Thứ 6
              </Text>
              <Text style={[styles.workingHoursTime, { color: theme.colors.text }]}>
                08:00 - 18:00
              </Text>
            </View>
            <View style={styles.workingHoursRow}>
              <Text style={[styles.workingHoursDay, { color: theme.colors.textSecondary }]}>
                Thứ 7
              </Text>
              <Text style={[styles.workingHoursTime, { color: theme.colors.text }]}>
                08:00 - 12:00
              </Text>
            </View>
            <View style={styles.workingHoursRow}>
              <Text style={[styles.workingHoursDay, { color: theme.colors.textSecondary }]}>
                Chủ nhật
              </Text>
              <Text style={[styles.workingHoursTime, { color: theme.colors.textMuted }]}>
                Nghỉ
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── App Version ── */}
        <Text style={[styles.versionText, { color: theme.colors.textMuted }]}>
          Cây Gia Phả v1.0.0
        </Text>
      </ScrollView>
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
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionDescription: {
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 4,
  },

  // FAQ Container
  faqContainer: {
    gap: 12,
  },

  // FAQ Item
  faqItem: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  faqIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  faqAnswerContainer: {
    overflow: 'hidden',
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 64,
  },
  faqAnswerText: {
    fontSize: 13,
    lineHeight: 20,
  },

  // Contact Container
  contactContainer: {
    gap: 12,
  },

  // Contact Item
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  contactValue: {
    fontSize: 13,
    marginTop: 2,
  },

  // Working Hours Card
  workingHoursCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  workingHoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  workingHoursIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workingHoursTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  workingHoursContent: {
    gap: 10,
  },
  workingHoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workingHoursDay: {
    fontSize: 14,
  },
  workingHoursTime: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Version
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 24,
    marginBottom: 20,
  },
});

export default HelpScreen;
