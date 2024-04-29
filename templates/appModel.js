define(["underscore"],
function(_) {
    return ({
        component_status, index, component_name, isOpen, component_attributes, isAttributesOpen,
        component_id, component_cid, component_url, component_collectionIndex,
    }) => `
<a class="appComponentToggle collapsed btn btn-link ${component_status === 'delete (success)' ? `removed` : ''}"
   data-toggle="collapse" 
   data-target="#model${_.escape(index)}">
   <span>Model ${_.escape(index)} ${component_name !== null ? _.escape(component_name) : ''}</span>
</a>

<div id="model${_.escape(index)}" class="appComponent collapse ${isOpen ? `in` : ''}">
    
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

        ${component_attributes !== null ? `
        <li>
            <a class="btn btn-link" title="Toggle" data-toggle="collapse" 
            data-target="#model${_.escape(index)} .attributes"><b>Attributes</b></a>
            <div class="attributes collapse ${isAttributesOpen ? `in` : ''}">
                <ul>
                ${Object.entries(component_attributes).map(([key, value]) => `
                <li>
                    <b>${_.escape(key)}</b>:
                    ${(typeof value !== 'object' && value !== null) ? `
                        ${_.escape(JSON.stringify(value))}
                    ` : `
                        <a class="printAppModelAttribute btn btn-link"
                        data-attribute-name="${_.escape(key)}"
                        title="Print in console">
                        ${_.escape(Object.prototype.toString.call(value))}
                        </a>
                    `}
                </li>
                `).join('')}
                </ul>
            </div>
        </li>
        ` : ''}

        ${component_id !== null ? `
        <li>
            <b>Id</b>: ${_.escape(JSON.stringify(component_id))}
        </li>
        ` : ''}

        ${component_cid !== null ? `
        <li>
            <b>Cid</b>: ${_.escape(JSON.stringify(component_cid))}
        </li>
        ` : ''}

        ${component_url !== null ? `
        <li>
            <b>Url</b>: ${_.escape(JSON.stringify(component_url))}
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
