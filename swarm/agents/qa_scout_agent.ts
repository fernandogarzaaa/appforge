import { browserNavigationTool } from '../tools/browser_navigation_tool.js';

export class QAScoutAgent {
    constructor() { }

    async scoutRoutes(urls: string[]): Promise<Record<string, any>> {
        const results: Record<string, any> = {};

        for (const url of urls) {
            console.log(`🕵️ [QAScoutAgent] Scouting route: ${url}`);
            try {
                const rawMap = await browserNavigationTool.execute({
                    url,
                    action: 'scan',
                    waitSelector: '#root'
                });

                const parsedMap = JSON.parse(rawMap);
                if (parsedMap.error) {
                    console.error(`🕵️ [QAScoutAgent] Tool Error for ${url}: ${parsedMap.error}`);
                    continue;
                }

                console.log(`🕵️ [QAScoutAgent] Success: ${parsedMap.title} (${parsedMap.interactables?.length || 0} elements)`);
                results[new URL(url).pathname] = parsedMap;

                // Add a small jittered sleep to prevent overwhelming the local server
                await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
            } catch (error) {
                console.error(`🕵️ [QAScoutAgent] Navigation failed for ${url}:`, error);
            }
        }

        return results;
    }
}
