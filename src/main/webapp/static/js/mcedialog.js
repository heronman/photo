(function($) {
	$.widget('val.mcedialog', {
		dlg: null,
		mce: null,
		ifr: null,
		win: null,
		container: null,
		options: {
			load: null,
			save: null,
			dialog: {
				resizable: true,
			},
			tinymce: {
				language: 'ru',
				// Location of TinyMCE script
				script_url : '/js/tinymce/tinymce.min.js',
				convert_urls: false,

				// General options
				theme : "modern",
				plugins: [
					"advlist autolink lists link image charmap print preview hr anchor pagebreak",
					"searchreplace wordcount visualblocks visualchars code fullscreen",
					"insertdatetime media nonbreaking save table contextmenu directionality",
					"emoticons template paste textcolor",
				],
//				resize: 'none',
				toolbar1: "save undo redo | styleselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent",
				toolbar2: "forecolor backcolor emoticons | link image media | preview code fullscreen",
			}
		},
		_destroy: function() {
			this.mce.remove();
			this.dlg.dialog('destroy');
			this.element.unwrap();
		},
		_create: function() {
			var that = this;
			var dclass = 'val-dialog-tinymce';
			if(this.options.dialogClass) dclass += ' '+this.options.dialogClass;

			this.dlg = this.element.wrap("<div>").parent();
			this.dlg.dialog($.extend({}, this.options.dialog, {
					dialogClass: dclass,
					//resizable: false,
					open: function() {
						that.dlg.dialog('widget').css({ width: '', height: '' });
// Chrome/Safari workaround
						if(navigator.userAgent.search(/AppleWebKit/) !== -1)
							that.dlg.css({ overflow: 'hidden' });
///////////////////////////
						if('function' == typeof that.options.dialog.open)
							that.options.dialog.open.apply(this, arguments);
					},
					resizeStop: function (ev, ui) {
						var h = 0;
						that.ifr
							.parent()
							.siblings()
							.each(function() { h += this.clientHeight; });
								tinyMCE.DOM.setStyle(that.ifr[0], 'height', '' + (that.dlg[0].clientHeight - 6 - h) + 'px');
								tinyMCE.DOM.setStyle(that.ifr[0], 'width', '' + (that.dlg[0].clientWidth - 2) + 'px');
					}
				}));

			this.element.tinymce($.extend({}, this.options.tinymce, {
				save_onsavecallback: function(ed) {
					if('function' == typeof that.options.save) {
						that.options.save(ed.getContent());
						return true;
					}
					return false;
				},
				init_instance_callback: function(ed) {
					that.mce = ed;
					that.container = ed.getContainer();
					that.win = ed.getWin();
					that.ifr = $("#"+ed.id+"_ifr", that.container);

// firefox workaround
					if(navigator.userAgent.search(/AppleWebKit/) === -1)
						$(that.win)
							.on('resize', function() {
								that.dlg.dialog('widget').css({ width: '', height: '' });
							});
/////////////////////

					$(that.win)
						.on('focus', function() {
							that.dlg.dialog('moveToTop');
						});

					if('function' == typeof that.options.load)
						that.options.load(function(data) {
							ed.setContent(data);
						});
				},
			}));
		},
		editor: function() {
			return this.mce;
		},
		dialog: function() {
			if(arguments.length)
				this.dlg.dialog.apply(this.dlg, arguments);
			else return this.dlg;
		}
	});
})(jQuery);
