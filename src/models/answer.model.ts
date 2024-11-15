import {
	BeforeSave,
	Column,
	CreatedAt,
	DataType,
	Default,
	Model,
	PrimaryKey,
	Table,
	UpdatedAt
} from 'sequelize-typescript'
import { answer } from '../schemas'

@Table({
	tableName: 'answers',
	modelName: 'answer',
	timestamps: true
})
export default class Answer extends Model<Answer, answer.Answer> {
	@PrimaryKey
	@Column
	declare id: number

	@Column({
		type: DataType.TEXT
	})
	declare content: string

	@Column
	declare title: string

	@Column
	declare author_name: string

	@Column
	declare upvotes: number

	@Column
	declare downvotes: number

	@Default(0)
	@Column
	declare score: number

	@BeforeSave
	static async setScore(instance: Answer) {
		instance.score = instance.upvotes - instance.downvotes
	}

	@Default(false)
	@Column
	declare hidden: boolean

	@UpdatedAt
	@Column
	declare updatedAt: Date

	@CreatedAt
	@Column
	declare createdAt: Date
}
