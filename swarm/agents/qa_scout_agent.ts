import { browserNavigationTool } from '../tools/browser_navigation_tool.js';

export class QAScoutAgent {
    constructor() { }

    async scoutRoute(url: string): Promise<any> {
        console.log(`🕵️ [QAScoutAgent] Scouting route: ${url}`);

        try {
            const rawMap = await browserNavigationTool.execute({
                url,
                action: 'scan',
                waitSelector: '#root'
            });

            const parsedMap = JSON.parse(rawMap);

            if (parsedMap.error) {
                console.error(`🕵️ [QAScoutAgent] Tool Error: ${parsedMap.error}`);
                return null;
            }

            console.log(`🕵️ [QAScoutAgent] Page Title: ${parsedMap.title}`);
            console.log(`🕵️ [QAScoutAgent] Discovered ${parsedMap.interactables?.length || 0} interactable elements.`);

            return parsedMap;
        } catch (error) {
            console.error(`🕵️ [QAScoutAgent] Navigation failed:`, error);
            return null;
        }
    }
}
