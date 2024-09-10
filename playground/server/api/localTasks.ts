import { defineEventHandler } from 'h3'
import localTasks from '~/mock/localTasks.json'

export default defineEventHandler(() => {
  return localTasks
})
