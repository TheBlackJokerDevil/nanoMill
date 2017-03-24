
const
	KEY_ALT = 1,
	KEY_SHIFT = 2,
	KEY_CTRL = 4

const keyCodeMap = {
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

class KeyMapper {
	constructor() {
		this.bindings = []
		
		this.regKb("ctrl-o", openFilePicker)
		this.regKb("ctrl-s", save)
		
		document.addEventListener("keyup", e => {
			let mods = 0
			if(e.altKey === true)
				mods += KEY_ALT
			if(e.shiftKey === true)
				mods += KEY_SHIFT
			if(e.ctrlKey === true)
				mods += KEY_CTRL
			
			// keybinding is only allowed in conjunction with
			// modulate buttons e.g. shift, ctrl and alt
			if(!mods)
				return
			
			let code = (e.keyCode << 3) + mods
			
			if(this.bindings[code])
				this.bindings[code]()
		})
	}
	
	regKb(keyString, cb) {
		let code = 0
		if(keyString.match(/alt/i))
			code += KEY_ALT
		if(keyString.match(/shift/i))
			code += KEY_SHIFT
		if(keyString.match(/ctrl/i))
			code += KEY_CTRL
		
		let key = keyString.replace(/(ctrl|shift|alt|-)/gi, "").trim().toLowerCase()
		
		if(!keyCodeMap[key])
			return warn(`Cannot parse keybinding notation '${key}' of '${keyString}'`)
		
		code = (keyCodeMap[key] << 3) + code
		
		if(code)
			this.bindings[code] = cb
	}
}

module.exports = new KeyMapper()