/**
 * Widget/Editor registry. With a regFacotry to control the registry mech.
 *
 * Important
 * =========
 * Use create() at all times if possible, use get()[deprecated...] definition with caution, instantiate only 1 instance per definition.
 * There is something fishy about the initialize() function (Backbone introduced), events binding only get to execute once with this.listenTo(), if multiple instances of a part
 * listens to a same object's events in their initialize(), only one copy of the group of listeners are active.
 * 
 *
 * @author Tim.Liu
 * @create 2013.11.10
 * @update 2014.03.03
 */

(function(app){

	function makeRegistry(regName){
		regName = _.string.classify(regName);
		var manager = app.module('Core.' + regName);
		_.extend(manager, {

			map: {},
			has: function(name){
				if(!_.isString(name) || !name) throw new Error('DEV::Application.editor::You must specify the name of the ' + regName + ' to look for.');
				if(this.map[name]) return true;
				return false;
			},
			register: function(name, factory){
				if(!_.isString(name) || !name) throw new Error('DEV::Application.editor::You must specify a ' + regName + ' name to register.');
				if(this.has(name))
					console.warn('DEV::Overriden::' + regName + '.' + name);
				this.map[name] = factory();
				this.map[name].prototype.name = name;
			},

			create: function(name, options){
				if(!_.isString(name) || !name) throw new Error('DEV::Application.editor::You must specify the name of the ' + regName + ' to create.');
				if(this.has(name))
					return new (this.map[name])(options);
				throw new Error('DEV::' + regName + '.Registry:: required definition [' + name + '] not found...');
			},

			get: function(name){
				if(!name) return _.keys(this.map);
				return this.map[name];
			}

		});

		return manager;

	}

	makeRegistry('Widget');
	makeRegistry('Editor');

})(Application);