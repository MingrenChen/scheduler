let element = function (left, top, width, height) {
    this.left = left;
    this.top = top;
    this.offsetWidth = width;
    this.offsetHeight = height
};

element.prototype.getStyle = function(){
    return {'left': this.left, 'top': this.top, 'width': this.width, 'height': this.height}
}

element.prototype.resizeAndMoveTo = function (left, top, width, height) {

}