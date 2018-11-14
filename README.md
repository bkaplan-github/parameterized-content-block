# parameterized content block
Parameterized Content Block is a custom Salesforce Marketing Cloud Content Builder block using the [blocksdk](https://github.com/salesforce-marketingcloud/blocksdk).

Parameterized Content Block adds an interface to parameterized HTML code without having to know or use the Block SDK, Javascript, Github, or Heroku.  It allows you to paste in parameterized HTML and automatically generates inputs for each parameter. Parameterized HTML is HTML that contains AMPscript variables of the form "%%=v(@Variable)=%%" and has a block of AMPscript "SET" statements at the top to define those variables.

Github repository:  https://github.com/bkaplan-github/parameterized-content-block

Heroku app: https://parameterized-content-block.herokuapp.com/


[![Parameterized Content Block](https://github.com/bkaplan-github/parameterized-content-block/blob/master/ParameterizedCB.jpg)](https://github.com/bkaplan-github/parameterized-content-block)

## How to Use
Parameterized Content Block is useful for easily adding an interface to nearly any parameterized code without having to create your own custom content block. No knowledge of the Block SDK, Javascript, Github, or Heroku are required.  Once the interface has been created, no AMPscript or HTML knowledge is needed to edit the parameters.

Create your parameterized HTML and add your block of SET statements with default values to the top like this:

    %%[ /* PARAMETERS START */
    SET @Body_Text = "Here is some text"
    SET @Text_Color = "#ff0000"
    /* PARAMETERS END */ ]%%

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="left" valign="top" style="font-family: Helvetica, Arial, sans-serif; 
            font-weight: normal; font-size: 16px; line-height: 20px; color: %%=v(@Text_Color)=%%; 
            mso-line-height-rule: exactly;">%%=v(@Body_Text)=%%</td>
        </tr>
    </table>

The above is only an example and isn't particularly useful since a simple text block can be edited using the freeform editor.  The Parameterized Content Block is intended for more complex code that cannot be edited in the freeform editor (code that typically would require a custom content block).

Note that the AMPscript block containing the SET statement must be at the top, and the lines above and below the SET statements must be in the exact format shown above in order for the SET statements to be properly parsed. You can add additional AMPscript blocks below.

Paste your code into the "Code" input. The parameter inputs will automatically be created so that a user can enter or edit the values in the inputs (in the above example, for body text and text color) without knowing AMPscript.

The code will be rendered in the editor with the variables replaced with parameter values. You can add alternate HTML code to the "Preview" input that will be rendered only in the editor (useful if your code won't render properly in the editor due to AMPscript in the code).

Examples are included in the "examples" folder for a mobile-swappable image, text on a background image, and embedding a video in an email (all things that cannot be done with standard freeform content blocks).  Many different types of custom content can be implemented using Parameterized Content Block without having to create a new custom content block and without having to know how to use the Block SDK, Javascript, Github, or Heroku.

## Advanced Features
Advanced features like rollover descriptions and different input types are achieved by adding data within comments after the AMPscript "SET" statements.  For example:

    %%[ /* PARAMETERS START */
    SET @Body_Text = "Here is some text" /* {"description":"type your body text here"} */
    SET @Text_Color = "#ff0000" /* {"type":"selection","options":["#ff0000","#00ff00","#0000ff"],"description":"select a text color"} */
    /* PARAMETERS END */ ]%%

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="left" valign="top" style="font-family: Helvetica, Arial, sans-serif; 
            font-weight: normal; font-size: 16px; line-height: 20px; color: %%=v(@Text_Color)=%%; 
            mso-line-height-rule: exactly;">%%=v(@Body_Text)=%%</td>
        </tr>
    </table>

### Text Input
Text input is the default input type so no "type" data is required.  A rollover description can be added to a text input by adding "description" data.  See the "Body_Text" parameter in the above example.

### Selection Input
A selection input is specified by adding "type" data with a value of "selection".  The options for the selection list are specified using the "options" data. A rollover description can be added to a selection input by adding "description" data. See the "Text_Color" parameter in the above example.

The options of a selection parameter can define a value that is different than the option text displayed in the list using the following syntax:

    SET @Text_Color = "#ff0000" /* {"type":"selection","options":[{"value":"#ff0000","text":"Red"},{"value":"#00ff00","text":"Green"},{"value":"#0000ff","text":"Blue"},"description":"select a text color"]} */ 

## Future Enhancements
Add support for other types of inputs (sliders, color pickers, etc).
