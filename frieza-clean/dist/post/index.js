/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 649:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

const core = __nccwpck_require__(746);
const tc = __nccwpck_require__(628);
const io = __nccwpck_require__(667);
const exec = __nccwpck_require__(460);

const fetch = __nccwpck_require__(266)
const os = __nccwpck_require__(857);
const path = __nccwpck_require__(928);

const default_profile_name = 'action'
const default_snapshot_name = 'snapshot-action'

async function getRelease(release) {
    let url = ''
    if (release == '') {
        url = "https://api.github.com/repos/outscale/frieza/releases/latest"
    } else {
        url = `https://api.github.com/repos/outscale/frieza/releases/${release}`
    }
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

function getAssetURL(data, asset_name) {
    for (const element of data) {
        if (element["name"] == asset_name) {
            return element["browser_download_url"]
        }
    }
    return ""
}

async function copyBinary(pathToCLI, release_tag) {
    const exeSuffix = os.platform().startsWith('win') ? '.exe' : '';

    try {
        source = [pathToCLI, `frieza_${release_tag}${exeSuffix}`].join(path.sep);
        target = [pathToCLI, `frieza${exeSuffix}`].join(path.sep);
        core.debug(`Moving ${source} to ${target}.`);
        await io.mv(source, target);
    } catch (e) {
        core.error(`Unable to move ${source} to ${target}.`);
        throw e;
    }
}

async function downloadBinary(release) {
    let release_data = await getRelease(release)

    let release_tag = release_data["tag_name"]
    if (release_tag.startsWith("v")) {
        release_tag = release_tag.substring(1)
    }

    const asset_name = "frieza_" + release_tag + "_" + mapOS(os.platform()) + "_" + mapArch(os.arch()) + ".zip"
    const url = getAssetURL(release_data["assets"], asset_name)

    core.debug(`Downloading Frieza from ${url}`);
    const downloadedPath = await tc.downloadTool(url)

    core.debug('Extracting Frieza zip file');
    const pathToCLI = await tc.extractZip(downloadedPath);
    core.debug(`Frieza path is ${pathToCLI}.`);

    if (!downloadedPath || !pathToCLI) {
        throw new Error(`Unable to download Frieza from ${url}`);
    }

    await copyBinary(pathToCLI, `v${release_tag}`)

    return pathToCLI;
}

function mapArch(arch) {
    const mappings = {
        'x32': '386',
        'x64': 'amd64'
    }
    return mappings[arch] || arch
}

function mapOS(os) {
    const mappings = {
        'win32': 'windows'
    };
    return mappings[os] || os;
}

async function addCredentials(access_key, secret_key, region) {
    core.debug(`Add credentials to frieza`);
    await exec.exec('frieza', ['profile', 'new', 'outscale_oapi', `--region=${region}`, `--ak=${access_key}`, `--sk=${secret_key}`, default_profile_name]);
}

async function removeCredentials() {
    core.debug(`Remove credentials of frieza`);
    await exec.exec('frieza', ['profile', 'remove', default_profile_name]);
}

async function makeSnapshot() {
    core.debug(`Make a snapshot`);
    await exec.exec('frieza', ['snapshot', 'new', default_snapshot_name, default_profile_name]);
}

async function needsClean() {
    core.debug(`Check if the account needs to be cleaned`)
    execOutput = exec.getExecOutput('frieza', ['clean', '--plan', '--json', '--auto-approve', default_snapshot_name]);
    return execOutput.then( stdout => {
        dataJson = JSON.parse(stdout.stderr);
        return (dataJson.targets.length == 1 && Object.keys(dataJson.targets[0].objects).length != 0)
    })
}

async function cleanAccount(timeout) {
    core.debug(`Clean account`);
    await exec.exec('frieza', ['clean', '--timeout='+ timeout, '--auto-approve', default_snapshot_name]);
}


exports.makeSnapshot = makeSnapshot;
exports.addCredentials = addCredentials;
exports.removeCredentials = removeCredentials
exports.downloadBinary = downloadBinary;
exports.cleanAccount = cleanAccount;
exports.needsClean = needsClean


/***/ }),

/***/ 746:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 460:
/***/ ((module) => {

module.exports = eval("require")("@actions/exec");


/***/ }),

/***/ 667:
/***/ ((module) => {

module.exports = eval("require")("@actions/io");


/***/ }),

/***/ 628:
/***/ ((module) => {

module.exports = eval("require")("@actions/tool-cache");


/***/ }),

/***/ 266:
/***/ ((module) => {

module.exports = eval("require")("node-fetch");


/***/ }),

/***/ 857:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 928:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
const core = __nccwpck_require__(746);

const setup = __nccwpck_require__(649);

(async () => {
  try {
    const timeout = core.getInput('clean_timeout');
    const errorOnDirty = core.getInput('error_on_dirty') == 'true';
    
    let needsClean = await setup.needsClean()

    if (needsClean) {
      await setup.cleanAccount(timeout)
    }

    await setup.removeCredentials()

    if (needsClean && errorOnDirty) {
      core.setFailed("The state is different. New resources were found.");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();
module.exports = __webpack_exports__;
/******/ })()
;