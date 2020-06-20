var element = function (dom, start, end, html, attrLen, closeLen) {
  var that = this;
  var attrRegStr = ' *= *"([^"]*)"';

  this.type = "element";
  this.toJSON = function () {
    return {
      start: start,
      end: end,
      attrLen: attrLen,
      closeLen: closeLen,
      html: html,
    };
  };
  this.getStart = function () {
    return start;
  };
  this.getEnd = function () {
    return end;
  };
  this.getAttrLen = function () {
    return attrLen;
  };
  this.getDom = function () {
    return dom;
  };
  this.getInnerHTML = function () {
    return html.substring(attrLen, html.length - closeLen);
  };
  this.setInnerHTML = function (innerhtml) {
    if(innerhtml==null)innerhtml="";
    innerhtml = innerhtml.toString();
    html =
      html.substring(0, attrLen) +
      innerhtml +
      html.substring(end - closeLen - start);
    dom.notifyChangeIndex(start + attrLen, end - closeLen, innerhtml, this);
  };
  this.getOuterHTML = function () {
    return html;
  };
  this.setOuterHTML = function (outerHtml) {
    dom.notifyChangeIndex(start, end, outerHtml);
    //Release Element
    destroy();
  };
  this.getAttrHTML = function () {
    return html.substring(0, attrLen);
  };
  this.setAttrHTML = function (attrHTML) {
    html = attrHTML + html.substring(attrLen);
    var lenOff = attrHTML.length - attrLen;
    dom.notifyChangeIndex(start, start + attrLen, attrHTML, this);
    attrLen += lenOff;
  };

  function destroy() {
    if (dom) dom.releaseElement(that);
    dom = null;
  }
  function getAttributeObj(key) {
    var regStr = key + attrRegStr;
    var reg = new RegExp(regStr, "i");
    var attrHTML = that.getAttrHTML();
    if (reg.test(attrHTML)) {
      var group = reg.exec(attrHTML);
      return group;
    }
    return null;
  }
  this.getAttribute = function (key) {
    var obj = getAttributeObj(key);
    if (obj == null) return null;
    return obj[1];
  };
  this.hasAttribute = function (key) {
    var attr = this.getAttribute(key);
    return attr != null && attr.length > 0;
  };
  this.setAttribute = function (key, value) {
    var obj = getAttributeObj(key);
    var newAttr = (obj == null ? " " : "") + key + '="' + value + '"';
    if (value == null) newAttr = "";
    var newLen = newAttr.length;
    var oldStart = obj == null ? attrLen - 1 : obj.index;
    var oldLen = obj == null ? 0 : obj[0].length;

    attrLen += newLen - oldLen;
    html =
      html.substring(0, oldStart) + newAttr + html.substring(oldStart + oldLen);
    dom.notifyChangeIndex(
      start + oldStart,
      start + oldStart + oldLen,
      newAttr,
      this
    );
  };
  this.removeAttribute = function (key) {
    this.setAttribute(key, null);
  };
  this.changeIndex = function (_start, offlen, _end, source) {
    if (start >= _start && end <= _end) {
      destroy();
    } else if (end > _start) {
      //console.log("before","."+html+".", start, end);
      var hasChangeHTML = start < _end;
      if (start > _start) {
        start += offlen;
      }
      end += offlen;
      if (hasChangeHTML && this != source) {
        html = dom.html.substring(start, end);
      }
      //console.log("after","."+html+".", start, end);
    }
  };
  this.querySelector = function (regStr) {
    return dom.querySelector(regStr, this);
  };
  this.querySelectorAll = function (regStr) {
    return dom.querySelectorAll(regStr, this);
  };
};

module.exports = element;
