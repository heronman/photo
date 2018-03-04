$(function() {
	var eventCounter = 0;

	function imagePicker(mceCallback, value, meta) {
		imageManager({
			mode: 'picker',
			callback: function(img) {
				if(!img) return;
				mceCallback('/storage/?id='+img.id, {
					alt: img.title,
					width: img.width,
					height: img.height
				});
			},
			dialog: {
				dialogClass: 'over-mce-modal',
				autoOpen: true,
				modal: true,
				close: function() {
					$(this).treebrowser('destroy');
				}
			}
		});
	}

	function eventLog(ev) {
		eventCounter++;
		var t = "#"+eventCounter+" ["+(new Date()).toLocaleString()+"] "+ev.type;
		if(ev.type == 'execcommand') t += ": "+ev.command;
		top.console.info(t);
	}

	$("body").delegate("input.filter-digit[type=\"text\"]", "keypress", function(ev) {
		if(ev.charCode >= 0x20 && (ev.charCode < 0x30 || ev.charCode > 0x39)) return false;
	}).delegate("input[type=\"text\"][filter]", "keypress", function(ev) {
		if(ev.charCode < 0x20) return true;
		var filter = $(this).attr('filter');
		var l = filter.length;
		for(var i = 0;i < l;i++) if(ev.charCode == filter.charCodeAt(i)) return true;
		return false;
	});
	$(".jqbutton").button();
	$(".jqautobutton").autoButton();

	$("#main-menu").menu();
	$("#main-menu a").click(function() {
		var selector = $(this).attr('dlg');
		var dlg = $(selector);
		var activate = dlg.data('activate');
		if(typeof activate == 'function')
			activate.call(dlg[0]);
		return false;
	});

	var imgManager = imageManager({ link : "photo/" })
		.addClass('imagebrowser-main')
		.data('activate', function() {
			imgManager.treebrowser('open').treebrowser('moveToTop');
		});

	$("a.call-static-editor").click(function() {
		var $this = $(this);
		var section = $this.attr('href');
		var widget = $("textarea.mcedialog."+section);
		if(widget.length) {
			widget.mcedialog('dialog', 'open')
				.mcedialog('dialog', 'moveToTop');
			return;
		}
		var title = $this.attr('title');
		widget = $("<textarea>").addClass('mcedialog').addClass(section).mcedialog({
			load: function(callback) {
				$.get('/admin/static/' + section, callback);
//				ajaxEx({
//					section: 'static/',
//					data: { cmd: 'read', doc: section },
//					success: function(data) { callback(data.content); }
//				});
			},
			save: function(data) {
				ajaxEx({
					section: 'static/',
					data: { doc: section, cmd: 'save', content: data },
				});
			},
			dialog: {
				title: title,
			},
			tinymce: {
				resize: false,
				content_css : "/media/css/common.css",
				file_picker_callback: imagePicker,
				file_picker_types: 'image',
				image_advtab: true,
			}
		});

		return false;
	});
});
