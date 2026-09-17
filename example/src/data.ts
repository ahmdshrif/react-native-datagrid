export type WorkOrderStatus =
  'Scheduled' | 'In progress' | 'Done' | 'Blocked' | 'Cancelled';

export type WorkOrder = {
  id: string;
  customer: string;
  status: WorkOrderStatus;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  region: string;
  technician: string;
  scheduled: Date;
  hours: number;
  rate: number;
  parts: number;
  amount: number;
  site: string;
  visits: number;
  rating: number | null;
  notes: string;
};

const CUSTOMERS = [
  'Harbor Dental',
  'Northwind Cold Storage',
  'Kestrel Apartments',
  'Bluegate Clinic',
  'Maple & Stone Cafe',
  'Orbit Fitness',
  'Cedar Ridge School',
  'Atlas Freight',
  'Lumen Bakery',
  'Riverside Hotel',
  'Pinecrest Pharmacy',
  'Juniper Labs',
];
const TECHNICIANS = [
  'Amira Haddad',
  'Diego Santos',
  'Lena Fischer',
  'Kwame Mensah',
  'Priya Nair',
  'Yuki Tanaka',
];
export const STATUSES: WorkOrderStatus[] = [
  'Scheduled',
  'In progress',
  'Done',
  'Blocked',
  'Cancelled',
];
const PRIORITIES: WorkOrder['priority'][] = ['Low', 'Normal', 'High', 'Urgent'];
const REGIONS = ['North', 'South', 'East', 'West', 'Central', 'Coastal'];
const NOTES = [
  'Replace compressor relay',
  'Annual HVAC inspection',
  'Parts on backorder',
  'Check breaker panel',
  'Customer asked for a morning slot',
];

/* eslint-disable no-bitwise -- small seeded PRNG (mulberry32) */
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
/* eslint-enable no-bitwise */

/** Deterministic sample data, so every run shows the same rows. */
export function makeWorkOrders(count: number): WorkOrder[] {
  const r = rng(20260917);
  const pick = <V>(list: readonly V[]): V =>
    list[Math.floor(r() * list.length)] as V;
  const base = Date.UTC(2026, 8, 1);
  const orders: WorkOrder[] = [];
  for (let i = 0; i < count; i++) {
    const hours = Math.round((0.5 + r() * 7.5) * 2) / 2;
    const rate = 85 + Math.floor(r() * 56);
    const parts = Math.round(r() * 640);
    orders.push({
      id: `WO-${10001 + i}`,
      customer: pick(CUSTOMERS),
      status: pick(STATUSES),
      priority: PRIORITIES[Math.min(3, Math.floor(r() * r() * 5.2))]!,
      region: pick(REGIONS),
      technician: pick(TECHNICIANS),
      scheduled: new Date(base + Math.floor(r() * 61) * 86400000),
      hours,
      rate,
      parts,
      amount: hours * rate + parts,
      site: `S-${100 + Math.floor(r() * 900)}`,
      visits: 1 + Math.floor(r() * 12),
      rating: r() < 0.15 ? null : Math.round((3 + r() * 2) * 10) / 10,
      notes: pick(NOTES),
    });
  }
  return orders;
}
