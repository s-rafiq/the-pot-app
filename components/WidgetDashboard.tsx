import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, PanResponder, LayoutAnimation, UIManager, Platform } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { SummaryCard } from './SummaryCard';
import { formatMoney } from "../utils/money";

export type WidgetId = 'potBalance' | 'totalOwed' | 'peopleCount';
export type WidgetSize = 'half' | 'full';

export interface Widget {
  id: WidgetId;
  size: WidgetSize;
  visible: boolean;
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'potBalance', size: 'half', visible: true },
  { id: 'totalOwed', size: 'half', visible: true },
  { id: 'peopleCount', size: 'full', visible: true },
];

interface WidgetDashboardProps {
  balance: number;
  owed: number;
  peopleCount: number;
}

export function WidgetDashboard({ balance, owed, peopleCount }: WidgetDashboardProps) {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('widgetLayout').then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWidgets(parsed);
          }
        } catch (e) {
          console.error("Failed to parse widgets", e);
        }
      }
    });
  }, []);

  const saveLayout = async (newLayout: Widget[]) => {
    setWidgets(newLayout);
    await AsyncStorage.setItem('widgetLayout', JSON.stringify(newLayout));
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const newLayout = [...widgets];
    if (direction === 'up' && index > 0) {
      const temp = newLayout[index - 1];
      newLayout[index - 1] = newLayout[index];
      newLayout[index] = temp;
    } else if (direction === 'down' && index < newLayout.length - 1) {
      const temp = newLayout[index + 1];
      newLayout[index + 1] = newLayout[index];
      newLayout[index] = temp;
    }
    saveLayout(newLayout);
  };

  const toggleSize = (index: number) => {
    const newLayout = [...widgets];
    newLayout[index].size = newLayout[index].size === 'half' ? 'full' : 'half';
    saveLayout(newLayout);
  };

  const toggleVisible = (index: number) => {
    const newLayout = [...widgets];
    newLayout[index].visible = !newLayout[index].visible;
    saveLayout(newLayout);
  };


  const renderWidgetContent = (id: WidgetId) => {
    switch (id) {
      case 'potBalance':
        return { label: 'Current Pot Balance', value: `£${formatMoney(balance)}` };
      case 'totalOwed':
        return { label: 'Total Owed Back', value: `£${formatMoney(owed)}` };
      case 'peopleCount':
        return { label: 'Active People', value: peopleCount.toString() };
    }
  };

  const DraggableWidget = ({ widget, index, isHalf }: { widget: Widget, index: number, isHalf: boolean }) => {
    const pan = React.useRef(new Animated.ValueXY()).current;
    
    const panResponder = React.useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => isEditMode,
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
        onPanResponderRelease: (e, gesture) => {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
          
          if (gesture.dx > 100 || gesture.dy > 100) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
            moveWidget(index, 'down');
          } else if (gesture.dx < -100 || gesture.dy < -100) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
            moveWidget(index, 'up');
          }
        },
      })
    ).current;

    const content = renderWidgetContent(widget.id);

    return (
      <Animated.View 
        style={[
          styles.widgetWrapper, 
          isHalf ? styles.half : styles.full,
          isEditMode && { transform: [{ translateX: pan.x }, { translateY: pan.y }], zIndex: 10 }
        ]}
        {...(isEditMode ? panResponder.panHandlers : {})}
      >
        <SummaryCard 
          label={content.label} 
          value={content.value} 
          style={[
            styles.widgetCard, 
            isEditMode && styles.editingCard,
            !widget.visible && isEditMode && styles.hiddenCard
          ]} 
        />
        {isEditMode && (
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlBtn} onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              toggleSize(index);
            }}>
              <Feather name={isHalf ? "maximize-2" : "minimize-2"} size={16} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn} onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              toggleVisible(index);
            }}>
              <Feather name={widget.visible ? "eye-off" : "eye"} size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <TouchableOpacity onPress={() => setIsEditMode(!isEditMode)} style={styles.editBtn}>
          <Feather name={isEditMode ? "check" : "sliders"} size={18} color={theme.colors.text} />
          <Text style={styles.editBtnText}>{isEditMode ? "Done" : "Edit"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {widgets.map((widget, index) => {
          if (!widget.visible && !isEditMode) return null;
          return <DraggableWidget key={widget.id} widget={widget} index={index} isHalf={widget.size === 'half'} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    gap: 6,
  },
  editBtnText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  widgetWrapper: {
    marginBottom: theme.spacing.md,
  },
  half: {
    width: '48%',
  },
  full: {
    width: '100%',
  },
  widgetCard: {
    marginBottom: 0, // Override SummaryCard default margin
  },
  editingCard: {
    opacity: 0.8,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  hiddenCard: {
    opacity: 0.3,
  },
  controls: {
    position: 'absolute',
    bottom: -10,
    left: '10%',
    right: '10%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.full,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  controlBtn: {
    padding: 4,
  },
});
