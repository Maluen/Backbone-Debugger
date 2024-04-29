define(["underscore"],
function(_) {
    return ({ time, type, dataKind, name }) => `
<td>${_.escape(time)}</td>
<td>${_.escape(type)}</td>
<td>
    ${dataKind !== null ? `
        <a class="printData btn btn-link" title="Print ${_.escape(dataKind)} in console">${_.escape(name)}</a>
    `: `
        ${_.escape(name)}
    `}
</td>
    `;
});