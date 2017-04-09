
let {Wizard, Page} = require("./wizard.js")

class Wizard_NewWorkspace {
	constructor(cb) {
		let result = {
			path: undefined
		}
		
		let wzd = new Wizard(450, 350, [
			new Page(function() {log(this)
				this.el.innerHTML = `<p class="desc">Select workspace directory</p>`
				let url = ui.urlPicker(undefined, (p) => {
					result.path = p
					wzd.setValid()
				})
				
				if(result.path) {
					url.value = result.path
					wzd.setValid()
				}
				
				this.el.appendChild(url)
			}, true),
			new Page(function() {
				this.el.innerHTML = `<p class="desc">Name workspace</p>`
			}, true)
		])
		
		wzd.onFinish = _ => {
			
		}
		
		wzd.show()
	}
}

module.exports = Wizard_NewWorkspace