import { stdout } from 'process'
import { Effect } from 'effect'
import { InterfaceError } from './handlers.util'

type Code = 'minsize'

export interface Size {
	min: number
	auto: number
	max: number
}

class SizeError extends InterfaceError {
	public readonly message: string
	public readonly code: Code
	constructor(code: Code) {
		super()
		this.code = code
		this.message = this.getMessage()
	}

	private getMessage() {
		switch (this.code) {
			case 'minsize':
				return 'Current window too small.'
			default:
				return 'Unexpected Error.'
		}
	}
}

export const getColumns = (size: Size) =>
	Effect.gen(function* () {
		const available = stdout.columns
		let columns = available

		if (available < size.min) {
			yield* Effect.fail(new SizeError('minsize'))
		}

		if (available >= size.max) {
			columns = size.max
		} else if (available > 50) {
			columns = (available - 50) * size.auto + 50
		}

		return Math.round(columns)
	})
