let Dialog = require(path.join(__rootdir, "js", "dialogs", "dialog.js"))

class Dialog_SelectWorkspace extends Dialog {
	init(fnClose) {
		this.body.innerHTML = `<p class="desc">Select workspace directory</p>`
		
		let url = ui.urlPicker(undefined, (p) => {
			document.getElementById("dlg-confirm").dataset.valid = p
		})
		
		Elem.after(this.body.getElementsByClassName("desc")[0], url)
		
		this.footer.innerHTML = 
			`<div class="flex-row">
				<div id="dlg-cancel" class="btn flex-fill">Cancel</div>
				<div id="dlg-confirm" class="btn flex-fill">Select</div>
			</div>`
		
		this.show()
	}
}

module.exports = Dialog_SelectWorkspace