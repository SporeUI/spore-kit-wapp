var $assign = require('spore-kit-obj/src/assign');

/**
构建一个视图模块，用命名空间的方式完成事件绑定和数据绑定

@module spore-kit-wapp/src/view
@example

// module.js
var $assign = require('spore-kit-obj/src/assign');
var $view = require('spore-kit-wapp/src/view');

var module = function(options){
	
	var conf = $assign({
		context : null,
		ns : 'module'
	}, options);

	var model = {
		data : [0, 1, 2]
	};

	var self = new $view({
		context : conf.context,
		ns : conf.ns,
		model : model
	});

	self.action = function(){
		model.data.push(model.data.length);
		self.setData({
			name : conf.ns
		});
	};

	self.setData();
	self.attach(
		'action'
	);

	return model;

};

module.exports = module;

// module.wxml

// index.js
var $module = require('./module');

// 在 Page 中绑定视图对象
Page({
	data: {},
	onLoad: function() {
		// 对象被绑定在 this.list
		// 数据被绑定在 this.data.list
		$module({
			context : this,
			ns : 'list'
		});
	}
});

//index.wxml

**/
var View = function(options){
	this.conf = $assign({
		// 每个视图组件都需要传入 context 作为绑定视图的根节点
		// context 可以是顶层的 Page , 也可以是一个实例化的 view
		context : null,
		// ns 参数为组件命名空间路径
		// 数据将会被绑定到 context.data[ns]
		// 事件函数 self.fn 将会被绑定到 context[ns + ':' + 'fn']
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

