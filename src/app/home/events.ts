import { Allow, Entity, EntityBase, Fields } from 'remult'

@Entity('events', {
  allowApiCrud: Allow.authenticated,
  allowApiRead: true,
  defaultOrderBy: {
    month: 'asc',
    day: 'asc',
    year: 'asc',
  },
})
export class Event extends EntityBase {
  @Fields.cuid()
  id = ''
  @Fields.number({ caption: 'חודש' })
  month = new Date().getMonth() + 1
  @Fields.number({ caption: 'יום' })
  day = new Date().getDate()
  @Fields.number({ caption: 'שנה' })
  year = new Date().getFullYear()
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
}
