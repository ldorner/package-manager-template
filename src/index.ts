import { program } from "commander";

/**
 * Adds the dependency to the “dependencies” object in package.json
 *
 * Argument <package>: A "name@version" string as defined [here](https://github.com/npm/node-semver#versions)
 */
program
  .command("add <package>")
  .description("Add a package")
  .action((pkg) => {
    // -- IMPLEMENT ADD COMMAND -- //
    const [packageName, version] = pkg.split("@");
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
    // -- IMPLEMENT INSTALL COMMAND -- //
  });

program.parse(process.argv);
