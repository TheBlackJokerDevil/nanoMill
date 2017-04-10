
let Wizard = require("./wizard.js")
let Form = require("./../lib/form.js")

module.exports = function(cb) {
	let wzd = new Wizard(450, 150, [
		// first page
		new Form([{
			type: "desc",
			text: "Pick workspace directory"
		}, {
			type: "url",
			required: true,
			key: "dpath",
			value: "...",
			directory: true
		}]),
		// second page
		data => new Form([{
			type: "desc",
			text: "Pick workspace..."
		}, {
			type: "shorttext",
			label: "name: ",
			value: path.basename(data.dpath),
			required: true,
			key: "wname"
		}])
	])
	
	wzd.onFinish = data => {
		cb(data.dpath, data.wname)
	}
	
	wzd.show()
}