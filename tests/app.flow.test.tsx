import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { saveAIConfig } from '../lib/aiService';
import { creditLedger } from '../lib/creditLedger';

/**
 * End-user journeys through the real <App/> (offline "mock" provider, no network).
 * Covers: template selection → generation progress → result tabs → code explorer,
 * the store theme flow, credits debit, keyboard command palette and insufficient balance.
 */
describe('Jornadas do usuário no studio', () => {
  beforeEach(() => {
    saveAIConfig({ provider: 'mock' });
  });

  const balance = () => creditLedger.getSnapshot().balance;

  it('gera um Blog e navega pelas abas do resultado', async () => {
    const user = userEvent.setup();
    const before = balance();
    render(<App />);

    expect(screen.getByRole('heading', { name: /do zero ao protótipo/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /gerar terminal cms & blog/i }));

    // Generation screen: progress bar with live status
    expect(await screen.findByRole('heading', { name: /compondo seu projeto/i })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow');
    // Credits are reserved immediately
    expect(balance()).toBeCloseTo(before - 1.2, 5);

    // Result screen (lazy-loaded)
    const tablist = await screen.findByRole('tablist', { name: /seções do projeto gerado/i }, { timeout: 15_000 });
    expect(screen.getByRole('heading', { name: /blog pessoal/i })).toBeInTheDocument();
    expect(within(tablist).getAllByRole('tab')).toHaveLength(5);

    // Code explorer shows nested files (regression for the dropped-children bug)
    await user.click(within(tablist).getByRole('tab', { name: /código/i }));
    const tree = await screen.findByRole('tree', { name: /arquivos do projeto/i });
    await user.type(screen.getByPlaceholderText(/filtrar/i), 'page.tsx');
    const fileButton = (await within(tree).findAllByRole('button', { name: /page\.tsx/i }))[0];
    await user.click(fileButton);
    expect(screen.getByTestId('selected-file-path').textContent).toMatch(/\/page\.tsx$/);

    // Keyboard navigation between tabs (Radix roving focus)
    within(tablist).getByRole('tab', { name: /código/i }).focus();
    await user.keyboard('{ArrowRight}');
    expect(within(tablist).getByRole('tab', { name: /banco de dados/i })).toHaveAttribute('data-state', 'active');

    // New project returns to the start; the run was committed (no refund)
    await user.click(within(screen.getByRole('main')).getByRole('button', { name: /novo projeto/i }));
    expect(await screen.findByRole('heading', { name: /do zero ao protótipo/i })).toBeInTheDocument();
    expect(balance()).toBeCloseTo(before - 1.2, 5);
  }, 30_000);

  it('fluxo da loja: escolhe tema personalizado e mostra o catálogo no preview', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /gerar e-commerce saas/i }));
    expect(await screen.findByRole('heading', { name: /escolha o tema do catálogo/i })).toBeInTheDocument();
    // Stepper shows the extra "Tema" step as current
    expect(screen.getByRole('navigation', { name: /progresso do assistente/i }).querySelector('[aria-current="step"]')?.textContent).toMatch(/tema/i);

    await user.type(screen.getByLabelText(/nicho personalizado/i), 'Relógios suíços');
    await user.click(screen.getByRole('button', { name: /gerar catálogo/i }));

    await screen.findByRole('tablist', { name: /seções do projeto gerado/i }, { timeout: 20_000 });
    expect(screen.getByRole('heading', { name: /loja simples/i })).toBeInTheDocument();
    expect((await screen.findAllByText(/relógios suíços/i)).length).toBeGreaterThan(0);
  }, 40_000);

  it('Ctrl+K abre a paleta de comandos e executa uma ação', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard('{Control>}k{/Control}');
    const input = await screen.findByPlaceholderText(/o que você quer fazer/i);
    await user.type(input, 'templates hub');
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { name: /templates hub/i, level: 1 })).toBeInTheDocument();
  });

  it('bloqueia a geração sem saldo e oferece recarga (sem coletar cartão)', async () => {
    const user = userEvent.setup();
    // Drain the wallet
    const available = balance();
    if (available > 0) creditLedger.commit(creditLedger.reserve(available, 'drain'));
    render(<App />);

    await user.click(screen.getByRole('button', { name: /gerar terminal cms & blog/i }));
    expect(await screen.findByText('Créditos insuficientes')).toBeInTheDocument();
    // Stayed on the selection screen
    expect(screen.getByRole('heading', { name: /do zero ao protótipo/i })).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /adicionar créditos/i })[0]);
    const dialog = await screen.findByRole('dialog', { name: /carteira de créditos/i });
    expect(within(dialog).queryByLabelText(/cartão/i)).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('radio', { name: /starter/i }));
    await user.click(within(dialog).getByRole('button', { name: /adicionar 15 cr/i }));
    await waitFor(() => expect(balance()).toBe(15));
    expect(screen.getByTestId('credit-balance').textContent).toMatch(/15\.0/);
  });
});
