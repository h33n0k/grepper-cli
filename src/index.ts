import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { main, config, clear } from './commands'
import { logger } from './utils'
import { Effect } from 'effect'

// remove node warnings
process.removeAllListeners('warning')

const wrapper =
	<Args>(effect: (args: yargs.ArgumentsCamelCase<Args>) => Effect.Effect<void, unknown, never>) =>
	(args: yargs.ArgumentsCamelCase<Args>) =>
		effect(args).pipe(Effect.catchAll(logger.fatal), Effect.runPromise)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const args = yargs(hideBin(process.argv))
	.scriptName('grepper')
	.usage('$0 <command> [options]')
	.command<main.CommandArgs>(
		main.command,
		main.description,
		main.builder,
		wrapper<main.CommandArgs>(main.handler)
	)
	.command<config.CommandArgs>(
		config.command,
		config.description,
		config.builder,
		wrapper<config.CommandArgs>(config.handler)
	)
	.command(clear.command, clear.description, clear.builder, wrapper(clear.handler))
	.epilog('MIT LICENSE 2024 - https://github.com/h33n0k/grepper-cli')
	.help()
	.version().argv
