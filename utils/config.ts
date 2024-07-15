// utils/config.ts

// NOTE: This file is used to create config middlware functions.
// you can add your own method of parsing the config.

import color from "@utils/colors";

import fs from "fs";
import path from "path";

class Config {
	private directory: string;

	private name: string = "config";
	private ext: string = "json";

	/**
	 * Constructs a new instance of the Config class.
	 */
	constructor() {
		this.directory = path.join(__dirname, "..", this.name + "." + this.ext);
		this.exists();
	}

	/**
	 * Checks if the config file exists.
	 */
	private exists() {
		if (!fs.existsSync(this.directory)) {
			console.log(`${color.fg.yellow}WARN ${color.reset}‣ No configuration file found, you might want to create one.`);
		}
	}

	/**
	 * Public getter, returns the parsed config
	 */
	public get load() {
		if (fs.existsSync(this.directory)) {
			return JSON.parse(fs.readFileSync(this.directory, "utf8"));
		} else {
			console.error(`${color.fg.red}⨯ ${color.reset}‣ Config file does not exist.`);
		}
	}
}

export default Config;
