var _parseKeyValueParamArray = _interopRequireDefault(
  require('./utils/bundle/inner/parseKeyValueParamArray')
);
var _saveAssets = _interopRequireDefault(
  require('./utils/bundle/inner/saveAssets')
);
var _cliTools = require('@react-native-community/cli-tools');
var _chalk = _interopRequireDefault(require('chalk'));
var _Server = _interopRequireDefault(require('metro/src/Server'));
var _bundle = _interopRequireDefault(require('metro/src/shared/output/bundle'));
var _RamBundle = _interopRequireDefault(
  require('metro/src/shared/output/RamBundle')
);
var _path = _interopRequireDefault(require('path'));
var _fs = _interopRequireDefault(require('fs'));
var colors = require('colors');
var genPathMacthRegExp = require('./utils/genPathMacthRegExp');
var getModuleIdFactory = require('./utils/getModuleId');
var { genFileHash } = require('./utils/genFileHash');
var getVersionCode = require('./utils/getVersionCode');
var { isExistsCommonMap, genCommonMap } = require('./utils/commonMap');

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}

function generateFileDetector(rootPath, bundleConfig) {
  const {
    common: { whiteList, blackList },
  } = bundleConfig;
  const whiteSet = [...new Set(whiteList), 'node_modules'].map((path) => {
    const absolutePath = _path.default.join(rootPath, path);
    return {
      pathname: absolutePath,
      isDir: _fs.default.statSync(absolutePath).isDirectory(),
    };
  });
  const blackSet = [...new Set(blackList)].map((path) => {
    const absolutePath = _path.default.join(rootPath, path);
    return {
      pathname: absolutePath,
      isDir: _fs.default.statSync(absolutePath).isDirectory(),
    };
  });
  const whiteListRegExp = genPathMacthRegExp([
    { pathname: '__prelude__', isDir: false },
    {
      pathname: _path.default.join(__dirname, '../polyfills/require.js'),
      isDir: false,
    },
    {
      pathname: _path.default.join(rootPath, 'app.json'),
      isDir: false,
    },
    {
      pathname: `require-${_path.default.join(rootPath, 'node_modules/react-native/Libraries/Core/InitializeCore.js')}`,
      isDir: false,
    },
    ...whiteSet,
  ]);
  const blackListRegExp = genPathMacthRegExp([
    {
      pathname: _path.default.join(
        rootPath,
        'node_modules/metro-runtime/src/polyfills/require.js'
      ),
      isDir: false,
    },
    ...blackSet,
  ]);
  return (filepath) => {
    try {
      if (blackListRegExp.test(filepath)) return false;
      if (whiteListRegExp.test(filepath)) return true;
    } catch {}
    return false;
  };
}

async function buildBundleWithConfig(
  args,
  config,
  bundleImpl = _bundle.default
) {
  const rootPath = process.cwd();
  const platform = args.platform;
  const versionCode = args.versionCode ?? getVersionCode(platform);

  if (versionCode === null || isNaN(+versionCode)) {
    console.log(
      colors.red.underline(
        `versionCode "${versionCode}" is not a correct number`
      )
    );
    return;
  }

  const customResolverOptions = (0, _parseKeyValueParamArray.default)(
    args.resolverOption ?? []
  );
  if (config.resolver.platforms.indexOf(args.platform) === -1) {
    _cliTools.logger.error(
      `Invalid platform ${
        args.platform ? `"${_chalk.default.bold(args.platform)}" ` : ''
      }selected.`
    );
    _cliTools.logger.info(
      `Available platforms are: ${config.resolver.platforms
        .map((x) => `"${_chalk.default.bold(x)}"`)
        .join(
          ', '
        )}. If you are trying to bundle for an out-of-tree platform, it may not be installed.`
    );
    throw new Error('Bundling failed');
  }

  const moduleIdMap = Object.create(null);
  let bundleConfig = {
    common: {
      whiteList: [],
      blackList: [],
    },
  };
  try {
    bundleConfig = require(
      _path.default.join(process.cwd(), 'bundle.config.js')
    );
  } catch {}

  const originGetPolyfills = config.serializer.getPolyfills;
  config.serializer.getPolyfills = function () {
    return [
      _path.default.join(__dirname, '../polyfills/require.js'),
      ...originGetPolyfills(),
    ];
  };

  const fileDetector = generateFileDetector(rootPath, bundleConfig);

  config.serializer.processModuleFilter = function (module) {
    const { path } = module;
    return fileDetector(path);
  };

  const genPath = (path) => path.replace(rootPath, '');
  const getModuleId = getModuleIdFactory(0);
  config.serializer.createModuleIdFactory = function () {
    return function (path) {
      if (fileDetector(path)) {
        const id = getModuleId(genPath(path));
        moduleIdMap[genPath(path)] = {
          id,
          hash: genFileHash(path),
        };
        return id;
      }
      return null;
    };
  };

  // This is used by a bazillion of npm modules we don't control so we don't
  // have other choice than defining it as an env variable here.
  process.env.NODE_ENV = args.dev ? 'development' : 'production';
  let sourceMapUrl = args.sourcemapOutput;
  if (sourceMapUrl != null && !args.sourcemapUseAbsolutePath) {
    sourceMapUrl = _path.default.basename(sourceMapUrl);
  }

  // $FlowIgnore[prop-missing]
  const requestOpts = {
    entryFile: args.entryFile,
    sourceMapUrl,
    dev: args.dev,
    minify: args.minify !== undefined ? args.minify : !args.dev,
    platform: args.platform,
    unstable_transformProfile: args.unstableTransformProfile,
    customResolverOptions,
  };
  const server = new _Server.default(config);
  try {
    const bundle = await bundleImpl.build(server, requestOpts);

    // $FlowIgnore[class-object-subtyping]
    // $FlowIgnore[incompatible-call]
    // $FlowIgnore[prop-missing]
    // $FlowIgnore[incompatible-exact]
    await bundleImpl.save(bundle, args, _cliTools.logger.info);

    const commonMapExists = await isExistsCommonMap(
      platform,
      versionCode,
      JSON.stringify(moduleIdMap, null, 2)
    );
    if (commonMapExists) {
      console.log(
        colors.green(
          `The common map whose versionCode is ${versionCode} and the platform is ${platform} already exists`
        )
      );
      return;
    }
    await genCommonMap(
      platform,
      versionCode,
      JSON.stringify(moduleIdMap, null, 2)
    );

    // Save the assets of the bundle
    const outputAssets = await server.getAssets({
      ..._Server.default.DEFAULT_BUNDLE_OPTIONS,
      ...requestOpts,
      bundleType: 'todo',
    });

    // When we're done saving bundle output and the assets, we're done.
    return await (0, _saveAssets.default)(
      outputAssets,
      args.platform,
      args.assetsDest,
      args.assetCatalogDest
    );
  } finally {
    server.end();
  }
}

module.exports = buildBundleWithConfig;
