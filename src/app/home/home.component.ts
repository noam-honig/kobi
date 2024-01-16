import { Component, OnInit } from '@angular/core'
import { Fields, FieldsRef, getFields, remult, repo } from 'remult'
import {
  DataAreaFieldsSetting,
  DataAreaSettings,
  DataControlInfo,
} from '../common-ui-elements/interfaces'
import { fromLiveQuery } from '../common/from-live-query'
import { Events } from 'pg'
import { UIToolsService } from '../common/UIToolsService'
import { Event } from './events'
import { Observable, Subject, startWith, switchMap } from 'rxjs'
import { start } from 'repl'

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  constructor(private ui: UIToolsService) {}
  search = repo(Event).create()
  searchString = new Search()

  change = new Subject()
  events$ = this.change.pipe(
    startWith({}),
    switchMap(() =>
      fromLiveQuery(
        repo(Event).liveQuery({
          where: this.searchString.search.trim()
            ? {
                $and: this.searchString.search
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
            : {
                month: this.search.month,
                day: this.search.day,
              },
        })
      )
    )
  )
  area = new DataAreaSettings({
    fields: () => {
      const s = this.search
      return [
        [s.$.month, s.$.day, getFields(this.searchString).search].map((f) => ({
          field: f,
          valueChange: () => this.change.next({}),
        })),
      ]
    },
  })
  last?: Event
  async addEvent() {
    const e = repo(Event).create()
    if (this.last) {
      e.month = this.last.month
      e.day = this.last.day
      e.year = this.last.year
    }
    await this.ui.areaDialog({
      width: '85vw',
      title: 'הוספת אירוע',
      fields: [[e.$.month, e.$.day, e.$.year], e.$.title, e.$.description],
      ok: async () => {
        this.last = await e.save()
      },
    })
  }

  ngOnInit() {}
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
//[ ] - the default for a new should be the selected values
//[V] - only kobi and noam can add
//[V] - click on text will allow edit
//[V] - keep enters in text
//[V] - don't show id in dialog
//[ ] - import existing data
//[ ] - display items better (with .... and more)
//[ ] - display search text better with bold
//[ ] - february
//[ ] - allow url with date
