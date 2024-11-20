import { Effect } from 'effect'
import { Sequelize } from 'sequelize-typescript'
import path from 'path'
import { AnswerModel, PromptModel, MatchModel } from '../models'
import * as fileUtil from './file.util'
import { DatabaseHandler } from '../handlers'

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
			catch: (error) => new DatabaseHandler.AuthError(error)
		})

		yield* Effect.tryPromise({
			try: () => sequelize.sync({ force }),
			catch: (error) => new DatabaseHandler.SyncError(error)
		})
	})

export const disconnect = Effect.gen(function* () {
	if (sequelize) {
		yield* Effect.tryPromise({
			try: () => sequelize.close(),
			catch: (error) => new DatabaseHandler.CloseError(error)
		})
	}
})
