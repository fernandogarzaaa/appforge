/**
 * Report Generator Service
 * Generate PDF/CSV/JSON reports with charts
 */

import PDFDocument from 'pdfkit';

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildChartConfig = (label, series) => ({
  type: 'line',
  data: {
    labels: series.map(point => point.bucket || point.label || ''),
    datasets: [
      {
        label,
        data: series.map(point => safeNumber(point.value ?? point.totalRequests ?? point.avgLatencyMs)),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        tension: 0.3
      }
    ]
  },
  options: {
    plugins: {
      legend: { display: true }
    },
    scales: {
      y: { beginAtZero: true }
    }
  }
});

const fetchChartImage = async (chartConfig) => {
  const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Chart rendering failed: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const buildCsv = (report) => {
  const lines = [];
  lines.push('section,key,value');

  Object.entries(report.summary || {}).forEach(([key, value]) => {
    lines.push(`summary,${key},${JSON.stringify(value)}`);
  });

  Object.entries(report.metrics || {}).forEach(([section, data]) => {
    lines.push(`metrics,${section},${JSON.stringify(data)}`);
  });

  Object.entries(report.predictions || {}).forEach(([key, value]) => {
    lines.push(`predictions,${key},${JSON.stringify(value)}`);
  });

  return lines.join('\n');
};

const buildPdf = async (report) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const chunks = [];

  doc.on('data', chunk => chunks.push(chunk));

  doc.fontSize(20).text(report.title || 'Analytics Report', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('gray').text(`Generated: ${report.generatedAt}`);
  doc.moveDown();

  doc.fillColor('black').fontSize(14).text('Summary');
  doc.moveDown(0.5);

  Object.entries(report.summary || {}).forEach(([key, value]) => {
    doc.fontSize(11).text(`${key}: ${JSON.stringify(value)}`);
  });

  doc.moveDown();
  doc.fontSize(14).text('Key Metrics');
  doc.moveDown(0.5);

  Object.entries(report.metrics || {}).forEach(([section, value]) => {
    doc.fontSize(12).text(section);
    doc.fontSize(10).text(JSON.stringify(value));
    doc.moveDown(0.5);
  });

  if (report.charts?.length) {
    doc.addPage();
    doc.fontSize(14).text('Charts');
    doc.moveDown();

    for (const chart of report.charts) {
      try {
        const image = await fetchChartImage(chart.config);
        doc.fontSize(12).text(chart.title);
        doc.image(image, { fit: [500, 260], align: 'center' });
        doc.moveDown();
      } catch (error) {
        doc.fontSize(10).fillColor('red').text(`Chart failed: ${error.message}`);
        doc.fillColor('black');
      }
    }
  }

  if (report.predictions) {
    doc.addPage();
    doc.fontSize(14).text('Predictions');
    doc.moveDown(0.5);
    doc.fontSize(10).text(JSON.stringify(report.predictions, null, 2));
  }

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
};

export const generateReport = async ({
  title,
  summary,
  metrics,
  predictions,
  charts = [],
  format = 'pdf'
}) => {
  const report = {
    title,
    summary,
    metrics,
    predictions,
    charts,
    generatedAt: new Date().toISOString()
  };

  if (format === 'json') {
    return {
      contentType: 'application/json',
      buffer: Buffer.from(JSON.stringify(report, null, 2)),
      extension: 'json'
    };
  }

  if (format === 'csv') {
    const csv = buildCsv(report);
    return {
      contentType: 'text/csv',
      buffer: Buffer.from(csv),
      extension: 'csv'
    };
  }

  const pdf = await buildPdf({
    ...report,
    charts: charts.map(chart => ({
      ...chart,
      config: chart.config || buildChartConfig(chart.title, chart.series || [])
    }))
  });

  return {
    contentType: 'application/pdf',
    buffer: pdf,
    extension: 'pdf'
  };
};

export const buildDefaultCharts = ({ usageSeries = [], latencySeries = [] }) => {
  return [
    {
      title: 'Usage Trends',
      series: usageSeries.map(point => ({
        bucket: point.bucket,
        value: point.totalRequests
      })),
      config: buildChartConfig('Requests', usageSeries.map(point => ({
        bucket: point.bucket,
        value: point.totalRequests
      })))
    },
    {
      title: 'Latency Trends',
      series: latencySeries.map(point => ({
        bucket: point.bucket,
        value: point.avgLatencyMs
      })),
      config: buildChartConfig('Latency (ms)', latencySeries.map(point => ({
        bucket: point.bucket,
        value: point.avgLatencyMs
      })))
    }
  ];
};
