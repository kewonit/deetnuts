import { createClient } from "@supabase/supabase-js";

type Primitive = string | number | boolean | null;

type BatchAction = {
  type: "create" | "upsert" | "delete";
  table: string;
  payload?: object;
  id?: string;
};

type ListOptions = {
  filter?: string;
  sort?: string;
  fields?: string;
  skipTotal?: boolean;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function parseFilterExpression(
  filter?: string,
): Array<{ or: Array<{ field: string; operator: string; value: Primitive }> }> {
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

  const splitTopLevel = (input: string, separator: "&&" | "||"): string[] => {
    const values: string[] = [];
    let current = "";
    let depth = 0;
    let quote: '"' | "'" | null = null;

    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];
      const next = input[index + 1];

      if ((char === '"' || char === "'") && input[index - 1] !== "\\") {
        if (quote === char) quote = null;
        else if (!quote) quote = char;
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

    // Keep the script-side compatibility layer aligned with the runtime parser.
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
          ): term is { field: string; operator: string; value: Primitive } =>
            Boolean(term),
        );
      return { or: orTerms };
    })
    .filter((group) => group.or.length > 0);
}

function applyFilter(query: any, filter?: string) {
  const groups = parseFilterExpression(filter);
  let nextQuery = query;

  for (const group of groups) {
    if (group.or.length === 1) {
      const [term] = group.or;
      const value =
        term.operator === "~" ? `%${String(term.value)}%` : term.value;

      if (term.operator === "=") nextQuery = nextQuery.eq(term.field, value);
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
        nextQuery = nextQuery.ilike(term.field, value);
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
}

function applySort(query: any, sort?: string) {
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
}

class BatchBuilder {
  private actions: BatchAction[] = [];

  collection(name: string) {
    return {
      create: (payload: object) => {
        this.actions.push({ type: "create", table: name, payload });
      },
      upsert: (payload: object) => {
        this.actions.push({ type: "upsert", table: name, payload });
      },
      delete: (id: string) => {
        this.actions.push({ type: "delete", table: name, id });
      },
    };
  }

  async send(_options?: { requestKey?: string }) {
    const grouped = new Map<string, BatchAction[]>();
    for (const action of this.actions) {
      const key = `${action.table}:${action.type}`;
      const existing = grouped.get(key) || [];
      existing.push(action);
      grouped.set(key, existing);
    }

    for (const [key, group] of grouped.entries()) {
      const [table, type] = key.split(":");

      if (type === "delete") {
        const ids = group.map((item) => item.id).filter(Boolean) as string[];
        if (ids.length) {
          const { error } = await supabase.from(table).delete().in("id", ids);
          if (error) throw error;
        }
      } else if (type === "create") {
        const rows = group
          .map((item) => item.payload)
          .filter(Boolean) as object[];
        if (rows.length) {
          const { error } = await supabase.from(table).insert(rows);
          if (error) throw error;
        }
      } else if (type === "upsert") {
        const rows = group
          .map((item) => item.payload)
          .filter(Boolean) as object[];
        if (rows.length) {
          const { error } = await supabase
            .from(table)
            .upsert(rows, { onConflict: "id" });
          if (error) throw error;
        }
      }
    }

    return { success: true, total: this.actions.length };
  }
}

export default class PocketBase {
  baseUrl: string;

  authStore = {
    token: "",
    save: (token: string, _model?: unknown) => {
      this.authStore.token = token;
    },
  };

  collections = {
    getOne: async (idOrName: string) => ({
      id: idOrName,
      name: idOrName,
      fields: [],
    }),

    getList: async () => {
      const items = [
        "josaa_institutes",
        "josaa_branches",
        "josaa_cutoffs",
        "josaa_institute_aliases",
        "2024_mht_cet_colleges",
        "2024_mht_cet_colleges_seat_matrix",
        "2024_mht_cet_round_one_cutoffs_duplicate",
        "2024_mht_cet_round_two_cutoffs",
        "2024_mht_cet_round_three_cutoffs",
        "2025_mht_cet_round_one_cutoffs",
        "2024_all_india_rounds_one",
        "2024_all_india_rounds_two",
        "2024_all_india_rounds_three",
        "engineering_bits_cutoffs",
      ].map((name) => ({ id: name, name }));

      return {
        items,
        page: 1,
        perPage: items.length,
        totalItems: items.length,
        totalPages: 1,
      };
    },

    getFullList: async () => {
      const result = await this.collections.getList();
      return result.items;
    },

    update: async (idOrName: string, payload: Record<string, unknown>) => ({
      id: idOrName,
      name: idOrName,
      ...payload,
    }),
  };

  admins = {
    authWithPassword: async (_email: string, _password: string) => ({
      token: "supabase-service-role",
    }),
  };

  constructor(url: string) {
    this.baseUrl = url;
  }

  autoCancellation(_disabled: boolean) {}

  createBatch() {
    return new BatchBuilder();
  }

  collection(name: string) {
    return {
      authWithPassword: async (_email: string, _password: string) => ({
        token: "supabase-service-role",
      }),

      getList: async (
        page: number,
        perPage: number,
        options?: ListOptions,
      ): Promise<{
        items: any[];
        page: number;
        perPage: number;
        totalItems: number;
        totalPages: number;
      }> => {
        const selectColumns = options?.fields || "*";
        let query = supabase.from(name).select(selectColumns, {
          count: options?.skipTotal ? undefined : "exact",
        });

        query = applyFilter(query, options?.filter);
        query = applySort(query, options?.sort);

        const from = Math.max(0, (page - 1) * perPage);
        const to = from + perPage - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        if (error) throw error;

        const totalItems = options?.skipTotal ? data?.length || 0 : count || 0;
        const totalPages = perPage > 0 ? Math.ceil(totalItems / perPage) : 0;

        return {
          items: (data || []) as any[],
          page,
          perPage,
          totalItems,
          totalPages,
        };
      },

      getFullList: async (
        options?: Omit<ListOptions, "skipTotal">,
      ): Promise<any[]> => {
        const pageSize = 1000;
        let page = 1;
        const items: Record<string, unknown>[] = [];

        while (true) {
          const list = await this.collection(name).getList(page, pageSize, {
            ...options,
            skipTotal: true,
          });
          const pageItems = (list.items || []) as unknown as Record<
            string,
            unknown
          >[];
          items.push(...pageItems);
          if (pageItems.length < pageSize) break;
          page += 1;
        }

        return items;
      },

      getOne: async (id: string) => {
        const { data, error } = await supabase
          .from(name)
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        return data;
      },

      getFirstListItem: async (filter: string) => {
        let query = supabase.from(name).select("*").limit(1);
        query = applyFilter(query, filter);

        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error(`No rows found in ${name}`);
        }
        return data[0];
      },

      create: async (payload: object) => {
        const { data, error } = await supabase
          .from(name)
          .insert(payload)
          .select("*")
          .single();
        if (error) throw error;
        return data;
      },

      update: async (id: string, payload: object) => {
        const { data, error } = await supabase
          .from(name)
          .update(payload)
          .eq("id", id)
          .select("*")
          .single();
        if (error) throw error;
        return data;
      },

      delete: async (id: string) => {
        const { error } = await supabase.from(name).delete().eq("id", id);
        if (error) throw error;
      },
    };
  }
}
