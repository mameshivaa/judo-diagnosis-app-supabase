import { supabase } from './client';

export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob,
  options?: { contentType?: string; cacheControl?: string }
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: options?.cacheControl || '3600',
      contentType: options?.contentType,
      upsert: true,
    });
  if (error) throw error;
  return data;
}

export async function downloadFile(bucket: string, path: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path);
  if (error) throw error;
  return data;
}

export async function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  return data.publicUrl;
}

export async function listFiles(bucket: string, path?: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path || '');
  if (error) throw error;
  return data;
}

export async function deleteFile(bucket: string, paths: string | string[]) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove(Array.isArray(paths) ? paths : [paths]);
  if (error) throw error;
  return data;
}

export async function createSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 60
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data;
}

export async function updateFile(
  bucket: string,
  path: string,
  file: File | Blob,
  options?: { contentType?: string; cacheControl?: string }
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .update(path, file, {
      cacheControl: options?.cacheControl || '3600',
      contentType: options?.contentType,
      upsert: true,
    });
  if (error) throw error;
  return data;
}

export async function moveFile(
  bucket: string,
  fromPath: string,
  toPath: string
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .move(fromPath, toPath);
  if (error) throw error;
  return data;
}

export async function copyFile(
  bucket: string,
  fromPath: string,
  toPath: string
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .copy(fromPath, toPath);
  if (error) throw error;
  return data;
}