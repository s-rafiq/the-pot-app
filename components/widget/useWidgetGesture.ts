import * as Haptics from 'expo-haptics';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, SharedValue, useSharedValue } from 'react-native-reanimated';
import { getWidgetSpan } from './layout';
import { WidgetItem } from './types';

export function useWidgetGesture({
  widget,
  isEditMode,
  dragX,
  dragY,
  startX,
  startY,
  isDragging,
  jiggleRotation,
  updateLayout,
  cellSize,
  isResizing,
  gap
}: {
  widget: WidgetItem;
  isEditMode: boolean;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  startX: SharedValue<number>;
  startY: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  jiggleRotation: SharedValue<number>;
  updateLayout: (id: string, col: number, row: number) => void;
  cellSize: number;
  isResizing: SharedValue<boolean>;
  gap: number;
}) {
  const lastTargetCol = useSharedValue(widget.col);
  const lastTargetRow = useSharedValue(widget.row);
  const span = getWidgetSpan(widget.size);
  const grabX = useSharedValue(0);
  const grabY = useSharedValue(0);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const panGesture = Gesture.Pan()
    .enabled(isEditMode)
    .onBegin((event) => {
      grabX.value = event.x;
      grabY.value = event.y;
    })
    .onStart(() => {
      if (isResizing.value) return;
      isDragging.value = true;
      runOnJS(triggerHaptic)();

      const currentLayoutX = widget.col * (cellSize);
      const currentLayoutY = widget.row * (cellSize);
      startX.value = currentLayoutX;
      startY.value = currentLayoutY;
      dragX.value = currentLayoutX;
      dragY.value = currentLayoutY;

      lastTargetCol.value = widget.col;
      lastTargetRow.value = widget.row;
    })
    .onUpdate((event) => {
      if (!isDragging.value) return;

      dragX.value = startX.value + event.translationX;
      dragY.value = startY.value + event.translationY;

      const pointerX = dragX.value + grabX.value;
      const centerY = dragY.value + (span.rows * cellSize - gap) / 2;

      const targetRow = Math.max(0, Math.floor(centerY / cellSize));
      const isWide = widget.size === 'medium' || widget.size === 'large';
      const targetCol = isWide ? 0 : Math.max(0, Math.min(3, Math.floor(pointerX / cellSize)));

      if (targetCol !== lastTargetCol.value || targetRow !== lastTargetRow.value) {
        lastTargetCol.value = targetCol;
        lastTargetRow.value = targetRow;
        runOnJS(updateLayout)(widget.id, targetCol, targetRow);
        runOnJS(triggerHaptic)();
      }
    })
    .onFinalize(() => {
      if (!isDragging.value) return;
      isDragging.value = false;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(350)
    .onStart(() => {
      // Not edit mode yet? We would typically dispatch an action here.
    });

  // A composed gesture prioritizing LongPress then Pan
  const composed = Gesture.Simultaneous(longPressGesture, panGesture);

  return composed;
}
