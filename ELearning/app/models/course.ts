import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Course extends BaseModel {
  @column({ isPrimary: true })
  public id!: string

  @column()
  public title!: string

  @column()
  public description!: string

  @column()
  public content!: string

  @column()
  public author!: string
}