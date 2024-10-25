const babel = require('@babel/core');
const fs = require('fs');
const colors = require('colors');

function getRegisterComponentName(filepath) {
  return new Promise((resolve, reject) => {
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
            if (!componentName) {
              console.log(
                colors.red.underline(
                  `Unable to get module name registered for file ${filepath}`
                )
              );
              reject(
                new Error(
                  `Unable to get module name registered for file ${filepath}`
                )
              );
            }
          },
        },
      ],
    });
  });
}

module.exports = getRegisterComponentName;
