import { Data } from 'effect'
import { ValidationError } from 'class-validator'

export class ConfigError extends Data.TaggedError('Config') {
	public readonly title = 'Config Error'
	public readonly message: string
	constructor(error: unknown) {
		super()
		this.message = 'Unexpected Error has occured during the validation of the configuration file.'

		switch (true) {
			case error instanceof ValidationError:
				if (error.constraints) {
					this.message = `Parameter ${error.constraints[Object.keys(error.constraints)[0]]}.`
				}

				break
			case error instanceof Error:
				switch (error.message) {
					case 'invalid_parameter':
						this.message = 'Invalid config parameter.'
						break
				}
				break
			case error instanceof SyntaxError:
				this.message = 'Failed to parse conguration file.'
				break
		}
	}
}
