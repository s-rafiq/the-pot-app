import { WidgetItem } from './components/widget/types';
import { resolveLayout } from './components/widget/layout';

const w2: WidgetItem[] = [
  { id: 'S1', size: 'small', row: 0, col: 0, contentId: 'S1' },
  { id: 'S2', size: 'small', row: 0, col: 2, contentId: 'S2' },
  { id: 'L1', size: 'large', row: 1, col: 0, contentId: 'L1' },
];

console.log('If we force targetCol=0:');
const res4 = resolveLayout(w2, 'L1', 0, 0); 
console.log('res4 L1 row:', res4.find(w => w.id === 'L1')?.row); // 0
console.log('res4 S1 row:', res4.find(w => w.id === 'S1')?.row); // 2
console.log('res4 S2 row:', res4.find(w => w.id === 'S2')?.row); // 2

