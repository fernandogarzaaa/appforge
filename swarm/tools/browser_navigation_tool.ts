import { z } from 'zod';
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';

export const browserNavigationTool = {
    name: "browser_navigation_tool",
    description: "Launches a headless browser, navigates to a specified URL, and returns a semantic map of the DOM, including interactive elements (buttons, inputs, links) to help the agent understand the UI state.",
    parameters: z.object({
        url: z.string().describe("The URL to navigate to (e.g., http://localhost:5173 or http://localhost:5173/dashboard)."),
        action: z.enum(['scan', 'click', 'type']).describe("The action to perform on the page."),
        selector: z.string().optional().describe("The CSS or text selector of the element to interact with (required for 'click' or 'type')."),
        text: z.string().optional().describe("The text to type (required for 'type')."),
        waitTime: z.number().optional().describe("Optional time to wait (in milliseconds) after an action to allow animations/loads to finish."),
        waitSelector: z.string().optional().describe("A CSS selector to wait for before performing any action or scan.")
    }),
    execute: async (args: { url: string; action: 'scan' | 'click' | 'type'; selector?: string; text?: string; waitTime?: number; waitSelector?: string }) => {
        let browser: Browser | null = null;
        try {
            console.log(`[BrowserTool] Action: ${args.action} on ${args.url}`);
            browser = await chromium.launch({ headless: true });
            const page: Page = await browser.newPage();

            await page.goto(args.url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => {
                console.warn(`[BrowserTool] Navigation timeout or error: ${e.message}. Proceeding anyway.`);
            });

            if (args.waitSelector) {
                console.log(`[BrowserTool] Waiting for selector: ${args.waitSelector} (attached state)`);
                await page.waitForSelector(args.waitSelector, { state: 'attached', timeout: 15000 }).catch(e => {
                    console.warn(`[BrowserTool] Wait for selector timed out: ${e.message}`);
                });
            } else {
                // Wait for SPA hydration/mounting by default
                await page.waitForTimeout(5000);
            }

            // Always take a debug screenshot for the swarm logs
            const screenshotPath = path.join(process.cwd(), 'swarm', 'data', `qa_scan_${Date.now()}.png`);
            await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
            await page.screenshot({ path: screenshotPath });
            console.log(`[BrowserTool] Debug screenshot saved to: ${screenshotPath}`);

            if (args.action === 'click' && args.selector) {
                await page.click(args.selector, { timeout: 5000 });
            } else if (args.action === 'type' && args.selector && args.text) {
                await page.fill(args.selector, args.text, { timeout: 5000 });
            }

            if (args.waitTime) {
                await page.waitForTimeout(args.waitTime);
            } else if (args.action !== 'scan') {
                // Wait a tiny bit by default after interactions
                await page.waitForTimeout(1000);
            }

            // Extract semantic DOM map
            const domMap = await page.evaluate(() => {
                const results: any = {
                    title: document.title,
                    pathname: window.location.pathname,
                    interactables: [],
                    headings: [],
                    bodyText: document.body.innerText.substring(0, 500)
                };

                // Use anonymous functions in forEach to avoid __name injection
                document.querySelectorAll('button, a, input, select, textarea, [role="button"], h1, h2, h3, h4, span').forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    const isVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';

                    if (!isVisible && el.tagName !== 'INPUT') return;

                    const tag = el.tagName.toLowerCase();
                    const text = el.textContent?.trim().substring(0, 100) || '';

                    const data: any = {
                        tag: tag,
                        text: text,
                        id: el.id || undefined,
                        class: typeof el.className === 'string' ? el.className : undefined
                    };

                    if (tag === 'a') data.href = (el as HTMLAnchorElement).href;
                    if (tag === 'input') {
                        data.type = (el as HTMLInputElement).type;
                        data.value = (el as HTMLInputElement).value;
                        data.placeholder = (el as HTMLInputElement).placeholder;
                    }

                    const isInteractable = ['button', 'a', 'input', 'select', 'textarea'].includes(tag) || el.getAttribute('role') === 'button';

                    if (isInteractable && results.interactables.length < 50) {
                        results.interactables.push(data);
                    } else if (tag.startsWith('h') || (tag === 'span' && text.length > 5)) {
                        if (results.headings.length < 30) {
                            results.headings.push(data);
                        }
                    }
                });

                return results;
            });

            await browser.close();

            return JSON.stringify(domMap, null, 2);
        } catch (error: any) {
            if (browser) await browser.close();
            return JSON.stringify({ error: `Browser action failed: ${error.message}` });
        }
    }
};
