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
  const releases = await ghAPI.getPkgReleases(owner, repo);
  const tags = [...releases.keys()];
  const pkgManifestPromises = tags.map((tag) =>
    ghAPI.getFileContent(owner, repo, tag, pkgManifestPath, cache)
      .then((v) => [tag, v] as const)
  );
  const pkgManifestResults = await Promise.allSettled(pkgManifestPromises);
  const pkgManifests = pkgManifestResults
    .filter(isFulfilled)
    .map((result) => {
      const manifest = JSON.parse(result.value[1]) as VMPPackageManifest;
      return [result.value[0], manifest] as const;
    });

  if (pkgManifests.length === 0) {
    throw Error('Cannot fetch any package.json');
  }

  const pkgVersions: Record<string, VMPPackageManifest> = {};
  for (const [tag, manifest] of pkgManifests) {
    pkgVersions[manifest.version] = {
      ...manifest,
      name: pkgId,
      url: releases.get(tag)!,
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
