import { Data } from 'effect'

export class InterfaceError extends Data.TaggedError('Interface') {
	public readonly title = 'Preview Error'
}
