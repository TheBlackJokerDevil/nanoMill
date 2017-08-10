let Dialog = require(path.join(__rootdir, "js", "dialogs", "dialog.js"))
let Deck = require(path.join(__rootdir, "js", "dialogs", "deck.js"))

class Dialog_Settings {
	constructor() {
		let Form = require(path.join(__rootdir, "js", "lib", "form.js"))
		
		let f = new Form([{
			type: "desc",
			text: "Fallback openclonk(.exe)"
		},{
			type: "url",
			value: config.get("ocexe"),
			onchange: v => conifg.set("ocexe", v)
		},{
			type: "desc",
			text: "Fallback c4group(.exe)"
		},{
			type: "url",
			value: config.get("c4group"),
			onchange: v => conifg.set("c4group", v)
		}, {
			type: "number",
			label: "Texteditor fontsize",
			min: 10,
			max: 22,
			unit: "px",
			value: config.get("aceFontSize"),
			onchange: setAceFontSize
		}, {
			type: "select",
			label: "Texteditor Keybindings",
			options: ["default", "vim", "emacs"],
			value: config.get("aceKbMode"),
			onchange: setAceKbMode
		}, {
			/*
			type: "switch",
			label: "Hide irrelevant files",
			value: config.get("hideNonOcFiles"),
			onchange: v => config.set("hideNonOcFiles", v)
		}, {*/
			type: "desc",
			text: "Autofill data"
		},{
			type: "shorttext",
			label: "Author name:",
			value: config.get("author"),
			onchange: v => config.set("author", v)
		}], "General")
		
		let components = []
		
		let kbByName = kb.nameList
		
		for(let name in kbByName) {
			let binding = kbByName[name]
			components.push({
				type: "keybinding",
				label: name,
				value: KeyMapper.codeToKeyData(binding.getCode()),
				onchange: v => kb.rebind(binding, KeyMapper.keyDataToCode(v))
			})
		}
		
		let d = new Deck(600, 450, [f, new Form(components, "KeyBindings")])
		d.show()
	}
}

function setAceFontSize(v) {
	config.set("aceFontSize", v)
	setTextEditorFontSize(v)
}

function setAceKbMode(v) {
	config.set("aceKbMode", v)
	setTextEditorKbMode(v)
}

module.exports = Dialog_Settings