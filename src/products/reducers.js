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
