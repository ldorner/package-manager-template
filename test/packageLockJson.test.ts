import { describe, it } from "node:test";
import {
  addPackageToLock,
  DEFAULT_LOCK_FILE,
  IPackageLockJson,
} from "../src/packageLockJson.js";
import assert from "node:assert";

describe("addPackageToLock", () => {
  const SAMPLE_RESPONSE = JSON.parse(
    JSON.stringify({
      objects: [
        {
          package: {
            name: "is-thirteen",
            version: "0.1.13",
            links: { npm: "https://www.npmjs.com/package/is-thirteen" },
            publisher: { username: "dev" },
          },
        },
      ],
    }),
  );

  function checkResult(lockfile: IPackageLockJson) {
    const info = lockfile.packages["node_modules/@dev/is-thirteen"];
    assert.strictEqual(info.version, "0.1.13");
    assert.strictEqual(
      info.resolved,
      "https://www.npmjs.com/package/is-thirteen",
    );
    assert.strictEqual(info.integrity, "");
    assert.deepStrictEqual(info.dependencies, {});
  }

  describe("When the lockfile is the default", () => {
    it("should add a package to the lockfile", () => {
      const lockfile = { ...DEFAULT_LOCK_FILE };
      addPackageToLock(lockfile, SAMPLE_RESPONSE);
      checkResult(lockfile);
    });
  });

  describe("When the lockfile doesn't yet have an entry for this package  ", () => {
    it("should add a package to the lockfile", () => {
      const lockfile = { ...DEFAULT_LOCK_FILE };
      const otherPackageInfo = {
        version: "1.0",
        resolved: "something",
        integrity: "",
        dependencies: {},
      };
      lockfile.packages["node_modules/@johndoe/is-fifteen"] = otherPackageInfo;
      addPackageToLock(lockfile, SAMPLE_RESPONSE);
      checkResult(lockfile);
      assert.deepStrictEqual(
        lockfile.packages["node_modules/@johndoe/is-fifteen"],
        otherPackageInfo,
      );
    });
  });

  describe("When the lockfile already has an entry for this package  ", () => {
    it("should update the version of the package", () => {
      const lockfile = { ...DEFAULT_LOCK_FILE };
      lockfile.packages["node_modules/@dev/is-thirteen"].version = "0.1.12";
      addPackageToLock(lockfile, SAMPLE_RESPONSE);
      checkResult(lockfile);
    });
  });
});
