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

var cleanup$1 = {};

var hasRequiredCleanup;

function requireCleanup () {
	if (hasRequiredCleanup) return cleanup$1;
	hasRequiredCleanup = 1;
	const core = requireCore();

	const setup = requireFrieza();

	(async () => {
	  try {
	    const timeout = core.getInput('clean_timeout');
	    const errorOnDirty = core.getInput('error_on_dirty') == 'true';
	    
	    let needsClean = await setup.needsClean();

	    if (needsClean) {
	      await setup.cleanAccount(timeout);
	    }

	    await setup.removeCredentials();

	    if (needsClean && errorOnDirty) {
	      core.setFailed("The state is different. New resources were found.");
	    }
	  } catch (error) {
	    core.setFailed(error.message);
	  }
	})();
	return cleanup$1;
}

var cleanupExports = requireCleanup();
var cleanup = /*@__PURE__*/getDefaultExportFromCjs(cleanupExports);

export { cleanup as default };
//# sourceMappingURL=post.js.map
