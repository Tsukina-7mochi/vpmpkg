import { AsyncCustomCache, CustomCache, NoCache } from './cache.ts';

class FetchError extends Error {}

const apiEndPoint = new URL('https://api.github.com');
const textDecoder = new TextDecoder();

const getTags = async function (
  owner: string,
  repo: string,
  apiToken?: string | null,
  cache: CustomCache<Uint8Array> | AsyncCustomCache<Uint8Array> = new NoCache(),
): Promise<string[]> {
  const url = new URL(`/repos/${owner}/${repo}/tags`, apiEndPoint);

  const headers = new Headers({
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  });
  if (typeof apiToken === 'string') {
    headers.append('Authorization', `Bearer ${apiToken}`);
  }

  const body = await cache.getOrElse(url.href, async () => {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new FetchError(`Failed to fetch tags: ${res.status}`);
    }
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  });
  const result = JSON.parse(textDecoder.decode(body)) as Required<
    { name: string }
  >[];

  return result.map((tag) => tag.name);
};

type ReleasesAPIResponse = Required<{
  tag_name: string;
  assets: Required<{ name: string; browser_download_url: string }>[];
}>[];
const getPkgReleases = async function (
  owner: string,
  repo: string,
  apiToken?: string | null,
  cache: CustomCache<Uint8Array> | AsyncCustomCache<Uint8Array> = new NoCache(),
): Promise<Map<string, string>> {
  const url = new URL(`/repos/${owner}/${repo}/releases`, apiEndPoint);
  const headers = new Headers({
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  });
  if (typeof apiToken === 'string') {
    headers.append('Authorization', `Bearer ${apiToken}`);
  }

  const body = await cache.getOrElse(url.href, async () => {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new FetchError(`Failed to fetch releases: ${res.status}`);
    }
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  });
  const result = JSON.parse(textDecoder.decode(body)) as ReleasesAPIResponse;

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
  cache: CustomCache<Uint8Array> | AsyncCustomCache<Uint8Array> = new NoCache(),
): Promise<string> {
  if (!path.startsWith('/')) {
    throw Error('path must start with "/".');
  }
  const url = new URL(
    `https://raw.githubusercontent.com/${owner}/${repo}/${ref}${path}`,
  );

  const body = await cache.getOrElse(url.href, async () => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new FetchError(`Failed to fetch file content: ${res.status}`);
    }
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  });
  return textDecoder.decode(body);
};

export { FetchError, getFileContent, getPkgReleases, getTags };
