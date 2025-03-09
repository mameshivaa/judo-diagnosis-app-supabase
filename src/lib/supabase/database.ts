import { supabase } from './client';
import { PostgrestError } from '@supabase/supabase-js';

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;
export type DbResultError = PostgrestError;

export async function createRecord<T>(
  table: string,
  data: Partial<T>,
  options?: { returning?: 'minimal' | 'representation' }
) {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select(options?.returning === 'minimal' ? 'id' : '*')
    .single();

  if (error) throw error;
  return result as T;
}

export async function getRecord<T>(
  table: string,
  id: string | number,
  options?: { columns?: string }
) {
  const { data, error } = await supabase
    .from(table)
    .select(options?.columns || '*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as T;
}

export async function updateRecord<T>(
  table: string,
  id: string | number,
  data: Partial<T>,
  options?: { returning?: 'minimal' | 'representation' }
) {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select(options?.returning === 'minimal' ? 'id' : '*')
    .single();

  if (error) throw error;
  return result as T;
}

export async function deleteRecord(
  table: string,
  id: string | number
) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function listRecords<T>(
  table: string,
  options?: {
    columns?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  }
) {
  let query = supabase
    .from(table)
    .select(options?.columns || '*');

  // Apply filters
  if (options?.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([operator, operand]) => {
          switch (operator) {
            case 'gt':
              query = query.gt(key, operand);
              break;
            case 'gte':
              query = query.gte(key, operand);
              break;
            case 'lt':
              query = query.lt(key, operand);
              break;
            case 'lte':
              query = query.lte(key, operand);
              break;
            case 'like':
              query = query.like(key, `%${operand}%`);
              break;
            case 'ilike':
              query = query.ilike(key, `%${operand}%`);
              break;
            default:
              query = query.eq(key, operand);
          }
        });
      } else {
        query = query.eq(key, value);
      }
    });
  }

  // Apply ordering
  if (options?.orderBy) {
    query = query.order(
      options.orderBy.column,
      { ascending: options.orderBy.ascending ?? true }
    );
  }

  // Apply pagination
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 10) - 1
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as T[];
}

export async function countRecords(
  table: string,
  filters?: Record<string, any>
) {
  let query = supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  // Apply filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([operator, operand]) => {
          switch (operator) {
            case 'gt':
              query = query.gt(key, operand);
              break;
            case 'gte':
              query = query.gte(key, operand);
              break;
            case 'lt':
              query = query.lt(key, operand);
              break;
            case 'lte':
              query = query.lte(key, operand);
              break;
            case 'like':
              query = query.like(key, `%${operand}%`);
              break;
            case 'ilike':
              query = query.ilike(key, `%${operand}%`);
              break;
            default:
              query = query.eq(key, operand);
          }
        });
      } else {
        query = query.eq(key, value);
      }
    });
  }

  const { count, error } = await query;

  if (error) throw error;
  return count;
}