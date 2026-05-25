/**
 * TreeLoadingAnimation v3 – Premium Edition
 *
 * Layers (bottom → top):
 *   1. Rotating dashed ring halo
 *   2. 3× Ripple rings expanding outward
 *   3. Tree image (breathing + micro-rotate)
 *   4. Shimmer sweep
 *   5. 10 floating particles drifting upward
 *   6. 13 star-shaped sparkles at branch tips
 *   7. Golden glow orb beneath trunk
 */
import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing, StyleSheet } from 'react-native';

const TREE_IMG = require('../assets/family_tree_hero.png');

const SIZE     = 240;
const HALF     = SIZE / 2;
const GOLD     = '#F0C060';
const PURPLE   = '#9B7FFF';
const GOLD_DIM = 'rgba(240,192,96,0.3)';

// ─────────────────────────────────────────────────────────────
//  Sparkle positions (% of SIZE)
// ─────────────────────────────────────────────────────────────
const SPARKLE_DEFS = [
  { rx: 0.18, ry: 0.08, sz: 9  },
  { rx: 0.32, ry: 0.04, sz: 7  },
  { rx: 0.50, ry: 0.02, sz: 11 },
  { rx: 0.68, ry: 0.04, sz: 7  },
  { rx: 0.82, ry: 0.08, sz: 9  },
  { rx: 0.10, ry: 0.22, sz: 6  },
  { rx: 0.25, ry: 0.18, sz: 7  },
  { rx: 0.75, ry: 0.18, sz: 7  },
  { rx: 0.90, ry: 0.22, sz: 6  },
  { rx: 0.14, ry: 0.38, sz: 5  },
  { rx: 0.86, ry: 0.38, sz: 5  },
  { rx: 0.38, ry: 0.12, sz: 8  },
  { rx: 0.62, ry: 0.12, sz: 8  },
];

// ─────────────────────────────────────────────────────────────
//  Floating particle positions (fixed so no re-render diff)
// ─────────────────────────────────────────────────────────────
const PARTICLE_DEFS = [
  { rx: 0.22, driftX: -12, sz: 3 },
  { rx: 0.38, driftX:   8, sz: 2 },
  { rx: 0.50, driftX:  -6, sz: 4 },
  { rx: 0.62, driftX:  14, sz: 2 },
  { rx: 0.78, driftX:  -9, sz: 3 },
  { rx: 0.30, driftX:  16, sz: 2 },
  { rx: 0.45, driftX:  -5, sz: 3 },
  { rx: 0.55, driftX:  10, sz: 2 },
  { rx: 0.70, driftX: -14, sz: 3 },
  { rx: 0.20, driftX:   6, sz: 2 },
];

// ─────────────────────────────────────────────────────────────
//  Star-shaped sparkle (cross + diamond)
// ─────────────────────────────────────────────────────────────
const StarSparkle: React.FC<{ rx: number; ry: number; sz: number; delay: number }> = ({
  rx, ry, sz, delay,
}) => {
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(a, {
          toValue: 1, duration: 500,
          easing: Easing.out(Easing.back(1.5)), useNativeDriver: true,
        }),
        Animated.timing(a, {
          toValue: 0, duration: 700,
          easing: Easing.in(Easing.quad), useNativeDriver: true,
        }),
        Animated.delay(1600 + delay % 700),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale   = a.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1.5, 0] });
  const opacity = a.interpolate({ inputRange: [0, 0.25, 0.75, 1], outputRange: [0, 1, 0.9, 0] });
  const cx      = rx * SIZE;
  const cy      = ry * SIZE;

  return (
    <Animated.View style={[styles.sparkleWrap, {
      left: cx - sz * 2, top: cy - sz * 2,
      width: sz * 4, height: sz * 4,
      opacity, transform: [{ scale }],
    }]}>
      {/* Horizontal bar */}
      <View style={[styles.starBar, {
        width: sz * 3.5, height: sz * 0.7,
        top: sz * 1.65, left: sz * 0.25,
      }]} />
      {/* Vertical bar */}
      <View style={[styles.starBar, {
        width: sz * 0.7, height: sz * 3.5,
        top: sz * 0.25, left: sz * 1.65,
      }]} />
      {/* Core glow */}
      <View style={[styles.starCore, {
        width: sz * 1.2, height: sz * 1.2, borderRadius: sz * 0.6,
        top: sz * 1.4, left: sz * 1.4,
      }]} />
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────
//  Floating upward particle
// ─────────────────────────────────────────────────────────────
const FloatParticle: React.FC<{ rx: number; driftX: number; sz: number; delay: number }> = ({
  rx, driftX, sz, delay,
}) => {
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(a, {
          toValue: 1, duration: 2800,
          easing: Easing.linear, useNativeDriver: true,
        }),
        Animated.delay(200),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [0, -120] });
  const translateX = a.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, driftX * 0.5, driftX] });
  const opacity    = a.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 0.9, 0.7, 0] });
  const scale      = a.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.2] });

  return (
    <Animated.View style={[styles.particle, {
      left: rx * SIZE - sz / 2,
      bottom: SIZE * 0.35,
      width: sz, height: sz, borderRadius: sz / 2,
      opacity, transform: [{ translateY }, { translateX }, { scale }],
    }]} />
  );
};

// ─────────────────────────────────────────────────────────────
//  Ripple ring
// ─────────────────────────────────────────────────────────────
const RippleRing: React.FC<{ delay: number; color: string; maxScale: number }> = ({
  delay, color, maxScale,
}) => {
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(a, {
          toValue: 1, duration: 2200,
          easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale   = a.interpolate({ inputRange: [0, 1], outputRange: [0.25, maxScale] });
  const opacity = a.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.45, 0] });

  return (
    <Animated.View style={[styles.ripple, {
      borderColor: color,
      opacity, transform: [{ scale }],
    }]} />
  );
};

// ─────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────
const TreeLoadingAnimation: React.FC = () => {
  const breathe = useRef(new Animated.Value(1)).current;
  const rotate  = useRef(new Animated.Value(0)).current;
  const ringRot = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(-1)).current;
  const glow    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Breathing scale
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.045, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1,     duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // 2. Micro tilt back-and-forth
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, { toValue: 1, duration: 4500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0, duration: 4500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // 3. Outer ring slow rotation
    Animated.loop(
      Animated.timing(ringRot, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // 4. Central golden glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();

    // 5. Shimmer sweep loop
    const runShimmer = () => {
      shimmer.setValue(-1);
      Animated.timing(shimmer, {
        toValue: 2.2, duration: 1800, delay: 600,
        easing: Easing.linear, useNativeDriver: true,
      }).start(({ finished }) => { if (finished) runShimmer(); });
    };
    runShimmer();
  }, []);

  const tiltDeg  = rotate.interpolate({ inputRange: [0, 1], outputRange: ['-1.2deg', '1.2deg'] });
  const ringDeg  = ringRot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const shimmerX = shimmer.interpolate({ inputRange: [-1, 2.2], outputRange: [-100, SIZE + 60] });
  const glowOp   = glow.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.32] });
  const glowScale= glow.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] });

  return (
    <View style={styles.root}>

      {/* ── Ripple rings (behind image) ── */}
      <View style={styles.centerAbs} pointerEvents="none">
        <RippleRing delay={0}    color={GOLD}   maxScale={1.7} />
        <RippleRing delay={730}  color={PURPLE} maxScale={1.5} />
        <RippleRing delay={1460} color={GOLD}   maxScale={1.9} />
      </View>

      {/* ── Rotating dashed halo ring ── */}
      <Animated.View style={[styles.haloRing, { transform: [{ rotate: ringDeg }] }]} pointerEvents="none" />

      {/* ── Golden glow orb (center pulse) ── */}
      <Animated.View style={[
        styles.centerGlow,
        { opacity: glowOp, transform: [{ scale: glowScale }] },
      ]} pointerEvents="none" />

      {/* ── Tree image: breathe + tilt ── */}
      <Animated.View style={[styles.imageWrap, {
        transform: [{ scale: breathe }, { rotate: tiltDeg }],
      }]}>
        <Image source={TREE_IMG} style={styles.image} resizeMode="contain" />

        {/* Shimmer sweep over image */}
        <Animated.View
          style={[styles.shimmer, { transform: [{ translateX: shimmerX }, { skewX: '-18deg' }] }]}
          pointerEvents="none"
        />
      </Animated.View>

      {/* ── Bottom golden glow ── */}
      <View style={styles.bottomGlow} pointerEvents="none" />

      {/* ── Floating particles ── */}
      <View style={styles.absoluteFill} pointerEvents="none">
        {PARTICLE_DEFS.map((p, i) => (
          <FloatParticle key={i} rx={p.rx} driftX={p.driftX} sz={p.sz} delay={i * 350} />
        ))}
      </View>

      {/* ── Star sparkles at branch tips ── */}
      <View style={styles.absoluteFill} pointerEvents="none">
        {SPARKLE_DEFS.map((s, i) => (
          <StarSparkle key={i} rx={s.rx} ry={s.ry} sz={s.sz} delay={i * 260} />
        ))}
      </View>

    </View>
  );
};

// ─────────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    width          : SIZE,
    height         : SIZE,
    alignItems     : 'center',
    justifyContent : 'center',
  },
  centerAbs: {
    position       : 'absolute',
    width          : SIZE,
    height         : SIZE,
    alignItems     : 'center',
    justifyContent : 'center',
  },
  absoluteFill: {
    position       : 'absolute',
    width          : SIZE,
    height         : SIZE,
    top            : 0,
    left           : 0,
  },

  // Rotating dashed halo ring
  haloRing: {
    position       : 'absolute',
    width          : SIZE + 28,
    height         : SIZE + 28,
    borderRadius   : (SIZE + 28) / 2,
    borderWidth    : 2,
    borderColor    : 'transparent',
    borderTopColor : GOLD_DIM,
    borderRightColor : 'rgba(155,127,255,0.4)',
    borderBottomColor: GOLD_DIM,
  },

  // Central glow orb
  centerGlow: {
    position       : 'absolute',
    width          : 160,
    height         : 160,
    borderRadius   : 80,
    backgroundColor: 'rgba(120,90,220,0.55)',
    top            : SIZE / 2 - 80,
    left           : SIZE / 2 - 80,
  },

  // Image container
  imageWrap: {
    width          : SIZE,
    height         : SIZE,
    overflow       : 'hidden',
    borderRadius   : 20,
  },
  image: {
    width          : SIZE,
    height         : SIZE,
  },

  // Shimmer
  shimmer: {
    position       : 'absolute',
    top            : 0,
    left           : 0,
    width          : 90,
    height         : '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Bottom glow
  bottomGlow: {
    position       : 'absolute',
    bottom         : SIZE * 0.08,
    left           : SIZE * 0.2,
    width          : SIZE * 0.6,
    height         : 20,
    borderRadius   : 10,
    backgroundColor: 'rgba(240,192,96,0.22)',
  },

  // Ripple
  ripple: {
    position       : 'absolute',
    width          : SIZE * 0.7,
    height         : SIZE * 0.7,
    borderRadius   : SIZE * 0.35,
    borderWidth    : 1.5,
  },

  // Sparkle
  sparkleWrap: {
    position       : 'absolute',
  },
  starBar: {
    position       : 'absolute',
    backgroundColor: GOLD,
    borderRadius   : 2,
  },
  starCore: {
    position       : 'absolute',
    backgroundColor: '#FFFFFF',
  },

  // Particle
  particle: {
    position       : 'absolute',
    backgroundColor: GOLD,
  },
});

export default TreeLoadingAnimation;
