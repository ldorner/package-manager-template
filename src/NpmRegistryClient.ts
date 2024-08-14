import fs from "fs";
import https from "https";
import path from "path";
import * as tar from "tar";

/**
 * A client for the NPM registry API.
 */
export class NpmRegistryClient {
  /**
   * Request package information from the NPM registry API as described [here](https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md#getpackageversion)
   *
   * @param name The name of the package to be downloaded
   * @param absoluteVersion The absolute (exact) version of the package to be downloaded
   * @returns Information about the package
   */
  async getPackageInfo(name: string, absoluteVersion: string): Promise<any> {
    const resp = await fetch(
      `https://registry.npmjs.org/${name}/${absoluteVersion}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
    );
    const data = await resp.json();
    return data;
  }

  async downloadTarball(
    name: string,
    absoluteVersion: string,
    downloadToPath: string,
  ): Promise<void> {
    const url = `https://registry.npmjs.org/${name}/-/${name}-${absoluteVersion}.tgz`;
    await new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(downloadToPath);

      https
        .get(url, (response) => {
          response.pipe(fileStream);

          fileStream.on("finish", () => {
            fileStream.close();
            resolve(null);
          });
        })
        .on("error", (error) => {
          fileStream.close();
          fs.unlink(downloadToPath, () => {}); // Delete the file if an error occurs
          console.error(
            `Error downloading package ${name}@${absoluteVersion}:`,
            error,
          );
          reject(error);
        });
    });

    // Extract the tarball
    const targetDir = path.dirname(downloadToPath);
    try {
      await tar.extract({
        file: downloadToPath,
        cwd: targetDir,
      });
    } catch (e) {
      console.error(`Error extracting package ${name}@${absoluteVersion}:`, e);
      return;
    } finally {
      // Delete the tarball
      fs.unlinkSync(downloadToPath);
    }

    fs.renameSync(path.join(targetDir, "package"), downloadToPath);
  }
}
