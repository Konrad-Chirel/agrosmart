import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import Svg, { Path, Circle, G } from "react-native-svg";

const AnimatedG = Animated.createAnimatedComponent(G);

export function AnimatedRain({ color = "#ffffff" }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const drop1Y = anim.interpolate({ inputRange: [0, 1], outputRange: [-5, 15] });
  const drop1Opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] });
  const drop2Y = anim.interpolate({ inputRange: [0, 1], outputRange: [-2, 18] });
  const drop2Opacity = anim.interpolate({ inputRange: [0, 0.3, 0.8, 1], outputRange: [0.5, 1, 0, 0.5] });

  return (
    <Svg width="36" height="36" viewBox="0 0 40 40">
      <Path d="M30.5 24C33.5376 24 36 21.5376 36 18.5C36 15.6568 33.8407 13.3175 31.0664 13.0305C30.2974 9.61058 27.247 7 23.5 7C19.753 7 16.7026 9.61058 15.9336 13.0305C13.1593 13.3175 11 15.6568 11 18.5C11 21.5376 13.4624 24 16.5 24H30.5Z" fill={color} opacity={0.8} />
      <AnimatedG style={{ opacity: drop1Opacity, transform: [{ translateY: drop1Y }] }}>
        <Path d="M18 26C18 26 16.5 28.5 16.5 30C16.5 30.8284 17.1716 31.5 18 31.5C18.8284 31.5 19.5 30.8284 19.5 30C19.5 28.5 18 26 18 26Z" fill={color} />
      </AnimatedG>
      <AnimatedG style={{ opacity: drop2Opacity, transform: [{ translateY: drop2Y }] }}>
        <Path d="M23 28C23 28 21.5 30.5 21.5 32C21.5 32.8284 22.1716 33.5 23 33.5C23.8284 33.5 24.5 32.8284 24.5 32C24.5 30.5 23 28 23 28Z" fill={color} />
      </AnimatedG>
      <AnimatedG style={{ opacity: drop1Opacity, transform: [{ translateY: drop1Y }] }}>
        <Path d="M28 25C28 25 26.5 27.5 26.5 29C26.5 29.8284 27.1716 30.5 28 30.5C28.8284 30.5 29.5 29.8284 29.5 29C29.5 27.5 28 25 28 25Z" fill={color} />
      </AnimatedG>
    </Svg>
  );
}

export function AnimatedStorm({ color = "#ffffff", flashColor = "#fde047" }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 100, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 100, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 1, duration: 50, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <Svg width="36" height="36" viewBox="0 0 40 40">
      <Path d="M29.5 22C32.5376 22 35 19.5376 35 16.5C35 13.6568 32.8407 11.3175 30.0664 11.0305C29.2974 7.61058 26.247 5 22.5 5C18.753 5 15.7026 7.61058 14.9336 11.0305C12.1593 11.3175 10 13.6568 10 16.5C10 19.5376 12.4624 22 15.5 22H29.5Z" fill={color} opacity={0.7} />
      <AnimatedG style={{ opacity: anim }}>
        <Path d="M24 18L15 28H22L20 36L30 24H23L24 18Z" fill={flashColor} />
      </AnimatedG>
    </Svg>
  );
}

export function AnimatedSun({ color = "#ffffff" }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.1, 1] });

  return (
    <Animated.View style={{ transform: [{ rotate }, { scale }] }}>
      <Svg width="36" height="36" viewBox="0 0 40 40">
        <Circle cx="20" cy="20" r="7" fill={color} />
        <Path d="M20 4V8 M20 32V36 M4 20H8 M32 20H36 M8.686 8.686L11.514 11.514 M28.485 28.485L31.313 31.313 M8.686 31.314L11.514 28.486 M28.485 11.515L31.313 8.687" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

export function AnimatedLeaf({ color = "#ffffff" }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });

  return (
    <Animated.View style={{ transform: [{ scale }, { translateY }] }}>
      <Svg width="36" height="36" viewBox="0 0 40 40">
        <Path d="M20 34C20 34 8 26 8 16C8 10.4772 12.4772 6 18 6C19.5228 6 20 7 20 7C20 7 20.4772 6 22 6C27.5228 6 32 10.4772 32 16C32 26 20 34 20 34Z" fill={color} />
        <Path d="M20 34V16" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

export function WeatherAnimation({ type, color, flashColor }: { type: "rain" | "storm" | "sun" | "leaf", color?: string, flashColor?: string }) {
  switch (type) {
    case "rain": return <AnimatedRain color={color} />;
    case "storm": return <AnimatedStorm color={color} flashColor={flashColor} />;
    case "sun": return <AnimatedSun color={color} />;
    case "leaf": return <AnimatedLeaf color={color} />;
    default: return <AnimatedLeaf color={color} />;
  }
}
