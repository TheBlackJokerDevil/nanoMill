let Dialog = require("./dialog.js")
let Form = require("./../lib/form.js")

class Deck extends Dialog {
	constructor(width, height, pages) {
		super(width, height)
		
		if(!pages)
			throw new Error("No pages given to create a deck of")
		
		this.currentIdx = 0
		this.currentPage = null
		this.pages = pages
		
		// create page tabs
		let row = document.createElement("div")
		row.className = "flex-row"
		
		for(let i = 0; i < pages.length; i++) {
			let tab = document.createElement("div")
			
			if(pages[i].getName)
				tab.innerHTML = pages[i].getName()
			else
				tab.innerHTML = "Page " + i
			
			row.appendChild(tab)
			
			tab.onclick = _ => this.showPage(i)
			tab.className = "dlg-tab"
			
			this.body.appendChild(pages[i].getRoot())
		}
		
		this.head.appendChild(row)
		
		if(pages)
			this.showPage(0)
	}
	
	setPagesDisplay(idx) {
		let row = this.head.firstElementChild
		// update display of pages
		// and the page selection
		for(let i = 0; i < this.body.children.length; i++)
			if(idx !== i) {
				this.body.children[i].style.display = "none"
				Elem.removeClass(row.children[i], "selected")
			}
			else {
				this.body.children[i].style.display = ""
				Elem.addClass(row.children[i], "selected")
			}
	}
	
	showPage(idx) {
		this.currentIdx = idx
		
		let page = this.pages[idx]
		if(typeof page === "function")
			page = page(this.data)
		
		page.setData(this.data)
		
		this.setPagesDisplay(idx)
		
		this.currentPage = page
	}
	
	static hasRequired(page) {
		if(page instanceof Form)
			return page.hasRequired()
		else
			return true
	}
}

module.exports = Deck