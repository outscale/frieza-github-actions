import { r as requireCore, a as requireFrieza, g as getDefaultExportFromCjs } from './frieza-oHXM-Zib.js';
import 'os';
import 'crypto';
import 'fs';
import 'path';
import 'http';
import 'https';
import 'net';
import 'tls';
import 'events';
import 'assert';
import 'util';
import 'stream';
import 'buffer';
import 'querystring';
import 'stream/web';
import 'node:stream';
import 'node:util';
import 'node:events';
import 'worker_threads';
import 'perf_hooks';
import 'util/types';
import 'async_hooks';
import 'console';
import 'url';
import 'zlib';
import 'string_decoder';
import 'diagnostics_channel';
import 'child_process';
import 'timers';

var friezaClean = {};

var hasRequiredFriezaClean;

function requireFriezaClean () {
	if (hasRequiredFriezaClean) return friezaClean;
	hasRequiredFriezaClean = 1;
	const core = requireCore();

	const setup = requireFrieza();

	(async () => {
	  try {
	    const access_key = core.getInput('access_key');
	    const secret_key = core.getInput('secret_key');
	    const region = core.getInput('region');
	    const release = core.getInput('release');

	    // Binary
	    const pathToCLI = await setup.downloadBinary(release);
	    core.debug(`Add ${pathToCLI} to PATH`);
	    core.addPath(pathToCLI);

	    // Credentials
	    await setup.addCredentials(access_key, secret_key, region);

	    // Snapshot
	    await setup.makeSnapshot();

	} catch (error) {
	    core.setFailed(error.message);
	}
	})();
	return friezaClean;
}

var friezaCleanExports = requireFriezaClean();
var index = /*@__PURE__*/getDefaultExportFromCjs(friezaCleanExports);

export { index as default };
//# sourceMappingURL=main.js.map
