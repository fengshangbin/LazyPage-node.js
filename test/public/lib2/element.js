var element = function(dom, start, end, html, attrLen, closeLen) {
  var that = this;
  var attrRegStr = ' *= *"([^"]*)"';

  this.type = "element";
  this.toJSON = function() {
    return { start: start, end: end, attrLen: attrLen, closeLen: closeLen, html: html };
  };
  this.getStart = function() {
    return start;
  };
  this.getAttrLen = function() {
    return attrLen;
  }
  this.getDom = function() {
    return dom;
  };
  this.getInnerHTML = function() {
    return html.substring(attrLen, html.length - closeLen);
  };
  this.setInnerHTML = function(innerhtml) {
    innerhtml = innerhtml.toString();
    var oldInnerHTML = this.getInnerHTML();
    var oldHTML = dom.html;
    dom.html = oldHTML.substring(0, start + attrLen) + innerhtml + oldHTML.substring(end - closeLen);
    //html = html.substring(0, attrLen) + innerhtml + html.substring(end - closeLen - start);
    dom.notifyChangeIndex(start + attrLen, innerhtml.length - oldInnerHTML.length, end - closeLen);
  };
  this.getOuterHTML = function() {
    return html;
  };
  this.setOuterHTML = function(outerHtml) {
    var oldHTML = dom.html;
    dom.html = oldHTML.substring(0, start) + outerHtml + oldHTML.substring(end);
    dom.notifyChangeIndex(start, outerHtml.length - html.length, end);
    //Release Element
    destroy();
  };
  this.getAttrHTML = function() {
    return html.substring(0, attrLen);
  };
  this.setAttrHTML = function(attrHTML) {
    var oldAttrHTML = this.getAttrHTML();
    var oldHTML = dom.html;
    dom.html = oldHTML.substring(0, start) + attrHTML + oldHTML.substring(start + attrLen);
    //html = attrHTML + html.substring(attrLen);
    var lenOff = attrHTML.length - oldAttrHTML.length;
    dom.notifyChangeIndex(start, lenOff, start + attrLen);
    attrLen += lenOff;
  };

  function destroy() {
    if(dom)dom.releaseElement(that);
    dom = null;
  }
  function getAttributeObj(key) {
    var regStr = key + attrRegStr;
    var reg = new RegExp(regStr, 'i');
    var attrHTML = that.getAttrHTML();
    if (reg.test(attrHTML)) {
      var group = reg.exec(attrHTML);
      return group;
    }
    return null;
  }
  this.getAttribute = function(key) {
    var obj = getAttributeObj(key);
    if (obj == null) return null;
    return obj[1];
  };
  this.hasAttribute = function(key) {
    var attr = this.getAttribute(key);
    return attr != null && attr.length > 0;
  };
  this.setAttribute = function(key, value) {
    var obj = getAttributeObj(key);
    var newAttr = (obj == null ? ' ' : '') + key + '="' + value + '"';
    if (value == null) newAttr = '';
    var newLen = newAttr.length;
    var oldStart = obj == null ? attrLen - 1 : obj.index;
    var oldLen = obj == null ? 0 : obj[0].length;

    var oldHTML = dom.html;
    dom.html = oldHTML.substring(0, start + oldStart) + newAttr + oldHTML.substring(start + oldStart + oldLen);
    attrLen += newLen - oldLen;
    //html = html.substring(0, oldStart) + newAttr + html.substring(oldStart + oldLen);
    dom.notifyChangeIndex(start + oldStart, newLen - oldLen, start + oldStart + oldLen);
  };
  this.removeAttribute = function(key) {
    this.setAttribute(key, null);
  };
  this.changeIndex = function(_start, offlen, _end) {
    if (start >= _start && end <= _end) {
      destroy();
    } else if (end > _start){
      //console.log("before","."+html+".", start, end);
      if (start > _start) {
        start += offlen;
      }
      end += offlen;
      html = dom.html.substring(start, end);
      //console.log("after","."+html+".", start, end);
    }
  };
  /* this.calculateHTML = function(){
    html = dom.html.substring(start, end);
    //console.log(html, start, end);
    console.log("after",html);
  } */
  this.querySelector = function(regStr) {
    return querySelectorElement(this, regStr, false);
  };
  this.querySelectorAll = function(regStr) {
    return querySelectorElement(this, regStr, true);
  };
};

//module.exports = element;
