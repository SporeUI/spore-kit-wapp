var $assign = require('spore-kit-obj/src/assign');

/**

**/
var View = function(options){
	this.conf = $assign({
		context : null,
		ns : '',
		model : {}
	}, options);

	this.model = this.conf.model || {};
	this.context = this.conf.context;
	this.ns = this.conf.ns;
};

View.prototype = {
	/**
	
	**/
	setData : function(data){
		var nsdata = {};
		if(!this.ns){
			throw('Every view need argument "ns" as namespace.');
		}
		this.model.ns = this.getNameSpace();
		nsdata[this.ns] = $assign({}, this.model, data);
		if(this.context && typeof(this.context.setData) === 'function'){
			this.context.setData(nsdata);
		}
	},
	/**
	
	**/
	getNameSpace : function(){
		var parent = '';
		if(this.context && typeof(this.context.getNameSpace) === 'function'){
			parent = this.context.getNameSpace();
		}

		if(!parent){
			return this.ns;
		}else{
			return parent + '.' + this.ns;
		}
	},
	/**
	
	**/
	attach : function(){
		var top = this.context;
		do{
			if(top.context && top.context instanceof View){
				top = top.context;
			}
		}while(top.context);

		if(!top){return;}

		var namespace = this.getNameSpace();

		var args = Array.prototype.slice.call(arguments);
		args.forEach(function(method){
			if(typeof this[method] === 'function'){
				top[namespace + ':' + method] = this[method];
			}
		}, this);
	}
};

module.exports = View;

