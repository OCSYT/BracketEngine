const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const packager = require('@electron/packager');
const glob = require('glob');

const packagerOptions = {
  dir: '.',
  out: 'dist',
  platform: 'win32',
  overwrite: true,
  asar: true,
  afterCopy: [
    cleanSources
  ],
  icon: 'icon.ico'
};

packager(packagerOptions).then(outPath => {
  console.log(`build path: ${outPath}`);
});

// remove folders & files not to be included in the app
function cleanSources(buildPath, electronVersion, platform, arch, callback) {
    // New resources path
    const resourcesPath = path.join("");
  
    // Find all .obj files
    const objFiles = glob.sync('**/*.obj', { cwd: '.' });
  
    objFiles.forEach((objFile) => {
        const destFile = path.join(buildPath, objFile);
        const sourceFile = path.join(resourcesPath, objFile);
    
        const destDir = path.dirname(destFile);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
    
        console.log(destFile);
        fs.copyFileSync(sourceFile, destFile);
    });
    
  
    console.log('Copied .obj files to the resources directory');
    callback();
}

  
