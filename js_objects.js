Garden = {
	width: function() { return 500 }, 
	height: function() { return 600 },
	drawables: [],
	b_counts: [],
	f_counts: [],
	l_counts: [],
	splitRadius: function() { return 8 },

	addItem: function(item, level){
		var drawables = this.drawables[level]
		drawables.push(item)
		if(item instanceof Flower){
			this.increment(this.f_counts, level)
			this.increment(this.l_counts, level, item.lineCount())
		} else {
			this.increment(this.b_counts, level)
		}
	},

	'increment': function(arr, level, amount){
		if(typeof amount == 'undefined'){
			amount = 1
		}
		arr[level] = arr[level] + amount
	},

	'intersecting': function(){
		var x = p.mouseX
		var y = p.mouseY
		return null
	},

	'getX': function(item){
		var xpos = 0
		var level = 0
		for(var level=0; level < this.drawables.length; level++){
			var i = this.drawables[level].indexOf(item)
			if( i < 0 ) { continue }
			xpos = getRadius(item)
			for(var i=i-1; i>=0; i--){
				xpos += getRadius(this.drawables[level][i]) * 2
			}
			break
		}
	},

	'getY': function(level){
		if(level == 0){
			return this.height()-1
		}
		return this.height() - (this.height() / this.drawables.length) * level
	},

	'getRadius': function(item, level){
		if(item instanceof Root){
			return this.splitRadius
		} else {
			var avgLines = this.lineCount(level)/ this.f_counts[level]
			var avgRadius = (0.5 * this.flowerSpace(level))/this.f_counts[level]
			var avgArea = PI * Math.pow(avgRadius, 2.)
			var thisArea = avgArea * item.lineCount() / avgLines
			var thisRadius = Math.sqrt(thisArea / PI)
			return thisRadius
		}
	},

	'flowerSpace': function(level){
		return this.width() - this.splitRadius * 2 * this.b_counts[level]
	},
}
  
/* Sub objects */

Garden.Point = {
	x: -1,
	y: -1,

	toString: function(){
		return "("+this.x+", "+this.y+")"
	},

	equals: function(p){
		return p.x == this.x && p.y == this.y
	},

	distance: function(ix, iy){
		rise = this.y - iy
		run = this.x - ix
		return sqrt(rise*rise + run*run)
	},
}

Garden.Stem = { // implements Drawable
	root: null, //Point?
	destination: null, // OnStem
	end: null, //Point
	done: false,

	center: function(){
		return end
	},

	update: function(){
		dest = this.destination.center()
		diff = this.end.x - this.dest.x
		if(abs(diff) < 5){
			this.end.x = this.dest.x
		} else {
			this.end.x = this.end.x - (diff / 4)
		}
		diff = this.end.y - dest.y
		if(abs(diff) < 5){
			this.end.y = dest.y
		} else {
			this.end.y = this.end.y - (diff / 4)
		}
		if(this.end.equals(dest)){
			done = true
		}
	},

	draw: function(){
		/* Lengthen curve */
		if(!done){
			this.update()
		}
		start = this.root.center()
		ydiff = start.y-end.y
		noFill()
		strokeWeight(2)
		stroke(10, 100, 10)
		bezier( start.x, start.y, 
						start.x, start.y-ydiff*0.4, 
						end.x,   end.y+ydiff*0.7, 
						end.x,   end.y)
		if(done){
			destination.draw()
		}
	},
}

Garden.Root = { // implements Drawable
	stems: [],
	_center: null, // Point
	level: 0,

	addItem: function(onStem){
		onStem.root = this
		onStem.level = this.level + 1
		Gardener.addItem(onStem, level+1)
		stems.push( Object.create(Garden.Stem, {'root':this, 'destination':onStem}) )
	},

	center: function(){
		if(_center.x < 0){
			this._center.x = Gardener.getX(this)
		}
		if(_center.y < 0){
			this._center.y = Gardener.getY(this.level)
		}
		return this._center
	},

	draw: function(){
		// draw each item
		for(i=0; i<this.stems.length; i++){
			this.stems[i].draw()
		}
	},
}

Garden.Ground = Object.create(Garden.Root, {
	roots: [],

	addItem: function(flower){
		root = Object.create(Garden.Root)
		Gardener.addItem(root, 0)
		root.addItem(flower)
		roots.push(root)
	},

	draw: function(){
		for(i=0; i<roots.length; i++){
			this.roots[i].draw()
		}
	}
})

Garden.StemSplit = Object.create(Garden.Root, { // implements OnStem, Hoverable 
	base: null,
	dirname: "",

	intersecting: function(x, y){
		if(this.center().distance(x, y) < Gardener.splitRadius){
			return this
		}
		return null
	},
	
	hoverText: function(){
		return "Directory '"+this.dirname+"'"
	},

	draw: function(){
		super.draw()
		fill(10, 100, 10)
		noStroke()
		ellipse(this._center.x, this._center.y, Gardener.splitRadius*2, Garden.splitRadius*2)
	},
})


Garden.LineBase = Object.create(Object, { //implements Lines 
	children: [],
	_center: null, // Point
	_radius: -1,
	_maxRadius: -1,

	lineCount: function(){
		count = this.children.length
		for(i=0; i<children.length; i++){
			count += children[i].lineCount()
		}
		return count
	},

	'addLine': function(line){
		line.owner = this
		this.children.push(line)
	},

})

Garden.Flower = Object.create(Garden.LineBase, { // implements OnStem, Drawable, Petal, Hoverable
	filename: null,
	line_count: 0,
	base: null,

	// Deprecated
	getFlower: function(){
		return this
	},

	hoverText: function(){ 
		rv = filename + "\n" + this.lineCount() + " lines\n"
		for(i=0; i<children.length; i++){
			rv = rv + "\n" + children[i].text
			if(children[i].children.length > 0){
				rv = rv + "...\n    "+children[i].children.length+" lines"
			}
		}
		return rv
	},

	radius: function(){
		if(_radius < 0){
			_radius = sqrt(pow(maxRadius(),2.) * (children.length/lineCount()))
		}
		return _radius
	},

	maxRadius: function(){
		if(_maxRadius < 0){
			_maxRadius= Gardener.getRadius(this, level)
		}
		return _maxRadius
	},

	center: function(){
		if(_center.x == -1 && _center.y == -1){
			_center.x = Gardener.getX(this)
			_center.y = Gardener.getY(this.level)
		}
		return _center
	},

	draw: function() {
		for(i=0; i<children.length; i++){
			lines[i].draw()
		}
		flower_layer.strokeWeight(2)
		flower_layer.fill(220, 220, 0)
		flower_layer.stroke(180, 180, 0)
		flower_layer.ellipse(_center.x, _center.y, radius()*2, radius()*2)
		noFill()
		stroke(255,200,200)
		ellipse(_center.x, _center.y, maxRadius()*2, maxRadius()*2)
	},

	intersecting: function(x, y){
		if(this.center().distance(x, y) < this.radius()){
			return this
		}
		for(i=0; i<children.length; i++){
			rv = children[i].intersecting(x, y)
			if(rv != null){
				return rv
			}
		}
		return null
	},
})

Garden.Line = Object.create(Garden.LineBase, { // implements Drawable, Petal, Hoverable
	pos: 0,
	indent: 0,
	_angle: -1,
	text: "",
	raw: "",
	//owner: null,
	//flower: null,

	/* deprecated constructor 
	Line(String r, int at){
		raw = r
		pos = at
		text = raw.trim()
		this.countIndent()
	}*/

	hoverText: function(){
		if(this.text.length > 23){
			return this.text.substring(0,20)+"..."
		}
		return this.text
	},

	fullText: function(leading){
		rv = leading + this.text
		for(i=0; i<children.length; i++){
			rv = rv + "\n" + children[i].fullText(leading + "    ")
		}
		return rv
	},
	
	countIndent: function(){
		c = 0
		while(c < raw.length && raw.charAt(c) == ' '){
			c++
		}
		this.indent = c-1
	},

	isComment: function(){
		if(text.length == 0){
			return true
		}
		return text[0] == '#'
	},

	getFlower: function(){
		p = owner
		return p.getFlower()
	},

	radius: function(){
		if (_radius < 0){
			proportion = lineCount() / owner.lineCount()
			_radius = sqrt(proportion * pow( owner.radius() ,2. ))
		}
		return _radius
	},

	angle: function(){
		if(_angle < 0){
			index = owner.children.indexOf(this)
			_angle = 2 * PI * (index / owner.children.length)
		}
		return _angle
	},

	center: function(){
		if(this._center.x < 0){
			p = this.owner.center()
			distance = this.owner.radius() + 0.9 * (4./3.) * radius()
			x = p.x + (sin(angle()) * distance)
			y = p.y + (cos(angle()) * distance)
			this._center.x = x
			this._center.y = y
		}
		return _center
	},

	draw: function() {
		if( children.length > 0 ){
			for(i=0; i < children.length; i++){
				line = children[i]
				line.draw()
			}
		}
		flower_layer.stroke(200, 200, 0)
		flower_layer.strokeWeight(1)
		flower_layer.fill(230, 230, 210)
		flower_layer.pushMatrix()
		flower_layer.translate(this.center().x, this.center().y)
		flower_layer.rotate(-1*angle())
		flower_layer.ellipse(0, 0, radius()*1.5, radius()*(8./3.))
		flower_layer.line(0,radius()*(4./-3.), 0, radius()*.75)
		flower_layer.popMatrix()
	},

	intersecting: function(x, y){
		if(this.center().distance(x, y) < this.radius()){
			return this
		}
		for(i=0; i<children.length; i++){
			rv = this.children[i].intersecting(x, y)
			if(rv != null){
				return rv
			}
		}
		return null
	},
})
