const path = require('path');
const fs = require('fs');
const process = require('process');
const { exec } = require('child_process');

function osDetect() {
  switch (process.platform) {
    case 'win32':
      return ['win64-bin', 'hermesc.exe'];
    case 'darwin':
      return ['osx-bin', 'hermesc'];
    case 'linux':
      return ['linux64-bin', 'hermesc'];
  }
}

function hbc(filepath) {
  return new Promise((resolve, reject) => {
    const [dirname, execname] = osDetect();
    const hermescPath = path.join(
      process.cwd(),
      'node_modules/react-native/sdks/hermesc/',
      dirname,
      execname
    );
    const parsedPath = path.parse(filepath);
    const outPath = path.format({
      ...parsedPath,
      base: `${parsedPath.name}.hbc`,
    });
    const command = `${hermescPath} -emit-binary -out ${outPath} ${filepath}`;
    exec(command, (error) => {
      if (!error) {
        fs.unlinkSync(filepath);
        fs.renameSync(outPath, filepath);
        resolve(filepath);
      } else {
        reject(error);
      }
    });
  });
}

module.exports = hbc;
