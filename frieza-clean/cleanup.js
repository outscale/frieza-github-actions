const core = require('@actions/core');

const setup = require('./lib/frieza');

(async () => {
  try {
    const timeout = core.getInput('clean_timeout');
    await setup.cleanAccount(timeout)
    await setup.removeCredentials()
} catch (error) {
    core.setFailed(error.message);
}
})();