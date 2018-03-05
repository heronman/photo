$(function() {
    let base = 'photo/';

    let images = $("<div>").treebrowser({
        width: 800,
        height: 400,
        ratio: [ 0.3, 0.7 ],
        autoOpen: false,
        treeview: {
            items: [
                {
                    label: "--- root ---",
                    collapsable: false,
                    folder: true,
                    id: 0
                }
            ],
            lazyLoad: function() {
                let links = $(this).treenode('data', 'links');
                let url = (links && links.self) ?
                    links.self : base;

                 return $.ajax({
                    url: url,
                    type: 'GET'
                }).then(data => {
                    let result = [];
                    for (let item of data)
                        result.push({
                            data: item,
                            folder: item.folder,
                            label: item.title,
                            tooltip: item.description
                        });
                    return result;
                });
            },
            select: function() {
                if(!$(this).treenode('folder')) {
                    let links = $(this).treenode('data', 'links');
                    images.treebrowser('rightPane').empty().append($("<img>").attr('src', links.self));
                }
            },
            load: function() {
                // TODO
                // debugger;
            }
        }
    });

    $("#main-menu").find("> li:first").click(function() {
        images.treebrowser('open').treebrowser('moveToTop');
    });

});
