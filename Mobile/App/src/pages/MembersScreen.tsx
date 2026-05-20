import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';

const MembersScreen: React.FC = () => (
  <LinearGradient colors={['#070712', '#0E0A26', '#070712']} style={styles.container}>
    <Ionicons name="people" size={64} color="#10B981" style={{ opacity: 0.4 }} />
    <Text style={styles.title}>Thành Viên</Text>
    <Text style={styles.sub}>Tính năng đang phát triển...</Text>
  </LinearGradient>
);

const styles = StyleSheet.create({
  container : { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  title     : { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  sub       : { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
});

export default MembersScreen;
