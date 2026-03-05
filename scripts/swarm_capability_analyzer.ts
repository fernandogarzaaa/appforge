import fs from 'fs/promises';
import path from 'path';

const AGENT_REGISTRY = path.resolve(process.cwd(), 'swarm/agent_registry.json');

const REQUIRED_CAPABILITIES = [
  'dependency_upgrades',
  'security_scanning',
  'performance_optimization',
  'test_repair'
] as const;

export type RequiredCapability = (typeof REQUIRED_CAPABILITIES)[number];

export async function findMissingCapabilities(): Promise<RequiredCapability[]> {
  const raw = await fs.readFile(AGENT_REGISTRY, 'utf8').catch(() => '[]');
  const agents = JSON.parse(raw) as Array<{ capabilities?: string[] }>;

  return REQUIRED_CAPABILITIES.filter((capability) => !agents.some((agent) => agent.capabilities?.includes(capability)));
}
