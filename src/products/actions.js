import { INIT_PRODUCTS, ADD_TO_CART } from './actionTypes'
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

const addToCartUnsafe = productId => ({
	type: ADD_TO_CART,
	productId
})

export const addToCart = productId => (dispatch, getState) => {
	// console.log(productId)
	if ( getState().products.byId[productId].inventory > 0 ) {
		dispatch(addToCartUnsafe(productId))
	}
}
