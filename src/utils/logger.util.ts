import colors from '@colors/colors'
import { Effect } from 'effect'

class Logger {
	public level = 'info'

	log(message: string) {
		if (this.level !== 'error') {
			console.log(message)
		}
	}

	warn(message: string) {
		if (this.level !== 'error') {
			console.warn(colors.yellow(message))
		}
	}

	fatal(error: unknown) {
		let message = 'Unexpected Error.'

		if (error && typeof error === 'object' && 'message' in error) {
			if ('title' in error) {
				message = colors.bold(colors.italic(`${error.title}: `))
			} else {
				message = ''
			}

			message += error.message as string
		}

		console.log(colors.red(message))
		process.exit(1)

		return Effect.fail(error)
	}
}

const instance = new Logger()
export default instance
