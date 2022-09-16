import fs from 'fs';
import http from 'http';
import https from 'https';

import { port, cert, key } from './config';

export const httpServer =
	cert && key
		? new https.Server({
				cert: fs.readFileSync(cert),
				key: fs.readFileSync(key),
		  })
		: new http.Server();

httpServer.listen(port);
