const core = require('@actions/core');

const setup = require('./lib/frieza');

(async () => {
    let error = null;

    try {
        const timeout = core.getInput('clean_timeout');
        const errorOnDirty = core.getInput('error_on_dirty') == 'true';
        const ignoreCleanupFailure = core.getInput('ignore_cleanup_failure') == 'true';

        let needsClean = await setup.needsClean()

        if (needsClean) {
            await setup.cleanAccount(timeout, ignoreCleanupFailure)
        }

        await setup.removeCredentials()

        if (needsClean && errorOnDirty) {
            core.setFailed("The state is different. New resources were found.");
        }
    } catch (e) {
        error = e;
    }

    try {
        const post = core.getMultilineInput('post_script');
        const shell = core.getInput('post_shell');

        await setup.post(post, shell);
    } catch (e) {
        if (!error) {
            error = e;
        }
    }

    if (error) {
        core.setFailed(error);
    }
})();
