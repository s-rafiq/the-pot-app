export type WidgetSize = 'small' | 'medium' | 'large';
// Grid is 4 columns.
// small = 2x2 cells
// medium = 4x2 cells
// large = 4x4 cells

export interface WidgetItem {
  id: string;
  col: number; // 0 to 3
  row: number; // 0 upwards
  size: WidgetSize;
  contentId: string; // references 'potBalance', 'totalOwed', etc.
  isHidden?: boolean;
}
