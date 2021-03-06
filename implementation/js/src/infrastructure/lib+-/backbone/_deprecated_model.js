/**
 * This is the Backbone.Model enhancements.
 *
 * 1. +bindToEntity/getEntityName to hookup with default RESTful api url
 * 2. +load() [mirroring fetch() only] to be consistent with collections load() method.
 *
 * @author Tim.Liu
 * @created 2013.12.12
 */

_.extend(Backbone.Model.prototype, {
	//Default Backbone.Model idAttribute to '_id'
	idAttribute: '_id',

	bindToEntity: function(entity){
		if(!this.getEntityName)
			this._entity = entity;
		else
			throw new Error('DEV::Enhancement.Collection::You have already bound this model to entity ' + this.getEntityName());

		this.getEntityName = function(){
			return this._entity;
		};

		return this;
	},

	load: function(){
		return this.fetch(options);
	}	
});
