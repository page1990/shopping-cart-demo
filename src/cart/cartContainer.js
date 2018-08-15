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
