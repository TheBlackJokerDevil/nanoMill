/**
	the navigator view shows the opened files;
	you can open and close files by clicking on them
*/
class Navigator extends layout.Module {

	init(state) {
		this.entries = []
		
		let view = wmaster.viewOpened.getView()
		this.body.appendChild(view.root)
		
		// remember to remove when the module gets closed
		this.view = view
	}
	
	onClose() {
		// take care of proper removal
		this.view.remove()
	}
}

Navigator.def = {
	alias: "navigator",
	className: Navigator,
	title: "Opened Documents",
}

layout.setModuleDef(Navigator.def)