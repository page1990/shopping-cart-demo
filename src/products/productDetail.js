import React from 'react'

const ProductDetail = ({price, quantity, title}) => (
	<div>
    {title} - &#36;{price}{quantity ? ` x ${quantity}` : null}
  </div>
)

export default ProductDetail