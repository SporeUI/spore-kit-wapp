/**
构建一个视图模块，用命名空间的方式完成事件绑定和数据绑定
@constructor spore-kit-wapp/src/view
@param {object} [options] 选项
@example

// ------------------- list.wxml -------------------
<template name="list">
	<view class="p-listbox">
		<text>{{name}}:{{ns}}</text>
		<button type="primary" bindtap="{{ns}}:add">点击添加一项</button>
		<view class="list">
			<text wx:for="{{list}}">{{item}}</text>
		</view>
	</view>
</template>
// ------------------- /list.wxml -------------------

// ------------------- list.js -------------------
var $view = require('spore-kit-wapp/src/view');

function List(options){
	
	var conf = Object.assign({
		context : null,
		name : 'list'
	}, options);

	var data = {
		list : [0, 1, 2]
	};

	var self = new $view({
		context : conf.context,
		name : conf.name,
		data : data
	});

	self.add = function(){
		data.list.push(data.list.length);
		self.setData();
	};

	self.setData();

	self.attach(
		'add'
	);

	return self;

}

module.exports = List;
// ------------------- /list.js -------------------

// ------------------- index.wxml -------------------
<import src="list.wxml"/>
<view class="container">
	<template is="list" data="{{...list1}}"/>
	<template is="list" data="{{...list2}}"/>
</view>
// ------------------- /index.wxml -------------------

// ------------------- index.js -------------------
var $list = require('./list');

// 在 Page 中绑定视图对象
Page({
	data: {},
	onLoad: function() {

		// 数据被绑定在 this.data.list1
		$list({
			context : this,
			name : 'list1'
		});

		// 数据被绑定在 this.data.list2
		$list({
			context : this,
			name : 'list2'
		});

	}
});
// ------------------- /index.js -------------------

**/

class View {

	constructor(options){
		this.initView(options);
	}

	// 初始化视图对象
	initView(options){
		/**
		选项对象
		@type {object}
		@property {object} conf.context 绑定视图组件的根节点
		@property {string} conf.name 命名空间名称
		@property {object} conf.model 视图的数据模型
		**/
		this.conf = Object.assign({
			// 每个视图组件都需要传入 context 作为绑定视图的根节点
			// context 可以是顶层的 Page , 也可以是一个实例化的 view
			context : null,
			// name 参数为组件命名空间名称
			// 数据将会被绑定到 context.data[name]
			name : '',
			// 传入的视图数据模型相当于 view-model
			data : {}
		}, options);

		this.data = this.conf.data || {};
		this.context = this.conf.context;
		
		// 默认数据模型上提供 ns 属性来标记完整的命名空间路径，便于绑定事件
		this.name = this.conf.name;
		this.namespace = this.getNameSpace();
		this.data.name = this.name;
		this.data.ns = this.namespace;

		//绑定到视图的方法统一存放在 bound 对象
		this.bound = {};
	}

	/**
	设置模型数据

	@param {object} model 要配置的数据对象
	@return {object} 混合了模型的数据
	@example
	view.setData({
		name : 'viewName',
		list : [1,2,3]
	});
	**/
	setData(model){
		let nsdata = {};
		if(!this.name){
			throw('Every view need argument "name" as namespace.');
		}

		Object.assign(this.data, model);
		var data = Object.assign({}, this.data);
		nsdata[this.name] = data;

		if(this.context && typeof(this.context.setData) === 'function'){
			this.context.setData(nsdata);
		}

		return data;
	}

	/**
	获取命名空间路径，基于 Page 对象

	@return {string} 路径字符串
	@example
	var parentView = new View({
		context : page,
		name : 'parent'
	});

	var view = new View({
		context : parentView,
		name : 'cihld'
	});

	console.info(view.name);	//child
	console.info(view.getNameSapce()); //parent.child
	**/
	getNameSpace(){
		let parent = '';
		if(this.context && typeof(this.context.getNameSpace) === 'function'){
			parent = this.context.getNameSpace();
		}

		if(!parent){
			return this.name;
		}else{
			return parent + '.' + this.name;
		}
	}

	/**
	获取视图所在的 page 对象

	@return {object} 根节点，小程序 Page 方法实例化的对象
	**/
	getPage(){
		let top = this.context;
		while(top.context && top instanceof View){
			top = top.context;
		}
		return top;
	}

	/**
	将事件绑定到根节点，以命名空间路径作为前缀
	事件函数 self.fn 将会被绑定到 page[ns + ':' + 'fn']

	@param {string} eventName 事件名称，与对象上的方法同名
	@example

	// js
	var view = new View({
		context : page,
		name : 'demo'
	});

	view.add = function(){};
	view.remove = function(){};

	view.attach(
		'add',
		'remove'
	);

	Page({
		data: {},
		onLoad: function() {
			view({
				context : this,
				name : 'demo'
			});
		}
	});

	// wxml
	<template name="demo">
		<button bindtap="{{ns}}:add">添加</button>
		<button bindtap="{{ns}}:remove">移除</button>
	</template>

	<view class="container">
		<template is="demo" data="{{...demo}}"/>
	</view>

	**/
	attach(...events){
		const page = this.getPage();
		if(!page){return;}

		const namespace = this.namespace;

		for(let type of events){
			if(typeof this[type] === 'function'){
				page[namespace + ':' + type] = this.bound[type] = (...args) => {
					this[type].apply(this, args);
				};
			}
		}

	}

	/**
	将事件绑定到根节点，以命名空间路径作为前缀

	@param {string} eventName 事件名称，与对象上的方法同名
	@example

	// 移除指定事件
	view.detach(
		'add'
		'remove'
	);

	// 移除所有事件
	view.detach();
	**/
	detach(...events){
		const page = this.getPage();
		if(!page){return;}
		const namespace = this.namespace;
		events = events.length === 0 ? Object.keys(this.bound) : events;
		for(let type of events){
			delete this.bound[type];
			delete page[namespace + ':' + type];
		}
	}

	// 销毁视图对象
	destroy(){
		this.detach();
		this.model = {};
		this.setData();
	}

}

module.exports = View;

