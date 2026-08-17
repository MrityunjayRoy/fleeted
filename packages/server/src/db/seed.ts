import type { CarCategory, Role } from '@fleeted/shared';

import type { Container } from '../config/container.js';

interface ModelSeed {
  id: string;
  name: string;
  category: CarCategory;
  basePrice: number;
  pricePerKm: number;
  capacity: number;
  description: string;
}

interface VendorSeed {
  id: string;
  name: string;
  phone: string;
  isCompany: boolean;
}

interface CarSeed {
  id: string;
  vendorId: string;
  modelId: string;
  plateNumber: string;
  isAvailable: boolean;
}

interface ChauffeurSeed {
  id: string;
  vendorId: string;
  name: string;
  phone: string;
  licenseNumber: string;
  status: 'AVAILABLE';
}

interface CustomerSeed {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface AccountSeed {
  id: string;
  role: Role;
  name: string;
  userId?: string;
  vendorId?: string;
  chauffeurId?: string;
}

const MODELS: ModelSeed[] = [
  {
    id: 'model-mercedes-sclass',
    name: 'Mercedes S-Class',
    category: 'Sedan',
    basePrice: 25000,
    pricePerKm: 45,
    capacity: 4,
    description: 'Flagship luxury sedan, perfect for wedding ceremonies',
  },
  {
    id: 'model-rolls-ghost',
    name: 'Rolls-Royce Ghost',
    category: 'Sedan',
    basePrice: 60000,
    pricePerKm: 110,
    capacity: 4,
    description: 'Ultra-luxury sedan for grand arrivals',
  },
  {
    id: 'model-range-rover',
    name: 'Range Rover Autobiography',
    category: 'SUV',
    basePrice: 35000,
    pricePerKm: 60,
    capacity: 5,
    description: 'Luxury SUV with a spacious cabin',
  },
  {
    id: 'model-lincoln-towncar',
    name: 'Lincoln Town Car',
    category: 'Limousine',
    basePrice: 30000,
    pricePerKm: 50,
    capacity: 6,
    description: 'Classic stretch limousine for bridal parties',
  },
  {
    id: 'model-vintage-rolls',
    name: 'Vintage Rolls-Royce Silver Cloud',
    category: 'Vintage',
    basePrice: 45000,
    pricePerKm: 75,
    capacity: 4,
    description: 'Timeless 1962 classic for heritage weddings',
  },
];

const VENDORS: VendorSeed[] = [
  {
    id: 'vendor-company',
    name: 'Fleeted Company Fleet',
    phone: '+91 22 4000 1000',
    isCompany: true,
  },
  {
    id: 'vendor-mumbai-luxury',
    name: 'Mumbai Luxury Chauffeurs',
    phone: '+91 22 4000 2000',
    isCompany: false,
  },
  {
    id: 'vendor-royal-rides',
    name: 'Royal Rides India',
    phone: '+91 11 4000 3000',
    isCompany: false,
  },
  {
    id: 'vendor-heritage-cars',
    name: 'Heritage Carriages',
    phone: '+91 44 4000 4000',
    isCompany: false,
  },
];

const CARS: CarSeed[] = [
  {
    id: 'car-company-1',
    vendorId: 'vendor-company',
    modelId: 'model-mercedes-sclass',
    plateNumber: 'MH 01 AB 1111',
    isAvailable: true,
  },
  {
    id: 'car-company-2',
    vendorId: 'vendor-company',
    modelId: 'model-mercedes-sclass',
    plateNumber: 'MH 01 AB 2222',
    isAvailable: true,
  },
  {
    id: 'car-company-3',
    vendorId: 'vendor-company',
    modelId: 'model-rolls-ghost',
    plateNumber: 'MH 01 AB 3333',
    isAvailable: true,
  },
  {
    id: 'car-company-4',
    vendorId: 'vendor-company',
    modelId: 'model-range-rover',
    plateNumber: 'MH 01 AB 4444',
    isAvailable: true,
  },
  {
    id: 'car-company-5',
    vendorId: 'vendor-company',
    modelId: 'model-range-rover',
    plateNumber: 'MH 01 AB 5555',
    isAvailable: true,
  },
  {
    id: 'car-company-6',
    vendorId: 'vendor-company',
    modelId: 'model-lincoln-towncar',
    plateNumber: 'MH 01 AB 6666',
    isAvailable: true,
  },
  {
    id: 'car-mumbai-1',
    vendorId: 'vendor-mumbai-luxury',
    modelId: 'model-mercedes-sclass',
    plateNumber: 'MH 02 CD 1111',
    isAvailable: true,
  },
  {
    id: 'car-mumbai-2',
    vendorId: 'vendor-mumbai-luxury',
    modelId: 'model-rolls-ghost',
    plateNumber: 'MH 02 CD 2222',
    isAvailable: true,
  },
  {
    id: 'car-mumbai-3',
    vendorId: 'vendor-mumbai-luxury',
    modelId: 'model-range-rover',
    plateNumber: 'MH 02 CD 3333',
    isAvailable: true,
  },
  {
    id: 'car-royal-1',
    vendorId: 'vendor-royal-rides',
    modelId: 'model-lincoln-towncar',
    plateNumber: 'DL 03 EF 1111',
    isAvailable: true,
  },
  {
    id: 'car-royal-2',
    vendorId: 'vendor-royal-rides',
    modelId: 'model-lincoln-towncar',
    plateNumber: 'DL 03 EF 2222',
    isAvailable: true,
  },
  {
    id: 'car-royal-3',
    vendorId: 'vendor-royal-rides',
    modelId: 'model-range-rover',
    plateNumber: 'DL 03 EF 3333',
    isAvailable: true,
  },
  {
    id: 'car-royal-4',
    vendorId: 'vendor-royal-rides',
    modelId: 'model-rolls-ghost',
    plateNumber: 'DL 03 EF 4444',
    isAvailable: true,
  },
  {
    id: 'car-heritage-1',
    vendorId: 'vendor-heritage-cars',
    modelId: 'model-vintage-rolls',
    plateNumber: 'TN 04 GH 1111',
    isAvailable: true,
  },
  {
    id: 'car-heritage-2',
    vendorId: 'vendor-heritage-cars',
    modelId: 'model-vintage-rolls',
    plateNumber: 'TN 04 GH 2222',
    isAvailable: true,
  },
  {
    id: 'car-heritage-3',
    vendorId: 'vendor-heritage-cars',
    modelId: 'model-mercedes-sclass',
    plateNumber: 'TN 04 GH 3333',
    isAvailable: true,
  },
];

const CHAUFFEURS: ChauffeurSeed[] = [
  {
    id: 'chauffeur-company-1',
    vendorId: 'vendor-company',
    name: 'Rohan Verma',
    phone: '+91 98100 10001',
    licenseNumber: 'MH-2019-1001',
    status: 'AVAILABLE',
  },
  {
    id: 'chauffeur-company-2',
    vendorId: 'vendor-company',
    name: 'Sanjay Patil',
    phone: '+91 98100 10002',
    licenseNumber: 'MH-2020-1002',
    status: 'AVAILABLE',
  },
  {
    id: 'chauffeur-company-3',
    vendorId: 'vendor-company',
    name: 'Deepak Joshi',
    phone: '+91 98100 10003',
    licenseNumber: 'MH-2021-1003',
    status: 'AVAILABLE',
  },
  {
    id: 'chauffeur-mumbai-1',
    vendorId: 'vendor-mumbai-luxury',
    name: 'Vikram Rao',
    phone: '+91 98200 20001',
    licenseNumber: 'MH-2018-2001',
    status: 'AVAILABLE',
  },
  {
    id: 'chauffeur-mumbai-2',
    vendorId: 'vendor-mumbai-luxury',
    name: 'Irfan Shaikh',
    phone: '+91 98200 20002',
    licenseNumber: 'MH-2019-2002',
    status: 'AVAILABLE',
  },
  {
    id: 'chauffeur-mumbai-3',
    vendorId: 'vendor-mumbai-luxury',
    name: 'Suresh Menon',
    phone: '+91 98200 20003',
    licenseNumber: 'MH-2022-2003',
    status: 'AVAILABLE',
  },
  {
    id: 'chauffeur-royal-1',
    vendorId: 'vendor-royal-rides',
    name: 'Arjun Khanna',
    phone: '+91 98300 30001',
    licenseNumber: 'DL-2017-3001',
    status: 'AVAILABLE',
  },
  {
    id: 'chauffeur-royal-2',
    vendorId: 'vendor-royal-rides',
    name: 'Manish Gupta',
    phone: '+91 98300 30002',
    licenseNumber: 'DL-2019-3002',
    status: 'AVAILABLE',
  },
  {
    id: 'chauffeur-royal-3',
    vendorId: 'vendor-royal-rides',
    name: 'Rahul Bansal',
    phone: '+91 98300 30003',
    licenseNumber: 'DL-2021-3003',
    status: 'AVAILABLE',
  },
  {
    id: 'chauffeur-heritage-1',
    vendorId: 'vendor-heritage-cars',
    name: 'Prakash Mishra',
    phone: '+91 98400 40001',
    licenseNumber: 'TN-2016-4001',
    status: 'AVAILABLE',
  },
  {
    id: 'chauffeur-heritage-2',
    vendorId: 'vendor-heritage-cars',
    name: 'Gopal Yadav',
    phone: '+91 98400 40002',
    licenseNumber: 'TN-2020-4002',
    status: 'AVAILABLE',
  },
];

const CUSTOMERS: CustomerSeed[] = [
  {
    id: 'user-priya-nair',
    name: 'Priya Nair',
    phone: '+91 98450 12345',
    email: 'priya.nair@example.com',
  },
  {
    id: 'user-arjun-mehta',
    name: 'Arjun Mehta',
    phone: '+91 98200 54321',
    email: 'arjun.mehta@example.com',
  },
];

const ACCOUNTS: AccountSeed[] = [
  { id: 'account-customer-priya', role: 'CUSTOMER', name: 'Priya Nair', userId: 'user-priya-nair' },
  {
    id: 'account-customer-arjun',
    role: 'CUSTOMER',
    name: 'Arjun Mehta',
    userId: 'user-arjun-mehta',
  },
  { id: 'account-ops-ananya', role: 'OPS', name: 'Ananya Desai' },
  {
    id: 'account-vendor-company',
    role: 'VENDOR',
    name: 'Fleeted Company Fleet',
    vendorId: 'vendor-company',
  },
  {
    id: 'account-vendor-mumbai',
    role: 'VENDOR',
    name: 'Mumbai Luxury Chauffeurs',
    vendorId: 'vendor-mumbai-luxury',
  },
  {
    id: 'account-vendor-royal',
    role: 'VENDOR',
    name: 'Royal Rides India',
    vendorId: 'vendor-royal-rides',
  },
  {
    id: 'account-vendor-heritage',
    role: 'VENDOR',
    name: 'Heritage Carriages',
    vendorId: 'vendor-heritage-cars',
  },
  {
    id: 'account-driver-company-1',
    role: 'DRIVER',
    name: 'Rohan Verma',
    chauffeurId: 'chauffeur-company-1',
  },
  {
    id: 'account-driver-company-2',
    role: 'DRIVER',
    name: 'Sanjay Patil',
    chauffeurId: 'chauffeur-company-2',
  },
  {
    id: 'account-driver-company-3',
    role: 'DRIVER',
    name: 'Deepak Joshi',
    chauffeurId: 'chauffeur-company-3',
  },
  {
    id: 'account-driver-mumbai-1',
    role: 'DRIVER',
    name: 'Vikram Rao',
    chauffeurId: 'chauffeur-mumbai-1',
  },
  {
    id: 'account-driver-mumbai-2',
    role: 'DRIVER',
    name: 'Irfan Shaikh',
    chauffeurId: 'chauffeur-mumbai-2',
  },
  {
    id: 'account-driver-mumbai-3',
    role: 'DRIVER',
    name: 'Suresh Menon',
    chauffeurId: 'chauffeur-mumbai-3',
  },
  {
    id: 'account-driver-royal-1',
    role: 'DRIVER',
    name: 'Arjun Khanna',
    chauffeurId: 'chauffeur-royal-1',
  },
  {
    id: 'account-driver-royal-2',
    role: 'DRIVER',
    name: 'Manish Gupta',
    chauffeurId: 'chauffeur-royal-2',
  },
  {
    id: 'account-driver-royal-3',
    role: 'DRIVER',
    name: 'Rahul Bansal',
    chauffeurId: 'chauffeur-royal-3',
  },
  {
    id: 'account-driver-heritage-1',
    role: 'DRIVER',
    name: 'Prakash Mishra',
    chauffeurId: 'chauffeur-heritage-1',
  },
  {
    id: 'account-driver-heritage-2',
    role: 'DRIVER',
    name: 'Gopal Yadav',
    chauffeurId: 'chauffeur-heritage-2',
  },
];

async function upsertModel(container: Container, seed: ModelSeed): Promise<void> {
  const existing = await container.repos.carModels.findById(seed.id);
  if (!existing) await container.repos.carModels.create(seed);
}

async function upsertVendor(container: Container, seed: VendorSeed): Promise<void> {
  const existing = await container.repos.vendors.findById(seed.id);
  if (!existing) await container.repos.vendors.create(seed);
}

async function upsertCar(container: Container, seed: CarSeed): Promise<void> {
  const existing = await container.repos.vendorCars.findById(seed.id);
  if (!existing) await container.repos.vendorCars.create(seed);
}

async function upsertChauffeur(container: Container, seed: ChauffeurSeed): Promise<void> {
  const existing = await container.repos.chauffeurs.findById(seed.id);
  if (!existing) await container.repos.chauffeurs.create(seed);
}

async function upsertCustomer(container: Container, seed: CustomerSeed): Promise<void> {
  const existing = await container.repos.users.findById(seed.id);
  if (!existing) await container.repos.users.create(seed);
}

async function upsertAccount(container: Container, seed: AccountSeed): Promise<void> {
  const existing = await container.repos.accounts.findById(seed.id);
  if (!existing) await container.repos.accounts.create(seed);
}

export async function seed(container: Container): Promise<void> {
  for (const item of MODELS) await upsertModel(container, item);
  for (const item of VENDORS) await upsertVendor(container, item);
  for (const item of CARS) await upsertCar(container, item);
  for (const item of CHAUFFEURS) await upsertChauffeur(container, item);
  for (const item of CUSTOMERS) await upsertCustomer(container, item);
  for (const item of ACCOUNTS) await upsertAccount(container, item);
}
