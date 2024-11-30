import { Component, OnInit } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'

import { Remult } from 'remult'

@Component({
  selector: 'app-home',
  template: `<input
    #fileInput
    type="file"
    (input)="onFileInput($event)"
    accept="image/*"
  /> `,
})
export class UploadImageComponent implements OnInit {
  constructor(
    private remult: Remult,

    private matDialog: MatDialogRef<any>
  ) {}
  args!: {
    afterUpload: (image: string, fileName: string) => void
  }

  async onFileInput(eventArgs: any) {
    for (const file of eventArgs.target.files) {
      let f: File = file
      await new Promise((res) => {
        var fileReader = new FileReader()

        fileReader.onload = async (e: any) => {
          var img = new Image()

          var canvas = document.createElement('canvas')
          // if (false) {
          //     img.onload = async () => {
          //         var ctx = canvas.getContext("2d");
          //         ctx.drawImage(img, 0, 0);

          //         var MAX_WIDTH = 300;
          //         var MAX_HEIGHT = 500;
          //         var width = img.width;
          //         var height = img.height;

          //         if (width > height) {
          //             if (width > MAX_WIDTH) {
          //                 height *= MAX_WIDTH / width;
          //                 width = MAX_WIDTH;
          //             }
          //         } else {
          //             if (height > MAX_HEIGHT) {
          //                 width *= MAX_HEIGHT / height;
          //                 height = MAX_HEIGHT;
          //             }
          //         }
          //         canvas.width = width;
          //         canvas.height = height;
          //         var ctx = canvas.getContext("2d");
          //         ctx.drawImage(img, 0, 0, width, height);

          //         var dataurl = canvas.toDataURL("image/png");

          //         this.args.afterUpload(dataurl, f.name);
          //         this.matDialog.close();
          //     }
          //     img.src = e.target.result.toString();
          // }
          this.args.afterUpload(e.target.result.toString(), f.name)
          this.matDialog.close()
        }
        fileReader.readAsDataURL(f)
      })
      return //to import the first file only
    }
  }

  ngOnInit() {}
}
