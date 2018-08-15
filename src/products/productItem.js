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