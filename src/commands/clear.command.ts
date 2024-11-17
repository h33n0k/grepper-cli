import yargs from 'yargs'
import { Effect } from 'effect'
import * as utils from '../utils'

export const command = 'clear'
export const description = 'Clear cached data'
export const builder = (yargs: yargs.Argv) => yargs

export const handler = () =>
	Effect.gen(function* () {
		yield* utils.database.connect(true)
	})
