import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { repo } from 'remult'
import { Event } from '../home/events'

@Component({
  selector: 'app-one-day',
  templateUrl: './one-day.component.html',
  styleUrls: ['./one-day.component.scss'],
})
export class OneDayComponent implements OnInit {
  constructor(private activeRoute: ActivatedRoute, private router: Router) {}
  events: Event[] = []
  month: string = ''
  day: string = ''
  async ngOnInit() {
    this.activeRoute.params.subscribe(async (params) => {
      let month = params['month']
      let day = params['day']
      const today = new Date()
      let shouldRedirect = false
      if (!month) {
        month = (today.getMonth() + 1).toString()
        shouldRedirect = true
      }
      if (!day) {
        day = today.getDate().toString()
        shouldRedirect = true
      }
      if (shouldRedirect) {
        this.router.navigate(['/o', month, day], { replaceUrl: true })
        return
      }
      this.month = month
      this.day = day
      this.events = await repo(Event).find({
        where: { month, day },
        orderBy: {
          year: 'desc',
          month: 'desc',
          day: 'desc',
          orderInDay: 'asc',
        },
      })
    })
  }
  imageUrl(event: Event) {
    if (event.imageUrl) return event.imageUrl
    if (event.hasS3Image)
      return '/api/images/' + event.id + '?x=' + event.updatedAt.toISOString()
    return undefined
  }
  scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}
