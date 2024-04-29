define(["underscore"],
function(_) {
    return ({ sortType, thereAreItems, isReadMoreHidden }) => `
<form class="searchForm navbar-form pull-left">
    <label>
        <input class="searchTerm" type="text" placeholder="Search..." />
        <button class="resetSearch btn btn-link" type="reset" title="Reset search"><i class="icon-remove"></i></button>
    </label>
</form>
<form class="sortForm form-inline pull-left">
    <label>
        Sort:
        <select>
            <option value="normal" ${sortType === 'normal' ? `selected="selected"` : ''}>Oldest first</option>
            <option value="reverse" ${sortType === 'reverse' ? `selected="selected"` : ''}>Newest first</option>
        </select>
    </label>
</form>
${thereAreItems ? `
<table class="table table-striped table-bordered table-condensed">
    <thead>
        <tr>
            <th>Time</th>
            <th>Type</th>
            <th>Name</th>
        </tr>
    </thead>
    <tbody data-placeholder="collectionEl"></tbody>
</table>
` : `
<p class="clear">No results.</p>
`}

<div class="more">
    <a class="readMore btn-link ${isReadMoreHidden ? `hidden` : ''}">Load more</a>
</div>
`;
});