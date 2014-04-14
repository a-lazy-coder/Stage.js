/**
 * This is the web project resource management script.
 * It performs one of the following types of build:
 * 
 * 1. per lib customized build, since some of the libs comes in scattered src
 * 2. combined libs as dependencies.js (with bower libs map prep: load-lib-map)
 * 
 */

var buildify = require('buildify'),
path = require('path'),
fs = require('fs'),
ncp = require('ncp').ncp,
colors = require('colors'),
_ = require('underscore'),
json = require('json3');
_.str = require('underscore.string');

ncp.limit = 16;

/*!!!!!Change this if .bowerrc changes!!!!!*/
var distFolder = '../../implementation/js/lib',
libBase = '../../implementation/bower_components';


buildify.task({
	name: 'fix-libs',
	depends: ['uri-js', 'jquery-file-upload', 'jquery-ui', 'min'],
	task: function(){}
});

/**
 * =======================================
 * Per Bower/Custom Lib Specifics (combine, minify)
 * =======================================
 */

buildify.task({
	name: 'uri-js',
	task: function(){
		buildify()
			.setDir(libBase + '/uri.js/src')
			.concat(['URI.js', 'IPv6.js', 'SecondLevelDomains.js', 'punycode.js', 'URITemplate.js', 'jquery.URI.js', 'URI.fragmentURI.js'])
			.save('../dist/uri.js');
			// .uglify()
			// .save('../dist/uri.min.js');
	}
});

buildify.task({
	name: 'jquery-file-upload',
	task: function(){
		buildify()
			.setDir(libBase + '/jquery-file-upload/js')
			.concat(['jquery.iframe-transport.js', 'jquery.fileupload.js'])
			.save('../dist/jquery-file-upload-with-iframe.js');
			// .uglify()
			// .save('../dist/jquery-file-upload-with-iframe.min.js');
	}
});

buildify.task({
	name: 'jquery-ui',
	task: function(){
		buildify()
			.setDir(libBase + '/jquery-ui/ui')
			.concat(['jquery.ui.core.js', 'jquery.ui.widget.js', 'jquery.ui.mouse.js', 'jquery.ui.position.js', 'jquery.ui.draggable.js', 'jquery.ui.droppable.js', 'jquery.ui.resizable.js', 'jquery.ui.selectable.js', 'jquery.ui.sortable.js', 'jquery.ui.effect.js', 'jquery.ui.effect-blind.js', 'jquery.ui.effect-bounce.js', 'jquery.ui.effect-clip.js', 'jquery.ui.effect-drop.js', 'jquery.ui.effect-explode.js', 'jquery.ui.effect-fade.js', 'jquery.ui.effect-fold.js', 'jquery.ui.effect-highlight.js', 'jquery.ui.effect-pulsate.js', 'jquery.ui.effect-scale.js', 'jquery.ui.effect-shake.js', 'jquery.ui.effect-slide.js', 'jquery.ui.effect-transfer.js'])
			.save('../dist/jquery-no-widget-ui.js')
			.setDir(libBase + '/jquery-ui/themes/base')
			.setContent('')
			.concat(['jquery.ui.core.css', 'jquery.ui.resizable.css', 'jquery.ui.selectable.css'])
			.save('../../dist/jquery-no-widget-ui.css');
	}

});

buildify.task({
	name: 'min',
	task: function(){
		var config = {
			'modernizr': 'modernizr.js'
		};

		_.each(config, function(js, pack){
			buildify().setDir([libBase, pack].join('/')).load(js).uglify().save([path.basename(js, '.js'), 'min', 'js'].join('.'));
		})
	}
});


/**
 * =======================================
 * Core/Base Libs (combine, minify)
 * Used as a base for new projects.
 * =======================================
 */
//----------------Workers--------------------
var libMap = {};
function combine(list, name){
	var target = buildify().setContent(';');
	var versions = {
		created: new Date().toGMTString(),
		list: []
	};
	_.each(list, function(lib){
		if(libMap[lib]) {
			var bowerInfo, packageInfo;
			try {
				bowerInfo = require('./' + libBase + '/' + lib + '/.bower.json');
			}catch (e){
				try {
					bowerInfo = require('./' + libBase + '/' + lib + '/bower.json');
				}catch(e) {
					bowerInfo = {version: 'N/A'};
				}
			}
			try {
				packageInfo = require('./' + libBase + '/' + lib + '/package.json');
			}catch (e){
				packageInfo = {};
			}

			versions.list.push({name: lib, version: bowerInfo.version, url: bowerInfo.homepage || packageInfo.homepage || (packageInfo.repository && packageInfo.repository.url)});
			console.log(lib.yellow, bowerInfo.version.green, '[', libMap[lib].grey, ']');
			
		}
		else {
			console.log(lib, ('not found! ' + libMap[lib]).red);
			return;
		}
		target.concat(libMap[lib]);
	});
	console.log('libs (selected/available):', (_.size(list) + '/' + String(_.size(libMap))).green, '[', ((_.size(list)/_.size(libMap)*100).toFixed(2) + '%').yellow, ']');
	//dump selected lib name, version to selected.json
	buildify().setContent(json.stringify(versions)).setDir(distFolder).save('selected.json');
	//dump un-selected libs into a bower.more.json
	var unselected = require('./bower.json').dependencies;
	buildify().setContent(json.stringify(_.extend(require('./bower.more.json'), { dependencies: unselected }))).setDir(distFolder).save('bower.more.json');
	target.setDir(distFolder).save(name + '.js').uglify().save(name + '.min.js');
	
};
//-------------------------------------------

buildify.task({
	name: 'load-lib-map',
	task: function(){
		var map = require('./map.json'), fix = require('./map-fix.json');
		var libs = _.keys(map);
		function check(path){
			if(!/\.js$/.test(path)) return false;
			return path;
		}
		//1. fix lib name-file map
		_.each(libs, function(lib){

			if(_.isArray(map[lib])){ //map path is an array.
				_.each(map[lib], function(f){
					if(libMap[lib]) return;
					var reg = new RegExp(lib + '\.js$');
					if(reg.test(f)) libMap[lib] = f; //select one from group.
				});
				
			}

			//now libMap[lib] may or may not be a single string path			
			if(fix[lib])
				//reset to lib's root folder
				libMap[lib] = [libBase, lib, fix[lib]].join('/');
			else
				//use map path
				libMap[lib] = _.isArray(map[lib])? libMap[lib] : map[lib];

			if(!libMap[lib]) {
				delete libMap[lib];
				return; //skip this lib
			}
			//final fix on the lib js path
			if(!check(libMap[lib])) libMap[lib] += '/' + lib;
			if(!check(libMap[lib])) libMap[lib] += '.js';
			if(!_.str.startsWith(libMap[lib], libBase))
				libMap[lib] = libMap[lib].replace('bower_components', libBase);

		});

		//additional non-tracked libs
		_.each(_.keys(fix), function(flib){
			if(!libMap[flib]) libMap[flib] = fix[flib];
		});

		//console.log('Total Libs Available:', String(_.size(libMap)).green);
	}
});
//-------------------------------------------

buildify.task({
	name: 'libs', //with jquery2 and bootstrap3 , ie9+
	depends: ['load-lib-map'],
	task: function(){
		var list = [
			'modernizr',
			'detectizr',
			'yepnope',
			'jquery', //version 2+
			'jquery.cookie',
			'jquery-ui',
			'jquery-file-upload',
			'underscore',
			'underscore.string',
			'backbone', 
			'marionette',
			'handlebars',
			'swag',
			'bootstrap', //version 3+
			'store.js', 
			'uri.js',
			'momentjs',
			'marked',
			'raphael',			
			'nprogress' //or spin.js
			
		];
		combine(list, 'dependencies');
	}
});

buildify.task({
	name: 'all',
	depends: ['fix-libs', 'libs'],
	task: function(){
		
	}
});

/**
 * =======================================
 * Special Libs (combine, minify)
 * Used for some of the projects...Tailored
 * =======================================
 */

// buildify.task({
// 	name: 'extjs', //for extjs projects enchancement.
// 	depends: ['load-lib-map'],
// 	task: function(){
// 		var list = ['json3', 'store.js', 'uri.js', 'handlebars.js', 'template-builder', 'spin.js', 'mask', 'i18n'];
// 		combine(list, 'extjs-patch');
// 	}

// });