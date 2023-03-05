import * as TypeORM from "typeorm";
import Model from "./common";


@TypeORM.Entity()
export default class ContestAcnum extends Model {
    static cache = true;

    @TypeORM.PrimaryGeneratedColumn()
    id: number;

    @TypeORM.Column({ nullable: true, type: "integer" })
    user_id: number;

    @TypeORM.Column( {nullable: true, type: "integer" })
    contest_id: number;

    @TypeORM.Column( {nullable: true, type: "integer" })
    ac_num: number;
}