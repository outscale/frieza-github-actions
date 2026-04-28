const core = require('@actions/core');

const setup = require('./lib/frieza');

(async () => {
    try {
        const access_key = core.getInput('access_key');
        const secret_key = core.getInput('secret_key');
        const region = core.getInput('region')
        const release = core.getInput('release');

        const providersInput = core.getInput('providers');
        const providers = providersInput.split(',').map(p => p.trim()).filter(p => p !== '');

        const only_resource_types = core.getInput('only_resource_types');
        const exclude_resource_types = core.getInput('exclude_resource_types');

        // Binary
        const pathToCLI = await setup.downloadBinary(release)
        core.debug(`Add ${pathToCLI} to PATH`)
        core.addPath(pathToCLI);

        // Credentials
        await setup.addCredentials(access_key, secret_key, region, providers)

        // Snapshot
        await setup.makeSnapshot({
            only_resource_types: only_resource_types,
            exclude_resource_types: exclude_resource_types,
        })

    } catch (error) {
        core.setFailed(error.message);
    }
})();
