import os from 'os'
import path from 'path'
import fs from 'fs'
import stream from 'stream'
import { Effect } from 'effect'
import { FileHandler } from '../handlers'

export const exists = (file: string) =>
	Effect.gen(function* () {
		if (fs.existsSync(file)) {
			return yield* Effect.succeed(file)
		}

		return yield* Effect.fail(new FileHandler.PathError(file))
	})

export const getConfigDir = Effect.gen(function* () {
	let dir: string
	switch (os.platform()) {
		case 'linux':
			dir = path.join(os.homedir(), '.config', 'grepper-cli')
			break
		default:
			return yield* Effect.fail(new FileHandler.ConfigDirError('platform'))
	}

	const dirExists = yield* exists(dir).pipe(
		Effect.match({
			onSuccess: () => true,
			onFailure: () => false
		})
	)

	if (!dirExists) {
		yield* Effect.tryPromise({
			try: () =>
				new Promise<void>((resolve, reject) => {
					fs.mkdir(dir, { recursive: true }, (error) => {
						if (error) {
							reject(error)
						}

						resolve()
					})
				}),
			catch: (error) => new FileHandler.FileError(error as NodeJS.ErrnoException, dir)
		})
	}

	return dir
})

export const read = (file: string) =>
	Effect.gen(function* () {
		yield* exists(file)

		return yield* Effect.tryPromise({
			try: () =>
				new Promise<string>((resolve, reject) => {
					const readStream = fs.createReadStream(file)
					let data = ''
					readStream.on('data', (chunk) => (data += chunk))
					readStream.on('end', () => resolve(data))
					readStream.on('error', (error) => reject(error))
				}),
			catch: (error) => new FileHandler.FileError(error as NodeJS.ErrnoException, file)
		})
	})

export const write = (file: string, content: string) =>
	Effect.gen(function* () {
		yield* Effect.tryPromise({
			try: () => {
				return new Promise<void>((resolve, reject) => {
					const writeStream = fs.createWriteStream(file)
					const transformStream = new stream.Transform({
						transform(chunk, _, callback) {
							this.push(chunk)
							callback()
						}
					})

					writeStream.on('finish', () => resolve())
					writeStream.on('error', (error) => reject(error))

					transformStream.pipe(writeStream)
					transformStream.write(content)
					transformStream.end()
				})
			},
			catch: (error) => new FileHandler.FileError(error as NodeJS.ErrnoException, file)
		})

		return file
	})
