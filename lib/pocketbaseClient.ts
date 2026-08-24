import "server-only";

import PocketBase, {
  ClientResponseError,
  type RecordAuthResponse,
  type RecordModel,
} from "pocketbase";
import {
  isMigratedSourceCollection,
  restoreSourceRecord,
  sourceTargetField,
  translateSourceFields,
  translateSourceFilter,
  translateSourceSort,
} from "@/lib/pocketbase/source-record";

export { ClientResponseError };

interface ListOptions {
  filter?: string;
  sort?: string;
  fields?: string;
  skipTotal?: boolean;
}

interface FullListOptions extends ListOptions {
  batch?: number;
}

export type ListResult<T> = {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

export interface PocketBaseCollection {
  getList<T = RecordModel>(
    page?: number,
    perPage?: number,
    options?: ListOptions,
  ): Promise<ListResult<T>>;
  getFullList<T = RecordModel>(options?: FullListOptions): Promise<T[]>;
  getFirstListItem<T = RecordModel>(
    filter: string,
    options?: ListOptions,
  ): Promise<T>;
  getOne<T = RecordModel>(id: string, options?: ListOptions): Promise<T>;
  create<T = RecordModel>(
    payload: Record<string, unknown> | FormData,
  ): Promise<T>;
  update<T = RecordModel>(
    id: string,
    payload: Record<string, unknown> | FormData,
  ): Promise<T>;
  delete(id: string): Promise<boolean>;
  authRefresh<T = RecordModel>(): Promise<RecordAuthResponse<T>>;
  authWithPassword<T = RecordModel>(
    email: string,
    password: string,
  ): Promise<RecordAuthResponse<T>>;
}

export interface PocketBaseLike {
  autoCancellation(enabled: boolean): void;
  collection(name: string): PocketBaseCollection;
  downloadProtectedFile(
    record: RecordModel,
    filename: string,
  ): Promise<{ bytes: ArrayBuffer; contentType: string }>;
}

function getInternalUrl(): string {
  const raw = process.env.POCKETBASE_INTERNAL_URL?.trim();
  if (!raw) {
    throw new Error("POCKETBASE_INTERNAL_URL is not configured");
  }

  const url = new URL(raw);
  const isLocalDevelopment =
    process.env.NODE_ENV !== "production" &&
    ["localhost", "127.0.0.1"].includes(url.hostname);
  if (
    url.protocol !== "http:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    (url.hostname !== "pocketbase" && !isLocalDevelopment)
  ) {
    throw new Error(
      "POCKETBASE_INTERNAL_URL must be the private http://pocketbase:8090 origin",
    );
  }

  return url.origin;
}

function getServiceCredentials() {
  const email = process.env.POCKETBASE_SERVICE_EMAIL?.trim();
  const password = process.env.POCKETBASE_SERVICE_PASSWORD;
  if (!email || !password || password.length < 32 || password.length > 72) {
    throw new Error("PocketBase service credentials are missing or unsafe");
  }
  return { email, password };
}

class ServicePocketBase implements PocketBaseLike {
  private readonly client: PocketBase;
  private authentication: Promise<void> | null = null;

  constructor() {
    this.client = new PocketBase(getInternalUrl());
    this.client.autoCancellation(false);
  }

  autoCancellation(enabled: boolean): void {
    this.client.autoCancellation(enabled);
  }

  private async authenticate(): Promise<void> {
    const current = this.client.authStore.record;
    if (
      this.client.authStore.isValid &&
      current?.collectionName === "app_services" &&
      current.role === "backend"
    ) {
      return;
    }

    if (!this.authentication) {
      this.authentication = (async () => {
        this.client.authStore.clear();
        const { email, password } = getServiceCredentials();
        const auth = await this.client
          .collection("app_services")
          .authWithPassword(email, password);
        if (
          auth.record.collectionName !== "app_services" ||
          auth.record.role !== "backend"
        ) {
          this.client.authStore.clear();
          throw new Error(
            "PocketBase returned an unauthorized service identity",
          );
        }
      })().finally(() => {
        this.authentication = null;
      });
    }

    await this.authentication;
  }

  private async withAuthentication<T>(operation: () => Promise<T>): Promise<T> {
    await this.authenticate();
    try {
      return await operation();
    } catch (error) {
      if (!(error instanceof ClientResponseError) || error.status !== 401) {
        throw error;
      }
      this.client.authStore.clear();
      await this.authenticate();
      return operation();
    }
  }

  collection(name: string): PocketBaseCollection {
    const collection = this.client.collection(name);
    const migratedSource = isMigratedSourceCollection(name);
    const sourceOptions = (options: ListOptions | FullListOptions) => {
      if (!migratedSource) return options;
      const translated = { ...options };
      if (options.filter !== undefined) {
        translated.filter = translateSourceFilter(options.filter);
      }
      if (options.sort !== undefined) {
        translated.sort = translateSourceSort(options.sort);
      }
      if (options.fields !== undefined) {
        translated.fields = translateSourceFields(options.fields);
      }
      return translated;
    };
    const firstItemOptions = (options: ListOptions) => {
      const translated = sourceOptions(options);
      delete translated.filter;
      return translated;
    };
    const restore = <T>(record: RecordModel, fields?: string): T =>
      (migratedSource
        ? restoreSourceRecord(record, fields)
        : record) as unknown as T;
    return {
      getList: <T = RecordModel>(
        page = 1,
        perPage = 30,
        options: ListOptions = {},
      ) =>
        this.withAuthentication(async () => {
          const result = await collection.getList<RecordModel>(
            page,
            perPage,
            sourceOptions(options),
          );
          return {
            ...result,
            items: result.items.map((record) =>
              restore<T>(record, options.fields),
            ),
          };
        }),
      getFullList: <T = RecordModel>(options: FullListOptions = {}) =>
        this.withAuthentication(async () => {
          const records = await collection.getFullList<RecordModel>(
            sourceOptions(options),
          );
          return records.map((record) => restore<T>(record, options.fields));
        }),
      getFirstListItem: <T = RecordModel>(
        filter: string,
        options: ListOptions = {},
      ) =>
        this.withAuthentication(async () => {
          const record = await collection.getFirstListItem<RecordModel>(
            migratedSource ? translateSourceFilter(filter) || filter : filter,
            firstItemOptions(options),
          );
          return restore<T>(record, options.fields);
        }),
      getOne: <T = RecordModel>(id: string, options: ListOptions = {}) =>
        this.withAuthentication(async () => {
          const record = migratedSource
            ? await collection.getFirstListItem<RecordModel>(
                this.client.filter(`${sourceTargetField("id")} = {:id}`, {
                  id,
                }),
                firstItemOptions(options),
              )
            : await collection.getOne<RecordModel>(id, options);
          return restore<T>(record, options.fields);
        }),
      create: <T = RecordModel>(payload: Record<string, unknown> | FormData) =>
        this.withAuthentication(() => collection.create<T>(payload)),
      update: <T = RecordModel>(
        id: string,
        payload: Record<string, unknown> | FormData,
      ) => this.withAuthentication(() => collection.update<T>(id, payload)),
      delete: (id: string) =>
        this.withAuthentication(() => collection.delete(id)),
      authRefresh: <T = RecordModel>() =>
        this.withAuthentication(() => collection.authRefresh<T>()),
      authWithPassword: <T = RecordModel>(email: string, password: string) =>
        this.withAuthentication(() =>
          collection.authWithPassword<T>(email, password),
        ),
    };
  }

  downloadProtectedFile(
    record: RecordModel,
    filename: string,
  ): Promise<{ bytes: ArrayBuffer; contentType: string }> {
    return this.withAuthentication(async () => {
      if (!filename || filename.includes("/") || filename.includes("\\")) {
        throw new Error("PocketBase returned an invalid file name");
      }
      const token = await this.client.files.getToken();
      const response = await fetch(
        this.client.files.getURL(record, filename, { token }),
        { signal: AbortSignal.timeout(15_000) },
      );
      if (!response.ok) {
        throw new Error(`PocketBase file request failed (${response.status})`);
      }
      return {
        bytes: await response.arrayBuffer(),
        contentType:
          response.headers.get("content-type") || "application/octet-stream",
      };
    });
  }
}

let serviceClient: ServicePocketBase | null = null;

/**
 * Returns the private, backend-only PocketBase client. PocketBase is not
 * published on the VM host or proxied by nginx; this client authenticates as
 * the least-privileged app_services record and automatically renews its token.
 */
export function getPocketBase(): PocketBaseLike {
  if (!serviceClient) serviceClient = new ServicePocketBase();
  return serviceClient;
}
