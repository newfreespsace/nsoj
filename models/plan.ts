import * as TypeORM from "typeorm";
import Model from "./common";


@TypeORM.Entity()
export default class Plan extends Model {
    static cache = true;

    @TypeORM.PrimaryGeneratedColumn()
    id: number;

    @TypeORM.Column({ nullable: true, type: "varchar", length: 80 })
    title: string;

    @TypeORM.Column({ nullable: true, type: "text" })
    subtitle: string;

    @TypeORM.Column( {nullable: true, type: "integer" })
    problem_nums: number;

    @TypeORM.Column({ nullable: true, type: "integer" })
    start_time: number;
}