export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export type NewUser = Omit<User, 'id'>;
