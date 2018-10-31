
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

/*
function getParams() {
  var output = "";
  for (const param in params) {
    output += param+"="+params[param]+", ";
  }
  return output;
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

// I needed the opposite function today, so adding here too:
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
    ampscript += '\r\nSET @' + name + ' = TreatAsContent("' + value + '")';
    regex = new RegExp(escapeRegExp("%%=v(@"+name+")=%%"), "gi");
    fakehtml = fakehtml.replace(regex, value);
  }
  ampscript += "\r\n/* PARAMETERS END */ ]%%\r\n";

  $("#editor").val(ampscript+"\r\n"+html);

  sdk.setData({'params': params, 'ampscript': ampscript, 'html': html, 'preview_html': preview_html});
  sdk.setSuperContent(fakehtml);
  sdk.setContent(ampscript+"\r\n"+html);
}

function addWidget(id, name, value) {
  var regex = new RegExp(escapeRegExp("_"), "gi");
  var title = name.replace(regex, " ");

  var widget = '\n<div id="widget-' + id + '" class="slds-form-element" style="margin-bottom:10px;">\n<label class="slds-form-element__label" for="input-id-' + id + '">' + title + '</label>\n<div class="slds-form-element__control slds-input-has-fixed-addon">\n<input class="slds-input" type="text" id="input-id-' + id + '" placeholder="Empty Value" />\n</div>\n</div>';
  $('#workspace-container').append(widget);

  $('#input-id-'+id).data({'id': id}).val(value).change(function() {
    var id = $(this).data('id');
    var value = $(this).val();
    params[id]['value'] = value;
    updateContent();
  });
}

sdk.getData(function (data) {
  params = data['params'];
  if (typeof params == 'undefined') params = {};
  ampscript = data['ampscript'];
  if (typeof ampscript == 'undefined') ampscript = "";
  html = data['html'];
  if (typeof html == 'undefined') html = "";
  preview_html = data['preview_html'];
  if (typeof preview_html == 'undefined') preview_html = "";
  // alert(getParams());

  // add the widgets to the page
  $('#workspace-container').html('');
  for (const param in params) {
    addWidget(params[param]['id'], params[param]['name'], params[param]['value']);
  }

  // add the html and ampscript to the editor
  $("#editor").val(ampscript+"\r\n"+html);

  // add the html to the preview
  $('#preview').html(preview_html);

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

        var nameEnd = a.indexOf(" ");
        var name = a.substring(0, nameEnd);

        var id = name.toLowerCase();

        var vStart = a.substring(a.indexOf('"') + 1);
        var value = htmlUnescape(vStart.substring(0, vStart.indexOf('"')));

        params[id] = {'id': id, 'name': name, 'value': value};
        addWidget(id, name, value);
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
