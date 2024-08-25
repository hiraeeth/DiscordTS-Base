export class QueryBuilder {
	private operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "REPLACE" = "SELECT";

	private fields: string[] = [];
	private wheres: Record<string, any> = {};
	private table: string = "";
	private allvalues: any[] = [];
	private setValues: Record<string, any> = {};

	private orderBy: string = "";
	private orderDir: "ASC" | "DESC" = "ASC";

	private strings: Record<string, string> = {};
	private dates: Record<string, string> = {};
	private numerics: Record<string, string> = {};

	private _groupBy: string[] = [];
	private _having: Record<string, any> = {};
	private _limit: number | null = null;
	private _offset: number | null = null;
	private _joins: { type: string; table: string; on: string }[] = [];
	private _distinct: boolean = false;

	private unpack = (result: { query: string; params: any[] }): [string, any[]] => {
		return [result.query, result.params];
	};

	/**
	 * Sets the operation to SELECT and specifies the columns to select.
	 * @param columns - The columns to select.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	select(...columns: string[]) {
		this.operation = "SELECT";
		this.fields = columns;
		return this;
	}

	/**
	 * Sets the operation to SELECT and selects everything from specific table.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	selectAll() {
		this.operation = "SELECT";
		this.fields = ["*"];
		return this;
	}

	/**
	 * Specifies the table to select from.
	 * @param table - The table name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	from(table: string) {
		this.table = table;
		return this;
	}

	/**
	 * Adds a WHERE clause to the query.
	 * @param column - The column name.
	 * @param value - The value to compare against.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	where(column: string, value: any) {
		this.wheres[column] = value;
		return this;
	}

	/**
	 * Sets the operation to INSERT and specifies the columns to insert.
	 * @param columns - The columns to insert.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	insert(...columns: string[]) {
		this.operation = "INSERT";
		this.fields = columns;
		return this;
	}

	/**
	 * Specifies the table to insert into.
	 * @param table - The table name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	into(table: string) {
		this.table = table;
		return this;
	}

	/**
	 * Specifies the values to insert.
	 * @param values - The values to insert.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	values(...values: any[]) {
		this.allvalues = values;
		return this;
	}

	/**
	 * Sets the operation to UPDATE and specifies the table to update.
	 * @param table - The table name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	update(table: string) {
		this.operation = "UPDATE";
		this.table = table;
		return this;
	}

	/**
	 * Adds a SET clause to the UPDATE query.
	 * @param column - The column name.
	 * @param value - The value to set.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	set(column: string, value: any) {
		this.setValues[column] = value;
		return this;
	}

	/**
	 * Sets the operation to DELETE.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	delete() {
		this.operation = "DELETE";
		return this;
	}

	/**
	 * Sets the operation to REPLACE and specifies the columns to replace.
	 * @param columns - The columns to replace.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	replace(...columns: string[]) {
		this.operation = "REPLACE";
		this.fields = columns;
		return this;
	}

	/**
	 * Specifies the table to replace into.
	 * @param table - The table name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	in(table: string) {
		this.table = table;
		return this;
	}

	/**
	 * Specifies the values to replace.
	 * @param values - The values to replace.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	with(...values: any[]) {
		this.allvalues = values;
		return this;
	}

	/**
	 * Adds an ORDER BY clause to the query.
	 * @param column - The column to order by.
	 * @param direction - The order direction, default is 'ASC'.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	sort(column: string, direction: "ASC" | "DESC" = "ASC") {
		this.orderBy = column;
		this.orderDir = direction;
		return this;
	}

	/**
	 * Applies the UPPER function to a column.
	 * @param column - The column name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	upper(column: string) {
		this.strings[column] = `UPPER(${column})`;
		return this;
	}

	/**
	 * Applies the LOWER function to a column.
	 * @param column - The column name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	lower(column: string) {
		this.strings[column] = `LOWER(${column})`;
		return this;
	}

	/**
	 * Applies the CONCAT function to a column.
	 * @param column - The column name.
	 * @param values - The values to concatenate.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	concat(column: string, ...values: string[]) {
		this.strings[column] = `CONCAT(${column}, ${values.join(", ")})`;
		return this;
	}

	/**
	 * Adds the CURDATE function to the query.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	curdate() {
		this.dates["curdate"] = `CURDATE()`;
		return this;
	}

	/**
	 * Adds the NOW function to the query.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	now() {
		this.dates["now"] = `NOW()`;
		return this;
	}

	/**
	 * Applies the DATE_FORMAT function to a column.
	 * @param column - The column name.
	 * @param format - The date format.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	dateFormat(column: string, format: string) {
		this.dates[column] = `DATE_FORMAT(${column}, '${format}')`;
		return this;
	}

	/**
	 * Applies the DAY function to a column.
	 * @param column - The column name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	day(column: string) {
		this.dates[column] = `DAY(${column})`;
		return this;
	}

	/**
	 * Applies the MONTH function to a column.
	 * @param column - The column name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	month(column: string) {
		this.dates[column] = `MONTH(${column})`;
		return this;
	}

	/**
	 * Applies the YEAR function to a column.
	 * @param column - The column name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	year(column: string) {
		this.dates[column] = `YEAR(${column})`;
		return this;
	}

	/**
	 * Applies the ABS function to a column.
	 * @param column - The column name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	abs(column: string) {
		this.numerics[column] = `ABS(${column})`;
		return this;
	}

	/**
	 * Applies the ROUND function to a column.
	 * @param column - The column name.
	 * @param decimals - The number of decimal places.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	round(column: string, decimals: number) {
		this.numerics[column] = `ROUND(${column}, ${decimals})`;
		return this;
	}

	/**
	 * Applies the FLOOR function to a column.
	 * @param column - The column name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	floor(column: string) {
		this.numerics[column] = `FLOOR(${column})`;
		return this;
	}

	/**
	 * Applies the CEIL function to a column.
	 * @param column - The column name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	ceil(column: string) {
		this.numerics[column] = `CEIL(${column})`;
		return this;
	}

	/**
	 * Applies the POW function to a column.
	 * @param column - The column name.
	 * @param exponent - The exponent.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	pow(column: string, exponent: number) {
		this.numerics[column] = `POW(${column}, ${exponent})`;
		return this;
	}

	/**
	 * Applies the SQRT function to a column.
	 * @param column - The column name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	sqrt(column: string) {
		this.numerics[column] = `SQRT(${column})`;
		return this;
	}

	/**
	 * Adds a GROUP BY clause to the query.
	 * @param columns - The columns to group by.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	groupBy(...columns: string[]) {
		this._groupBy = columns;
		return this;
	}

	/**
	 * Adds a HAVING clause to the query.
	 * @param column - The column name.
	 * @param value - The value to compare against.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	having(column: string, value: any) {
		this._having[column] = value;
		return this;
	}

	/**
	 * Adds a LIMIT clause to the query.
	 * @param limit - The number of rows to limit.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	limit(limit: number) {
		this._limit = limit;
		return this;
	}

	/**
	 * Adds an OFFSET clause to the query.
	 * @param offset - The number of rows to offset.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	offset(offset: number) {
		this._offset = offset;
		return this;
	}

	/**
	 * Adds a JOIN clause to the query.
	 * @param type - The type of join (INNER, LEFT, RIGHT, FULL).
	 * @param table - The table to join.
	 * @param on - The condition to join on.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	join(type: string, table: string, on: string) {
		this._joins.push({ type, table, on });
		return this;
	}

	/**
	 * Adds a DISTINCT clause to the query.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	distinct() {
		this._distinct = true;
		return this;
	}

	/**
	 * Adds a COUNT aggregate function to the query.
	 * @param column - The column name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	count(column: string) {
		this.fields.push(`COUNT(${column})`);
		return this;
	}

	/**
	 * Adds a SUM aggregate function to the query.
	 * @param column - The column name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	sum(column: string) {
		this.fields.push(`SUM(${column})`);
		return this;
	}

	/**
	 * Adds an AVG aggregate function to the query.
	 * @param column - The column name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	avg(column: string) {
		this.fields.push(`AVG(${column})`);
		return this;
	}

	/**
	 * Adds a MIN aggregate function to the query.
	 * @param column - The column name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	min(column: string) {
		this.fields.push(`MIN(${column})`);
		return this;
	}

	/**
	 * Adds a MAX aggregate function to the query.
	 * @param column - The column name.
	 * @returns The QueryBuilder instance for method chaining.
	 */
	max(column: string) {
		this.fields.push(`MAX(${column})`);
		return this;
	}

	/**
	 * Builds the SQL query based on the current configuration.
	 * @returns The constructed SQL query and parameters.
	 * @throws {Error} If the operation is unsupported.
	 */
	build() {
		let query = "";
		const params: any[] = [];

		switch (this.operation) {
			case "SELECT":
				query = `SELECT ${this._distinct ? "DISTINCT " : ""}${this.fields.map((field) => this.strings[field] || this.dates[field] || this.numerics[field] || field).join(", ")} FROM ${this.table}`;
				this._joins.forEach((join) => {
					query += ` ${join.type} JOIN ${join.table} ON ${join.on}`;
				});
				if (Object.keys(this.wheres).length > 0) {
					query += ` WHERE ${Object.keys(this.wheres)
						.map((k) => `${k} = ?`)
						.join(" AND ")}`;
					params.push(...Object.values(this.wheres));
				}
				if (this._groupBy.length > 0) {
					query += ` GROUP BY ${this._groupBy.join(", ")}`;
				}
				if (Object.keys(this._having).length > 0) {
					query += ` HAVING ${Object.keys(this._having)
						.map((k) => `${k} = ?`)
						.join(" AND ")}`;
					params.push(...Object.values(this._having));
				}
				if (this.orderBy) {
					query += ` ORDER BY ${this.orderBy} ${this.orderDir}`;
				}
				if (this._limit !== null) {
					query += ` LIMIT ${this._limit}`;
				}
				if (this._offset !== null) {
					query += ` OFFSET ${this._offset}`;
				}
				break;
			case "INSERT":
				query = `INSERT INTO ${this.table} (${this.fields.join(", ")}) VALUES (${this.fields.map(() => "?").join(", ")})`;
				params.push(...this.allvalues);
				break;
			case "UPDATE":
				query = `UPDATE ${this.table} SET ${Object.keys(this.setValues)
					.map((k) => `${k} = ?`)
					.join(", ")}`;
				params.push(...Object.values(this.setValues));
				if (Object.keys(this.wheres).length > 0) {
					query += ` WHERE ${Object.keys(this.wheres)
						.map((k) => `${k} = ?`)
						.join(" AND ")}`;
					params.push(...Object.values(this.wheres));
				}
				break;
			case "DELETE":
				query = `DELETE FROM ${this.table}`;
				if (Object.keys(this.wheres).length > 0) {
					query += ` WHERE ${Object.keys(this.wheres)
						.map((k) => `${k} = ?`)
						.join(" AND ")}`;
					params.push(...Object.values(this.wheres));
				}
				break;
			case "REPLACE":
				query = `REPLACE INTO ${this.table} (${this.fields.join(", ")}) VALUES (${this.fields.map(() => "?").join(", ")})`;
				params.push(...this.allvalues);
				break;
			default:
				throw new Error("Unsupported operation");
		}

		return { query, params };
	}

	/**
	 * Destructs the query to an array of query string and parameters
	 */
	destruct() {
		return this.unpack(this.build());
	}

	/**
	 * Executes the query with the given parameters.
	 * @param callback - The callback function to handle the query and parameters.
	 * @returns The result of the query execution.
	 */
	async run(callback: (query: string, params: any[]) => Promise<any>): Promise<any> {
		const { query, params } = this.build();
		return callback(query, params);
	}
}
