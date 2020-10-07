import {forwardRef, Module} from '@nestjs/common';
import {TasksService} from './tasks.service';
import {EpisodesModule} from "../modules/episodes/episodes.module";

@Module({
    imports: [forwardRef(() => EpisodesModule)],
    providers: [TasksService],
})
export class TasksModule {
}
