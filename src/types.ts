type UnityPackageManifest = {
  name: string;
  version: string;
  description?: string;
  displayName?: string;
  unity?: `${number}.${number}`;
  author?: {
    name: string;
    email?: string;
    url?: string;
  };
  dependencies?: { [key: string]: string };
  hideInEditor?: boolean;
  keywords?: string[];
  license?: string;
  samples: {
    displayName: string;
    description: string;
    path: string;
  }[];
  type?: string;
  unityRelease?: string;
};

type VMPPackageManifest = UnityPackageManifest & {
  url: string;
  vpmDependencies?: { [key: string]: string };
  legacyFolders?: { [key: string]: string };
  legacyFiles?: { [key: string]: string };
  legacyPackages?: string[];
};

type VPMRepoManifest = {
  name: string;
  id: string;
  url: string;
  author: string;
  packages: {
    [key: string]: {
      versions: { [key: string]: VMPPackageManifest };
    };
  };
};

export type { VMPPackageManifest, VPMRepoManifest };
