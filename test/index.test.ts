import { execSync } from "child_process";
import fs from "fs";
import assert from "node:assert";
import { beforeEach, describe, it, mock } from "node:test";
import { fileURLToPath } from "url";
import path from "path";

const FILENAME = fileURLToPath(import.meta.url);
const TEST_DIR = path.join(path.dirname(FILENAME), "test-project");
const PACKAGE_JSON_PATH = path.join(TEST_DIR, "package.json");

describe("add <package>", () => {
  beforeEach(() => {
    // Set up a clean test environment
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_DIR);
    mock.method(process, "cwd", () => TEST_DIR);
  });

  it("should add a package to package.json when the version is specified", () => {
    execSync("node ../../dist/src/index.js add is-thirteen@0.1.13", {
      cwd: TEST_DIR,
    });
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
    assert.strictEqual(packageJson.dependencies["is-thirteen"], "0.1.13");
  });

  it("should add a package to package.json when the version is not specified", () => {
    execSync("node ../../dist/src/index.js add is-thirteen", { cwd: TEST_DIR });
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
    assert.strictEqual(packageJson.dependencies["is-thirteen"], "latest");
  });
});

describe("install", () => {
  beforeEach(() => {
    // Set up a clean test environment
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_DIR);
    mock.method(process, "cwd", () => TEST_DIR);
  });

  it("does not error when there are no dependencies", () => {
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify({}));
    execSync("node ../../dist/src/index.js install", { cwd: TEST_DIR });
    assert(
      fs.existsSync(path.join(TEST_DIR, "node_modules")),
      "node_modules directory should exist",
    );
  });

  // describe("when package.json has dependencies", () => {
  //   beforeEach(() => {
  //     const packageJson = {
  //       dependencies: {
  //         "is-odd": "3.0.1"
  //       }
  //     };
  //     fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson));
  //   });

  //   it("should create node_modules directory", () => {
  //     execSync("node ../../dist/src/index.js install", { cwd: TEST_DIR });
  //     assert(fs.existsSync(path.join(TEST_DIR, "node_modules")), "node_modules directory should exist");
  //   });

  //   it("should install specified dependencies", () => {
  //     execSync("node ../../dist/src/index.js install", { cwd: TEST_DIR });
  //     assert(fs.existsSync(path.join(TEST_DIR, "node_modules", "is-odd")), "is-odd package should be installed");
  //   });
  // });

  // describe("when package.json has nested dependencies", () => {
  //   it("should install nested dependencies", () => {
  //     const packageJson = {
  //       dependencies: {
  //         "is-number": "7.0.0"
  //       }
  //     };
  //     fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson));

  //     execSync("node ../../dist/src/index.js install", { cwd: TEST_DIR });

  //     assert(fs.existsSync(path.join(TEST_DIR, "node_modules", "is-number")), "is-number package should be installed");
  //     assert(fs.existsSync(path.join(TEST_DIR, "node_modules", "kind-of")), "kind-of package (dependency of is-number) should be installed");
  //   });
  // });
});
