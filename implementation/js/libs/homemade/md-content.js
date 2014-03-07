/**
 * This is the jquery plugin that fetch and show static .md contents through markd js lib
 *
 * Usage
 * =====
 * ```
 * $.md({
 * 	url: ...
 * 	marked: marked options see [https://github.com/chjj/marked]
 *  cb: function($el)...
 * })
 *
 * $.toc({
 * 	ignoreRoot: false | true - whether to ignore h1
 *  className: 'doc-toc' - class name of produced ul
 *  headerHTML: html before ul (sibling) - experimental
 * })
 * ```
 *
 * the $(tag) you used to call .md() can have md="..." or data-md="..." attribute to indicate md file url.
 *
 * Note
 * ====
 * Use $.load() if you just want to load html content instead of md coded content into $(tag)
 *
 * Dependency
 * ==========
 * jQuery, Underscore
 * 
 *
 * @author Tim.Liu
 * @created 2013.11.05
 * @updated 2014.03.02
 */

(function($){

	/*===============the util functions================*/
	//support bootstrap theme.
	function theme($el){
		$el.find('h3').addClass('text-primary');
		$el.find('code').addClass('btn-info');
		$el.find('h1 + p').addClass('text-info');
	}
	//build ul/li table-of-content listing
	var order = {};
	for (var i = 1; i <= 6; i++) {
		order['h' + i] = order['H' + i] = i;
	};
	function toc($el, options){
		//default options
		options = _.extend({

			ignoreRoot: false,
			className: 'doc-toc',
			headerHTML: '<h3>Table of Content</h3>'

		}, options);

		var $root = $('<div></div>').append(options.headerHTML).append('<ul></ul>');
		$root.$children = $root.find('> ul').addClass(options.className);
		var $index = $root;
		var level = options.ignoreRoot ? 1 : 0;
		$el.find((options.ignoreRoot?'':'h1,') + 'h2,h3,h4,h5,h6').each(function(){

			var $this = $(this);
			var tag = $this.context.localName; //or tagName which will be uppercased
			var title = $this.html();
			var $node = $('<li><a>' + title + '</a><ul></ul></li>'); //like <li> <a>me</a> <ul>children[]</ul> </li>
			$node.$children = $node.find('> ul');

			var gap = order[tag] - level;

			if(gap > 0) { //drilling in (always 1 lvl down)
				$node.$parent = $index;
				$index.$children.append($node);
				$index = $node; //point $index to this new node
				level ++;
			}else if (gap === 0) {
				//back to same level ul (parent li's ul)
				$node.$parent = $index.$parent;
				$index.$parent.$children.append($node);
				$index = $node;
			}else {
				while (gap < 0){
					gap ++;
					$index = $index.$parent; //back to parent li one lvl up
					level --;
				}
				//now $index points to the targeting level node
				$node.$parent = $index.$parent;
				$index.$parent.$children.append($node); //insert a same level node besides the found targeting level node
			}


		});
		$el.data('toc', $root.html());
	}

	/*===============the plugin================*/
	$.fn.md = function(options){
		var that = this;
		if(_.isString(options)) options = { url: options };
		options = options || {};

		return this.each(function(index, el){
			var $el = $(el);
			var url = options.url || $el.attr('md') || $el.data('md');
			$.get(url).done(function(res){
				$el.html(marked(res, options.marked)).addClass('md-content');
				theme($el);
				options.cb && options.cb($el);
			});
		});
	}

	//store table-of-content listing in data-toc
	$.fn.toc = function(options){
		return this.each(function(index, el){
			var $el = $(el);
			toc($el, options);
		});
	}

})(jQuery);