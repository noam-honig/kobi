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
import { openDialog } from '../common-ui-elements'
import { UploadImageComponent } from './upload-image.component'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'

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
  imageUrl() {
    if (this.event.imageUrl) return this.event.imageUrl
    if (this.event.hasS3Image)
      return (
        '/api/images/' +
        this.event.id +
        '?x=' +
        this.event.updatedAt.toISOString()
      )
    return undefined
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

  toggleText(e: { preventDefault: () => void; target: any }) {
    if (e.target?.nodeName === 'IMG') return
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
      menuButtons: [
        ...e.gptButtons.map((y) => ({
          name: y.text,
          click: () => y.click(() => {}),
        })),
        {
          name: 'העלה תמונה',
          click: async () => {
            this.uploadImage()
          },
        },
        {
          visible: () => e.hasS3Image,
          name: 'מחק תמונה',
          click: async () => {
            if (
              await this.ui.yesNoQuestion('בטוח שאתה רוצה למחוק את התמונה???')
            ) {
              e.imageUrl = ''
              e.hasS3Image = false
              await e.save()
              this.change.next()
            }
          },
        },
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
  uploadImage() {
    openDialog(
      UploadImageComponent,
      (x) =>
        (x.args = {
          afterUpload: async (image: string, fileName: string) => {
            await Event.uploadImage(this.event.id, image)
          },
        })
    )
  }
  get recencyType(): 'created' | 'updated' | undefined {
    const now = new Date()
    const createdDiff =
      (now.getTime() - new Date(this.event.createdAt).getTime()) /
      (1000 * 60 * 60 * 24)
    const updatedDiff =
      (now.getTime() - new Date(this.event.updatedAt).getTime()) /
      (1000 * 60 * 60 * 24)
    if (createdDiff < 3000) return 'created'
    if (updatedDiff < 3000) return 'updated'
    return undefined
  }
  get recencyTooltip(): string {
    if (!this.event.createdAt && !this.event.updatedAt) return ''
    let created = ''
    let updated = ''
    if (this.event.createdAt) {
      created = formatDistanceToNow(new Date(this.event.createdAt), {
        addSuffix: true,
        locale: he,
      })
    }
    if (this.event.updatedAt) {
      updated = formatDistanceToNow(new Date(this.event.updatedAt), {
        addSuffix: true,
        locale: he,
      })
    }
    let result = ''
    if (updated) result += `עודכן: ${updated}`
    if (created) result += (result ? '\n' : '') + `נוסף: ${created}`
    return result
  }
  showRecencyInfo() {
    alert(this.recencyTooltip)
  }
}
