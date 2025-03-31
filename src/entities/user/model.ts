import { createEvent, createStore } from 'effector';

export interface User {
  id: string;
  email: string;
}

export const setUser = createEvent<User | null>();
export const $currentUser = createStore<User | null>(null)
  .on(setUser, (_, user) => user); 