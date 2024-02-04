const fs = require("fs")

// the name of the folder we want to output the file
const FOLDER_NAME = process.argv[2];

if (!FOLDER_NAME) {
    throw new Error('No folder name was specified')
}

const folderPath = `./${FOLDER_NAME}/`

if (!fs.existsSync(folderPath)) {
    throw new Error("Folder does not exist");
}

const outputPath = `${folderPath}output.js`;

if (fs.existsSync(outputPath)) {
    fs.rmSync(outputPath)
}

const funcContent = fs.readFileSync(`${folderPath}func.js`, 'utf8').replace(/^\s*export\s+/gm, ''); // remove "export at beginning of lines"
const executeContent = fs.readFileSync(`${folderPath}execute.js`, 'utf8')

const outputContent = funcContent + "\n\n\n" + executeContent;

fs.writeFileSync(outputPath, outputContent, 'utf8')