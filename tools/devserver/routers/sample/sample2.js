/**
 * Sample express.router() code
 *
 * uri base: /sample/sample2
 *
 * @author Tim.Liu
 * @created 2014.04.18
 */

module.exports = function(server){

	var router = server.mount(this);

	router.get('/', function(req, res, next){
		res.json('{world: true}');
	});

}