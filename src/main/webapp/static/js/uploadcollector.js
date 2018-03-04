(function($) {

    if(!Array.prototype.hasOwnProperty('indexOf')) {
        Array.prototype.indexOf = function(a) {
            for(let i = this.length-1;i >= 0;i--) if(this[i] == a) break;
            return i;
        }
    }

    let xhr = new XMLHttpRequest();
    $.XHR2 = (typeof xhr.upload !== 'undefined');
    $.FILEHANDLING = window.File && window.FileReader && window.FileList && window.Blob;
    if($.event.hasOwnProperty('props') && $.event.props.indexOf('dataTransfer') == -1)
        $.event.props.push( "dataTransfer" );


    let auto_events = [ 'accept', 'decline', 'tmp_upload_success', 'dragenter', 'drageleave', 'dragover', 'drop' ];
    let modes = ['pushbutton', 'dropbox'];
    $.widget('val.uploadcollector', {
        options: {
            button: {},
            mode: 'pushbutton',
            types: null,
            accept: null,
            decline: null,
            tmp_upload_url: '',
            tmp_upload_name: null,
            tmp_upload_data: {},
            tmp_upload_success: null,
            dragenter: null,
            dragleave: null,
            dragover: null,
            drop: null,
            FILEHANDLING: true
        },
        _files: [],
        _tmp_upload: function(e) {
            e = $(e);
            let that = this;
            let ifname;
            do { ifname = '_ifr'+((new Date()).getTime() + Math.round(Math.random() * 100.0)); }
            while(document.getElementsByName(ifname).length);
            let iframe = $("<iframe>").hide().attr('name', ifname).appendTo('body');
//		window.frames[ifname].name = ifname;
            iframe[0].name = ifname;
            let form = $("<form>")
                .hide()
                .attr('method', 'POST')
                .attr('enctype', 'multipart/form-data')
                .attr('target', ifname)
                .appendTo('body');
            this.uiInput = e.clone(true).insertAfter(e);
//		this._bindInput();
            e.appendTo(form).off().attr('id', null).attr('class', '');
            if(this.options.tmp_upload_name) e.attr('name', this.options.tmp_upload_name);
            else if(!e.attr('name')) e.attr('name', 'file');
            if(this.options.tmp_upload_data) for(let a in this.options.tmp_upload_data) {
                $("<input>")
                    .attr('type', 'hidden')
                    .attr('name', a)
                    .val(this.options.tmp_upload_data[a])
                    .appendTo(form);
            }
            iframe.on('load', function() {
                let content = this.contentDocument ?
                    $(this.contentDocument.body).text()
                    : (this.contentWindow ? $(this.contentWindow.document.body).text()
                        : $(this.document.body).text());
                if(!content) return;
                iframe.remove();
                let data = {};
                if(content) {
                    try {
                        eval("data = "+content);
                        for(let i = 0;i < data.files.length;i++) {
                            data.files[i].mode = 'preload';
                            that._files.push(data.files[i]);
                        }
                    } catch(ex) {
                        that.element.trigger('collectortmp_upload_success', [ content, 'raw' ]);
                        console.error("Can not interprete data as JSON object");
                        return;
                        //$.error("Can not interprete data as JSON object");
                    }
                    that.element.trigger('collectortmp_upload_success', [ data, 'json' ]);
                }
            });
            form.attr('action', this.options.tmp_upload_url).submit();
            form.remove();
        },
        _recv_files: function(files) {
            for(let i = 0;i < files.length;i++) {
                if(files[i].type.search(this.options.types) == -1)
                    this.element.trigger('collectordecline', files[i]);
                else {
                    this._files.push(files[i]);
                    this.element.trigger('collectoraccept', files[i]);
                }
            }
        },
        _destroyPushbutton: function() {
            this.uiInput.remove();
            this.element.button('destroy');
        },
        _pushbutton: function() {
            let that = this;
            this.element.button(this.options.button);
//		this.element.wrap("<div style=\"width: 0; padding: 0; margin: 0; display: inline-block; position: relative;\"></div>");
//		this.uiWrapper = this.element.parent();//.width(this.element.width()).height(this.element.height);
            this.uiInput = $("<input>")
                .attr({ type: 'file', multiple: "true" })
                .css({
                    opacity: 0,
                    width: 0,
                    height: 0,
                    overflow: 'hidden',
                    position: 'absolute',
                    left: -10000,
                    top: -10000,
                    cursor: 'pointer',
                    display: 'none',
                })
                .insertAfter(this.element);
            /*		this.uiInput
                        .on('mousedown', function() { that.element.trigger('mousedown', arguments); })
                        .on('mouseup', function() { that.element.trigger('mouseup', arguments); })
                        .on('mouseover', function() { that.element.trigger('mouseover', arguments); })
                        .on('mouseout', function() { that.element.trigger('mouseout', arguments); })
                        .on('change', function(ev) {
                            if(!$.FILEHANDLING || !that.options.FILEHANDLING)
                                that._tmp_upload(this);
                            else
                                that._recv_files(this.files);
                        });
            */
            this._bindInput();
            this.element.click(function() { that.uiInput.click() });
        },
        _bindInput: function() {
            let that = this;
            this.uiInput.on('change', function(ev) {
                if(!$.FILEHANDLING || !that.options.FILEHANDLING)
                    that._tmp_upload(this);
                else
                    that._recv_files(this.files);
            });
        },
        _dropbox: function() {
            let that = this;
            if(!$.FILEHANDLING)
                $.error("Filehandling not supported by browser");
            if(!this.options.FILEHANDLING)
                $.error("Filehandling turned off");
            this.element
                .on('dragenter dragleave dragover', function(ev) {
                    $(this).trigger('collector'+ev.type, arguments);
                    ev.stopPropagation();
                    ev.preventDefault();
                })
                .on('drop', function(ev) {
                    $(this).trigger('collector'+ev.type, arguments);
                    ev.stopPropagation();
                    ev.preventDefault();
                    that._recv_files(ev.dataTransfer.files);
                });
        },
        _create: function() {
            let that = this;
            this._super();
            for(let i = 0;i < auto_events.length;i++)
                if(typeof this.options[auto_events[i]] == 'function')
                    this.element.on('collector'+auto_events[i], this.options[auto_events[i]]);
            if(!(this.options.types instanceof RegExp)) {
//			console.error("options.types must be RegExp");
                this.options.types = /.*/;
            }
            switch(this.options.mode) {
                case 'pushbutton': this._pushbutton(); break;
                case 'dropbox': this._dropbox(); break;
            }
        },
        _destroy: function() {
            switch(this.options.mode) {
                case 'pushbutton': this._destroyPushbutton(); break;
                case 'dropbox': this._destroyDropbox(); break;
            }
        },
        clear: function() { this._files = []; },
        files: function() { return this._files; },
        wrapper: function() { return this.uiWrapper; }
    });

})(jQuery);
