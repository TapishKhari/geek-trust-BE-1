const calc = require('./test1.js');

async function processFiles() {
  try {
    await calc('./sample_input/input1.txt');
    console.log("\n");
    await calc('./sample_input/input2.txt');
  } catch (error) {
    console.error('Error processing files:', error);
  }
}

processFiles();

