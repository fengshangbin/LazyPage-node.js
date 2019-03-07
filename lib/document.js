var block = require('./block');
/*var test = require('./httpProxy');
test();*/
/*var test2 = require('./httpTest');*/

var document = function(html){
	this.html = html;
	var blocks=new Set();
	this.getHtml=function() {
		return this.html;
	}
	this.setHtml = function(html) {
		this.html = html;
	}
	this.queryBlocks = function(){
		//if(blocks.size>0)return blocks;
		this.removeFinishBlocks();
		var regStr = "(<script[^>]*type *= *\"x-tmpl-lazypage\"[^>]*>)([\\S\\s]*?)</script\\s*>";
		var match = new RegExp(regStr, "im");
		var first = 0;
		var tempHtml = this.html;
		while(match.test(tempHtml)){
			var group = match.exec(tempHtml);
			var start = group.index + first;
			var end = start+group[0].length;
			blocks.add(new block(group[1], group[2], this, start, end));
			//console.log(group[1]);//, group[2], start, end
			//console.log("---",group[2],"---");
			tempHtml = tempHtml.substring(group.index+group[0].length);
			first = end;
		}
		this.tagBlocks();
		//console.log("blocks.size: "+blocks.size);
		return blocks;
	}
	this.getBlocks = function(){
		return blocks;
	}
	this.tagBlocks = function(){
		for (let block of blocks){
			block.tagBlock();
		}
	}
	this.removeFinishBlocks = function(){
		for (let block of blocks){
			if(block.getRunStated()==2)
				blocks.delete(block);
		}
	}
	this.notifyChangeIndex = function(start, offlen){
		for (let block of blocks){
			block.changeIndex(start, offlen);
		}
	}
}
module.exports = document;