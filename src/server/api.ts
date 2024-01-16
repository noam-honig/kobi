import { remultExpress } from 'remult/remult-express'
import { createPostgresConnection } from 'remult/postgres'
import { User } from '../app/users/user'
import { SignInController } from '../app/users/SignInController'
import { UpdatePasswordController } from '../app/users/UpdatePasswordController'
import { initRequest } from './server-session'
import { config } from 'dotenv'
import { Event } from '../app/home/events'
import xlsx from 'xlsx'

import { repo } from 'remult'
config() //loads the configuration from the .env file

export const api = remultExpress({
  entities: [User, Event],
  controllers: [SignInController, UpdatePasswordController],
  initRequest,
  dataProvider: async () => {
    if (process.env['DATABASE_URL']) return createPostgresConnection()
    return undefined
  },
  initApi: async () => {
    return
    const workbook = xlsx.readFile('tmp/kobi update.xlsx')
    const sheetNames = workbook.SheetNames

    let month = 0
    for (const sheetName of sheetNames) {
      month++
      const worksheet = workbook.Sheets[sheetName]
      const jsonData: any[][] = xlsx.utils.sheet_to_json(worksheet, {
        header: 1,
      })
      let day = 0
      let year = 0
      let title = ''
      let description = ''
      var gotToDay = false
      async function insertIt() {
        console.log({ day, year, month, title, description })
        await repo(Event).insert({
          day,
          year,
          month,
          title,
          description,
        })
      }
      for (const row of jsonData) {
        if (!gotToDay) {
          if (row[0] === 'יום') gotToDay = true
          continue
        }
        if (row[0]) day = row[0]
        if (row[1]) {
          if (year) await insertIt()
          year = row[1]
          title = ''
          description = ''
        }
        if (row[2]) {
          if (title) title += '\n'
          title = row[2]
        }
        if (row[3]) {
          if (description) description += '\n'
          description = row[3]
        }
      }
      insertIt()
    }
  },
})
