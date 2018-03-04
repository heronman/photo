(function($) {

$.widget("val.splitview", {
	options: {
		width: 400,
		height: 400,
		ratio: [ 0.3, 0.7 ],
		splitter: { width: 1, space: 2 }
	},
	__adjustRatio: function() {
		let wd = 0;
		let that = this;
		this.element.children('.ui-splitview-pane')
			.each(function() {
				wd += $(this).width();
			}).each(function(index) {
				that.options.ratio[index] = $(this).width() / wd;
			});
		this._trigger('redeem');
	},
	__setWidth: function() {
		let that = this;
		let diff = 0;
		let wdacc = 0;
		let vwd = [];
		let width = this.element.width();
		this.element.children('.ui-splitview-pane,.ui-splitview-splitter').each(function() {
			diff += $(this).outerWidth();
			if($(this).hasClass('ui-splitview-pane'))
				diff -= $(this).width();
		}).filter('.ui-splitview-pane').children('.ui-splitview-content').each(function(index) {
			let wd = (width - diff) * that.options.ratio[index];
			if((wdacc + wd) > (width - diff)) wd = (width - diff) - wdacc;
			wdacc += wd;
			$(this).width(wd);
		});
	},
	__setHeight: function() {
		let height = this.element.height();
		let that = this;
		this.element.children('.ui-splitview-pane,.ui-splitview-splitter').each(function() {
			let e = $(this);
			let diff = e.outerHeight() - e.height();
			if(e.hasClass('ui-splitview-pane')) e = e.children('.ui-splitview-content');
			e.height(height - diff);
		});
	},
	adjust_size: function() {
		this.__setHeight();
		this.__setWidth();
		this._trigger('resize');
		return this.element;
	},
	size: function(wd, ht) {
		wd = Math.round(wd);
		ht = Math.round(ht);
		this.element.width(wd);
		this.element.height(ht);
		this.adjust_size();
		return this.element;
	},
	width: function() {
		if(!arguments.length) return this.element.width();
		let wd = arguments[0];
		if(typeof wd == 'string') wd = parseInt(wd);
		if(typeof wd != 'number') return this.element.width();
		this.element.width(Math.round(wd));
		this.adjust_size();
		return this.element;
	},
	height: function() {
		if(!arguments.length) return this.element.height();
		let ht = arguments[0];
		if(typeof ht == 'string') ht = parseInt(ht);
		if(typeof ht != 'number') return this.element.height();
		this.element.height(Math.round(ht));
		this.adjust_size();
		return this.element;
	},
	pane: function(n) {
		return this.element.children(".ui-splitview-pane:eq("+n+")").children(".ui-splitview-content");
	},
	_create: function() {
		let that = this;

		let boxcount = this.element.children().length;
		let rsum = 0.0;
		for(let i = 0;i < this.options.ratio.length;i++) rsum += this.options.ratio[i];
		for(let i = 0;i < this.options.ratio.length;i++) this.options.ratio[i] /= rsum;
		for(let i = this.options.ratio.length;i < boxcount;i++) this.options.ratio.push(0);
		for(let i = boxcount;i < this.options.ratio.length;i++) this.element.append("<div></div>");

		this.element
			.addClass('ui-splitview')
			.contents()
			.filter(function() { return this.nodeType === 3; })
				.remove().end() // remove text nodes between panes
			.attr('style', null) // cleanup element styles
			.addClass('ui-splitview-content')
			.filter(":not(:last)") // append splitter after each pane except last one
				.after($("<div>").addClass('ui-splitview-splitter')).end()
			.wrap($("<div>").addClass('ui-splitview-pane'));
		this.element.width(this.options.width).height(this.options.height);
		this.__setHeight();
		this.__setWidth();
		this._trigger('resize');

		this.element.children('.ui-splitview-splitter').draggable({
			axis: 'x',
			containment: "parent",
			revert: true,
			revertDuration: 0,
			helper: function(ev) { return $("<div>").hide(); },
			cursor: "col-resize",
			start: function() {
				let left = $(this).prev().children('.ui-splitview-content');
				let right = $(this).next().children('.ui-splitview-content');
				that.__drag = {
					leftSibling: left,
					leftWD: left.width(),
					rightSibling: right,
					rightWD: right.width()
				}
			},
			stop: function() { that.__drag = null; },
			drag: function(ev, ui) {
				let offset = ui.position.left - ui.originalPosition.left;
				if(!that.hasOwnProperty('__drag') || that.__drag === null) {
					console.error('dragStartWd is undefined while dragging');
					return;
				}
				if(
					that.__drag.leftWD + offset <= 0
					|| that.__drag.rightWD - offset <= 0
				) return;
				that.__drag.leftSibling.width(that.__drag.leftWD + offset);
				that.__drag.rightSibling.width(that.__drag.rightWD - offset);
				that.__adjustRatio();
				that._trigger('resize');
			}
		});
	}
});
})(jQuery);
