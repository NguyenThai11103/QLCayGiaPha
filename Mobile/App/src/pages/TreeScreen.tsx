import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons/static';

const TreeScreen: React.FC = () => (
  <LinearGradient colors={['#070712', '#1A0A00', '#070712']} style={styles.container}>
    <Ionicons name="git-network" size={64} color="#F59E0B" style={{ opacity: 0.4 }} />
    <Text style={styles.title}>Cây Gia Phả</Text>
    <Text style={styles.sub}>Tính năng đang phát triển...</Text>
  </LinearGradient>
);

const styles = StyleSheet.create({
  container : { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  title     : { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  sub       : { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
});

export default TreeScreen;
