import React from 'react';
import HelpTooltip from './HelpTooltip';

// Pre-built help content for common features
export const HELP_CONTENT = {
  monitoring_rule: {
    title: 'Monitoring Rule',
    content: 'A rule defines what data to monitor, how often, and what conditions to check for. Create rules for databases, APIs, or custom data sources.'
  },
  alert_threshold: {
    title: 'Alert Threshold',
    content: 'Set the minimum severity level to trigger alerts. Critical alerts always trigger, while low alerts can be filtered based on preferences.'
  },
  anomaly_risk: {
    title: 'Anomaly Risk Score',
    content: 'ML-calculated probability (0-100) that detected pattern is an actual anomaly. Higher scores indicate more confident anomaly detection.'
  },
  confidence_score: {
    title: 'Confidence Score',
    content: 'How confident the ML model is in its prediction (0-100). Helps you understand prediction reliability.'
  },
  prediction_forecast: {
    title: 'Forecast Period',
    content: 'The time range for predictions. 24h for immediate trends, 7d for weekly forecasts, 30d for monthly trends, 90d for longer-term patterns.'
  },
  quiet_hours: {
    title: 'Quiet Hours',
    content: 'Time period when non-critical alerts won\'t be sent. Useful for maintenance windows or personal time. Critical alerts always go through.'
  },
  alert_silencing: {
    title: 'Alert Silencing',
    content: 'Temporarily disable alerts for a specific duration. Use for known issues or maintenance. Alerts resume after the silence period ends.'
  },
  incident_integration: {
    title: 'Incident Management',
    content: 'Automatically create incidents in PagerDuty or OpsGenie. Enables escalation policies and on-call integration with alert system.'
  },
  feedback_widget: {
    title: 'AI Feedback',
    content: 'Rate accuracy and usefulness of AI insights. Your feedback helps train better models and improves future predictions.'
  },
  alert_preference: {
    title: 'Alert Preferences',
    content: 'Control how you receive alerts: email, SMS, Slack, webhook. Set minimum severity, quiet hours, and auto-assignment rules.'
  }
};

// Component wrapper to add help to any label
export function HelpLabel({ labelKey, children }) {
  const help = HELP_CONTENT[labelKey];
  
  if (!help) return children;

  return (
    <div className="flex items-center gap-2">
      {children}
      <HelpTooltip content={help.content} title={help.title} />
    </div>
  );
}

export default HelpTooltip;