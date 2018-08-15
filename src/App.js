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
