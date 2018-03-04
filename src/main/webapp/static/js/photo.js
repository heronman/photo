(function() {
    window.DPhoto = {
        urls: {
            listAlbums: null
        }
    };

    $(function() {
        $.ajax({
            url: DPhoto.urls.listAlbums,
            method: "GET"
        }).then(function(data) {
            let menus = $(".menus.top").empty();
            for(let album of data.albums) {
                menus.append($("<li>").text(album.title).attr("title", album.description).data("link", album.fileId));
            }

        }, function(){
            debugger;
        });

    });



})();
