import { test, expect } from '@playwright/test'

test.describe('Duckboard App', () => {
  test('should load the app', async ({ page }) => {
    await page.goto('/')
    
    // Check if the app title is visible
    await expect(page.locator('text=Duckboard')).toBeVisible()
    
    // Check if the loading screen appears and disappears
    await expect(page.locator('text=Initializing DuckDB-WASM')).toBeVisible()
    
    // Wait for the main UI to load
    await expect(page.locator('text=SQL Editor')).toBeVisible()
    await expect(page.locator('text=Results')).toBeVisible()
    await expect(page.locator('text=Charts')).toBeVisible()
  })

  test('should show dataset drawer', async ({ page }) => {
    await page.goto('/')
    
    // Wait for app to load
    await expect(page.locator('text=SQL Editor')).toBeVisible()
    
    // Click datasets button
    await page.click('text=☰ Datasets')
    
    // Check if drawer is visible
    await expect(page.locator('text=Drop CSV or Parquet files here')).toBeVisible()
  })

  test('should switch between panels', async ({ page }) => {
    await page.goto('/')
    
    // Wait for app to load
    await expect(page.locator('text=SQL Editor')).toBeVisible()
    
    // Click Results tab
    await page.click('text=Results')
    await expect(page.locator('text=Results Grid')).toBeVisible()
    
    // Click Charts tab
    await page.click('text=Charts')
    await expect(page.locator('text=Chart Builder')).toBeVisible()
    
    // Click back to SQL Editor
    await page.click('text=SQL Editor')
    await expect(page.locator('text=SQL Editor')).toBeVisible()
  })
})