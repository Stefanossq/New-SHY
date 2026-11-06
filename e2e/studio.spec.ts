import { test, expect, type Page } from '@playwright/test';

// Offline "mock" provider: deterministic, no API key or network needed.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('__e2e_init')) {
      localStorage.clear();
      localStorage.setItem('generator_ai_config', JSON.stringify({ provider: 'mock' }));
      sessionStorage.setItem('__e2e_init', '1');
    }
  });
});

const balanceOf = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('scaffold_credit_ledger_v1') ?? '{"balanceTenths":88}').balanceTenths / 10);

test('jornada completa: loja com tema → resultado → código → export ZIP', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /do zero ao protótipo/i })).toBeVisible();

  await page.getByRole('button', { name: /gerar e-commerce saas/i }).click();
  await expect(page.getByRole('heading', { name: /escolha o tema do catálogo/i })).toBeVisible();
  await page.getByLabel(/nicho personalizado/i).fill('Relógios suíços');
  await page.getByRole('button', { name: /gerar catálogo/i }).click();

  const progress = page.getByRole('progressbar', { name: /progresso da geração/i });
  await expect(progress).toBeVisible();
  await expect(page.getByRole('tablist', { name: /seções do projeto gerado/i })).toBeVisible({ timeout: 30_000 });
  expect(await balanceOf(page)).toBe(7.6);

  // Live preview shows the generated catalogue
  await expect(page.getByText(/relógios suíços/i).first()).toBeVisible();

  // Code explorer with nested files
  await page.getByRole('tab', { name: /código/i }).click();
  await page.getByPlaceholder(/filtrar/i).fill('products.ts');
  await page.getByRole('tree').getByRole('button', { name: /products\.ts/i }).first().click();
  await expect(page.getByTestId('selected-file-path')).toHaveText('convex/products.ts');
  await expect(page.locator('code.hljs')).toContainText('Relógios suíços');

  // Export downloads a real zip
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-button').click()]);
  expect(download.suggestedFilename()).toBe('loja-simples-com-convex.zip');

  // No horizontal overflow on any viewport
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, isMobile ? 'mobile' : 'desktop').toBeLessThanOrEqual(1);
});

test('erro de geração estorna créditos e permite tentar novamente', async ({ page }) => {
  // OpenAI-compatible provider pointed at an intercepted endpoint: 1st call returns
  // malformed JSON (real failure path), the retry returns a valid catalogue.
  await page.addInitScript(() => {
    localStorage.setItem(
      'generator_ai_config',
      JSON.stringify({ provider: 'openai', openaiKey: 'e2e-test-key', openaiEndpoint: 'https://ai.e2e.test/v1', openaiModel: 'e2e' })
    );
  });
  let calls = 0;
  await page.route('https://ai.e2e.test/v1/chat/completions', (route) => {
    calls++;
    const content =
      calls === 1
        ? 'isso não é JSON'
        : JSON.stringify([1, 2, 3, 4].map((i) => ({ name: `Grão ${i}`, price: 10 * i, description: 'd', category: 'Café', stock: i })));
    return route.fulfill({ json: { choices: [{ message: { content } }] } });
  });

  await page.goto('/');
  await page.getByRole('button', { name: /gerar e-commerce saas/i }).click();
  await page.getByRole('button', { name: /café & torrefação/i }).click();

  const error = page.getByRole('alert').filter({ hasText: /estornados/i });
  await expect(error).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('heading', { name: /a geração falhou/i })).toBeVisible();
  expect(await balanceOf(page)).toBe(8.8); // rolled back

  await page.getByRole('button', { name: /tentar novamente/i }).click();
  await expect(page.getByRole('tablist', { name: /seções do projeto gerado/i })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Grão 1').first()).toBeVisible();
  expect(await balanceOf(page)).toBe(7.6); // committed once
  expect(calls).toBe(2);
});

test('teclado: Ctrl+K, navegação e carteira acessível', async ({ page, isMobile }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/o que você quer fazer/i).fill('carteira');
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: /carteira de créditos/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/modo demonstração/i)).toBeVisible();
  await dialog.getByRole('radio', { name: /expert/i }).click();
  await dialog.getByRole('button', { name: /adicionar 150 cr/i }).click();
  await expect(dialog.getByText(/créditos adicionados/i)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(await balanceOf(page)).toBe(158.8);

  if (!isMobile) {
    await expect(page.getByTestId('credit-balance')).toContainText('158.8');
  }

  // Skip link is the first tab stop
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: /pular para o conteúdo/i })).toBeFocused();
});

test('persistência: saldo sobrevive a reload e é consistente entre abas', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /gerar terminal cms & blog/i }).click();
  await expect(page.getByRole('tablist', { name: /seções do projeto gerado/i })).toBeVisible({ timeout: 30_000 });
  await page.reload();
  expect(await balanceOf(page)).toBe(7.6);

  const second = await context.newPage();
  await second.goto('/');
  expect(await balanceOf(second)).toBe(7.6);
  await second.close();
});
