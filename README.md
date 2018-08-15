react创建shopping-cart的思考过程
==================

## Table of Contents
- 使用`create-react-app`来初始化一个项目
  - 安装好一些需要的包
  - 开始一个简单的测试页面
- 模拟从服务端获取初始化商品列表并展示
  - 商品列表
  - 设计actions和reduces
  - roducts组件index.js中导出组件模块
  - 在渲染页面的时候模拟请求商品列表
- 渲染并展示商品列表
  - ProductList展示组件
  - ProductsContainer容器组件
  - ProductItem组件
  - ProductDetail组件
  - 导出products组件
  - 在App.js中引入ProductsContainer组件
  - 给ProductsContainer增加购物车按钮监听事件
  - products组件编写reducer处理Add To Cart
- Cart购物车组件
  - 购物车的state结构
  - cart组件的渲染
  - cartContainer容器组件
  - 实现购物车checkout的功能
- 使用总结


根据redux的官方实例，这里根据我自己的思路，从无到有创建一个`shopping-cart`的程序，这里着重记录下创建一个react App的思路.

## 使用`create-react-app`来初始化一个项目
`create-react-app my-shopping-cart-demo`

### 安装好一些需要的包
`npm install redux react-redux redux-thunk`

### 开始一个简单的测试页面
我们应当先弄一个简单的页面框架出来，这个只是一个简单的页面，没有数据和交互，主要用来测试能否正常的启动脚本并且可以查看到

在`src/App.js`中，编写要渲染出来的页面
```
import React from 'react'

const App = () => (
	<div>
		<h3>My shopping cart demo!</h3>
		<hr/>
		<p>Here is the product list</p>
		<hr/>
		<p>Here is the shopping cart list</p>
	</div>
)

export default App
```

这里只是一些简单的html

在`/src/index.js`中，用于渲染这个页面并且加载一些中间件
```
import React from 'react'
import { render } from 'react-dom'
import { createStore, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'
import App from './App'

const middleware = []

const win = window
const storeEnhancer = compose(
	applyMiddleware(...middleware),
	(win && win.devToolsExtension) ? win.devToolsExtension() : (f) => f,
)

const store = createStore(storeEnhancer)

render(
	<Provider store={store}>
		<App />
	</Provider>,
	document.getElementById('root')
)
```

上面的`middleware`,我故意设置了一个空的数组，因为后面会加载一些其他的middleware,所以这里先用一个空的来占位。

启动`npm start` 看看是否有了刚才的页面
![image](https://ws1.sinaimg.cn/large/005B3DIrgy1fu7v8xqknoj30kc0aimx3.jpg)

## 模拟从服务端获取初始化商品列表并展示

接下来要思考的问题是如何模拟页面刚开始的时候从服务器端获取到商品列表的数据问题，我们的需求是这样子：刷新页面，然后模拟从服务器端获取到一些商品列表，然后把这些商品列表渲染出来。

思路：
由于是模拟，并没有真正的去调用一些api来请求服务端的数据，我们可以在本地写一个文件，用来模拟初始化的商品列表。然后页面加载完成后，调用`redux`的一个`dispatch`来表示初始化商品列表的`action`。

这里会涉及到三个部分:
- 一个是设计`state`的数据结构，这里把`state`分为两个部分，一个是`products`,代表商品列表的`state`, 还有一个是`cart`，代表购物车的`state`。 `cart`购物车的部分这里可以先不用管，因为我们现在是要设计初始化商品列表。另外，`products`部分，在分为`byId`和`visibleIds`。其中，我们可以通过`visibleIds`用来控制哪些商品需要渲染， `byId`则用来根据`id`来或者商品的详细信息
- 第二个就是商品组件的`actions`, `reducers`的设计
- 第三个就是商品组件的**容器组件**和**展示组件**的设计

### 商品列表
在`api/products.json`中的文件记录了初始化商品列表的数据
```
[
  {"id": 1, "title": "iPad 4 Mini", "price": 500.01, "inventory": 2},
  {"id": 2, "title": "H&M T-Shirt White", "price": 10.99, "inventory": 10},
  {"id": 3, "title": "Charli XCX - Sucker CD", "price": 19.99, "inventory": 5}
]
```

接下来，我们需要写一个模拟获取商品列表接口的函数，用于在页面渲染完成后获取商品列表。在`api/shop.js`中
```
import _products from './products.json'

const TIEMOUT = 100

export default {
	getProducts: (cb, timeout) => setTimeout(cb(_products), timeout || TIEMOUT)
}
```

我们定义了一个`getProducts`的函数，这个函数接收一个`cb`和`timeout`的参数，这个函数执行的时候，其实就是在`timeout`时间后，执行`cb(_products)`函数。这个函数正好可以模拟api获取商品列表数据


### 设计actions和reduces
因为要在页面刚开始加载后模拟请求api数据，因此，我们需要定义好相应的`actions`和`reducers`。还有一点，我们的代码组织方式，是按照**组件**来组织的，也就是说，和商品列表组件相关的东西，包括`actions, reducers`都要放在同样层级的目录下。

我们先创建products组件
`cd src/ && mkdir products`

定义好`actionTypes`, `cd src/products && vim actionTypes.js`

```
const INIT_PRODUCTS = 'PRODUCTS/INIT_PRODUCTS'

export { INIT_PRODUCTS }
```
因为目前只是涉及到初始化商品列表，所以暂时只需要这些

接下来定义好`actions`
`cd src/products && vim actions.js`

```
import { INIT_PRODUCTS } from './actionTypes'
import shop from '../api/shop'

const receiveProducts = products => ({
	type: INIT_PRODUCTS,
	products
})

// 这里使用redux-thunk的中间件
// 因此，action构造函数可以返回一个函数
// thunk中间件会传入dispatch 和 getState参数
export const getInitProducts = () => dispatch => {
	shop.getProducts(products => {
		dispatch(receiveProducts(products))
	})
}
```
这里的`getInitProducts`函数，其实是用到了**redux-thunk**中间件的功能，这个中间件的作用是可以将`action`创建函数修改为返回一个函数而不是单纯的对象。这个函数会接收`dispatch`和`getState`这两个全局的`store`下面的对象。

返回函数其实就是执行了`shop`里面的`getProducts`，这个函数接收一个回调函数，并且在规定的`timeout`时间后调用，这里其实调用`dispatch`一个`action`,而这个`action`其实就是我们的一个简单的`receiveProducts`。仔细想想，这个`getInitProducts`的函数，其实正好模拟了通过API获取商品列表的功能。

**actions**设计完成以后，我们需要来设计**reducers**来真正的处理这些`actions`了。
```
cd src/products/reducers.js

/*
products组件的数据结构
products: {
	byId: {
		{1: {...}, 2: {...}}
	},
	visibleIds: [1, 2, 3]
}
*/

import { combineReducers } from 'redux'
import { INIT_PRODUCTS } from './actionTypes'

const byId = (state = {}, action) => {
	switch(action.type) {
		case INIT_PRODUCTS:
			return {
				...state,
				action.products.reduce((obj, product) => {
					obj[product.id] = product
					return obj
				}, {})
			}
		default:
			return state
	}
}

const visibleIds = (state = [], action) => {
	switch(action.type) {
		case INIT_PRODUCTS:
			return action.products.map(product => product.id)
		default:
			return state
	}
}

export default combineReducers({
	byId,
	visibleIds
})
```
在`reducers`中，我们定义了`byId`和`visibleIds`这两个`reducer`,他们都可以处理`INIT_PRODUCTS`的`action`,并且我们还是用`combineReducers`来合并了这两个然后将其导出。

### products组件index.js中导出组件模块
根据模块化的开发原则，我们需要写一个index.js的文件，将`products`组件对外的部分接口暴露出来
```
cd src/products && vim index.js
import { getInitProducts } from './actions.js'
import reducers from './reducers'

export { getInitProducts, reducers }
```

这里，我们`import`了一些模块，然后导出。其他组件就可以直接从`products`里面导入他们需要的模块了


### 在渲染页面的时候模拟请求商品列表
我们需要在刚开始渲染页面的时候，发送一个`action`,用来模拟请求商品列表的api。
在`src/index.js`中，修改后的代码如下:
```
import React from 'react'
import { render } from 'react-dom'
import { createStore, applyMiddleware, compose, combineReducers } from 'redux'
import thunk from 'redux-thunk'
import { Provider } from 'react-redux'
import App from './App'

import { getInitProducts, reducers as productReducers } from './products'

const middleware = [thunk]

const win = window
const storeEnhancer = compose(
	applyMiddleware(...middleware),
	(win && win.devToolsExtension) ? win.devToolsExtension() : (f) => f,
)

const reducers = combineReducers({
	products: productReducers
})

const store = createStore(reducers, storeEnhancer)

store.dispatch(getInitProducts())

render(
	<Provider store={store}>
		<App />
	</Provider>,
	document.getElementById('root')
)
```
这里主要增加了`combineReducers`来合并。

**关于这个`combineReducers`的个人理解**:
首先在`createStore`的时候，就有一个`combineReducers`,这里可以理解为`dispatch`一个`action`对象的时候，就做了一次拆分，后面的`state`中的数据，就是在`products`这个字段下面了

然后`productReducers`，其实是`products`这个组件里面的，这里面也有一个`combineReducers`，在这里:
```
export default combineReducers({
	byId,
	visibleIds
})
```
也就是说，到最后`byId`和`visibleIds`接收到`action`处理`state`的时候，除了在最开始的`products`字段下，还要继续分为`byId`和`visibleIds`的字段下，因此，`products`组件的state就确定了。

通过刷新页面，然后观察redux和state类似于这个样子:
![image](https://ws1.sinaimg.cn/large/005B3DIrgy1fu7xuf9oefj31cw09u3z5.jpg)

查看state的数据结构:

![image](https://ws1.sinaimg.cn/large/005B3DIrgy1fu7xswg2qej30gk0a3dg1.jpg)


## 渲染并展示商品列表

我们通过模拟api获取到了商品列表以后，接下来就需要考虑如何去渲染这些商品列表了。在项目的刚开始的时候，我们只是简单的把商品列表用一个简单的html来表示。


### ProductList展示组件

在编写组件的时候，我们需要考虑一个问题，是从这个组件的由外到内，还是从这个组件的由内到外？最外层的应该是容器组件，他的`props`应该由`state`来确定，具体到这个例子来说，就是我们之前提到的`products`这个state下面的`visibleIds`这个值来确定可以渲染出哪些商品列表。

还有一点需要注意的地方，就是我们的商品列表`ProductList`组件，由于是动态生成的，因此，具体有多少个商品列表，其实是不知道的，需要通过计算相应的state才能得到。但是，我们可以这样布局，一个商品列表的页面展示，可以设计成这个样子:
```
<div>
    <h3>Products!</h3>
    <div>{children}</div>
</div>
```

其中，`<h3>`这个html元素里面的内容，就是这个商品列表的标题，这就是就一个简单的**Products!**而已，但是，有时候我们想动态的给商品的标题赋值，这里可以把标题作为一个属性传递给`productList`这个组件，另外，还需要传递一个`{children}`的属性。

因此，我们的productList组件内容是这样子:

`vim src/products/productList.js`

```
import React from 'react'

const ProductList = ({title, children}) => (
	<div>
		<h3>{title}</h3>
		<div>{children}</div>
	</div>
)

export default ProductList

```

这个`ProductList`仅仅是一个**展示型组件**,具体渲染哪些商品列表，需要通过编写**容器组件**来确定

### ProductsContainer容器组件
前面说过，商品列表要展示多少个，是根据`products`这个state下面的`visibleIds`来确定的，因此，容器组件`ProductsContainer`可以设计成这个样子:

`cd src/products && vim productsContainer.js`

```
import React from 'react'
import { connect } from 'react-redux'

import ProductList from './productList'

const ProductsContainer = ({products}) => (
	<ProductList title="Products">
		{
			products.map(product => (
				<ProductItem key={product.id} product={product} />
			))
		}
	</ProductList>
)

export default ProductsContainer
```
其实，这里的`products.map()`部分就是代表了之前的`ProductList`组件的`{children}`属性。

还有一点，我们导入了`ProductItem`组件，这个组件需要一个`product`属性，我们并没有编写这个组件。

既然是容器组件，那么，就需要将redux中的store和组件的属性结合起来，这里主要体现在`ProductsContainer`属性的`products`属性，是根据`products`这个state中的`visibleIds`来确定的，因此，我们需要写一个计算出有哪些可用的商品列表的函数，这个函数定义在`products`组件的`reducers`中

`vim src/products/reducers.js`

新的代码如下:

```
/*
products组件的数据结构
products: {
	byId: {
		{1: {...}, 2: {...}}
	},
	visibleIds: [1, 2, 3]
}
*/

import { combineReducers } from 'redux'

import { INIT_PRODUCTS } from './actionTypes'

const byId = (state = {}, action) => {
	switch (action.type) {
		case INIT_PRODUCTS:
			return {
				...state,
				...action.products.reduce((obj, product) => {
					obj[product.id] = product
					return obj
				}, {})
			}
		default:
			return state
	}
}

const visibleIds = (state = [], action) => {
	switch (action.type) {
		case INIT_PRODUCTS:
			return action.products.map(product => product.id)
		default:
			return state
	}
}

export default combineReducers({
	byId: byId,
	visibleIds: visibleIds,
})

export const getProduct = (state, id) =>
	state.byId[id]

export const getVisibleProducts = state =>
	state.visibleIds.map(id => getProduct(state, id))

```

在最后，我们导出了`getProduct, getVisibleProducts`

最终，我们使用**react-redux**的`connect`来连接

`vim src/products/productsContainer.js`

最新的代码如下：

```
import React from 'react'
import { connect } from 'react-redux'

import ProductList from './productList'

import getVisibleProducts from './reducers'

const ProductsContainer = ({products}) => (
	<ProductList title="Products">
		{
			products.map(product => (
				<ProductItem key={product.id} product={product} />
			))
		}
	</ProductList>
)

const mapState = (state) => ({
	products: getVisibleProducts(state.products)
})

export default connect(mapState)(ProductsContainer)
```

### ProductItem组件
ProductItem组件应该是这样子的：
- 他有一个关于自身商品的描述(title, price, inventory)
- 还有一个按钮，类似于添加到购物车，并且当库存不够时，这个按钮应该是`disabled`状态的，并且这个按钮的名字应该变成*sold out*

`vim src/products/ProductItem.js`

```
import React from 'react'

import ProductDetail from './productDetail'

const style = {
	marginBottom: 20
}

const ProductItem = ({product}) => (
	<div style={style}>
		<ProductDetail
			title={product.title}
			quantity={product.inventory}
			price={product.price} />
		<button
			disabled={product.inventory > 0 ? '' : 'disabled'} >
			{product.inventory > 0 ? 'Add to Cart' : 'Sold Out'}
		</button>
	</div>
)

export default ProductItem
```

这里我们导入了`ProductDetail`的组件，这个组件的作用就是展示商品的title, price和inventory信息

### ProductDetail组件
这个组件就是最底层的，展示商品属性的组件

`vim src/products/productDetail.js`

```
import React from 'react'

const ProductDetail = ({price, quantity, title}) => (
	<div>
    {title} - &#36;{price}{quantity ? ` x ${quantity}` : null}
  </div>
)

export default ProductDetail
```

### 导出products组件
在`products/index.js`中，我们导出`products`组件的相关内容

```
import { getInitProducts } from './actions.js'
import reducers from './reducers'
import ProductsContainer from './productsContainer'

export { getInitProducts, reducers, ProductsContainer}
```

### 在App.js中引入ProductsContainer组件

```
import React from 'react'
import { ProductsContainer } from './products'

const App = () => (
	<div>
		<h3>My shopping cart demo!</h3>
		<hr/>
		<ProductsContainer />
		<hr/>
		<p>Here is the shopping cart list</p>
	</div>
)

export default App

```

刷新页面后，我们可以看到现在能正确的渲染出商品列表了。
![image](https://ws1.sinaimg.cn/large/005B3DIrgy1fu87oq5m3cj30f10bft8v.jpg)


### 给ProductsContainer增加购物车按钮监听事件
之前所做的，点击**Add To Cart** 按钮后其实没有任何事情发生，这个按钮实际上是要表达添加商品到购物车的这个操作，因此，我们需要给商品组件增加一个**action**

`vim src/products/actionTypes.js`

```
const INIT_PRODUCTS = 'PRODUCTS/INIT_PRODUCTS'
const ADD_TO_CART = 'PRODUCTS/ADD_TO_CART'

export { INIT_PRODUCTS, ADD_TO_CART }
```
我们新增了一个`ADD_TO_CART`的actionType

接着，在`src/products/actions.js`中新增如下:

```
const addToCartUnsafe = productId => ({
	type: ADD_TO_CART,
	productId
})

export const addToCart = productId => (dispatch, getState) => {
	if ( getState().products.byId[productId].inventory > 0 ) {
		dispatch(addToCartUnsafe(productId))
	}
}
```

`addToCart`也是经过**redux-thunk**处理的，因为他返回的是一个函数，这个函数首先判断state中的这个商品是否还有库存，如果有，就发送一个`dispatch`

最后，我们需要给**ProductsContainer**增加一个属性，这个属性用来监听**Add To Cart**.

`vim src/products/productsContainer.js`

```
import React from 'react'
import { connect } from 'react-redux'

import ProductList from './productList'
import ProductItem from './productItem'

import { getVisibleProducts } from './reducers'

import { addToCart } from './actions'

const ProductsContainer = ({products, addToCart}) => (
	<ProductList title="Products">
		{
			products.map(product =>
				<ProductItem
					key={product.id}
					product={product}
					onAddToCartClick={() => addToCart(product.id)} />
			)
		}
	</ProductList>
)

const mapState = state => ({
	products: getVisibleProducts(state.products)
})

const mapDispatch = dispatch => {
	return {
		addToCart: productId => {
			dispatch(addToCart(productId))
		}
	}
}

export default connect(mapState, mapDispatch)(ProductsContainer)

```

我们给**ProductsContainer**这个容器组件增加了一个**onAddToCartClick**的属性，这个属性传给了**ProductItem**组件，并且，定义了**mapDispatch**函数，然后在`connect`函数里面新增了这个**mapDispatch**函数。

然后，给**ProductItem**增加**onAddToCartClick** 属性

`vim src/products/productItem.js`

```
import React from 'react'

import ProductDetail from './productDetail'

const style = {
	marginBottom: 20
}

const ProductItem = ({product, onAddToCartClick}) => (
	<div style={style}>
		<ProductDetail
			title={product.title}
			quantity={product.inventory}
			price={product.price} />
		<button
			onClick={onAddToCartClick}
			disabled={product.inventory > 0 ? '' : 'disabled'} >
			{product.inventory > 0 ? 'Add to Cart' : 'Sold Out'}
		</button>
	</div>
)

export default ProductItem
```

接下来我们应该要测试下，当我们点击**Add To Cart**时候，能否发生对应的事件。但是我们并没有针对**ADD_TO_CART**这个`action`来编写相应的`reducer`，因此，我改写了一下`AddToCart`函数，这里只是简单的`console.log`出对应的商品ID，测试完成后应该要改回之前的样子

`vim src/products/actions.js`

```
export const addToCart = productId => (dispatch, getState) => {
	console.log(productId)
	/*if ( getState().products.byId[productId].inventory > 0 ) {
		dispatch(addToCartUnsafe(productId))
	}*/
}
```

这样子，当我们点击**Add To Cart**时，浏览器应该log出商品id

![image](https://ws1.sinaimg.cn/large/005B3DIrgy1fu90qxdsjpj30nw0kjt9a.jpg)


### products组件编写reducer处理Add To Cart
之前的products组件，只是做到了模拟请求商品列表，既然现在已经弄好了**Add To Cart** 这个action，那么，就需要增加相应的reduce来处理

`vim src/products/reducers.js`

```
import { combineReducers } from 'redux'

import { INIT_PRODUCTS, ADD_TO_CART } from './actionTypes'

const products = (state, action) => {
	switch (action.type) {
		case ADD_TO_CART:
			return {
				...state,
				inventory: state.inventory - 1
			}
		default:
			return state
	}
}

const byId = (state = {}, action) => {
	switch (action.type) {
		case INIT_PRODUCTS:
			return {
				...state,
				...action.products.reduce((obj, product) => {
					obj[product.id] = product
					return obj
				}, {})
			}
		case ADD_TO_CART:
			const { productId } = action
			return {
				...state,
				[productId]: products(state[productId], action)
			}
		default:
			return state
	}
}
```

这里增加了一个`products`的函数，用来处理单个商品数量减少的操作， 然后在`byId`中，增加了对`ADD_TO_CART`的处理。

接下来我们需要验证点击**Add To Cart**后，商品组件展示的库存数量是否减少并且库存没有后，按钮是否发生变化

![image](https://ws1.sinaimg.cn/large/005B3DIrgy1fu92csnv9mj30j60ai3yo.jpg)

## Cart购物车组件
之前所有的操作，都是对商品组件的，现在，我们需要对购物车组件来进行开发了。

### 购物车组件的样子
简单而言，一个购物车组件可以设计成这样:

```
title

product1 cout1
product2 cout2

Total: $xxx

button checkout
```

### 购物车的state结构
购物车的state结构，根据需求，可以设计成这个样子:

```
cart: {
    addedIds: [],
    quantityById: {}
}
```

其中，`addedIds`是一个数组，表示添加的购物车的`id`，`quantityById`是一个字典，其中`key`是商品的**id**, `value`是添加到购物车商品的**数量**

### Cart组件处理ADD_TO_CART action
我们先不渲染cart组件，现在只是通过编写`Cart`组件的`action`和`reducer`来处理相应的数据，并且能更新state，因为拿到了state后，就可以根据state计算出`Cart`组件的样子了。

`cd src/ && mkdir cart`

编写`reducers`来处理对应的`action`

`vim src/cart/reducers.js`

```
/* cart组件的数据结构
cart: {
    addedIds: [],
    quantityById: {}
}
*/

import { ADD_TO_CART } from '../products'
import { combineReducers } from 'redux'


const addedIds = (state=[], action) => {
	switch(action.type) {
		case ADD_TO_CART:
			if (state.indexOf(action.productId) !== -1) {
				return state
			}
			return [ ...state, action.productId ]
		default:
			return state
	}
}

const quantityById = (state={}, action) => {
	switch(action.type) {
		case ADD_TO_CART:
			const { productId } = action
			return {
				...state,
				[productId]: (state[productId] || 0) + 1
			}
		default:
			return state
	}
}

export default combineReducers({
	addedIds,
	quantityById
})


```

在上面的例子中，我们从**products** 里面导入了**ADD_TO_CART**，这似乎不是一个很好的选择，因为根据组件拆分原则，要尽量减少组件依赖。其实，把**ADD_TO_CART**定义在一个公共的文件目录，比如**constants**目录下，然后写一个`actionTypes`似乎是一个更好的选择。

在`reducers.js`中，我们导出了`combineReducers`


接着，我们需要把这个`reducers`暴露出来

`vim src/cart/index.js`

```
import reducers from './reducers'

export { reducers }
```

`vim src/index.js`

```
import { reducers as cartReducers } from './cart'

const reducers = combineReducers({
	products: productReducers,
	cart: cartReducers
})
```

最终，我们的reducers里面也包含了`cart`字段。

测试，点击后应该能看到state的变化

![image](https://ws1.sinaimg.cn/large/005B3DIrgy1fu93j0m2iyj30gx0aoglr.jpg)

![image](https://ws1.sinaimg.cn/large/005B3DIrgy1fu93jp0vjbj30t208ot8s.jpg)


### cart组件的渲染
有了state数据以后，我们就可以根据这些数据来决定组件的表现形式了，我们的cart渲染应该是这个样子:

```
title

product1 x 1
product2 x 2

total: $100.23

<button>checkout</button>
```

其中，商品列表的信息可以根据`addedIds`来确定，数量可以根据quantityById来确定，总价可以根据这两个值计算出来。至于`chekcout`的功能，我们先不处理，下一节在处理。

我们先设计**Cart**组件，这是一个展示型组件，在这里我们假设已经获取到了`products`和`total`这些数据:

`vim src/cart/cart.js`

```
import React from 'react'
import { ProductDetail } from '../products'

const Cart = ({products, total}) => {
	const hasProducts = products.length > 0
	const nodes = hasProducts ? (
		products.map(product =>
			<ProductDetail
				title={product.title}
				price={product.price}
				quantity={product.quantity}
				key={product.id} />
		)
	) : (<em>Please add some products to cart.</em>)

	return (
		<div>
			<h3>Your Cart</h3>
			<div>{nodes}</div>
			<p>Total: &#36;{total}</p>
			<button disabled={hasProducts ? '' : 'disabled'}>
			Checkout
			</button>
		</div>
	)
}

export default Cart
```

这里导入了**products**组件的`ProductDetail`组件。

### cartContainer容器组件
为了将`cart`组件的属性和state结合起来，需要设计容器组件

`vim src/cart/cartContainer.js`

```
import React from 'react'
import Cart from './cartComponent'
import { getCartProducts, getTotal } from './reducers'
import { connect } from 'react-redux'

const CartContainer = ({ products, total }) => (
  <Cart
    products={products}
    total={total} />
)

const mapState = state => ({
	products: getCartProducts(state),
	total: getTotal(state)
})

export default connect(mapState)(CartContainer)
```

我们给`CartContainer`的属性增加了`getCartProducts getTotal`这两个方法

接下来看这两个方法的实现:

`vim src/cart/reducers.js`

```
const getQuantity = (state, productId) =>
	state.quantityById[productId] || 0

const getAddedIds = state => {
	return state.addedIds
}


export const getCartProducts = state =>
	getAddedIds(state.cart).map(id => ({
		...getProduct(state.products, id),
		quantity: getQuantity(state.cart, id)
	}))

export const getTotal = state =>
	getCartProducts(state).reduce((total, product) => {
		return total + product.price * product.quantity
	}, 0).toFixed(2)

```

其实很好理解的吧，就不多说了

最后，在`App.js`中导入这个组件就行了

`vim src/App.js`

```
import React from 'react'
import { ProductsContainer } from './products'
import { CartContainer } from './cart'

const App = () => (
	<div>
		<h3>My shopping cart demo!</h3>
		<hr/>
		<ProductsContainer />
		<hr/>
		<CartContainer />
	</div>
)

export default App
```

测试效果:

![image](https://ws1.sinaimg.cn/large/005B3DIrgy1fu9bqz8jrcj30l20ept93.jpg)

### 实现购物车checkout的功能
这个就是最后的功能了，我们需要做的就是要给购物车添加**checkout**的功能。这个功能的意思就是清空购物车，并且，购物车的商品列表要返回之前的初始化状态。

**checkout**应该也是一个action，因此，我们要编写相应的`action`和`reducer`来处理

`vim src/cart/actionTypes.js`

```
const CHECKOUT = 'CART/CHECKOUT'
export { CHECKOUT }
```

`vim src/cart/actions.js`

```
import { CHECKOUT } from './actionTypes'

const checkout = () => ({
	type: CHECKOUT
})

export const doCheckOut = () => dispatch => {
	dispatch(checkout())
}
```

在`reducers`中新增对`CHECKOUT`的处理

`vim src/cart/reducers.js`

```
import { ADD_TO_CART, getProduct } from '../products'
import { combineReducers } from 'redux'
import { CHECKOUT } from './actionTypes'


const addedIds = (state=[], action) => {
	switch(action.type) {
		case ADD_TO_CART:
			if (state.indexOf(action.productId) !== -1) {
				return state
			}
			return [ ...state, action.productId ]
		case CHECKOUT:
			return []
		default:
			return state
	}
}

const quantityById = (state={}, action) => {
	switch(action.type) {
		case ADD_TO_CART:
			const { productId } = action
			return {
				...state,
				[productId]: (state[productId] || 0) + 1
			}
		case CHECKOUT:
			return {}
		default:
			return state
	}
}
```
很简单，对应的state返回初始空值就可以了

另外，`CartComponent`和`CartContainer`组件需要增加对button的`onClick`的监听.

`vim src/cart/CartComponent.js`

```
import React from 'react'
import { ProductDetail } from '../products'

const Cart = ({products, total, onCheckOut}) => {
	const hasProducts = products.length > 0
	const nodes = hasProducts ? (
    products.map(product =>
      <ProductDetail
        title={product.title}
        price={product.price}
        quantity={product.quantity}
        key={product.id}
      />
    )
  ) : (
    <em>Please add some products to cart.</em>
  )

	return (
    <div>
      <h3>Your Cart</h3>
      <div>{nodes}</div>
      <p>Total: &#36;{total}</p>
      <button
      	onClick={onCheckOut}
        disabled={hasProducts ? '' : 'disabled'}>
        Checkout
      </button>
    </div>
  )
}

export default Cart
```

`vim src/cart/CartContainer.js`

```
import React from 'react'
import Cart from './cartComponent'
import { getCartProducts, getTotal } from './reducers'
import { doCheckOut } from './actions'
import { connect } from 'react-redux'

const CartContainer = ({ products, total,  doCheckOut}) => (
  <Cart
  	onCheckOut={doCheckOut}
    products={products}
    total={total} />
)

const mapState = state => ({
	products: getCartProducts(state),
	total: getTotal(state)
})

const mapDispatch = (dispatch) => {
	return {
		doCheckOut: () => dispatch(doCheckOut())
	}
}

export default connect(mapState, mapDispatch)(CartContainer)

```

最后整个功能就完成了

## 使用总结
`react`我个人觉得是非常具有函数式编程的风格的，并且，他的单向数据流的设计，以及通过改变`state`来改变`UI`的设计我也是比较喜欢，因为可以使用ES6的语法，整个前端代码写起来，有一种写后端的感觉。

在开发的过程中，你需要实现规划好每个组件和边界，以及对`state`的设计，这是比较考验一个人的开发水平的地方。

并且，配合`redux`使用，整个流程严格按照规范来，避免了一些乱七八糟自由发挥造成的代码逻辑混乱和后期的维护问题。

但是，我觉得有些地方又有点啰嗦了，就比如`actionType`, `action`, `reducer`，基本上你都需要针对每个组件去编写。

对于文件的组织方式，你可以按照逻辑来组织，比如有一个`reducer`文件，来专门处理所有的`reducer`，也可以按照组件来组织，这似乎更符合react组件化的设计理念。
