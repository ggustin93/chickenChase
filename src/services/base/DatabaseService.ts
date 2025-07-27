/**
 * Base Database Service
 * Provides common CRUD operations and error handling for all tables
 */

import { supabase } from '../../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import type { 
  DatabaseTable, 
  DbRecord, 
  DbInsert, 
  DbUpdate, 
  ApiResponse, 
  PaginatedResponse 
} from '../../data/database-types';

export interface QueryOptions {
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

export interface FilterOptions {
  eq?: Record<string, unknown>;
  neq?: Record<string, unknown>;
  gt?: Record<string, unknown>;
  gte?: Record<string, unknown>;
  lt?: Record<string, unknown>;
  lte?: Record<string, unknown>;
  like?: Record<string, string>;
  ilike?: Record<string, string>;
  in?: Record<string, unknown[]>;
  is?: Record<string, unknown>;
  contains?: Record<string, unknown[]>;
  containedBy?: Record<string, unknown[]>;
}

export abstract class DatabaseService<
  TTable extends DatabaseTable,
  TRecord = DbRecord<TTable>,
  TInsert = DbInsert<TTable>,
  TUpdate = DbUpdate<TTable>
> {
  protected abstract tableName: TTable;

  /**
   * Apply filters to a query builder
   */
  protected applyFilters(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: any, // Supabase query builder
    filters: FilterOptions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    let filteredQuery = query;

    // Equality filters
    if (filters.eq) {
      Object.entries(filters.eq).forEach(([column, value]) => {
        filteredQuery = filteredQuery.eq(column, value);
      });
    }

    // Not equal filters
    if (filters.neq) {
      Object.entries(filters.neq).forEach(([column, value]) => {
        filteredQuery = filteredQuery.neq(column, value);
      });
    }

    // Greater than filters
    if (filters.gt) {
      Object.entries(filters.gt).forEach(([column, value]) => {
        filteredQuery = filteredQuery.gt(column, value);
      });
    }

    // Greater than or equal filters
    if (filters.gte) {
      Object.entries(filters.gte).forEach(([column, value]) => {
        filteredQuery = filteredQuery.gte(column, value);
      });
    }

    // Less than filters
    if (filters.lt) {
      Object.entries(filters.lt).forEach(([column, value]) => {
        filteredQuery = filteredQuery.lt(column, value);
      });
    }

    // Less than or equal filters
    if (filters.lte) {
      Object.entries(filters.lte).forEach(([column, value]) => {
        filteredQuery = filteredQuery.lte(column, value);
      });
    }

    // Like filters (case sensitive)
    if (filters.like) {
      Object.entries(filters.like).forEach(([column, value]) => {
        filteredQuery = filteredQuery.like(column, value);
      });
    }

    // iLike filters (case insensitive)
    if (filters.ilike) {
      Object.entries(filters.ilike).forEach(([column, value]) => {
        filteredQuery = filteredQuery.ilike(column, value);
      });
    }

    // In filters
    if (filters.in) {
      Object.entries(filters.in).forEach(([column, values]) => {
        filteredQuery = filteredQuery.in(column, values);
      });
    }

    // Is filters (for null checks)
    if (filters.is) {
      Object.entries(filters.is).forEach(([column, value]) => {
        filteredQuery = filteredQuery.is(column, value);
      });
    }

    // Contains filters (for arrays/jsonb)
    if (filters.contains) {
      Object.entries(filters.contains).forEach(([column, values]) => {
        filteredQuery = filteredQuery.contains(column, values);
      });
    }

    // Contained by filters (for arrays/jsonb)
    if (filters.containedBy) {
      Object.entries(filters.containedBy).forEach(([column, values]) => {
        filteredQuery = filteredQuery.containedBy(column, values);
      });
    }

    return filteredQuery;
  }

  /**
   * Apply query options (select, order, limit, offset)
   */
  protected applyQueryOptions(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: any, // Supabase query builder
    options: QueryOptions = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    let modifiedQuery = query;

    // Apply ordering
    if (options.orderBy) {
      modifiedQuery = modifiedQuery.order(
        options.orderBy.column, 
        { ascending: options.orderBy.ascending ?? true }
      );
    }

    // Apply limit
    if (options.limit) {
      modifiedQuery = modifiedQuery.limit(options.limit);
    }

    // Apply offset
    if (options.offset) {
      modifiedQuery = modifiedQuery.range(
        options.offset, 
        options.offset + (options.limit || 1000) - 1
      );
    }

    return modifiedQuery;
  }

  /**
   * Format error for consistent error handling
   */
  protected formatError(error: PostgrestError | Error | null, operation: string): string {
    if (!error) return `Unknown error during ${operation}`;
    
    if ('code' in error && 'message' in error) {
      // PostgrestError
      return `Database error during ${operation}: ${error.message} (${error.code})`;
    }
    
    // Generic Error
    return `Error during ${operation}: ${error.message}`;
  }

  /**
   * Create a success response
   */
  protected success<T>(data: T): ApiResponse<T> {
    return {
      data,
      error: null,
      success: true
    };
  }

  /**
   * Create an error response
   */
  protected failure<T = null>(error: string): ApiResponse<T> {
    return {
      data: null,
      error,
      success: false
    };
  }

  // ===== CRUD OPERATIONS =====

  /**
   * Get a single record by ID
   */
  async findById(
    id: string, 
    options: QueryOptions = {}
  ): Promise<ApiResponse<TRecord>> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(options.select || '*')
        .eq('id', id);

      query = this.applyQueryOptions(query, options);

      const { data, error } = await query.single();

      if (error) {
        return this.failure(this.formatError(error, 'findById'));
      }

      return this.success(data as TRecord);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'findById'));
    }
  }

  /**
   * Get multiple records with optional filters
   */
  async findMany(
    filters: FilterOptions = {},
    options: QueryOptions = {}
  ): Promise<ApiResponse<TRecord[]>> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(options.select || '*');

      query = this.applyFilters(query, filters);
      query = this.applyQueryOptions(query, options);

      const { data, error } = await query;

      if (error) {
        return this.failure(this.formatError(error, 'findMany'));
      }

      return this.success(data as TRecord[]);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'findMany'));
    }
  }

  /**
   * Get paginated records
   */
  async findPaginated(
    page: number = 1,
    limit: number = 20,
    filters: FilterOptions = {},
    options: Omit<QueryOptions, 'limit' | 'offset'> = {}
  ): Promise<ApiResponse<PaginatedResponse<TRecord>>> {
    try {
      const offset = (page - 1) * limit;

      // Get total count
      let countQuery = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      countQuery = this.applyFilters(countQuery, filters);

      const { count, error: countError } = await countQuery;

      if (countError) {
        return this.failure(this.formatError(countError, 'findPaginated (count)'));
      }

      // Get data
      let dataQuery = supabase
        .from(this.tableName)
        .select(options.select || '*');

      dataQuery = this.applyFilters(dataQuery, filters);
      dataQuery = this.applyQueryOptions(dataQuery, { 
        ...options, 
        limit, 
        offset 
      });

      const { data, error: dataError } = await dataQuery;

      if (dataError) {
        return this.failure(this.formatError(dataError, 'findPaginated (data)'));
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return this.success({
        data: data as TRecord[],
        count: count || 0,
        page,
        limit,
        totalPages
      });
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'findPaginated'));
    }
  }

  /**
   * Create a new record
   */
  async create(data: TInsert): Promise<ApiResponse<TRecord>> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) {
        return this.failure(this.formatError(error, 'create'));
      }

      return this.success(result as TRecord);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'create'));
    }
  }

  /**
   * Create multiple records
   */
  async createMany(data: TInsert[]): Promise<ApiResponse<TRecord[]>> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select();

      if (error) {
        return this.failure(this.formatError(error, 'createMany'));
      }

      return this.success(result as TRecord[]);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'createMany'));
    }
  }

  /**
   * Update a record by ID
   */
  async updateById(
    id: string, 
    data: TUpdate
  ): Promise<ApiResponse<TRecord>> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return this.failure(this.formatError(error, 'updateById'));
      }

      return this.success(result as TRecord);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'updateById'));
    }
  }

  /**
   * Update multiple records with filters
   */
  async updateMany(
    filters: FilterOptions,
    data: TUpdate
  ): Promise<ApiResponse<TRecord[]>> {
    try {
      let query = supabase
        .from(this.tableName)
        .update(data);

      query = this.applyFilters(query, filters);

      const { data: result, error } = await query.select();

      if (error) {
        return this.failure(this.formatError(error, 'updateMany'));
      }

      return this.success(result as TRecord[]);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'updateMany'));
    }
  }

  /**
   * Delete a record by ID
   */
  async deleteById(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        return this.failure(this.formatError(error, 'deleteById'));
      }

      return this.success(true);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'deleteById'));
    }
  }

  /**
   * Delete multiple records with filters
   */
  async deleteMany(filters: FilterOptions): Promise<ApiResponse<boolean>> {
    try {
      let query = supabase
        .from(this.tableName)
        .delete();

      query = this.applyFilters(query, filters);

      const { error } = await query;

      if (error) {
        return this.failure(this.formatError(error, 'deleteMany'));
      }

      return this.success(true);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'deleteMany'));
    }
  }

  /**
   * Check if a record exists
   */
  async exists(filters: FilterOptions): Promise<ApiResponse<boolean>> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('id', { count: 'exact', head: true });

      query = this.applyFilters(query, filters);

      const { count, error } = await query;

      if (error) {
        return this.failure(this.formatError(error, 'exists'));
      }

      return this.success((count || 0) > 0);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'exists'));
    }
  }

  /**
   * Count records with optional filters
   */
  async count(filters: FilterOptions = {}): Promise<ApiResponse<number>> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      query = this.applyFilters(query, filters);

      const { count, error } = await query;

      if (error) {
        return this.failure(this.formatError(error, 'count'));
      }

      return this.success(count || 0);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'count'));
    }
  }

  /**
   * Upsert (insert or update) a record
   */
  async upsert(
    data: TInsert, 
    onConflict?: string
  ): Promise<ApiResponse<TRecord>> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .upsert(data, { onConflict })
        .select()
        .single();

      if (error) {
        return this.failure(this.formatError(error, 'upsert'));
      }

      return this.success(result as TRecord);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'upsert'));
    }
  }
}