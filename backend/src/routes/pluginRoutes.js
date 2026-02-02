/**
 * Plugin Routes
 */

const express = require('express');
const { authenticate  } = require('../middleware/auth');
const { listPlugins, runPlugin  } = require('../plugins/registry');

const router = express.Router();

router.use(authenticate);

router.get('/', (req, res) => {
  res.json({ plugins: listPlugins() });
});

router.post('/:pluginName/execute', async (req, res) => {
  try {
    const result = await runPlugin(req.params.pluginName, req.body, {
      userId: req.user?.id,
      tenantId: req.tenant?.id
    });

    res.json({
      plugin: req.params.pluginName,
      result
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

module.exports = router;
