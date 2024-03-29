import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core'
import { Event } from '../home/events'
import { remult } from 'remult'
import { UIToolsService } from '../common/UIToolsService'
import { sendWhatsappToPhone, whatsappUrl } from '../common/fields/PhoneField'

@Component({
  selector: 'app-show-item',
  templateUrl: './show-item.component.html',
  styleUrls: ['./show-item.component.scss'],
})
export class ShowItemComponent implements OnInit {
  shouldShowReadMore = false
  constructor(private ui: UIToolsService) {}
  @Input() event!: Event
  showFullText: boolean = false
  @Input() showFullDate = false

  @ViewChild('textContent') textContent!: ElementRef

  ngAfterViewInit() {
    setTimeout(() => this.checkContentHeight())
  }

  maxHeight = 100
  scrollHeight = 0

  checkContentHeight() {
    const maxHeight = 100 // Same as in CSS
    if (this.textContent?.nativeElement.scrollHeight != this.scrollHeight) {
      this.scrollHeight = this.textContent?.nativeElement.scrollHeight
    }
    if (this.scrollHeight > maxHeight) {
      this.shouldShowReadMore = true
    }
  }

  toggleText(e: { preventDefault: () => void }) {
    e.preventDefault()
    this.checkContentHeight()
    if (this.showFullText || this.shouldShowReadMore)
      this.showFullText = !this.showFullText
  }
  whatsapp() {
    sendWhatsappToPhone(
      '',
      this.event.year + ' - ' + this.event.title + '\n' + this.event.description
    )
  }
  ngOnInit(): void {}
  remult = remult
  async edit() {
    let e = this.event
    await this.ui.areaDialog({
      width: '85vw',
      title: 'עדכון אירוע',
      fields: [[e.$.month, e.$.day, e.$.year], e.$.title, e.$.description],
      buttons: [
        {
          text: 'מחק',
          click: async (close) => {
            if (await this.ui.yesNoQuestion('בטוח שאתה רוצה למחוק???')) {
              await e.delete()
              close()
            }
          },
        },
      ],
      ok: async () => {
        await e.save()
      },
      cancel: async () => {
        await e._.undoChanges()
      },
    })
  }
}
