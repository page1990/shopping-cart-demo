/* cart组件的数据结构
cart: {
    addedIds: [],
    quantityById: {}
}
*/

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

export default combineReducers({
	addedIds,
	quantityById
})

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

