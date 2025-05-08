import axios from 'axios';
import * as cheerio from 'cheerio';

interface Vulnerability {
  name: string;
  score: string;
  affectedVersions: string[];
  sources: { name: string; link: string }[];
}

interface PluginResult {
  slug: string;
  name: string;
  url: string;
  version: string;
  vulnerabilities: Vulnerability[];
}

interface ScanResult {
  plugins: PluginResult[];
}

/**
 * Compares two version strings.
 * @param version1 First version string
 * @param version2 Second version string
 * @returns -1 if version1 < version2, 0 if equal, 1 if version1 > version2
 */
function compareVersions(version1: string, version2: string): number {
  const parts1 = version1.split('.').map(Number);
  const parts2 = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
}

export async function scanSite(siteUrl: string): Promise<ScanResult> {
  try {
    const { data: html } = await axios.get(siteUrl);
    const $ = cheerio.load(html);
    const pluginMap = new Map<string, { version?: string }>();

    // Extract all plugin references from <script> and <link>
    const pluginPromises: Promise<void>[] = [];
    $('script[src], link[href]').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('href');
      const match = src?.match(/\/wp-content\/plugins\/([^\/]+)\/.*?(?:ver=([\d.]+))?/);
      if (match) {
        const slug = match[1] as string;
        let version = match[2] || src?.match(/ver=([\d.]+)/)?.[1];
        
        // Add the promise to the array
        pluginPromises.push((async () => {
          // If we haven't found the version or it's not already in pluginMap, try to extract it from readme.txt
          if ((!version || !pluginMap.has(slug)) && slug) {
            try {
              const readmeUrl = `${siteUrl}/wp-content/plugins/${slug}/readme.txt`;
              const readmeResponse = await axios.get(readmeUrl);
              const readmeContent = readmeResponse.data;
              
              // Look for version in readme.txt (typical format: "Stable tag: X.Y.Z" or "Version: X.Y.Z")
              const versionMatch = readmeContent.match(/(?:Stable tag|Version):\s*([\d.]+)/i);
              if (versionMatch && versionMatch[1]) {
                version = versionMatch[1];
              }
            } catch (error) {
              // Ignore errors in reading readme.txt
            }
          }
          
          if (!pluginMap.has(slug) && slug) {
            pluginMap.set(slug, { version });
          }
        })());
      }
    });
    
    // Wait for all promises to resolve
    await Promise.all(pluginPromises);

    const plugins: PluginResult[] = [];

    for (const [slug, info] of pluginMap) {
      let vulnerabilities: Vulnerability[] = [];
      let name = 'unknown';
      let uri = "null";
      try {
        const res = await axios.get(`https://www.wpvulnerability.net/plugin/${slug}`);
        const data = res.data?.data;
        if( data.name )
          name = data.name;
        if( data.link )
          uri = data.link;
        if (data?.vulnerability?.length) {
          const currentVersion = info.version;

          const relevantVulns = data.vulnerability.filter((vuln: any) => {
            // If we don't have the plugin version, don't include vulnerabilities
            if (!currentVersion) return false;
            return compareVersions(vuln.operator.max_version, currentVersion) >= 0;
          });

          if (relevantVulns.length > 0) {
            vulnerabilities = relevantVulns.map((vuln: any) => ({
              name: vuln.name || 'Unknown',
              score: vuln.impact?.cvss.score || 0,
              affectedVersions: vuln.affected_versions || [],
              sources: (vuln.source || []).map((s: any) => ({ 
                name: s.name, 
                link: s.link 
              })),
            }));
          }
        }
      } catch (e) {
        // Ignore errors in vulnerability check
      }
      
      plugins.push({ slug, vulnerabilities, version: info.version || "0", name: name, url: uri });
    }

    return { plugins };
  } catch (e) {
    // Return empty result on error
    return { plugins: [] };
  }
}