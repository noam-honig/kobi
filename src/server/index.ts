import express from 'express'
import sslRedirect from 'heroku-ssl-redirect'
import helmet from 'helmet'
import compression from 'compression'
import { api } from './api'
import session from 'cookie-session'
import path from 'path'
import fs from 'fs'
import { repo } from 'remult'
import { Event } from '../app/home/events'
import { getFromS3 } from './play-with-s3'

async function startup() {
  const app = express()
  app.use(sslRedirect())
  app.use(
    '/api',
    session({
      secret:
        process.env['NODE_ENV'] === 'production'
          ? process.env['SESSION_SECRET']
          : 'my secret',
      maxAge: 365 * 24 * 60 * 60 * 1000,
    })
  )
  app.use(compression())
  //  app.use(helmet({ contentSecurityPolicy: false }))

  app.use(api)

  app.get('/api/images/:id', api.withRemult, async (req, res) => {
    try {
      const e = await repo(Event).findId(
        //@ts-ignore
        req.params.id
      )
      if (!e || !e.hasS3Image) {
        res.status(404).send('not found')
        return
      }
      const r = await getFromS3(e.id)
      console.log(r.ContentType)
      res.contentType(r.ContentType!)
      res.send(await r.getBuffer())
    } catch (err: any) {
      console.log({ url: req.url, err })
      res.status(500).json(err)
    }
  })

  let dist = path.resolve('dist/angular-starter-project')
  if (!fs.existsSync(dist)) {
    dist = path.resolve('../angular-starter-project')
  }
  app.use(express.static(dist))
  app.use('/*', async (req, res) => {
    if (req.headers.accept?.includes('json')) {
      console.log(req)
      res.status(404).json('missing route: ' + req.originalUrl)
      return
    }
    try {
      res.sendFile(dist + '/index.html')
    } catch (err) {
      res.sendStatus(500)
    }
  })
  let port = process.env['PORT'] || 3002
  app.listen(port)
}
startup()
