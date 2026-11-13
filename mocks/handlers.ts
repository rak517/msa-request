import { userHandlers } from './user.handlers.js'
import { orderHandlers } from './order.handlers.js'

export const handlers = [...userHandlers, ...orderHandlers]
