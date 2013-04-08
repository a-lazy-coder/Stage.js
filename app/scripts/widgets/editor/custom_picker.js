/**
 * This is the multi-selector editor 'Double-Picker'
 *
 * It needs a 'src' option to get the available selections and a 'namespace'
 * to distinguish from other 'Drag-n-Drop' zones.
 *
 * 'src' can be of 3 types: (it talks to a data manager to resolve the src resource)
 * 1. data url; ['/api/Abc']
 * 2. module name; ['Abc']
 * 3. fieldname; ['fff'] which indicates a field on the same form. (without data-refreshing)
 *
 * After fetching data from the 'src', it will need to be filtered with what's already selected.
 * Only to highlight what's still available.
 *
 * Utilizing the 'Sortable' jQuery-UI interaction helper.
 *
 * @author Tim.Liu
 * @update 2013.04.07
 * 
 */
(function(){

    var DataEleView = Backbone.Marionette.ItemView.extend({
        template: '#custom-tpl-widget-editor-double-picker-item',
        tagName: 'li'
    });

    var DataListView = Backbone.Marionette.CollectionView.extend({
        itemView: DataEleView,
        tagName: 'ul',
        className: 'dnd-zone-list clear-margin-left',

        initialize: function(options){
            this.ns = options.ns;
        },

        onRender: function(){
            if(this.ns)
                this.$el.addClass('target-dnd-list-'+this.ns);
        }
    });

    var EditorView = Backbone.Marionette.Layout.extend({
        template: '#custom-tpl-widget-editor-double-picker',

        regions: {
            header: '.double-picker-header',
            footer: '.double-picker-footer',
            src: '.src-dnd-zone',
            target: '.target-dnd-zone'
        },

        initialize: function(options){
            this._options = options;
        },

        onRender: function(){
            this.reloadSrc();
        },

        reloadSrc: function(){
            var that = this;
            Application.DataCenter.resolve(this._options.dataSrc, this._options.form, function(data){
                //filtered with already selected data.
                var srcData = _.difference(_.pluck(data, that._options.valueField), that._options.selectedVal);

                that.src.show(new DataListView({
                    collection: new Backbone.Collection(srcData),
                    ns: that._options.dndNS,
                }));

                that.target.show(new DataListView({
                    collection: new Backbone.Collection(that._options.selectedVal),
                    ns: that._options.dndNS,
                }))

                //enable dnd
                that.$el.find('.dnd-zone-list').sortable({
                    connectWith: '.target-dnd-list-'+that._options.dndNS,
                    placeholder: 'dnd-item-placeholder',
                    //cursor: 'move',
                }).disableSelection();
            });
        },

        getValue: function(){
            //ToDo::
        }
    });


    Template.extend(
        'custom-tpl-widget-editor-double-picker-item',
        [
            '<span>{{valueOf}}</span>'
        ]
    );

    Template.extend(
        'custom-tpl-widget-editor-double-picker',
        [
            '<div class="double-picker-header"></div>',
            '<div class="double-picker-body row-fluid">',
                '<div class="src-dnd-zone dnd-zone span4 well"></div>',
                '<div class="between-dnd-zone span1"></div>',//for dnd indicator icons
                '<div class="target-dnd-zone dnd-zone span4 well"></div>',
            '</div>',
            '<div class="double-picker-footer"></div>',
        ]
    );


    Backbone.Form.editors['CUSTOM_PICKER'] = Backbone.Form.editors.Base.extend({

        //tagName: 'input',

        events: {
            'change': function() {
                // The 'change' event should be triggered whenever something happens
                // that affects the result of `this.getValue()`.
                this.trigger('change', this);
            },
            'focus': function() {
                // The 'focus' event should be triggered whenever an input within
                // this editor becomes the `document.activeElement`.
                this.trigger('focus', this);
                // This call automatically sets `this.hasFocus` to `true`.
            },
            'blur': function() {
                // The 'blur' event should be triggered whenever an input within
                // this editor stops being the `document.activeElement`.
                this.trigger('blur', this);
                // This call automatically sets `this.hasFocus` to `false`.
            }
        },

        initialize: function(options) {
            // Call parent constructor
            Backbone.Form.editors.Base.prototype.initialize.call(this, options);

            // Custom setup code.
            this._options = options.schema.options || options.schema;
        },

        render: function() {
            //this.setValue(this.value);
            this.delegatedEditor = new EditorView({
                form: this.form,
                selectedVal: this.value,
                dataSrc: this._options.dataSrc,
                dndNS: this._options.dndNS,
                valueField: this._options.valueField,
            });
            this.delegatedEditor.listenTo(this.form, 'close', this.delegatedEditor.close);
            this.$el.html(this.delegatedEditor.render().el);
        
            return this;
        },

        getValue: function() {
            //return this.$el.val();
            return this.delegatedEditor.getValue();
        },

        setValue: function(value) {
            //this.$el.val(value);
        },

        focus: function() {
            if (this.hasFocus) return;

            // This method call should result in an input within this edior
            // becoming the `document.activeElement`.
            // This, in turn, should result in this editor's `focus` event
            // being triggered, setting `this.hasFocus` to `true`.
            // See above for more detail.
            this.$el.focus();
        },

        blur: function() {
            if (!this.hasFocus) return;

            this.$el.blur();
        }
    });
})();