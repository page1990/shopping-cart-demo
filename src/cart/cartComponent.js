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
