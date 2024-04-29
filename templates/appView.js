define(["underscore"],
function(_) {
    return ({ component_status, index, component_name, isOpen, component_modelIndex, component_collectionIndex }) => `
<a class="appComponentToggle collapsed btn btn-link ${component_status === 'Removed' ? `removed`: ''}"
   data-toggle="collapse" 
   data-target="#view${_.escape(index)}"
   data-component-index="${_.escape(index)}">
   <span>View ${_.escape(index)} ${component_name !== null ? _.escape(component_name) : ''}</span>
</a>

<div id="view${_.escape(index)}" class="appComponent collapse ${isOpen ? `in` : ''}">
    
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

        <li><b>Status</b>: ${_.escape(component_status)}</li>

        <li>
            <b>Element</b>:
            <a class="printElement btn btn-link" title="Print in console">HTML Element</a>
            <a class="inspectElement btn btn-link" title="Inspect element"><i class="icon-search"></i></a>
        </li>

        ${component_modelIndex !== null ? `
        <li>
            <b>Model</b>: 
            <a class="inspectComponent btn btn-link" 
               data-component-category="Model"
               data-component-index="${_.escape(component_modelIndex)}"
               title="Inspect">
               Model ${_.escape(component_modelIndex)}
            </a>
        </li>
        ` : ''}

        ${component_collectionIndex !== null ? `
        <li>
            <b>Collection</b>: 
            <a class="inspectComponent btn btn-link"
               data-component-category="Collection"
               data-component-index="${_.escape(component_collectionIndex)}"
               title="Inspect">
               Collection ${_.escape(component_collectionIndex)}
            </a>
        </li>
        ` : ''}

        <li>
            <b>Actions:</b>
            <div class="appComponentActionsContainer">
            </div>
        </li>
    </ul>
</div>
`;
});
