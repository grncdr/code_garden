// Code flowers

// Draws fractal-ish flowers to represent code blocks in flowers
// draws direc tories as stem points for bunches of flowers

import java.io.File;
import java.util.Scanner;

interface Drawable {
  void draw();
  Point center();
}

interface OnStem extends Drawable {
  Root getRoot();
  void setRoot(Root dir);
}

interface Lines {
  int lineCount();
  void addLine(Line l);
  ArrayList getChildren();
}

interface Petal extends Lines, Drawable {
  int radius();
  Flower getFlower();
}

interface Hoverable {
  Hoverable intersecting(int x, int y);
  String hoverText();
}

Ground ground;
PGraphics flower_layer;
PFont font;
String mouseOverText = "";
String coordsText = "";

void setup ()
{
  font = loadFont("Monaco-12.vlw");
  textFont(font);
  ground = new Ground();
  flower_layer = createGraphics(Garden.width, Garden.height, JAVA2D);
  size(Garden.width+400, Garden.height);
  java.io.File fs_basedir = new java.io.File("/Users/Stephen/src/ccg-server/");
  stroke(125);
  fill(253, 162, 110);  
  createGarden(fs_basedir, ground);
  coordsText = "Flower width " + Garden.flowerSpace(1) +", "+ Garden.flowerSpace(2);
  print(Garden.asString());
  frameRate(30);
}

void draw() {
  background(200, 200, 255);
  smooth();
  flower_layer.beginDraw();
  flower_layer.smooth();
  ground.draw();
  flower_layer.endDraw();
  image(flower_layer, 0, 0);
  line(880,0,880,height);
  fill(10, 30, 10);
  text(mouseOverText, 890, 10);
  text(coordsText, 400, 10);
}

void mouseMoved() {
  Point p = new Point(mouseX, mouseY);
  coordsText = p.toString() + p.distance(0, 0);
  Hoverable over = Garden.intersecting(mouseX, mouseY);
  if(over != null){
    mouseOverText = over.hoverText();
  } else {
    mouseOverText = "";
  }
}

void createGarden(java.io.File basedir, Root base){
  java.io.File files[] = basedir.listFiles();
  for(int i=0; i < files.length; i++){
    java.io.File current = files[i];
    String fname = current.getName();
    if( fname.equals(".") || fname.equals("..")
      || fname.charAt(0) == '.'
      || fname.charAt(0) == '_'
    ){
      continue;
    }
    if(current.isDirectory()){
      StemSplit sd = new StemSplit(fname);
      base.addItem(sd);
      createGarden(current, sd);
    }
    else if(current.isFile() && fname.length() > 2
      && fname.substring(fname.length()-2).equals("py")
    ){
      base.addItem(new Flower(current));
    }
  }
}

class Point {
  int x;
  int y;

  Point(int x, int y){
    this.x = x;
    this.y = y;
  }

  String toString(){
    return "("+x+", "+y+")";
  }

  Point copy(){
    return new Point(x, y);
  }

  boolean equals(Point p){
    return p.x == x && p.y == y;
  }

  int distance(int ix, int iy){
    int rise = y - iy;
    int run = x - ix;
    return (int)sqrt(rise*rise + run*run);
  }
}

static public class Garden {
  // Faux Singleton class that holds references to 
  // all branches and flowers indexed by level

  static int width = 880;
  static int height = 800;
  static int splitRadius = 8; // Radius of StemSplits 
  static private ArrayList drawables = new ArrayList();
  static private ArrayList b_counts = new ArrayList();
  static private ArrayList f_counts = new ArrayList();
  static private ArrayList l_counts = new ArrayList();

  static ArrayList getEntireLevel(int level){
    try {
      return (ArrayList)drawables.get(level);
    } catch( IndexOutOfBoundsException e ){ 
      return null;
    }
  }

  static int getLevelSize(int level){
    return getEntireLevel(level).size();
  }

  public static void addItem(Drawable item, int level){
    ArrayList this_level, counts;
    while(drawables.size() < level+1){
      drawables.add(new ArrayList());
    }
    this_level = (ArrayList) drawables.get(level);
    this_level.add(item);

    if(item instanceof Root){
      increment(b_counts, level);
      counts = b_counts;
    } else {
      increment(f_counts, level);
      increment(l_counts, level);
    }
  }

  static void increment(ArrayList counts, int level){
    if(counts.size() < level+1){
      while(counts.size() < level){
        counts.add(0);
      }
      counts.add(1);
    } else {
      int current = 0;
      counts.set(level, 1 + (Integer)counts.get(level));
    }
  }
  
  public static String asString(){
    String rv = "";
    for(int j=drawables.size(); j>0; j--){
      ArrayList level = (ArrayList) drawables.get(j-1);
      rv = rv + "Level "+(j-1)+": ";
      for(int i=0; i<level.size(); i++){
        Drawable item = (Drawable) level.get(i);
        if(item instanceof Flower){
          rv = rv + "Flower ";
        } else if(item instanceof StemSplit) {
          rv = rv + "Split ";
        } else if(item instanceof Root) {
          rv = rv + "Root ";
        } else {
          rv = rv + "Unknown ";
        }
        Point coords = item.center();
        rv = rv+coords;
      }
      rv = rv + "\n";
    }
    return rv;
  }

  public static Hoverable intersecting(int x, int y){
    Hoverable rv = null;
    for(int j=0; j < drawables.size(); j++){
      ArrayList items = (ArrayList) drawables.get(j);
      for(int i=0; i< items.size(); i++){
        Drawable item = (Drawable) items.get(i);
        if(item instanceof Hoverable){
          Hoverable c = (Hoverable) item;
          rv = c.intersecting(x, y);
          if(rv != null){
            return rv;
          }
        }
      }
    }
    //int blah = (int)(height - (step_size * level) + (step_size/2));
    return rv;
  }

  public static int getX(Drawable item){
    float xpos = 0;
    int level;
    ArrayList this_level = null;
    for(level=0; level < drawables.size(); level++){
      this_level = (ArrayList)drawables.get(level);
      int offset = this_level.indexOf(item);
      if( offset < 0 ){ continue; /* Item not on this level */ }
      for(int j=0; j <= offset; j++){
        xpos += getRadius((Drawable) this_level.get(j), level);
        if(j == offset){ break; }
        xpos += getRadius((Drawable) this_level.get(j), level);
      } 
      break; /* Item found, don't bother with further levels */
    }
    return (int)xpos;
  }

  public static int getRadius(Drawable item, int level){
    if(item instanceof Root){
      return splitRadius;
    } else {
      //float avgLines = lineCount(level) / (float)flowerCount(level);
      float proportion = ((Flower)item).lineCount() / (float)lineCount(level);
      //return (int)(0.5 * proportion * flowerSpace(level));
      return (int)((0.5 * flowerSpace(level)) / flowerCount(level));
      //float thisRadius = sqrt(thisArea / PI);
      //float thisRadius = sqrt(pow(0.5 * flowerSpace(level),2.) * proportion);
      //return (int) avgRadius;
      //return (int)(avgRadius * proportion);
      //return (int)(sqrt(proportion * pow(average,2.0)));
    }
  }

  public static int branchCount(int level){
    try{
      return (Integer) b_counts.get(level);
    } catch(IndexOutOfBoundsException e){
      return 0;
    }
  }

  public static int flowerCount(int level){
    try{
      return (Integer) f_counts.get(level);
    } catch(IndexOutOfBoundsException e){
      return 0;
    }
  }

  public static int lineCount(int level){
    try{
      return (Integer) l_counts.get(level);
    } catch(IndexOutOfBoundsException e){
      return 0;
    }
  }

  static int flowerSpace(int level){
    return (int)(Garden.width - ( splitRadius * 2 * branchCount(level)));
  }

  static int getY(int level){
    if(level == 0){
      return height-1;
    }
    float step_size = height / (float) drawables.size();
    return (int)(height - (step_size * level));
  }

}

class Stem implements Drawable {
  Root root;
  OnStem destination;
  Point end;
  boolean done = false;

  Stem(Root r, OnStem d){
    root = r;
    destination = d;
    end = root.center().copy();
  }

  Point center(){
    return end;
  }

  void update(){
    Point dest = destination.center();
    int diff = end.x - dest.x;
    if(abs(diff) < 5){
      end.x = dest.x;
    } else {
      end.x = end.x - (diff / 4);
    }
    diff = end.y - dest.y;
    if(abs(diff) < 5){
      end.y = dest.y;
    } else {
      end.y = end.y - (diff / 4);
    }
    if(end.equals(dest)){
      done = true;
    }
  }

  void draw(){
    /* Lengthen curve */
    if(!done){
      update();
    }

    Point start = root.center();
    int ydiff = start.y-end.y;
    noFill();
    strokeWeight(2);
    stroke(10, 100, 10);
    bezier( start.x, start.y, 
            start.x, start.y-ydiff*0.4, 
            end.x,   end.y+ydiff*0.7, 
            end.x,   end.y);
    if(done){
      destination.draw();
    }
  }
}

class Root implements Drawable {
  ArrayList stems = new ArrayList();
  Point _center = new Point(-1, -1);
  int level = 0;

  void addItem(OnStem s){
    s.setRoot(this);
    Garden.addItem(s, level+1);
    stems.add( new Stem(this, s) );
  }

  Point center(){
    if(_center.x < 0){
      _center.x = Garden.getX(this);
    }
    if(_center.y < 0){
      _center.y = Garden.getY(this.level);
    }
    return _center;
  }

  void draw(){
    // draw each item
    for(int i=0; i<stems.size(); i++){
      Stem stem = (Stem) stems.get(i);
      stem.draw();
    }
  }
}

class Ground extends Root {
  ArrayList roots = new ArrayList();

  void addItem(OnStem s){
    Root root = new Root();
    Garden.addItem(root, 0);
    root.addItem(s);
    roots.add(root);
  }

  void draw(){
    for(int i=0; i<roots.size(); i++){
      Root root = (Root) roots.get(i);
      root.draw();
    }
  }
}

class StemSplit extends Root implements OnStem, Hoverable {
  Root base = null;
  String dirname = "";

  StemSplit(String dirname){
    this.dirname = dirname;
  }

  void setRoot(Root p){
    base = p;
    level = base.level + 1;
  }

  Root getRoot(){
    return base;
  }

  Hoverable intersecting(int x, int y){
    if(this.center().distance(x, y) < Garden.splitRadius){
      return this;
    }
    return null;
  }
  
  String hoverText(){
    return "Directory '"+this.dirname+"'";
  }

  void draw(){
    super.draw();
    fill(10, 100, 10);
    noStroke();
    ellipse(_center.x, _center.y, Garden.splitRadius*2, Garden.splitRadius*2);
  }
}


class LineBase implements Lines {

  ArrayList children = new ArrayList();
  Point _center = new Point(-1, -1);
  int _radius = -1;
  int _maxRadius= -1;

  ArrayList getChildren(){
    return children;
  }

  int lineCount(){
    int count = children.size();
    for(int i=0; i<children.size(); i++){
      Line current = (Line) children.get(i);
      count += current.lineCount();
    }
    return count;
  }

  void addLine(Line line){
    line.parent = this;
    this.children.add(line);
  }

}

class Flower extends LineBase implements OnStem, Drawable, Petal, Hoverable {
  String filename = null;
  int level;
  int line_count = 0;
  Point lastPos = new Point(-1, -1);
  Point _truecenter = new Point(-1, -1);
  Root base = null;
  float vx, vy;

  Root getRoot(){
    return base;
  }

  void setRoot(Root p){
    base = p;
    level = base.level+1;
  }

  Flower getFlower(){
    return this;
  }

  Flower(java.io.File file){
    filename = file.getName();
    FileBlocker chunker = new FileBlocker(file, this);
    chunker.blockify();
  }

  String hoverText(){ 
    String rv = filename + "\n" + lineCount() + " lines\n";
    for(int i=0; i<children.size(); i++){
      Line child = (Line) children.get(i);
      rv = rv + "\n" + child.text;
      if(child.children.size() > 0){
        rv = rv + "...\n    "+child.children.size()+" lines";
      }
    }
    return rv;
  }

  int radius(){
    if(_radius < 0){
      _radius = (int) sqrt(pow(maxRadius(),2.) * (children.size()/(float)lineCount()));
    }
    return _radius;
  }

  int maxRadius(){
    if(_maxRadius < 0){
      _maxRadius= Garden.getRadius(this, level);
    }
    return _maxRadius;
  }

  Point center(){
    if(_center.x == -1 && _center.y == -1){
      _center.x = Garden.getX(this);
      _center.y = Garden.getY(this.level);
    }
    return _center;
  }

  void draw() {
    for(int i=0; i<children.size(); i++){
      Line line = (Line) children.get(i);
      line.draw();
    }
    flower_layer.strokeWeight(2);
    flower_layer.fill(220, 220, 0);
    flower_layer.stroke(180, 180, 0);
    flower_layer.ellipse(_center.x, _center.y, radius()*2, radius()*2);
    noFill();
    stroke(255,200,200);
    ellipse(_center.x, _center.y, maxRadius()*2, maxRadius()*2);
  }

  Hoverable intersecting(int x, int y){
    if(this.center().distance(x, y) < this.radius()){
      return this;
    }
    Hoverable rv = null;
    for(int i=0; i<children.size(); i++){
      Hoverable container = (Hoverable) children.get(i);
      rv = container.intersecting(x, y);
      if(rv != null){
        return rv;
      }
    }
    return rv;
  }
}

class Line extends LineBase implements Drawable, Petal, Hoverable {
  int pos;
  int indent;
  float _angle = -1;
  String text;
  String raw;
  Lines parent = null;

  Line(String r, int at){
    raw = r;
    pos = at;
    text = raw.trim();
    this.countIndent();
  }

  String hoverText(){
    String rv = raw;
    for(int i=0; i<children.size(); i++){
      Line child = (Line) children.get(i);
      rv = rv + "\n" + child.hoverText();
    }
    return rv;
  }
  
  void countIndent(){
    int c = 0;
    while(c < raw.length() && raw.charAt(c) == ' '){
      c++;
    }
    this.indent = c-1;
  }

  boolean isComment(){
    if(text.length() == 0){
      return true;
    }
    return text.charAt(0) == '#';
  }

  Flower getFlower(){
    Petal p = (Petal) parent;
    return p.getFlower();
  }

  int radius(){
    if (_radius < 0){
      Flower f = getFlower();
      float proportion = children.size() / (float)f.lineCount();
      _radius = (int)sqrt(proportion * pow(f.maxRadius(),2.));
    }
    return _radius;
  }

  float angle(){
    if(_angle < 0){
      ArrayList siblings = parent.getChildren();
      int index = siblings.indexOf(this);
      _angle = 2 * PI * (index / (float)siblings.size());
    }
    return _angle;
  }

  Point center(){
    if(_center.x < 0){
      Petal pp = (Petal) parent;
      Point p = pp.center();
      float distance = pp.radius() + radius();
      int x = (int)(p.x + (sin(angle()) * distance));
      int y = (int)(p.y + (cos(angle()) * distance));
      _center.x = x;
      _center.y = y;
    }
    return _center;
  }

  void draw() {
    Point pos = center();
    if( children.size() > 0 ){
      int count = children.size();
      for(int i=0; i<count; i++){
        Line line = (Line) children.get(i);
        float angle = (2 * PI) / (i / count);
        line.draw();
      }
    }
    flower_layer.stroke(200, 200, 0);  
    flower_layer.strokeWeight(1);
    flower_layer.fill(230, 230, 210);
    flower_layer.ellipse(pos.x, pos.y, radius()*2, radius()*2);
  }

  Hoverable intersecting(int x, int y){
    if(center().distance(x, y) < radius()){
      return this;
    }
    Hoverable rv = null;
    for(int i=0; i<children.size(); i++){
      Hoverable container = (Hoverable) children.get(i);
      rv = container.intersecting(x, y);
      if(rv != null){
        return rv;
      }
    }
    return rv;
  }

}

class FileBlocker {
  Flower flower;
  java.util.Scanner scanner;
  
  public FileBlocker(java.io.File file, Flower flower){
    this.flower = flower;
    try {
      scanner = new java.util.Scanner(file);
    } catch(FileNotFoundException e){
      // FIXME - should probably do something like delete this
    }
  }

  public void blockify(){
    if(!scanner.hasNext()){
      return;
    }
    Line firstline = new Line(scanner.nextLine(), 1);
    blockify(firstline, scanner, flower);
  }

  public Line blockify(Line firstLine, java.util.Scanner scanner, Lines target){
    target.addLine(firstLine);
    int indent = firstLine.indent;
    int pos = firstLine.pos + 1;
    Line lastLine = firstLine;
    while(scanner.hasNext()){
      Line line = new Line(scanner.nextLine(), pos);
      if(line.indent > indent){
        line = blockify(line, scanner, lastLine);
        if(line == null){
          return null;
        }
      } else if(line.indent < indent){
        return line;
      }
      target.addLine(line);
      lastLine = line;
      pos = lastLine.pos + 1;
    }
    return null;
  }
}
