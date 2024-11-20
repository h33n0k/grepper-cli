import { Data } from 'effect'

export class RequestError extends Data.TaggedError('Request') {
	public readonly title = 'Request Error'
	public readonly error: unknown
	public readonly message: string
	constructor(error: unknown) {
		super()
		this.error = error
		this.message = this.getMessage()
	}

	private getMessage() {
		let message = 'Unexpected Error.'

		if (this.error && typeof this.error === 'object') {
			switch (true) {
				case this.error instanceof TypeError:
					if (
						'cause' in this.error &&
						this.error.cause &&
						typeof this.error.cause === 'object' &&
						'code' in this.error.cause &&
						this.error.cause.code &&
						typeof this.error.cause.code === 'string'
					) {
						switch (this.error.cause.code) {
							case 'ECONNREFUSED':
								message = 'Connection refused.'
								break
							case 'ENOTFOUND':
								message = 'Server not found.'
								break
							case 'ETIMEDOUT':
								message = 'Request timed out.'
								break
						}
					}

					break
				case 'name' in this.error:
					switch (this.error.name) {
						case 'AbortError':
							message = 'Request timed out.'
							break
					}
					break
			}
		}

		return message
	}
}

export class ResponseError extends Data.TaggedError('Response') {
	public readonly title = 'Response Error'
	public readonly message: string
	public readonly status: number
	constructor(response: Response) {
		super()
		this.status = response.status
		this.message = this.getMessage()
	}

	private getMessage() {
		switch (this.status) {
			case 401:
				return 'Invalid API KEY.'
			case 429:
				return 'Too many requests.'
			case 500:
				return 'Internal Grepper error.'
			case 503:
				return 'Temporarily offline, try again later.'
			default:
				return 'An unknown error occurred. Please try again.'
		}
	}
}
