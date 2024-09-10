import { defineEventHandler } from 'h3'
import adminMenu from '~/mock/adminToolbar.json'

export default defineEventHandler(() => {
  return Promise.resolve(adminMenu)
})
