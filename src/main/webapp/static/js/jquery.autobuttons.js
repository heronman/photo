(function($) {
    function parseBool (val) {
        if ('string' === typeof val)
            return val === 'true';
        else
            return !!val;
    }

    $.widget("ui.autoButton", $.ui.button, {
        _create: function() {
            if(this.element.attr('label') !== undefined) this.options.label = this.element.attr('label');
            if(this.element.attr('icon') !== undefined) this.options.icons.primary = this.element.attr('icon');
            if(this.element.attr('icon_primary') !== undefined) this.options.icons.primary = this.element.attr('icon_primary');
            // if(this.element.attr('icon_secondary') !== undefined) this.options.icons.secondary = this.element.attr('icon_secondary');
            if(this.element.attr('text') !== undefined) this.options.text = parseBool(this.element.attr('text'));

            if(this.element[0].nodeName !== 'INPUT' || this.element.attr('type') !== 'checkbox') {
                this._super();
                return;
            }

            let id = this.element.uniqueId().attr('id');
            if(!$("label[for=\""+id+"\"]").length) $("<label>").attr('for', id).insertBefore(this.element);

            if(this.element.attr('label_checked') !== undefined) this.options.label_checked = this.element.attr('label_checked');
            if(this.element.attr('icon_checked') !== undefined) {
                if(this.options.icons_checked === undefined) this.options.icons_checked = { primary: this.element.attr('icon_checked'), secondary: null};
                else this.options.icons_checked.primary = this.element.attr('icon_checked');
            }
            if(this.element.attr('icon_checked_primary') !== undefined) {
                if(this.options.icons_checked === undefined) this.options.icons_checked = { primary: this.element.attr('icon_checked_primary'), secondary: null};
                else this.options.icons_checked.primary = this.element.attr('icon_checked_primary');
            }
            if(this.element.attr('icon_checked_secondary') !== undefined) {
                if(this.options.icons_checked === undefined) this.options.icons_checked = { primary: null, secondary: this.element.attr('icon_checked_secondary') };
                else this.options.icons_checked.secondary = this.element.attr('icon_checked_secondary');
            }

            this.options.icons_def = { primary: this.options.icons.primary, secondary: this.options.icons.secondary };
            this.options.label_def = this.options.label;

            if(this.element.prop('checked')) {
                if(this.options.icons_checked !== undefined)
                    this.options.icons = this.options.icons_checked;
                if(this.options.label_checked !== undefined)
                    this.options.label = this.options.label_checked;
            }

            this._super();
        },
        refresh: function() {
            if(this.element[0].nodeName !== 'INPUT' || this.element.attr('type') !== 'checkbox') {
                this._super();
                return;
            }

            if(this.element.attr('type') === 'checkbox') {
                if(this.element.prop('checked')) {
                    if(this.options.icons_checked !== undefined)
                        this.options.icons = this.options.icons_checked;
                    if(this.options.label_checked !== undefined)
                        this.options.label = this.options.label_checked;
                } else {
                    if(this.options.icons_checked !== undefined && this.options.icons_def !== undefined)
                        this.options.icons = this.options.icons_def;
                    if(this.options.label_def !== undefined)
                        this.options.label = this.options.label_def;
                }
                this._resetButton();
            }
            this._super();
        },
    });

    $.widget("val.autoButtonSet", {
        _create: function () {
            this.element.buttonset(this.options);
        },
        refresh: function() {
            let rtl = this.element.css( "direction" ) === "rtl";

            this.buttons = this.element.find( this.options.items )
                .filter( ":ui-button" )
                .autoButton( "refresh" )
                .end()
                .not( ":ui-button" )
                .autoButton()
                .end()
                .map(() => $( this ).autoButton( "widget" )[ 0 ])
                .removeClass( "ui-corner-all ui-corner-left ui-corner-right" )
                .filter( ":first" )
                .addClass( rtl ? "ui-corner-right" : "ui-corner-left" )
                .end()
                .filter( ":last" )
                .addClass( rtl ? "ui-corner-left" : "ui-corner-right" )
                .end()
                .end();

            let wd = 0;
            this.element.find('.ui-button').each(function() {
                wd += $(this).outerWidth();
            });
            this.element.css('display', 'inline-block').width(wd);
        },
    });

})(jQuery);
