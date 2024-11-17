import { Data, Effect } from 'effect'
import { Sequelize } from 'sequelize-typescript'
import path from 'path'
import { AnswerModel, PromptModel, MatchModel } from '../models'
import * as fileUtil from './file.util'

class CloseError extends Data.TaggedError('Close') {
	public readonly title = 'Database Shutdown'
	public readonly error: unknown
	public readonly message: 'Could not properly disconnect from database.'
	constructor(error: unknown) {
		super()
		this.error = error
	}
}

class AuthError extends Data.TaggedError('Auth') {
	public readonly title = 'Database Connection'
	public readonly error: unknown
	public readonly message: 'Could not properly authenticate to database.'
	constructor(error: unknown) {
		super()
		this.error = error
	}
}

class SyncError extends Data.TaggedError('Sync') {
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

export let sequelize: Sequelize

export const connect = (force = false) =>
	Effect.gen(function* () {
		const storage = yield* fileUtil.getConfigDir.pipe(
			Effect.flatMap((dir) => Effect.succeed(path.join(dir, 'database.sqlite')))
		)

		sequelize = new Sequelize({
			dialect: 'sqlite',
			storage,
			logging: false
		})

		sequelize.addModels([PromptModel, AnswerModel, MatchModel])

		yield* Effect.tryPromise({
			try: () => sequelize.authenticate(),
			catch: (error) => new AuthError(error)
		})

		yield* Effect.tryPromise({
			try: () => sequelize.sync({ force }),
			catch: (error) => new SyncError(error)
		})
	})

export const disconnect = Effect.gen(function* () {
	if (sequelize) {
		yield* Effect.tryPromise({
			try: () => sequelize.close(),
			catch: (error) => new CloseError(error)
		})
	}
})
