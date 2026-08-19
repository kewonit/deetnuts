import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type Primitive = string | number | boolean | null;

type SupabaseLikeError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

type SupabaseQueryResult = {
  data: unknown[] | null;
  error: SupabaseLikeError | null;
  count: number | null;
};

type FilterableQuery = {
  eq(column: string, value: unknown): FilterableQuery;
  neq(column: string, value: unknown): FilterableQuery;
  gte(column: string, value: unknown): FilterableQuery;
  lte(column: string, value: unknown): FilterableQuery;
  gt(column: string, value: unknown): FilterableQuery;
  lt(column: string, value: unknown): FilterableQuery;
  ilike(column: string, pattern: string): FilterableQuery;
  or(filters: string): FilterableQuery;
  order(column: string, options?: { ascending?: boolean }): FilterableQuery;
  range(from: number, to: number): FilterableQuery;
  limit(limit: number): FilterableQuery;
  then<TResult1 = SupabaseQueryResult, TResult2 = never>(
    onfulfilled?:
      | ((
          value: SupabaseQueryResult,
        ) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null,
  ): PromiseLike<TResult1 | TResult2>;
};

function isMissingRelationError(error: SupabaseLikeError | null): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.message.toLowerCase().includes("does not exist") ||
    error.message.toLowerCase().includes("relation")
  );
}

export function isRequestedRangeNotSatisfiableError(
  error: SupabaseLikeError | null,
): boolean {
  if (!error) return false;
  return (
    error.code === "PGRST103" ||
    error.message.toLowerCase().includes("range not satisfiable")
  );
}

export function createEmptyListResult<T>(
  page: number,
  perPage: number,
  totalItems: number,
): ListResult<T> {
  return {
    items: [],
    page,
    perPage,
    totalItems,
    totalPages: perPage > 0 ? Math.ceil(totalItems / perPage) : 0,
  };
}

export class ClientResponseError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status = 500, data: unknown = null) {
    super(message);
    this.name = "ClientResponseError";
    this.status = status;
    this.data = data;
  }
}

interface ListOptions {
  filter?: string;
  sort?: string;
  fields?: string;
  skipTotal?: boolean;
}

interface FullListOptions {
  filter?: string;
  sort?: string;
  fields?: string;
}

type ListResult<T> = {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

export interface PocketBaseCollection {
  getList<T = unknown>(
    page: number,
    perPage: number,
    options?: ListOptions,
  ): Promise<ListResult<T>>;
  getFullList<T = unknown>(options?: FullListOptions): Promise<T[]>;
  getFirstListItem<T = unknown>(filter: string): Promise<T>;
  getOne<T = unknown>(id: string): Promise<T>;
  create<T = unknown>(payload: Record<string, unknown>): Promise<T>;
  update<T = unknown>(id: string, payload: Record<string, unknown>): Promise<T>;
  delete(id: string): Promise<{ id: string }>;
  authRefresh(): Promise<{ token: string | null; record: null }>;
  authWithPassword(
    email: string,
    password: string,
  ): Promise<{ token: string; record: null }>;
}

export interface PocketBaseLike {
  autoCancellation(disabled: boolean): void;
  collection(name: string): PocketBaseCollection;
}

let pbClient: PocketBaseLike | null = null;

/**
 * Get PocketBase instance (singleton pattern)
 * This function is safe for both client and server components
 */
export function getPocketBase(): PocketBaseLike {
  if (!pbClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined",
      );
    }

    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const parseFilterExpression = (
      filter?: string,
    ): Array<{
      or: Array<{ field: string; operator: string; value: Primitive }>;
    }> => {
      if (!filter || !filter.trim()) return [];

      const trimOuterParens = (value: string): string => {
        let result = value.trim();
        while (result.startsWith("(") && result.endsWith(")")) {
          let depth = 0;
          let valid = true;
          for (let index = 0; index < result.length; index += 1) {
            const char = result[index];
            if (char === "(") depth += 1;
            if (char === ")") depth -= 1;
            if (depth === 0 && index < result.length - 1) {
              valid = false;
              break;
            }
          }
          if (!valid) break;
          result = result.slice(1, -1).trim();
        }
        return result;
      };

      const splitTopLevel = (
        input: string,
        separator: "&&" | "||",
      ): string[] => {
        const values: string[] = [];
        let current = "";
        let depth = 0;
        let quote: '"' | "'" | null = null;

        for (let index = 0; index < input.length; index += 1) {
          const char = input[index];
          const next = input[index + 1];

          if ((char === '"' || char === "'") && input[index - 1] !== "\\") {
            if (quote === char) {
              quote = null;
            } else if (!quote) {
              quote = char;
            }
          }

          if (!quote) {
            if (char === "(") depth += 1;
            if (char === ")") depth = Math.max(0, depth - 1);

            if (depth === 0 && char === separator[0] && next === separator[1]) {
              values.push(current.trim());
              current = "";
              index += 1;
              continue;
            }
          }

          current += char;
        }

        if (current.trim()) values.push(current.trim());
        return values;
      };

      const parseValue = (rawValue: string): Primitive => {
        const value = rawValue.trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          return value
            .slice(1, -1)
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .replace(/\\\\/g, "\\");
        }

        if (value === "true") return true;
        if (value === "false") return false;
        if (value === "null") return null;

        const parsedNumber = Number(value);
        if (!Number.isNaN(parsedNumber)) return parsedNumber;

        return value;
      };

      const parseTerm = (term: string) => {
        const normalized = trimOuterParens(term);
        const match = normalized.match(
          /^([a-zA-Z0-9_]+)\s*(=|!=|>=|<=|>|<|~)\s*(.+)$/,
        );
        if (!match) return null;

        return {
          field: match[1],
          operator: match[2],
          value: parseValue(match[3]),
        };
      };

      const expandAndGroups = (input: string): string[] => {
        const normalized = trimOuterParens(input);
        const nestedGroups = splitTopLevel(normalized, "&&");

        if (nestedGroups.length <= 1) {
          return [normalized];
        }

        // Parenthesized range clauses such as `(field >= 0 && field <= 1)`
        // should become two AND groups, not one malformed comparison.
        return nestedGroups.flatMap(expandAndGroups);
      };

      const andGroups = expandAndGroups(filter);
      return andGroups
        .map((group) => {
          const orTerms = splitTopLevel(trimOuterParens(group), "||")
            .map(parseTerm)
            .filter(
              (
                term,
              ): term is {
                field: string;
                operator: string;
                value: Primitive;
              } => Boolean(term),
            );
          return { or: orTerms };
        })
        .filter((group) => group.or.length > 0);
    };

    const applyFilter = (
      query: FilterableQuery,
      filter?: string,
    ): FilterableQuery => {
      const groups = parseFilterExpression(filter);
      let nextQuery = query;

      for (const group of groups) {
        if (group.or.length === 1) {
          const [term] = group.or;
          const value =
            term.operator === "~" ? `%${String(term.value)}%` : term.value;

          if (term.operator === "=")
            nextQuery = nextQuery.eq(term.field, value);
          else if (term.operator === "!=")
            nextQuery = nextQuery.neq(term.field, value);
          else if (term.operator === ">=")
            nextQuery = nextQuery.gte(term.field, value);
          else if (term.operator === "<=")
            nextQuery = nextQuery.lte(term.field, value);
          else if (term.operator === ">")
            nextQuery = nextQuery.gt(term.field, value);
          else if (term.operator === "<")
            nextQuery = nextQuery.lt(term.field, value);
          else if (term.operator === "~")
            nextQuery = nextQuery.ilike(term.field, String(value));
          continue;
        }

        const orExpression = group.or
          .map((term) => {
            const operator =
              term.operator === "="
                ? "eq"
                : term.operator === "!="
                  ? "neq"
                  : term.operator === ">="
                    ? "gte"
                    : term.operator === "<="
                      ? "lte"
                      : term.operator === ">"
                        ? "gt"
                        : term.operator === "<"
                          ? "lt"
                          : "ilike";

            const value =
              term.operator === "~"
                ? `%${String(term.value).replace(/,/g, "\\,")}%`
                : String(term.value).replace(/,/g, "\\,");

            return `${term.field}.${operator}.${value}`;
          })
          .join(",");

        nextQuery = nextQuery.or(orExpression);
      }

      return nextQuery;
    };

    const applySort = (
      query: FilterableQuery,
      sort?: string,
    ): FilterableQuery => {
      if (!sort) return query;

      const sortColumns = sort
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      let nextQuery = query;
      for (const column of sortColumns) {
        const descending = column.startsWith("-");
        const field = descending ? column.slice(1) : column;
        nextQuery = nextQuery.order(field, { ascending: !descending });
      }

      return nextQuery;
    };

    const collectionFactory = (name: string): PocketBaseCollection => ({
      async getList<T = unknown>(
        page: number,
        perPage: number,
        options?: ListOptions,
      ): Promise<ListResult<T>> {
        const selectColumns = options?.fields || "*";
        let query = adminClient
          .from(name)
          .select(selectColumns, {
            count: options?.skipTotal ? undefined : "exact",
          }) as unknown as FilterableQuery;

        query = applyFilter(query, options?.filter);
        query = applySort(query, options?.sort);

        const from = Math.max(0, (page - 1) * perPage);
        const to = from + perPage - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        if (isRequestedRangeNotSatisfiableError(error)) {
          if (options?.skipTotal) {
            return createEmptyListResult<T>(page, perPage, 0);
          }

          let countQuery = adminClient
            .from(name)
            .select("id", {
              count: "exact",
              head: true,
            }) as unknown as FilterableQuery;
          countQuery = applyFilter(countQuery, options?.filter);

          const { count: fallbackCount, error: fallbackError } =
            await countQuery;
          if (
            fallbackError &&
            !isMissingRelationError(fallbackError) &&
            !isRequestedRangeNotSatisfiableError(fallbackError)
          ) {
            throw new ClientResponseError(
              fallbackError.message,
              400,
              fallbackError,
            );
          }

          return createEmptyListResult<T>(page, perPage, fallbackCount || 0);
        }

        if (error && !isMissingRelationError(error)) {
          throw new ClientResponseError(error.message, 400, error);
        }

        if (isMissingRelationError(error)) {
          return createEmptyListResult<T>(page, perPage, 0);
        }

        const totalItems = options?.skipTotal ? data?.length || 0 : count || 0;
        const totalPages = perPage > 0 ? Math.ceil(totalItems / perPage) : 0;

        return {
          items: (data || []) as T[],
          page,
          perPage,
          totalItems,
          totalPages,
        };
      },

      async getFullList<T = unknown>(options?: FullListOptions): Promise<T[]> {
        const selectColumns = options?.fields || "*";
        const pageSize = 1000;
        let page = 1;
        const allRecords: T[] = [];

        while (true) {
          let query = adminClient
            .from(name)
            .select(selectColumns) as unknown as FilterableQuery;
          query = applyFilter(query, options?.filter);
          query = applySort(query, options?.sort);

          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;
          const { data, error } = await query.range(from, to);

          if (error && !isMissingRelationError(error)) {
            throw new ClientResponseError(error.message, 400, error);
          }

          if (isMissingRelationError(error)) {
            return [];
          }

          const items = (data || []) as T[];
          allRecords.push(...items);

          if (items.length < pageSize) {
            break;
          }

          page += 1;
        }

        return allRecords;
      },

      async getFirstListItem<T = unknown>(filter: string): Promise<T> {
        let query = adminClient
          .from(name)
          .select("*")
          .limit(1) as unknown as FilterableQuery;
        query = applyFilter(query, filter);

        const { data, error } = await query;
        if (error && !isMissingRelationError(error)) {
          throw new ClientResponseError(error.message, 400, error);
        }

        if (isMissingRelationError(error) || !data || data.length === 0) {
          throw new ClientResponseError(`No record found in ${name}`, 404);
        }

        return data[0] as T;
      },

      async getOne<T = unknown>(id: string): Promise<T> {
        const { data, error } = await adminClient
          .from(name)
          .select("*")
          .eq("id", id)
          .limit(1);

        if (error && !isMissingRelationError(error)) {
          throw new ClientResponseError(error.message, 400, error);
        }

        if (isMissingRelationError(error) || !data || data.length === 0) {
          throw new ClientResponseError(
            `Record ${id} not found in ${name}`,
            404,
          );
        }

        return data[0] as T;
      },

      async create<T = unknown>(payload: Record<string, unknown>): Promise<T> {
        const { data, error } = await adminClient
          .from(name)
          .insert(payload)
          .select("*")
          .single();

        if (error) {
          throw new ClientResponseError(error.message, 400, error);
        }

        return data as T;
      },

      async update<T = unknown>(
        id: string,
        payload: Record<string, unknown>,
      ): Promise<T> {
        const { data, error } = await adminClient
          .from(name)
          .update(payload)
          .eq("id", id)
          .select("*")
          .single();

        if (error) {
          throw new ClientResponseError(error.message, 400, error);
        }

        return data as T;
      },

      async delete(id: string): Promise<{ id: string }> {
        const { error } = await adminClient.from(name).delete().eq("id", id);

        if (error) {
          throw new ClientResponseError(error.message, 400, error);
        }

        return { id };
      },

      async authRefresh(): Promise<{ token: string | null; record: null }> {
        return { token: null, record: null };
      },

      async authWithPassword(
        _email: string,
        _password: string,
      ): Promise<{ token: string; record: null }> {
        return { token: "supabase-service-role", record: null };
      },
    });

    pbClient = {
      autoCancellation: () => undefined,
      collection: collectionFactory,
    };
  }
  return pbClient;
}

/**
 * User-based authentication function (uses logged-in user's token)
 * NOTE: This function requires cookies and should only be called from server components/API routes
 * Import cookies dynamically to avoid build errors in client components
 */
export async function ensureUserAuthenticated(): Promise<void> {
  try {
    const { createClient } = await import("@/app/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error(error?.message || "No authenticated Supabase user found");
    }
  } catch (error) {
    console.error("User authentication failed:", error);
    throw new Error(
      `User authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
