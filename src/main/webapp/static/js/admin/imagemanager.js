(function() {
    window.imageManager = function(opts) {
        let mode = 'normal';

        let options = $.extend(true, {
            mode: 'manage',
            pickFolders: false,
            pickFiles: true,
            callback: null,
            upload: true,
            change: true,
            rename: true,
            delete: true,
            createFolders: true,
            link: null,
            dialog: {
                autoOpen: false,
                modal: false,
                width: 700,
                height: 400,
                title: 'Image browser',
                position: { my: "left+10 top+35", at: "right top", of: "#main-menu" },
            },
            treeview: {
                items: [ { id: 0, label: '--- root ---', items: [], collapsable: false } ],
            }
        }, opts);

        if(options.mode === 'picker') {
            options.upload =
                options.change =
                    options.rename =
                        options.delete =
                            options.createFolders = false;
        }

        function fetchItems(node, folders, success) {
            let $node = $(node);
            ajaxEx({
                section: 'images/',
                data: { cmd: 'list', node: $node.treenode('data', 'id'), folders: folders },
                success: function(data) {
                    if(data.status !== 'ok') {
                        alert("Error fetching images list: "+data[data.status+'_message']);
                        return;
                    }
                    success(node, data);
                },
            });
        }

        function expandNode(ev, data, node, tree) {
            let id = null;
            if(typeof data === 'object' && data.id)
                id = data.id;
            fetchItems(id, 'true', showSubtree);
        }

        let filelist = [];
        function fileAccepted(ev, file) {
            let that = this;
            if(!(file instanceof File)) {
                debugger;
                return;
            }
// add file to upload queue
            filelist.push({
                file: file,
//			id: (new Date()).getTime()+parseInt(Math.random()*100),
                status: 'queue'
            });
            $(this).siblings('button.upload-commit').button('enable');

// make preview
            let reader = new FileReader();
            reader.addEventListener('load', function(ev) {
                let pv = $("<div>").addClass('img-item')
                    .append($("<div>")
                        .addClass('wrapper')
                        .append($("<img>").attr('src', ev.target.result))
                        .append($("<div>")
                            .addClass('bp')
                            .append($("<span>").addClass('ui-icon lock'))
                            .append($("<span>").addClass('ui-icon ui-icon-none select')
                                .click(function() {
                                    $(this).toggleClass('ui-icon-none').toggleClass('ui-icon-check');
                                })
                            )
                        )
                    )
                    .append($("<div>")
                        .append($("<span>").addClass('name').text(file.name))
                    ).prependTo(uploader)
                    .data('file', file);
                file.previewItem = pv;
            });

            reader.readAsDataURL(file);
            ev.stopImmediatePropagation();
        }

        function bytes2text(b) {
            if(isNaN(b)) return '0 B';
            if(b > 1073741824) return ""+(Math.round(b / 10737418.24) / 100.0)+" GiB";
            if(b > 1048576) return ""+(Math.round(b / 10485.76) / 100.0)+" MiB";
            if(b > 1024) return ""+(Math.round(b / 10.24) / 100.0)+" KiB";
            return ""+b+" B";
        }

        function showProgress(dlg, timeStart, timeEnd, lastProgress, loaded, total) {
            let timediff = timeEnd - timeStart;
            let bytesdiff = loaded - lastProgress;
            let percent = Math.round((loaded / total) * 100);
            let speed = bytesdiff / (timediff / 1000);
            $('progress', dlg).attr('max', total);
            $('.total', this).text(bytes2text(total));
            $('progress', dlg).val(loaded);
            $('.loaded', dlg).text(bytes2text(loaded));
            $('.percent', dlg).text(percent);
            $('.speed', dlg).text(bytes2text(speed)+"/s");
        }

        function uploadStart(ev, xhr, ui) {
            let tm = (new Date()).getTime();
            $(this).data({ startTime: tm, lastTime: tm, lastProgress: 0 });
            $('progress', this).attr('max', ev.total).val(0);
            $('.total', this).text(bytes2text(ev.total));
        }

        function uploadProgress(ev, xhr, ui, finished) {
            let tm = (new Date()).getTime();
            let data = $(this).data();
            showProgress(this, data.lastTime, tm, data.lastProgress, ev.loaded, ev.total);
//		showProgress(this, data.startTime, tm, 0, ev.loaded, ev.total);
            $(this).data({ lastProgress: ev.loaded, lastTime: tm });
            if(finished) $(this).data({ stopTime: tm });
        }

        function uploadAbort(ev, xhr, ui) {
            $(this)
                .dialog('option', 'beforeClose', function() { return true; })
                .dialog('close')
                .dialog('destroy').remove();
        }

        function uploadError(ev, xhr, ui) {
            debugger;
        }

        function uploadSuccess(ev, xhr, ui) {
            $(this)
                .dialog('option', 'beforeClose', function() { return true; })
                .dialog('close')
                .dialog('destroy').remove();

            let data = null;
            try { eval("data = "+xhr.responseText); }
            catch(e) {}

            if(xhr.status !== 200) {
                let err;
                switch(xhr.status) {
                    case 413: err = "Объем загружаемых данных слишком велик"; break;
                    case 401: case 403: err = "Пользователь не авторизован"; break;
                    case 404: err = "Целевая папка не найдена"; break;
                    default: err = "Ошибка сервера №"+xhr.status;
                }
                alert("Ошибка загрузки: "+err);
            } else {
//			alert('Загрузка завершена');
                if(data) {
                    if(data.status !== 'ok') {
                        alert("Ошибка загрузки: "+data[data.status+"_message"]);
                    }
                    if(data.hasOwnProperty('files')) {
                        for(let i = 0;i < filelist.length;i++) {
                            let found = null;
                            for(let n = 0;n < data.files.length;n++) {
                                if(data.files[n].uploadID === filelist[i].uploadID) {
                                    found = data.files[n];
                                    break;
                                }
                            }
                            if(!found) {
                                alert("File "+filelist[i].file.name+" not found in report");
                                //debugger;
                            }
                            //debugger;
                        }
                    }
                }
                uploader.empty();
                //.dialog('close').dialog('destroy').remove();
                filelist = [];
                imagebrowser.treebrowser('treeview', 'selectedNode').treenode('load');
//			let sn = imagebrowser.treebrowser('treeview', 'selectedNode');
//			if(sn.length) showItem.call(sn[0]);
            }
        }

        function uploadCommit() {
            let node = imagebrowser.treebrowser('treePane').treeview('selectedNode');
            let nodeData = node.treenode('data');
            let xhr = new XMLHttpRequest();
            let frm = new FormData();
            let that = this;
            for(let i = 0;i < filelist.length;i++) {
                filelist[i].status = 'uploading';
                filelist[i].uploadID = 'image['+i+']';
                frm.append(filelist[i].uploadID, filelist[i].file);
            }
            frm.append('cmd', 'upload');
            frm.append('node', nodeData.id);
            let dlg = $("<div>")
                .addClass('upload-monitor')
                .append(
                    $("<progress>")
                        .attr('min', 0)
                        .attr('max', 100)
                        .val(0)
                )
                .append($("<p>").html("<span class='percent'>0</span>%"))
                .append($("<p>").html("<span class='loaded'>0</span> из <span class='total'>0</span>"))
                .append($("<p>").html("Скорость: <span class='speed'>0</span>"))
                .dialog({
                    modal: true,
                    title: 'Загрузка...',
                    buttons: [ { text: 'Отмена', click: function() { xhr.abort(); } } ],
                    beforeClose: function() { return false; },
                    closeOnEscape: false
                });
            xhr.upload.onloadstart = function(ev) { uploadStart.call(dlg, ev, xhr, that); };
            xhr.upload.onloadend = function(ev) { uploadProgress.call(dlg, ev, xhr, that); };
            xhr.upload.onprogress = function(ev) { uploadProgress.call(dlg, ev, xhr, that); };
            xhr.onabort = function(ev) { uploadAbort.call(dlg, ev, this, that); };
            xhr.onerror = function(ev) { uploadError.call(dlg, ev, this, that); };
            xhr.onload = function(ev) { uploadSuccess.call(dlg, ev, this, that); };
            xhr.open('POST', '/admin/images/', true);
            xhr.send(frm);
        }

        function removeFolder(node) {
            if(!confirm('Удалить папку "'+node.children('.ui-treeview-label').text()+'" со всем ее содержимым?'))
                return;
            let tree = node.parents('.ui-treeview:first');
            let id = tree.treeview('data', node, 'id');
            ajaxEx({
                section: '/images/',
                data: { cmd: 'rmdir', node: id },
                success: function(data) {
                    if(data.status !== 'ok') {
                        alert("Error deleting node: "+data[data.status+'_message']);
                        return;
                    }
                    tree.treeview('delete', node);
                    imagebrowser.treebrowser('rightPane').empty();
                }
            });
        }

        function removeItems(node, items) {
            if(!items.length) {
                imagebrowser.treebrowser('rightPane').find('button.remove-items').button('disable');
                return;
            }
//		let list = [];
//		items.each(function() {
//			list.push($(this).data('item').id);
//		});
            if(!confirm('Удалить отмеченные изображения ('+items.length+')?')) return;
            let id = node.treenode('data', 'id');
            ajaxEx({
                section: 'images/',
                data: { cmd: 'rm', node: id, list: items },
                success: function(data) {
                    if(data.status !== 'ok') {
                        alert("Error deleting node: "+data[data.status+'_message']);
                        return;
                    }
//				tree.treeview('delete', node);
//				showItem.call(node);
//				imagebrowser.treebrowser('rightPane').empty();
                    node.trigger('load', data);
                    node.treenode('click');
                }
            });
        }

        function addFolderAjax(node, dialog) {
//		let tree = node.parents('.ui-treeview:first');
//		let id = tree.treeview('data', node, 'id');
            let id = node.treenode('data', 'id');
//debugger;
            let request = {
                section: 'images/',
                data: { cmd: 'mkdir', node: id, name: dialog.find('input').val() },
                success: function(data) {
                    if(data.status !== 'ok') {
                        ajaxResponseError(data);
                        return;
                    }
                    node.treenode('load');
//				tree.treeview('insertSorted', node, [ data.folder ]);
                    dialog.dialog('close');
                }
            };
            ajaxEx(request);
        }

        function addFolder(node) {
            $("<div>")
                .append($("<input>").attr('type', 'text'))
                .dialog({
                    title: 'Новая папка',
                    buttons: [
                        { text: 'Ok', click: function() { addFolderAjax(node, $(this)); } },
                        { text: 'Отмена', click: function() { $(this).dialog('close'); } }
                    ],
                    modal: true,
                    close: function() {
                        $(this).dialog('destroy').remove();
                    }
                });
        }

        function nodeRename(node, input, button) {
            if(node.hasClass('ui-treeview-root')) return;
//		let tree = node.parents('.ui-treeview:first');
//		let id = node.treenode('data', 'id');
            ajaxEx({
                section: 'images/',
                data: { cmd: 'rename', node: node.treenode('data', 'id'), name: input.val() },
                success: function(data) {
                    if(data.status !== 'ok') {
                        alert("Error renaming node: "+data[data.status+'_message']);
                        return;
                    }
                    node.treenode('data', 'name', data.name);
                    button.button('disable');
                    input.data('name', data.name).val(data.name);
                    if(!node.treenode('isFolder')) showItem.call(node);
                }
            });
        }

        function showItem() {//node, items) {
            let that = this;
            let node = $(this);
            let data = node.treenode('data');
            if(!data.path) data.path = '/';

            buttonset
                .find('button.id').button('option', 'label', "ID: "+data.id).end()
                .find('span.id').text(data.id).end()
                .find('.remove-items').button('disable');

            let nodeid = node.treenode('data', 'id');
            let path = '';
            if(!nodeid || node.treenode('data', 'name') === '.cache') {
                buttonset.find('button.remove-folder').button('disable');
                imagebrowser.treebrowser('option', 'title', 'Image browser - /'+(nodeid ? data.name : ''));
            } else {
                let nn = node.treenode('parentNode');
                while(true) {
                    path = (nn.treenode('data', 'id') ? nn.treenode('data', 'name') : '')+'/'+path;
                    if(nn.treenode('data', 'id')) nn = nn.treenode('parentNode');
                    else break;
                }
                imagebrowser.treebrowser('option', 'title', 'Image browser - '+path+data.name);
            }
            if(node.treenode('isFolder')) {
                buttonset.children('.pick').button(options.pickFolders ? 'enable' : 'disable');
                showFolder(node);
            } else {
                buttonset.children('.pick').button(options.pickFiles ? 'enable' : 'disable');
                showImage(node, path+data.name);
            }
        }

        function showImage(node, path) {
            let box = imagebrowser.treebrowser('rightPane')
                .empty();
            let data = node.treenode('data');
            box.append($("<div class='img-box anchor'><img src='/storage/?id="+data.id+"'/></div>")
                .click(function() {
                    open("/storage/?id="+data.id, "img_view_full", "menubar=no,location=no,directories=no,status=no,titlebar=no,width="+Math.min(screen.width, data.width)+",height="+Math.min(screen.height, data.height));
                })
            );

            buttonset.children('button.remove-items,button.change').button('enable');
            buttonset.children('button.add-folder, button.upload').button('disable');

            box.append($("<div>").addClass('form')
                .append($("<p class='field'>")
                    .append($("<span class='label'>").text('ID:'))
                    .append($("<span class='value'>").text(data.id))
                )
                .append($("<p class='field'>")
                    .append($("<span class='label'>").text('Title:'))
                    .append($("<span class='value'>").text(data.title))
                )
                .append($("<p class='field'>")
                    .append($("<span class='label'>").text('Descr:'))
                    .append($("<span class='value'>").text(data.descr))
                )
                .append($("<p class='field'>")
                    .append($("<span class='label'>").text('Long link:'))
                    .append($("<span class='value'>").text("http://"+location.host+"/storage/"+path))
                )
                .append($("<p class='field'>")
                    .append($("<span class='label'>").text('Short link:'))
                    .append($("<span class='value'>").text("http://"+location.host+"/storage/?id="+data.id))
                )
                .append($("<p class='field'>")
                    .append($("<span class='label'>").text('Type:'))
                    .append($("<span class='value'>").text(data.mime))
                )
                .append($("<p class='field'>")
                    .append($("<span class='label'>").text('Size:'))
                    .append($("<span class='value'>").text(bytes2text(data.size)))
                )
                .append($("<p class='field'>")
                    .append($("<span class='label'>").text('Pixels:'))
                    .append($("<span class='value'>").text(data.width+"x"+data.height))
                )
            );
            adjustRightPaneForm();
        }

        function showFolder(node) {
            let sorting = false;
            let box = imagebrowser.treebrowser('rightPane')
                .empty()
                .append($("<div>").addClass('img-list'));
            buttonset.children('button.remove-items').button('disable');
            buttonset.children('button.add-folder, button.upload').button('enable');
            let data = node.treenode('data');
            if(!data.id || data.name === '.cache')
                buttonset.children('button.change').button('disable');
            else
                buttonset.children('button.change').button('enable');
            let items = node.treenode('children');
            let pp = box.find('.img-list');

            items.each(function() {
                let $this = $(this);
                let data = $this.treenode('data');

                let preview = $("<div>").addClass('img-item')
                    .append($("<div>")
                        .addClass('wrapper'+(data.is_folder ? ' folder' : ''))
                        .append($("<img>")
                            .attr('src', data.is_folder ?
                                '/media/img/generic-folder-blue-100.png' :
                                '/storage/?id='+data.id+'&cover=100x100'
                            )
                            .click(function() {
                                if(sorting) { sorting = false; return; }
                                let data = $(this).parents('.img-item:first').data('item');
                                let folder = imagebrowser.treebrowser('treePane').treeview('selectedNode');
                                folder.treenode('children').each(function() {
                                    if($(this).treenode('data', 'id') === data.id) {
                                        $(this).treenode('click');
                                        return false;
                                    }
                                });
                            })
                        )
                    )
                    .append($("<div>")
                        .append($("<span>").addClass('name').text(data.name))
                    )
                    .appendTo(pp)
                    .data('item', data);

                if(options.mode === 'manage')
                    preview.children('.wrapper')
                        .append($("<div>")
                            .addClass('bp')
                            .append($("<span>").addClass('ui-icon lock')
                                .addClass('ui-icon-'+(data.hidden ? '' : 'un')+'locked')
                                .click(function(ev) {
                                    let isHidden = preview.hasClass('lock');
                                    ajaxEx({
                                        section: 'images/',
                                        data: { cmd: 'hidden', node: data.id, hide: !isHidden },
                                        success: function(data) {
                                            if(data.status !== 'ok') {
                                                alert("Error fetching images list: "+data[data.status+'_message']);
                                                return;
                                            }
                                            if(data.hidden) {
                                                preview
                                                    .addClass('lock')
                                                    .find('.ui-icon.lock')
                                                    .addClass('ui-icon-locked')
                                                    .removeClass('ui-icon-unlocked');
                                            } else {
                                                preview
                                                    .removeClass('lock')
                                                    .find('.ui-icon.lock')
                                                    .removeClass('ui-icon-locked')
                                                    .addClass('ui-icon-unlocked');
                                            }
                                        },
                                    });
                                })
                            )
                            .append($("<span>").addClass('ui-icon ui-icon-none select')
                                .click(function(ev) {
                                    ev.stopPropagation();
                                    $(this).toggleClass('ui-icon-none').toggleClass('ui-icon-check');
                                    buttonset.children('.remove-items').button('option', 'disabled',
                                        pp.find('.img-item:has(.ui-icon-check)').length === 0);
                                })
                            )
                        );
                if(data.hidden) preview.addClass('lock');
            });

            if(options.change) pp.sortable({
                start: function() {
                    sorting = true;
                },
                update: function() {
                    let arr = [];
                    $('.img-item', pp).each(function(idx) {
                        arr.push($(this).data('item').id);
                    });
                    let id = imagebrowser.treebrowser('treeview', 'selectedNode').treenode('data', 'id');
                    ajaxEx({
                        section: 'images/',
                        data: { cmd: 'order', node: id, items: arr },
                        success: function(data) {
                            if(data.status !== 'ok') {
                                alert("Error sorting items: "+data[data.status+'_message']);
                                return;
                            }
                        },
                    });
                }
            });
        }

        function clickNode(ev, obj) {
            let $this = $(this);
            if($this.treenode('isFolder')) {
                if(!$this.treenode('isLoaded')) {
                    let that = this;
                    let args = arguments;
                    let foo = function() {
                        $this.off('treenodeload', foo);
                        clickNode.apply(that, args);
                    }
                    $this.on('treenodeload', foo);
                    return;
                } else {
                    showItem.call(this);
                }
            } else {
                showItem.call(this);
            }
        }

        function changeNode() {
            let node = imagebrowser.treebrowser('selectedNode');
            let data = node.treenode('data');
            let name, title, descr;
            let dlg = $("<div>").append($("<table>").attr({ cellspacing: 0, width: '100%' })
                .addClass('form')
                .append($("<tr>").addClass('field name')
                    .append($("<th>").addClass('label').text('Name:'))
                    .append($("<td>").addClass('value').append(name = $("<input>").attr('type', 'text').val(data.name)))
                ).append($("<tr>").addClass('field title')
                    .append($("<th>").addClass('label').text('Title:'))
                    .append($("<td>").addClass('value').append(title = $("<input>").attr('type', 'text').val(data.title)))
                ).append($("<tr>").addClass('field descr')
                    .append($("<th>").addClass('label').text('Descr:'))
                    .append($("<td>").addClass('value').append(descr = $("<textarea>").val(data.descr)))
                )
            );
            dlg.dialog({
                modal: true,
                title: 'Свойства объекта',
                buttons: [
                    { text: 'Ok', click: function() {
                            if(name.val() !== data.name
                                || title.val() !== data.title
                                || descr.val() !== data.descr)
                                ajaxEx({
                                    section: 'images',
                                    data: { cmd: 'change', node: data.id, name: name.val(), title: title.val(), descr: descr.val() },
                                    success: function(data) {
                                        if(data.status !== 'ok') {
                                            alert("Error renaming node: "+data[data.status+'_message']);
                                            return;
                                        }
                                        node.treenode('data', 'name', name.val());
                                        node.treenode('data', 'title', title.val());
                                        node.treenode('data', 'descr', descr.val());
                                        showItem.call(node);
                                    }
                                });
                            $(this).dialog('close');
                        }
                    },
                    { text: 'Отмена', click: function() { $(this).dialog('close'); } }
                ],
                close: function() { $(this).dialog('destroy').remove(); }
            });
        }

        function adjustRightPaneForm() {
            let form = imagebrowser.treebrowser('rightPane').children('.form');
            $('>.field>.value', form).width(
                $('>.field:first', form).width()
                - $('>.field>.label:first', form).outerWidth(true)
            );
        }

        let imagebrowser = $("<div>").treebrowser($.extend({}, options.dialog, {
            buttons: [ {} ],
            close: function() {
                uploader.dialog('close');
                if('function' === typeof options.dialog.close)
                    options.dialog.close.apply(this, arguments);
            },
            treeview: $.extend({}, options.treeview, {
                click: clickNode,
                load: function (ev, data) {
                    for (let i = 0; i < data.length; i++)
                        data[i] = { "id" : data[i].itemId, "label" : data[i].title, "data" : data[i] };
                    $(this).treenode('data', 'children', data);
                    let sn = $(this).treenode('root').treeview('selectedNode');
                    if (sn.length && sn[0] === this)
                        showItem.call(this);
                },
                lazyLoad: function () {
                    let $this = $(this);
                    return $.ajax({
                        url: ($this.data('val-treenode') && $this.treenode('data').links && $this.treenode('data').links.self)
                            || options.link,
                        type: "GET",
                        dataType: "json"
                    });
                }
            })
        }));

        imagebrowser.treebrowser('treePane').treeview('nodes')
            .treenode('expand')
            .treenode('option', 'collapsable', false);

        imagebrowser.children('.ui-splitview').on('splitviewresize', adjustRightPaneForm);

        //let folderset = $("<div>").addClass("imgb-folder");


        let buttonset = $("<div>").addClass('imgb-buttons')
            .append($("<div>").addClass('id-label')
                .append($("<span>").addClass('label').text('ID:'))
                .append($("<span>").addClass('id value'))
            );

        if(options.change)
            buttonset.append($("<button>")
                .addClass('change')
                .text('Изменить свойства')
                .button({ disabled: true, text: false, icons: { primary: 'ui-icon-pencil' } })
                .click(changeNode));

        if(options.delete)
            buttonset.append($("<button>").addClass('remove-items').prop('disabled', true).text('Удалить отмеченные').button({ text: false, icons: { primary: 'ui-icon-trash' } })
                .click(function() {
                    let node = imagebrowser.treebrowser('treePane').treeview('selectedNode');
                    if(!node || !node.length) return;
                    if(!node.treenode('isFolder')) {
                        removeItems(node.treenode('parentNode').first(), [ node.treenode('data', 'id') ]);
                        return;
                    }
                    let items = imagebrowser.treebrowser('rightPane').find('.img-item:has(.ui-icon-check)');
                    if(!items || !items.length) { $(this).button('disable'); return; }
                    let list = [];
                    items.each(function() {
                        list.push($(this).data('item').id);
                    });
                    removeItems(node, list);
                })
            );
        if(options.createFolders)
            buttonset.append($("<button>").addClass('add-folder').text('Добавить папку').button({ text: false, icon: 'ui-icon-folder-collapsed' })
                .click(function() {
                    let node = imagebrowser.treebrowser('selectedNode');
                    if(!node || !node.length) return;
                    addFolder(node);
                })
            );
        if(options.upload)
            buttonset.append($("<button>").addClass('upload').text('Загрузка').button({ text: false, icon: 'ui-icon-disk' })
                .click(function() {
                    if(uploader.dialog('isOpen')) uploader.dialog('close');
                    else uploader.dialog('open').dialog('moveToTop');
                })
            );

        if(options.mode === 'picker')
            buttonset.append($("<button>").addClass('pick').text('Ok').button({ disabled: true })
                .click(function() {
                    if('function' === typeof options.callback) {
                        let item = imagebrowser.treebrowser('selectedNode');
                        if(item && item.length) {
                            options.callback(item.treenode('data'));
                            imagebrowser.treebrowser('close');
                        }
                    }
                })
            );

        buttonset
            .appendTo(imagebrowser.treebrowser('widget').children('.ui-dialog-buttonpane').empty());
            // .buttonset();

        let uploader = $();
        if(options.upload) {
            uploader = $("<div>").dialog({
                autoOpen: false,
                title: 'Загрузка',
                width: 400,
                height: 300,
                buttons: [
                    { text: "Загрузить", icons: { primary: "ui-icon-arrowthickstop-1-n" }, click: function() {
                            uploadCommit.call(imagebrowser);
                        } },
                    { text: "Убрать выделенные", icons: { primary: "ui-icon-close" }, click: function() {
                            let selected = $("div.img-item:has(.ui-icon-check)", this);
                            if(!selected.length) {
                                if(!confirm("Файлы не отмечены. Очистить весь список?")) return;
                                filelist = [];
                                $(this).empty();
                                return;
                            }
                            selected.each(function() {
                                let file = $(this).data('file');
                                for(let i = 0;i < filelist.length;i++) {
                                    if(filelist[i].file === file) {
                                        filelist.splice(i, 1);
                                        return;
                                    }
                                }
                            }).remove();
                        } },
                    { text: "Добавить файл", icons: { primary: "ui-icon-plus", secondary: "ui-icon-disk" }, click: function() {} },
                ]
            });

            uploader.dialog('widget')
                .find('.ui-dialog-buttonpane > .ui-dialog-buttonset > button')
                .button('option', 'text', false)
                .filter(':last').button('destroy')
                .uploadcollector({
                    mode: 'pushbutton',
                    types: /^image\/(?:jpeg|jpg|png|gif)$/,
                    button: { text: false, icons: { primary: "ui-icon-plus", secondary: "ui-icon-disk" } },
                    accept: fileAccepted,
                    decline: function() {
                        debugger;
                    }
                });
        }

        return imagebrowser;
    };
})();
