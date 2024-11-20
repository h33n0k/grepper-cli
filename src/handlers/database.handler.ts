import { Data } from 'effect'

export class CloseError extends Data.TaggedError('Close') {
	public readonly title = 'Database Shutdown'
	public readonly error: unknown
	public readonly message: 'Could not properly disconnect from database.'
	constructor(error: unknown) {
		super()
		this.error = error
	}
}

export class AuthError extends Data.TaggedError('Auth') {
	public readonly title = 'Database Connection'
	public readonly error: unknown
	public readonly message: 'Could not properly authenticate to database.'
	constructor(error: unknown) {
		super()
		this.error = error
	}
}

export class SyncError extends Data.TaggedError('Sync') {
	public readonly title = 'Database Synchronisation'
	public readonly error: unknown
	public readonly message: 'Could not properly synchronise database.'
	constructor(error: unknown) {
		super()
		this.error = error
	}
}

export class QueryError extends Data.TaggedError('Query') {
	public readonly title = 'Database Query'
	public readonly error: unknown
	public readonly message = 'Could not perform database query.'
	constructor(error: unknown) {
		super()
		this.error = error
	}
}
