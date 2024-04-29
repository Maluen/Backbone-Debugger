define(["underscore"],
function(_) {
    return ({ index, component_name, isOpen }) => `
<a class="appComponentToggle collapsed btn btn-link"
   data-toggle="collapse" 
   data-target="#router${_.escape(index)}">
   <span>Router ${_.escape(index)} ${component_name !== null ? _.escape(component_name) : ''}</span>
</a>

<div id="router${_.escape(index)}" class="appComponent collapse ${isOpen ? `in` : ''}">
    
    <ul>
        <!--
        <li>
            <b>Type</b>: 
            <a class="printType btn btn-link" title="Print in console">[object Object]</a>
        </li>
        -->

        <li>
            <b>this</b>: 
            <a class="printAppComponent btn btn-link" title="Print in console">[object Object]</a>
        </li>

        <li>
            <b>Actions:</b>
            <div class="appComponentActionsContainer">
            </div>
        </li>
    </ul>
</div>
`;
});
