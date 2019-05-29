
// var BlockSDK = require('blocksdk');
// var sdk = new BlockSDK();
var sdk = new window.sfdc.BlockSDK();

var global_options = {}; // global options for the content block
var params = {}; // parameter metadata
var ampscript = ''; // ampscript variables
var html = '' // html code without ampscript variables
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

function htmlEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;')
    // .replace(/\//g, '&#x2F;'); // forward slash
    // .replace(/'/g, '&#39;') // single quote
    .replace(/"/g, '&quot;');
}

function htmlUnescape(str) {
  return str
    .replace(/&quot;/g, '"')
    // .replace(/&#39;/g, "'") // single quote
    // .replace(/&#x2F;/g, '/'); // forward slash
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function preserveAMP(str, func) {
  var out = "";
  var i = str.indexOf("%%=");
  while (i >= 0) {
    out += func(str.substring(0, i));
    var s = str.substring(i);
    var j = s.indexOf("=%%") + 3;
    out += s.substring(0, j);
    str = s.substring(j);
    i = str.indexOf("%%=");
  }
  out += func(str);
  return out;
}

function encodeHTML(str) {
  return preserveAMP(str, htmlEscape);
}

function decodeHTML(str) {
  return preserveAMP(str, htmlUnescape);
}

function encodeURL(str) {
  return preserveAMP(str, encodeURI);
}

function decodeURL(str) {
  return preserveAMP(str, decodeURI);
}

function ampEscape(str){
  return str
    .replace(/"/g, '""');
}

function ampUnescape(str){
  return str
    .replace(/""/g, '"');
}

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function updateContent() {
  var regex;
  var fakehtml;

  if (preview_html == "") fakehtml = html;
  else fakehtml = preview_html;

  ampscript = "";
  if (Object.keys(params).length) {
    ampscript = "%%[ /* PARAMETERS START */";
    if (!$.isEmptyObject(global_options)) ampscript += '\r\n/* ' + JSON.stringify(global_options) + ' */';
    for (const param in params) {
      var name = params[param]['name'];
      // var type = params[param]['type'];
      var value = params[param]['value'];
      var tac = params[param]['tac'];
      var options = params[param]['options'];

      // encode the value if needed
      var encoding = "none";
      var enc = options["encoding"];
      if (typeof enc != 'undefined') encoding = enc;
      if (encoding == "html") value = encodeHTML(value);
      else if (encoding == "url") value = encodeURL(value);

      // wrap in TreatAsContent()
      if (tac) ampscript += '\r\nSET @' + name + ' = TreatAsContent("' + ampEscape(value) + '")';
      else ampscript += '\r\nSET @' + name + ' = "' + ampEscape(value) + '"';

      if (!$.isEmptyObject(options)) ampscript += ' /* ' + JSON.stringify(options) + ' */';

      // replace the ampscript variables with their html equivalent
      regex = new RegExp(escapeRegExp("%%=v(@"+name+")=%%"), "gi");
      fakehtml = fakehtml.replace(regex, value);
    }
    ampscript += "\r\n/* PARAMETERS END */ ]%%";
  }

  if (ampscript == "" && html == "") $("#editor").val("");
  else $("#editor").val(ampscript+html);

  sdk.setData({'global_options': global_options, 'params': params, 'ampscript': ampscript, 'html': html, 'preview_html': preview_html});
  sdk.setSuperContent(fakehtml);
  sdk.setContent(ampscript+html);
}

function updateTitle() {
  var title = global_options['title'];
  var description = global_options['description'];

  if (typeof title != 'undefined') $('#title').html(title);
  if (typeof description != 'undefined') {
    $('#title').prop('title', description);
    $('#icon').prop('title', description);
  }
}

function addWidget(id, label, value, locked, type, tac, options) {
  if (locked && global_options['hide_locked']) return;

  var labelStyle = '';
  if (locked) {
    label += " [locked]";
    labelStyle = ' style="color: #cccccc;"';
  }

  // set the description
  var description = "";
  var desc = options["description"];
  if (typeof desc != 'undefined') description = desc;

  var widget = "";

  switch(type) {
    case 'selection':
      widget = '\r\n<div id="widget-' + id + '" class="slds-form-element" style="padding-bottom: 10px;" title="' + description + '">\r\n<label class="slds-form-element__label" for="selection-id-' + id + '"' + labelStyle + '>' + label + '</label>\r\n<div class="slds-form-element__control">\r\n<div class="slds-select_container">\r\n<select class="slds-select" id="input-id-' + id + '">';
      var olist = options['choices'];

      for (var i = 0; i < olist.length; i++) {
        var opt = olist[i];
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

      $('#workspace-container').append(widget);

      $('#input-id-'+id).data({'id': id}).val(value).prop('disabled',locked).change(function() {
        var id = $(this).data('id');
        var value = $(this).val();
        params[id]['value'] = value;
        updateContent();
      });

      break;

    case 'slider':
      var min = options["min"];
      var max = options["max"];

      widget = '\r\n<div id="widget-' + id + '" class="slds-form-element" title="' + description + '">\r\n<label class="slds-form-element__label" for="slider-id-' + id + '">\r\n<span class="slds-slider-label">\r\n<span class="slds-slider-label__label"' + labelStyle + '>' + label + '</span>\r\n</span>\r\n</label>\r\n<div class="slds-form-element__control">\r\n<div class="slds-slider">\r\n<input type="range" id="slider-id-' + id + '" class="slds-slider__range" value="' + value + '" min="' + min + '" max="' + max + '" />\r\n<span class="slds-slider__value" id="slider-num-id-' + id + '" aria-hidden="true">' + value + '</span>\r\n</div>\r\n</div>\r\n</div>';

      $('#workspace-container').append(widget);

      $('#slider-id-'+id).data({'id': id, 'prev_val': value}).val(value).prop('disabled',locked).mousemove(function() {
        var id = $(this).data('id');
        var value = $(this).val();
        var prev_value = $(this).data('prev_val');
        if (value != prev_value) {
          $(this).data('prev_val', value);
          $('#slider-num-id-'+id).html(value);
          params[id]['value'] = value;
          updateContent();
        }
      });

      break;

    default: // text
      widget = '\r\n<div id="widget-' + id + '" class="slds-form-element" style="margin-bottom:10px;" title="' + description + '">\r\n<label class="slds-form-element__label" for="input-id-' + id + '"' + labelStyle + '>' + label + '</label>\r\n<div class="slds-form-element__control slds-input-has-fixed-addon">\r\n<input class="slds-input" type="text" id="input-id-' + id + '" placeholder="" />\r\n</div>\r\n</div>';

      $('#workspace-container').append(widget);

      $('#input-id-'+id).data({'id': id}).val(value).prop('disabled',locked).change(function() {
        var id = $(this).data('id');
        var value = $(this).val();
        params[id]['value'] = value;
        updateContent();
      });

      break;
  }
}

sdk.getContent(function (data) {
  // console.log("getContent called");
});

sdk.getData(function (data) {
  // console.log("getData called");

  // get state data
  global_options = data['global_options'];
  params = data['params'];
  ampscript = data['ampscript'];
  html = data['html'];
  preview_html = data['preview_html'];

  // default state data
  if (typeof global_options == 'undefined') global_options = {};
  if (typeof params == 'undefined') params = {};
  if (typeof ampscript == 'undefined') ampscript = "";
  if (typeof html == 'undefined') html = "";
  if (typeof preview_html == 'undefined') preview_html = "";

  // update the title
  updateTitle();

  // add the widgets to the page
  $('#workspace-container').html('');
  for (const param in params) {
    addWidget(params[param]['id'], params[param]['label'], params[param]['value'], params[param]['locked'], params[param]['type'], params[param]['tac'], params[param]['options']);
  }

  // add the html and ampscript to the editor
  $("#editor").val(ampscript+html);

  // add the html to the preview
  $('#preview').val(preview_html);

  // update the editor
  $("#editor").change(function() {
    var data = $(this).val();

    params = {};
    $('#workspace-container').html('');

    // parse out the parameters
    var paramTextStart = data.indexOf("%%[ /* PARAMETERS START */");
    if (paramTextStart < 0) {
      html = data;
    }
    else {
      var paramTextEnd = data.indexOf("/* PARAMETERS END */ ]%%");
      var amp = data.substring(paramTextStart + 26, paramTextEnd);
      var ampArray = amp.split("SET @");

      // parse global options */
      global_options = {};
      var gParams = ampArray[0];
      var gStart = gParams.indexOf("/* {");
      if (gStart >= 0) {
        var gEnd = gParams.indexOf("*/");
        var gComment = gParams.substring(gStart + 3, gEnd).trim();
        global_options = JSON.parse(gComment);
      }
      updateTitle();

      // parse parameters
      for (var i = 1; i < ampArray.length; i++) {
        var a = ampArray[i];

        // parse variable name
        var name = a.substring(0, a.indexOf(" "));

        // create id
        var id = name.toLowerCase();

        // see if there's a TreatAsContent()
        var tac = a.substring(a.indexOf("=")+1).search(/\s+TreatAsContent/i) == 0;

        // parse value
        var vStart = a.substring(a.indexOf('"') + 1);
        // var vEnd = vStart.indexOf('"');
        // find the end of the string (find a " ignoring "")
        var ind = 0;
        var vEnd = vStart.indexOf('"', ind);
        while (vStart.substring(vEnd+1, vEnd+2) == '"') {
          vEnd = vStart.indexOf('"', vEnd+2);
        }
        var value = ampUnescape(vStart.substring(0, vEnd));

        // define label from name
        var regex = new RegExp(escapeRegExp("_"), "gi");
        label = name.replace(regex, " ");

        // parse type and options
        var locked = false;
        var paramType = 'text';
        var comment = "";
        var options = {};
        var extra = vStart.substring(vEnd);
        var cStart = extra.indexOf("/* {");
        if (cStart >= 0) {
          var cEnd = extra.indexOf("*/");
          var comment = extra.substring(cStart + 3, cEnd).trim();
          var options = JSON.parse(comment);
          var pLocked = options['locked'];
          if (typeof pLocked != 'undefined') locked = pLocked;
          var pType = options['type'];
          if (typeof pType != 'undefined') paramType = pType.toLowerCase();
          var pLabel = options['label'];
          if (typeof pLabel != 'undefined') label = pLabel;
          var pTac = options['tac'];
          if (typeof pTac != 'undefined') tac = pTac;
        }

        // unencode the value if needed
        var encoding = "none";
        var enc = options["encoding"];
        if (typeof enc != 'undefined') encoding = enc;
        if (encoding == "html") value = decodeHTML(value);
        else if (encoding == "url") value = decodeURL(value);

        // store off the params into the object and add the widget
        params[id] = {'id': id, 'name': name, 'label': label, 'value': value, 'type': paramType, 'locked': locked, 'tac': tac, 'options': options};
        addWidget(id, label, value, locked, paramType, tac, options);
      }

      html = data.substring(paramTextEnd + 24);
    }

    updateContent();
  });

  // update the preview
  $("#preview").change(function() { // keyup()
    preview_html = $(this).val();
    updateContent();
  });
});
