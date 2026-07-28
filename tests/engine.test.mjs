import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Engine } = require('../src/11-store.js');

let fails = 0;
const eq = (got, want, name) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`}`);
  if (!ok) fails++;
};

/* business-date mapping (cutoff 06:00) */
eq(Engine.bdOf(new Date(2026, 6, 28, 1, 30), 6), '2026-07-27', 'sale at 01:30 belongs to previous evening');
eq(Engine.bdOf(new Date(2026, 6, 28, 5, 59), 6), '2026-07-27', '05:59 still previous day');
eq(Engine.bdOf(new Date(2026, 6, 28, 6, 0), 6), '2026-07-28', '06:00 starts new day');
eq(Engine.bdOf(new Date(2026, 6, 28, 23, 10), 6), '2026-07-28', 'evening is same day');
eq(Engine.bdOf(new Date(2026, 0, 1, 2, 0), 6), '2025-12-31', 'year boundary');
eq(Engine.addDays('2026-07-31', 1), '2026-08-01', 'addDays month roll');
eq(Engine.addDays('2026-03-01', -1), '2026-02-28', 'addDays back');

/* expected-stock chain */
const D0 = '2026-07-20', D1 = '2026-07-21', D2 = '2026-07-22';
const st = {
  counts: [{ id: 'c0', bd: D0, status: 'closed', isOpening: true, closedAt: '2026-07-20T10:00:00.000Z',
    lines: [{ itemId: 'A', expected: 10, counted: 10, variance: 0 }] }],
  restocks: [{ id: 'r1', itemId: 'A', qty: 5, bd: D1, at: '2026-07-21T16:00:00.000Z' }],
  sales: [
    { id: 's1', itemId: 'A', qty: 2, bd: D1, at: '2026-07-21T20:00:00.000Z', voidedAt: null },
    { id: 's2', itemId: 'A', qty: 1, bd: D1, at: '2026-07-22T01:30:00.000Z', voidedAt: null },
    { id: 's3', itemId: 'A', qty: 4, bd: D1, at: '2026-07-21T22:00:00.000Z', voidedAt: '2026-07-22T09:00:00.000Z' }, // voided → ignored
  ],
  waste: [{ id: 'w1', itemId: 'A', qty: 1, bd: D1, at: '2026-07-21T23:00:00.000Z' }],
};
eq(Engine.expected(st, 'A', D1), 10 + 5 - 3 - 1, 'expected D1 = open+restock−sales(non-void)−waste');
eq(Engine.expected(st, 'A', D1, { strictlyBefore: true }), 11, 'during-count baseline is previous count');

/* close D1 at counted 10 (variance −1), then D2 */
st.counts.push({ id: 'c1', bd: D1, status: 'closed', closedAt: '2026-07-22T04:30:00.000Z',
  lines: [{ itemId: 'A', expected: 11, counted: 10, variance: -1 }] });
st.sales.push({ id: 's4', itemId: 'A', qty: 2, bd: D2, at: '2026-07-22T21:00:00.000Z', voidedAt: null });
eq(Engine.expected(st, 'A', D2), 10 - 2, 'expected D2 baselines on D1 counted');
eq(Engine.expected(st, 'A', D2, { strictlyBefore: true }), 8, 'count D2 uses D1 count (strictly before)');

/* same-bd entry after count close is included */
st.sales.push({ id: 's5', itemId: 'A', qty: 1, bd: D1, at: '2026-07-22T05:00:00.000Z', voidedAt: null }); // after c1 closedAt, same bd
eq(Engine.expected(st, 'A', D2), 7, 'post-close same-bd sale still deducted');

/* item unknown to baseline count starts at 0 */
st.restocks.push({ id: 'r2', itemId: 'B', qty: 12, bd: D2, at: '2026-07-22T15:00:00.000Z' });
eq(Engine.expected(st, 'B', D2), 12, 'new item = restocks only');

/* open counts are never baselines */
st.counts.push({ id: 'c2', bd: D2, status: 'open', lines: [{ itemId: 'A', expected: 99, counted: 99, variance: 0 }] });
eq(Engine.expected(st, 'A', D2), 7, 'open count ignored as baseline');

/* shrinkage series: negatives only, cumulative, opening excluded */
const shr = Engine.shrinkageSeries(st);
eq(shr.length, 1, 'shrinkage: only closed non-opening counts');
eq(shr[0], { bd: D1, day: 1, cum: 1 }, 'shrinkage day/cum from negative variance');

/* velocity */
const st2 = { sales: [
  { itemId: 'A', qty: 7, bd: '2026-07-25', voidedAt: null },
  { itemId: 'A', qty: 7, bd: '2026-07-27', voidedAt: null },
  { itemId: 'A', qty: 7, bd: '2026-07-10', voidedAt: null }, // outside 14d window
  { itemId: 'A', qty: 9, bd: '2026-07-26', voidedAt: '2026-07-26T10:00:00Z' }, // voided
] };
eq(Engine.velocity(st2, 'A', '2026-07-28', 14), 1, 'velocity = 14 units / 14 days');
eq(Engine.daysUntilStockout(10, 1), 10, 'days until stockout');
eq(Engine.daysUntilStockout(10, 0), null, 'no velocity → no estimate');

/* per-line count timestamps: sales after an item was counted (but before close) hit the NEXT day */
const D3 = '2026-07-23', D4 = '2026-07-24';
st.counts.pop(); // drop open count c2
st.counts.push({ id: 'c3', bd: D2, status: 'closed', closedAt: '2026-07-23T04:40:00.000Z', lines: [
  { itemId: 'A', expected: 7, counted: 7, variance: 0, at: '2026-07-23T04:10:00.000Z' },
] });
// sale logged 04:20, same bd D2, AFTER A was counted (04:10) but BEFORE close (04:40)
st.sales.push({ id: 's6', itemId: 'A', qty: 1, bd: D2, at: '2026-07-23T04:20:00.000Z', voidedAt: null });
eq(Engine.expected(st, 'A', D3), 6, 'sale after per-line count time is NOT swallowed');
// sale logged 04:05, same bd D2, BEFORE A was counted → already in the counted observation
st.sales.push({ id: 's7', itemId: 'A', qty: 2, bd: D2, at: '2026-07-23T04:05:00.000Z', voidedAt: null });
eq(Engine.expected(st, 'A', D3), 6, 'sale before per-line count time stays absorbed by counted');

/* velocity: young bar divides by days actually traded, today's partial day excluded */
const st3 = {
  counts: [{ id: 'o', bd: '2026-07-25', status: 'closed', isOpening: true, closedAt: 'x', lines: [] }],
  sales: [
    { itemId: 'A', qty: 2, bd: '2026-07-26', voidedAt: null },
    { itemId: 'A', qty: 4, bd: '2026-07-27', voidedAt: null },
    { itemId: 'A', qty: 9, bd: '2026-07-28', voidedAt: null }, // today — excluded
  ],
};
eq(Engine.velocity(st3, 'A', '2026-07-28', 14), 3, 'young bar: 6 units / 2 traded days, today excluded');

console.log(fails ? `\n${fails} FAILURES` : '\nALL ENGINE TESTS PASS');
process.exit(fails ? 1 : 0);
