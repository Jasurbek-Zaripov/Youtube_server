import { join } from 'path'
import { readFile, unlink, writeFile } from 'fs/promises'
import jwt from 'jsonwebtoken'
import bcr from 'bcrypt'

class Module {
  constructor() {
    this.path_db = join(process.cwd(), 'src', 'DB', 'userdata.json')
    this.path_video = join(process.cwd(), 'src', 'res', 'video')
    this.path_img = join(process.cwd(), 'src', 'res', 'img')
  }

  //for id
  regen_fun() {
    return BigInt(
      new Date().toJSON().replace(/[^\d]/g, parseInt(Math.random() * 1000000))
    ).toString(36)
  }

  async getSalt(pass) {
    let solt = await bcr.genSalt()
    let passHash = await bcr.hash(pass, solt)
    return passHash
  }

  /**
   *
   * @param {{info file}} file
   * @param {{req body}} body
   */
  async write_img(file, body, userAgent) {
    try {
      let db = await this.read_db()
      let id = this.regen_fun()
      let originName =
        (Date.now() % 1000) + file['originalname'].replace(/\s/g, '_')

      for (const use in db) {
        if (Object.hasOwnProperty.call(db, use)) {
          const obj = db[use]
          if (obj['username'] == body['register_name']) {
            return { ERROR: 'User mavjud!' }
          }
        }
      }

      db[id] = {
        username: body['register_name'],
        parol: await this.getSalt(body['register_pass']),
        userAgent,
        avatar: '/img/' + originName,
        videos: {},
      }

      await writeFile(this.path_db, JSON.stringify(db, null, 2))
      await writeFile(join(this.path_img, originName), file['buffer'])

      let token = jwt.sign({ id }, 'JUDA_MAXFIY', { expiresIn: '1h' })

      return { token, url: '/img/' + originName }
    } catch (xato) {
      return { ERROR: xato.message }
    }
  }

  //get data in database
  async read_db() {
    try {
      let db = await readFile(this.path_db, 'utf-8')
      db = JSON.parse(db || '{}')
      return db
    } catch (xato) {
      return { ERROR: xato.message }
    }
  }

  async validate_login(username, parol) {
    try {
      let db = await this.read_db()

      for (const id in db) {
        if (Object.hasOwnProperty.call(db, id)) {
          const obj = db[id]
          let unHash = await bcr.compare(parol, obj['parol'])
          if (obj['username'] == username && unHash) {
            let token = jwt.sign({ id }, 'JUDA_MAXFIY', { expiresIn: '1h' })
            return { token, url: obj['avatar'] }
          }
        }
      }

      return { ERROR: 'login yoki parol xato!' }
    } catch (xato) {
      return { ERROR: xato.message }
    }
  }

  async validate_token(token, userAgent) {
    try {
      let { id } = jwt.verify(token, 'JUDA_MAXFIY')
      let db = await this.read_db()

      if (!id || !db[id]) {
        return { ERROR: 'user topilmadi!' }
      }
      if (db[id]['userAgent'] != userAgent) {
        return { ERROR: 'Browser mos kelmayapdi!' }
      }
      return { usr: db[id], id }
    } catch (xato) {
      return { ERROR: xato.message }
    }
  }

  async write_video(userid, file, title) {
    try {
      let db = await this.read_db()
      let id = this.regen_fun()
      let videoName =
        (Date.now() % 1000) + file['originalname'].replace(/\s/g, '_')

      if (!db[userid]) {
        return { ERROR: 'user topilmadi!' }
      }

      db[userid]['videos'][id] = {
        title,
        time: new Date()
          .toJSON()
          .replace(/\-/g, '/')
          .replace(/T/g, ' | ')
          .replace(/\.[0-9a-z]+/gi, ''),
        type: file.mimetype,
        path: '/video/' + videoName,
        size: parseInt(file['size'] / 1024 / 1024),
      }

      await writeFile(this.path_db, JSON.stringify(db, null, 2))

      await writeFile(join(this.path_video, videoName), file['buffer'])

      return { message: 'ok!' }
    } catch (xato) {
      return { ERROR: xato.message }
    }
  }

  async change_title(userId, newTitle, videoId) {
    try {
      let db = await this.read_db()

      if (!db[userId]) {
        throw new Error('user topilmadi!')
      }
      if (!db[userId]['videos'][videoId]) {
        throw new Error('video topilmadi!')
      }
      db[userId]['videos'][videoId]['title'] = newTitle

      await writeFile(this.path_db, JSON.stringify(db, null, 2))

      return { message: 'ok!' }
    } catch (xato) {
      return { ERROR: xato.message }
    }
  }

  async delete_video(userId, videoId) {
    try {
      let db = await this.read_db()
      if (!db[userId]) {
        throw new Error('user topilmadi!')
      }
      if (!db[userId]['videos'][videoId]) {
        throw new Error('video topilmadi!')
      }
      let resolt = await unlink(
        join(
          this.path_video,
          db[userId]['videos'][videoId]['path'].replace(/(\/video)/, '')
        )
      )
      delete db[userId]['videos'][videoId]

      await writeFile(this.path_db, JSON.stringify(db, null, 2))
      return { message: resolt }
    } catch (xato) {
      return { ERROR: xato['message'] }
    }
  }
}

export default new Module()
