// utils/sql.ts

import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";

class sql {
	private db: sqlite3.Database | null = null;
	private path: string | null = null;

	/**
	 * Constructs a new instance of the sql class.
	 * @param location - A boolean for in-memory database or a string for file-based database.
	 */
	constructor(location: boolean | string) {
		sqlite3.verbose();
		if (typeof location === "boolean") {
			this.path = ":memory:";
		} else {
			this.path = path.resolve(__dirname, "..", "storage", `${location}.db`);
			if (!fs.existsSync(path.dirname(this.path))) {
				fs.mkdirSync(path.dirname(this.path), { recursive: true });
			}
		}
	}

	/**
	 * Get the SQLite database instance.
	 * @returns The SQLite database instance.
	 */
	public get get() {
		return this.db;
	}

	/**
	 * Initializes the SQLite database connection.
	 * @returns A promise that resolves when the database connection is established.
	 */
	private init(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.path) {
				this.db = new sqlite3.Database(this.path, (err) => {
					if (err) reject(err);
					else resolve();
				});
			}
		});
	}

	/**
	 * Executes a SQL query with optional parameters.
	 * @param query - The SQL query to execute.
	 * @param params - Optional parameters for the SQL query.
	 * @returns A promise that resolves with the query results.
	 */
	public query<T>(query: string, params: any[] = []): Promise<T[]> {
		return new Promise(async (resolve, reject) => {
			if (!this.db) await this.init();
			this.db!.all(query, params, (err, rows) => {
				if (err) reject(err);
				else resolve(rows as T[]);
			});
		});
	}

	/**
	 * Refreshes the SQLite database connection.
	 * @returns A promise that resolves when the database connection is refreshed.
	 */
	public refresh(): Promise<void> {
		return new Promise(async (resolve, reject) => {
			if (this.db) {
				this.db.close((err) => {
					if (err) reject(err);
					else {
						this.init().then(resolve).catch(reject);
					}
				});
			} else {
				this.init().then(resolve).catch(reject);
			}
		});
	}
}

export default sql;
