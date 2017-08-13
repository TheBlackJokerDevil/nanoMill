class ImagePreview extends layout.DeckItem {

	init() {
		this.root.innerHTML = ``
		this.root.className += "abs-fill imgprev-main"
		
		// general image info
		let el = document.createElement("div")
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
	}
}

ImagePreview.def = {
	alias: "imagepreview",
	className: ImagePreview,
	title: "Image preview",
	isSub: true
}

layout.setModuleDef(ImagePreview.def)