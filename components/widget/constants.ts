import { Easing } from 'react-native-reanimated';

export const REFLOW_SPRING_CONFIG = {
  damping: 28,
  stiffness: 300,
  mass: 1,
  overshootClamping: true,
};

export const SETTLE_TIMING_CONFIG = {
  duration: 200,
  easing: Easing.out(Easing.cubic),
};
