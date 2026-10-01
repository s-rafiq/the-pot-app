import { WidgetItem, WidgetSize } from './types';

export function getWidgetSpan(size: string) {
  switch (size) {
    case 'medium': return { cols: 4, rows: 1 };
    case 'large': return { cols: 4, rows: 2 };
    case 'small':
    default: return { cols: 2, rows: 1 };
  }
}

// Clamp target column so the widget doesn't overflow the 4-column grid
function clampCol(col: number, colsRequired: number) {
  if (colsRequired >= 4) return 0;
  if (col < 2) return 0; // Snap to left side
  return 2; // Snap to right side for small
}

export function resolveLayout(
  widgets: WidgetItem[],
  movedId?: string,
  targetCol?: number,
  targetRow?: number
): WidgetItem[] {
  let ordered = widgets.map(w => ({ ...w }));

  if (movedId && targetCol !== undefined && targetRow !== undefined) {
    const map: Record<string, string> = {};
    for (const w of widgets) {
      if (w.id === movedId) continue;
      const span = getWidgetSpan(w.size);
      for (let r = 0; r < span.rows; r++) {
        for (let c = 0; c < span.cols; c++) {
          map[`${w.row + r},${w.col + c}`] = w.id;
        }
      }
    }

    const targetId = map[`${targetRow},${targetCol}`];
    
    if (targetId) {
      const origMovedIndex = ordered.findIndex(w => w.id === movedId);
      const origTargetIndex = ordered.findIndex(w => w.id === targetId);
      
      const movedWidget = ordered[origMovedIndex];
      const targetWidget = ordered[origTargetIndex];

      if (movedWidget.size === targetWidget.size) {
        ordered[origMovedIndex] = targetWidget;
        ordered[origTargetIndex] = movedWidget;
      } else {
        const movingDown = origMovedIndex < origTargetIndex;
        ordered.splice(origMovedIndex, 1);
        const newTargetIndex = ordered.findIndex(w => w.id === targetId);
        
        if (movingDown) {
          ordered.splice(newTargetIndex + 1, 0, movedWidget);
        } else {
          ordered.splice(newTargetIndex, 0, movedWidget);
        }
      }
    } else {
      const origMovedIndex = ordered.findIndex(w => w.id === movedId);
      const movedWidget = ordered[origMovedIndex];
      ordered.splice(origMovedIndex, 1);
      
      const insertIndex = ordered.findIndex(w => w.row > targetRow || (w.row === targetRow && w.col >= targetCol));
      if (insertIndex !== -1) {
        ordered.splice(insertIndex, 0, movedWidget);
      } else {
        ordered.push(movedWidget);
      }
    }
  }

  const grid: boolean[][] = [];
  const finalLayout: WidgetItem[] = [];

  for (const w of ordered) {
    if (w.isHidden) {
      finalLayout.push(w);
      continue;
    }
    const span = getWidgetSpan(w.size);
    let placed = false;
    for (let r = 0; r < 100 && !placed; r++) {
      for (let c = 0; c <= 4 - span.cols; c += 2) {
        let fits = true;
        for (let i = 0; i < span.rows && fits; i++) {
          for (let j = 0; j < span.cols && fits; j++) {
            if (grid[r + i]?.[c + j]) fits = false;
          }
        }
        if (fits) {
          for (let i = 0; i < span.rows; i++) {
            if (!grid[r + i]) grid[r + i] = [];
            for (let j = 0; j < span.cols; j++) {
              grid[r + i][c + j] = true;
            }
          }
          finalLayout.push({ ...w, row: r, col: c });
          placed = true;
          break;
        }
      }
    }
  }
  return finalLayout;
}
