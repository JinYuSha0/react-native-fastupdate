const babel = require('@babel/core');
const fs = require('fs');

function getRegisterComponentName(filepath) {
  return new Promise((resolve) => {
    const content = fs.readFileSync(filepath);
    let componentName;
    babel.transform(content, {
      babelrc: false,
      configFile: false,
      plugins: [
        {
          visitor: {
            CallExpression(path) {
              const callee = path.get('callee');
              const object = callee.get('object');
              const property = callee.get('property');
              if (
                object.toString() === 'AppRegistry' &&
                property.toString() === 'registerComponent'
              ) {
                const args = path.get('arguments');
                if (args.length > 0) {
                  componentName = args[0].node.value;
                  if (componentName) {
                    resolve({
                      componentName: componentName,
                      entryFile: filepath,
                    });
                  }
                }
              }
            },
          },
          post() {
            resolve(null);
          },
        },
      ],
    });
  });
}

module.exports = getRegisterComponentName;
