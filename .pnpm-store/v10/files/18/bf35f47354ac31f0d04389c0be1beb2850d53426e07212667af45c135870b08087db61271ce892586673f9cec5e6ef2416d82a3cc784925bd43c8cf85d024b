"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _inquirer = _interopRequireDefault(require("inquirer"));
var _findRoot = _interopRequireDefault(require("find-root"));
var _util = require("../../common/util");
var _parsers = require("../parsers");
var _commitizen = require("../../commitizen");
var gitStrategy = _interopRequireWildcard(require("./git"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// destructure for shorter apis
let {
  parse
} = _parsers.gitCz;
let {
  getPrompter,
  resolveAdapterPath,
  getGitRootPath
} = _commitizen.adapter;
let {
  isClean
} = _commitizen.staging;
var _default = exports.default = gitCz;
function gitCz(rawGitArgs, environment, adapterConfig) {
  // See if any override conditions exist.

  // In these very specific scenarios we may want to use a different
  // commit strategy than git-cz. For example, in the case of --amend
  let parsedCommitizenArgs = _parsers.commitizen.parse(rawGitArgs);
  if (parsedCommitizenArgs.amend) {
    // console.log('override --amend in place');
    gitStrategy.default(rawGitArgs, environment);
    return;
  }

  // Now, if we've made it past overrides, proceed with the git-cz strategy
  let parsedGitCzArgs = parse(rawGitArgs);

  // Determine if we need to process this commit as a retry instead of a
  // normal commit.
  let retryLastCommit = rawGitArgs && rawGitArgs[0] === '--retry';

  // Determine if we need to process this commit using interactive hook mode
  // for husky prepare-commit-message
  let hookMode = !(typeof parsedCommitizenArgs.hook === 'undefined');
  let resolvedAdapterConfigPath = resolveAdapterPath(adapterConfig.path);
  let resolvedAdapterRootPath = (0, _findRoot.default)(resolvedAdapterConfigPath);
  let prompter = getPrompter(adapterConfig.path);
  let shouldStageAllFiles = rawGitArgs.includes('-a') || rawGitArgs.includes('--all');
  isClean(process.cwd(), function (error, stagingIsClean) {
    if (error) {
      throw error;
    }
    if (stagingIsClean && !parsedGitCzArgs.includes('--allow-empty')) {
      throw new Error('No files added to staging! Did you forget to run git add?');
    }

    // OH GOD IM SORRY FOR THIS SECTION
    let adapterPackageJson = (0, _util.getParsedPackageJsonFromPath)(resolvedAdapterRootPath);
    let cliPackageJson = (0, _util.getParsedPackageJsonFromPath)(environment.cliPath);
    console.log(`cz-cli@${cliPackageJson.version}, ${adapterPackageJson.name}@${adapterPackageJson.version}\n`);
    (0, _commitizen.commit)(_inquirer.default, getGitRootPath(), prompter, {
      args: parsedGitCzArgs,
      disableAppendPaths: true,
      emitData: true,
      quiet: false,
      retryLastCommit,
      hookMode
    }, function (error) {
      if (error) {
        throw error;
      }
      process.exit(0);
    });
  }, shouldStageAllFiles);
}