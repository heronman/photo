$(function() {
    let base = './photo/';

    function getUrl(links, rel) {
        for(let l of links) {
            if (l.rel === rel)
                return l.href;
        }
    }

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
                let self = this;
                let data = $(this).treenode('data');
                let url = data && data.links ? getUrl(data.links, 'self') : base;
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
                let data = $(this).treenode('data');
                if(data.folder)
                    return;
                images.treebrowser('rightPane').empty().append($("<img>").attr('src', getUrl(data.links, 'self')));
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
