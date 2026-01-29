/**
 * Advanced Export Manager
 * Supports multiple export formats: JSON, CSV, XML, YAML, SQL, Markdown
 */

/**
 * Export data to JSON format
 */
export const exportJSON = (data, filename = 'data.json') => {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename, 'application/json');
};

/**
 * Export data to CSV format
 */
export const exportCSV = (data, filename = 'data.csv') => {
  if (!Array.isArray(data)) {
    data = [data];
  }

  const headers = Object.keys(data[0] || {});
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
};

/**
 * Export data to XML format
 */
export const exportXML = (data, filename = 'data.xml', rootElement = 'root') => {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n${objectToXML(data, 2)}</${rootElement}>`;
  downloadFile(xmlContent, filename, 'application/xml');
};

/**
 * Convert object to XML string
 */
function objectToXML(obj, indent = 0) {
  const spaces = ' '.repeat(indent);
  let xml = '';

  if (Array.isArray(obj)) {
    obj.forEach(item => {
      xml += `${spaces}<item>\n${objectToXML(item, indent + 2)}${spaces}</item>\n`;
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      const tagName = key.replace(/[^a-zA-Z0-9_]/g, '_');
      if (Array.isArray(value)) {
        xml += `${spaces}<${tagName}>\n${objectToXML(value, indent + 2)}${spaces}</${tagName}>\n`;
      } else if (typeof value === 'object' && value !== null) {
        xml += `${spaces}<${tagName}>\n${objectToXML(value, indent + 2)}${spaces}</${tagName}>\n`;
      } else {
        const escapedValue = String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
        xml += `${spaces}<${tagName}>${escapedValue}</${tagName}>\n`;
      }
    });
  } else {
    xml = `${spaces}${obj}\n`;
  }

  return xml;
}

/**
 * Export data to YAML format
 */
export const exportYAML = (data, filename = 'data.yaml') => {
  const yaml = objectToYAML(data);
  downloadFile(yaml, filename, 'application/x-yaml');
};

/**
 * Convert object to YAML string
 */
function objectToYAML(obj, indent = 0) {
  const spaces = ' '.repeat(indent);
  let yaml = '';

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      if (typeof item === 'object' && item !== null) {
        yaml += `${spaces}- ${objectToYAML(item, indent + 2).trim()}\n`;
      } else {
        yaml += `${spaces}- ${item}\n`;
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += value.map(item => {
          if (typeof item === 'object' && item !== null) {
            return `${spaces}  - ${objectToYAML(item, indent + 4).trim()}`;
          }
          return `${spaces}  - ${item}`;
        }).join('\n') + '\n';
      } else if (typeof value === 'object' && value !== null) {
        yaml += `${spaces}${key}:\n${objectToYAML(value, indent + 2)}`;
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    });
  } else {
    yaml = `${obj}`;
  }

  return yaml;
}

/**
 * Export data to SQL format
 */
export const exportSQL = (data, tableName = 'table', filename = 'data.sql') => {
  const sql = dataToSQL(data, tableName);
  downloadFile(sql, filename, 'application/sql');
};

/**
 * Convert data to SQL INSERT statements
 */
function dataToSQL(data, tableName = 'table') {
  if (!Array.isArray(data)) {
    data = [data];
  }

  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const columnsList = headers.join(', ');
  
  const insertStatements = data.map(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`;
      }
      if (typeof value === 'boolean') return value ? '1' : '0';
      return value;
    }).join(', ');

    return `INSERT INTO ${tableName} (${columnsList}) VALUES (${values});`;
  });

  return insertStatements.join('\n');
}

/**
 * Export data to Markdown format
 */
export const exportMarkdown = (data, filename = 'data.md') => {
  const markdown = dataToMarkdown(data);
  downloadFile(markdown, filename, 'text/markdown');
};

/**
 * Convert data to Markdown format
 */
function dataToMarkdown(data) {
  if (!Array.isArray(data)) {
    data = [data];
  }

  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const table = [
    '| ' + headers.join(' | ') + ' |',
    '|' + headers.map(() => ' --- ').join('|') + '|',
    ...data.map(row =>
      '| ' + headers.map(header => String(row[header] || '')).join(' | ') + ' |'
    )
  ].join('\n');

  return table;
}

/**
 * Download file helper
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Export formatter selector
 */
export const formatExport = (format) => {
  const formatters = {
    'json': exportJSON,
    'csv': exportCSV,
    'xml': exportXML,
    'yaml': exportYAML,
    'sql': exportSQL,
    'markdown': exportMarkdown
  };

  return formatters[format] || exportJSON;
};

/**
 * Export batch data in multiple formats
 */
export const exportBatch = (data, formats = ['json', 'csv'], baseFilename = 'export') => {
  formats.forEach(format => {
    const formatter = formatExport(format);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${baseFilename}_${timestamp}.${format === 'yaml' ? 'yml' : format}`;
    formatter(data, filename);
  });
};

/**
 * Create advanced export preset
 */
export const createExportPreset = (name, config) => {
  const preset = {
    id: Date.now(),
    name,
    formats: config.formats || ['json'],
    filters: config.filters || {},
    transformations: config.transformations || [],
    schedule: config.schedule || null,
    enabled: config.enabled !== false,
    createdAt: new Date().toISOString()
  };

  // Save to localStorage
  const presets = JSON.parse(localStorage.getItem('appforge_export_presets') || '[]');
  presets.push(preset);
  localStorage.setItem('appforge_export_presets', JSON.stringify(presets));

  return preset;
};

/**
 * Get export presets
 */
export const getExportPresets = () => {
  return JSON.parse(localStorage.getItem('appforge_export_presets') || '[]');
};

/**
 * Execute export preset
 */
export const executeExportPreset = (presetId, data) => {
  const presets = getExportPresets();
  const preset = presets.find(p => p.id === presetId);

  if (!preset) return null;

  // Apply filters
  let filtered = data;
  if (preset.filters && Object.keys(preset.filters).length > 0) {
    filtered = applyFilters(data, preset.filters);
  }

  // Apply transformations
  let transformed = filtered;
  if (preset.transformations && preset.transformations.length > 0) {
    transformed = applyTransformations(transformed, preset.transformations);
  }

  // Export in all formats
  exportBatch(transformed, preset.formats, `preset_${preset.name}`);

  return {
    presetId,
    executedAt: new Date().toISOString(),
    formats: preset.formats,
    itemsExported: Array.isArray(transformed) ? transformed.length : 1
  };
};

/**
 * Apply filters to data
 */
function applyFilters(data, filters) {
  if (!Array.isArray(data)) return data;

  return data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (Array.isArray(value)) {
        return value.includes(item[key]);
      }
      return item[key] === value;
    });
  });
}

/**
 * Apply transformations to data
 */
function applyTransformations(data, transformations) {
  if (!Array.isArray(data)) data = [data];

  return data.map(item => {
    let transformed = { ...item };
    transformations.forEach(trans => {
      if (trans.type === 'rename') {
        transformed[trans.newName] = transformed[trans.oldName];
        delete transformed[trans.oldName];
      } else if (trans.type === 'remove') {
        delete transformed[trans.field];
      } else if (trans.type === 'custom') {
        transformed = trans.fn(transformed);
      }
    });
    return transformed;
  });
}
