declare module '@playwright/test' {
  export interface Page {
    goto(url: string): Promise<any>;
    click(selector: string): Promise<void>;
    fill(selector: string, text: string): Promise<void>;
    waitForSelector(selector: string): Promise<void>;
  }

  export interface TestContext {
    skip(): void;
  }

  export function test(name: string, fn: (context: TestContext) => Promise<void>): void;
}
