let Dialog = require(path.join(__rootdir, "js", "dialogs", "dialog.js"))

class Dialog_Settings extends Dialog {
	init(data) {
		
		this.footer.innerHTML = `<div id="dlg-cancel" class="btn">Close</div>`
		document.getElementById("dlg-cancel").addEventListener("click", _ => {
			this.close()
		})
		
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
			value: config.get("acefontsize"),
			onchange: setAceFontSize
		}, {
			type: "switch",
			label: "Hide irrelevant files",
			value: config.get("hidenonocfiles"),
			onchange: v => config.set("hidenonocfiles", v)
		}, {
			type: "desc",
			text: "Autofill data"
		},{
			type: "shorttext",
			label: "Author name:",
			value: config.get("author"),
			onchange: v => config.set("author", v)
		}])
		
		this.body.appendChild(f.getRoot())
		
		this.show()
	}
}

function setAceFontSize(v) {
	config.set("acefontsize", v)
	setTextEditorFontSize(v)
}

module.exports = Dialog_Settings