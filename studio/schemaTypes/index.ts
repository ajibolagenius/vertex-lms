import {type SchemaTypeDefinition} from 'sanity'

import {category} from './documents/category'
import {collection} from './documents/collection'
import {course} from './documents/course'
import {instructor} from './documents/instructor'
import {lesson} from './documents/lesson'
import {progress} from './documents/progress'
import {quiz} from './documents/quiz'
import {video} from './documents/video'
import {blockContent} from './objects/block-content'
import {courseModule} from './objects/course-module'
import {learningOutcome} from './objects/learning-outcome'
import {lessonResource} from './objects/lesson-resource'
import {quizQuestion} from './objects/quiz-question'

export const schema: {types: SchemaTypeDefinition[]} = {
  types: [
    course,
    lesson,
    instructor,
    category,
    video,
    quiz,
    collection,
    progress,
    courseModule,
    learningOutcome,
    lessonResource,
    quizQuestion,
    blockContent,
  ],
}
