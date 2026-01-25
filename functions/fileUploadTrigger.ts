import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Handle file upload triggers for bots
 * Called when files are uploaded to designated locations
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file');
    const directory = formData.get('directory') || '/uploads';

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get file metadata
    const fileMetadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      directory
    };

    // Find bots configured for file upload triggers
    const bots = await base44.entities.Automation.filter({
      trigger_type: 'file_upload'
    });

    const triggeredBots = [];

    for (const bot of bots) {
      try {
        const config = bot.trigger?.config || {};

        // Check if directory matches
        if (config.directory && !matchesDirectory(directory, config.directory)) {
          continue;
        }

        // Check file type filter
        if (config.fileTypes) {
          if (!matchesFileType(file.name, config.fileTypes)) {
            continue;
          }
        }

        // Check file size limit
        if (config.maxSize) {
          const maxSizeBytes = parseInt(config.maxSize) * 1024 * 1024;
          if (file.size > maxSizeBytes) {
            continue;
          }
        }

        // Check file name pattern
        if (config.filePattern) {
          const pattern = new RegExp(config.filePattern);
          if (!pattern.test(file.name)) {
            continue;
          }
        }

        // Upload file
        const fileUrl = await uploadFile(file, base44);

        // Prepare trigger data
        const triggerData = {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileUrl,
          directory,
          uploadedAt: new Date().toISOString()
        };

        // Execute bot workflow
        const result = await base44.functions.invoke('executeBotWorkflow', {
          botId: bot.id,
          triggerData
        });

        triggeredBots.push({
          botId: bot.id,
          botName: bot.name,
          success: result.success,
          fileUrl,
          executedNodes: result.nodesExecuted
        });

        // Create trigger log
        await base44.entities.TriggerLog.create({
          bot_id: bot.id,
          trigger_type: 'file_upload',
          trigger_details: fileMetadata,
          status: result.success ? 'success' : 'failed',
          logs: result.logs
        });

      } catch (error) {
        console.error(`Failed to trigger bot ${bot.id}: ${error.message}`);
        triggeredBots.push({
          botId: bot.id,
          botName: bot.name,
          success: false,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      botsTriggered: triggeredBots.length,
      bots: triggeredBots
    });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

/**
 * Upload file to storage
 */
async function uploadFile(file, base44) {
  try {
    const buffer = await file.arrayBuffer();
    const fileBlob = new Blob([buffer], { type: file.type });
    
    const result = await base44.integrations.Core.UploadFile({
      file: fileBlob
    });

    return result.file_url;
  } catch (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Check if directory matches (supports wildcards)
 */
function matchesDirectory(actualDir, configDir) {
  // Exact match
  if (actualDir === configDir) return true;
  
  // Wildcard match
  const regex = new RegExp(`^${configDir.replace(/\*/g, '.*')}$`);
  return regex.test(actualDir);
}

/**
 * Check if file type matches allowed types
 */
function matchesFileType(fileName, allowedTypes) {
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  const allowedExts = allowedTypes.split(',').map(t => t.trim());
  
  return allowedExts.some(ext => {
    if (ext.startsWith('.')) {
      return extension === ext.toLowerCase();
    }
    return extension === `.${ext.toLowerCase()}`;
  });
}