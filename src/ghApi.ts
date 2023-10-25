import CustomCache from './cache.ts';
import env from './env.ts';

const apiEndPoint = new URL('https://api.github.com');

const textDecoder = new TextDecoder();

const getTags = function (owner: string, repo: string): Promise<string[]> {
  const url = new URL(`/repos/${owner}/${repo}/tags`, apiEndPoint);

  const headers = new Headers({
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  });
  if (typeof env.apiToken === 'string') {
    headers.append('Authorization', `Bearer ${env.apiToken}`);
  }

  return fetch(url, { headers })
    .then((res) => {
      if (!res.ok) {
        throw Error(`Failed to fetch tags: ${res.status}`);
      }
      return res;
    })
    .then((res) => {
      return res.text();
    }).then((body) => {
      const result = JSON.parse(body) as Required<{ name: string }>[];
      return result.map((tag) => tag.name);
    });
};

type ReleasesAPIResponse = Required<{
  tag_name: string;
  assets: Required<{ name: string; browser_download_url: string }>[];
}>[];
const getPkgReleases = async function (
  owner: string,
  repo: string,
): Promise<Map<string, string>> {
  const url = new URL(`/repos/${owner}/${repo}/releases`, apiEndPoint);
  const headers = new Headers({
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  });
  if (typeof env.apiToken === 'string') {
    headers.append('Authorization', `Bearer ${env.apiToken}`);
  }

  const result = await fetch(url, { headers })
    .then((res) => {
      if (!res.ok) {
        throw Error(`Failed to fetch tags: ${res.status}`);
      }
      return res;
    })
    .then((res) => {
      return res.text();
    }).then((body) => {
      return JSON.parse(body) as ReleasesAPIResponse;
    });

  const map = new Map<string, string>();
  result
    .map((result) => ({
      tag: result.tag_name,
      zip: result.assets.find((v) => v.name.endsWith('.zip'))
        ?.browser_download_url,
    }))
    .forEach((release) => {
      if (typeof release.zip === 'string') {
        map.set(release.tag, release.zip);
      }
    });

  return map;
};

const getFileContent = async function (
  owner: string,
  repo: string,
  ref: string,
  path: string,
  cache?: CustomCache,
): Promise<string> {
  if (!path.startsWith('/')) {
    throw Error('path must start with "/".');
  }
  const url = new URL(
    `https://raw.githubusercontent.com/${owner}/${repo}/${ref}${path}`,
  );

  if (cache !== undefined) {
    const cached = await cache.get(url.href);
    if (cached !== null) {
      return textDecoder.decode(cached);
    }
  }

  const res = await fetch(url).then((res) => {
    if (!res.ok) {
      throw Error(`Failed to fetch tags: ${res.status}`);
    }
    return res;
  });
  const body = await res.text();

  if (cache !== undefined) {
    await cache.set(url.href, body);
  }

  return body;
};

export { getFileContent, getPkgReleases, getTags };
