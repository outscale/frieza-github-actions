const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const io = require('@actions/io');
const exec = require('@actions/exec');

const fetch = require('node-fetch')
const os = require('os');
const path = require('path');

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
        if (element["name"].startsWith(asset_name)) {
            return element["browser_download_url"]
        }
    }
    throw new Error(`Could not determine asset url`);
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

    const asset_name = "frieza_" + release_tag + "_" + mapOS(os.platform()) + "_" + mapArch(os.arch())
    const url = getAssetURL(release_data["assets"], asset_name)

    core.debug(`Downloading Frieza from ${url}`);
    const downloadedPath = await tc.downloadTool(url)

    let pathToCLI = "";
    if (url.endsWith(".zip")) {
        core.debug('Extracting Frieza zip file');
        pathToCLI = await tc.extractZip(downloadedPath);
    } else if (url.endsWith(".tar.gz")) {
        core.debug('Extracting Frieza tar file');
        pathToCLI = await tc.extractTar(downloadedPath);
    } else {
        throw new Error(`Unknown archive format`);
    }

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

async function addCredentials(access_key, secret_key, region, providers) {
    core.debug(`Add credentials to frieza`);

    await exec.exec('frieza', [
        'profile',
        'new',
        providers[0],
        `--region=${region}`,
        `--ak=${access_key}`,
        `--sk=${secret_key}`,
        default_profile_name,
    ]);

    for (let i = 1; i < providers.length; i++) {
        await exec.exec('frieza', [
            'profile',
            'add-provider',
            providers[i],
            default_profile_name,
        ]);
    }
}

async function removeCredentials() {
    core.debug(`Remove credentials of frieza`);
    await exec.exec('frieza', ['profile', 'remove', default_profile_name]);
}

async function makeSnapshot(options) {
    core.debug(`Make a snapshot`);

    let args = ['snapshot', 'new', default_snapshot_name, default_profile_name];
    if (Object.hasOwn(options, "only_resource_types")
        && typeof options["only_resource_types"] === "string"
        && options["only_resource_types"].length > 0) {
        args.push("--only_resource_types=" + options["only_resource_types"])
    }
    if (Object.hasOwn(options, "exclude_resource_types")
        && typeof options["exclude_resource_types"] === "string"
        && options["exclude_resource_types"].length > 0) {
        args.push("--exclude_resource_types=" + options["exclude_resource_types"])
    }

    await exec.exec('frieza', args);
}

async function needsClean() {
    core.debug(`Check if the account needs to be cleaned`)
    execOutput = exec.getExecOutput('frieza', ['clean', '--plan', '--json', '--auto-approve', default_snapshot_name]);
    return execOutput.then(stdout => {
        dataJson = JSON.parse(stdout.stderr);
        return dataJson.targets.some(target => Object.keys(target.objects).length != 0)
    })
}

async function cleanAccount(timeout, ignoreCleanupFailure) {
    core.debug(`Clean account`);
    await exec.exec('frieza', ['clean', '--timeout=' + timeout, '--auto-approve', default_snapshot_name], { ignoreReturnCode: ignoreCleanupFailure });
}

function joinMultilineCommands(commands) {
    const result = []
    const re = /\\\s*$/
    const buf = []

    for (const cmd of commands) {
        buf.push(cmd.replace(re, '')) // push command into buffer

        if (!re.test(cmd)) { // if command not ends with \
            result.push(buf.join(' ')) // join buffer and push into result

            buf.length = 0 // clear buffer
        }
    }

    return result
}

async function runCommands(commands, shell) {
    const options = {
        silent: true,
        listeners: {
            stdline: (data) => info(data),
            errline: (data) => info(data),
        },
    }

    return (async () => {
        for (const command of commands) {
            if (command && command.trim() !== '') {
                core.info(command);

                const exitCode = shell === ''
                    ? await exec.exec(command, [], options)
                    : await exec.exec(shell, ['-c', command], options);

                if (exitCode !== 0) {
                    core.setFailed(`Command failed with exit code ${exitCode}`);
                }
            }
        }
    })().catch(error => core.setFailed(error.message))
}

async function post(post, shell) {
    return runCommands(joinMultilineCommands(post), shell)
}

exports.makeSnapshot = makeSnapshot;
exports.addCredentials = addCredentials;
exports.removeCredentials = removeCredentials;
exports.downloadBinary = downloadBinary;
exports.cleanAccount = cleanAccount;
exports.needsClean = needsClean;
exports.post = post;
