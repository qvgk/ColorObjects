// Dependencies
import * as esbuild from "esbuild";
import ora from "ora";
import path from "path";
import fs from "fs";

import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

// Variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execSync = promisify(exec);

// Directory Names
const buildDir = path.join(__dirname, "../builds");
const distDir = path.join(__dirname, "../../dist");

// Create Dist Directories Function
const createDistDirectory = (dirName: string) => {
  const directoryName = path.join(distDir, dirName);
  const selectedDir = fs.existsSync(directoryName);

  if (!selectedDir) {
    fs.mkdirSync(directoryName, {
      recursive: true,
    });
  }

  return directoryName;
};

// Create Dist Directories
const stringsDir = createDistDirectory("strings");
const numbersDir = createDistDirectory("numbers");

// Build Strings Function
const buildStrings = async () => {
  const fileDir = path.join(buildDir, "colors-strings.ts");

  // ESM
  await esbuild.build({
    entryPoints: [fileDir],
    platform: "node",
    outfile: path.join(stringsDir, "index.js"),
  });

  // CJS
  await esbuild.build({
    entryPoints: [fileDir],
    format: "cjs",
    platform: "node",
    outfile: path.join(stringsDir, "index.cjs"),
  });

  // Types
  try {
    const tscCmd = `tsc --declaration --emitDeclarationOnly --outDir ${stringsDir} ${fileDir}`;
    await execSync(tscCmd);
  } catch (e) {
    console.error("Failed to generate types: ", e);
  }
};

// Build Numbers Function
const buildNumbers = async () => {
  const fileDir = path.join(buildDir, "colors-numbers.ts");

  // ESM
  await esbuild.build({
    entryPoints: [fileDir],
    platform: "node",
    outfile: path.join(numbersDir, "index.js"),
  });

  // CJS
  await esbuild.build({
    entryPoints: [fileDir],
    format: "cjs",
    platform: "node",
    outfile: path.join(numbersDir, "index.cjs"),
  });

  // Types
  try {
    const tscCmd = `tsc --declaration --emitDeclarationOnly --outDir ${numbersDir} ${fileDir}`;
    await execSync(tscCmd);
  } catch (e) {
    console.error("Failed to generate types: ", e);
  }
};

// Build Files
const buildingSpinner = ora("Building files...").start();
await Promise.allSettled([await buildStrings(), await buildNumbers()]);
buildingSpinner.succeed("Built all files.");
