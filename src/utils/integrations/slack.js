const DEFAULT_USERNAME = 'AppForge';

const sanitizeText = (text) => String(text ?? '').trim();

export const buildSlackPayload = ({
  text,
  username = DEFAULT_USERNAME,
  iconEmoji = ':satellite:',
  blocks,
}) => {
  const payload = {
    text: sanitizeText(text) || 'AppForge notification',
    username,
    icon_emoji: iconEmoji,
  };

  if (Array.isArray(blocks) && blocks.length > 0) {
    payload.blocks = blocks;
  }

  return payload;
};

export const sendSlackWebhook = async ({
  webhookUrl,
  text,
  username,
  iconEmoji,
  blocks,
}) => {
  if (!webhookUrl) {
    throw new Error('Slack webhook URL is required');
  }

  const payload = buildSlackPayload({ text, username, iconEmoji, blocks });

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Slack webhook failed: ${response.status} ${errorText}`.trim());
  }

  return {
    ok: true,
    status: response.status,
  };
};
