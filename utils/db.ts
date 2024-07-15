// utils/db.ts

import mysql, { Connection as MYSQL_Connection } from "mysql2/promise";
import color from "@utils/colors";

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

export type Connection = MYSQL_Connection;

export enum DBStates {
	connecting,
	connected,
	error,
	closed,
}

export interface DBOptions {
	host?: string;
	user?: string;
	password?: string;
	database?: string;
	port?: number;
	alias?: string;
}

class DBClass {
	private _connection: Connection | null = null;
	public state: DBStates = DBStates.closed;
	private options: DBOptions;
	public DEBUG: boolean = false;

	/**
	 * Creates an instance of the DB_MODULE class.
	 * @param {DBOptions} [options] - Optional database connection parameters.
	 */

	constructor(options?: DBOptions) {
		this.options = options || {};
		this.connect();
	}

	/**
	 * Connects to the database using provided options or environment variables.
	 * @returns {Promise<void>}
	 */
	private async connect(): Promise<void> {
		try {
			this.state = DBStates.connecting;

			const cfg = {
				host: this.options.host || DB_HOST,
				port: this.options.port || Number(DB_PORT),
				user: this.options.user || DB_USER,
				password: this.options.password || DB_PASSWORD,
				database: this.options.database || DB_NAME,
			};

			this._connection = await mysql.createConnection(cfg);

			if (this._connection) {
				this.state = DBStates.connected;
				if (this.DEBUG) {
					console.log(`${color.fg.green}[✓] Connected to the database: ${this.options.alias || this.options.database}.${color.reset}`);
				}
			}
		} catch (error) {
			console.error(`${color.fg.red}⨯ ${error}${color.reset}`);
			this.state = DBStates.error;
			throw error;
		}
	}

	/**
	 * Forcefully closes the database connection.
	 * @returns {Promise<void>}
	 */
	public async end(): Promise<void> {
		try {
			if (this._connection) {
				await this.quit();
				if (this.DEBUG) {
					console.log(`${color.fg.green}[✓] Connection forcefully closed.${color.reset}`);
				}
			}
		} finally {
			this.state = DBStates.closed;
		}
	}

	/**
	 * Executes a SQL query on the database.
	 * @template T
	 * @param {string} sql - The SQL query string.
	 * @param {any[]} [values] - Optional array of values to be replaced in the query.
	 * @returns {Promise<T[]>} - A promise that resolves to the query result.
	 */
	public async query<T>(sql: string, values?: any[]): Promise<T[]> {
		try {
			if (!this._connection) {
				await this.connect();
			}

			const [result] = await this._connection!.execute(sql, values);
			return result as T[];
		} catch (error) {
			console.error(`${color.fg.red}⨯ ${error}${color.reset}`);
			this.state = DBStates.error;
			throw error;
		}
	}

	/**
	 * Get the database connection handle
	 * @returns {Connection}
	 */
	get connection(): Connection | null {
		return this._connection;
	}

	/**
	 * Safely closes the database connection.
	 * @returns {Promise<void>}
	 */
	private async quit(): Promise<void> {
		try {
			if (this._connection) {
				await this._connection.end();
				console.log(`${color.fg.green}[✓] Connection closed.${color.reset}`);
			}
		} finally {
			this.state = DBStates.closed;
		}
	}
}

export default DBClass;
