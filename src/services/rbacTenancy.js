import { loadPersistedState, savePersistedState } from '@/services/persistenceStore';

const STORAGE_KEY = 'appforge_rbac';
const STATE_KEY = 'rbacTenancy';

const load = () =>
  loadPersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, fallback: { roles: [], orgs: [] } });

const save = (value) => savePersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, value });

export const RbacTenancyService = {
  async listRoles() {
    const state = await load();
    return state.roles || [];
  },

  async addRole(name, permissions = []) {
    const state = await load();
    const role = { id: `role_${Date.now()}`, name, permissions };
    const next = { ...state, roles: [role, ...state.roles] };
    await save(next);
    return role;
  },

  async listOrganizations() {
    const state = await load();
    return state.orgs || [];
  },

  async addOrganization(name) {
    const state = await load();
    const org = { id: `org_${Date.now()}`, name };
    const next = { ...state, orgs: [org, ...state.orgs] };
    await save(next);
    return org;
  },
};
