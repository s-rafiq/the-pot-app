import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withTiming,
  withSequence,
  runOnJS
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { WidgetItem, WidgetSize } from './types';
import { useWidgetGesture } from './useWidgetGesture';
import { getWidgetSpan } from './layout';
import { theme } from '../../constants/theme';
import { Feather } from '@expo/vector-icons';
import { REFLOW_SPRING_CONFIG, SETTLE_TIMING_CONFIG } from './constants';
import * as Haptics from 'expo-haptics';

interface Props {
  widget: WidgetItem;
  isEditMode: boolean;
  cellSize: number;
  gap: number;
  updateLayout: (id: string, col: number, row: number) => void;
  onResize: (id: string, newSize: WidgetSize) => void;
  onHide: (id: string) => void;
  children: React.ReactNode;
}

export const DraggableWidget = React.memo(({ widget, isEditMode, cellSize, gap, updateLayout, onResize, onHide, children }: Props) => {
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const isResizing = useSharedValue(false);
  const jiggleRotation = useSharedValue(0);
  
  const span = getWidgetSpan(widget.size);
  const baseWidth = span.cols * cellSize + (span.cols - 1) * gap;
  const baseHeight = span.rows * cellSize + (span.rows - 1) * gap;

  const liveWidth = useSharedValue(baseWidth);
  const liveHeight = useSharedValue(baseHeight);
  const lastSnappedSize = useSharedValue<WidgetSize>(widget.size);

  // When edit mode changes, start/stop jiggle
  useEffect(() => {
    if (isEditMode) {
      jiggleRotation.value = withRepeat(
        withSequence(
          withTiming(-1, { duration: 100 }),
          withTiming(1, { duration: 100 })
        ),
        -1,
        true
      );
    } else {
      jiggleRotation.value = withTiming(0);
    }
  }, [isEditMode, jiggleRotation]);

  const gesture = useWidgetGesture({
    widget,
    isEditMode,
    dragX,
    dragY,
    startX,
    startY,
    isDragging,
    jiggleRotation,
    updateLayout,
    cellSize: cellSize + gap,
    isResizing,
    gap,
  });

  const triggerHaptic = () => {
    Haptics.selectionAsync();
  };

  const resizeGesture = Gesture.Pan()
    .enabled(isEditMode)
    .minDistance(0)
    .onBegin(() => {
      isResizing.value = true;
      liveWidth.value = baseWidth;
      liveHeight.value = baseHeight;
      lastSnappedSize.value = widget.size;
    })
    .onUpdate((event) => {
      const minW = 2 * cellSize + gap;
      const maxW = 4 * cellSize + 3 * gap;
      const minH = 1 * cellSize;
      const maxH = 2 * cellSize + gap;
      
      liveWidth.value = Math.min(Math.max(baseWidth + event.translationX, minW), maxW);
      liveHeight.value = Math.min(Math.max(baseHeight + event.translationY, minH), maxH);

      let nearestSize: WidgetSize = 'small';
      if (liveWidth.value > minW + cellSize && liveHeight.value > minH + cellSize / 2) {
        nearestSize = 'large';
      } else if (liveWidth.value > minW + cellSize) {
        nearestSize = 'medium';
      }

      if (nearestSize !== lastSnappedSize.value) {
        lastSnappedSize.value = nearestSize;
        runOnJS(triggerHaptic)();
      }
    })
    .onEnd(() => {
      runOnJS(onResize)(widget.id, lastSnappedSize.value);
    })
    .onFinalize(() => {
      isResizing.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => {
    // 1. Calculate absolute positioned X/Y based on grid cell (withSpring for smooth gliding)
    const baseLeft = widget.col * (cellSize + gap);
    const baseTop = widget.row * (cellSize + gap);

    const finalWidth = isResizing.value ? liveWidth.value : baseWidth;
    const finalHeight = isResizing.value ? liveHeight.value : baseHeight;

    return {
      left: isDragging.value ? dragX.value : withSpring(baseLeft, REFLOW_SPRING_CONFIG),
      top: isDragging.value ? dragY.value : withSpring(baseTop, REFLOW_SPRING_CONFIG),
      width: isResizing.value ? finalWidth : withTiming(finalWidth, SETTLE_TIMING_CONFIG),
      height: isResizing.value ? finalHeight : withTiming(finalHeight, SETTLE_TIMING_CONFIG),
      zIndex: isDragging.value || isResizing.value ? 100 : 1,
      transform: [
        { rotate: `${jiggleRotation.value}deg` },
        { scale: isDragging.value ? withSpring(1.05, REFLOW_SPRING_CONFIG) : withSpring(1, REFLOW_SPRING_CONFIG) },
      ],
      shadowOpacity: isDragging.value ? withSpring(0.3, REFLOW_SPRING_CONFIG) : withSpring(0, REFLOW_SPRING_CONFIG),
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill}>
          {children}
        </View>
      </GestureDetector>
      
      {isEditMode && (
        <>
          <TouchableOpacity 
            style={styles.removeButton} 
            onPress={() => onHide(widget.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="minus" size={16} color="#fff" />
          </TouchableOpacity>
          
          <GestureDetector gesture={resizeGesture}>
          <View style={styles.resizeHandle}>
            <View style={styles.resizeBracket} />
          </View>
        </GestureDetector>
        </>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden', // Contain the child gesture View
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 15,
    elevation: 10,
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 8,
    zIndex: 20,
    backgroundColor: 'transparent',
  },
  resizeBracket: {
    width: 14,
    height: 14,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: 'rgba(255,255,255,0.7)',
    borderBottomRightRadius: 4,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  }
});
