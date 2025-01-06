require('dotenv').config();
const inquirer = require('inquirer');
const { program } = require('commander');
const { execSync } = require('child_process');
const { bundleCommand } = require('@react-native/community-cli-plugin');
const { readFileSync } = require('fs');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const analyzeEntryFiles = require('./utils/analyzeEntryFiles');
const metroBundle = require('metro/src/shared/output/bundle');
// const metroRamBundle = require('metro/src/shared/output/RamBundle');
const { getCommonMapInstance } = require('./utils/getCommonAdapter');
const { request } = require('./utils/request');
const commonBuildBundleWithConfig = require('./common');
const splitBuildBundleWithConfig = require('./split');
const getVersionCode = require('./utils/getVersionCode');
const getRegisterComponentName = require('./utils/getRegisterComponentName');

const ModuleType = {
  TYPE_COMMON: 0,
  TYPE_SPLIT: 1,
};

const Environments = ['TEST', 'UAT', 'PROD'];

program.version(
  JSON.parse(
    readFileSync(path.resolve(__dirname, '../../', 'package.json'), 'utf8')
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
    const { FASTUPDATE_APP_ID, FASTUPDATE_APP_SECRET } = process.env;

    let config = null;
    let options = program.opts();

    if (!options.offline && (!FASTUPDATE_APP_ID || !FASTUPDATE_APP_SECRET)) {
      console.log(
        chalk.red('Please set env FASTUPDATE_APP_ID and FASTUPDATE_APP_SECRET')
      );
      return;
    }

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
      console.log(chalk.red('No config provided'));
      return;
    }

    const versionCode = (options.versionCode =
      options.versionCode ?? getVersionCode(options.platform));
    if (versionCode === null || isNaN(+versionCode)) {
      console.log(
        chalk.red(`versionCode "${versionCode}" is not a correct number`)
      );
      return;
    }

    options.dependencies = Object.values(config.dependencies).reduce((a, b) => {
      const naviveInfo = b.platforms[options.platform];
      if (naviveInfo) {
        a[b.name] = naviveInfo.version;
      }
      return a;
    }, {});

    let environments = Environments;
    if (!options.offline) {
      const remoteConfig = await request.get('/publish/getConfig');
      environments = remoteConfig.environments.map((item) => item.type);
    }

    if (!options.environment || !environments.includes(options.environment)) {
      options.environment = (
        await inquirer.default.prompt([
          {
            type: 'list',
            name: 'environment',
            message: 'What environment are you going to publish?',
            choices: environments,
            default: environments[0],
          },
        ])
      ).environment;
    }

    const commonMapInstance = getCommonMapInstance(options.offline);

    const existsCommonMap = await commonMapInstance.getCommonMap(options);

    const entryFiles = analyzeEntryFiles(path.basename(options.entryFile));

    if (!options.assetsDest) {
      options.assetsDest =
        options.platform === 'ios'
          ? path.join(process.cwd(), './ios')
          : path.join(process.cwd(), './android/app/src/main/res');
    }

    const { commonMap } = await commonBuildBundleWithConfig(
      { ...options },
      config,
      metroBundle,
      entryFiles,
      existsCommonMap
    );

    const splipModules = (
      await Promise.all(
        entryFiles.map((entryFile) => getRegisterComponentName(entryFile))
      )
    ).filter((componentName) => !!componentName);

    const duplicateComponentNames = hasDuplicateComponentNames(splipModules);
    if (duplicateComponentNames) {
      console.log(
        chalk.red(
          `There is a duplicate componentName: ${duplicateComponentNames}`
        )
      );
      return;
    }
    const commonMapSize = Object.keys(commonMap).length + 1;

    const splitRes = await Promise.all(
      splipModules
        .sort()
        .map((module, index) =>
          splitBuildBundleWithConfig(
            { ...options },
            config,
            metroBundle,
            module.entryFile,
            module.componentName,
            commonMap,
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

    const configOutputDir =
      options.platform === 'ios'
        ? path.join(process.cwd(), './ios')
        : path.join(process.cwd(), './android/app/src/main/assets');

    fs.writeFileSync(
      path.join(configOutputDir, 'modules.fastupdate-config.json'),
      JSON.stringify(modulesConfig, null, 2)
    );

    fs.writeFileSync(
      path.join(configOutputDir, 'app.fastupdate-config.json'),
      JSON.stringify(
        {
          environment: options.environment,
          versionCode: options.versionCode,
          commonHash: commonMap.common.hash,
        },
        null,
        2
      )
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
  const index = bundleCommand.options.findIndex((item) => item.name === name);
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

program.option(
  '--environment <string>',
  'What environment are you going to publish?',
  (val) => String(val).toLocaleUpperCase()
);

program.option(
  '--offline [boolean]',
  'offline mode',
  (val) => val !== 'false',
  false
);

program.parse(process.argv);
