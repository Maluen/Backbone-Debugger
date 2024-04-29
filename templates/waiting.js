define(["underscore"],
function(_) {
    return ({ inspectedPagePhase, backbonePhase }) => `
<div id="waiting" class="container-fluid">
    ${inspectedPagePhase ? `
    <p>Waiting for inspected page loading...</p>
    ` : ''}
    
    ${backbonePhase ? `
    <p>Waiting for Backbone...</p>
    <p>
        Are you stuck here indefinitely? Then try to use the <a href="https://github.com/Maluen/Backbone-Debugger#backbone-detection" target="_blank">Backbone detection</a> workaround.
    </p>
    ` : ''}
</div>
    `;
});
