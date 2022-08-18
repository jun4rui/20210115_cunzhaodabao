var _SERVER = '//www.hnrcsc.com/api';

//查询url参数函数
//有则返回参数列表list
//没有则返回空串
function getParameters(inUrl/*完整的URL字符串*/) {
  //url中有?号才继续
  if (inUrl.indexOf('\?') >= 0) {
    return inUrl.substring(inUrl.indexOf('?') + 1).split('&');    //有则返回所有参数的list
  } else {
    return '';  //没有则返回''
  }
}

//获得url中某个参数的值
//有则返回参数的值
//没有则返回空串
function getParameterValue(inUrl/*输入Url*/, inName/*参数名*/) {
  var paraList = getParameters(inUrl);
  for (var i = 0; i < paraList.length; i++) {
    //如果没有'='则跳过
    if (paraList[i].indexOf('=') < 0) {
      continue;
    }
    //如果参数名=inName则返回参数值
    var tempVal = paraList[i].split('=');
    if (tempVal[0] == inName) {
      return tempVal[1];
    }
  }
  return '';
}

//TEST: getParameterValue('http://www.htyou.com/index.html?q=北京&asdf=123&zxcv=123&a=fasdf','q');

//检查浏览器版本
function checkBrowser() {
  var userAgent = navigator.userAgent,
    rMsie = /(msie\s|trident.*rv:)([\w.]+)/,
    rFirefox = /(firefox)\/([\w.]+)/,
    rOpera = /(opera).+version\/([\w.]+)/,
    rChrome = /(chrome)\/([\w.]+)/,
    rSafari = /version\/([\w.]+).*(safari)/;
  var browser;
  var version;
  var ua = userAgent.toLowerCase();

  function uaMatch(ua) {
    var match = rMsie.exec(ua);
    if (match != null) {
      return {browser: 'IE', version: match[2] || '0'};
    }
    var match = rFirefox.exec(ua);
    if (match != null) {
      return {browser: match[1] || '', version: match[2] || '0'};
    }
    var match = rOpera.exec(ua);
    if (match != null) {
      return {browser: match[1] || '', version: match[2] || '0'};
    }
    var match = rChrome.exec(ua);
    if (match != null) {
      return {browser: match[1] || '', version: match[2] || '0'};
    }
    var match = rSafari.exec(ua);
    if (match != null) {
      return {browser: match[2] || '', version: match[1] || '0'};
    }
    /* 微信下面会报错导致后续的js都无法执行，Fuck！只能再无法解析后强制返回一个参数
     if (match != null) {
     return {browser: "", version: "0"};
     }*/
    return {browser: '', version: '0'};
  }

  var browserMatch = uaMatch(userAgent.toLowerCase());
  if (browserMatch.browser) {
    browser = browserMatch.browser;
    version = browserMatch.version;
  }

  return {
    'browser': browser,
    'version': version,
  };
}

(function() {
  //首先检查用户浏览器
  //根据浏览器结果判断是否调用提醒信息的函数
  var _browser = checkBrowser();
  if (_browser.browser === 'IE' && parseInt(_browser.version) < 8) {
    $('body').
      append(
        '<div style="position: fixed;top: 0;left: 0;width: 100%;background-color: #FFD100;color: #4A4A4A;text-align: center;z-index: 9999999999;box-shadow: 0 1px 3px #CCC;opacity:0.9; line-height:28px;height:28px;">hi，您当前的浏览器版本过低，可能有安全风险，建议升级浏览器：<a href="https://www.google.cn/intl/zh-CN/chrome/browser/desktop/" target="_blank" style="color:#F00;opacity: 0.9;">谷歌Chrome</a> 或 <a href="http://www.uc.cn/ucbrowser/download/" target="_blank" style="color:#F00;">UC浏览器</a></div>');
  }
})();

// 加载百度计数器
(function() {
  // 百度计数器脚本
  var _hmt = _hmt || [];
  (function() {
    var hm = document.createElement('script');
    hm.src = '//hm.baidu.com/hm.js?d54225656d7eaddee0c32a6b5e36eee8';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(hm, s);
  })();
})();

/**
 * 页面卷动到指定位置的函数
 * inSelector: String 选择器
 */
var scrollTo = function(inSelector) {
  if (typeof ($) === 'function') {
    $('html,body').animate({
      scrollTop: $(inSelector).offset().top,
    });
  }
};

/**
 * 将输入的字符串固定替换成指定符号
 * inStr: 输入字符串
 * inStartPos: 开始替换的位置，0开始
 * inReplaceNum: 替换字符个数
 * inChar: 用来替换的字符
 */
function strReplaceChar(inStr, inStartPos, inReplaceNum, inChar) {
  // 先判断输入是不是有值
  if (inStr === '' || inChar === '') return inStr;
  // 如果位置和长度大于字符串长度，则自动缩减到字符串末尾
  var _strList = inStr.split('');
  var _counter = 0;
  for (var i = 0; i < _strList.length; i++) {
    //console.log(_strList[i], inStartPos, inReplaceNum);
    if (i > inStartPos && _counter < inReplaceNum) {
      _strList[i] = inChar;
      _counter++;
    }
  }
  return _strList.join('');
}

// 加载header
function addHeader() {
  $(document).ready(function() {
    $('body').prepend('<div id="header-section"></div>');
    $('#header-section').load('header.html');
  });
}

// 加载footer
function addFooter() {
  $(document).ready(function() {
    $('body').append('<div id="footer-section"></div>');
    $('#footer-section').load('footer.html');
  });
}

// 加载assistant
function addAssistant() {
  $(document).ready(function() {
    $('body').append('<div id="assistant-section"></div>');
    $('#assistant-section').load('assistant.html');
  });
}

// 跳转到页面顶部
function toPageTop() {
  requirejs(['jquery'], function($) {
    $('body,html').animate({scrollTop: 0}, 1000);
  });
}

// 将表单数据JSON化
// formID: 表单的ID
function getFormData(formID) {
  var unindexed_array = $('#' + formID).serializeArray();
  var indexed_array = {};

  for (var i = 0; i < unindexed_array.length; i++) {
    indexed_array[unindexed_array[i]['name']] = unindexed_array[i]['value'];
  }
  return indexed_array;
}

// 加入CSS样式
// css: 等于style语法文本，例如: 'a {color:red;}'
function addcss(css) {
  var head = document.getElementsByTagName('head')[0];
  var s = document.createElement('style');
  s.setAttribute('type', 'text/css');
  if (s.styleSheet) {   // IE
    s.styleSheet.cssText = css;
  } else {                // the world
    s.appendChild(document.createTextNode(css));
  }
  head.appendChild(s);
}

// 验证车牌号码
function isLicensePlate(str) {
  return /^(([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z](([0-9]{5}[DF])|([DF]([A-HJ-NP-Z0-9])[0-9]{4})))|([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳使领]))$/.test(
    str);
}

function nl2br(str, is_xhtml) {
  // http://kevin.vanzonneveld.net
  // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   improved by: Philip Peterson
  // +   improved by: Onno Marsman
  // +   improved by: Atli Þór
  // +   bugfixed by: Onno Marsman
  // +      input by: Brett Zamir (http://brett-zamir.me)
  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   improved by: Brett Zamir (http://brett-zamir.me)
  // +   improved by: Maximusya
  // *     example 1: nl2br('Kevin\nvan\nZonneveld');
  // *     returns 1: 'Kevin<br />\nvan<br />\nZonneveld'
  // *     example 2: nl2br("\nOne\nTwo\n\nThree\n", false);
  // *     returns 2: '<br>\nOne<br>\nTwo<br>\n<br>\nThree<br>\n'
  // *     example 3: nl2br("\nOne\nTwo\n\nThree\n", true);
  // *     returns 3: '<br />\nOne<br />\nTwo<br />\n<br />\nThree<br />\n'
  var breakTag = (is_xhtml || typeof is_xhtml === 'undefined')
    ? '<br ' + '/>'
    : '<br>'; // Adjust comment to avoid issue on phpjs.org display

  return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g,
    '$1' + breakTag + '$2');
}

//用户登录逻辑处理
//需要getParameterValue函数
function getUserLogin(callback) {
  console.log(`进入`);
  var _auth = getParameterValue(window.location.href, 'Auth');
  var _enPersonId = getParameterValue(window.location.href, 'enPersonId');
  var _enCompanyId = getParameterValue(window.location.href, 'enCompanyId');
  var _cvId = getParameterValue(window.location.href, 'cvId');
  var _personInfo = null;
  var _companyInfo = null;

  //url参数里面有auth，则进入用户登录判断
  if (_auth && (_enCompanyId || _enPersonId)) {
    //是企业用户
    if (_enCompanyId) {
      $.ajax({
        url: 'https://qz.hnrcsc.com/temp-hnrcwzp/auth-service/homePage/getCompanyInfo',
        type: 'POST',
        data: JSON.stringify({enCompanyId: _enCompanyId, loginStatus: 1}),
        contentType: 'application/json;charset=UTF-8',
        success: function(response) {
          if (response.code === '0000') {
            console.log('企业登录：', response);

            //继续查询详细信息
            $.ajax({
              url: 'https://qz.hnrcsc.com/hnrcwzp/company-service/company/getInfo/',
              type: 'POST',
              data: JSON.stringify({companyId: '123'}),//TODO 临时用一下的
              headers: {
                userId: _enCompanyId,
                companyId: _enCompanyId,
                requestSource: 2,
                authorization: _auth,
                userType: 2,
              },
              contentType: 'application/json;charset=UTF-8',
              success: function(response2) {
                if (response2.code === '0000') {
                  response2.data.enCompanyId = _enCompanyId;
                  console.log('response2:', response2);
                  window.localStorage.setItem('auth', _auth);
                  window.localStorage.setItem('companyInfo',
                    JSON.stringify(response2.data));
                  //企业登录成功则清空个人缓存信息
                  window.localStorage.removeItem('personInfo');
                  callback({
                    code: '0000',
                    type: 'company',
                    info: response2,
                    msg: '获取信息成功',
                  });
                } else {
                  callback({
                    code: '0001',
                    type: 'company',
                    info: response2,
                    msg: '获取信息失败',
                  });
                }
              },
            });
          } else {
            callback({
              code: '0001',
              type: 'company',
              info: response,
              msg: '获取信息失败',
            });
          }
        },
      });
    }
    //是个人用户
    if (_enPersonId) {
      $.ajax({
        url: 'https://qz.hnrcsc.com/temp-hnrcwzp/auth-service/homePage/getPersonInfo',
        type: 'POST',
        data: JSON.stringify({enPersonId: _enPersonId, loginStatus: 1}),
        contentType: 'application/json;charset=UTF-8',
        success: function(response) {
          if (response.code === '0000') {
            console.log('个人登录：', response);

            //继续查询详细信息
            $.ajax({
              url: 'https://qz.hnrcsc.com/hnrcwzp/person-service/person/getInfo/' +
                response.data.personId,
              type: 'POST',
              data: JSON.stringify({personId: '123'}),//TODO 临时用一下的
              headers: {
                userId: _enPersonId,
                requestSource: 2,
                userType: 1,
                authorization: _auth,
              },
              contentType: 'application/json;charset=UTF-8',
              success: function(response2) {
                if (response2.code === '0000') {
                  response2.data.enPersonId = _enPersonId;
                  console.log('response2:', response2);
                  window.localStorage.setItem('auth', _auth);
                  window.localStorage.setItem('personInfo',
                    JSON.stringify(response2.data));
                  window.localStorage.setItem(_enPersonId.toString() + 'CVID',
                    _cvId);
                  //个人登录成功则清空企业缓存信息
                  window.localStorage.removeItem('companyInfo');
                  callback({
                    code: '0000',
                    type: 'person',
                    info: response2,
                    msg: '获取信息成功',
                  });
                } else {
                  callback({
                    code: '0001',
                    type: 'person',
                    info: response2,
                    msg: '获取信息失败',
                  });
                }
              },
            });
          } else {
            callback({
              code: '0001',
              type: 'person',
              info: response,
              msg: '获取信息失败',
            });
          }
        },
      });
    }
  } else {
    console.log('没有auth参数的分支');
    //判断localStorage中是否有auth和personInfo或者companyInfo
    _auth = window.localStorage.getItem('auth');
    _personInfo = JSON.parse(window.localStorage.getItem('personInfo'));
    _companyInfo = JSON.parse(window.localStorage.getItem('companyInfo'));

    //是企业用户
    if (_companyInfo) {
      //继续查询详细信息
      $.ajax({
        url: 'https://qz.hnrcsc.com/hnrcwzp/company-service/company/getInfo',
        type: 'POST',
        data: JSON.stringify({companyId: '123'}),//TODO 临时用一下的
        headers: {
          userId: _companyInfo.enCompanyId,
          companyId: _companyInfo.enCompanyId,
          requestSource: 2,
          authorization: _auth,
          userType: 2,
        },
        contentType: 'application/json;charset=UTF-8',
        success: function(response2) {
          if (response2.code === '0000') {
            console.log('response2:', response2);
            response2.data.enCompanyId = _enCompanyId.enCompanyId;
            window.localStorage.setItem('companyInfo',
              JSON.stringify(response2.data));
            callback({
              code: '0000',
              type: 'company',
              info: response2,
              msg: '获取信息成功',
            });
          } else {
            callback({
              code: '0001',
              type: 'company',
              info: response2,
              msg: '获取信息失败',
            });
          }
        },
      });
    }
    //是个人用户
    if (_personInfo) {
      console.log('进入个人用户', _personInfo);
      //继续查询详细信息
      $.ajax({
        url: 'https://qz.hnrcsc.com/hnrcwzp/person-service/person/getInfo/' +
          _personInfo.personId,
        type: 'POST',
        data: JSON.stringify({personId: '123'}),//TODO 临时用一下的
        headers: {
          userId: _personInfo.enPersonId,
          requestSource: 2,
          userType: 1,
          authorization: _auth,
        },
        contentType: 'application/json;charset=UTF-8',
        success: function(response2) {
          console.log('person 2');
          if (response2.code === '0000') {
            console.log('response2:', response2);
            response2.data.enPersonId = _personInfo.enPersonId;
            window.localStorage.setItem('personInfo',
              JSON.stringify(response2.data));
            var _cvId = window.localStorage.getItem(
              _personInfo.enPersonId.toString() + 'CVID1');
            if (!_cvId) console.log('未找到用户cvId');
            callback({
              code: '0000',
              type: 'person',
              info: response2,
              msg: '获取信息成功',
            });
          } else {
            callback({
              code: '0001',
              type: 'person',
              info: response2,
              msg: '获取信息失败',
            });
          }
        },
      });
    }
    //没有任何数据的
    if (!_companyInfo && !_personInfo) {
      callback({code: '0002', type: null, info: null, msg: '用户未登录'});
    }
  }
}

//获取加密ID
function getEnCode(inCode, callback) {
  $.postJSON('https://qz.hnrcsc.com/hnrcwzp/person-service/encrypt/encode',
    {content: inCode}, function(response) {
      // console.log('getEnCode:', response);
      callback(response);
    });
}

if (window.jQuery) {
  $.postJSON = function(url, data, callback) {
    return jQuery.ajax({
      'type': 'POST',
      'url': url,
      'contentType': 'application/json; charset=utf-8',
      'data': JSON.stringify(data),
      'dataType': 'json',
      'success': callback,
    });
  };
}

//2022 获取简历信息接口
function getResumeInfo(inEnPersonId, inPersonId, inAuth, callback) {
  $.ajax({
    url: 'https://qz.hnrcsc.com/hnrcwzp/person-service/person/getPersonInfoStatus/' +
      inPersonId,
    type: 'POST',
    // data:        JSON.stringify({personId: '123'}),
    headers: {
      userId: inEnPersonId,
      requestSource: 2,
      userType: 1,
      authorization: inAuth,
    },
    contentType: 'application/json;charset=UTF-8',
    success: function(response) {
      callback && callback({code: '0000', data: response});
    },
    error: function(error) {
      callback && callback({code: '0001', data: error});
    },
  });
}

//2022 投递在线职位接口
function postResumeOnline(inRecruitId, inEnPersonId, callback) {
  $.ajax({
    url: 'https://qz.hnrcsc.com/hnrcwzp/person-service/deliveryDetail/insertRecruitFolder',
    type: 'POST',
    data: JSON.stringify({
      userType: 1,
      recruitId: inRecruitId,
      personId: inEnPersonId,
    }),
    headers: {
      authorization: window.localStorage.getItem('auth'),
      userType: 1,
      userId: inEnPersonId,
      requestSource: 2,
    },
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    success: function(response) {
      if (response.code === '0000') {
        callback && callback({code: '0000', data: response});
      } else {
        callback && callback({code: '0002', data: response});
      }
    }.bind(this),
    error: function(error) {
      callback && callback({code: '0001', data: error});
    },
  });
}

//2022 投递离线（线下、校招）简历接口
function postResumeOnsite(inEnPersonId, inRecruitId, inCvId, inCompanyId, inType, callback) {
  $.ajax({
    url: 'https://qz.hnrcsc.com/hnrcwzp/person-service/conftitle/recruitFolder',
    type: 'POST',
    data: JSON.stringify({
      recruitId: inRecruitId,
      cvId: inCvId,
      companyId: inCompanyId,
      folderType: inType,//1:现场，4:校招
    }),
    headers: {
      authorization: window.localStorage.getItem('auth'),
      userType: 1,
      userId: inEnPersonId,
      requestSource: 2,
    },
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    success: function(response) {
      if (response.code === '0000') {
        callback && callback({code: '0000', data: response});
      } else {
        callback && callback({code: '0002', data: response});
      }
    }.bind(this),
    error: function(error) {
      callback && callback({code: '0001', data: error});
    },
  });
}