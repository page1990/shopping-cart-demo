import React from 'react'
import { render } from 'react-dom'
import { createStore, applyMiddleware, compose, combineReducers } from 'redux'
import thunk from 'redux-thunk'
import { Provider } from 'react-redux'
import App from './App'

import { getInitProducts, reducers as productReducers } from './products'
import { reducers as cartReducers } from './cart'

const middleware = [thunk]

const win = window
const storeEnhancer = compose(
	applyMiddleware(...middleware),
	(win && win.devToolsExtension) ? win.devToolsExtension() : (f) => f,
)

const reducers = combineReducers({
	products: productReducers,
	cart: cartReducers
})

const store = createStore(reducers, storeEnhancer)

store.dispatch(getInitProducts())

render(
	<Provider store={store}>
		<App />
	</Provider>,
	document.getElementById('root')
)