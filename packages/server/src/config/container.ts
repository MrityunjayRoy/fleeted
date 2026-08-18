import { fileURLToPath } from 'node:url';

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { createDbClient, type Db } from '../db/client.js';
import { DrizzleAccountRepository } from '../db/repositories/account.repository.js';
import { DrizzleCarModelRepository } from '../db/repositories/car-model.repository.js';
import { DrizzleChauffeurRepository } from '../db/repositories/chauffeur.repository.js';
import { DrizzleNotificationRepository } from '../db/repositories/notification.repository.js';
import { DrizzleRideOfferRepository } from '../db/repositories/ride-offer.repository.js';
import { DrizzleRideRepository } from '../db/repositories/ride.repository.js';
import { DrizzleUserRepository } from '../db/repositories/user.repository.js';
import { DrizzleVendorCarRepository } from '../db/repositories/vendor-car.repository.js';
import { DrizzleVendorRepository } from '../db/repositories/vendor.repository.js';
import type { IAccountRepository } from '../db/interfaces/account.repository.js';
import type { ICarModelRepository } from '../db/interfaces/car-model.repository.js';
import type { IChauffeurRepository } from '../db/interfaces/chauffeur.repository.js';
import type { INotificationRepository } from '../db/interfaces/notification.repository.js';
import type { IRideOfferRepository } from '../db/interfaces/ride-offer.repository.js';
import type { IRideRepository } from '../db/interfaces/ride.repository.js';
import type { IUserRepository } from '../db/interfaces/user.repository.js';
import type { IVendorCarRepository } from '../db/interfaces/vendor-car.repository.js';
import type { IVendorRepository } from '../db/interfaces/vendor.repository.js';
import { DefaultAuthService, type AuthService } from '../services/auth.service.js';
import { DefaultMatchingService, type MatchingService } from '../services/matching.service.js';
import { DefaultRideService, type RideService } from '../services/ride.service.js';
import { DefaultOfferService, type OfferService } from '../services/offer.service.js';
import { DefaultOpsService, type OpsService } from '../services/ops.service.js';
import { DefaultDriverService, type DriverService } from '../services/driver.service.js';
import {
  DefaultNotificationService,
  type NotificationService,
} from '../services/notification.service.js';
import { DefaultEventBus, DOMAIN_EVENT_TYPES } from '../domain/events.js';
import * as schema from '../db/schema/index.js';

export interface Repositories {
  users: IUserRepository;
  accounts: IAccountRepository;
  vendors: IVendorRepository;
  carModels: ICarModelRepository;
  vendorCars: IVendorCarRepository;
  chauffeurs: IChauffeurRepository;
  rides: IRideRepository;
  rideOffers: IRideOfferRepository;
  notifications: INotificationRepository;
}

export type TransactionRunner = <T>(fn: (tx: Repositories) => Promise<T>) => Promise<T>;

export interface Services {
  auth: AuthService;
  matching: MatchingService;
  rides: RideService;
  offers: OfferService;
  ops: OpsService;
  drivers: DriverService;
  notifications: NotificationService;
}

export interface Container {
  db: Db;
  config: {
    jwtSecret: string;
    jwtExpiresIn: string;
  };
  repos: Repositories;
  services: Services;
  withTransaction: TransactionRunner;
}

export interface ContainerOptions {
  runMigrations?: boolean;
  jwtSecret?: string;
  jwtExpiresIn?: string;
}

const DEFAULT_JWT_SECRET = 'fleeted-dev-secret-change-me-123456';
const DEFAULT_JWT_EXPIRES_IN = '24h';

export function createContainer(dbPath: string, options: ContainerOptions = {}): Container {
  const db = createDbClient(dbPath);

  if (options.runMigrations) {
    migrate(db, {
      migrationsFolder: fileURLToPath(new URL('../db/migrations', import.meta.url)),
    });
  }

  const queue = createQueue();
  const repos = serialize(makeRepos(db), queue);

  const config = {
    jwtSecret: options.jwtSecret ?? DEFAULT_JWT_SECRET,
    jwtExpiresIn: options.jwtExpiresIn ?? DEFAULT_JWT_EXPIRES_IN,
  };

  const withTransaction: TransactionRunner = (fn) =>
    queue.run(async () => {
      const sqlite = db.$client as Database.Database;
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        const txDb = drizzle(sqlite, { schema });
        const result = await fn(makeRepos(txDb));
        sqlite.exec('COMMIT');
        return result;
      } catch (err) {
        sqlite.exec('ROLLBACK');
        throw err;
      }
    });

  const eventBus = new DefaultEventBus();
  const notifications = new DefaultNotificationService(
    repos.notifications,
    repos.carModels,
    repos.vendors,
    repos.chauffeurs,
    repos.users,
    repos.rides,
    repos.rideOffers,
  );
  for (const type of DOMAIN_EVENT_TYPES) {
    eventBus.on(type, (event) => {
      void notifications.persist(event).catch((err) => {
        console.error('[notifications] persist failed:', err);
      });
    });
  }

  const matching = new DefaultMatchingService(
    repos.vendorCars,
    repos.chauffeurs,
    repos.rideOffers,
    repos.rides,
    eventBus,
  );

  const services: Services = {
    auth: new DefaultAuthService(repos.accounts, config.jwtSecret, config.jwtExpiresIn),
    matching,
    rides: new DefaultRideService(
      repos.rides,
      repos.rideOffers,
      repos.vendorCars,
      repos.chauffeurs,
      repos.carModels,
      matching,
      eventBus,
      withTransaction,
    ),
    offers: new DefaultOfferService(
      repos.rideOffers,
      repos.vendorCars,
      repos.chauffeurs,
      eventBus,
      withTransaction,
    ),
    ops: new DefaultOpsService(
      repos.rides,
      repos.rideOffers,
      repos.vendorCars,
      repos.chauffeurs,
      eventBus,
      withTransaction,
    ),
    drivers: new DefaultDriverService(
      repos.rides,
      repos.rideOffers,
      repos.vendorCars,
      repos.chauffeurs,
      eventBus,
    ),
    notifications,
  };

  return {
    db,
    config,
    repos,
    services,
    withTransaction,
  };
}

function makeRepos(db: Db): Repositories {
  return {
    users: new DrizzleUserRepository(db),
    accounts: new DrizzleAccountRepository(db),
    vendors: new DrizzleVendorRepository(db),
    carModels: new DrizzleCarModelRepository(db),
    vendorCars: new DrizzleVendorCarRepository(db),
    chauffeurs: new DrizzleChauffeurRepository(db),
    rides: new DrizzleRideRepository(db),
    rideOffers: new DrizzleRideOfferRepository(db),
    notifications: new DrizzleNotificationRepository(db),
  };
}

interface Queue {
  run<T>(task: () => Promise<T>): Promise<T>;
}

function createQueue(): Queue {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    run<T>(task: () => Promise<T>): Promise<T> {
      const result = tail.then(task, task);
      tail = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
  };
}

function serialize(repos: Repositories, queue: Queue): Repositories {
  const wrapped = {} as Repositories;
  for (const [name, repo] of Object.entries(repos)) {
    const instance = repo as object;
    wrapped[name as keyof Repositories] = new Proxy(instance, {
      get(obj, prop, receiver) {
        const value = Reflect.get(obj, prop, receiver);
        if (typeof value !== 'function') return value;
        return (...args: unknown[]) => queue.run(() => value.apply(obj, args));
      },
    }) as never;
  }
  return wrapped;
}
