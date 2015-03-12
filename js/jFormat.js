/**
 * Copyright © Quoc Quach 2013-2015
 * Author: Quoc Quach
 * Email: quoc_cooc@yahoo.com
 * Released under the MIT license
 * Date: 03/06/2015
 */
(function($) {
  $.fn.jFormat = function(id, model, callback) {
    var self = this;
    $.jFormat(id, model, function(formattedText) {
      self.html(formattedText);
      if (callback)
        callback.call(self, formattedText);
    });
  };

  $.fn.jFormat2 = function(id, model, callback) {
    var self = this;
    $.jFormat2(id, model, function(formattedText) {
      self.html(formattedText);
      if (callback)
        callback.call(self, formattedText);
    });
  };

  function replace(t){
    t = t.replace(/\\/,'\\\\');
    t = t.replace(/@model((\.[\w.\(\)]+)*(\[".+?"\])*(\.[\w.\(\)]+)*)+/g,function(m0){return m0.replace(/"/g,"'")});
    t = t.replace(/"/g,'\\"');
    t = t.replace(/@{2}/g,"{##}");
    t = replaceHelper(t);
    t = replaceHandler(t, true);
    //t = replaceIf(t);
    //t = replaceElseif(t);
    //t = replaceElse(t);
    //t = replaceForeach(t);
    //t = replaceForloop(t);
    //t = t.replace(/\}/g,'"; } return tmp;})() + "');
    t = t.replace(/@model((\.[\w.\(\)]+)*(\['?.+?'?\])*(\.[\w.\(\)]+)*)+/g, function(m0){return '" + helpers.htmlEscape(' + m0.substr(1) + ') + "'});
    t = t.replace(/@([\w.\(\)]+)/g,function(m0, m1){return '" + ' + m1 + ' + "'});
    t = t.replace(/\{##\}/g,"");
    t = t.replace(/\n/g,'"+\n"');
    t = '"' + t + '"';
    return t;
  }

  function replaceHandler(t, isRecursive){
    var r = /@for\(|@foreach\(|@if\(/;
    var m = t.match(r);
    if(m){
      switch(m[0]){
      case "@for(":
        t = replaceForloop(t);
        break;
      case "@foreach(":
        t = replaceForeach(t);
          break;
      case "@if(":
        t = replaceIf(t);
        break;
      default:
        break;
      }
    }
    if(isRecursive && r.test(t)){
      return replaceHandler(t, isRecursive);
    }
    return t;
  }

  function replaceHelper(t){
    for(var i in helpers){
      var regex = new RegExp("@"+i+"(\\(.*\\))","g");
      t = t.replace(regex,function(m0,m1){
        return "\" + helpers."+i + revert(m1) + " + \"";
      });
    }
    return t;
  }

  function replaceForeach(t){
    console.log("replaceForeach");
    var r = /@foreach\(var (.+) in ([^\)]*)\)\{\n/;
    var m = r.exec(t);
    if(!m) return t;
    var startIndex = t.indexOf(m[0]);
    var out = '" + (function(){' +
    'var tmp = "";' +
    'for(var i in ' + m[2] + '){' +
    'var ' + m[1] + ' = ' + m[2] + '[i];' +
    'tmp += "';
    t = t.replace(m[0], out);
    t = closeStatement(t, startIndex, true);
    return t;
  }

  function replaceForloop(t){
    console.log("replaceForloop");
    var r = /@(for\(.+\)\{)\n/;
    var m = r.exec(t);
    if(!m) return t;
    var startIndex = t.indexOf(m[0]);
    var out = '" + (function(){' +
    'var tmp = "";' +  m[1] +
    'tmp += "';
    t = t.replace(m[0], out);
    t = closeStatement(t, startIndex, true);
    return t;
  }
  //t = t.replace(/\\/,'\\\\');
  //t = t.replace(/"/g,'\\"');
  function revert(t){
    console.log(revert);
    t = t.replace(/\\{2}/g,'\\');
    t = t.replace(/\\"/g,'"');
    return t;
  }

  function replaceIf(t){
    var r = /@(if\(.+\)\{)\n/g;
    var m;
    while(m = r.exec(t)){
      var startIndex = t.indexOf(m[0]);
      console.log("replaceIf | m: %s", m[0]);
      var out = '" + (function(){' +
      'var tmp = "";' +  revert(m[1]) +
      'tmp += "';
      t = t.replace(m[0], out);
      t = closeStatement(t, startIndex);
    }
    return t;
  }

  function replaceElseif(t){
    console.log("replaceElseif");
    var r = /@(else if\([^\)]+\)\{)\n/;
    var m = r.exec(t);
    var startIndex = t.indexOf(m[0]);
    t = t.replace(m[0], revert(m[1]) + " tmp += \"");
    t = closeStatement(t, startIndex);
    return t;
  }

  function replaceElse(t){
    console.log("replaceElse");
    var r = /@else\{\n/;
    var m = r.exec(t)
    var startIndex = t.indexOf(m[0]);
    t = t.replace(m[0],"else{ tmp += \"");
    t = closeStatement(t, startIndex, true);
    return t;
  }

  //    t = t.replace(/\}/g,'"; } return tmp;})() + "');
  function closeStatement(t, startIndex, closed){
    console.log("closeStatement: startIndex: %s, closed: %s", startIndex, closed);
    var closeIndex = t.indexOf("}\n",startIndex);

    var ifIndex = t.indexOf("@if(", startIndex);
    ifIndex = ifIndex!=-1 ? ifIndex : Number.MAX_VALUE;
    if(closeIndex > ifIndex){
      t = replaceIf(t);
      closeIndex = t.indexOf("}\n",startIndex);
    }

    var forIndex = t.indexOf("@for(", startIndex);
    forIndex = forIndex!=-1 ? forIndex : Number.MAX_VALUE;
    if(closeIndex > forIndex){
      t = replaceForloop(t);
      closeIndex = t.indexOf("}\n",startIndex);
    }

    var foreachIndex = t.indexOf("@foreach(", startIndex);
    foreachIndex = foreachIndex!=-1 ? foreachIndex : Number.MAX_VALUE;
    if(closeIndex > foreachIndex){
      t = replaceForeach(t);
      closeIndex = t.indexOf("}\n",startIndex);
    }

    if(closed){
      console.log("closed block");
      return t.replace("}\n",'"; } return tmp;})() + "');
    }

    var elseifIndex = t.indexOf("@else if", startIndex);
    if(elseifIndex!=-1){
      console.log("has else if block");
      var tmp = t.substring(closeIndex+1,elseifIndex);
      if(!tmp.match(/\S/g,'')){
        console.log("calling replace else if");
        t = t.replace("}\n","\";}");
        t = replaceElseif(t);
        return t;
      }
    }

    var elseIndex = t.indexOf("@else{\n", startIndex);
    if(elseIndex!=-1){
      console.log("has else block");
      var tmp = t.substring(closeIndex+1,elseIndex);
      console.log("tmp: %s", tmp);
      if(!tmp.match(/\S/g,'')){
        console.log("calling replace else");
        t = t.replace("}\n","\";}");
        t = replaceElse(t);
        return t;
      }
    }

    return t.replace("}\n",'"; } return tmp;})() + "');
  }

  function partial(id, model){
    var formatted;
    //this only work because getTemplate is in synchronous condition
    getTemplate(id, function(template){;
      var t = replace(template);
      formatted = jEval(model, t);
    });
    return formatted;
  }

  var helpers = {
      raw : function(s) {
        return s;
      },
      htmlEscape: htmlEscape,
      partial: partial
    };

  function jEval(model, func){
    func = "out = " + func + ";";
    console.log(func);
    var out;
    eval(func);
    return out;
  }

  /**
   * do a different approach. load all template ahead of time and then let the eval function to compute the template.
   * as long as template available it's eval synchronously.
   */
  function loadTemplate(id,callback){
    console.log("loadTemplate: %s", id);
    getTemplate(id,function(template){
      if (template.indexOf("@partial(") != -1) {
        var regex = /@partial\((.*),.*\)/g;
        var total = template.match(regex).length;
        var m;
        var count = 0;
        while(m = regex.exec(template)){
          loadTemplate(m[1], function(){
            count++;
            if(count == total){
              if(callback) callback();
            }
          });
        }
      }
      else{
        if(callback) callback();
      }
    });
  }

  $.jFormat2 = function(id, model, callback){
    loadTemplate(id, function(){
      console.log("load template complete, call partial");
      var formatted = partial(id, model);
      if(callback){
        callback.call(this,formatted);
      }
      return formatted;
    });
  }

  $.jFormat = function(id, model) {
    var name, callback;
    if(arguments.length==2){
      if(typeof(arguments[2])=="function"){
        name="model";
        callback=arguments[2];
      }else{
        name=arguments[2];
        callback=null;
      }
    }
    else if(arguments.length==3){
      name="model";
      callback=arguments[2];
    }
    else{
      name=arguments[2];
      callback=arguments[3];
    }
    getTemplate(id, function(template) {
      name = name || "model";
      _jFormat(template, model, name, function(f) {
        if (callback)
          callback(f);
      });
    });
  };

  $.jFormat.tmpVars = {};
  var jFormatCache = {};
  var jCache = function(callback) {
    this.isReady = false;
    this.data = "";
    this.callbacks = [ callback ];
  };

  var jFormatOptions = {
    baseUrl : "", // calculate match with the base url of the jFormat.js
    paths : {}, // hash to map a name to a path manually. If not it will be
                // resolved base on on name
    cacheUrls : []
  // array of url need to fetch for cache
  };

  $.jFormat.init = function(opts) {
    jFormatOptions = $.extend({}, jFormatOptions, opts);
    for ( var i in jFormatOptions.cacheUrls) {
      var url = jFormatOptions.cacheUrls[i];
      getTemplateAsync(url, null);
    }
  };


  $.jFormat.addHelper = function(h) {
    helpers = $.extend(helpers, h);
  }

  // ========================== Private functions ================================
  function getTemplate(id, callback) {
    if (id.charAt(0) == "#") {
      var jTemplate = $(id);
      if (jTemplate.length != 1) {
        throw new Error("template not found");
      }
      callback(jTemplate.html());
    } else if (id.charAt(0) == "@") {
      var url = getFullUrl(id.substring(1));
      getTemplateAsync(url, callback);
    } else {
      //provide as a template string
      callback(id);
    }
  }

  function getFullUrl(path) {
    path = jFormatOptions.paths[path] || (path + ".html");
    return jFormatOptions.baseUrl + "/" + path;
  }

  function getTemplateSync(url) {
    if (jFormatCache[url] !== undefined) {
      return jFormatCache[url].data;
    }
    var template = "";
    jFormatCache[url] = new jCache(callback);
    $.ajax({
      url : url,
      async : false,
      success : function(data) {
        template = data;
        jFormatCache[url].isReady = true;
        jFormatCache[url].data = data;
      },
      error : function() {
        jFormatCache[url] = "";
      }
    });
    return template;
  }

  function getTemplateAsync(url, callback) {
    if (jFormatCache[url] !== undefined) {
      var cache = jFormatCache[url];
      cache.callbacks.push(callback);
      if (cache.isReady) {
        handleCallback(url);
      }
      return;
    }
    jFormatCache[url] = new jCache(callback);
    $.ajax({
      url : url,
      async : true,
      success : function(data) {
        jFormatCache[url].isReady = true;
        jFormatCache[url].data = data;
        handleCallback(url);
      },
      error : function() {
        delete jFormatCache[url];
      }
    });
  }

  function handleCallback(url) {
    var cache = jFormatCache[url];
    if (cache == undefined)
      return;
    var callback;
    while (callback = cache.callbacks.shift()) {
      callback(cache.data, true);
    }
  }

  function htmlEscape(str) {
    return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  }

  function htmlUnescape(value) {
    return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  }

  function getObjectProperty(obj, propertyStr) {
    // normalize property signature
    if (!obj)
      return;
    if (propertyStr.charAt(0) != '[' && propertyStr.charAt(0) != '.')
      propertyStr = "." + propertyStr;
    var regex = /\.(\w+)|\[['"]([^'"]+)['"]\]|\[(\d+)\]/g;
    var m, current = obj;
    while (m = regex.exec(propertyStr)) {
      var key = m[1] || m[2] || m[3]
      current = current[key];
      if (!current)
        return;
    }
    return current;
  }

  /**
   * This is good if property used multiple time, but it bad if there are many
   * properties not being used. cannot handle non-defined properties.
   */
  function replaceProperties(formatted, name, model, primaryOnly, useRaw) {
    // escape @@ for everything but model
    var id = guid();
    formatted = formatted.replace(/@@model/g, id).replace(/@@/g, '#@#')
        .replace(new RegExp(id, "g"), '@@model');
    if (model) {
      if ($.isArray(model) || $.isPlainObject(model)) {
        // console.log("replaceProperties of model object: %s, primaryOnly: %s,
        // useRaw: %s", name, primaryOnly, useRaw);
        // console.log("replaceProperties of model object | template: %s, name:
        // %s, model: %s", formatted, name, JSON.stringify(model));
        for ( var i in model) {
          if ($.isArray(model[i]) && false) {
            formatted = _jFormat(formatted, model[i], name + "." + i);
          } else {
            if (($.isArray(model[i]) || $.isPlainObject(model[i]))) {
              // console.log("skip non primary types: property %s", i);
              continue;
            }

            // handle helper function
            for ( var j in helpers) {
              var str = "@" + j + "\\(\\s*?" + name + "\\." + i + "\\s*?\\)";
              var r = new RegExp(str, "g");
              // console.log("helper regex: %s", r);
              formatted = formatted.replace(r, function() {
                try {
                  return helpers[j](model[i]);
                } catch (err) {
                  // console.warn(err);
                  return "";
                }
              });
            }

            // handle all other properties with htmlEscape.
            str = "@" + name + "\\." + i;
            r = new RegExp(str, "g");
            formatted = formatted.replace(r, htmlEscape(model[i]));

          }
        }
        // handle custom format
        // handle full model object.
        if (useRaw) {
          var id = guid();
          $.jFormat.tmpVars[id] = model;
          formatted = formatted.replace(/@@model/g, "$.jFormat.tmpVars['" + id
              + "']");
        }
      }
      // assume model is string
      else {
        // console.log("replaceProperties string model");
        var noModelPropertySpecified = "(@" + name + ")[^\\.]";
        var regexFullModel = new RegExp(noModelPropertySpecified, "g");
        var fullModelMatch;
        while (fullModelMatch = regexFullModel.exec(formatted)) {
          formatted = formatted.replace(fullModelMatch[1], htmlEscape(model));
        }
      }
    }
    // return formatted;
    return _replaceProperties(formatted, name, model, primaryOnly, useRaw);// primaryOnly
                                                                            // ?
                                                                            // formatted
                                                                            // :
  }
  ;
  /**
   * synchronous process arbitrary helper function. this should be render last
   * in all helper to avoid conflict with helper function of properties.
   */
  function renderHelper(formatted, cModel) {
    for ( var name in helpers) {
      var handler = helpers[name];
      var regex = new RegExp("@" + name + "\\((.+?)\\)", "g");
      formatted = formatted.replace(regex, function(m0, m1) {
        var args = parseFunctionArguments(m1, cModel);
        return handler.apply(cModel, args);
      });
    }
    return formatted;
  }
  /**
   * parsing a string to get arguments of a function Cannot simply using split
   * base on comma, since a string may contains commas as its value. and object
   * or array will have commas as separators. the approach will loop through the
   * string to identify string, array or object. try to handle primary types:
   * string, int, float, boolean, null, array, objects.
   */
  function parseFunctionArguments(str, cModel) {
    console.log("parseFunctionArguments: %s", str);
    var arr = [];
    str = $.trim(str);
    var flags = [];
    // replace all escape quote and double quote before processing
    str = str.replace(/\\'/g, '#sq#').replace(/\\"/g, '#dq#');

    var flag, count, tmp;
    function reset() {
      flag = null;
      count = 0;
      tmp = "";
    }
    reset();
    function revert() {
      tmp = tmp.replace(/#sq#/g, "\\'").replace(/#dq#/g, "\\\"");
    }
    var specialCase = false;
    for (var i = 0; i < str.length; i++) {
      var char = str.charAt(i);
      tmp += char;
      switch (char) {
      case "[":
        if (flag == null || flag == "array") {
          // console.log("process array start");
          if (flag == null)
            tmp = "[";
          flag = "array";
          count++;
        }
        break;
      case "]":
        if (flag == "array") {
          // console.log("process array end");
          count--;
          // console.log("count: %d",count);
          if (count == 0) {
            // array done
            revert();
            arr.push(JSON.parse(tmp));
            reset();
            specialCase = true;
          }
        }
        break;
      case "{":
        if (flag == null || flag == "object") {
          // console.log("process object start");
          if (flag == null)
            tmp = "{";
          flag = "object";
          count++;
        }
        break;
      case "}":
        if (flag == "object") {
          // console.log("process object end");
          count--;
          if (count == 0) {
            // object done
            revert();
            // console.log("tmp: %s", tmp);
            arr.push(JSON.parse(tmp.replace(/(\w+?)\s*?:/g, "\"$1\":")));
            reset();
            specialCase = true;
          }
        }
        break;
      case "\"":
        if (flag == null) {
          // console.log("process string start 1");
          flag = "string1";
          tmp = "";
        } else if (flag == "string1") {
          // console.log("process string end 1");
          revert();
          tmp = tmp.slice(0, -1);
          arr.push(tmp);
          reset();
          specialCase = true;
        }
        break;
      case "'":
        if (flag == null) {
          // console.log("process string start 2");
          flag = "string2";
          tmp = "";
        } else if (flag == "string2") {
          // console.log("process string end 2");
          revert();
          tmp = tmp.slice(0, -1);
          arr.push(tmp);
          reset();
          specialCase = true;
        }
        break;
      case ",":
        if (specialCase) {
          // console.log("reset special case");
          specialCase = false;
          reset();
          break;
        }
        if (flag == null) {
          // console.log("process other primary types");
          tmp = tmp.slice(0, -1);
          var val, m;
          console.log("tmp: %s", tmp);
          if (tmp == "@@model") {
            val = cModel;
          } else if (m = tmp.match(/@model\.(.+)/)) {
            val = cModel[m[1]];
          } else {
            val = getPrimaryValue(tmp);
          }
          arr.push(val);
          reset();
        }
        break;
      }
    }

    if (flag == null && !specialCase) {
      // console.log("process other primary types");
      // if it model property, get model value
      var val, m;
      console.log("tmp: %s", tmp);
      if (tmp == "@@model") {
        val = cModel;
      } else if (m = tmp.match(/@model\.(.+)/)) {
        val = cModel[m[1]];
      } else {
        val = getPrimaryValue(tmp);
      }
      arr.push(val);
      reset();
    }

    return arr;
  }

  /**
   * helper function for parsing function arguments
   */
  function getPrimaryValue(str) {
    var val = $.trim(str).toLowerCase();
    console.log("val: %s", val);
    switch (val) {
    case "true":
      return true;
    case "false":
      return false;
    case "":
    case "null":
      return null;
    default:
      var m;
      if ((m = val.match(/[0-9]+/)) && m[0] == val) {
        return parseInt(val);
      }
      if ((m = val.match(/[0-9.]+/)) && m[0] == val) {
        return parseFloat(val);
      }
      throw "Invalid argument";
    }
  }
  /**
   * search for property and replace, it good if property only use one time. it
   * is a fall back to replace not defined properties. if properties not
   * defined, they are set to empty instead of throw exception.
   */
  function _replaceProperties(formatted, name, model, primaryOnly, useRaw) {
    // console.log("_replaceProperties");
    // console.log(formatted);
    // render helper function first.
    for ( var j in helpers) {
      var r = new RegExp("@" + j + "\\(\\s*?" + name + "\\.([^\\s]*?)\\s*?\\)");
      formatted = formatted.replace(r, function(m0, m1) {
        if (!model[m1])
          return "";
        try {
          return helpers[j](model[m1]);
        } catch (err) {
          console.warn(err);
          return "";
        }
      });
    }

    formatted = renderHelper(formatted, model);

    /* Property of model was specified */
    // regex = /(@model((\.\w+|\[['"][^'"]+['"]\]|\[\d+\])+))[\s'"\)<;\r\n]/g
    var str = "(@" + name
        + "((\\.\\w+|\\[['\"][^'\"]+['\"]\\]|\\[\\d+\\])+))[\\s'\"\\)<;\r\n]";
    // console.log(str);
    var regex = new RegExp(str, "g");

    // console.log("useRaw: %s", useRaw);
    // if(useRaw) console.log(formatted);
    var match;
    tmp = formatted;
    while (match = regex.exec(tmp)) {
      // console.log("match: %s", match);
      var propertyStr = match[2];
      // console.log("replace: %s", propertyStr);
      var val = getObjectProperty(model, propertyStr);

      if (!model || !val) {
        // console.log("not defined");
        formatted = formatted.replace(match[1], "");
      } else {
        if (useRaw) {
          // console.log("useRaw");
          var id = guid();
          $.jFormat.tmpVars[id] = val;
          formatted = formatted.replace(match[1], "$.jFormat.tmpVars['" + id
              + "']");
        } else {
          if ($.isArray(val) || $.isPlainObject(val)) {
            if (!primaryOnly) {
              // console.log("should not get here");
              formatted = formatted.replace(match[1], JSON.stringify(val));
            } else {
              // console.log("skip non primary types ___: property %s",
              // propertyStr);
            }
          } else {
            // console.log("replace primary type");
            formatted = formatted.replace(match[1], htmlEscape(val));
          }
        }
      }
    }
    return formatted.replace(/#@#/g, "@");
  }

  function ifelseRender(template, model, name, partialList, callback) {
    if (template.indexOf("@if") == -1)
      return false;
    var arr = template.split('@if');
    var formatted = arr[0];
    var count = arr.length - 1;
    for (var i = 1; i < arr.length; i++) {
      var block = "@if" + arr[i];
      // process if statement
      var str = "@if\\(\\s*" + name
          + "\\.(.+)\\s*\\)[\\s\\S]*?\\{([\\s\\S]*?)\\}";
      var regex = new RegExp(str, "g");
      var flag = false;
      block = block.replace(regex, function(m0, m1, m2) {
        if (!model[m1])
          return "";
        var refId = guid();
        flag = true;
        setTimeout(function() {
          _jFormat(m2, model, name, function(f) {
            count--;
            // console.log("if callback count: %d, f: %s, partialList: %s",
            // count, f, JSON.stringify(partialList));
            formatted = formatted.replace(refId, f);
            if (count == 0) {
              renderPartial(formatted, partialList, model, function(f) {
                callback(f);
              });
            }
          });
        }, 0);
        return refId;
      });
      // process else if statement
      str = "@else if\\(\\s*" + name
          + "\\.(.+)\\s*\\)[\\s\\S]*?\\{([\\s\\S]*?)\\}";
      regex = new RegExp(str, "g");
      block = block.replace(regex, function(m0, m1, m2) {
        if (flag || !model[m1])
          return "";
        var refId = guid();
        flag = true;
        setTimeout(function() {
          _jFormat(m2, model, name, function(f) {
            count--;
            // console.log("else if callback count: %d", count);
            formatted = formatted.replace(refId, f);
            if (count == 0) {
              renderPartial(formatted, partialList, model, function(f) {
                callback(f);
              });
            }
          });
        }, 0);
        return refId;
      });
      // process else statement.
      str = "@else\\{([\\s\\S]*?)\\}";
      regex = new RegExp(str, "g");
      block = block.replace(regex, function(m0, m1) {
        if (flag)
          return "";
        var refId = guid();
        setTimeout(function() {
          _jFormat(m1, model, name, function(f) {
            count--;
            // console.log("else callback count: %d", count);
            formatted = formatted.replace(refId, f);
            if (count == 0) {
              renderPartial(formatted, partialList, model, function(f) {
                callback(f);
              });
            }
          });
        }, 0);
        return refId;
      });
      formatted += block;
    }
    return true;
  }
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4()
        + s4() + s4();
  }
  function renderPartial(template, partialList, model, callback) {
    if (!callback) {
      throw "renderPartial require callback";
    }

    if (!partialList || !template) {
      // console.info("partialList or template not defined");
      callback("");
      return;
    }

    if (partialList.length == 0) {
      callback(template);
      return;
    }

    var formatted = template;
    var count = 0;
    for ( var i in partialList) {
      if (i == "length")
        continue;
      (function(j) {
        getTemplate(partialList[j][1],
            function(t) {
              ++count;
              var m = $.extend({}, model);
              /*
               * modelProperty is not null or empty when the user specifies only
               * a single property of the model to be used as the partial views
               * model.
               */
              var modelProperty = partialList[j][2];
              if (modelProperty && modelProperty != ''
                  && modelProperty != "model") {
                m = m[modelProperty];
              }
              _jFormat(t, m, "model", function(f) {
                formatted = formatted.replace(j, f);
                if (count == partialList.length) {
                  callback(formatted);
                }
              });

            });
      })(i);
    }
  }

  /*
   * @foreach(var item in list){}
   * */
  function foreachRender(template, model, name, partialList, callback) {
    if (template.indexOf("@foreach") == -1)
      return false;
    var tname = name + "\\.?(.*)";
    var regex = new RegExp("@foreach\\(var (.+) in " + tname
        + "\\)\\{([\\s\\S]*?)\\}", "g");
    var formatted = template.replace(regex, function(m0, m1, m2, m3) {
      console.log("render foreach");
      var m = m2 ? model[m2] : model;
      if (!m)
        return "";
      var out = "";
      var count = 0;
      var refIds = [];
      for ( var i in m) {
        (function(refId, _m) {
          count++;
          out += refId;
          console.log("count: %d, refId: %s, name: %s", count, refId, name);
          setTimeout(function() {
            _jFormat(m3, _m, m1, function(f) {
              --count;
              // console.log("count: %d, refId: %s, name: %s", count, refId,
              // name);
              formatted = formatted.replace(refId, f);
              // console.log("formatted: %s", formatted);
              if (count === 0) {
                renderPartial(formatted, partialList, model, function(f) {
                  callback(f);
                });
              }
            });
          }, 0);
        })(guid(), m[i]);
      }
      return out;
    });
    return true;
  }

  /*
   * @for(var key in list){}
   * list could be array or hash
   * */
  function forloopRender(template, model, name, partialList, callback) {
    if (template.indexOf("@for") == -1)
      return false;
    var tname = name + "\\.?(.*)";
    var regex = new RegExp("@for\\(var (.+) in " + tname
        + "\\)\\{([\\s\\S]*?)\\}", "g");
    /*
     * m0: entire match
     * m1: key
     * m2: property
     * m3: body
     * */

    var formatted = template.replace(regex, function(m0, m1, m2, m3) {
      console.log("render for loop");
      var m = m2 ? model[m2] : model;
      if (!m)
        return "";
      var out = "";
      var count = 0;
      var refIds = [];
      for (var i in m) {
        (function(refId, _m, key, _m3) {
          count++;
          out += refId;
          var name = m2 ? "model['"+m2+"']["+m1+"]" : "model["+m1+"]";
          //console.log("count: %d, refId: %s, name: %s, key: %s", count, refId, name, key);
          setTimeout(function() {
            //replace the @key variable first.
            //console.log("key: %s, m3: %s, pattern:%s", key, _m3, "@"+m1);
            var regex = new RegExp("@"+m1,"g");
            _m3 = _m3.replace(regex, key);
            _jFormat(_m3, _m, name, function(f) {
              --count;
              console.log("count: %d, refId: %s, name: %s", count, refId, name);
              formatted = formatted.replace(refId, f);
              console.log("formatted: %s", formatted);
              if (count === 0) {
                renderPartial(formatted, partialList, model, function(f) {
                  callback(f);
                });
              }
            });
          }, 0);
        })(guid(), m[i], i, m3);
      }
      return out;
    });
    return true;
  }
  function _jFormat(template, model, name, callback) {
    console.log("name: %s", name);
    if (!callback) {
      throw "callback is required";
    }

    if (!template) {
      return callback("");
    }

    name = name || "model";
    var tmp = name.replace(/\[/g,"\\[").replace(/\]/g,"\\]");
    var regexp = new RegExp(tmp,"g");
    //console.log(regexp);
    template = template.replace(regexp,"model");
    //console.log("normalize template: %s", template);
    var name = "model"
    //name = name.replace(/\./g, "\\.");
    var partialList = {
      length : 0
    };
    var hasPartial = false;

    // var formatted = (name == "model") ? replaceProperties(template, name,
    // model, true) : template;

    var formatted = replaceProperties(template, name, model, true);

    if (formatted.indexOf("$.jFormat") != -1) {
      var str = '\\$\\.jFormat\\(\\s*?\"(.*?)\"\\s*?,\\s*?@' + name
          + '\.?(.*?)\\s*?\\)';
      var regex = new RegExp(str, "g");
      formatted = formatted.replace(regex, function() {
        hasPartial = true;
        var id = guid();
        partialList[id] = arguments;
        partialList.length += 1;
        return id;
      });
      // try for the whole model
      var str = '\\$\\.jFormat\\(\\s*?\"(.*?)\"\\s*?,\\s*?@@(model)\\s*?\\)';
      var regex = new RegExp(str, "g");
      formatted = formatted.replace(regex, function() {
        hasPartial = true;
        var id = guid();
        partialList[id] = arguments;
        partialList.length += 1;
        return id;
      });
    }
    // replace @script with script for embedded template.
    formatted = formatted.replace(/(<\/?)@script/g, "$1script");

    // replace properties of embedded script in template.
    var regex = /<script.*?>[\s\S]*<\/script>/;
    formatted = formatted.replace(regex, function(m0) {
      return replaceProperties(m0, name, model, false, true);
    });

    if (ifelseRender(formatted, model, name, partialList, callback))
      return;

    if (foreachRender(formatted, model, name, partialList, callback))
      return;

    if (forloopRender(formatted, model, name, partialList, callback))
      return;

    renderPartial(formatted, partialList, model, function(f) {
      callback(f);
    });
  }
})(jQuery);