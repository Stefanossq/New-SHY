import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TEMPLATE_REGISTRY, loadTemplateFiles } from '../lib/templateLoader';
import { orchestrateGeneration, getLifecycleSteps, STORE_AI_STEPS } from '../lib/generatorEngine';
import { PlatformAdapter } from '../lib/platformAdapter';
import { saveAIConfig } from '../lib/aiService';

describe('Motor do ScaffoldEngine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('TEMPLATE_REGISTRY contém os 3 templates com diretórios corretos', () => {
    expect(TEMPLATE_REGISTRY.store.directory).toBe('templates/store');
    expect(TEMPLATE_REGISTRY.blog.directory).toBe('templates/blog');
    expect(TEMPLATE_REGISTRY.travel.directory).toBe('templates/travel');
  });

  it('loadTemplateFiles carrega mapas de arquivos válidos', () => {
    expect(Object.keys(loadTemplateFiles('store')).length).toBeGreaterThan(5);
    for (const type of ['store', 'blog', 'travel'] as const) {
      expect(loadTemplateFiles(type)['package.json'], type).toBeTruthy();
    }
  });

  it('getLifecycleSteps é a fonte única dos passos (store inclui etapas de IA)', () => {
    expect(getLifecycleSteps('blog')).toEqual(TEMPLATE_REGISTRY.blog.lifecycle);
    expect(getLifecycleSteps('store').slice(0, STORE_AI_STEPS.length)).toEqual([...STORE_AI_STEPS]);
  });

  it('orquestra o blog emitindo progresso sequencial', async () => {
    const steps: number[] = [];
    const result = await orchestrateGeneration('blog', '', (p) => p.status === 'success' && steps.push(p.stepIndex), { stepDelayMs: 0 });
    expect(result.type).toBe('blog');
    expect(result.files['package.json']).toBeTruthy();
    expect(steps).toEqual(getLifecycleSteps('blog').map((_, i) => i));
  });

  it('orquestra a loja no modo offline (mock) com produtos e imagens', async () => {
    saveAIConfig({ provider: 'mock' });
    const messages: string[] = [];
    const result = await orchestrateGeneration('store', 'Café especial', (p) => messages.push(p.message), { stepDelayMs: 0 });
    expect(result.files['convex/products.ts']).toContain('Café especial');
    expect(Object.keys(result.files).filter((k) => k.startsWith('public/images/product_'))).toHaveLength(4);
    expect(messages.some((m) => m.includes('4 imagens geradas'))).toBe(true);
    // Copy-on-write: generation must not leak into the shared template registry.
    expect(TEMPLATE_REGISTRY.store.files['public/images/product_0.png']).toBeUndefined();
  });

  it('reporta o erro na etapa que realmente falhou', async () => {
    saveAIConfig({ provider: 'mock' });
    const ai = await import('../lib/aiService');
    const spy = vi.spyOn(ai.AIService, 'generateImage').mockRejectedValueOnce(new Error('boom'));
    const events: { stepIndex: number; status: string }[] = [];
    await expect(orchestrateGeneration('store', 'x', (p) => events.push(p), { stepDelayMs: 0 })).rejects.toThrow('boom');
    expect(events.at(-1)).toMatchObject({ status: 'error', stepIndex: 2 });
    spy.mockRestore();
  });

  it('PlatformAdapter detecta navegador e exporta via ZIP', async () => {
    expect(PlatformAdapter.getPlatform()).toBe('web-browser');
    let zipCalled = false;
    const res = await PlatformAdapter.exportProject('Teste', 'teste', { 'README.md': 'Demo' }, async () => {
      zipCalled = true;
    });
    expect(res).toMatchObject({ success: true, mode: 'browser-download' });
    expect(zipCalled).toBe(true);
  });
});
