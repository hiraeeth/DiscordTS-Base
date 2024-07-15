// utils/logger.ts

import fs from "fs";
import path from "path";

class Logger {
	private directory: string;

	/**
	 * Constructs a new instance of the Logger class.
	 */
	constructor() {
		this.directory = path.join(__dirname, "..", "logs");
		this.exists();
	}

	/**
	 * Checks if the log directory exists and creates it if it does not.
	 */
	private exists() {
		if (!fs.existsSync(this.directory)) {
			fs.mkdirSync(this.directory);
		}
	}

	/**
	 * Creates a log entry in the appropriate log file.
	 * @param type - The type of log entry (e.g., "log", "warn", "debug", "error").
	 * @param message - The message to log.
	 */
	private create(type: string, message: string) {
		const now = new Date();
		const day = String(now.getDate()).padStart(2, "0");
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const year = String(now.getFullYear());

		const timestamp = now.toISOString().replace(/T/, "-").replace(/\..+/, "").replace(/:/g, ":");
		const name = `${type}_${day}_${month}_${year}.log`;
		const file_path = path.join(this.directory, name);
		fs.writeFileSync(file_path, `[${timestamp}] ${message} \n`, { flag: "a+" });
	}

	/**
	 * Logs a message to the log file.
	 * @param message - The message to log.
	 */
	public log(message: string) {
		this.create("log", message);
	}

	/**
	 * Logs a warning message to the warn log file.
	 * @param message - The message to log.
	 */
	public warn(message: string) {
		this.create("warn", message);
	}

	/**
	 * Logs a debug message to the debug log file.
	 * @param message - The message to log.
	 */
	public debug(message: string) {
		this.create("debug", message);
	}

	/**
	 * Logs an error message to the error log file.
	 * @param message - The message to log.
	 */
	public error(message: string) {
		this.create("error", message);
	}
}

export default new Logger();
