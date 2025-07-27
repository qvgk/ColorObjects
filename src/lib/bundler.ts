import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ColorObject {
  [colorCategory: string]: {
    [colorName: string]: string;
  };
}

/**
 * Recursively reads all color files from the colors directory
 * and creates nested object structures for both string and number formats
 */
function buildColorObjects(): {
  stringColors: ColorObject;
  numberColors: ColorObject;
} {
  // Variables
  const colorsDir = path.join(__dirname, "../colors");

  const stringColorObject: ColorObject = {};
  const numberColorObject: ColorObject = {};

  // Exist Check
  if (!fs.existsSync(colorsDir)) {
    console.warn("Colors directory not found");
    return { stringColors: stringColorObject, numberColors: numberColorObject };
  }

  // Fetch All Directories
  const categories = fs
    .readdirSync(colorsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  // Run Through Categories
  categories.forEach((category) => {
    // Variables
    const categoryPath = path.join(colorsDir, category);

    // Fetch Color Files
    const colorFiles = fs
      .readdirSync(categoryPath)
      .filter((file) => file.endsWith(".txt"));

    // Run Through Color Files
    colorFiles.forEach((file) => {
      // Variables
      const colorName = path.basename(file, ".txt");
      const filePath = path.join(categoryPath, file);

      // Try-Catch Block
      try {
        // Fetch Color File Information
        const colorFile = fs.readFileSync(filePath, "utf-8").trim();
        const [colorCategories, colorValue] = colorFile.split("\n");
        if (!colorCategories || !colorValue) return;

        // Run Through Color Categories
        colorCategories
          .replaceAll(" ", "")
          .split(",")
          .forEach((colorCategory) => {
            // Create Category in JSON for strings
            if (!stringColorObject[colorCategory])
              stringColorObject[colorCategory] = {};
            // Create Category in JSON for numbers
            if (!numberColorObject[colorCategory])
              numberColorObject[colorCategory] = {};

            // Set Values
            stringColorObject[colorCategory]![colorName] = `#${colorValue}`;
            numberColorObject[colorCategory]![colorName] = `0x${colorValue}`;
          });
      } catch (error) {
        console.warn(`Failed to read color file: ${filePath}`, error);
      }
    });
  });

  return { stringColors: stringColorObject, numberColors: numberColorObject };
}

/**
 * Writes the color objects to TypeScript files in the build directory
 */
function writeColorObjectsToFiles(
  stringColors: ColorObject,
  numberColors: ColorObject
): void {
  // Variables
  const outputDir = path.join(__dirname, "../builds");
  const stringFile = path.join(outputDir, "colors-strings.ts");
  const numberFile = path.join(outputDir, "colors-numbers.ts");

  // Check OutputDir Exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Extract all unique colors from stringColors for individual exports
  const singleStringColors: { [colorName: string]: string } = {};
  const singleNumberColors: { [colorName: string]: string } = {};

  Object.values(stringColors).forEach((category) => {
    Object.entries(category).forEach(([colorName, colorValue]) => {
      singleStringColors[colorName] = colorValue as string;
    });
  });

  Object.values(numberColors).forEach((category) => {
    Object.entries(category).forEach(([colorName, colorValue]) => {
      singleNumberColors[colorName] = colorValue as string;
    });
  });

  // Generate string version file
  const stringIndividualExports = Object.entries(singleStringColors)
    .map(
      ([colorName, colorValue]) =>
        `export const ${colorName} = "${colorValue}";`
    )
    .join("\n");

  const stringFileContent = `${stringIndividualExports}\n\nexport default ${JSON.stringify(
    stringColors,
    null,
    2
  )};`;

  // Generate number version file
  const numberIndividualExports = Object.entries(singleNumberColors)
    .map(
      ([colorName, colorValue]) => `export const ${colorName} = ${colorValue};`
    )
    .join("\n");

  const numberFileContent = `${numberIndividualExports}\n\nexport default ${JSON.stringify(
    numberColors,
    null,
    2
  ).replace(/"/g, "")};`;

  // Write Files
  fs.writeFileSync(stringFile, stringFileContent, "utf-8");
  fs.writeFileSync(numberFile, numberFileContent, "utf-8");

  console.log(`String colors written to: ${stringFile}`);
  console.log(`Number colors written to: ${numberFile}`);
}

// Build Colors
const { stringColors, numberColors } = buildColorObjects();
writeColorObjectsToFiles(stringColors, numberColors);
