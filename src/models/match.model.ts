import { Column, ForeignKey, Model, Table } from 'sequelize-typescript'
import AnswerModel from './answer.model'
import PromptModel from './prompt.model'

@Table({
	indexes: [
		{
			unique: true,
			fields: ['prompt', 'answer']
		}
	]
})
export default class Match extends Model<Match> {
	@ForeignKey(() => PromptModel)
	@Column
	prompt: number

	@ForeignKey(() => AnswerModel)
	@Column
	answer: number
}
