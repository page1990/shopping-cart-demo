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
