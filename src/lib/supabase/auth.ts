import { supabase, supabaseAdmin } from './client';
import { User } from '@supabase/supabase-js';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
}

// Admin functions
export async function deleteUser(userId: string) {
  if (!supabaseAdmin) throw new Error('Admin client not initialized');
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw error;
}

export async function getUserById(userId: string) {
  if (!supabaseAdmin) throw new Error('Admin client not initialized');
  const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error) throw error;
  return user;
}

// Auth state change listener
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}