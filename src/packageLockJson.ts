export interface IPackageLockJson {
  name: string;
  version: string;
  lockfileVersion: number;
  packages: {
    [key: string]: {
      version: string;
      resolved: string;
      integrity: string;
      dependencies?: {
        [key: string]: string;
      };
    };
  };
}

export const DEFAULT_LOCK_FILE: IPackageLockJson = {
  name: "my-package",
  version: "1.0.0",
  lockfileVersion: 1,
  packages: {},
};

/**
 * Adds or updates module package info in lockfile
 *
 * @param lockFile Lockfile to update with new package info
 * @param packageInfo Response JSON from call to npm registry for package info
 */
export function addPackageToLock(lockFile: IPackageLockJson, packageInfo: any) {
  lockFile.packages[`node_modules/${packageInfo.name}`] = {
    version: packageInfo.version,
    resolved: packageInfo.dist.tarball,
    integrity: packageInfo.dist.integrity,
    dependencies: packageInfo.dependencies || {}, // Not exactly right. Key shouldn't exist if no dependencies.
  };
}
