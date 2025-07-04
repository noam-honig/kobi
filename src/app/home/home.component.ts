import { Component, OnInit } from '@angular/core'
import {
  EntityOrderBy,
  Fields,
  FieldsRef,
  getFields,
  remult,
  repo,
} from 'remult'
import {
  DataAreaFieldsSetting,
  DataAreaSettings,
  DataControlInfo,
  RowButton,
} from '../common-ui-elements/interfaces'
import { fromLiveQuery } from '../common/from-live-query'
import { Events } from 'pg'
import { UIToolsService } from '../common/UIToolsService'
import { Event, daysValueList } from './events'
import { Observable, Subject, startWith, switchMap } from 'rxjs'
import { start } from 'repl'
import { BusyService } from '../common-ui-elements'
import { sendWhatsappToPhone } from '../common/fields/PhoneField'

let i = 0
const sortOptions: {
  title: string
  orderBy?: EntityOrderBy<Event>
  normal?: boolean
}[] = [
  {
    title: 'עדכונים אחרונים',
    orderBy: {
      updatedAt: 'desc',
    },
  },
  {
    title: 'אירועים אחרונים',
    orderBy: {
      year: 'desc',
      month: 'desc',
      day: 'desc',
      orderInDay: 'asc',
    },
  },
  {
    title: '',
    normal: true,
  },
]
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  constructor(private ui: UIToolsService, private busy: BusyService) {}

  search = repo(Event).create()
  searchString = new Search()
  sort = sortOptions.find((x) => x.normal)!
  buttons: RowButton<any>[] = sortOptions
    .filter((x) => !x.normal)
    .map((x) => ({
      name: x.title,
      click: () => {
        this.sort = x
        this.load()
      },
    }))

  shouldShowTodayButton() {
    const today = repo(Event).create()
    return (
      this.search.month != today.month ||
      this.search.day != today.day ||
      this.searchString.search.length > 0
    )
  }
  shouldShowWhatsappAll() {
    return (
      this.events.length > 0 &&
      this.searchString.search.length == 0 &&
      this.search.day != 0
    )
  }
  today() {
    const today = repo(Event).create()
    this.search.month = today.month
    this.search.day = today.day
    this.searchString.search = ''
    this.load()
  }
  whatsappAll() {
    const url = `${window.location.origin}/o/${this.search.month}/${this.search.day}`
    sendWhatsappToPhone(
      '',
      `אירועים ב *${this.search.day.toString()}/${
        this.search.month
      }* לפי שנים:\n` +
        this.events.map((x) => x.message()).join('\n\n') +
        `\n\nקראו עוד ב:\n${url}`
    )
  }

  events: Event[] = []
  loading = false
  showFullDate = false
  limit = 100

  async load() {
    let searchId = ++i
    this.loading = true
    let search = this.searchString.search
    let day = this.search.day
    try {
      const items = await repo(Event).find({
        limit: this.limit,
        orderBy: this.sort.orderBy,
        where: search.trim()
          ? {
              $and: search
                .split(' ')
                .map((x) => x.trim())
                .map((x) => x)
                .map((term) => ({
                  $or: [
                    {
                      title: { $contains: term },
                    },
                    { description: { $contains: term } },
                  ],
                })),
            }
          : this.sort.normal
          ? {
              month: this.search.month,
              day: day != 0 ? day : undefined,
            }
          : {},
      })

      if (searchId == i) {
        this.events = items
        this.showFullDate = search.length > 0 || day == 0 || !this.sort.normal
      }
    } finally {
      if (searchId == i) {
        this.loading = false
      }
    }
  }

  area = new DataAreaSettings({
    fields: () => {
      const s = this.search
      return [
        [
          {
            valueChange: () => {
              this.sort = sortOptions.find((x) => x.normal)!
              this.load()
            },
            field: s.$.month,
          },
          {
            valueChange: () => {
              this.sort = sortOptions.find((x) => x.normal)!
              this.load()
            },
            field: s.$.day,
            valueList: [{ id: 0, caption: 'כל החודש' }, ...daysValueList],
          },
          {
            field: getFields(this.searchString).search,
            valueChange: () => this.load(),
            click: () => {
              this.searchString.search = ''
              this.load()
            },
            clickIcon: 'clear',
          },
        ],
      ]
    },
  })

  async addEvent() {
    const e = repo(Event).create()

    e.month = this.search.month
    e.day = this.search.day

    await this.ui.areaDialog({
      width: '85vw',
      title: 'הוספת אירוע',
      fields: [
        [e.$.month, e.$.day, e.$.year, e.$.orderInDay],
        e.$.title,
        e.$.description,
        e.$.imageUrl,
        e.$.source1,
        e.$.source2,
        e.$.source3,
        e.$.source4,
        e.$.source5,
      ],
      buttons: e.gptButtons,
      ok: async () => {
        await e.save()
        this.load()
        this.ui.refreshTotal()
      },
    })
  }

  ngOnInit() {
    this.load()
  }
  allowed() {
    return remult.authenticated()
  }
}
class Search {
  @Fields.string({ caption: 'חיפוש' })
  search = ''
}

//[V] - change name to היום לפני
//[V] - hide sidebar when not needed
//[V] - make selection easier
//[V] - export to excel
//[V] - free text search
//[V] - only kobi and noam can add
//[V] - click on text will allow edit
//[V] - keep enters in text
//[V] - don't show id in dialog
//[V] - display items better (with .... and more)
//[v] - the default for a new should be the selected values
//[ ] - import existing data
//[ ] - display search text better with bold
//[ ] - allow url with date
