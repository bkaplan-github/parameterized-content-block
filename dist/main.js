
// var BlockSDK = require('blocksdk');
// var sdk = new BlockSDK();
var sdk = new window.sfdc.BlockSDK();

var params = {}; // parameter metadata
var ampscript = ''; // ampscript variables
var html = '' // html code without ampscript
var preview_html = '' // preview html code

/*
function debounce (func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}
*/

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function htmlEscape(str) {
  return str
    .replace(/&/g, '&amp;amp;')
    .replace(/"/g, '&amp;quot;')
    // .replace(/'/g, '&#39;')
    // .replace(/\//g, '&#x2F;'); // forward slash
    .replace(/</g, '&amp;lt;')
    .replace(/>/g, '&amp;gt;');
}

function htmlUnescape(str){
  return str
    .replace(/&amp;quot;/g, '"')
    // .replace(/&#39;/g, "'")
    // .replace(/&#x2F;/g, '/'); // forward slash
    .replace(/&amp;lt;/g, '<')
    .replace(/&amp;gt;/g, '>')
    .replace(/&amp;amp;/g, '&');
}

function updateContent() {
  var regex;
  var fakehtml;

  if (preview_html == "") fakehtml = html;
  else fakehtml = preview_html;

  ampscript = "%%[ /* PARAMETERS START */";
  for (const param in params) {
    var name = params[param]['name'];
    var value = htmlEscape(params[param]['value']);
    var options = params[param]['options'];
    ampscript += '\r\nSET @' + name + ' = TreatAsContent("' + value + '") /* ' + options + ' */';
    regex = new RegExp(escapeRegExp("%%=v(@"+name+")=%%"), "gi");
    fakehtml = fakehtml.replace(regex, value);
  }
  ampscript += "\r\n/* PARAMETERS END */ ]%%\r\n";

  $("#editor").val(ampscript+"\r\n"+html);

  sdk.setData({'params': params, 'ampscript': ampscript, 'html': html, 'preview_html': preview_html});
  sdk.setSuperContent(fakehtml);
  sdk.setContent(ampscript+"\r\n"+html);
}

function addWidget(id, name, value, type, options) {
  var regex = new RegExp(escapeRegExp("_"), "gi");
  var title = name.replace(regex, " ");

  var widget = "";

  switch(type) {
    case 'selection':
      widget = '\r\n<div id="widget-' + id + '" class="slds-form-element">\r\n<label class="slds-form-element__label" for="selection-id-' + id + '">' + title + '</label>\r\n<div class="slds-form-element__control">\r\n<div class="slds-select_container">\r\n<select class="slds-select" id="input-id' + id + '">';
      for (var i = 0; i < options.length; i++) {
        var opt = options['list'][i];
        var oValue;
        var oText;
        if (typeof opt == 'object') {
          oValue = opt['value'];
          oText = opt['text'];
        } else {
          oValue = opt;
          oText = opt;
        }
        widget += '\r\n<option' + (value == oValue ? ' selected="selected"' : '') + ' value="' + oValue + '">' + oText + '</option>';
      }
      widget += '\r\n</select>\r\n</div>\r\n</div>\r\n</div>';
      break;

    default: // input
      widget = '\r\n<div id="widget-' + id + '" class="slds-form-element" style="margin-bottom:10px;">\r\n<label class="slds-form-element__label" for="input-id-' + id + '">' + title + '</label>\r\n<div class="slds-form-element__control slds-input-has-fixed-addon">\r\n<input class="slds-input" type="text" id="input-id-' + id + '" placeholder="" />\r\n</div>\r\n</div>';
      break;
  }

  $('#workspace-container').append(widget);

  $('#input-id-'+id).data({'id': id}).val(value).change(function() {
    var id = $(this).data('id');
    var value = $(this).val();
    params[id]['value'] = value;
    updateContent();
  });
}

sdk.getData(function (data) {
  // get state data
  params = data['params'];
  ampscript = data['ampscript'];
  html = data['html'];
  preview_html = data['preview_html'];

  // default state data
  if (typeof params == 'undefined') params = {};
  if (typeof ampscript == 'undefined') ampscript = "";
  if (typeof html == 'undefined') html = "";
  if (typeof preview_html == 'undefined') preview_html = "";

  // add the widgets to the page
  $('#workspace-container').html('');
  for (const param in params) {
    addWidget(params[param]['id'], params[param]['name'], params[param]['value'], params[param]['type'], JSON.parse(params[param]['options']));
  }

  // add the html and ampscript to the editor
  $("#editor").val(ampscript+"\r\n"+html);

  // add the html to the preview
  $('#preview').val(preview_html);

  // update the editor
  $("#editor").change(function() { // keyup()
    var data = $(this).val();

    // parse out the parameters
    var paramTextStart = data.indexOf("%%[ /* PARAMETERS START */");
    if (paramTextStart < 0) {
      html = data;
    }
    else {
      var paramTextEnd = data.indexOf("/* PARAMETERS END */ ]%%");
      var amp = data.substring(paramTextStart, paramTextEnd);
      var ampArray = amp.split("SET @");
      params = {};
      $('#workspace-container').html('');
      for (var i = 1; i < ampArray.length; i++) {
        var a = ampArray[i];

        // parse name
        var name = a.substring(0, a.indexOf(" "));

        // parse id
        var id = name.toLowerCase();

        // parse value
        var vStart = a.substring(a.indexOf('"') + 1);
        var vEnd = vStart.indexOf('"');
        var value = htmlUnescape(vStart.substring(0, vEnd));

        // parse type and options
        var paramType = 'input';
        var comment = "";
        var options = {};
        var extra = vStart.substring(vEnd);
        var cStart = extra.indexOf("/* {");
        if (cStart >= 0) {
          var cEnd = extra.indexOf("*/");
          var comment = extra.substring(cStart + 3, cEnd).trim();
          var options = JSON.parse(comment);
          var pType = options['type'];
          if (typeof pType != 'undefined') paramType = pType.toLowerCase();
        }
console.log(paramType);

        params[id] = {'id': id, 'name': name, 'value': value, 'type': paramType, 'options': comment};
        addWidget(id, name, value, paramType, options);
      }

      html = data.substring(paramTextEnd + 26);
    }

    updateContent();
  });

  // update the preview
  $("#preview").change(function() { // keyup()
    preview_html = $(this).val();
    updateContent();
  });
});
