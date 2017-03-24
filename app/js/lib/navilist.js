"use strict"

/**

*/
class NaviList {
	constructor() {
		this.values = new Set()
		this.views = new Set()
		
		hook.in("onFileClosed", (finfo) => {
			let idx = 0
			for(let val of this.values)
				if(val === finfo)
					break
				else
					idx++
			
			for(let view of this.views)
				view.removeItemByIndex(idx)
			
			this.values.delete(finfo)
		})
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
		let view = new View(this.values)
		
		this.views.add(view)
		
		return view
	}
}

class View {
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
		
		let dirname = path.basename(path.dirname(finfo.path))
		
		el.innerHTML = 
			`<div class="navi-view-item-label">
				<div class='navi-view-fdir'>${dirname}</div><span style="color: grey">/</span>${path.basename(finfo.path)}
			</div>
			<div class="navi-view-item-close"><div class="icon-close"></div></div>`
		
		el.addEventListener("click", _ => {
			hook.exec("onOpenedFileSelect", finfo)
		})
		
		el.lastElementChild.addEventListener("click", e => {
			if(finfo.mod) {
				// only close call hook.exec when the file actually has been closed
				// and not prevented by mod.close()
				if(finfo.mod.close())
					hook.exec("onFileClosed", finfo)
			}
			else
				hook.exec("onFileClosed", finfo)
			
			e.stopPropagation()
		})
		
		this.root.appendChild(el)
	}
	
	removeItemByIndex(idx) {
		let el = this.root.firstElementChild
		
		let i = 0
		while(el) {
			if(i === idx) {
				this.root.removeChild(el)
				break
			}
			
			el = el.nextElementSibling
		}
	}
	
	remove() {
		navlist.views.delete(this)
	}
}

let navlist = new NaviList()
module.exports = navlist