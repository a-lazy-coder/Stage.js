/**
 * Here we extend the html tag attributes to be auto-recognized by a Marionette.View.
 * This simplifies the view creation by indicating added functionality through template string. (like angular.js?)
 *
 * Disable
 * -------
 * Pass in this.ui or options.ui or a function as options to return options to bypass the Fixed enhancement.
 * 	
 * Optional
 * --------
 * 1. action tags auto listener hookup with mutex-locking on other action listeners. (this.un/lockUI(no param) and this.isUILocked(no param))
 * 	  	[do not use param in this.un/lockUI() and this.isUILocked() with the current impl since they will be simplified further]
 * 2. tooltip
 * 3. overlay - use this view as an overlay
 * 
 *
 * Fixed
 * -----
 * auto ui tags detect and register.
 * +meta event programming
 * 	view:* (event-name) - on* (camelized)
 *
 * 
 * @author Tim.Liu
 * @create 2014.02.25 
 */


;(function(app){


/**
 * Action Tag listener hookups +actions{} (do it in initialize())
 * + event forwarding ability to action tags
 * Usage:
 * 		1. add action tags to html template -> e.g <div ... action="method name or *:event name"></div> 
 * 		2. implement the action method name in UI definition body's actions{} object. 
 * 		functions under actions{} are invoked with 'this' as scope (the view object).
 * 		functions under actions{} are called with a 2 params ($action, e) which is a jQuery object referencing the action tag and the jQuery prepared event object, use e.originalEvent to get the DOM one.
 *
 * Options
 * -------
 * 1. uiName - [UNKNOWN.View] this is optional, mainly for better debugging msg;
 * 2. passOn - [false] this is to let the clicking event of action tags bubble up if an action listener is not found. 
 *
 * Note:
 * A. We removed _.bind() altogether from the enableActionTags() function and use Function.apply(scope, args) instead for listener invocation to avoid actions{} methods binding problem.
 * Functions under actions will only be bound ONCE to the first instance of the view definition, since _.bind() can not rebind functions that were already bound, other instances of
 * the view prototype will have all the action listeners bound to the wrong view object. This holds true to all nested functions, if you assign the bound version of the function back to itself
 * e.g. this.nest.func = _.bind(this.nest.func, this); - Do NOT do this in initialize()/constructor()!! Use Function.apply() for invocation instead!!!
 *
 * B. We only do e.stopPropagation for you, if you need e.preventDefault(), do it yourself in the action impl;
 */
	_.extend(Backbone.Marionette.View.prototype, {

		enableActionTags: function(uiName, passOn){ //the uiName is just there to output meaningful dev msg if some actions haven't been implemented.
			this.enableUILocks();

			if(_.isBoolean(uiName)){
				passOn = uiName;
				uiName = '';
			}
			passOn = passOn || false;
			this.events = this.events || {};
			//add general action tag clicking event and listener
			_.extend(this.events, {
				'click [action]': '_doAction'
			});
			this.actions = this.actions || {}; 	
			uiName = uiName || this.name || 'UNKNOWN.View';

			this._doAction = function(e){
				if(this.isUILocked()) {
					e.stopPropagation();
					e.preventDefault();
					return; //check on the general lock first (not per-region locks)
				}
				var $el = $(e.currentTarget);
				var action = $el.attr('action') || 'UNKNOWN';

				//allow triggering certain event only.
				var eventForwarding = action.split(':');
				if(eventForwarding.length >= 2) {
					eventForwarding.shift();
					e.stopPropagation(); //Important::This is to prevent confusing the parent view's action tag listeners.
					return this.trigger(eventForwarding.join(':'));
				}

				var doer = this.actions[action];
				if(doer) {
					e.stopPropagation(); //Important::This is to prevent confusing the parent view's action tag listeners.
					doer.apply(this, [$el, e]); //use 'this' view object as scope when applying the action listeners.
				}else {
					if(passOn){
						return;
					}else {
						e.stopPropagation(); //Important::This is to prevent confusing the parent view's action tag listeners.
					}
					throw new Error('DEV::' + (uiName || 'UI Component') + '::You have not yet implemented this action - [' + action + ']');
				}
			};		
		},

			
	});


	/**
	* UI Locks support
	* Add a _uilocks map for each of the UI view on screen, for managing UI action locks for its regions
	* Also it will add in a _all region for locking the whole UI
	* Usage: 
	* 		1. lockUI/unlockUI([region], [caller])
	* 		2. isUILocked([region])
	*/
	_.extend(Backbone.Marionette.View.prototype, {
		//only for layouts
		enableUILocks: function(){
			//collect valid regions besides _all
			this._uilocks = _.reduce(this.regions, function(memo, val, key, list){
				memo[key] = false;
				return memo;
			}, {_all: false});

			//region, caller are optional
			this.lockUI = function(region, caller){
				region = this._checkRegion(region);

				caller = caller || '_default_';
				if(!this._uilocks[region]){ //not locked, lock it with caller signature!
					this._uilocks[region] = caller;
					return true;
				}
				if(this._uilocks[region] === caller) //locked by caller already, bypass.
					return true;
				//else throw error...since it is already locked, by something else tho...
				throw new Error('DEV::View::UI Locks::This region ' + region + ' is already locked by ' + this._uilocks[region]);
			};

			//region, caller are optional
			this.unlockUI = function(region, caller){
				region = this._checkRegion(region);

				caller = caller || '_default_';
				if(!this._uilocks[region]) return true; //not locked, bypass.
				if(this._uilocks[region] === caller){ //locked by caller, release it.
					this._uilocks[region] = false;
					return true;
				}
				//else throw error...
				throw new Error('DEV::View::UI Locks::This region ' + region + ' is locked by ' + this._uilocks[region] + ', you can NOT unlock it with ' + caller);
			};

			this.isUILocked = function(region){
				region = this._checkRegion(region);

				return this._uilocks[region];
			};

			//=====Internal Workers=====
			this._checkRegion = function(region){
				if(!this._uilocks) throw new Error('DEV::View::You need to enableUILocks() before you can use this...');

				if(!region)
					region = '_all';
				else
					if(!this.regions || !this.regions[region])
						throw new Error('DEV::View::UI Locks::This region does NOT exist - ' + region);
				return region;
			};
			//=====Internal Workers=====		
		}				

	});




	/**
	 * Enable Tooltips (do it in initialize())
	 * This is used for automatically activate tooltips after render
	 *
	 * Options
	 * -------
	 * bootstrap tooltip config
	 */

	_.extend(Backbone.Marionette.View.prototype, {

		enableTooltips: function(options){
			this.listenTo(this, 'render', function(){
				//will activate tooltip with specific options object - see /libs/bower_components/bootstrap[x]/docs/javascript.html#tooltips
				this.$('[data-toggle="tooltip"]').tooltip(options);
			});
		}

	});


	/**
	 * Fixed enhancement
	 * +auto ui tags detection and register
	 * +meta event programming
	 * 	view:* (event-name) - on* (camelized)
	 *
	 * Override View.constructor to affect only decendents, e.g ItemView and CollectionView... (This is the Backbone way of extend...)
	 * 
	 */
	Backbone.Marionette.View.prototype.constructor = function(options){
		options = options || {};

		//fix default tpl to be ' '.
		this.template = options.template || this.template || ' ';

		//auto ui pick-up after render (to support dynamic template)
		this._ui = _.extend({}, this.ui, options.ui);
		this.listenTo(this, 'render', function(){
			var that = this;
			this.unbindUIElements();
			this.ui = this._ui;
			$(this.el.outerHTML).find('[ui]').each(function(index, el){
				var ui = $(this).attr('ui');
				that.ui[ui] = '[ui="' + ui + '"]';
			});
			this.bindUIElements();
		});

		//meta-event programming ability
		app.Util.addMetaEvent(this, 'view');
		//auto detect and enable view enhancements: actions, [paper(SVG), editors - in item-view enhancement]
		if(this.actions) this.enableActionTags(this.actions._bubble);
		if(this.editors && this.activateEditors) this.listenTo(this, 'render', function(){
			this.activateEditors(this.editors);
		});
		if(this.svg && this.enableSVG) {
			this.listenTo(this, 'render', this.enableSVG);
		}
		if(this.tooltips) {
			this.enableTooltips(this.tooltips);
		}
		if(this.overlay){ //give this view the overlaying ability
			this._overlayConfig = _.isBoolean(this.overlay)? {}: this.overlay;
			this.overlay = function(options){
				/**
				 * options:
				 * 1. anchor - css selector of parent html el
				 * 2. rest of the $.overlay plugin options without content and onClose
				 */
				options = options || {};
				var $anchor = $(options.anchor || 'body');
				var that = this;
				this.listenTo(this, 'close', function(){
					$anchor.overlay();//close the overlay if this.close() is called.
				});
				this.render().trigger('view:show');
				$anchor.overlay(_.extend(this._overlayConfig, options, {
					content: this.el,
					onClose: function(){
						that.close(); //closed by overlay x
					}
				}));
				return this;
			};
		}

		return Backbone.Marionette.View.apply(this, arguments);
	};


})(Application);