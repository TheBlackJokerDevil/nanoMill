const __config = path.join(__appdata, "config.json")

/**
	The config class handles a set of explicitly defined key - value pairs
	with strict value type. Entries need to be register properly before being used.
*/
class Config {
	constructor() {
		this.entries = {}
		
		// register default values
		this.regAll()
		
		// load config file
		try {
			let json = fs.readFileSync(__config)
			let data = JSON.parse(json)
			
			for(let key in data)
				try {
					this.set(key, data[key])
				} catch(e) {
					console.log("Found unregistered entry in config file: " + key)
				}
		}
		catch(e) {
			console.log("No config file found\n" + e)
		}
	}
	
	/**
		Initializes config entries with default values
	*/
	regAll() {
		this.reg("acefontsize", "number", 14)
		this.reg("acekbmode", "string", "default")
		this.reg("ocexe", "string", undefined)
		this.reg("c4group", "string", undefined)
		this.reg("pages", "array", null)
		this.reg("author", "string", "Twonky")
		this.reg("version", "string", "7.0")
		this.reg("workspaces", "array", null)
		this.reg("hidenonocfiles", "boolean", true)
	}
	
	/**
		Initializes a single config entry
		@param {string} key - the identifier of the entry
		@param {string} type - the type of the requested value
		@param {any} val - the value assigned to the entry
	*/
	reg(key, type, val) {
		this.entries[key] = { type, val }
	}
	
	/**
		Deletes a single entry from the list
		@param {string} key - the identifier of the entry
	*/
	wipe(key) {
		delete this.entries[key]
	}
	
	/**
		Rebuilds config from default values
	*/
	wipeAll() {
		this.entries = {}
		this.regAll()
	}
	
	/**
		Assigns a value to the entry of the given identifier
		@param {string} key - the identifier of the entry has to be declared once by reg()
		@param {any} val - the value assigned to the entry, has to match the
							type given to reg()
	*/
	set(key, val) {
		let cval = this.entries[key]
		if(!cval)
			throw new Error("Trying to set unregistered config entry")
		
		let type = typeof val
		if(type === "object") {
			if(cval.type === "array" && val !== null) {
				if(val.constructor === Array)
					cval.val = val
				else
					throw new Error(`Setting config entry ${key} does not match type array. Given: ${val}.`)
			}
			else if (typeof cval.type === "object")
				cval.val = val
			else
				throw new Error(`Setting config entry ${key} does not match type ${cval.type}. Given: ${val}.`)
		}
		else if(typeof val === cval.type)
			cval.val = val
		else
			throw new Error(`Setting config entry ${key} does not match type ${cval.type}. Given: ${val}.`)
	}
	
	/**
		Returns the value of an entry
		@param {string} key - the identifier of the entry
		@return {any} - the value of the entry
	*/
	get(key) {
		return this.entries[key] ? this.entries[key].val : undefined
	}
	
	/**
		Checks if an entry with the given identifier has been declared
		@param {string} key - the identifier of the entry
	*/
	has(key) {
		return this.entries[key] ? true : false
	}
	
	/**
		Saves the config synchronously
	*/
	save() {
		let o = {}
		for(let key in this.entries)
			o[key] = this.entries[key].val
		
		fs.writeFileSync(__config, JSON.stringify(o))
	}
}

module.exports = new Config()