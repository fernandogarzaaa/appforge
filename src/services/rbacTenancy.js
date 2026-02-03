const STORAGE_KEY = 'appforge_rbac';

const load = () => {
  if (typeof window === 'undefined') return { roles: [], orgs: [] };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { roles: [], orgs: [] };
  try {
    return JSON.parse(raw);
  } catch (error) {
    return { roles: [], orgs: [] };
  }
};

const save = (value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const RbacTenancyService = {
  listRoles() {
    return load().roles || [];
  },

  addRole(name, permissions = []) {
    const state = load();
    const role = { id: `role_${Date.now()}`, name, permissions };
    const next = { ...state, roles: [role, ...state.roles] };
    save(next);
    return role;
  },

  listOrganizations() {
    return load().orgs || [];
  },

  addOrganization(name) {
    const state = load();
    const org = { id: `org_${Date.now()}`, name };
    const next = { ...state, orgs: [org, ...state.orgs] };
    save(next);
    return org;
  },
};
