import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATE_REGISTRY, loadTemplateFiles } from '../lib/templateLoader';
import { orchestrateGeneration } from '../lib/generatorEngine';
import { PlatformAdapter } from '../lib/platformAdapter';

test('Validação do Motor do ScaffoldEngine e IA', async (t) => {
  await t.test('TEMPLATE_REGISTRY deve conter todos os 3 projetos templates', () => {
    assert.ok(TEMPLATE_REGISTRY.store, 'Deve conter template de store');
    assert.ok(TEMPLATE_REGISTRY.blog, 'Deve conter template de blog');
    assert.ok(TEMPLATE_REGISTRY.travel, 'Deve conter template de travel');

    assert.equal(TEMPLATE_REGISTRY.store.directory, 'templates/store');
    assert.equal(TEMPLATE_REGISTRY.blog.directory, 'templates/blog');
    assert.equal(TEMPLATE_REGISTRY.travel.directory, 'templates/travel');
  });

  await t.test('loadTemplateFiles deve carregar mapas de arquivos válidos', () => {
    const storeFiles = loadTemplateFiles('store');
    assert.ok(Object.keys(storeFiles).length > 5, 'Store deve ter mais de 5 arquivos indexados');
    assert.ok(storeFiles['package.json'], 'Store deve conter package.json');

    const blogFiles = loadTemplateFiles('blog');
    assert.ok(blogFiles['package.json'], 'Blog deve conter package.json');

    const travelFiles = loadTemplateFiles('travel');
    assert.ok(travelFiles['package.json'], 'Travel deve conter package.json');
  });

  await t.test('Orquestração do template blog (SSG) com feedback de steps', async () => {
    const stepsRecorded: number[] = [];
    const result = await orchestrateGeneration('blog', '', (progress) => {
      stepsRecorded.push(progress.stepIndex);
    });

    assert.equal(result.type, 'blog');
    assert.ok(result.files['package.json'], 'Resultado deve conter arquivos flat');
    assert.ok(stepsRecorded.length > 0, 'Deve emitir progresso dos steps');
  });

  await t.test('PlatformAdapter detecta ambiente e exporta com segurança', async () => {
    assert.equal(PlatformAdapter.getPlatform(), 'web-browser');
    assert.equal(PlatformAdapter.isDesktop(), false);

    let zipCalled = false;
    const exportResult = await PlatformAdapter.exportProject(
      'Teste',
      'teste-slug',
      { 'README.md': 'Demo' },
      async () => {
        zipCalled = true;
      }
    );

    assert.equal(exportResult.success, true);
    assert.equal(exportResult.mode, 'browser-download');
    assert.equal(zipCalled, true);
  });
});
