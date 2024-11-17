import yargs from 'yargs'
import { Data, Effect } from 'effect'
import * as utils from '../utils'
import highlight from 'cli-highlight'

export type CommandArgs = {
	param: string
	value: string
}

export const command = 'config [param] [value]'
export const description = 'Define configuration parameter'
export const builder = (yargs: yargs.Argv) =>
	(yargs as yargs.Argv<CommandArgs>)
		.option('param', {
			describe: 'Config parameter',
			demandOption: false
		})
		.option('value', {
			describe: 'Parameter value',
			demandOption: false,
			default: ''
		})

class ConfigError extends Data.TaggedError('Config') {
	public readonly title = 'Config Error'
	public readonly message: string
	constructor(message: string) {
		super()
		this.message = message
	}
}

export const handler = (args: yargs.ArgumentsCamelCase<CommandArgs>) =>
	Effect.gen(function* () {
		const config = yield* utils.config.get

		if (!args.param) {
			console.log(highlight(JSON.stringify(config, null, '\t')))
		} else if (args.param in config) {
			if (args.value) {
				const parsed = yield* Effect.try({
					try: () => JSON.parse(args.value),
					catch: (error) => Effect.fail(error)
				}).pipe(
					Effect.match({
						onSuccess: (value) => value,
						onFailure: () => args.value
					})
				)

				yield* utils.config.set(args.param as keyof typeof config, parsed)
			} else {
				console.log(config[args.param as keyof typeof config])
			}
		} else {
			return yield* Effect.fail(new ConfigError('Invalid Parameter.'))
		}
	})