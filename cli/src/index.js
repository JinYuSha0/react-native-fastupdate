const { program } = require('commander');
const { execSync } = require('child_process');
const { bundleCommand } = require('@react-native/community-cli-plugin');
const { readFileSync } = require('fs');
const path = require('path');
const fs = require('fs');
const analyzeEntryFiles = require('./utils/analyzeEntryFiles');
const metroBundle = require('metro/src/shared/output/bundle');
// const metroRamBundle = require('metro/src/shared/output/RamBundle');
const commonBuildBundleWithConfig = require('./common');
const splitBuildBundleWithConfig = require('./split');
const getVersionCode = require('./utils/getVersionCode');
const colors = require('colors');
const { getLatestCommonMap } = require('./utils/commonMap');
const getRegisterComponentName = require('./utils/getRegisterComponentName');

const ModuleType = {
  TYPE_COMMON: 0,
  TYPE_SPLIT: 1,
};

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
  .option('--versionCode <string>', 'Native version code')
  .allowUnknownOption()
  .action(async function handleAction() {
    let config = null;
    let options = program.opts();

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

    const versionCode = options.versionCode ?? getVersionCode(options.platform);
    if (versionCode === null || isNaN(+versionCode)) {
      console.log(
        colors.red.underline(
          `versionCode "${versionCode}" is not a correct number`
        )
      );
      return;
    }

    const entryFiles = analyzeEntryFiles(path.basename(options.entryFile));

    if (!options.assetsDest) {
      options.assetsDest =
        options.platform === 'ios'
          ? path.join(process.cwd(), './ios')
          : path.join(process.cwd(), './android/app/src/main/res');
    }

    await commonBuildBundleWithConfig(
      { ...options },
      config,
      metroBundle,
      versionCode,
      entryFiles
    );

    const splipModules = (
      await Promise.all(
        entryFiles.map((entryFile) => getRegisterComponentName(entryFile))
      )
    ).filter((componentName) => !!componentName);

    const duplicateComponentNames = hasDuplicateComponentNames(splipModules);
    if (duplicateComponentNames) {
      console.log(
        colors.red.underline(
          `There is a duplicate componentName: ${duplicateComponentNames}`
        )
      );
      return;
    }
    const latestCommonMap = await getLatestCommonMap(
      options.platform,
      versionCode
    );
    const commonMapSize = Object.keys(latestCommonMap).length + 1;

    const splitRes = await Promise.all(
      splipModules
        .sort()
        .map((module, index) =>
          splitBuildBundleWithConfig(
            { ...options },
            config,
            metroBundle,
            versionCode,
            module.entryFile,
            module.componentName,
            latestCommonMap,
            commonMapSize + (index + 1) * 100000000
          )
        )
    );

    const modulesConfig = splitRes.map((module) => ({
      name: module.componentName ?? '',
      hash: module.hash,
      filepath: `assets://${path.basename(module.bundleOutput)}`,
      type: module.common ? ModuleType.TYPE_COMMON : ModuleType.TYPE_SPLIT,
    }));

    fs.writeFileSync(
      path.join(
        options.platform === 'ios'
          ? path.join(process.cwd(), './ios')
          : path.join(process.cwd(), './android/app/src/main/assets'),
        'modules.config.json'
      ),
      JSON.stringify(modulesConfig, null, 2)
    );
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

function hasDuplicateComponentNames(components) {
  const componentNames = new Set();

  for (const component of components) {
    if (componentNames.has(component.componentName)) {
      return component.componentName;
    }
    componentNames.add(component.componentName);
  }

  return null;
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

program.option(
  '--hbc [boolean]',
  'Use hermes bytecode (default: true)',
  (val) => val !== 'false',
  true
);

program.parse(process.argv);
