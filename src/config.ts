import { getConfig } from 'doge-config';

export const config = getConfig('nodesite-db-server');

export const port = (config.num.port ||= 22911);
export const cert = config.str.cert;
export const key = config.str.key;
export const database_storage_location =
	(config.str.database_storage_location ||= '../nodesite-db-storage');
