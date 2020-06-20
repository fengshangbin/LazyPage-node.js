var queryhelp = require("./queryhelp");
var element = require("./element");

//console.log(queryhelp, element);

var querySelectorElement = queryhelp.querySelectorElement;
var getElementByAttr = queryhelp.getElementByAttr;
var queryElement = queryhelp.queryElement;
var buildClassReg = queryhelp.buildClassReg;

var fastdom = function (html) {
  var dom = this;

  this.type = "dom";
  this.html = html;

  var elements = new Set();
  this.addElement = function (el) {
    elements.add(el);
  };
  this.findElement = function (start) {
    for (let el of elements) {
      if (el.getStart() == start) return el;
    }
    return null;
  };
  this.debug = function () {
    console.log(this.html);
    for (let el of elements) {
      console.log(el.toJSON());
      console.log(this.html.substring(el.getStart(), el.getStart() + 10));
    }
  };
  this.releaseElement = function (el) {
    elements.delete(el);
  };
  this.notifyChangeIndex = function (start, end, newHTML, source) {
    this.html =
      this.html.substring(0, start) + newHTML + this.html.substring(end);
    var offlen = newHTML.length - end + start;
    for (let el of elements) {
      el.changeIndex(start, offlen, end, source);
    }
  };

  this.querySelector = function (regStr, element) {
    return querySelectorElement(element ? element : this, regStr, false);
  };
  this.querySelectorAll = function (regStr, element) {
    return querySelectorElement(element ? element : this, regStr, true);
  };
  this.getElementById = function (id) {
    return getElementByAttr(this, "[id=" + id + "]", false);
  };
  this.getElementsByTag = function (tag) {
    var regStr = "< *(" + tag + ")[^>]*>";
    return queryElement(regStr, this, { multiElement: true });
  };
  this.getElementsByClass = function (classNames) {
    var option = {
      multiElement: true,
      moreRegs: [
        {
          index: 2,
          regStr: buildClassReg(classNames),
        },
      ],
    };
    var regStr = '< *([^ >]*)[^>]*?\\bclass *= *"([^"]*)"[^>]*>';
    return queryElement(regStr, this, option);
  };
};

module.exports = fastdom;
