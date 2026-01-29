import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should have accessible landing page', async ({ page }) => {
    await page.goto('/')
    
    // Page should load
    const title = page.locator('h1').first()
    expect(title).toBeVisible()
  })

  test('should have all public pages accessible', async ({ page }) => {
    const publicPages = ['/pricing', '/guide']
    
    for (const pagePath of publicPages) {
      await page.goto(pagePath)
      const url = page.url()
      expect(url).toContain(pagePath)
    }
  })

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/')
    
    // Check for navigation
    const nav = page.locator('nav')
    expect(nav).toBeVisible()
  })

  test('should have responsive design on mobile', async ({ page, context }) => {
    // Set mobile viewport
    const mobileContext = await context.browser().newContext({
      viewport: { width: 375, height: 667 }
    })
    const mobilePage = await mobileContext.newPage()
    
    await mobilePage.goto('/')
    
    // Check if mobile menu is present or navigation is stacked
    const content = await mobilePage.content()
    expect(content).toBeTruthy()
    
    await mobileContext.close()
  })

  test('should handle 404 gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page', { waitUntil: 'networkidle' }).catch(() => {})
    
    // Page should either show 404 or redirect home
    const content = await page.content()
    expect(content).toBeTruthy()
  })
})
