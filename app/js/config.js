const __config = path.join(__appdata, "config.json")

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
	
	reg(key, type, val) {
		this.entries[key] = { type, val }
	}
	
	wipe(key) {
		delete this.entries[key]
	}
	
	wipeAll() {
		this.entries = {}
		this.regAll()
	}
	
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
	
	get(key) {
		return this.entries[key] ? this.entries[key].val : undefined
	}
	
	has(key) {
		return this.entries[key] ? true : false
	}
	
	save() {
		let o = {}
		for(let key in this.entries)
			o[key] = this.entries[key].val
		
		fs.writeFileSync(__config, JSON.stringify(o))
	}
}

module.exports = new Config()