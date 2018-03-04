(function($) {
$.widget("val.treebrowser", $.ui.dialog, {
	options: {
		width: 400,
		height: 400,
		ratio: [ 0.3, 0.7 ],
		expanded: false,
		expandOnClick: false,
		unique: true,
		click: null,
		toggle: null,
		expand: null,
		collapse: null,
		staticRoot: null,
        treeview: {}
	},
	_create: function() {
		let that = this;
		this.nextUID = 1;

/*		this.element.on('treebrowseropen', function () {
			$(".ui-splitview", this).splitview('size', $(this).width(), $(this).height());
		}).on('treebrowserresize', function () {
			$(".ui-splitview", this).splitview('size', $(this).width(), $(this).height());
		});
*/
		this._super();
		this.uiSplitview = $("<div>").appendTo(this.element.empty().css('overflow', 'hidden')).splitview({
			width: this.element.width(),
			height: this.element.height(),
			ratio: this.options.ratio
		});

		this.element.on('treebrowseropen', function () {
			$(".ui-splitview", this).splitview('size', $(this).width(), $(this).height());
		}).on('treebrowserresize', function () {
			$(".ui-splitview", this).splitview('size', $(this).width(), $(this).height());
		});

		this.uiTreeview = $("<ul>")
			.appendTo(this.uiSplitview.splitview('pane', 0))
/*			.on('treenodeexpand treenodecollapse treenodeclick '
				+'treenodeajaxerror treenodeajaxsuccess treenodeajaxprepare',
				function(ev, node) {
					ev.stopImmediatePropagation();
					that._trigger(ev.type.replace(/^treenode(.*)$/, "$1"), ev, arguments);
console.info("Event: "+ev.type);
//					let data = that.uiTreeview.treeview('data', node);
//					let args = [ node, that.uiTreeview ];
//					that._trigger(ev.type.replace(/^treenode(.*)$/, "$1"), ev, args);
				}
			)
*/			.treeview(this.options.treeview);

		if(this.options.staticRoot) {
			if(!this.options.staticRoot.hasOwnProperty('name'))
				this.options.staticRoot.name = '(root)';
			if(!this.options.staticRoot.hasOwnProperty('id'))
				this.options.staticRoot.id = 0;
			this.options.staticRoot.isFolder = true;
		}
		//////////////
		this.uiRightPane = $(".ui-splitview > .ui-splitview-pane:eq(1) > .ui-splitview-content", this.element);
	},
	treeview: function() {
		let r = this.uiTreeview.treeview.apply(this.uiTreeview, arguments);
		if(r === undefined)
			return $(this.element);
		return r;
	},
	treePane: function() { return this.uiTreeview; },
	rightPane: function() { return this.uiRightPane; },
	selectedNode: function() {
//		debugger;
		return this.uiTreeview.treeview('selectedNode');
	},
});

})(jQuery);
