let Dialog = require("./dialog.js")

class Wizard extends Dialog {
	constructor(width, height, pages = null) {
		super(width, height)
		
		this.pages = pages
		this.current = 0
		
		this.pageValidity = true
		
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
	
	showPage(idx) {
		
		this.current = idx
		
		let page = this.pages[idx]
		
		// clear content
		this.body.innerHTML = ``
		
		// create page
		page.onShow()
		this.body.appendChild(page.el)
		
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
		
		// check if the page needs validation to show next
		if(page.awaitsValidation()) {
			this.pageValidity = false
			Elem.addClass(this.btn_next, "disabled")
		}
	}
	
	next() {
		// prevent going to next page if the current one needs
		// validity to be explicitely set
		if(this.pageValidity === false)
			return
		
		this.current++
		
		if(this.current >= this.pages.length) {
			this.onFinish()
			this.close()
		}
		else
			this.showPage(this.current)
	}
	
	prev() {
		if(this.current === 0)
			return
		
		this.current--
		
		this.showPage(this.current)
	}
	
	setValid() {
		this.pageValidity = true
		Elem.removeClass(this.btn_next, "disabled")
	}
	
	onFinish() {}
}

class Page {
	constructor(cb, valid = true) {
		this.await = awaitsValidation
		
		this.el = document.createElement("div")
		this.el.className = "dialog-page"
		
		if(cb)
			cb.call(this)
		
		this.valid = valid
	}
	
	onShow() {
	}
	
	isValid() {
		
	}
}

module.exports = {
	Wizard,
	Page
}