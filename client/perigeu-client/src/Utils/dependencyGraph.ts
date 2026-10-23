import type { Script } from "../Types/Script";

export type DependencyPreview = {
    order: Script[];
    layers: Script[][];
    missing: string[];
    hasCycle: boolean;
};

export function buildScriptIndex(scripts: Script[]): Map<number, Script> {
    return new Map(scripts.map((script) => [script.id, script]));
}

function getDirectDependencies(script: Script, index: Map<number, Script>): Script[] {
    const localDependencies = script.dependencies ?? [];
    if (localDependencies.length > 0) {
        return localDependencies;
    }

    return index.get(script.id)?.dependencies ?? [];
}

export function resolveDependencyPreview(roots: Script[], index: Map<number, Script>): DependencyPreview {
    const order: Script[] = [];
    const layers: Script[][] = [];
    const missing = new Set<string>();
    const resolved = new Set<number>();
    const resolving = new Set<number>();
    const levelById = new Map<number, number>();
    let hasCycle = false;

    const visit = (script: Script) => {
        const canonical = index.get(script.id) ?? script;

        if (resolved.has(canonical.id)) {
            return;
        }

        if (resolving.has(canonical.id)) {
            hasCycle = true;
            return;
        }

        let level = 0;
        resolving.add(canonical.id);

        for (const dependency of getDirectDependencies(canonical, index)) {
            const resolvedDependency = index.get(dependency.id) ?? dependency;
            if (!resolvedDependency) {
                missing.add(dependency.key || dependency.descricao || `#${dependency.id}`);
                continue;
            }
            visit(resolvedDependency);
            level = Math.max(level, (levelById.get(resolvedDependency.id) ?? 0) + 1);
        }

        resolving.delete(canonical.id);
        resolved.add(canonical.id);
        levelById.set(canonical.id, level);
        order.push(canonical);

        if (!layers[level]) {
            layers[level] = [];
        }
        if (!layers[level].some((entry) => entry.id === canonical.id)) {
            layers[level].push(canonical);
        }
    };

    for (const root of roots) {
        visit(root);
    }

    return {
        order,
        layers,
        missing: Array.from(missing),
        hasCycle,
    };
}
