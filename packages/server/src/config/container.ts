import { fileURLToPath } from 'node:url';

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { createDbClient, type Db } from '../db/client.js';
import { DrizzleCarModelRepository } from '../db/repositories/car-model.repository.js';
import { DrizzleChauffeurRepository } from '../db/repositories/chauffeur.repository.js';
import { DrizzleNotificationRepository } from '../db/repositories/notification.repository.js';
import { DrizzleRideOfferRepository } from '../db/repositories/ride-offer.repository.js';
import { DrizzleRideRepository } from '../db/repositories/ride.repository.js';
import { DrizzleUserRepository } from '../db/repositories/user.repository.js';
import { DrizzleVendorCarRepository } from '../db/repositories/vendor-car.repository.js';
import { DrizzleVendorRepository } from '../db/repositories/vendor.repository.js';
import type { ICarModelRepository } from '../db/interfaces/car-model.repository.js';
import type { IChauffeurRepository } from '../db/interfaces/chauffeur.repository.js';
import type { INotificationRepository } from '../db/interfaces/notification.repository.js';
import type { IRideOfferRepository } from '../db/interfaces/ride-offer.repository.js';
import type { IRideRepository } from '../db/interfaces/ride.repository.js';
import type { IUserRepository } from '../db/interfaces/user.repository.js';
import type { IVendorCarRepository } from '../db/interfaces/vendor-car.repository.js';
import type { IVendorRepository } from '../db/interfaces/vendor.repository.js';

export interface Repositories {
  users: IUserRepository;
  vendors: IVendorRepository;
  carModels: ICarModelRepository;
  vendorCars: IVendorCarRepository;
  chauffeurs: IChauffeurRepository;
  rides: IRideRepository;
  rideOffers: IRideOfferRepository;
  notifications: INotificationRepository;
}

export interface Container {
  db: Db;
  repos: Repositories;
}

export interface ContainerOptions {
  runMigrations?: boolean;
}

export function createContainer(dbPath: string, options: ContainerOptions = {}): Container {
  const db = createDbClient(dbPath);

  if (options.runMigrations) {
    migrate(db, {
      migrationsFolder: fileURLToPath(new URL('../db/migrations', import.meta.url)),
    });
  }

  return {
    db,
    repos: {
      users: new DrizzleUserRepository(db),
      vendors: new DrizzleVendorRepository(db),
      carModels: new DrizzleCarModelRepository(db),
      vendorCars: new DrizzleVendorCarRepository(db),
      chauffeurs: new DrizzleChauffeurRepository(db),
      rides: new DrizzleRideRepository(db),
      rideOffers: new DrizzleRideOfferRepository(db),
      notifications: new DrizzleNotificationRepository(db),
    },
  };
}
