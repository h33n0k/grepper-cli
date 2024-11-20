import { Data } from 'effect'

export class ConfigDirError extends Data.TaggedError('ConfigDir') {
	public readonly title = 'Config Error'
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
	public readonly title = 'Invalid Path'
	public readonly path: string
	public readonly message: string
	constructor(path: string) {
		super()
		this.path = path
		this.message = `File or directory not found ${this.path}.`
	}
}

export class FileError extends Data.TaggedError('File') {
	public readonly title = 'File System'
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
