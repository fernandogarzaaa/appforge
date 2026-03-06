import '@base44/sdk';

declare module '@base44/sdk' {
    interface Base44Client {
        analytics: {
            capture: (event: string, properties?: any) => void;
            flush: () => void;
        };
        integrations: any; // Define more specifically if possible
        asServiceRole: any; // Define more specifically if possible
        agents: string[]; // Or complex object
        queries: any;
        mutations: any;
        log: (message: string) => void;
        // Add other missing properties found in typecheck
        update: (table: string, data: any) => any;
        delete: (table: string, id: any) => any;
        create: (table: string, data: any) => any;
    }
}

declare module 'swagger-jsdoc';
declare module 'swagger-ui-express';
declare module 'simple-git';
declare module '@tensorflow/tfjs-node';
