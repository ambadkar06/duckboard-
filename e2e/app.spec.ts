import { test, expect } from '@playwright/test'

test.describe('Duckboard App', () => {
  test('should load the app', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // App title (disambiguate from Monaco editor text)
    await expect(page.getByText('Duckboard', { exact: true })).toBeVisible()

    // Wait for the main UI buttons to be visible (robust to fast init)
    await expect(page.getByRole('button', { name: 'SQL Editor' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Results' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Charts' })).toBeVisible()
  })

  test('should show dataset drawer', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for app to load
    await expect(page.getByRole('button', { name: 'SQL Editor' })).toBeVisible()
    
    // Ensure the drawer is visible (it starts open by default). If not, toggle it.
    const drawerContent = page.getByText('Drop CSV or Parquet files here')
    if (!(await drawerContent.isVisible())) {
      await page.getByRole('button', { name: /Datasets/ }).click()
    }
    await expect(drawerContent).toBeVisible()
  })

  test('should switch between panels', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for app to load
    await expect(page.getByRole('button', { name: 'SQL Editor' })).toBeVisible()
    
    // Click Results tab
    const resultsTab = page.getByRole('button', { name: 'Results' })
    await resultsTab.click()
    await expect(resultsTab).toHaveClass(/active/)
    
    // Click Charts tab
    const chartsTab = page.getByRole('button', { name: 'Charts' })
    await chartsTab.click()
    await expect(chartsTab).toHaveClass(/active/)
    
    // Click back to SQL Editor
    const sqlTab = page.getByRole('button', { name: 'SQL Editor' })
    await sqlTab.click()
    await expect(sqlTab).toHaveClass(/active/)
  })
})