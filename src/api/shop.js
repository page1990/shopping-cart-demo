import _products from './products.json'

const TIEMOUT = 100

export default {
	getProducts: (cb, timeout) => setTimeout(cb(_products), timeout || TIEMOUT)
}