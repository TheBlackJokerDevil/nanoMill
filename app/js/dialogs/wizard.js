let Dialog = require("./dialog.js")
let Form = require("./../lib/form.js")

class Wizard extends Dialog {
	constructor(width, height, pages) {
		super(width, height)
		
		if(!pages)
			throw new Error("No pages given to create a wizard of")
		
		this.pages = pages
		this.currentIdx = 0
		this.currentPage = null
		
		this.pageValidity = true
		
		this.data = {}
		
		if(pages)
			this.showPage(0)
	}
	
	init() {
		let row = document.createElement("div")
		row.className = "flex-row"
		
		// create wizard controls
		this.btn_cancel = document.createElement("div")
		this.btn_cancel.className = "btn flex-fill"
		this.btn_cancel.innerHTML = "Cancel"
		
		this.btn_prev = document.createElement("div")
		this.btn_prev.className = "btn flex-fill"
		this.btn_prev.innerHTML = "Back"
		
		this.btn_next = document.createElement("div")
		this.btn_next.className = "btn flex-fill"
		this.btn_next.innerHTML = "Next"
		
		row.appendChild(this.btn_cancel)
		row.appendChild(this.btn_prev)
		row.appendChild(this.btn_next)
		
		this.btn_cancel.onclick = _ => this.close()
		this.btn_prev.onclick = _ => this.prev()
		this.btn_next.onclick = _ => this.next()
		
		this.footer.appendChild(row)
	}
	
	setPagesDisplay(idx) {
		for(let i = 0; i < this.body.children.length; i++)
			if(idx !== i)
				this.body.children[i].style.display = "none"
			else
				this.body.children[i].style.display = ""
	}
	
	showPage(idx) {
		this.currentIdx = idx
		
		let page = this.pages[idx]
		if(typeof page === "function")
			page = page(this.data)
		log(this.pages)
		log(idx)
		log(page)
		page.setData(this.data)
		
		this.body.appendChild(page.getRoot())
		
		this.setPagesDisplay(idx)
		
		// handle prev button state
		if(idx === 0)
			Elem.addClass(this.btn_prev, "disabled")
		else
			Elem.removeClass(this.btn_prev, "disabled")
		
		// handle next button naming
		if(idx === this.pages.length - 1)
			this.btn_next.innerHTML = "Finish"
		else
			this.btn_next.innerHTML = "Next"
		
		this.currentPage = page
	}
	
	next() {
		// prevent going to next page if the current one needs
		// validity to be explicitely set
		if(Wizard.hasRequired(this.currentPage) === false)
			return
		
		this.currentIdx++
		
		if(this.currentIdx >= this.pages.length) {
			this.onFinish(this.data)
			this.close()
		}
		else
			this.showPage(this.currentIdx)
	}
	
	prev() {
		if(this.currentIdx === 0)
			return
		
		this.currentIdx--
		
		this.showPage(this.currentIdx)
	}
	
	setValid() {
		this.pageValidity = true
		Elem.removeClass(this.btn_next, "disabled")
	}
	
	onFinish() {}
	
	static hasRequired(page) {
		if(page instanceof Form)
			return page.hasRequired()
		else
			return true
	}
}

module.exports = Wizard