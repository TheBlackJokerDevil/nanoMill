"use strict"

/**

*/
class NaviList {
	constructor() {
		this.values = new Set()
		this.views = new Set()
		
		hook.in("onFileClosed", (finfo) => {
			let idx = this.getValueIndex(finfo)
			
			if(idx === -1)
				return
			
			for(let view of this.views)
				view.removeItemByIndex(idx)
			
			this.values.delete(finfo)
		})
		
		hook.in("onFileShow", (finfo) => {
			let idx = this.getValueIndex(finfo)
			
			if(idx === -1)
				return
			
			for(let view of this.views)
				view.selectItemByIndex(idx)
		})
		
		hook.in("onSaveStateChange", (finfo, saved) => {
			let idx = this.getValueIndex(finfo)
			
			if(idx === -1)
				return
			
			for(let view of this.views)
				view.changeSaveState(idx, saved)
		})
	}
	
	getValueIndex(val) {
		let idx = 0
		for(let val2 of this.values)
			if(val2 === val)
				return idx
			else
				idx++
		
		return -1
	}
	
	has(finfo) {
		return this.values.has(finfo)
	}
	
	add(finfo) {
		this.values.add(finfo)
		
		for(let view of this.views)
			view.appendItem(finfo)
	}
	
	getValues() {
		return new Set(this.values)
	}
	
	remove(val) {
		this.values.delete(val)
	}
	
	getView() {
		let view = new NaviView(this.values)
		
		this.views.add(view)
		
		return view
	}
}

class NaviView {
	constructor(finfos) {
		this.root = document.createElement("div")
		this.root.className = "navi-view"
		
		this.selected = null
		
		let i = 0
		for(let finfo of finfos) {
			this.appendItem(finfo)
			this.root.lastElementChild.style.animation = `list-item-in 0.3s ease-out 0.${i}s 1 normal both`
			i++
		}
	}
	
	appendItem(finfo) {
		let el = document.createElement("div")
		el.className = "navi-view-item flex-row"
		
		// format to
		// dirname.../filename.ext
		let dirname = path.basename(path.dirname(finfo.path))
		
		el.innerHTML = 
			`<div class="navi-view-item-label">
				<div class='navi-view-fdir'>${dirname}/</div>${path.basename(finfo.path)}
			</div>
			<div class="navi-view-item-close"><div class="icon-close"></div></div>`
		
		// click the label -> show corresponding file
		el.addEventListener("click", _ => {
			// only do something if we would change anything
			if(Elem.hasClass(el, "shown"))
				return
			
			hook.exec("onFileShow", finfo)
		})
		
		// click the close button -> close the correpsonding file
		el.lastElementChild.addEventListener("click", e => {
			if(finfo.mdl) {
				// only close call hook.exec when the file actually has been closed
				// and not prevented by mod.close()
				if(finfo.mdl.close())
					hook.exec("onFileClosed", finfo)
			}
			else
				hook.exec("onFileClosed", finfo)
			
			// prevent triggering the show-file-handler from above
			e.stopPropagation()
		})
		
		this.root.appendChild(el)
	}
	
	selectItemByIndex(idx) {
		let sel = this.root.getElementsByClassName("shown")[0]
		if(sel)
			Elem.removeClass(sel, "shown")
		
		let el = Elem.nthChild(this.root, idx)
		if(el)
			Elem.addClass(el, "shown")
	}
	
	changeSaveState(idx, saved) {
		let el = Elem.nthChild(this.root, idx)
		if(el) {
			if(saved)
				Elem.removeClass(el, "unsaved")
			else
				Elem.addClass(el, "unsaved")
		}
	}
	
	removeItemByIndex(idx) {
		let el = Elem.nthChild(this.root, idx)
		
		if(el)
			Elem.remove(el)
	}
	
	remove() {
		navlist.views.delete(this)
	}
}

let navlist = new NaviList()
module.exports = navlist