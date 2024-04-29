define(["underscore"],
function(_) {
    return ({ sortType, thereAreItems, isReadMoreHidden }) => `
<div>
    <div class="navbar appComponentsOptions">
        <div class="navbar-inner">
          <ul class="nav pull-left">
            <li><a class="openAll btn-link" title="Open all"><i class="icon-chevron-right icon-chevron-bottom"></i></a></li>
            <li><a class="closeAll btn-link" title="Close all"><i class="icon-chevron-right icon-chevron-top"></i></a></li>
            <li>
                <form class="searchForm navbar-form">
                    <label>
                        <input class="searchTerm" type="text" placeholder="Search..." />
                        <button class="resetSearch btn btn-link" type="reset" title="Reset search"><i class="icon-remove"></i></button>
                    </label>
                </form>
            </li>
          </ul>
          <ul class="nav pull-left">
            <li>
                <form class="sortForm form-inline">
                    <label>
                        Sort:
                        <select>
                            <option value="normal" ${sortType === 'normal' ? `selected="selected"`: ''}>Oldest first</option>
                            <option value="reverse" ${sortType === 'reverse' ? `selected="selected"`: ''}>Newest first</option>
                        </select>
                    </label>
                </form>
            </li>
          </ul>
        </div>
    </div>

    <div class="appComponentsContent">
        ${thereAreItems ? `
        <ul data-placeholder="collectionEl"></ul>
        `: `
        <p class="clear">No results.</p>
        `}
    </div>

    <div class="more">
        <a class="readMore btn-link ${isReadMoreHidden ? `hidden` : ''}">Load more</a>
    </div>
</div>
`;
});
