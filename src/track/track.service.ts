import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, ObjectId, Types } from 'mongoose'
import { FileService, FileType } from './../file/file.service'
import { CreateCommentDto } from './dto/create-comment.dto'
import { CreateTrackDto } from './dto/create-track.dto'
import { Comment, CommentDocument } from './schemas/comment.schema'
import { Track, TrackDocument } from './schemas/track.schema'

@Injectable()
export class TrackService {
  constructor(
    @InjectModel(Track.name) private trackModul: Model<TrackDocument>,
    @InjectModel(Comment.name) private commentModule: Model<CommentDocument>,
    private fileService: FileService
  ) {}
  async getAll(count = <number>10, offset = <number>0): Promise<Track[]> {
    const tracks = await this.trackModul.find().skip(offset).limit(count)
    return tracks
  }
  async getOne(id: ObjectId): Promise<Track> {
    const track = (await this.trackModul.findById(id)).populate('comments')
    return track
  }
  async create(dto: CreateTrackDto, picture: any, audio: any): Promise<Track> {
    const audioPath = this.fileService.createFile(FileType.AUDIO, audio)
    const picturePath = this.fileService.createFile(FileType.IMAGE, picture)
    const track = await this.trackModul.create({ ...dto, listens: 0, audio: audioPath, picture: picturePath })
    return track
  }
  async delete(id: ObjectId): Promise<Types.ObjectId> {
    const track = await this.trackModul.findByIdAndDelete(id)
    return track._id
  }
  async addComment(dto: CreateCommentDto): Promise<Comment> {
    const track = await this.trackModul.findById(dto.trackId)
    const comment = await this.commentModule.create({ ...dto })
    track.comments.push(comment)
    await track.save()
    return comment
  }
  async listen(id: ObjectId): Promise<void> {
    const track = await this.trackModul.findById(id)
    track.listens += 1
    track.save()
  }
  async search(query: string): Promise<Track[]> {
    const tracks = await this.trackModul.find({
      name: { $regex: new RegExp(query, 'i') },
    })
    return tracks
  }
}
