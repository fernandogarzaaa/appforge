declare module 'npm:@base44/sdk@0.8.6' {
  export interface AuthClient {
    me(): Promise<{ id?: string; email?: string; name?: string }>;
  }

  export interface FunctionsModule {
    execute(name: string, options: Record<string, any>): Promise<{ data: any }>;
    invoke(name: string, options: Record<string, any>): Promise<{ data: any }>;
  }

  export interface EntityCRUD {
    list(options?: any): Promise<{ data: any[] }>;
    get(id: string): Promise<{ data: any }>;
    create(data: any): Promise<{ data: any }>;
    update(id: string, data: any): Promise<{ data: any }>;
    delete(id: string): Promise<void>;
    query(options: any): Promise<{ data: any[] }>;
  }

  export interface EntitiesModule {
    list(options?: any): Promise<{ data: any[] }>;
    get(id: string): Promise<{ data: any }>;
    create(data: any): Promise<{ data: any }>;
    update(id: string, data: any): Promise<{ data: any }>;
    delete(id: string): Promise<void>;
    query(options: any): Promise<{ data: any[] }>;
    
    // Entity-specific accessors
    Project: EntityCRUD;
    Entity: EntityCRUD;
    Page: EntityCRUD;
    Component: EntityCRUD;
    Function: EntityCRUD;
    [key: string]: EntityCRUD | any;
  }

  export interface PagesModule {
    list(options?: any): Promise<{ data: any[] }>;
    get(id: string): Promise<{ data: any }>;
    create(data: any): Promise<{ data: any }>;
    update(id: string, data: any): Promise<{ data: any }>;
    delete(id: string): Promise<void>;
  }

  export interface ComponentsModule {
    list(options?: any): Promise<{ data: any[] }>;
    get(id: string): Promise<{ data: any }>;
    create(data: any): Promise<{ data: any }>;
    update(id: string, data: any): Promise<{ data: any }>;
    delete(id: string): Promise<void>;
  }

  export interface DataModule {
    query(entity: string, options?: any): Promise<{ data: any[] }>;
    get(entity: string, id: string): Promise<{ data: any }>;
    create(entity: string, data: any): Promise<{ data: any }>;
    update(entity: string, id: string, data: any): Promise<{ data: any }>;
    delete(entity: string, id: string): Promise<void>;
  }

  export interface StorageModule {
    upload(file: any): Promise<{ data: { url: string } }>;
    delete(url: string): Promise<void>;
  }

  export interface Base44Client {
    auth: AuthClient;
    functions: FunctionsModule;
    entities: EntitiesModule;
    pages: PagesModule;
    components: ComponentsModule;
    data: DataModule;
    storage: StorageModule;
  }

  export function createClientFromRequest(req: Request): Base44Client;
}

declare module '@base44/sdk' {
  export interface AuthClient {
    me(): Promise<{ id?: string; email?: string; name?: string }>;
  }

  export interface FunctionsModule {
    execute(name: string, options: Record<string, any>): Promise<{ data: any }>;
    invoke(name: string, options: Record<string, any>): Promise<{ data: any }>;
  }

  export interface EntityCRUD {
    list(options?: any): Promise<{ data: any[] }>;
    get(id: string): Promise<{ data: any }>;
    create(data: any): Promise<{ data: any }>;
    update(id: string, data: any): Promise<{ data: any }>;
    delete(id: string): Promise<void>;
    query(options: any): Promise<{ data: any[] }>;
  }

  export interface EntitiesModule {
    list(options?: any): Promise<{ data: any[] }>;
    get(id: string): Promise<{ data: any }>;
    create(data: any): Promise<{ data: any }>;
    update(id: string, data: any): Promise<{ data: any }>;
    delete(id: string): Promise<void>;
    query(options: any): Promise<{ data: any[] }>;
    
    // Entity-specific accessors
    Project: EntityCRUD;
    Entity: EntityCRUD;
    Page: EntityCRUD;
    Component: EntityCRUD;
    Function: EntityCRUD;
    [key: string]: EntityCRUD | any;
  }

  export interface PagesModule {
    list(options?: any): Promise<{ data: any[] }>;
    get(id: string): Promise<{ data: any }>;
    create(data: any): Promise<{ data: any }>;
    update(id: string, data: any): Promise<{ data: any }>;
    delete(id: string): Promise<void>;
  }

  export interface ComponentsModule {
    list(options?: any): Promise<{ data: any[] }>;
    get(id: string): Promise<{ data: any }>;
    create(data: any): Promise<{ data: any }>;
    update(id: string, data: any): Promise<{ data: any }>;
    delete(id: string): Promise<void>;
  }

  export interface DataModule {
    query(entity: string, options?: any): Promise<{ data: any[] }>;
    get(entity: string, id: string): Promise<{ data: any }>;
    create(entity: string, data: any): Promise<{ data: any }>;
    update(entity: string, id: string, data: any): Promise<{ data: any }>;
    delete(entity: string, id: string): Promise<void>;
  }

  export interface StorageModule {
    upload(file: any): Promise<{ data: { url: string } }>;
    delete(url: string): Promise<void>;
  }

  export interface Base44Client {
    auth: AuthClient;
    functions: FunctionsModule;
    entities: EntitiesModule;
    pages: PagesModule;
    components: ComponentsModule;
    data: DataModule;
    storage: StorageModule;
  }

  export interface CreateClientOptions {
    appId?: string;
    token?: string;
    functionsVersion?: string;
    serverUrl?: string;
    requiresAuth?: boolean;
    appBaseUrl?: string;
  }

  export function createClient(options: CreateClientOptions): Base44Client;
  export function createClientFromRequest(req: Request): Base44Client;
}
