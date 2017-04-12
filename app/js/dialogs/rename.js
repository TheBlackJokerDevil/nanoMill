let Wizard = require(path.join(__rootdir, "js", "dialogs", "wizard.js"))
let Form = require("./../lib/form.js")

module.exports = function(oldName, cb, desc) {
	if(!desc)
		desc = "Enter new name"
	
	let wzd = new Wizard(300, 150, [
		new Form([{
				type: "desc",
				text: desc
			}, {
				type: "shorttext",
				align: "center",
				required: true,
				key: "newName",
				value: oldName
			}
		])
	])
	
	wzd.onFinish = data => {
		cb(data.newName)
	}
	
	wzd.show()
}