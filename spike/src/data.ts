export type Row = {
  id: string;
  cells: string[];
  amount: number;
};

export type Column = {
  key: string;
  title: string;
  width: number;
  align?: 'left' | 'right';
};

const CUSTOMERS = [
  'Harbor Dental', 'Northwind Cold Storage', 'Kestrel Apartments', 'Bluegate Clinic',
  'Maple & Stone Cafe', 'Orbit Fitness', 'Cedar Ridge School', 'Atlas Freight',
  'Lumen Bakery', 'Riverside Hotel', 'Pinecrest Pharmacy', 'Juniper Labs',
];
const TECHS = ['Amira Haddad', 'Diego Santos', 'Lena Fischer', 'Kwame Mensah', 'Priya Nair', 'Yuki Tanaka'];
const STATUSES = ['Scheduled', 'In progress', 'Done', 'Blocked', 'Cancelled'];
const REGIONS = ['North', 'South', 'East', 'West', 'Central', 'Coastal'];

export const COLUMNS: Column[] = [
  { key: 'id', title: 'Order', width: 96 },
  { key: 'customer', title: 'Customer', width: 170 },
  { key: 'status', title: 'Status', width: 110 },
  { key: 'region', title: 'Region', width: 96 },
  { key: 'tech', title: 'Technician', width: 140 },
  { key: 'date', title: 'Scheduled', width: 100 },
  { key: 'hours', title: 'Hours', width: 72, align: 'right' },
  { key: 'rate', title: 'Rate', width: 80, align: 'right' },
  { key: 'parts', title: 'Parts', width: 90, align: 'right' },
  { key: 'amount', title: 'Amount', width: 100, align: 'right' },
  { key: 'priority', title: 'Priority', width: 90 },
  { key: 'site', title: 'Site', width: 80 },
  { key: 'visits', title: 'Visits', width: 70, align: 'right' },
  { key: 'rating', title: 'Rating', width: 70, align: 'right' },
  { key: 'notes', title: 'Notes', width: 220 },
];

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRows(count: number): Row[] {
  const r = rng(20260917);
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const rows: Row[] = [];
  for (let i = 0; i < count; i++) {
    const hours = Math.round((0.5 + r() * 7.5) * 2) / 2;
    const rate = 85 + Math.floor(r() * 56);
    const parts = Math.round(r() * 640);
    const amount = hours * rate + parts;
    const day = 1 + Math.floor(r() * 30);
    rows.push({
      id: `WO-${10001 + i}`,
      amount,
      cells: [
        `WO-${10001 + i}`,
        pick(CUSTOMERS),
        pick(STATUSES),
        pick(REGIONS),
        pick(TECHS),
        `Sep ${day}`,
        hours.toFixed(1),
        `$${rate}`,
        `$${parts}`,
        `$${amount.toFixed(2)}`,
        pick(['Low', 'Normal', 'High', 'Urgent']),
        `S-${100 + Math.floor(r() * 900)}`,
        String(1 + Math.floor(r() * 12)),
        (3 + r() * 2).toFixed(1),
        pick(['Replace compressor relay', 'Annual HVAC inspection', 'Parts on backorder', 'Check breaker panel']),
      ],
    });
  }
  return rows;
}
