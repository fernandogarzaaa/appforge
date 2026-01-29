/**
 * Quantum Computing Routes
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createCircuit,
  getCircuits,
  getCircuit,
  updateCircuit,
  deleteCircuit,
  simulateCircuit,
  runAlgorithm,
  getSimulationHistory,
  exportCircuit
} from '../controllers/quantumController.js';

const router = express.Router();

// All quantum routes require authentication
router.use(authenticate);

/**
 * POST /api/quantum/circuits
 * Create a new quantum circuit
 */
router.post('/circuits', createCircuit);

/**
 * GET /api/quantum/circuits
 * List all circuits for current user
 */
router.get('/circuits', getCircuits);

/**
 * GET /api/quantum/circuits/:id
 * Get a specific circuit
 */
router.get('/circuits/:id', getCircuit);

/**
 * PUT /api/quantum/circuits/:id
 * Update a circuit
 */
router.put('/circuits/:id', updateCircuit);

/**
 * DELETE /api/quantum/circuits/:id
 * Delete a circuit
 */
router.delete('/circuits/:id', deleteCircuit);

/**
 * POST /api/quantum/circuits/:id/simulate
 * Simulate a quantum circuit
 */
router.post('/circuits/:id/simulate', simulateCircuit);

/**
 * POST /api/quantum/algorithms
 * Run a quantum algorithm
 */
router.post('/algorithms', runAlgorithm);

/**
 * GET /api/quantum/circuits/:id/history
 * Get simulation history for a circuit
 */
router.get('/circuits/:id/history', getSimulationHistory);

/**
 * GET /api/quantum/circuits/:id/export
 * Export circuit (query: format=qasm|json)
 */
router.get('/circuits/:id/export', exportCircuit);

export default router;
