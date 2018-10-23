
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

    function updateContent() {
      var regex;
      var fakehtml;

      if (preview_html == "") fakehtml = html;
      else fakehtml = preview_html;

      ampscript = "%%[ /* PARAMETERS START */";
      for (const param in params) {
        var name = params[param]['name'];
        var value = params[param]['value'];
console.log("update: "+name+"="+value);
        ampscript += '\r\nSET @' + name + ' = "' + value + '"';
        regex = new RegExp(escapeRegExp("%%=v(@"+name+")=%%"), "gi");
        fakehtml = fakehtml.replace(regex, value);
      }
      ampscript += "\r\n/* PARAMETERS END */ ]%%\r\n";

      $("#editor").val(ampscript+"\r\n"+html);

      sdk.setData({'params': params, 'ampscript': ampscript, 'html': html, 'preview_html': preview_html});
      sdk.setSuperContent(fakehtml);
      sdk.setContent(ampscript+"\r\n"+html);
    }

    function addWidget(name, value) {
      var widget = '\n<div id="widget-' + name + '" class="slds-form-element" style="margin-bottom:10px;">\n<label class="slds-form-element__label" for="input-id-' + name + '">' + name + '</label>\n<div class="slds-form-element__control slds-input-has-fixed-addon">\n<input class="slds-input" type="text" id="input-id-' + name + '" placeholder="Value" />\n<button id="delete-parameter-button-' + name + '" class="slds-button slds-button_icon slds-button_icon-border-filled" title="Delete Parameter"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="delete" width="100%" height="100%"><path d="M21 4.6h-5.8V2.8c0-1-.8-1.9-1.8-1.9h-2.8c-1 0-1.8.9-1.8 1.9v1.8H3c-.4 0-.7.3-.7.7v1.4c0 .4.3.7.7.7h18c.4 0 .7-.3.7-.7V5.3c0-.4-.3-.7-.7-.7zM10.6 3.2c0-.2.2-.4.5-.4h1.8c.3 0 .5.2.5.4v1.4h-2.8V3.2zm8.6 6H4.8c-.3 0-.6.4-.6.7v10.9c0 1.3 1 2.3 2.3 2.3h11c1.3 0 2.3-1 2.3-2.3V9.9c0-.3-.3-.7-.6-.7zm-8.6 10.2c0 .3-.2.4-.4.4h-1c-.2 0-.4-.1-.4-.4v-6.5c0-.3.2-.4.4-.4h1c.2 0 .4.1.4.4v6.5zm4.6 0c0 .3-.2.4-.4.4h-1c-.2 0-.4-.1-.4-.4v-6.5c0-.3.2-.4.4-.4h1c.2 0 .4.1.4.4v6.5z"></path></svg><span class="slds-assistive-text">Delete Parameter</span></button>\n</div>\n</div>';
      $('#workspace-container').append(widget);

      $('#input-id-'+name).data({'id': name}).val(value).change(function() {
        var n = $(this).data('id');
        var v = $(this).val();
console.log("value changed: "+n+"="+v);
        params[n]['value'] = v;
        updateContent();
      });

      $('#delete-parameter-button-'+name).data({'id': name}).click(function() {
        var n = $(this).data('id');
        $("#widget-"+n).remove();
        delete params[n];
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
console.log("init: "+params[param]['name']+"="+params[param]['value']);
        addWidget(params[param]['name'], params[param]['value'])
      }

      // add the html and ampscript to the editor
      $("#editor").val(ampscript+"\r\n"+html);

      // add the html to the preview
      $('#preview').html(preview_html);

      // updateContent();

      // add a new widget
      $('#add-parameter-button').click(function() {
        var name = $('#add-parameter-name').val();
        if (name) {
          params[name] = {'name': name, 'value': ""};
          addWidget(name, '');
          updateContent();
          $('#add-parameter-name').val('');
        }
      });

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
            var vStart = a.substring(a.indexOf('= "') + 3);
            var value = vStart.substring(0, vStart.indexOf('"'));
            params[name] = {'name': name, 'value': value};
            addWidget(name, value);
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

