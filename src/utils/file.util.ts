import os from 'os'
import path from 'path'
import fs from 'fs'
import stream from 'stream'
import { Effect, Data } from 'effect'

class ConfigDirError extends Data.TaggedError('ConfigDir') {
	public declare readonly title = 'Config Error'
	public readonly message: string
	constructor(error: 'platform') {
		super()
		switch (error) {
			case 'platform':
				this.message = 'Unsupported OS Platform.'
				break
		}
	}
}

export class PathError extends Data.TaggedError('Path') {
	public declare readonly title = 'Invalid Path'
	public readonly path: string
	public readonly message: string
	constructor(path: string) {
		super()
		this.path = path
		this.message = `File or directory not found ${this.path}.`
	}
}

export class FileError extends Data.TaggedError('File') {
	public declare readonly title = 'File System'
	public readonly code: string
	public readonly message: string
	public readonly path: string
	constructor(error: NodeJS.ErrnoException, p: string) {
		super()
		this.code = error.code || 'UNEXPECTED'
		this.path = p
		this.message = this.getMessage()
	}

	private getMessage(): string {
		switch (this.code) {
			case 'EACCES':
				return `Permission denied ${this.path}.`
			case 'ENOENT':
				return `File or directory not found ${this.path}.`
			case 'EEXIST':
				return `File already exists ${this.path}.`
			case 'ENOTDIR':
				return `Not a directory ${this.path}`
			case 'EISDIR':
				return `Is a directory ${this.path}`
			case 'EMFILE':
				return `Too many open files`
			case 'ENOSPC':
				return `No space left ${this.path}.`
			case 'EROFS':
				return `Read-only file system ${this.path}`
			case 'UNEXPECTED':
				return `Unexpected error ${this.path}`
			default:
				return `Unknown filesystem error (${this.code}) at ${this.path}`
		}
	}
}

export const exists = (file: string) =>
	Effect.gen(function* () {
		if (fs.existsSync(file)) {
			return yield* Effect.succeed(file)
		}

		return yield* Effect.fail(new PathError(file))
	})

export const getConfigDir = Effect.gen(function* () {
	let dir: string
	switch (os.platform()) {
		case 'linux':
			dir = path.join(os.homedir(), '.config', 'grepper-cli')
			break
		default:
			return yield* Effect.fail(new ConfigDirError('platform'))
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
			catch: (error) => new FileError(error as NodeJS.ErrnoException, dir)
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
			catch: (error) => new FileError(error as NodeJS.ErrnoException, file)
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
			catch: (error) => new FileError(error as NodeJS.ErrnoException, file)
		})

		return file
	})
