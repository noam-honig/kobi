import { Allow, BackendMethod, Entity, EntityBase, Fields, repo } from 'remult'
import { base64ToS3 } from '../../server/play-with-s3'
import { RowButton } from '../common-ui-elements/interfaces'
import { button } from '../common/UITools'
import { Roles } from '../users/roles'

export const daysValueList = Array.from(Array(31).keys()).map((x) => ({
  id: x + 1 + '',
  caption: x + 1,
}))
@Entity('events', {
  allowApiCrud: Allow.authenticated,
  allowApiRead: true,
  defaultOrderBy: {
    month: 'asc',
    day: 'asc',
    year: 'desc',
    orderInDay: 'asc',
  },
})
export class Event extends EntityBase {
  @Fields.cuid()
  id = ''
  @Fields.number({
    caption: 'חודש',
    width: '80px',
    valueList: Array.from(Array(12).keys()).map((x) => ({
      id: x + 1 + '',
      caption: x + 1,
    })),
  })
  month = new Date().getMonth() + 1
  @Fields.number({
    caption: 'יום',
    width: '80px',
    valueList: daysValueList,
  })
  day = new Date().getDate()
  @Fields.number({ caption: 'שנה' })
  year = new Date().getFullYear()
  @Fields.integer({ caption: 'סדר בתוך היום' })
  orderInDay = 0

  @Fields.string({
    customInput: (x) => x.textarea(),
    caption: 'כותרת',
  })
  title = ''
  @Fields.string({
    customInput: (x) => x.textarea(),
    caption: 'תאור',
  })
  description = ''
  @Fields.string({
    caption: 'קישור לתמונה',
  })
  imageUrl = ''
  @Fields.string({
    caption: 'מקור 1',
  })
  source1 = ''
  @Fields.string({
    caption: 'מקור 2',
  })
  source2 = ''
  @Fields.string({
    caption: 'מקור 3',
  })
  source3 = ''
  @Fields.string({
    caption: 'מקור 4',
  })
  source4 = ''
  @Fields.string({
    caption: 'מקור 5',
  })
  source5 = ''

  @Fields.createdAt()
  createdAt = new Date()
  @Fields.updatedAt()
  updatedAt = new Date()
  @Fields.boolean()
  hasS3Image = false

  @BackendMethod({ allowed: Roles.admin })
  static async uploadImage(id: string, image: string) {
    var e = await repo(Event).findId(id)
    console.log(image.length)
    await base64ToS3(id, image)
    e.hasS3Image = true
    await e.save()
    return 'ok'
  }

  message() {
    return '*' + this.year + '* - ' + this.title + '\n'
  }

  aiTextWithoutDate() {
    return `ספר לי עוד על:  ${this.title} ${this.description}`
  }
  gptButtons: button[] = [
    {
      click: (e) =>
        window.open('https://chat.openai.com/?q=' + this.aiTextWithoutDate()),
      text: 'gpt',
    },
    {
      click: (e) =>
        window.open('https://www.perplexity.ai/?q=' + this.aiTextWithoutDate()),
      text: 'perplexity',
    },
  ]
}
