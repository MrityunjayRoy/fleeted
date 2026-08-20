import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createContainer } from '../src/config/container.js';
import { seed } from '../src/db/seed.js';

const dir = mkdtempSync(join(tmpdir(), 'fleeted-persist-'));
const dbPath = join(dir, 'persist.db');
const opts = { runMigrations: true, jwtSecret: 'check-secret-16-chars' };

const first = createContainer(dbPath, opts);
await seed(first);
const { ride } = await first.services.rides.create(
  {
    modelId: 'model-rolls-ghost',
    pickup: 'The Oberoi, New Delhi',
    dropoff: 'Leela Palace, New Delhi',
    pickupTime: new Date(Date.now() + 3_600_000).toISOString(),
    distanceKm: 12,
  },
  'user-priya-nair',
);
const offers = await first.repos.rideOffers.listByRideId(ride.id);
const royal = offers.find((o) => o.vendorId === 'vendor-royal-rides');
if (!royal) throw new Error('no royal offer');
await first.services.offers.accept(royal.id, 'vendor-royal-rides', {
  vendorCarId: 'car-royal-1',
  chauffeurId: 'chauffeur-royal-1',
});
await first.services.ops.approveOffer(royal.id);
await new Promise((resolve) => setTimeout(resolve, 20));
first.db.$client.close();

const second = createContainer(dbPath, opts);
await seed(second);
const opsNotifs = await second.services.notifications.listFor({ role: 'OPS', recipientId: null });
const driverNotifs = await second.services.notifications.listFor({
  role: 'DRIVER',
  chauffeurId: 'chauffeur-royal-1',
});
const customerNotifs = await second.services.notifications.listFor({
  role: 'CUSTOMER',
  customerId: 'user-priya-nair',
});
const vendorNotifs = await second.services.notifications.listFor({
  role: 'VENDOR',
  vendorId: 'vendor-royal-rides',
});
second.db.$client.close();
rmSync(dir, { recursive: true, force: true });

const ok =
  opsNotifs.some((n) => n.type === 'offer:accepted') &&
  driverNotifs.some((n) => n.type === 'ride:confirmed') &&
  customerNotifs.some((n) => n.type === 'ride:confirmed') &&
  vendorNotifs.some((n) => n.type === 'ride:new');

console.log(`ops offer:accepted: ${opsNotifs.some((n) => n.type === 'offer:accepted')}`);
console.log(`driver ride:confirmed: ${driverNotifs.some((n) => n.type === 'ride:confirmed')}`);
console.log(`customer ride:confirmed: ${customerNotifs.some((n) => n.type === 'ride:confirmed')}`);
console.log(`vendor ride:new: ${vendorNotifs.some((n) => n.type === 'ride:new')}`);
if (!ok) process.exit(1);
console.log('PERSISTENCE PARITY OK');
