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
 * and creates a nested object structure
 */
function buildColorObject(): ColorObject {
  // Variables
  const colorsDir = path.join(__dirname, "../colors");
  const colorObject: ColorObject = {};

  // Exist Check
  if (!fs.existsSync(colorsDir)) {
    console.warn("Colors directory not found");
    return colorObject;
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

    // Feth Color Files
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
            // Create Category in JSON
            let jsonCategory = colorObject[colorCategory];
            if (!jsonCategory) colorObject[colorCategory] = {};

            // Set Value
            colorObject[colorCategory]![colorName] = `#${colorValue}`;
          });
      } catch (error) {
        console.warn(`Failed to read color file: ${filePath}`, error);
      }
    });
  });

  return colorObject;
}

/**
 * Writes the color object to a TypeScript file in the build directory
 */
function writeColorObjectToFile(colorObject: ColorObject): void {
  // Variables
  const outputDir = path.join(__dirname, "../builds");
  const outputFile = path.join(__dirname, "../builds/colors.ts");

  // File Content Information
  const fileContent = `export default ${JSON.stringify(colorObject, null, 2)};`;
  const singleColors: { [colorName: string]: string } = {};

  // Extract all unique colors from colorObject
  Object.values(colorObject).forEach((category) => {
    Object.entries(category).forEach(([colorName, colorValue]) => {
      singleColors[colorName] = colorValue;
    });
  });

  // Generate individual color exports
  const individualExports = Object.entries(singleColors)
    .map(
      ([colorName, colorValue]) =>
        `export const ${colorName} = "${colorValue}";`
    )
    .join("\n");

  // Combine default export with individual exports
  const finalContent = `${individualExports}\n\n${fileContent}`;

  // Check OutputDir Exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Write File Information
  fs.writeFileSync(outputFile, finalContent, "utf-8");
  console.log(`Colors object written to: ${outputFile}`);
}

// Build Colors
const colors = buildColorObject();
writeColorObjectToFile(colors);
