/**
 * @file Remote Template Registry Service
 * Fetches dynamic templates, blueprints, and assets on-demand from remote repositories (GitHub/CDN).
 * Operates with offline fallbacks to ensure 100% reliability.
 */

export interface RemoteTemplateManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  repoOwner: string;
  repoName: string;
  branch: string;
  blueprintUrl?: string;
  injectionPoints: {
    filePath: string;
    strategy: string;
    marker: string;
  }[];
}

export interface RemoteRegistryCatalog {
  version: string;
  updatedAt: string;
  templates: RemoteTemplateManifest[];
}

// Built-in registry catalog for dynamic on-demand resolution
export const DEFAULT_REMOTE_CATALOG: RemoteRegistryCatalog = {
  version: "1.0.0",
  updatedAt: "2026-10-01T00:00:00Z",
  templates: [
    {
      id: "convex-store-v1",
      name: "E-Commerce Next.js + Convex",
      version: "1.3.0",
      description: "Template desacoplado para e-commerce com backend em tempo real",
      repoOwner: "saas-orchestration",
      repoName: "template-ecommerce-convex",
      branch: "main",
      injectionPoints: [
        { filePath: "convex/products.ts", strategy: "replace-catalog", marker: "/* __AI_PRODUCTS_INJECTION_POINT__ */" },
        { filePath: "src/theme.json", strategy: "palette", marker: "__AI_THEME_COLORS__" }
      ]
    },
    {
      id: "blog-cli-v2",
      name: "Developer CLI Terminal Blog",
      version: "2.1.0",
      description: "Template desacoplado para blog técnico minimalista",
      repoOwner: "saas-orchestration",
      repoName: "template-nextjs-blog-cli",
      branch: "main",
      injectionPoints: [
        { filePath: "src/posts.json", strategy: "replace-articles", marker: "\"/* __AI_POSTS_INJECTION_POINT__ */\"" }
      ]
    },
    {
      id: "travel-planner-v1",
      name: "AI Travel Planner Dashboard",
      version: "1.1.0",
      description: "Template desacoplado para planejamento de roteiros turísticos",
      repoOwner: "saas-orchestration",
      repoName: "template-travel-planner-pure",
      branch: "main",
      injectionPoints: [
        { filePath: "src/itineraries.ts", strategy: "replace-trips", marker: "/* __AI_ITINERARY_INJECTION_POINT__ */" }
      ]
    }
  ]
};

export class RemoteRegistryService {
  private static catalogCache: RemoteRegistryCatalog | null = null;

  /**
   * Fetches the latest template catalog from a remote URL or GitHub,
   * with immediate fallback to default catalog if offline.
   */
  static async fetchCatalog(customIndexUrl?: string): Promise<RemoteRegistryCatalog> {
    if (this.catalogCache) {
      return this.catalogCache;
    }

    if (!customIndexUrl) {
      this.catalogCache = DEFAULT_REMOTE_CATALOG;
      return DEFAULT_REMOTE_CATALOG;
    }

    try {
      const response = await fetch(customIndexUrl, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Catalog fetch failed: HTTP ${response.status}`);
      }
      const remoteData = await response.json();
      this.catalogCache = remoteData;
      return remoteData;
    } catch (err) {
      console.warn("Using offline fallback catalog due to connection error:", err);
      this.catalogCache = DEFAULT_REMOTE_CATALOG;
      return DEFAULT_REMOTE_CATALOG;
    }
  }

  /**
   * Fetches raw file tree from a GitHub repository's main branch.
   */
  static async fetchTemplateFilesFromGithub(
    owner: string,
    repo: string,
    branch = "main",
    authToken?: string
  ): Promise<{ files: Record<string, string>; blueprint?: any } | null> {
    try {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
      };
      if (authToken) {
        headers.Authorization = `token ${authToken}`;
      }

      // Fetch git tree recursively
      const treeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        { headers }
      );

      if (!treeRes.ok) {
        throw new Error(`Failed to fetch repo tree: HTTP ${treeRes.status}`);
      }

      const treeData = await treeRes.json();
      const files: Record<string, string> = {};

      // Filter only blobs (files)
      const blobEntries = (treeData.tree || []).filter((item: any) => item.type === "blob");

      for (const item of blobEntries) {
        // Fetch raw file content
        const rawRes = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`
        );
        if (rawRes.ok) {
          files[item.path] = await rawRes.text();
        }
      }

      let blueprint = null;
      if (files["blueprint.json"]) {
        try {
          blueprint = JSON.parse(files["blueprint.json"]);
        } catch {
          // ignore parsing error
        }
      }

      return { files, blueprint };
    } catch (err) {
      console.warn(`Could not fetch remote template from ${owner}/${repo}:`, err);
      return null;
    }
  }
}
