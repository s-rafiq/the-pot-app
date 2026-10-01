import { WidgetItem } from './components/widget/types';
import { resolveLayout } from './components/widget/layout';
import assert from 'assert';

const runTests = () => {
  console.log('Testing Large dragged up by right side (targetCol=2)');
  const w2: WidgetItem[] = [
    { id: 'S1', size: 'small', row: 0, col: 0, contentId: 'S1' },
    { id: 'S2', size: 'small', row: 0, col: 2, contentId: 'S2' },
    { id: 'L1', size: 'large', row: 1, col: 0, contentId: 'L1' },
  ];
  
  // Bug simulation: Large targets col 2 (S2) instead of col 0
  const res3 = resolveLayout(w2, 'L1', 2, 0); 
  
  // We expect L1 to be at row 0, but because of the bug, it goes to row 1
  console.log('res3 L1 row:', res3.find(w => w.id === 'L1')?.row); // 1
  console.log('res3 S1 row:', res3.find(w => w.id === 'S1')?.row); // 0
  console.log('res3 S2 row:', res3.find(w => w.id === 'S2')?.row); // 2
};
runTests();
