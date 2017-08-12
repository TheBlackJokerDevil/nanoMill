class ImagePreview extends layout.DeckItem {

	init() {
		this.root.innerHTML = ``
		this.root.className += "abs-fill imgprev-main"
	}
	setup(file, txt, mode) {
		log(file.path)
		let p = file.path.replace(/\\/gi, "/")
		log(p)
		this.root.style.backgroundImage = "url(file:///" + p + ")"
	}
}

ImagePreview.def = {
	alias: "imagepreview",
	className: ImagePreview,
	title: "Image preview",
	isSub: true
}

layout.setModuleDef(ImagePreview.def)