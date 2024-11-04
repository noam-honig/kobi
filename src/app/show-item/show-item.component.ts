import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core'
import { Event } from '../home/events'
import { remult } from 'remult'
import { UIToolsService } from '../common/UIToolsService'
import { sendWhatsappToPhone, whatsappUrl } from '../common/fields/PhoneField'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'

@Component({
  selector: 'app-show-item',
  templateUrl: './show-item.component.html',
  styleUrls: ['./show-item.component.scss'],
})
export class ShowItemComponent implements OnInit {
  shouldShowReadMore = false
  constructor(private ui: UIToolsService, private sanitizer: DomSanitizer) {}
  @Input() event!: Event
  showFullText: boolean = false
  @Input() showFullDate = false
  @Input() search = 'ש'
  @Output() change = new EventEmitter<void>()

  @ViewChild('textContent') textContent!: ElementRef

  ngAfterViewInit() {
    setTimeout(() => this.checkContentHeight())
  }

  maxHeight = 100
  scrollHeight = 0
  transform(text: string): SafeHtml {
    let search = this.search
    if (!search || !text) {
      return text
    }
    const pattern = search
      .replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
      .split(' ')
      .filter((t) => t.length > 0)
      .join('|')
    const regex = new RegExp(pattern, 'gi')

    const result = text.replace(
      regex,
      (match) => `<span class="highlight">${match}</span>`
    )
    return this.sanitizer.bypassSecurityTrustHtml(result)
  }

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
    sendWhatsappToPhone('', '*' + this.event.message())
  }
  aiSearchText() {
    return encodeURI(
      `ספר לי עוד על: ${this.event.day}/${this.event.month}/${this.event.year} - ${this.event.title} ${this.event.description}`
    )
  }
  sources() {
    return [
      this.event.source1,
      this.event.source2,
      this.event.source3,
      this.event.source4,
      this.event.source5,
    ].filter((x) => x)
  }
  ngOnInit(): void {}
  remult = remult
  async edit() {
    let e = this.event
    await this.ui.areaDialog({
      width: '85vw',
      title: 'עדכון אירוע',
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
      buttons: [
        {
          text: 'מחק',
          click: async (close) => {
            if (await this.ui.yesNoQuestion('בטוח שאתה רוצה למחוק???')) {
              await e.delete()
              this.change.next()
              close()
            }
          },
        },
      ],
      ok: async () => {
        await e.save()
        this.change.next()
      },
      cancel: async () => {
        await e._.undoChanges()
      },
    })
  }
}
