import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 60 * 24, // 24 hours (formerly cacheTime)
		},
	},
});

// Persist query client to localStorage for offline support
if (typeof window !== 'undefined') {
	const localStoragePersister = createSyncStoragePersister({
		storage: window.localStorage,
		key: 'APPFORGE_CACHE',
	});

	persistQueryClient({
		queryClient: queryClientInstance,
		persister: localStoragePersister,
		maxAge: 1000 * 60 * 60 * 24, // 24 hours
	});
}
