
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
    ampscript = "%%[";
    if (!$.isEmptyObject(global_options)) ampscript += '\r\n    /* ' + JSON.stringify(global_options) + ' */';
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
      if (tac) ampscript += '\r\n    SET @' + name + ' = TreatAsContent("' + ampEscape(value) + '")';
      else ampscript += '\r\n    SET @' + name + ' = "' + ampEscape(value) + '"';

      if (!$.isEmptyObject(options)) ampscript += ' /* ' + JSON.stringify(options) + ' */';

      // replace the ampscript variables with their html equivalent
      regex = new RegExp(escapeRegExp("%%=v(@"+name+")=%%"), "gi");
      fakehtml = fakehtml.replace(regex, value);
    }
    ampscript += "\r\n]%%";
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

    case 'color':

      widget = '\r\n<div id="widget-' + id + '" class="slds-color-picker">\r\n<div class="slds-form-element slds-color-picker__summary">\r\n<label class="slds-form-element__label slds-color-picker__summary-label" for="color-input-' + id + '">Choose Color</label>\r\n<div class="slds-form-element__control">\r\n<button id="color-button-id-' + id + '" class="slds-button slds-color-picker__summary-button slds-button_icon slds-button_icon-more" title="Choose Color">\r\n<span id="color-button-swatch-id-' + id + '" class="slds-swatch" style="background:hsl(220, 46%, 55%)">\r\n<span class="slds-assistive-text">hsl(220, 46%, 55%)</span>\r\n</span>\r\n<svg class="slds-button__icon slds-button__icon_small slds-m-left_xx-small" aria-hidden="true">\r\n<use xlink:href="/assets/icons/utility-sprite/svg/symbols.svg#down"></use>\r\n</svg>\r\n<span class="slds-assistive-text">Choose a color. Current color: #5679C0</span>\r\n</button>\r\n<div class="slds-color-picker__summary-input">\r\n<input type="text" id="color-input-' + id + '" class="slds-input" value="#5679C0" />\r\n</div>\r\n</div>\r\n</div>\r\n<section id="color-selector-id-' + id + '" aria-describedby="dialog-body-id-31" aria-label="Choose a color" class="slds-popover slds-color-picker__selector slds-hide" role="dialog">\r\n<div class="slds-popover__body" id="dialog-body-id-31">\r\n<div class="slds-tabs_default">\r\n<ul class="slds-tabs_default__nav" role="tablist">\r\n<li class="slds-tabs_default__item slds-is-active" title="Default" role="presentation">\r\n<a class="slds-tabs_default__link" href="javascript:void(0);" role="tab" tabindex="0" aria-selected="true" aria-controls="color-picker-default" id="color-picker-default__item">Default</a>\r\n</li>\r\n<li class="slds-tabs_default__item" title="Custom" role="presentation">\r\n<a class="slds-tabs_default__link" href="javascript:void(0);" role="tab" tabindex="-1" aria-selected="false" aria-controls="color-picker-custom" id="color-picker-custom__item">Custom</a>\r\n</li>\r\n</ul>\r\n<div id="color-picker-default" class="slds-tabs_default__content slds-show" role="tabpanel" aria-labelledby="color-picker-default__item">\r\n<ul class="slds-color-picker__swatches" role="listbox">\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="0">\r\n<span class="slds-swatch" style="background:#e3abec">\r\n<span class="slds-assistive-text">#e3abec</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#c2dbf7">\r\n<span class="slds-assistive-text">#c2dbf7</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#9fd6ff">\r\n<span class="slds-assistive-text">#9fd6ff</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#9de7da">\r\n<span class="slds-assistive-text">#9de7da</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#9df0c0">\r\n<span class="slds-assistive-text">#9df0c0</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#fff099">\r\n<span class="slds-assistive-text">#fff099</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#fed49a">\r\n<span class="slds-assistive-text">#fed49a</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#d073e0">\r\n<span class="slds-assistive-text">#d073e0</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#86baf3">\r\n<span class="slds-assistive-text">#86baf3</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#5ebbff">\r\n<span class="slds-assistive-text">#5ebbff</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#44d8be">\r\n<span class="slds-assistive-text">#44d8be</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#3be282">\r\n<span class="slds-assistive-text">#3be282</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#ffe654">\r\n<span class="slds-assistive-text">#ffe654</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#ffb758">\r\n<span class="slds-assistive-text">#ffb758</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#bd35bd">\r\n<span class="slds-assistive-text">#bd35bd</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#5779c1">\r\n<span class="slds-assistive-text">#5779c1</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#5ebbff">\r\n<span class="slds-assistive-text">#5ebbff</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#00aea9">\r\n<span class="slds-assistive-text">#00aea9</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#3cba4c">\r\n<span class="slds-assistive-text">#3cba4c</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#f5bc25">\r\n<span class="slds-assistive-text">#f5bc25</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#f99221">\r\n<span class="slds-assistive-text">#f99221</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#580d8c">\r\n<span class="slds-assistive-text">#580d8c</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#001970">\r\n<span class="slds-assistive-text">#001970</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#0a2399">\r\n<span class="slds-assistive-text">#0a2399</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#0b7477">\r\n<span class="slds-assistive-text">#0b7477</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#0b6b50">\r\n<span class="slds-assistive-text">#0b6b50</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#b67e11">\r\n<span class="slds-assistive-text">#b67e11</span>\r\n</span>\r\n</a>\r\n</li>\r\n<li class="slds-color-picker__swatch" role="presentation">\r\n<a class="slds-color-picker__swatch-trigger" href="#" role="option" tabindex="-1">\r\n<span class="slds-swatch" style="background:#b85d0d">\r\n<span class="slds-assistive-text">#b85d0d</span>\r\n</span>\r\n</a>\r\n</li>\r\n</ul>\r\n</div>\r\n<div id="color-picker-custom" class="slds-tabs_default__content slds-hide" role="tabpanel" aria-labelledby="color-picker-custom__item">\r\n<div class="slds-color-picker__custom">\r\n<p id="color-picker-instructions" class="slds-assistive-text">Use arrow keys to select a saturation and brightness, on an x and y axis.</p>\r\n<div class="slds-color-picker__custom-range" style="background:hsl(220, 100%, 50%)">\r\n<a class="slds-color-picker__range-indicator" style="bottom:45%;left:46%" href="#" aria-live="assertive" aria-atomic="true" aria-describedby="color-picker-instructions">\r\n<span class="slds-assistive-text">Saturation: 46%. Brightness: 45%.</span>\r\n</a>\r\n</div>\r\n<div class="slds-color-picker__hue-and-preview">\r\n<label class="slds-assistive-text" for="color-picker-input-range-25">Select Hue</label>\r\n<input type="range" class="slds-color-picker__hue-slider" min="0" max="360" id="color-picker-input-range-25" value="208" />\r\n<span class="slds-swatch" style="background:#5679C0">\r\n<span class="slds-assistive-text" aria-hidden="true">#5679C0</span>\r\n</span>\r\n</div>\r\n<div class="slds-color-picker__custom-inputs">\r\n<div class="slds-form-element slds-color-picker__input-custom-hex">\r\n<label class="slds-form-element__label" for="color-picker-input-hex-25">Hex</label>\r\n<div class="slds-form-element__control">\r\n<input type="text" id="color-picker-input-hex-25" class="slds-input" value="#5679C0" />\r\n</div>\r\n</div>\r\n<div class="slds-form-element">\r\n<label class="slds-form-element__label" for="color-picker-input-r-25">\r\n<abbr title="Red">R</abbr>\r\n</label>\r\n<div class="slds-form-element__control">\r\n<input type="text" id="color-picker-input-r-25" class="slds-input" value="86" />\r\n</div>\r\n</div>\r\n<div class="slds-form-element">\r\n<label class="slds-form-element__label" for="color-picker-input-g-25">\r\n<abbr title="Green">G</abbr>\r\n</label>\r\n<div class="slds-form-element__control">\r\n<input type="text" id="color-picker-input-g-25" class="slds-input" value="121" />\r\n</div>\r\n</div>\r\n<div class="slds-form-element">\r\n<label class="slds-form-element__label" for="color-picker-input-b-25">\r\n<abbr title="blue">B</abbr>\r\n</label>\r\n<div class="slds-form-element__control">\r\n<input type="text" id="color-picker-input-b-25" class="slds-input" value="192" />\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n<footer class="slds-popover__footer">\r\n<div class="slds-color-picker__selector-footer">\r\n<button class="slds-button slds-button_neutral">Cancel</button>\r\n<button class="slds-button slds-button_brand">Done</button>\r\n</div>\r\n</footer>\r\n</section>\r\n</div>';

      widget.data({working-color: value});

      $('#workspace-container').append(widget);

      $('#color-button-id-'+id).data({'id': id, 'toggle': false}).prop('disabled',locked).click(function() {
        var id = $(this).data('id');
        var toggle = $(this).data('toggle');
        if (toggle) {
          $(this).data('toggle', false);
          $('#color-selector-id-'+id).hide();
        } else {
          $(this).data('toggle', true);
          $('#color-selector-id-'+id).show();
        }
      });

      $('#color-input-'+id).data({'id': id}).val(value).prop('disabled',locked).change(function() {
        var id = $(this).data('id');
        var value = $(this).val();
        params[id]['value'] = value;
        $('#color-button-swatch-id-'+id).css('background-color', value);
        updateContent();
      });

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
    var paramTextStart = data.indexOf("%%[");
    if (paramTextStart < 0) {
      html = data;
    }
    else {
      var paramTextEnd = data.indexOf("]%%");
      var amp = data.substring(paramTextStart + 3, paramTextEnd);
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

      html = data.substring(paramTextEnd + 3);
    }

    updateContent();
  });

  // update the preview
  $("#preview").change(function() { // keyup()
    preview_html = $(this).val();
    updateContent();
  });
});
