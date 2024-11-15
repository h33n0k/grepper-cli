import { Schema } from '@effect/schema'

export const answer = Schema.Struct({
	id: Schema.Number,
	content: Schema.String,
	author_name: Schema.String,
	title: Schema.String,
	upvotes: Schema.Number,
	downvotes: Schema.Number
})

export const response = Schema.Struct({
	data: Schema.Array(answer)
})

export type Response = Schema.Schema.Type<typeof response>
export type Answer = Schema.Schema.Type<typeof answer>
