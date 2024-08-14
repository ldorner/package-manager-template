import { program } from "commander";
import { IPackageJson } from "package-json-type";
import path from "path";
import fs from "fs";
import { DEFAULT_PACKAGE_JSON } from "./packageJson.js";
import { NpmRegistryClient } from "./NpmRegistryClient.js";
import {
  addPackageToLock,
  DEFAULT_LOCK_FILE,
  IPackageLockJson,
} from "./packageLockJson.js";

const OUTPUT_DIR = path.join(process.cwd(), "output");
const PACKAGE_JSON_PATH: string = path.join(OUTPUT_DIR, "package.json");
const NODE_MODULES_PATH = path.join(OUTPUT_DIR, "node_modules");
const NPM_CLIENT = new NpmRegistryClient();
const PACKAGE_LOCK_PATH = path.join(OUTPUT_DIR, "package-lock.json");

/**
 * Adds the dependency to the “dependencies” object in package.json
 *
 * Argument <package>: A "name@version" string as defined [here](https://github.com/npm/node-semver#versions)
 */
program
  .command("add <package>")
  .description("Add a package")
  .action((pkg) => {
    const [packageName, version] = pkg.split("@");

    // Read existing package.json or use default if it doesn't exist
    let currentPackageJson: IPackageJson;
    try {
      currentPackageJson = JSON.parse(
        fs.readFileSync(PACKAGE_JSON_PATH, "utf8"),
      );
    } catch (error) {
      currentPackageJson = { ...DEFAULT_PACKAGE_JSON };
    }

    // Add or update the package dependencies
    let newPackageJson = {
      ...currentPackageJson,
      dependencies: {
        ...(currentPackageJson.dependencies || {}),
        [packageName]: version || "*",
      },
    };

    // Write updated package.json
    if (!fs.existsSync(PACKAGE_JSON_PATH)) {
      fs.mkdirSync(path.dirname(PACKAGE_JSON_PATH), { recursive: true });
    }

    fs.writeFileSync(
      PACKAGE_JSON_PATH,
      JSON.stringify(newPackageJson, null, 2),
    );

    console.log(`Added ${packageName}@${version || "latest"} to dependencies.`);
  });

/**
 * Resolves the full dependency list from package.json and downloads all of the required packages to the “node_modules” folder
 *
 * This command has no arguments
 */
program
  .command("install")
  .description("Install dependencies")
  .action(async () => {
    // Read package.json
    const packageJson: IPackageJson = JSON.parse(
      fs.readFileSync(PACKAGE_JSON_PATH, "utf8"),
    );
    const dependencies = packageJson.dependencies || {};

    // Create node_modules directory if it doesn't exist
    if (!fs.existsSync(NODE_MODULES_PATH)) {
      fs.mkdirSync(NODE_MODULES_PATH, { recursive: true });
    }

    let lockfile: IPackageLockJson = { ...DEFAULT_LOCK_FILE };
    if (fs.existsSync(PACKAGE_LOCK_PATH)) {
      lockfile = JSON.parse(fs.readFileSync(PACKAGE_LOCK_PATH, "utf8"));
    }

    // In case packages have been removed, make a new lockfile that only contains the packages
    // that are in packages.json currently
    const newLockfile = { ...DEFAULT_LOCK_FILE };

    // Function to download and extract a package
    async function installPackage(name: string, version: string) {
      let absoluteVersion = version.replace(/[^0-9.]/g, "");

      // Retrieve package info for lockfile
      let data = await NPM_CLIENT.getPackageInfo(name, absoluteVersion);

      // If the response is invalid, then throw an error. Maybe should instead log
      // the error and continue, but things are pretty borked so perhaps better to
      // fail quickly. This usually occurs because the package doesn't exist.
      if (!data) {
        throw new Error("Invalid response from npm registry");
        return;
      }

      // Update version to latest numerical version if version is "*" and refetch info
      if (version == "*") {
        absoluteVersion = data["dist-tags"].latest;
        // Not strictly necessary to refetch, could parse original differently
        data = await NPM_CLIENT.getPackageInfo(name, absoluteVersion);
      }

      console.log(`Installing ${name}@${absoluteVersion}`);

      // download tarball
      const packagePath = path.join(NODE_MODULES_PATH, name);

      // Need to check lockfile. If already up to date, then skip. Otherwise, remove and redownload.
      if (fs.existsSync(packagePath)) {
        const packageKey = `node_modules/${name}`;
        if (lockfile.packages[packageKey]?.version == absoluteVersion) {
          console.log(
            `${name}@${absoluteVersion} already up to date. Skipping.`,
          );
          newLockfile.packages[packageKey] = lockfile.packages[packageKey];
          return;
        } else {
          fs.rmSync(packagePath, { recursive: true });
        }
      }

      await NPM_CLIENT.downloadTarball(name, absoluteVersion, packagePath);

      // Update in-memory lockfile data to later be written
      addPackageToLock(newLockfile, data);

      // Recursively install dependencies of this package
      const packageJsonPath = path.join(packagePath, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        const subPackageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf8"),
        );
        const subDependencies = subPackageJson.dependencies || {};
        for (const [subName, subVersion] of Object.entries(subDependencies)) {
          await installPackage(subName, subVersion as string);
        }
      }
    }

    // Install all dependencies
    for (const [name, version] of Object.entries(dependencies)) {
      await installPackage(name, version);
    }

    // Rewrite the updated lockfile
    fs.writeFileSync(
      PACKAGE_LOCK_PATH,
      JSON.stringify(newLockfile, null, 2),
      "utf8",
    );

    console.log("All dependencies installed successfully!");
  });

program.parse(process.argv);
