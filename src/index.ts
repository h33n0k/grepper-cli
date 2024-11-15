import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { main } from './commands'

// remove node warnings
process.removeAllListeners('warning')

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const args = yargs(hideBin(process.argv))
	.scriptName('grepper')
	.usage('$0 <command> [options]')
	.command<main.CommandArgs>(main.command, main.description, main.builder, main.handler)
	.help()
	.version().argv
