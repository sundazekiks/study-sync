import mongoose, { HydratedDocument, InferSchemaType } from "mongoose";


const CheckpointSchema = new mongoose.Schema({
    title: String,
    description: String,
    complete: Boolean
}, { _id: false })


const TaskSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: () => {
            return "No description provided"
        }
    },
    checkList: {
        type: [CheckpointSchema]
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    dueDate: {
        type: Date,
        set: (v: string) => new Date(v),
    }
})

type TaskSchemaType = InferSchemaType<typeof TaskSchema>;
export type TaskDoc = HydratedDocument<TaskSchemaType>;

export type CheckPointDoc = InferSchemaType<typeof CheckpointSchema>;

export const Task =
    (mongoose.models.Task as mongoose.Model<TaskSchemaType>) ??
    mongoose.model<TaskSchemaType>('Task', TaskSchema);

