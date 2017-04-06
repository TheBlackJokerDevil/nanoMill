	
class Explorer extends layout.Module {
	init(state) {
		this.body.style.overflowY = "auto"
		
		// restore workspace from saved index of the previous session
		if(state && state.workspace !== -1 && wmaster.getWorkspace(state.workspace))
			this.setWorkspace(wmaster.getWorkspace(state.workspace))
		// otherwise offer to select one
		else {
			let wspaces = wmaster.getWorkspaces()
			
			// if no workspaces set, show button to create one
			if(!wspaces.length) {
				// create parent object that fills the module body
				this.body.insertAdjacentHTML('beforeEnd', `<div class="abs-fill flex-col" style="justify-content: center"></div>`)
				
				// add desc/button to it
				let p = this.body.lastChild
				p.insertAdjacentHTML('beforeEnd', `<div style="align-self: center; text-align: center">No workspace targeted,<br>click to add one.</div>`)
				p.lastChild.onclick = this.newWorkspaceDialog.bind(this)
			}
		}
	}
	
	setWorkspace(wspace) {
		// sanity check
		if(this.wspace === wspace)
			return
		
		// clear old view
		if(this.wspace && this.view) {
			this.wspace.removeView(this.view)
			this.body.innerHTML = ''
		}
		
		if(wspace) {
			this.wspace = wspace
			this.view = wspace.getView()
			this.body.appendChild(this.view.root)
		}
	}
	
	/**
		Opens a dialog, where a new workspace can be chosen
	*/
	newWorkspaceDialog() {
		let Dialog_SelectWorkspace = require(path.join(__rootdir, "js", "dialogs", "selworkspace.js"))
		new Dialog_SelectWorkspace(600, "", (result) => {
			if(result === false)
				return
			
			let ws = wmaster.addWorkspace(result)
			this.setWorkspace(ws)
			
			// display loading indicator
			this.body.innerHTML = `<div class="abs-fill flex-col" style="justify-content: center"><div style="align-self: center">...</dib></div>`
		})
	}
	
	getSpecialMenuProps() {
		let sub_sel = []
		
		let workspaces = wmaster.getWorkspaces()
		for(let i = 0; i < workspaces.length; i++) {
			sub_sel.push({
				label: workspaces[i].getName(),
				onclick: _ => this.setWorkspace(workspaces[i])
			})
		}
		
		return [
			{
				label: "New file",
				icon: "icon-plus",
				onvalidate: _ => this.view ? true : false,
				onclick: _ => {					
					this.view.newFileDialog(this.wspace.path, -1)
				}
			},
			{
				label: "New workspace",
				icon: "icon-add-workspace",
				onclick: _ => {
					this.newWorkspaceDialog()
				}
			},
			{
				label: "Select workspace",
				icon: "icon-workspace",
				submenu: sub_sel,
				onvalidate: _ => {
					// only allow access if there are any workspaces
					return !!wmaster.getWorkspaces().length
				}
			},
			{
				label: "Close workspace",
				icon: "icon-close",
				onvalidate: _ => this.wspace ? true : false,
				onclick: _ =>  {
					wmaster.removeWorkspace(this.wspace)
					this.setWorkspace(null)
				}
			}
		]
	}
	
	getSaveData() {
		return {workspace: wmaster.getIndexOf(this.wspace)}
	}
	
	onClose() {
		if(this.wspace && this.view)
			this.wspace.removeView(this.view)
	}
}

// some dragging variables to allow moving files between different workspaces
// we have to use them since 
// if we currently perform an dragging action within explorers
let isDragging = false,
	// recently dragged element (needed to properly set and remove classes)
	currentDropTarget = null,
// index of the FileInfo to move around
	dragSourceFile = -1,
// index of the corresponding source workspace
	dragSourceWorkspace = -1

Explorer.def = {
	alias: "explorer",
	className: Explorer,
	title: "Explorer",
}

layout.setModuleDef(Explorer.def)