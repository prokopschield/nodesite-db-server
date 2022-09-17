import { hash, verify } from 'doge-passwd';
import * as csvdb from 'nscdn-csvdb';
import { Socket } from 'socket.io';

import { database_storage_location } from './config';
import { ioServer } from './ioServer';

export async function main() {
	const database = new csvdb.Database(database_storage_location);

	const users = await database.getTable('users', {
		username: 'string',
		password: 'string',
	});

	ioServer.on('connection', (socket: Socket) => {
		const close = () => {
			socket.removeAllListeners();
			socket.emit('goodbye');
		};

		socket.emit('auth', async (username: string, password: string) => {
			if (typeof username !== 'string' || typeof password !== 'string') {
				return close();
			}

			const [user] = await users.find_first({ username });

			if (!user) {
				await users.insert({
					username,
					password: hash(password),
				});
			} else if (!verify(password, user.password)) {
				return close();
			}

			const tables = new Map<string, csvdb.Table<any>>();

			socket.emit('commands', ['tables', 'table', 'insert', 'find']);

			socket.on('tables', (callback: (tables: string[]) => void) => {
				if (callback instanceof Function) {
					callback([...tables.keys()]);
				}
			});

			socket.on(
				'table',
				async (
					name: string,
					template: Record<string, csvdb.types.ValueType>,
					callback: (table: string) => void
				) => {
					if (
						typeof name !== 'string' ||
						typeof template !== 'object' ||
						typeof callback !== 'function'
					) {
						return close();
					}

					const table_name = await csvdb.utils.serializer.serialize(
						username +
							name +
							(await csvdb.utils.serializer.serialize(template))
					);

					const table = await database.getTable(table_name, template);

					tables.set(table_name, table);

					callback(table_name);
				}
			);

			socket.on(
				'insert',
				async (
					table: string,
					value: Record<string, csvdb.types.ValueType>,
					callback: () => void
				) => {
					if (
						typeof table !== 'string' ||
						typeof value !== 'object' ||
						typeof callback !== 'function'
					) {
						return close();
					}

					for (const value_value of Object.values(value)) {
						if (
							typeof value_value !== 'object' &&
							typeof value_value !== 'string'
						) {
							return close();
						}
					}

					await tables.get(table)?.insert(value);

					callback();
				}
			);

			socket.on(
				'find',
				async (
					table: string,
					value: Partial<Record<string, csvdb.types.ValueType>>,
					callback: (
						records:
							| Array<Record<string, csvdb.types.ValueType>>
							| undefined
					) => void
				) => {
					if (
						typeof table !== 'string' ||
						typeof value !== 'object' ||
						typeof callback !== 'function'
					) {
						return close();
					}

					for (const value_value of Object.values(value)) {
						if (
							typeof value_value !== 'object' &&
							typeof value_value !== 'string'
						) {
							return close();
						}
					}

					callback(await tables.get(table)?.find(value));
				}
			);
		});
	});
}
