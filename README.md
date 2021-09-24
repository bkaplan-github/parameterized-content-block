# parameterized content block
What is Parameterized Content Block?  Think of it as a "meta" custom content block that once installed allows you to create all kinds of new custom content blocks with only HTML and AMPscript.  No knowledge of the Block SDK, Javascript, Github, or Heroku are needed to create new custom content blocks!

Examples of custom content blocks you can create using Parameterized Content Block include mobile swappable image, text on background image, embedded video, Google maps, Gmail promo tab annotations, and more! Once created, your content block can be edited interactively without any coding using text inputs, selection menus, sliders, and color pickers.

Parameterized Content Block is also useful when you want to restrict how the end-user can modify a content block since inputs can be disabled or hidden.  It can also be used to display placeholder HTML code in the editor if you have a content block with a lot of AMPscipt or dynamic content that otherwise wouldn't render properly in the editor.

Parameterized Content Block is a custom Salesforce Marketing Cloud Content Builder block built using the [blocksdk](https://github.com/salesforce-marketingcloud/blocksdk).

Github repository:  https://github.com/bkaplan-github/parameterized-content-block

Heroku app: https://parameterized-content-block.herokuapp.com/

[![Parameterized Content Block](https://github.com/bkaplan-github/parameterized-content-block/blob/master/images/ParameterizedCB.jpg)](https://github.com/bkaplan-github/parameterized-content-block) 

## Examples
Examples are included in the "examples" folder for:

* a mobile-swappable image
* text on a background image
* table-based bulleted list
* embedding a video in an email
* adding a Google map to an email
* bulletproof button
* add Gmail promo tab annotations to email
* spacer

Many different types of custom content can be implemented using Parameterized Content Block without having to know how to use the Block SDK, Javascript, Github, or Heroku.

## How to Use
Parameterized Content Block allows you to create your own custom content blocks with only HTML and simple AMPscript.  Once created, no AMPscript or HTML knowledge is needed to edit your custom content block.

Parameterized Content Block automatically adds a user interface to nearly any parameterized HTML email code by automatically generating inputs for each parameter. Parameterized HTML is HTML that contains AMPscript variables of the form "%%=v(@Variable)=%%" and has a block of AMPscript "SET" statements at the top to define those variables.

Create your parameterized HTML and add your block of SET statements with default values to the top like this:

    %%[
        SET @Body_Text = "Hello World!"
        SET @Text_Align = "center"
        SET @Text_Size = "16"
        SET @Text_Color = "#ff0000"
    ]%%

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="%%=v(@Text_Align)=%%" valign="top" style="font-family: Helvetica, Arial, sans-serif; 
            font-weight: normal; font-size: %%=v(@Text_Size)=%%px; line-height: 20px; color: %%=v(@Text_Color)=%%; 
            mso-line-height-rule: exactly;">%%=v(@Body_Text)=%%</td>
        </tr>
    </table>

The above is an example and isn't particularly useful since a simple text block can be edited using the freeform editor.  The Parameterized Content Block is useful for content blocks that typically cannot be edited in the freeform editor (code that would otherwise require a custom content block), where you want to restrict how the end-user can modify the content block, or where you would want to render alternate placeholder HTML content in the interactive editor.

Note that the AMPscript block containing the "SET" statements must be at the top. If your code requires additional AMPscript, you may add additonal AMPscript blocks below.

The value for "SET" statements must contains strings within double quotes (&quot;) characters.  Double quotes within that value string can be specified with two double quote characters (&quot;&quot;).  For example, the following will add double quotes around the word "text":

    SET @Body_Text = "Here is some ""text"""

This is especially important if your code contains HTML which requires double quotes (although most of the time you can use single quotes instead).  For example, to make the word "some" blue, you could do one of the following:

    SET @Body_Text = "Here is <span style=""color:#0000ff;"">some</span> text"
    SET @Body_Text = "Here is <span style='color:#0000ff;'>some</span> text"

TreatAsContent() may be added around parameter values so that parameters may contain dynamic AMPscript code, for example:

    SET @Body_Text = TreatAsContent("Hello %%FirstName%%!")

Paste your parameterized code into the "Code" input. The parameter inputs will automatically be created so that a user can enter or edit the values in the inputs (in the above example, for body text, text color, and text size) without knowing HTML or AMPscript.  The input labels are built from the variable names, replacing underscores with spaces.

The code will be rendered in the editor with the variables replaced with parameter values. You can add alternate HTML code to the "Preview" input that will be rendered only in the editor (useful if your code won't render properly in the editor due to more complex AMPscript in the code).

## Restricting Parameters
Parameterized Content Block can be used to create content blocks that "lock down" certain parameters so that they cannot be edited by the user.  To do this, you could simply add a hardcoded value to the HTML instead of making it a parameter so that no input will be created.  You can also use the "locked" option for any parameter (see below).  The "hide_locked" global option will control whether locked parameters will be displayed in the interface or not (if not hidden, locked parameters will be greyed out and will not be editable).

## Global Options
Global options like setting the content block's title or rollover description are achieved by adding data within a comment before the AMPscript "SET" statements.  For example:

    %%[
        /* {"title":"Text Input Example","description":"this an example content block","hide_locked":true} */
        SET @Body_Text = "Here is some text"
        SET @Text_Align = "center"
        SET @Text_Size = "16"
        SET @Text_Color = "#ff0000"
    ]%%

The "title" value will allow overriding the default content block title that appears at the top.  The "description" value will override the content block description that appears when the mouse hovers over the title or icon.  The "hide_locked" value, if true, will hide locked parameters in the interface.

## Advanced Input Options
Advanced options for inputs like rollover descriptions and different input types are achieved by adding data within comments after the AMPscript "SET" statements.

### Example

    %%[
        SET @Body_Text = "Here is some text" /* {"label":"Enter Text Here","encoding":"html","description":"type your body text here"} */
        SET @Text_Align = "center" /* {"locked":true,"type":"selection","choices":["left","center","right"],"description":"select a text alignment"} */
        SET @Text_Size = "16" /* {"type":"slider","min":1,"max":50,"description":"text size"} */
        SET @Text_Color = "#ff0000" /* {"type":"color","description":"select a text color"} */
    ]%%

### Text Input
[![Text Input](https://github.com/bkaplan-github/parameterized-content-block/blob/master/images/Input_Text.jpg)](https://github.com/bkaplan-github/parameterized-content-block)

A text input is the default type so no "type" option is required (it defaults to "text"). The "locked" option is used to keep the user from modifying this parameter (if set to true).  The "label" option can be used to override the label that appears above the input.  The "encoding" option can be set to specify additional encoding should be done to the text (see below).  A rollover description can be added to a text input by adding the "description" option. See the "Body_Text" parameter in the above example.

**No encoding:** Setting the "encoding" option to "none" (the default) does not do any additional processing on the text when it gets inserted into the code.  If the text is going to be inserted into HTML (as it usually is) the input must contain valid HTML, with HTML-reserved characters "&lt;", "&gt;", "&amp;" and double-quotes explicitly encoded with eqivalent HTML entities "&amp;lt;", "&amp;gt;", "&amp;amp;" and "&amp;quot;" (unless used for HTML tags).

**HTML encoding:**  An "encoding" value of "html" will cause the characters "&lt;", "&gt;", "&amp;" and double-quotes to be automatically encoded with eqivalent HTML entities "&amp;lt;", "&amp;gt;", "&amp;amp;" and "&amp;quot;", but no HTML formatting of the text can be used.  AMPscript between "%%=" and "=%%" will not be encoded.

**URL encoding:**  An "encoding" value of "url" will URL-encode the value typed into the text input.  URL-encoded entities (such as "%20") should not be entered (or they will themselves be encoded).  Special characters "/", "?", ":", ",", "@", "&", "=", "+", "$", and "#" will not be encoded.  AMPscript between "%%=" and "=%%" will not be encoded.

### Selection Input
[![Selection Input](https://github.com/bkaplan-github/parameterized-content-block/blob/master/images/Input_Selection.jpg)](https://github.com/bkaplan-github/parameterized-content-block)

A selection input is specified by adding the "type" option with a value of "selection". The "locked" option is used to keep the user from modifying this parameter (if set to true). The "label" option can be used to override the label that appears above the input.  The choices for the selection list are specified using the required "choices" data. A rollover description can be added to a selection input by adding the "description" option. See the "Text_Align" parameter in the above example.

The choices of a selection parameter can define a value that is different than the choice text displayed in the list using the following syntax:

    SET @Text_Align = "center" /* {"type":"selection","choices":[{"value":"left","text":"Left Justified"},{"value":"center","text":"Centered"},{"value":"right","text":"Right Justified"}],"description":"select a text color"]} */ 

### Slider Input
[![Slider Input](https://github.com/bkaplan-github/parameterized-content-block/blob/master/images/Input_Slider.jpg)](https://github.com/bkaplan-github/parameterized-content-block)

A slider input is specified by adding the "type" option with a value of "slider". The "locked" option is used to keep the user from modifying this parameter (if set to true). The "label" option can be used to override the label that appears above the input.  The minimum and maximum slider values are specified using the required "min" and "max" data. A rollover description can be added to a selection input by adding the "description" option. See the "Text_Size" parameter in the above example.

### Color Input
[![Color Input](https://github.com/bkaplan-github/parameterized-content-block/blob/master/images/Input_Color.jpg)](https://github.com/bkaplan-github/parameterized-content-block)

A color input is specified by adding the "type" option with a value of "color". The "locked" option is used to keep the user from modifying this parameter (if set to true). The "label" option can be used to override the label that appears above the input.  A rollover description can be added to a selection input by adding the "description" option. Colors should be speficied in hex "#rrggbb" format.  See the "Text_Color" parameter in the above example.

## Versions
* 1.5 - removed the restriction on how the SET statement block is formatted.  Added a color picker.  Changed the source code folder structure to make it easier to update the lightning package in the future.
* 1.0 - first release.

## Future Enhancements
* Add support for other types of inputs (checkboxes, radio buttons, etc).
* Allow parsing of single quotes in the "SET" statements.
* Allow parsing of "IIF" statements in the preview.
* Allow editing the block in the "HTML" tab.
* Add an interface for interactively building the parameters.
* Add new examples (graphs, captcha for landing pages, etc)
