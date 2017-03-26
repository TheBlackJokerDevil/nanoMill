let Dialog = require(path.join(__rootdir, "js", "dialogs", "dialog.js"))

class Dialog_Settings extends Dialog {
	init(data) {
		
		this.footer.innerHTML = `<div id="dlg-cancel" class="btn">Finish</div>`
		document.getElementById("dlg-cancel").addEventListener("click", _ => {
			this.close()
		})
		
		let uic = require(path.join(__rootdir, "js", "lib", "uic.js"))
		
		uic.insertArray(this.body, [
			["desc", "Openclonk(.exe)"],
			["openDialog", config.get("ocexe"), v => config.set("ocexe", v)],
			["desc", "C4group(.exe)"],
			["openDialog", config.get("c4group"), v => config.set("c4group", v)]
		])
		
		this.show()
	}
}

module.exports = Dialog_Settings