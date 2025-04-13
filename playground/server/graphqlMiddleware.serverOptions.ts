import { defineGraphqlServerOptions } from 'nuxt-graphql-middleware/server-options'
import adminToolbar from './mocks/adminToolbar.json'
import localTasks from './mocks/localTasks.json'

export default defineGraphqlServerOptions({
  doGraphqlRequest(context) {
    if (context.operationName === 'adminToolbar') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Promise.resolve(adminToolbar) as any
    } else if (context.operationName === 'localTasks') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Promise.resolve(localTasks) as any
    }

    throw new Error('Unknown GraphQL operation.')
  },
})
