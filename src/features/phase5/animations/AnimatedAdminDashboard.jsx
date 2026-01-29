import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, Settings, AlertCircle, BarChart3, FileJson, Trash2, Plus } from 'lucide-react';
import { useAdminDashboard } from '../../phase4/admin/useAdminDashboard';
import { useAnimations } from './useAnimations';
import { useAccessibility } from '../accessibility/useAccessibility';
import { useResponsive } from '../responsive/useResponsive';

/**
 * AnimatedAdminDashboard Component
 * Enhanced AdminDashboard with smooth animations, accessibility features, and responsive design
 */
export const AnimatedAdminDashboard = () => {
  const {
    featureToggles,
    toggleFeature,
    systemHealth,
    checkSystemHealth,
    adminLogs,
    addLog,
    users,
    addUser,
    updateUserRole,
    deactivateUser,
  } = useAdminDashboard();

  const animations = useAnimations();
  const { announce, getAnimationSettings } = useAccessibility();
  const { isMobile, getGridCols, getResponsiveGap } = useResponsive();

  const [activeTab, setActiveTab] = useState('health');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', role: 'viewer' });

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const handleToggleFeature = (featureName) => {
    const newState = !featureToggles[featureName]?.enabled;
    toggleFeature(featureName, newState);
    announce(`${featureName} ${newState ? 'enabled' : 'disabled'}`);
    addLog('feature_toggled', `${featureName}: ${newState ? 'enabled' : 'disabled'}`);
  };

  const handleAddUser = () => {
    if (newUserForm.name && newUserForm.email) {
      addUser(newUserForm);
      announce(`User ${newUserForm.email} added successfully`);
      setNewUserForm({ name: '', email: '', role: 'viewer' });
      setShowAddUser(false);
      addLog('user_added', `Added user: ${newUserForm.email}`);
    }
  };

  const animSettings = getAnimationSettings();

  return (
    <motion.div
      variants={animations.containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-slate-900 rounded-lg border border-slate-700 p-6 space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={animations.itemVariants}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <FileJson className="w-4 h-4" />
          Export
        </motion.button>
      </motion.div>

      {/* Animated Tabs */}
      <motion.div
        variants={animations.itemVariants}
        className="flex gap-2 border-b border-slate-700 overflow-x-auto pb-2"
      >
        {['health', 'features', 'users', 'logs'].map((tab) => (
          <motion.button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              announce(`${tab} tab selected`);
            }}
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            className={`px-4 py-2 font-medium capitalize transition whitespace-nowrap ${
              activeTab === tab
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </motion.button>
        ))}
      </motion.div>

      {/* Health Tab */}
      {activeTab === 'health' && (
        <motion.div
          variants={animations.tabVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4`}
        >
          {[
            { label: 'Uptime', value: systemHealth.uptime || 0, unit: '%' },
            { label: 'Response Time', value: systemHealth.responseTime || 0, unit: 'ms' },
            { label: 'CPU Usage', value: systemHealth.cpu || 0, unit: '%' },
            { label: 'Memory Usage', value: systemHealth.memory || 0, unit: '%' },
          ].map((metric, idx) => (
            <motion.div
              key={metric.label}
              variants={animations.itemVariants}
              custom={idx}
              className="bg-slate-800 rounded-lg p-4"
              whileHover={{ y: -4 }}
            >
              <p className="text-slate-400 text-sm mb-2">{metric.label}</p>
              <motion.p
                className="text-3xl font-bold text-white mb-2"
                animate={{ opacity: [0.8, 1] }}
                transition={{ duration: 0.5 }}
              >
                {metric.value}{metric.unit}
              </motion.p>
              <motion.div
                className="w-full bg-slate-700 rounded-full h-2 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${metric.value}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <motion.div
          variants={animations.tabVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="space-y-3"
        >
          {Object.entries(featureToggles).map(([name, feature], idx) => (
            <motion.div
              key={name}
              variants={animations.itemVariants}
              custom={idx}
              className="flex items-center justify-between bg-slate-800 rounded-lg p-4"
              whileHover={{ x: 4 }}
            >
              <div>
                <h3 className="text-white font-medium capitalize">{name.replace(/_/g, ' ')}</h3>
              </div>
              <motion.button
                onClick={() => handleToggleFeature(name)}
                whileTap={{ scale: 0.95 }}
                className={`relative w-12 h-6 rounded-full transition ${
                  feature.enabled
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-slate-600 hover:bg-slate-700'
                }`}
              >
                <motion.div
                  layout={!animSettings.disableTransitions}
                  className="absolute w-5 h-5 rounded-full bg-white top-0.5"
                  animate={{
                    x: feature.enabled ? 24 : 2,
                  }}
                  transition={{ duration: animSettings.duration / 1000 }}
                />
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <motion.div
          variants={animations.tabVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="space-y-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddUser(!showAddUser)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Add User
          </motion.button>

          {showAddUser && (
            <motion.div
              variants={animations.toggleVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-slate-800 rounded-lg p-4 space-y-3"
            >
              <input
                type="text"
                placeholder="User Name"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddUser}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Add User
              </motion.button>
            </motion.div>
          )}

          <motion.div
            variants={animations.listContainerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {users.map((user, idx) => (
              <motion.div
                key={user.id}
                variants={animations.listItemVariants}
                custom={idx}
                className="bg-slate-800 rounded-lg p-4"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{user.name}</p>
                    <p className="text-slate-400 text-sm">{user.email}</p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      className="px-3 py-1 bg-slate-700 border border-slate-600 text-white text-sm rounded"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <motion.div
          variants={animations.tabVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="space-y-2 max-h-96 overflow-y-auto"
        >
          {adminLogs.slice(-20).reverse().map((log, idx) => (
            <motion.div
              key={idx}
              variants={animations.listItemVariants}
              className="flex items-start gap-3 bg-slate-800 rounded-lg p-3"
            >
              <Activity className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-white text-sm">{log.message}</p>
                <p className="text-slate-400 text-xs">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default AnimatedAdminDashboard;
