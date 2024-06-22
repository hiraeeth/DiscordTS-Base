import color from "@utils/colors";

import fs from "fs";
import path from "path";

class Logger {
	private directory: string;

	constructor() {
		this.directory = path.join(__dirname, "..", "logs");
		this.exists();
	}

	private exists() {
		if (!fs.existsSync(this.directory)) {
			fs.mkdirSync(this.directory);
		}
	}

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

	public log(message: string) {
		this.create("log", message);
	}

	public warn(message: string) {
		this.create("warn", message);
	}

	public debug(message: string) {
		this.create("debug", message);
	}

	public error(message: string) {
		this.create("error", message);
	}
}

export default new Logger();
