import { CHECKOUT } from './actionTypes'

const checkout = () => ({
	type: CHECKOUT
})

export const doCheckOut = () => dispatch => {
	dispatch(checkout())
}