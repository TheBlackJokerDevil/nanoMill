class ImagePreview extends layout.DeckItem {

	init() {
		this.root.innerHTML = ``
		this.root.className += "abs-fill imgprev-main"
		
		// general image info
		let el = document.createElement("div")
		el.className = "imgprev-info-bar"
		this.infoEl = el
		this.root.appendChild(el)
	}
	setup(file, txt, mode) {
		let p = "file:///" + file.path.replace(/\\/gi, "/")
		this.root.style.backgroundImage = "url(" + p + ")"
		
		let img = new Image()
		img.onload = _ => {
			this.infoEl.innerHTML = "width: " + img.width + "   height: " + img.height
		}
		img.src = p
		
		let mouseLevel = 0
		this.root.addEventListener("mousewheel", (e) => {
			if(e.wheelDelta > 0)
				mouseLevel++
			else if(e.wheelDelta < 0)
				mouseLevel--
			
			if(mouseLevel <= -10)
				mouseLevel = -9
			
			let factor
			if(mouseLevel < 0)
				 factor = 1 - Math.pow(0.1 * mouseLevel, 2)
			else
				factor = 1 + Math.pow(0.1 * mouseLevel, 2)
			
			this.root.style.backgroundSize = (img.width*factor) + "px " + (img.height*factor) + "px"
		})
	}
}

ImagePreview.def = {
	alias: "imagepreview",
	className: ImagePreview,
	title: "Image preview",
	isSub: true
}

layout.setModuleDef(ImagePreview.def)