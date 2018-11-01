# parameterized content block
Salesforce Marketing Cloud Content Builder Block using the [blocksdk](https://github.com/salesforce-marketingcloud/blocksdk).

The Parameterized Content Block allows you to paste in parameterized HTML and generates inputs for each parameter.  Parameterized HTML is HTML that contains AMPscript variables of the form "%%=v(@Variable)=%%" and has a block of AMPscript "SET" calls at the top to define those variables.

## How to Use
Create your parameterized HTML content block, and add your clock of SET calls to the top surrounded by AMPscript block / comment lines in a specific format.  For example:

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

Paste your code into the "CODE" input.  The parameters will automatically be created so that a user can enter or edit the values for body text and text color without knowing AMPscript.

The code will be rendered in the editor with the variables replaced with parameter values.  You can add alternate HTML code to the "PREVIEW" input that will be rendered in the editor instead (useful if your code won't render properly in the editor).

The above example isn't particularly useful since a text block can be edited using the Freeform editor, but this would be useful for more complex code that cannot be edited in the freeform editor.

This is useful for quickly adding an interface to nearly any code without having to know the Block SDK to create your own custom content block.  It could be used to implement many of the custom content blocks that have already been created by other developers, all without having to use the block SDK.

Example code is included in the "examples" folder for an image that will swap on mobile, text on a background image, and embedding a video in an email (all things that cannot be done within the standard content blocks), all of which can now be implemented using this content block without having to create a new custom content block.

## Future Enhancements
Add support for other types of inputs (sliders, color pickers, etc).

