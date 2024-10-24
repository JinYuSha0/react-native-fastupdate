const { program } = require('commander');
const { execSync } = require('child_process');
const { bundleCommand } = require('@react-native/community-cli-plugin');
const { readFileSync } = require('fs');
const { delDir, createDirIfNotExists } = require('./utils/fsUtils');
const path = require('path');
const fs = require('fs');
const loadMetroConfig = require('./utils/loadMetroConfig').default;
const analyzeEntryFiles = require('./utils/analyzeEntryFiles');
const genPathImportScript = require('./utils/genPathImportScript');
const metroBundle = require('metro/src/shared/output/bundle');
// const metroRamBundle = require('metro/src/shared/output/RamBundle');
const commonBuildBundleWithConfig = require('./common');

program.version(
  JSON.parse(
    readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8')
  ).version
);

program
  .name(bundleCommand.name)
  .description(bundleCommand.description ?? '')
  .option(
    '--config-cmd <string>',
    'Command to generate a JSON project config',
    'npx react-native config'
  )
  .option('--load-config <string>', 'JSON project config')
  .option('--verbose', 'Additional logs', () => true, false)
  .allowUnknownOption()
  .action(async function handleAction() {
    let config = null;
    let options = program.opts();
    let afterCallbacks = [];

    if (options.loadConfig != null) {
      config = JSON.parse(
        options.loadConfig.replace(/^\W*'/, '').replace(/'\W*$/, '')
      );
    } else if (options.configCmd != null) {
      config = JSON.parse(
        execSync(options.configCmd.trim(), { encoding: 'utf8' })
      );
    }

    if (config == null) {
      throw new Error('No config provided');
    }

    if (options.common) {
      const entryFiles = analyzeEntryFiles(path.basename(options.entryFile));
      const combineEntryCode = genPathImportScript(entryFiles);
      const tempDir = createDirIfNotExists(
        path.join(__dirname, '../', `./temp/${Date.now()}`)
      );
      const combineEntryFile = path.join(tempDir, 'combineEntry.js');
      fs.writeFileSync(combineEntryFile, combineEntryCode);
      options.entryFile = combineEntryFile;
      afterCallbacks.push(() => {
        delDir(tempDir);
      });
    }

    if (!options.bundleOutput) {
      options.bundleOutput =
        options.platform === 'ios'
          ? path.join(process.cwd(), './ios/main.jsbundle')
          : path.join(
              process.cwd(),
              './android/app/src/main/assets/index.android.bundle'
            );
    }

    if (!options.assetsDest) {
      options.assetsDest =
        options.platform === 'ios'
          ? path.join(process.cwd(), './ios')
          : path.join(process.cwd(), './android/app/src/main/res');
    }

    try {
      const metroConfig = await loadMetroConfig(config, {
        maxWorkers: options.maxWorkers,
        resetCache: options.resetCache,
        config: options.config,
      });
      await commonBuildBundleWithConfig(options, metroConfig, metroBundle);
    } finally {
      afterCallbacks.forEach((fun) => fun());
    }
  });

function parseFilepath(value, prev) {
  if (!!value && fs.lstatSync(path.join(process.cwd(), value)).isFile()) {
    return path.join(process.cwd(), value);
  } else if (fs.existsSync(prev)) {
    return prev;
  }
}

function replaceOption(name, option) {
  const index = bundleCommand.options.findIndex(
    (option) => option.name === name
  );
  if (index > -1) {
    bundleCommand.options[index] = option;
  }
}

replaceOption('--entry-file <path>', {
  name: '--entry-file <path>',
  description:
    'Path to the root JS file, either absolute or relative to JS root',
  parse: parseFilepath,
  default: path.join(process.cwd(), './index.js'),
});

replaceOption('--dev [boolean]', {
  name: '--dev [boolean]',
  description:
    'If false, warnings are disabled and the bundle is minified. (default: false)',
  parse: (val) => val !== 'false',
  default: false,
});

if (bundleCommand.options != null) {
  for (const o of bundleCommand.options) {
    program.option(
      o.name,
      o.description ?? '',
      o.parse ?? ((value) => value),
      o.default
    );
  }
}

program.option(
  '--common [boolean]',
  'Analyze and output common bundle',
  (val) => val !== 'false',
  false
);

program.parse(process.argv);
