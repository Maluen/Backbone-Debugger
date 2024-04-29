define(["underscore"],
function(_) {
    return ({
        component_status, index, component_name, isOpen, component_hasModel, component_models, isModelsOpen, component_url,
    }) => `
<a class="appComponentToggle collapsed btn btn-link ${component_status === 'delete (success)' ? `removed`: ''}"
   data-toggle="collapse" 
   data-target="#collection${_.escape(index)}">
   <span>
    Collection ${_.escape(index)} ${component_name !== null ? _.escape(component_name) : ''}}
   </span>
</a>

<div id="collection${_.escape(index)}" class="appComponent collapse ${isOpen ? `in` : ''}">
    
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

        ${component_status !== null ? `
        <li>
            <b>Status</b>: ${_.escape(component_status)}
        </li>
        ` : ''}
        
        <!--
        ${component_hasModel ? `
        <li>
            <b>Models type</b>: 
            <a class="printModelsType btn btn-link" title="Print in console">[object Object]</a></li>
        </li>
        ` : ''}
        -->

        ${component_models ? `
        <li>
            <a class="btn btn-link" title="Toggle" data-toggle="collapse" 
            data-target="#collection${_.escape(index)} .models"><b>Models</b></a>
            <div class="models collapse ${isModelsOpen ? `in` : ''}">
                <ul>
                    ${component_models.map(model => `
                    <li>
                        <a class="inspectComponent btn btn-link" 
                           data-component-category="Model"
                           data-component-index="${_.escape(model)}"
                           title="Inspect">
                           Model ${_.escape(model)}
                        </a>
                    </li>
                    `).join('')}
                </ul>
            </div>
        </li>
        ` : ''}

        ${component_url !== null ? `
        <li>
            <b>Url</b>: ${_.escape(JSON.stringify(component_url))}
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
