import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, ActionSheetIOS, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WidgetItem, WidgetSize } from './types';
import { resolveLayout, getWidgetSpan } from './layout';
import { DraggableWidget } from './DraggableWidget';
import { SummaryCard } from '../SummaryCard';
import { theme } from '../../constants/theme';
import { Feather } from '@expo/vector-icons';
import { formatMoney } from "../../utils/money";

interface Props {
  balance: number;
  owed: number;
  grandTotalOwed: number;
  myPersonBalance: number | null;
}

const DEFAULT_LAYOUT: WidgetItem[] = [
  { id: 'youOwe', col: 0, row: 0, size: 'small', contentId: 'youOwe' },
  { id: 'potBalance', col: 2, row: 0, size: 'small', contentId: 'potBalance' },
  { id: 'totalOwed', col: 0, row: 1, size: 'small', contentId: 'totalOwed' },
  { id: 'projectedTotal', col: 2, row: 1, size: 'small', contentId: 'projectedTotal' },
];

const WIDGET_TITLES: Record<string, string> = {
  youOwe: 'You Owe',
  potBalance: 'Available',
  totalOwed: 'Grand Total Owed',
  projectedTotal: 'Projected Grand Total'
};

export function WidgetGrid({ balance, owed, grandTotalOwed, myPersonBalance }: Props) {
  const [widgets, setWidgets] = useState<WidgetItem[]>(DEFAULT_LAYOUT);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('iosWidgetLayout').then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Migration: Force all loaded widgets to use contentId as their id to prevent old 'w3' collisions
            let layoutToSet = parsed.map((p: WidgetItem) => ({ ...p, id: p.contentId }));
            
            // Clean up deleted widgets
            layoutToSet = layoutToSet.filter(w => 
              w.contentId !== 'peopleCount' && 
              w.contentId !== 'previousOwed' && 
              w.contentId !== 'grandTotalOwed' &&
              w.contentId !== 'totalNetFunding'
            );
            
            // Migration: Add any missing default widgets to the saved layout
            const missingWidgets = DEFAULT_LAYOUT.filter(
              def => !layoutToSet.some((p: WidgetItem) => p.contentId === def.contentId)
            );
            if (missingWidgets.length > 0) {
              layoutToSet = resolveLayout([...layoutToSet, ...missingWidgets]);
              AsyncStorage.setItem('iosWidgetLayout', JSON.stringify(layoutToSet));
            }
            setWidgets(layoutToSet);
          }
        } catch (e) {}
      } else {
        // Initial auto-layout
        setWidgets(resolveLayout(DEFAULT_LAYOUT));
      }
    });
  }, []);

  const saveLayout = (layout: WidgetItem[]) => {
    setWidgets(layout);
    AsyncStorage.setItem('iosWidgetLayout', JSON.stringify(layout));
  };

  const updateLayout = useCallback((movedId: string, targetCol: number, targetRow: number) => {
    setWidgets((prev) => {
      const newLayout = resolveLayout(prev, movedId, targetCol, targetRow);
      // We don't save to AsyncStorage on every tiny drag frame, only on release or explicitly
      return newLayout;
    });
  }, []);

  const handleResize = useCallback((id: string, newSize: WidgetSize) => {
    setWidgets((prev) => {
      const modified = prev.map(w => {
        if (w.id === id) {
          // medium and large must be in col 0
          const shouldSnapToLeft = (newSize === 'medium' || newSize === 'large') && w.col !== 0;
          return { ...w, size: newSize, col: shouldSnapToLeft ? 0 : w.col };
        }
        return w;
      });
      
      const packed = resolveLayout(modified);
      AsyncStorage.setItem('iosWidgetLayout', JSON.stringify(packed));
      return packed;
    });
  }, []);

  const hideWidget = useCallback((id: string) => {
    setWidgets((current) => {
      const updated = current.map(w => w.id === id ? { ...w, isHidden: true } : w);
      const packed = resolveLayout(updated);
      AsyncStorage.setItem('iosWidgetLayout', JSON.stringify(packed));
      return packed;
    });
  }, []);

  const unhideWidget = useCallback((id: string) => {
    setWidgets((current) => {
      const updated = current.map(w => w.id === id ? { ...w, isHidden: false } : w);
      const packed = resolveLayout(updated);
      AsyncStorage.setItem('iosWidgetLayout', JSON.stringify(packed));
      return packed;
    });
  }, []);

  const showAddWidgetActionSheet = () => {
    const hidden = widgets.filter(w => w.isHidden);
    if (hidden.length === 0) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...hidden.map(w => WIDGET_TITLES[w.contentId] || w.contentId)],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) return;
          unhideWidget(hidden[buttonIndex - 1].id);
        }
      );
    }
  };

  const renderWidgetContent = useCallback((contentId: string, size: WidgetSize) => {
    const align = (size === 'medium' || size === 'large') ? 'center' : 'left';
    const variant = size === 'large' ? 'large' : 'normal';

    switch (contentId) {
      case 'youOwe':
        const amount = myPersonBalance ?? 0;
        const absAmount = Math.abs(amount);
        const label = myPersonBalance === null ? 'Select "This is me"' : 'You Owe';
        return <SummaryCard label={label} value={`£${formatMoney(absAmount)}`} style={styles.cardInner} align={align} size={variant} />;
      case 'potBalance':
        return <SummaryCard label="Available" value={`£${formatMoney(balance)}`} style={styles.cardInner} align={align} size={variant} />;
      case 'totalOwed':
        return <SummaryCard label="Grand Total Owed" value={`£${formatMoney(owed)}`} style={styles.cardInner} align={align} size={variant} />;
      case 'projectedTotal':
        const projected = balance + grandTotalOwed;
        return <SummaryCard label="Projected Grand Total" value={`£${formatMoney(projected)}`} style={styles.cardInner} align={align} size={variant} />;
      default:
        return null;
    }
  }, [balance, owed, grandTotalOwed, myPersonBalance]);

  // Calculate container height based on maximum row
  const screenWidth = Dimensions.get('window').width - theme.spacing.lg * 2;
  const gap = 12;
  const cols = 4;
  const cellSize = (screenWidth - gap * (cols - 1)) / cols;

  const maxRow = useMemo(() => {
    return widgets.reduce((max, w) => {
      const { rows } = getWidgetSpan(w.size);
      return Math.max(max, w.row + rows);
    }, 0);
  }, [widgets]);

  const containerHeight = maxRow * cellSize + (maxRow - 1) * gap;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.title}>Dashboard</Text>
          {isEditMode && widgets.some(w => w.isHidden) && (
            <TouchableOpacity onPress={showAddWidgetActionSheet} style={styles.addBtn}>
              <Feather name="plus" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => {
          if (isEditMode) AsyncStorage.setItem('iosWidgetLayout', JSON.stringify(widgets));
          setIsEditMode(!isEditMode);
        }} style={styles.editBtn}>
          <Feather name={isEditMode ? "check" : "sliders"} size={18} color={theme.colors.text} />
          <Text style={styles.editBtnText}>{isEditMode ? "Done" : "Edit"}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.grid, { height: Math.max(containerHeight, 200) }]}>
        {widgets.filter(w => !w.isHidden).map((widget) => (
          <DraggableWidget
            key={widget.id}
            widget={widget}
            isEditMode={isEditMode}
            cellSize={cellSize}
            gap={gap}
            updateLayout={updateLayout}
            onResize={handleResize}
            onHide={hideWidget}
          >
            {renderWidgetContent(widget.contentId, widget.size)}
          </DraggableWidget>
        ))}
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
  addBtn: {
    marginLeft: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
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
    position: 'relative',
    width: '100%',
  },
  cardInner: {
    flex: 1,
    margin: 0,
    marginBottom: 0,
    borderWidth: 0,
    padding: theme.spacing.md,
  }
});
