import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { getOctokit } from '@actions/github'
import * as io from '@actions/io'
import * as tc from '@actions/tool-cache'
import * as os from 'os'
import * as path from 'path'

export interface Asset {
    name: string
    browser_download_url: string
}

export interface Release {
    tag_name: string
    assets: Asset[]
}

const default_profile_name = 'action'
const default_snapshot_name = 'snapshot-action'

export async function getRelease(release: string, githubToken: string): Promise<Release> {
    const octokit = getOctokit(githubToken);
    let response: { data: Release; status: number };
    const params = { owner: 'outscale', repo: 'frieza' }

    if (release == '' || release == 'latest') {
        response = await octokit.rest.repos.getLatestRelease(params);
    } else {
        response = await octokit.rest.repos.getReleaseByTag({ ...params, tag: release });
    }

    core.debug(`Fetch release response: ${response.data} ${response.status}`);

    return response.data;
}

export function getAssetURL(assets: Asset[], assetName: string): string {
    for (const element of assets) {
        if ("name" in element && element["name"].startsWith(assetName)) {
            return element["browser_download_url"]
        }
    }
    throw new Error(`Could not determine asset url`);
}

async function copyBinary(pathToCLI: string, release_tag: string): Promise<void> {
    const exeSuffix = os.platform().startsWith('win') ? '.exe' : '';

    const source = [pathToCLI, `frieza_${release_tag}${exeSuffix}`].join(path.sep);
    const target = [pathToCLI, `frieza${exeSuffix}`].join(path.sep);

    try {
        core.debug(`Moving ${source} to ${target}.`);
        await io.mv(source, target);
    } catch (e) {
        core.error(`Unable to move ${source} to ${target}.`);
        throw e;
    }
}

export async function downloadBinary(release: string, githubToken: string): Promise<string> {
    let release_data = await getRelease(release, githubToken)

    let release_tag = release_data["tag_name"]
    if (!release_tag) {
        throw new Error("no `tag_name` for release" + release)
    }
    if (release_tag.startsWith("v")) {
        release_tag = release_tag.substring(1)
    }

    const arch = mapArch(os.arch())
    let cachedPath = tc.find('frieza', release_tag, arch)
    if (cachedPath) {
        core.debug(`Using cached Frieza from ${cachedPath}`)
        return cachedPath;
    }

    const asset_name = "frieza_" + release_tag + "_" + mapOS(os.platform()) + "_" + arch
    const url = getAssetURL(release_data["assets"], asset_name)

    core.debug(`Downloading Frieza from ${url}`);
    const downloadedPath = await tc.downloadTool(url)

    let friezaFolder = "";
    if (url.endsWith(".zip")) {
        core.debug('Extracting Frieza zip file');
        friezaFolder = await tc.extractZip(downloadedPath);
    } else if (url.endsWith(".tar.gz")) {
        core.debug('Extracting Frieza tar file');
        friezaFolder = await tc.extractTar(downloadedPath);
    } else {
        throw new Error(`Unknown archive format`);
    }

    core.debug(`Frieza path is ${friezaFolder}.`);

    if (!downloadedPath || !friezaFolder) {
        throw new Error(`Unable to download Frieza from ${url}`);
    }

    await copyBinary(friezaFolder, `v${release_tag}`)

    cachedPath = await tc.cacheDir(friezaFolder, 'frieza', release_tag, arch)
    core.addPath(cachedPath)

    return cachedPath;
}

export function mapArch(arch: string): string {
    const mappings: Record<string, string> = {
        'x32': '386',
        'x64': 'amd64'
    }
    return mappings[arch] || arch
}

export function mapOS(platform: string): string {
    const mappings: Record<string, string> = {
        'win32': 'windows'
    };
    return mappings[platform] || platform;
}

export async function addCredentials(accessKey: string, secretKey: string, region: string, providers: string[]): Promise<void> {
    core.debug(`Add credentials to frieza`);

    await exec.exec('frieza', [
        'profile',
        'new',
        providers[0],
        `--region=${region}`,
        `--ak=${accessKey}`,
        `--sk=${secretKey}`,
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

export async function removeCredentials(): Promise<void> {
    core.debug(`Remove credentials of frieza`);
    await exec.exec('frieza', ['profile', 'remove', default_profile_name]);
}

export async function makeSnapshot(options: { only_resource_types: string; exclude_resource_types: string }): Promise<void> {
    core.debug(`Make a snapshot`);

    let args = ['snapshot', 'new', default_snapshot_name, default_profile_name];
    if (Object.hasOwn(options, "only_resource_types")
        && typeof options["only_resource_types"] === "string"
        && options["only_resource_types"].length > 0) {
        args.push("--only-resource-types=" + options["only_resource_types"])
    }
    if (Object.hasOwn(options, "exclude_resource_types")
        && typeof options["exclude_resource_types"] === "string"
        && options["exclude_resource_types"].length > 0) {
        args.push("--exclude-resource-types=" + options["exclude_resource_types"])
    }

    await exec.exec('frieza', args);
}

export async function needsClean(): Promise<boolean> {
    core.debug(`Check if the account needs to be cleaned`)
    let execOutput = exec.getExecOutput('frieza', ['clean', '--plan', '--json', '--auto-approve', default_snapshot_name]);
    return execOutput.then(stdout => {
        let dataJson = JSON.parse(stdout.stderr) as { targets: { objects: Record<string, unknown> }[] };
        return dataJson.targets.some(target => Object.keys(target.objects).length != 0)
    })
}

export async function cleanAccount(timeout: string, ignoreCleanupFailure: boolean, bypassDeletionProtection: boolean): Promise<void> {
    core.debug(`Clean account`);
    const args = ['clean', '--timeout=' + timeout, '--auto-approve', default_snapshot_name];
    if (bypassDeletionProtection) {
        args.push('--bypass-deletion-protection');
    }

    await exec.exec('frieza', args, { ignoreReturnCode: ignoreCleanupFailure });
}

export function joinMultilineCommands(commands: string[]): string[] {
    const result: string[] = []
    const re = /\\\s*$/
    const buf: string[] = []

    for (const cmd of commands) {
        buf.push(cmd.replace(re, '')) // push command into buffer

        if (!re.test(cmd)) { // if command not ends with \
            result.push(buf.join(' ')) // join buffer and push into result

            buf.length = 0 // clear buffer
        }
    }

    return result
}

export async function runCommands(commands: string[], shell: string): Promise<void> {
    const options = {
        silent: true,
        listeners: {
            stdline: (data: string) => core.info(data),
            errline: (data: string) => core.info(data),
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

export async function post(post: string[], shell: string): Promise<void> {
    return runCommands(joinMultilineCommands(post), shell)
}
