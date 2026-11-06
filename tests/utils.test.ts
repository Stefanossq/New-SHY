import { describe, it, expect } from 'vitest';
import { buildFileTree, countFiles, sanitizeRelativePath, base64ToBytes } from '../lib/utils';
import { buildProjectZip } from '../lib/generateProject';
import { createConvexProductsContent } from '../lib/templates';
import { getDatabaseSchema, DATABASE_ENGINES } from '../lib/databaseSchemas';
import { getFileLanguage, highlightCode } from '../lib/highlight';

describe('buildFileTree', () => {
  const files = {
    'README.md': '# hi',
    'src/app/page.tsx': 'export default 1',
    'src/app/layout.tsx': 'layout',
    'src/lib/util.ts': 'u',
    'public/images/a.png': { base64: 'AAAA' },
    'public/.placeholder': '',
    'package.json': '{}',
  };

  it('keeps files nested below the first level (regression: they were dropped)', () => {
    const tree = buildFileTree(files);
    expect(countFiles(tree)).toBe(6);
    const src = tree.find((n) => n.name === 'src')!;
    const app = src.children!.find((n) => n.name === 'app')!;
    expect(app.children!.map((n) => n.name)).toEqual(['layout.tsx', 'page.tsx']);
    expect(app.children![1].path).toBe('src/app/page.tsx');
    expect(app.children![1].content).toBe('export default 1');
  });

  it('sorts folders before files and maps binary content', () => {
    const tree = buildFileTree(files);
    expect(tree.map((n) => n.name)).toEqual(['public', 'src', 'package.json', 'README.md']);
    const img = tree[0].children![0].children![0];
    expect(img).toMatchObject({ name: 'a.png', base64Content: 'AAAA' });
  });

  it('handles empty / invalid input', () => {
    expect(buildFileTree({})).toEqual([]);
    expect(buildFileTree(null as any)).toEqual([]);
  });
});

describe('sanitizeRelativePath (path traversal guard)', () => {
  it.each([
    ['src/app/page.tsx', 'src/app/page.tsx'],
    ['./src//a.ts', 'src/a.ts'],
    ['src\\win\\file.ts', 'src/win/file.ts'],
  ])('accepts %s', (input, expected) => expect(sanitizeRelativePath(input)).toBe(expected));

  it.each(['../evil.sh', 'a/../../etc/passwd', '/etc/passwd', 'C:/Windows/x', '', 'a\0b'])('rejects %j', (input) =>
    expect(sanitizeRelativePath(input)).toBeNull()
  );
});

describe('buildProjectZip', () => {
  it('writes text and binary files and skips placeholders', async () => {
    const zip = await buildProjectZip({ 'a/b.txt': 'hello', 'img.png': { base64: btoa('PNG') }, 'x/.placeholder': '' });
    expect(Object.keys(zip.files).filter((k) => !zip.files[k].dir).sort()).toEqual(['a/b.txt', 'img.png']);
    expect(await zip.file('a/b.txt')!.async('string')).toBe('hello');
    expect(await zip.file('img.png')!.async('string')).toBe('PNG');
  });

  it('is all-or-nothing: an unsafe path aborts the whole archive', async () => {
    await expect(buildProjectZip({ 'ok.txt': 'x', '../escape.txt': 'y' })).rejects.toThrow(/inseguro/);
  });

  it('decodes base64 to bytes', () => {
    expect(Array.from(base64ToBytes(btoa('AB')))).toEqual([65, 66]);
  });
});

describe('createConvexProductsContent', () => {
  it('escapes quotes, backslashes and newlines from AI output into valid JS', () => {
    const code = createConvexProductsContent(
      [{ name: "Caf\u00e9 d'Or \\ Premium", price: '19.9' as any, description: 'linha1\nlinha2', category: 'Bebidas', stock: 3.7 }],
      ['/images/product_0.png']
    );
    const literal = code.slice(code.indexOf('const initialProducts = [') + 'const initialProducts = '.length, code.indexOf('];', code.indexOf('const initialProducts')) + 1);
    // eslint-disable-next-line no-new-func
    const parsed = new Function(`return ${literal}`)();
    expect(parsed[0]).toEqual({
      name: "Café d'Or \\ Premium",
      price: 19.9,
      description: 'linha1\nlinha2',
      category: 'Bebidas',
      stock: 3,
      imageUrl: '/images/product_0.png',
    });
  });
});

describe('databaseSchemas & highlight', () => {
  it('returns a non-empty schema for every project type × engine', () => {
    for (const type of ['store', 'blog', 'travel'] as const) {
      for (const { id } of DATABASE_ENGINES) {
        expect(getDatabaseSchema(type, id).length, `${type}/${id}`).toBeGreaterThan(50);
      }
    }
  });

  it('maps extensions and escapes HTML while highlighting', () => {
    expect(getFileLanguage('page.tsx')).toBe('typescript');
    expect(getFileLanguage('schema.sql')).toBe('sql');
    expect(getFileLanguage('Dockerfile')).toBe('plaintext');
    const html = highlightCode('const a = "<script>";', 'typescript');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
