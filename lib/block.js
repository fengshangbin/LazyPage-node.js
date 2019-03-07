
var block = function(attrHtml, innerHtml, document, start, end){
	var data = null;
	var html = null;
	var runStated = 0;
	var attrRegStr = " *= *\"([^\"]*)\"";
	this.getHtml = function() {
		return html;
	}
	this.setHtml = function(_html) {
		html = _html;
	}
	this.getData = function() {
		return data;
	}
	this.setData = function(_data) {
		data = _data;
	}
	this.setOutHtml = function(outHtml) {
		var oldLength = end-start;
		var newLength = outHtml.length;
		var offLength = newLength-oldLength;
		var oldHtml = document.getHtml();
		document.setHtml(oldHtml.substring(0, start)+outHtml+oldHtml.substring(end));
		document.notifyChangeIndex(start, offLength);
		runStated=2;
	}
	this.getInnerHtml = function() {
		return innerHtml;
	}
	this.getAttrHtml = function() {
		return attrHtml;
	}
	this.getRunStated = function() {
		return runStated;
	}
	this.setRunStated = function(_runStated) {
		runStated = _runStated;
	}
	this.getAttribute = function(key){
		var regStr = key + attrRegStr;
		var reg = new RegExp(regStr, "i");
		if(reg.test(attrHtml)){
			var group = reg.exec(attrHtml);
			return group[1];
		}
		return null;
	}
	this.getOutAttribute = function(key){
		var regStr = key + attrRegStr;
		var reg = new RegExp(regStr, "i");
		if(reg.test(attrHtml)){
			var group = reg.exec(attrHtml);
			return [group[0], group[1]];
		}
		return null;
	}
	this.hasAttribute = function(key){
		var attr = this.getAttribute(key);
		return attr!=null && attr.length>0;
	}
	this.setAttribute = function(key, value){
		var oldAttr = this.getOutAttribute(key);
		if(oldAttr == null)return;
		
		var oldLength = oldAttr[1].length;
		var newLength = value.length;
		var offLength = newLength-oldLength;
		var newAttr = oldAttr[0].replace(oldAttr[1], value);
		attrHtml = attrHtml.replace(oldAttr[0], newAttr);
		//console.log(oldAttr[0], oldAttr[1], attrHtml);
		var oldHtml = document.getHtml();
		//console.log("----", oldHtml.substring(0, start), "+++", attrHtml, "+++", oldHtml.substring(start+attrHtml.length-offLength));
		document.setHtml(oldHtml.substring(0, start) + attrHtml + oldHtml.substring(start+attrHtml.length-offLength));
		document.notifyChangeIndex(start, offLength);
	}
	this.tagBlock = function(){
		this.setAttribute("type","x-tmpl-lazypage-tag");
	}
	this.changeIndex = function(_start, offLength){
		if(start==_start)end+=offLength;
		else if(start>_start){
			start+=offLength;
			end+=offLength;
		}
	}
}

module.exports = block;