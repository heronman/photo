(function($) {

    let namespace = 'val';
    let treeWidgetName = 'treeview';
    let nodeWidgetName = 'treenode';

    let defaultTreeOptions = {
// object bindings
        autoRefresh: 10,

// general options
        allowHTML: true,
        collapsable: true,
        expanded: false,
        expandOnly: false,
        onClick: 'expand', // 'toggle', 'none'/null
        icons: true,

// compare nodes (sorting)
        compare: null,

// callbacks
        beforeExpand: null,
        beforeCollapse: null,
        beforeLoad: null,

// events
        expand: null,
        collapse: null,
        click: null,
        load: null
    };

// region private methods
    function extract(e) {
        if(e instanceof jQuery[namespace][treeWidgetName])
            return e;
        if(e instanceof jQuery[namespace][nodeWidgetName])
            return e;
        if('string' === typeof e || e instanceof Node)
            e = $(e);
        if (e instanceof jQuery) {
            return e.data(namespace + '-' + treeWidgetName)
                || e.data(namespace + '-' + nodeWidgetName);
        }
        return null;
    }

    function mknode(data, parent) {
        let node = null, options = { parent: parent };
        if(data instanceof jQuery || data instanceof Node || 'string' === typeof data) {
            node = $(data);
        } else if('object' === typeof data) {
            $.extend(options, data);
            node = $("<li>");
        } else $.error("Illegal argument");

        return node.data(namespace + '-' + nodeWidgetName)
            || node.treenode(options).data(namespace + '-' + nodeWidgetName);
    }

    let TreeviewCommons = {
        adjustOptions: function() {
            if(this.options.parent) {
                this.parent = extract(this.options.parent);
                if (this.parent instanceof jQuery[namespace][nodeWidgetName])
                    this.parent = this.parent.parent;
                else if (this.parent && !(this.parent instanceof jQuery[namespace][treeWidgetName])) {
                    console.warn("Unknown type of parent. Resetting parent to null");
                    this.parent = null;
                }
            } else {
                this.parent = this.parentTree().data(namespace + '-' + treeWidgetName);
            }
        },
        _getParentNode: function() { return this.parentNode().data(namespace+'-'+nodeWidgetName); },
        _getParentTree: function() { return this.parentTree().data(namespace+'-'+treeWidgetName); },
        _getRootTree: function() { return this.root().data(namespace+'-'+treeWidgetName); },
        __root: function() { return this.parent ? this.parent.__root() : this; },
        root: function() { return this.element.closest(':data('+namespace+'-'+treeWidgetName+'):not(.'+namespace+'-'+treeWidgetName+'-subtree)'); },
        parentTree: function() { return this.element.parent().closest(':data('+namespace+'-'+treeWidgetName+')'); },
        parentNode: function() { return this.element.parent().closest(':data('+namespace+'-'+nodeWidgetName+')'); },
        _subClass: function(name) { return this.widgetFullName + '-' + name; },
        _subElement: function(name) { return this.element.children('.' + this._subClass(name)); }
    };

    function makeId(tree) {
        function exists(id, obj) {
            if (obj instanceof jQuery[namespace][nodeWidgetName]) {
                if (obj.options.id === id)
                    return true;
                return exists(id, obj._getSubTree());
            } else if (obj instanceof jQuery[namespace][treeWidgetName]) {
                let nodes = obj.nodes();
                for (let i = 0; i < nodes.length; i++) {
                    if (exists(id, $(nodes[i]).data(namespace + '-' + nodeWidgetName)))
                        return true;
                }
                return false;
            } else {
                return false;
            }
        }

        let id = false;
        while(!id || exists(id, tree))
            id = '_' + Math.random().toString(36).substr(2);
        return id;
    }

// endregion private methods

// treenode
    $.widget(namespace + '.' + nodeWidgetName, $.extend(null, TreeviewCommons, {
        options: {
            id: null,
            label: null,
            folder: false
        },
        treeNodeData: {},
        loadedAt: 0,
        _create: function() {
            let self = this, data = null, items = null;

            this.adjustOptions();
            if (this.options.data)
                this.treeNodeData = this.options.data;
            if (this.options.items)
                items = this.options.items;
            delete this.options.parent;
            delete this.options.items;
            delete this.options.data;

            if(!this.option('collapsable'))
                this.options.expanded = true;
            let freetext = this.element.contents().filter(function() { return this.nodeType === 3; }).text().trim();
            this.element.contents().filter((i,e) => e.nodeType === 3 || e.nodeType === 8).remove();
            if(!this.element.children('span,a').length)
                this.element.prepend($("<span>").text(freetext));
            if (!this.options.id && this.options.id !== 0)
                this.options.id = makeId(this.__root());

            function optEvent(event, data) {
                if(event.target === event.currentTarget) {
                    let callback = self.option(event.type);
                    return typeof callback !== 'function'
                        || callback.call(this, event, data) !== false;
                }
            }

            this.element
                .on('select', optEvent)
                .on('load', optEvent)
                .on('mouseover mouseout click', '>.'+this._subClass('label')+', >.ui-icon', function(ev) {
                    if(ev.target === ev.currentTarget) {
                        switch (ev.type) {
                            case 'mouseover':
                                self.element.addClass(self._subClass('hover'));
                                break;
                            case 'mouseout':
                                self.element.removeClass(self._subClass('hover'));
                                break;
                            case 'click':
                                self._onClick();
                                break;
                        }
                    }
                    optEvent.call(this, ev);
                })
                .on('click', '>.'+this._subClass('hitarea'), null, function(ev) {
                    if(ev.target === ev.currentTarget
                        && self._trigger('toggle')
                    ) self._toggle();
                })
                .addClass(this.widgetFullName)
                .children('span,a').first()
                .addClass(this._subClass('label'))
                .end().end()
                .prepend(this.option('icons') ? $("<span class='ui-icon'>") : null)
                .prepend($("<div>").addClass(this._subClass('line')));

            if (!this.options.label) {
                this.options.label = this.options.allowHTML ?
                    this._subElement('label').html()
                    : this._subElement('label').text();
            }
            this._setOption('label', this.options.label);

            if (items)
                this._setOption('items', items);
            else if (this.options.folder)
                this.folder(this.options.folder);

            if(!this.option('collapsable'))
                this.element.addClass(this._subClass('static'));
            let subtree = this.element.children('ul').addClass(namespace + '-' + treeWidgetName + '-subtree');
            if (this.options.folder && !subtree.length)
                subtree = $("<ul>").addClass(namespace + '-' + treeWidgetName + '-subtree').appendTo(this.element);
            if (subtree.length) {
                if (!subtree.data(namespace+'-'+treeWidgetName))
                    subtree.treeview({ parent: this });
                if(this.option('collapsable')) {
                    $("<div>").addClass(this._subClass('hitarea')).prependTo(this.element);
                    if(!this.option('expanded'))
                        this.element.addClass(this._subClass('collapsed'));
                }
                if(this.option('expanded'))
                    this.expand(true);
            }
        },
        option: function(key, value) {
            let result = this._super.apply(this, arguments);
            if (arguments.length === 1 && typeof key === 'string' && result === null && this.parent)
                result = this.parent.option(key);
            return result;
        },
        _setOption: function(key, val) {
            switch (key) {
                case 'icons':
                    val = !!val;
                    if(!val)
                        this.element.children('.ui-icon').remove();
                    else if(!this.element.children('.ui-icon').length)
                        this.element.prepend('<span class="ui-icon"></span>');
                    this.element.find(':data('+nodeWidgetName+')').treenode('option', 'icons', val);
                    break;

                case 'collapsable':
                    this.collapsable(!!val);
                    break;

                case 'label':
                    if(!!val) {
                        if(this.option('allowHTML'))
                            this._subElement('label').html(val);
                        else
                            this._subElement('label').text(val);
                    }
                    break;

                case 'tooltip':
                    this._subElement('label').attr('title', val);
                    break;

                case 'items':
                    this.folder(!!val);
                    if(!!val)
                        this.subTree().treeview('option', 'items', val);
                    return;

                case 'folder':
                    this.folder(!!val);
                    break;

            }
            this._super(key, val);
        },
        _onClick: function() {
            let self = this;
            self.root()
                .find('.'+this.widgetFullName+'-selected').not(self.element)
                .removeClass(this.widgetFullName+'-selected');
            self.element.addClass(this.widgetFullName+'-selected').trigger('select');
            if(this.collapsable() && (
                    this.option('onClick') === 'toggle'
                    || this.option('onClick') === 'expand' && !this.expanded()
                ) && this._trigger('toggle')
            ) this._toggle();
        },
        _collapse: function(force) {
            if(!force && !this.option('collapsable')
                || !this.folder()
                || !this.element.hasClass(this.widgetFullName+'-expanded')
            ) return;
            if(!force && !this._trigger('collapse')) return;
            this.element
                .removeClass(this.widgetFullName+'-expanded')
                .addClass(this.widgetFullName+'-collapsed');
        },
        _expand: function(force) {
            if(!force && !this.option('collapsable')
                || !this.folder()
                || !this.element.hasClass(this.widgetFullName+'-collapsed')
            ) return;
            if(!force && !this._trigger('expand')) return;
            this.element
                .removeClass(this.widgetFullName+'-collapsed')
                .addClass(this.widgetFullName+'-expanded');
            if(this.option('expandOnly')) {
                this.element.siblings(':data('+this.widgetFullName+')')
                    .not(this.element)
                    .each(function() { $(this).treenode('collapse'); });
            }
            this._lazyLoad();
        },
        _toggle: function(force) {
            if(this.element.hasClass(this.widgetFullName+'-expanded'))
                this.collapse(force);
            else if(this.element.hasClass(this.widgetFullName+'-collapsed'))
                this.expand(force);
        },
        _lazyLoad: function(force) {
            if(force
                || !this.loadedAt
                || (this.option('autoRefresh') && (new Date()).getTime() - this.loadedAt >= this.option('autoRefresh') * 1000)) {
                let lazy = this.option('lazyLoad');
                if ($.isFunction(lazy)) {// function returning promise
                    let promise = lazy.call(this.element[0], this.treeNodeData);
                    if (promise && 'function' === typeof promise.then) {
                        promise.then(val => {
                                this.subTree().treeview('setItems', val);
                                this.loadedAt = (new Date()).getTime();
                                this.element.trigger('load', [ val ]);
                            },
                            () => this._trigger('ajaxerror', null, arguments));
                    } else if (promise) {
                        this.loadedAt = (new Date()).getTime();
                        this.element.trigger('load');
                    }
                }
            }
        },
        _getSubTree: function() { return this.subTree().data(namespace+'-'+treeWidgetName); },

        click: function() {
            this._subElement('label').trigger('click');
        },
        load: function() { this._lazyLoad(true); },
        expand: function() { this._expand(); return this.element; },
        collapse: function() { this._collapse(); return this.element; },
        expanded: function() { return this.element.hasClass(this._subClass('expanded')); },
        collapsed: function() { return this.element.hasClass(this._subClass('collapsed')); },
        collapsable: function(value) {
            if (this.folder()) {
                let collapsable = this.folder() && !this.element.hasClass(this._subClass('static'));
                if (arguments.length === 0)
                    return collapsable;
                value = !!value;
                if (collapsable !== value) {
                    if (!value) {
                        this._subElement('hitarea').remove();
                        this.element.addClass(this._subClass('static'));
                        if (this.element.hasClass(this._subClass('collapsed')))
                            this.expand(true);
                    } else {
                        this.element.prepend($('<div>').addClass(this._subClass('hitarea')))
                            .removeClass(this._subClass('static'));
                    }
                }
                this.subTree().treeview('option', 'collapsable', value);
            }
            return this.element;
        },
        compareTo: function(node2, caseSensitive, folders) {
            // this > node2 : 1
            // this < node2 : -1
            // this === node2 : 0
            node2 = extract(node2);
            if(!(node2 instanceof jQuery[namespace][nodeWidgetName]))
                $.error("Given argument is not a "+this.widgetName+" instance");
            if(arguments.length < 3 || folders === 'first' || folders === 'last') {
                let thisF = this.folder(), thatF = node2.folder();
                if(thisF && !thatF) return folders === 'last' ? 1 : -1;
                if(!thisF && thatF) return folders === 'last' ? -1 : 1;
            }
            if($.isFunction(this.option('compare'))) {
                let r = this.option('compare').call(this.element, node2.element);
                if('number' === typeof r && r >= -1 && r <= 1) return r;
                else console.error("custom node compare method has returned an illegal value: "+r);
            }
            let thisT = this.element.children('.'+this.widgetFullName+'-label').text();
            let thatT = node2.element.children('.'+this.widgetFullName+'-label').text();
            if(!caseSensitive){
                thisT = thisT.toLowerCase();
                thatT = thatT.toLowerCase();
            }
            if(thisT > thatT) return 1;
            if(thisT < thatT) return -1;
            return 0;
        },
        subTree: function() { return this.element.children(':data('+namespace+'-'+treeWidgetName+')'); },
        insertNode: function(node, position, anchor) {
            this.folder(true);
            return this._getSubTree().insertNode(node, position, anchor);
        },
        selectedNode: function() {
            return this.root()
                .find('.'+this.widgetFullName+'-selected');
        },
        children: function() {
            let subtree = this.subTree();
            if(!subtree.length) return null;
            return subtree.treeview('nodes');
        },
        isLoaded: function(v) {
            if(arguments.length) {
                if('boolean' === typeof v) {
                    if(v)
                        this.loadedAt = (new Date()).getTime();
                    else this.loadedAt = 0;
                } else if('number' === typeof v) {
                    this.loadedAt = v;
                }
            }
            return !!this.loadedAt;
        },
        folder: function(folder) {
            folder = !!folder;
            if(arguments.length) {
                let st = this.subTree();
                if(st.length && !folder) {
                    this.element
                        .removeClass(this._subClass('expanded'))
                        .removeClass(this._subClass('collapsed'));
                    this._subElement('hitarea').remove();
                    st.remove();
                } else if(!st.length && folder) {
                    this.element
                        .addClass(this._subClass('collapsed'))
                        .append($("<ul>").treeview({ parent: this }));
                    if(this.option('collapsable'))
                        this.element.prepend($('<div>').addClass(this._subClass('hitarea')));
                    else this.option('expanded', true);
                    if(this.option('expanded'))
                        this._expand(true);
                }
                return this.element;
            }
            return !!this.subTree().length;
        },
        _setDataField: function(name, value) {
            if (!value.length)
                return;
            switch (name) {
                case 'items':
                this.folder(true);
                let tree = this.subTree().empty();
                for(let i = 0;i < value.length;i++) {
                    let node = mknode(value[i], this);
                    if(!node) $.error("Error making node from ajax loaded data");
                    tree.treeview('insertNode', node);
                }
                break;
                case 'label':
                    if(value) {
                        if(this.option('allowHTML'))
                            this.element.children('.'+this.widgetFullName+'-label').html(value);
                        else
                            this.element.children('.'+this.widgetFullName+'-label').text(value);
                        this.treeNodeData[name] = value;
                    }
                    break;
                case 'folder':
                    this.folder(value);
                    break;
                default:
                    this.treeNodeData[name] = value;
            }
        },
        data: function(d1, d2, clean) {
            if(!arguments.length)
                return this.treeNodeData;

            if('string' === typeof d1) {
                if(arguments.length === 1)
                    return this.treeNodeData[d1];
                this._setDataField(d1, d2);
                return this.element;
            }

            if('object' === typeof d1) {
                if(clean)
                    this.treeNodeData = {};
                for(let name in d1)
                    if (d1.hasOwnProperty(name))
                        this._setDataField(name, d1[name]);
                return this.element;
            }
        }
    }));

    $.widget(namespace + '.' + treeWidgetName, $.extend({}, TreeviewCommons, {
        options: {},
        _create: function() {
            this.adjustOptions();
            if(!!this.parent)
                this.element.addClass(this._subClass('subtree'));
            else
                this.element.removeClass(this._subClass('subtree'));
            this.element.addClass(this.widgetFullName);
            if(this.items) {
                this.element.empty();
                for(let i = 0;i < this.items.length;i++)
                    this.element.append(mknode(this.items[i], this).element);
            } else this.element.children('li').treenode({ parent: this });

            if (this.options.items)
                this.addItems(this.options.items);

            this.refresh();
        },
        setItems: function(items) {
            this.element.empty();
            this.addItems(items);
        },
        addItems: function(items) {
            if (items instanceof Array) for (let i = 0; i < items.length; i++) {
                let node = mknode(items[i], this);
                if (!node)
                    $.error("Error making node from ajax loaded data");
                this.insertNode(node);
            }
        },
        option: function(key, value) {
            let result = this._super.apply(this, arguments);
            if (arguments.length === 1 && typeof key === 'string' && result === null && this.parent)
                result = this.parent.option(key);
            if (result === null && defaultTreeOptions.hasOwnProperty(key))
                return defaultTreeOptions[key];
            return result;
        },
        _setOption: function(key, val) {
            if (key === "items")
                this.setItems(val);
            this._super(key, val);
        },
        nodes: function() { return this.element.children(':data('+namespace+'-'+nodeWidgetName+')'); },
        selectedNode: function() {
            return this.root()
                .find('.'+namespace+'-'+nodeWidgetName+'-selected');
        },

        refresh: function() {
            this.element.children(':data('+namespace+'-'+nodeWidgetName+')')
                .removeClass(namespace+'-'+nodeWidgetName+'-last')
                .last().addClass(namespace+'-'+nodeWidgetName+'-last');
        },

        sort: function() {
            this.nodes().each(function(idx, e) {
                let prev;
                let $this = $(this);
                while((prev = $this.prev()).length && $this.treenode('compareTo', prev) < 0)
                    $this.insertBefore(prev);
            });

            this.refresh();
            return this.element;
        },

        insertNode: function(node, position, anchor) {
            if(!(node instanceof jQuery[namespace][nodeWidgetName])) {
                let e = extract(node);
                if(!e) {
                    if (node instanceof Node)
                        e = extract($(node).treenode({ parent: this }));
                    else if (typeof node === 'object')
                        e = extract(mknode(node, this));
                }
                if(!(e instanceof jQuery[namespace][nodeWidgetName]))
                    $.error("Can not extract "+nodeWidgetName+" from given arg");
                node = e;
            }
            if(position === 'before' || position === 'after') {
                if(!anchor) position = 'last';
                else {
                    anchor = extract(anchor);
                    if(!(anchor instanceof jQuery[namespace][nodeWidgetName]))
                        $.error("Invalid anchor node for inserting "+position);
                }
            } else if(!position) position = 'last';
            switch(position) {
                case 'first':
                    this.element.prepend(node.element);
                    break;

                case 'last':
                    this.element.children(':data('+namespace+'-'+nodeWidgetName+')');
                    this.element.append(node.element);
                    break;

                case 'sort': default:
                let done = false;
                this.nodes().not(node.element).each(function() {
                    if(node.compareTo(this) < 0) {
                        node.element.insertBefore(this);
                        done = true;
                        return false;
                    }
                });
                if(!done) this.element.append(node.element);
                break;

                case 'before':
                    anchor.element.before(node.element);
                    break;

                case 'after':
                    anchor.element.after(node.element);
                    break;
            }
            this.refresh();
            return node.element;
        }
    }));

})(jQuery);