/**
 * useAPI Hook
 * React hook for easy backend API integration
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  authService, 
  projectService, 
  entityService, 
  teamService,
  websocketService 
} from '@/api/services';

/**
 * Hook for authentication
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load current user on mount
  useEffect(() => {
    const loadUser = async () => {
      const result = await authService.getCurrentUser();
      if (result.success) {
        setUser(result.user);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    const result = await authService.login(email, password);
    
    if (result.success) {
      setUser(result.user);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    const result = await authService.register(userData);
    
    if (result.success) {
      setUser(result.user);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    websocketService.disconnect();
  }, []);

  const updateProfile = useCallback(async (updates) => {
    setLoading(true);
    const result = await authService.updateProfile(updates);
    
    if (result.success) {
      setUser(result.user);
    }
    
    setLoading(false);
    return result;
  }, []);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };
}

/**
 * Hook for projects
 */
export function useProjects(filters = {}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const loadProjects = useCallback(async (customFilters = {}) => {
    setLoading(true);
    setError(null);
    
    const result = await projectService.getAllProjects({
      ...filters,
      ...customFilters
    });
    
    if (result.success) {
      setProjects(result.projects);
      setPagination(result.pagination);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  }, [filters]);

  const createProject = useCallback(async (projectData) => {
    const result = await projectService.createProject(projectData);
    
    if (result.success) {
      setProjects(prev => [...prev, result.project]);
    }
    
    return result;
  }, []);

  const updateProject = useCallback(async (projectId, updates) => {
    const result = await projectService.updateProject(projectId, updates);
    
    if (result.success) {
      setProjects(prev => 
        prev.map(p => p.id === projectId ? result.project : p)
      );
    }
    
    return result;
  }, []);

  const deleteProject = useCallback(async (projectId) => {
    const result = await projectService.deleteProject(projectId);
    
    if (result.success) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
    }
    
    return result;
  }, []);

  const cloneProject = useCallback(async (projectId, cloneName, options) => {
    const result = await projectService.cloneProject(projectId, cloneName, options);
    
    if (result.success) {
      setProjects(prev => [...prev, result.project]);
    }
    
    return result;
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    loading,
    error,
    pagination,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    cloneProject
  };
}

/**
 * Hook for single project
 */
export function useProject(projectId) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProject = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    const result = await projectService.getProject(projectId);
    
    if (result.success) {
      setProject(result.project);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  }, [projectId]);

  const updateProject = useCallback(async (updates) => {
    const result = await projectService.updateProject(projectId, updates);
    
    if (result.success) {
      setProject(result.project);
    }
    
    return result;
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  return {
    project,
    loading,
    error,
    loadProject,
    updateProject
  };
}

/**
 * Hook for entities
 */
export function useEntities(projectId) {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEntities = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    const result = await entityService.getEntities(projectId);
    
    if (result.success) {
      setEntities(result.entities);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  }, [projectId]);

  const createEntity = useCallback(async (entityData) => {
    const result = await entityService.createEntity({
      ...entityData,
      projectId
    });
    
    if (result.success) {
      setEntities(prev => [...prev, result.entity]);
    }
    
    return result;
  }, [projectId]);

  const updateEntity = useCallback(async (entityId, updates) => {
    const result = await entityService.updateEntity(entityId, updates);
    
    if (result.success) {
      setEntities(prev => 
        prev.map(e => e.id === entityId ? result.entity : e)
      );
    }
    
    return result;
  }, []);

  const deleteEntity = useCallback(async (entityId) => {
    const result = await entityService.deleteEntity(entityId);
    
    if (result.success) {
      setEntities(prev => prev.filter(e => e.id !== entityId));
    }
    
    return result;
  }, []);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  return {
    entities,
    loading,
    error,
    loadEntities,
    createEntity,
    updateEntity,
    deleteEntity
  };
}

/**
 * Hook for WebSocket collaboration
 */
export function useCollaboration(roomId, userData) {
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState(new Map());

  useEffect(() => {
    if (!roomId) return;

    // Connect WebSocket
    if (!websocketService.isConnected()) {
      websocketService.connect();
    }

    // Connection handlers
    const handleConnected = () => {
      setConnected(true);
      websocketService.joinRoom(roomId, userData);
    };

    const handleDisconnected = () => {
      setConnected(false);
    };

    // Collaboration handlers
    const handleCursorUpdate = (data) => {
      setCursors(prev => new Map(prev).set(data.userId, data.position));
    };

    const handleUserJoined = (data) => {
      setUsers(prev => [...prev, data.user]);
    };

    const handleUserLeft = (data) => {
      setUsers(prev => prev.filter(u => u.id !== data.userId));
      setCursors(prev => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    };

    // Subscribe to events
    websocketService.on('connected', handleConnected);
    websocketService.on('disconnected', handleDisconnected);
    websocketService.on('cursor-update', handleCursorUpdate);
    websocketService.on('user-joined', handleUserJoined);
    websocketService.on('user-left', handleUserLeft);

    // Join room if already connected
    if (websocketService.isConnected()) {
      websocketService.joinRoom(roomId, userData);
      setConnected(true);
    }

    // Cleanup
    return () => {
      websocketService.off('connected', handleConnected);
      websocketService.off('disconnected', handleDisconnected);
      websocketService.off('cursor-update', handleCursorUpdate);
      websocketService.off('user-joined', handleUserJoined);
      websocketService.off('user-left', handleUserLeft);
      
      websocketService.leaveRoom(roomId);
    };
  }, [roomId, userData]);

  const updateCursor = useCallback((position, userId) => {
    websocketService.updateCursor(roomId, position, userId);
  }, [roomId]);

  const sendTextChange = useCallback((change) => {
    websocketService.sendTextChange(roomId, change);
  }, [roomId]);

  const requestFileLock = useCallback((fileId, userId) => {
    websocketService.requestFileLock(roomId, fileId, userId);
  }, [roomId]);

  const releaseFileLock = useCallback((fileId) => {
    websocketService.releaseFileLock(roomId, fileId);
  }, [roomId]);

  return {
    connected,
    users,
    cursors,
    updateCursor,
    sendTextChange,
    requestFileLock,
    releaseFileLock
  };
}

export default {
  useAuth,
  useProjects,
  useProject,
  useEntities,
  useCollaboration
};
