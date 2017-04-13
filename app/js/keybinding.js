
const
	KEY_ALT = 1,
	KEY_SHIFT = 2,
	KEY_CTRL = 4

const
	MOD_KEY_BIT_OFFSET = 3

const keyOfNames = {
	"backspace": 8,
	"tab": 9,
	"enter": 13,
	"shift": 16,
	"ctrl": 17,
	"alt": 18,
	"pause": 19,
	"caps lock": 20,
	"escape": 27,
	"page up": 33,
	"page down": 34,
	"end": 35,
	"home": 36,
	"left arrow": 37,
	"up arrow": 38,
	"right arrow": 39,
	"down arrow": 40,
	"insert": 45,
	"delete": 46,
	"0": 48,
	"1": 49,
	"2": 50,
	"3": 51,
	"4": 52,
	"5": 53,
	"6": 54,
	"7": 55,
	"8": 56,
	"9": 57,
	"a": 65,
	"b": 66,
	"c": 67,
	"d": 68,
	"e": 69,
	"f": 70,
	"g": 71,
	"h": 72,
	"i": 73,
	"j": 74,
	"k": 75,
	"l": 76,
	"m": 77,
	"n": 78,
	"o": 79,
	"p": 80,
	"q": 81,
	"r": 82,
	"s": 83,
	"t": 84,
	"u": 85,
	"v": 86,
	"w": 87,
	"x": 88,
	"y": 89,
	"z": 90,
	"left window key": 91,
	"right window key": 92,
	"select key": 93,
	"numpad0": 96,
	"numpad1": 97,
	"numpad2": 98,
	"numpad3": 99,
	"numpad4": 100,
	"numpad5": 101,
	"numpad6": 102,
	"numpad7": 103,
	"numpad8": 104,
	"numpad9": 105,
	"multiply": 106,
	"add": 107,
	"subtract": 109,
	"decimal point": 110,
	"divide": 111,
	"f1": 112,
	"f2": 113,
	"f3": 114,
	"f4": 115,
	"f5": 116,
	"f6": 117,
	"f7": 118,
	"f8": 119,
	"f9": 120,
	"f10": 121,
	"f11": 122,
	"f12": 123,
	"num lock": 144,
	"scroll lock": 145,
	"semi-colon": 186,
	"equal sign": 187,
	"comma": 188,
	"dash": 189,
	"period": 190,
	"forward slash": 191,
	"grave accent": 192,
	"open bracket": 219,
	"back slash": 220,
	"close bracket": 221,
	"single quote": 222
}

const nameOfKeys = [
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	"backspace",
	"tab",
	null,
	null,
	null,
	"enter",
	null,
	null,
	"shift",
	"ctrl",
	"alt",
	"pause",
	"caps lock",
	null,
	null,
	null,
	null,
	null,
	null,
	"escape",
	null,
	null,
	null,
	null,
	null,
	"page up",
	"page down",
	"end",
	"home",
	"left arrow",
	"up arrow",
	"right arrow",
	"down arrow",
	null,
	null,
	null,
	null,
	"insert",
	"delete",
	null,
	"0",
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	"a",
	"b",
	"c",
	"d",
	"e",
	"f",
	"g",
	"h",
	"i",
	"j",
	"k",
	"l",
	"m",
	"n",
	"o",
	"p",
	"q",
	"r",
	"s",
	"t",
	"u",
	"v",
	"w",
	"x",
	"y",
	"z",
	"left window key",
	"right window key",
	"select key",
	null,
	null,
	"numpad0",
	"numpad1",
	"numpad2",
	"numpad3",
	"numpad4",
	"numpad5",
	"numpad6",
	"numpad7",
	"numpad8",
	"numpad9",
	"multiply",
	"add",
	null,
	"subtract",
	"decimal point",
	"divide",
	"f1",
	"f2",
	"f3",
	"f4",
	"f5",
	"f6",
	"f7",
	"f8",
	"f9",
	"f10",
	"f11",
	"f12",
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	"num lock",
	"scroll lock",
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	"semi-colon",
	"equal sign",
	"comma",
	"dash",
	"period",
	"forward slash",
	"grave accent",
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	"open bracket",
	"back slash",
	"close bracket",
	'single quote'
]

class KeyMapper {
	constructor() {
		this.nameList = {}
		this.codeList = {}
		
		document.addEventListener("keyup", e => {
			let code = KeyMapper.eventToCode(e)
			
			if(code === -1)
				return
			
			if(this.codeList[code])
				this.codeList[code].exec(this.activeMdl)
		})
	}
	
	bind(name, keyString, cb, alias = "global") {
		let code = KeyMapper.keyStringToCode(keyString)
		
		if(code === -1)
			throw new Error(`Invalid keystring ${keyString} for binding ${name}`)
		
		if(!this.codeList[code])
			this.codeList[code] = new KeyBinding()
		
		this.codeList[code].set(alias, cb)
		
		this.nameList[name] = this.codeList[code]
	}
	
	setActiveModule(mdl, type) {
		this.activeMdl = mdl
	}
	
	static eventToCode(e) {
		let code = 0
		
		if(e.altKey === true)
			code += KEY_ALT
		if(e.shiftKey === true)
			code += KEY_SHIFT
		if(e.ctrlKey === true)
			code += KEY_CTRL
		
		if(!code)
			return -1
		
		return (e.keyCode << MOD_KEY_BIT_OFFSET) | code
	}
	
	static keyStringToCode(keyString) {
		let code = 0
		if(keyString.match(/alt/i))
			code += KEY_ALT
		if(keyString.match(/shift/i))
			code += KEY_SHIFT
		if(keyString.match(/ctrl/i))
			code += KEY_CTRL
		
		if(!code)
			return -1
		
		let keyName = keyString.replace(/(ctrl|shift|alt|-)/gi, "").trim().toLowerCase()
		
		return (keyOfNames[keyName] << MOD_KEY_BIT_OFFSET) | code
	}
	
	static isValidKey(c) {
		if(c === 16 || c === 17 || c == 18)
			return false
		
		return nameOfKeys[c] ? true : false
	}
	
	static nameOf(c) {
		return nameOfKeys[c]
	}
}

class KeyBinding {
	constructor() {
		this.bindings = {}
	}
	
	set(alias, cb) {
		this.bindings[alias] = cb
	}
	
	unset(alias) {
		this.bindings[alias] = null
	}
	
	getLabel() {
		
	}
	
	exec(mdl) {
		if(mdl) {
			let alias = mdl.constructor.def.alias
			
			if(this.bindings[alias])
				this.bindings[alias](mdl)
			else if(this.bindings["global"])
				this.bindings["global"]()
		}
		else if(this.bindings["global"])
			this.bindings["global"]()
	}
}

/**
	dev function to create array of nameOfKeys
	automatically
*/
function printNameOfKeys() {
	let a = []
	for(let key in keyOfNames)
		a[keyOfNames[key]] = key
	
	let s = "const nameOfKeys = [\n"
	
	for(let i = 0; i < a.length - 1; i++)
		s += "\t" + (a[i] ? '"' + a[i] + '"' : null) + ",\n"
	
	s += "\t'" + a[a.length - 1] + "'\n"
	
	s += "]"
	console.log(s)
}

module.exports = KeyMapper