
  /* var BlockSDK = require('blocksdk'); */
  if (window.self === window.top) {
    document.body.innerText = 'This application is for use in the Salesforce Marketing Cloud Content Builder Editor only.';
  } else {
    var sdk = window.sfdc.BlockSDK(); /* new BlockSDK(); */

    var params = {}; // parameter metadata
    var html = '' // html code

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

    function updateContent() {
      var regex;
      var fakehtml = html;
      var ampscript = "\r\n%%[";
      for (const param in params) {
        ampscript += '\r\n     SET @' + param + ' = "' + params[param] + '"';
        regex = new RegExp(escapeRegExp("%%=v(@"+param+")=%%"), "gi");
        fakehtml = fakehtml.replace(regex, params[param]);
      }
      ampscript += "\r\n]%%";

      sdk.setData({'params': params, 'html': html});
      sdk.setSuperContent(fakehtml);
      sdk.setContent(ampscript+"\r\n"+html);
    }

    function addWidget(name, value) {
      var widget = '\n<div class="slds-form-element">\n<label class="slds-form-element__label" for="input-id-'+name+'">'+name+'</label>\n<div class="slds-form-element__control">\n<input class="slds-input" type="text" id="input-id-'+name+'" placeholder="Value" />\n</div>\n</div>'
      $('#workspace-container').append(widget);
      $('#input-id-'+name).data({'id': name}).val(value).change(function() {
        // alert($(this).data('id') + ' ' + $(this).val());
        var name = $(this).data('id');
        var value = $(this).val();
        params[name] = value;
        updateContent();
      });
    }

    sdk.getData(function (data) {
      params = data['params'];
      if (typeof params == 'undefined') params = {};
      html = data['html'];
      if (typeof html == 'undefined') html = "";
      // alert(getParams());

      // add the widgets to the page
      $('#workspace-container').html('');
      for (const param in params) {
        addWidget(param, params[param])
      }

      // add the html to the editor
      $('#editor').html(html);

      updateContent();

      // add a new widget
      $('#add-parameter-button').click(function() {
        var widgetName = $('#add-parameter-name').val();
        if (widgetName) {
          addWidget(widgetName, '');
          $('#add-parameter-name').val('')
        }
      });

      // update the editor
      $("#editor").keyup(function() { // change()
        html = $(this).val();
        updateContent();
      });
    });

  }
