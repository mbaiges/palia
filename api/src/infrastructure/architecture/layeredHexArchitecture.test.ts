import fs from 'fs';
import path from 'path';
import ts from 'typescript';

type Layer = 'domain' | 'application' | 'infrastructure';

const sourceRoot = path.resolve(process.cwd(), 'src');
const layerRoots: Record<Layer, string> = {
  domain: path.join(sourceRoot, 'domain'),
  application: path.join(sourceRoot, 'application'),
  infrastructure: path.join(sourceRoot, 'infrastructure'),
};

function collectProductionFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectProductionFiles(absolutePath);
    if (!/\.tsx?$/.test(entry.name) || /\.(test|spec)\.[^.]+$/.test(entry.name))
      return [];
    return [absolutePath];
  });
}

function getLayer(filePath: string): Layer | undefined {
  return (Object.entries(layerRoots) as [Layer, string][]).find(([, root]) =>
    filePath.startsWith(`${root}${path.sep}`)
  )?.[0];
}

function resolveSourceImport(
  specifier: string,
  importerPath: string
): string | undefined {
  const unresolved = specifier.startsWith('@/')
    ? path.join(sourceRoot, specifier.slice(2))
    : specifier.startsWith('.')
      ? path.resolve(path.dirname(importerPath), specifier)
      : undefined;
  if (!unresolved) return undefined;

  const candidates = [
    unresolved,
    ...['.ts', '.tsx', '.js', '.json'].map(
      extension => `${unresolved}${extension}`
    ),
    ...['index.ts', 'index.tsx', 'index.js'].map(file =>
      path.join(unresolved, file)
    ),
  ];
  return candidates.find(
    candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile()
  );
}

function importedModules(sourceFile: ts.SourceFile): string[] {
  const imports: string[] = [];
  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0]) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === 'require'))
    ) {
      imports.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return imports;
}

function findLayerViolations(): string[] {
  const violations: string[] = [];
  const files = Object.values(layerRoots).flatMap(collectProductionFiles);

  for (const importerPath of files) {
    const importerLayer = getLayer(importerPath);
    if (!importerLayer) continue;

    const sourceFile = ts.createSourceFile(
      importerPath,
      fs.readFileSync(importerPath, 'utf8'),
      ts.ScriptTarget.Latest,
      true
    );
    for (const specifier of importedModules(sourceFile)) {
      const resolved = resolveSourceImport(specifier, importerPath);
      const dependencyLayer = resolved && getLayer(resolved);
      if (!dependencyLayer) continue;

      const allowed =
        importerLayer === 'infrastructure'
          ? ['infrastructure', 'application', 'domain'].includes(
              dependencyLayer
            )
          : importerLayer === 'application'
            ? ['application', 'domain'].includes(dependencyLayer)
            : dependencyLayer === 'domain';

      if (!allowed) {
        violations.push(
          `${path.relative(process.cwd(), importerPath)} -> ${path.relative(sourceRoot, resolved!)}`
        );
      }
    }
  }

  return violations.sort();
}

describe('layered hexagonal architecture', () => {
  it('keeps dependencies pointing inward: infrastructure -> application/domain, application -> domain, domain -> domain', () => {
    const violations = findLayerViolations();
    expect(violations).toEqual([]);
  });
});
