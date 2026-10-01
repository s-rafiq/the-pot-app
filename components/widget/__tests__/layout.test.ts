import { WidgetItem } from '../types';
import { resolveLayout } from '../layout';
import assert from 'assert';

const runTests = () => {
  console.log('Testing direct swap (moving up)');
  const w1: WidgetItem[] = [
    { id: 'wA', size: 'small', row: 0, col: 0, contentId: 'A' },
    { id: 'wB', size: 'small', row: 0, col: 2, contentId: 'B' },
    { id: 'wC', size: 'small', row: 1, col: 0, contentId: 'C' },
  ];
  const res1 = resolveLayout(w1, 'wC', 0, 0); 
  assert.strictEqual(res1.find(w => w.id === 'wC')?.row, 0, 'C row should be 0');
  assert.strictEqual(res1.find(w => w.id === 'wC')?.col, 0, 'C col should be 0');
  assert.strictEqual(res1.find(w => w.id === 'wA')?.row, 1, 'A row should be 1');

  console.log('Testing direct swap (moving down)');
  const res2 = resolveLayout(res1, 'wC', 0, 1); 
  assert.strictEqual(res2.find(w => w.id === 'wC')?.row, 1, 'C row should be 1');
  assert.strictEqual(res2.find(w => w.id === 'wA')?.row, 0, 'A row should be 0');

  console.log('Testing small onto medium (moving up)');
  const w2: WidgetItem[] = [
    { id: 'wM', size: 'medium', row: 0, col: 0, contentId: 'M' },
    { id: 'wS1', size: 'small', row: 1, col: 0, contentId: 'S1' },
    { id: 'wS2', size: 'small', row: 1, col: 2, contentId: 'S2' },
  ];
  const res3 = resolveLayout(w2, 'wS1', 0, 0);
  assert.strictEqual(res3.find(w => w.id === 'wS1')?.row, 0, 'S1 row should be 0');
  assert.strictEqual(res3.find(w => w.id === 'wM')?.row, 1, 'M row should be 1');

  console.log('Testing small onto medium (moving down)');
  const res4 = resolveLayout(res3, 'wS1', 1, 0); // target M is at 1,0 
  assert.strictEqual(res4.find(w => w.id === 'wM')?.row, 0, 'M row should be 0');
  assert.strictEqual(res4.find(w => w.id === 'wS1')?.row, 1, 'S1 row should be 1');

  console.log('Testing medium upward past small');
  const w3: WidgetItem[] = [
    { id: 'wS1', size: 'small', row: 0, col: 0, contentId: 'S1' }, 
    { id: 'wS2', size: 'small', row: 0, col: 2, contentId: 'S2' },
    { id: 'wM', size: 'medium', row: 1, col: 0, contentId: 'M' },
  ];
  const res5 = resolveLayout(w3, 'wM', 0, 0);
  assert.strictEqual(res5.find(w => w.id === 'wM')?.row, 0);
  assert.strictEqual(res5.find(w => w.id === 'wS1')?.row, 1);

  console.log('Testing medium downward past small');
  const res6 = resolveLayout(res5, 'wM', 1, 0); // target S1 is at 1,0 
  assert.strictEqual(res6.find(w => w.id === 'wM')?.row, 1);
  assert.strictEqual(res6.find(w => w.id === 'wS1')?.row, 0);

  console.log('All tests passed in layout.test.ts!');
};

runTests();
