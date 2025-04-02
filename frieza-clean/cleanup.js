const core = require('@actions/core');

const setup = require('./lib/frieza');

(async () => {
  try {
    const timeout = core.getInput('clean_timeout');
    const errorOnDirty = core.getInput('error_on_dirty') == 'true';
    
    let needsClean = await setup.needsClean()

    if (needsClean) {
      //await setup.cleanAccount(timeout)
    }

    //await setup.removeCredentials()

    if (needsClean && errorOnDirty) {
      core.setFailed("The state is different. New resources were found.");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();