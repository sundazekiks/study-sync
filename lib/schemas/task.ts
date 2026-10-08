import mongoose, { HydratedDocument, InferSchemaType } from "mongoose";


const CheckpointSchema = new mongoose.Schema({
    title: String,
    description: String,
    complete: Boolean
}, { _id: false })


const AttachmentSchema = new mongoose.Schema({
    fileId: String,
    name: String,
    mimeType: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
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
    attachments: {
        type: [AttachmentSchema],
        default: []
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

export type AttachmentDoc = InferSchemaType<typeof AttachmentSchema>;

export const Task =
    (mongoose.models.Task as mongoose.Model<TaskSchemaType>) ??
    mongoose.model<TaskSchemaType>('Task', TaskSchema);

