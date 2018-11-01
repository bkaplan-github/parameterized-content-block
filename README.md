# parameterized content block
Salesforce Marketing Cloud Content Builder Block using the [blocksdk](https://github.com/salesforce-marketingcloud/blocksdk).

adds an interface to parameterized HTML without having to know or use the Block SDK, Javascript, Github, or Heroku.

https://github.com/bkaplan-github/parameterized-content-block

The Parameterized Content Block allows you to paste in parameterized HTML and automatically generates inputs for each parameter. Parameterized HTML is HTML that contains AMPscript variables of the form "%%=v(@Variable)=%%" and has a block of AMPscript "SET" calls at the top to define those variables.

## How to Use
Create your parameterized HTML and add your block of SET calls with default values to the top like this:

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

Note that the AMPscript block containing the SET statement must be at the top, and the lines above and below the SET statements must be in the exact format shown above in order for the SET statements to be properly parsed. You can add additional AMPscript blocks below.

Paste your code into the "Code" input. The parameter inputs will automatically be created so that a user can enter or edit the values in the inputs (in the above example, for body text and text color) without knowing AMPscript. Parameter input names will be taken from the names of the AMPscript variables with underscores turned into spaces.

The code will be rendered in the editor with the variables replaced with parameter values. You can add alternate HTML code to the "Preview" input that will be rendered in the editor instead (useful if your code won't render properly in the editor).

The above example isn't particularly useful since a text block can be edited using the freeform editor, but the Parameterized Content Block is intended for more complex code that cannot be edited in the freeform editor, code that typically would require a custom content block.

Parameterized Content Block is useful for easily adding an interface to nearly any parameterized code without having to create your own custom content block. No knowledge of the Block SDK, Javascript, Github, or Heroku are required.  Once the interface has been created, no AMPscript or HTML knowledge is needed to edit the parameters.

Examples are included in the "examples" folder for a mobile-swappable image, text on a background image, and embedding a video in an email (all things that cannot be done with standard freeform content blocks), all of which can now be implemented using Parameterized Content Block without having to create a new custom content block.

## Future Enhancements
Add support for other types of inputs (sliders, color pickers, etc).
