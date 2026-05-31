import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { s } from '@/src/features/dashboard/styles/styles';

interface Props {
  lines?:  number;
  height?: number;
}

export function SkeletonCard({ lines = 3, height = 120 }: Props) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[s.kpiDetailCard, { opacity: pulse, height }]}>
      {Array.from({ length: lines }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 12,
            backgroundColor: '#e0e4eb',
            borderRadius: 6,
            marginBottom: 10,
            width: i === 0 ? '60%' : i % 2 === 0 ? '90%' : '75%',
          }}
        />
      ))}
    </Animated.View>
  );
}