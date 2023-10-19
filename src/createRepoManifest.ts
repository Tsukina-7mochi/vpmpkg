import CustomCache from './cache.ts';
import * as ghAPI from './ghApi.ts';
import { VMPPackageManifest, VPMRepoManifest } from './types.ts';

const isFulfilled = <T>(
  promise: PromiseSettledResult<T>,
): promise is PromiseSettledResult<T> & { status: 'fulfilled' } => {
  return promise.status === 'fulfilled';
};

const createRepoManifest = async function (
  owner: string,
  repo: string,
  pkgManifestPath: string,
  pkgId: string,
  manifestUrl: string,
  cache?: CustomCache
): Promise<VPMRepoManifest> {
  const tags = await ghAPI.getTags(owner, repo);
  const pkgManifestPromises = tags.map((tag) =>
    ghAPI.getFileContent(owner, repo, tag, pkgManifestPath, cache)
  );
  const pkgManifestResults = await Promise.allSettled(pkgManifestPromises);
  const pkgManifests = pkgManifestResults
    .filter(isFulfilled)
    .map((result) => JSON.parse(result.value) as VMPPackageManifest);

  if (pkgManifests.length === 0) {
    throw Error('Cannot fetch any package.json');
  }

  const pkgVersions: Record<string, VMPPackageManifest> = {};
  for (const manifest of pkgManifests) {
    pkgVersions[manifest.version] = {
      ...manifest,
      name: pkgId,
    };
  }

  return {
    name: `${owner}/${repo}`,
    id: `net.ts7m.vpmpkg.${owner}.${repo}`,
    url: manifestUrl,
    author: owner,
    packages: {
      [pkgId]: {
        versions: pkgVersions,
      },
    },
  };
};

export default createRepoManifest;
